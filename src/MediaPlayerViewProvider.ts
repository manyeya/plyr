import * as vscode from "vscode";
import * as os from "os";
import { parseMediaMetadata } from "./utils";
import { ErrorSoundManager } from "./ErrorSoundManager";

export interface PlayerStatus {
    playing: boolean;
    trackName?: string;
}

type StatusCallback = (status: PlayerStatus) => void;

/**
 * WebviewViewProvider — renders the media player in the VS Code sidebar.
 * Registered once at activation; VS Code calls resolveWebviewView() the first
 * time the view becomes visible (and never again if retainContextWhenHidden is true).
 */
export class MediaPlayerViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "player.sidebar";

    /** Exposed so the extension can post messages to the sidebar from commands. */
    public static current: MediaPlayerViewProvider | undefined;

    private static statusCallbacks: StatusCallback[] = [];

    private _view?: vscode.WebviewView;
    private readonly _context: vscode.ExtensionContext;
    private _errorSoundManager?: ErrorSoundManager;

    constructor(context: vscode.ExtensionContext, errorSoundManager?: ErrorSoundManager) {
        this._context = context;
        this._errorSoundManager = errorSoundManager;
        MediaPlayerViewProvider.current = this;
    }

    public static onStatusUpdate(cb: StatusCallback): void {
        MediaPlayerViewProvider.statusCallbacks.push(cb);
    }

    /**
     * Called by ErrorSoundManager — resolves the correct sound URI and
     * sends a playErrorSound message to the sidebar webview.
     * No new tabs or panels are created.
     */
    public triggerErrorSound(): void {
        if (!this._view) return;

        const wasPlaying = this._context.globalState.get<boolean>("player.playing", false);

        // Resolve the sound URI: custom file takes priority over the default
        const customPath = this._context.globalState.get<string>("player.errorSoundPath");
        const soundUri = customPath
            ? vscode.Uri.file(customPath)
            : vscode.Uri.joinPath(this._context.extensionUri, "media", "faaah.mp3");

        const soundUrl = this._view.webview.asWebviewUri(soundUri).toString();
        const cfg = vscode.workspace.getConfiguration("mediaPlayer");
        const volume = cfg.get<number>("errorSound.volume", 80);

        this._view.webview.postMessage({ type: "playErrorSound", soundUrl, volume, wasPlaying });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._context.extensionUri, "out", "webview"),
                vscode.Uri.joinPath(this._context.extensionUri, "resources"),
                vscode.Uri.joinPath(this._context.extensionUri, "media"),
                vscode.Uri.file(os.homedir()),
                vscode.Uri.file("/Volumes"),
            ],
        };

        // Set HTML only once; retainContextWhenHidden (set in package.json) keeps
        // the webview alive, so this function won't run again.
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async (message: { type: string;[key: string]: unknown }) => {
                switch (message.type) {
                    case "statusUpdate":
                        this._context.globalState.update("player.playing", message.playing);
                        MediaPlayerViewProvider.statusCallbacks.forEach((cb) =>
                            cb({
                                playing: message.playing as boolean,
                                trackName: message.trackName as string | undefined,
                            })
                        );
                        break;

                    case "requestConfig": {
                        const config = vscode.workspace.getConfiguration("mediaPlayer");
                        const customPath = this._context.globalState.get<string>("player.errorSoundPath");
                        const cooldown = this._context.globalState.get<number>("player.errorSoundCooldown", 5000);
                        const deduplication = this._context.globalState.get<boolean>("player.errorSoundDeduplication", true);
                        // Send current custom sound filename (if any) along with config
                        const customSoundName = customPath
                            ? customPath.split(/[\\/]/).pop() ?? customPath
                            : undefined;
                        webviewView.webview.postMessage({
                            type: "config",
                            defaultVolume: config.get<number>("defaultVolume", 80),
                            autoplay: config.get<boolean>("autoplay", false),
                            defaultSpeed: config.get<number>("defaultSpeed", 1),
                            customSoundName,
                            errorSoundCooldown: cooldown,
                            errorSoundDeduplication: deduplication,
                        });
                        break;
                    }

                    case "openFile": {
                        const uris = await vscode.window.showOpenDialog({
                            canSelectMany: true,
                            filters: {
                                "Media Files": [
                                    "mp3", "mp4", "wav", "ogg", "flac",
                                    "aac", "m4a", "webm", "mkv", "avi", "mov",
                                ],
                            },
                            openLabel: "Open Media",
                        });
                        if (!uris || uris.length === 0) break;

                        const files = await Promise.all(
                            uris.map(async (uri) => {
                                const url = webviewView.webview.asWebviewUri(uri).toString();
                                const name = uri.fsPath.split(/[/\\]/).pop() ?? uri.fsPath;
                                const metadata = await parseMediaMetadata(uri.fsPath);
                                return { url, name, ...metadata };
                            })
                        );
                        webviewView.webview.postMessage({ type: "addFiles", files });
                        break;
                    }

                    case "openErrorSoundFile": {
                        // User tapped "Browse…" in Settings to pick a custom error sound
                        const uris = await vscode.window.showOpenDialog({
                            canSelectMany: false,
                            filters: { "Audio Files": ["mp3", "wav", "ogg", "aac", "m4a", "flac"] },
                            openLabel: "Use as Error Sound",
                        });
                        if (!uris || uris.length === 0) break;

                        const uri = uris[0];
                        const fsPath = uri.fsPath;
                        await this._context.globalState.update("player.errorSoundPath", fsPath);

                        const soundUrl = webviewView.webview.asWebviewUri(uri).toString();
                        const name = fsPath.split(/[/\\]/).pop() ?? fsPath;
                        webviewView.webview.postMessage({
                            type: "errorSoundFileSet",
                            name,
                            soundUrl,
                        });
                        break;
                    }

                    case "clearErrorSoundFile": {
                        await this._context.globalState.update("player.errorSoundPath", undefined);
                        webviewView.webview.postMessage({ type: "errorSoundFileSet", name: undefined, soundUrl: undefined });
                        break;
                    }

                    case "testErrorSound": {
                        // User tapped "Test 🔊" in Settings — trigger immediately
                        this.triggerErrorSound();
                        break;
                    }

                    case "updateErrorSound": {
                        const enabled = message.enabled as boolean | undefined;
                        const cooldown = message.cooldown as number | undefined;
                        const deduplication = message.deduplication as boolean | undefined;
                        if (typeof enabled === "boolean" && this._errorSoundManager) {
                            this._errorSoundManager.setEnabled(enabled);
                        }
                        if (typeof cooldown === "number" && this._errorSoundManager) {
                            await this._context.globalState.update("player.errorSoundCooldown", cooldown);
                            this._errorSoundManager.setCooldown(cooldown);
                        }
                        if (typeof deduplication === "boolean" && this._errorSoundManager) {
                            await this._context.globalState.update("player.errorSoundDeduplication", deduplication);
                            this._errorSoundManager.setDeduplication(deduplication);
                        }
                        break;
                    }
                }
            }
        );
    }

    /** Post a message to the sidebar webview (e.g. from command palette). */
    public postMessage(message: Record<string, unknown>): void {
        this._view?.webview.postMessage(message);
    }

    /** Convert a file URI to a URI the sidebar webview can load. */
    public asWebviewUri(uri: vscode.Uri): string {
        if (!this._view) return uri.fsPath;
        return this._view.webview.asWebviewUri(uri).toString();
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._context.extensionUri,
                "out",
                "webview",
                "player.js"
            )
        );
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             media-src ${webview.cspSource} blob: data:;
             img-src ${webview.cspSource} blob: data: https:;
             script-src 'nonce-${nonce}';
             style-src 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Media Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root {
      height: 100%;
      width: 100%;
      overflow-x: hidden;
      background: transparent;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
