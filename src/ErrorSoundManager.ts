import * as vscode from "vscode";

/**
 * Watches for files with Error-severity diagnostics and triggers the
 * "faaaaaah" error sound through the existing sidebar player webview.
 *
 * No hidden WebviewPanels are created — audio is played through the
 * sidebar's own <audio> element via message passing.
 */

interface IPlayerController {
    triggerErrorSound(): void;
}

const DEFAULT_COOLDOWN_MS = 5000;
const DEFAULT_DEDUPLICATION = true;

export class ErrorSoundManager implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];

    /** Files that have already played the sound this session. */
    private readonly _played = new Set<string>();

    /** Timestamp of the last sound playback (ms since epoch). */
    private _lastPlayedAt = 0;

    /**
     * In-memory override set by the webview Settings toggle.
     * null means "read from VS Code setting".
     */
    private _enabledOverride: boolean | null = null;

    /**
     * In-memory override for cooldown set by the webview Settings.
     * null means "read from persisted state".
     */
    private _cooldownOverride: number | null = null;

    /**
     * In-memory override for deduplication set by the webview Settings.
     * null means "read from persisted state".
     */
    private _deduplicationOverride: boolean | null = null;

    /** Reference to the sidebar — set after both objects are constructed. */
    private _controller: IPlayerController | undefined;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;

        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) this._onEditorActivated(editor);
            })
        );

        this._disposables.push(
            vscode.workspace.onDidCloseTextDocument((doc) => {
                this._played.delete(doc.uri.toString());
            })
        );
    }

    public setController(controller: IPlayerController): void {
        this._controller = controller;
    }

    public setEnabled(enabled: boolean): void {
        this._enabledOverride = enabled;
    }

    public setCooldown(cooldownMs: number): void {
        this._cooldownOverride = cooldownMs;
    }

    public setDeduplication(enabled: boolean): void {
        this._deduplicationOverride = enabled;
    }

    /** Get the current cooldown in milliseconds. */
    private _getCooldown(): number {
        if (this._cooldownOverride !== null) {
            return this._cooldownOverride;
        }
        return this._context.globalState.get<number>("player.errorSoundCooldown", DEFAULT_COOLDOWN_MS);
    }

    /** Get whether per-file deduplication is enabled. */
    private _getDeduplication(): boolean {
        if (this._deduplicationOverride !== null) {
            return this._deduplicationOverride;
        }
        return this._context.globalState.get<boolean>("player.errorSoundDeduplication", DEFAULT_DEDUPLICATION);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private _onEditorActivated(editor: vscode.TextEditor): void {
        const cfg = vscode.workspace.getConfiguration("mediaPlayer");
        const enabled = this._enabledOverride !== null
            ? this._enabledOverride
            : cfg.get<boolean>("errorSound.enabled", true);

        if (!enabled) return;

        const fileKey = editor.document.uri.toString();
        const deduplicationEnabled = this._getDeduplication();
        if (deduplicationEnabled && this._played.has(fileKey)) return;

        const cooldownMs = this._getCooldown();
        if (cooldownMs > 0 && Date.now() - this._lastPlayedAt < cooldownMs) return;

        setTimeout(() => this._checkAndPlay(editor.document), 300);
    }

    private _checkAndPlay(doc: vscode.TextDocument): void {
        const hasErrors = vscode.languages.getDiagnostics(doc.uri).some(
            (d) => d.severity === vscode.DiagnosticSeverity.Error
        );
        if (!hasErrors) return;

        const fileKey = doc.uri.toString();
        const deduplicationEnabled = this._getDeduplication();
        if (deduplicationEnabled && this._played.has(fileKey)) return;

        const cooldownMs = this._getCooldown();
        if (cooldownMs > 0 && Date.now() - this._lastPlayedAt < cooldownMs) return;

        // Only track played files if deduplication is enabled
        if (deduplicationEnabled) {
            this._played.add(fileKey);
        }
        this._lastPlayedAt = Date.now();
        this._controller?.triggerErrorSound();
    }

    public dispose(): void {
        this._disposables.forEach((d) => d.dispose());
    }
}
