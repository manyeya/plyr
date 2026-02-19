// Shim for the VS Code webview API
declare const acquireVsCodeApi: () => {
    postMessage: (msg: unknown) => void;
    getState: () => unknown;
    setState: (state: unknown) => void;
};

let _vscode: ReturnType<typeof acquireVsCodeApi> | null = null;

export function getVsCodeApi() {
    if (!_vscode) {
        if (typeof acquireVsCodeApi !== "undefined") {
            _vscode = acquireVsCodeApi();
        }
    }
    return _vscode;
}

export function postToExtension(message: Record<string, unknown>) {
    getVsCodeApi()?.postMessage(message);
}
