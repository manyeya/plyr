import * as vscode from "vscode";
import * as os from "os";

export interface PlayerStatus {
    playing: boolean;
    trackName?: string;
}

type StatusCallback = (status: PlayerStatus) => void;

const statusCallbacks: StatusCallback[] = [];

export class MediaPlayerPanel {
    public static current: MediaPlayerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(context: vscode.ExtensionContext): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (MediaPlayerPanel.current) {
            MediaPlayerPanel.current._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "mediaPlayer",
            "Media Player",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                // Allow access to extension files AND the user's entire home directory
                // so that local media files can be loaded by the webview
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, "out", "webview"),
                    vscode.Uri.joinPath(context.extensionUri, "resources"),
                    vscode.Uri.file(os.homedir()),
                    vscode.Uri.file("/Volumes"), // external drives on macOS
                ],
            }
        );

        MediaPlayerPanel.current = new MediaPlayerPanel(panel, context);
    }

    public static onStatusUpdate(cb: StatusCallback): void {
        statusCallbacks.push(cb);
    }

    /** Convert a file URI to a URI the webview can actually load */
    public asWebviewUri(uri: vscode.Uri): string {
        return this._panel.webview.asWebviewUri(uri).toString();
    }

    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext
    ) {
        this._panel = panel;
        this._context = context;

        // Set HTML only once — re-setting it on every visibility change would
        // reload the entire webview and destroy all React/player state.
        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: { type: string;[key: string]: unknown }) => {
                switch (message.type) {
                    case "statusUpdate":
                        statusCallbacks.forEach((cb) =>
                            cb({
                                playing: message.playing as boolean,
                                trackName: message.trackName as string | undefined,
                            })
                        );
                        break;

                    case "requestConfig": {
                        const config = vscode.workspace.getConfiguration("mediaPlayer");
                        this._panel.webview.postMessage({
                            type: "config",
                            defaultVolume: config.get<number>("defaultVolume", 80),
                            autoplay: config.get<boolean>("autoplay", false),
                            defaultSpeed: config.get<number>("defaultSpeed", 1),
                        });
                        break;
                    }

                    // Webview UI's "Open File" button posts this message
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

                        const files = uris.map((uri) => ({
                            // Use asWebviewUri so the webview can load the file
                            url: this._panel.webview.asWebviewUri(uri).toString(),
                            name: uri.fsPath.split(/[\\/]/).pop() ?? uri.fsPath,
                        }));
                        this._panel.webview.postMessage({ type: "addFiles", files });
                        break;
                    }
                }
            },
            null,
            this._disposables
        );
    }

    public postMessage(message: Record<string, unknown>): void {
        this._panel.webview.postMessage(message);
    }

    private _update(): void {
        this._panel.title = "Media Player";
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._context.extensionUri, "out", "webview", "player.js")
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
    html, body, #root { height: 100%; width: 100%; overflow: hidden; background: #0d0d12; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose(): void {
        MediaPlayerPanel.current = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            d?.dispose();
        }
        statusCallbacks.forEach((cb) => cb({ playing: false }));
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
