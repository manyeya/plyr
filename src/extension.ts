import * as vscode from "vscode";
import { MediaPlayerPanel } from "./MediaPlayerPanel";
import { MediaPlayerViewProvider } from "./MediaPlayerViewProvider";

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    // ─── Status bar ──────────────────────────────────────────────────────────
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        50
    );
    // Clicking the status bar focuses the sidebar view
    statusBarItem.command = "player.sidebar.focus";
    context.subscriptions.push(statusBarItem);

    // ─── Sidebar view provider (primary interface) ────────────────────────────
    const viewProvider = new MediaPlayerViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MediaPlayerViewProvider.viewType,
            viewProvider,
            // Keep the webview alive when the sidebar is hidden so audio keeps playing
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // ─── Commands ─────────────────────────────────────────────────────────────

    // Open full panel (optional wide view)
    const openCmd = vscode.commands.registerCommand("player.open", () => {
        MediaPlayerPanel.createOrShow(context);
    });

    // Toggle play — sends to whichever view is available
    const toggleCmd = vscode.commands.registerCommand("player.togglePlay", () => {
        viewProvider.postMessage({ type: "togglePlay" });
        MediaPlayerPanel.current?.postMessage({ type: "togglePlay" });
    });

    // Open media file — works from command palette and from sidebar header button
    const openFileCmd = vscode.commands.registerCommand(
        "player.openFile",
        async () => {
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
            if (!uris || uris.length === 0) return;

            // Prefer sidebar; also send to panel if it's open
            const sidebarFiles = uris.map((uri) => ({
                url: viewProvider.asWebviewUri(uri),
                name: uri.fsPath.split(/[\\/]/).pop() ?? uri.fsPath,
            }));
            viewProvider.postMessage({ type: "addFiles", files: sidebarFiles });

            if (MediaPlayerPanel.current) {
                const panelFiles = uris.map((uri) => ({
                    url: MediaPlayerPanel.current!.asWebviewUri(uri),
                    name: uri.fsPath.split(/[\\/]/).pop() ?? uri.fsPath,
                }));
                MediaPlayerPanel.current.postMessage({ type: "addFiles", files: panelFiles });
            }
        }
    );

    const nextCmd = vscode.commands.registerCommand("player.next", () => {
        viewProvider.postMessage({ type: "next" });
        MediaPlayerPanel.current?.postMessage({ type: "next" });
    });

    const prevCmd = vscode.commands.registerCommand("player.prev", () => {
        viewProvider.postMessage({ type: "prev" });
        MediaPlayerPanel.current?.postMessage({ type: "prev" });
    });

    const openSettingsCmd = vscode.commands.registerCommand("player.openSettings", () => {
        viewProvider.postMessage({ type: "openSettings" });
        MediaPlayerPanel.current?.postMessage({ type: "openSettings" });
    });

    context.subscriptions.push(openCmd, toggleCmd, openFileCmd, nextCmd, prevCmd, openSettingsCmd);

    // ─── Status bar updates from both panel and sidebar ────────────────────────
    MediaPlayerPanel.onStatusUpdate(updateStatusBar);
    MediaPlayerViewProvider.onStatusUpdate(updateStatusBar);
}

function updateStatusBar(status: { playing: boolean; trackName?: string }) {
    const maxLength = 40;
    const displayName = status.trackName && status.trackName.length > maxLength
        ? status.trackName.substring(0, maxLength - 1) + "…"
        : status.trackName;

    if (status.playing && displayName) {
        statusBarItem.text = `$(debug-pause) ${displayName}`;
        statusBarItem.tooltip = `Plyr — ${status.trackName}`;
        statusBarItem.show();
    } else if (displayName) {
        statusBarItem.text = `$(play) ${displayName}`;
        statusBarItem.tooltip = `Plyr — ${status.trackName}`;
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}

export function deactivate() {
    statusBarItem?.dispose();
}
