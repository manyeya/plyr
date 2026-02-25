# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run compile` - Build both extension and webview code via esbuild
- `npm run watch` - Watch mode for development (no minification)
- `npm run lint` - Run ESLint on src/

## Architecture Overview

Plyr is a VS Code extension media player with a dual-process architecture:

### Extension Host (`src/`)
Runs in Node.js and handles VS Code API integration:
- `extension.ts` - Entry point, registers commands, status bar, and view providers
- `MediaPlayerViewProvider.ts` - Sidebar webview provider (primary UI)
- `MediaPlayerPanel.ts` - Optional full-panel webview for wider view
- `utils.ts` - Media metadata parsing using `music-metadata` library

Both view providers share identical logic for handling messages (`openFile`, `requestConfig`, `statusUpdate`) and generating webview HTML with CSP. They expose static `current` references and `postMessage()`/`asWebviewUri()` methods for command handlers.

### Webview Frontend (`webview/src/`)
React application that renders in both sidebar and panel:
- `App.tsx` - Root component, handles message passing with extension host via `window.addEventListener('message')`
- `usePlayer.ts` - Core player state/logic hook (playlist, playback controls, shuffle, repeat)
- `components/` - TrackInfo, Controls, Playlist (with drag-drop reordering via react-dnd)
- `vscode.ts` - Shim for `acquireVsCodeApi()` and `postToExtension()`

### Message Protocol
Extension → Webview: `{ type, files?, defaultVolume?, defaultSpeed? }`
Webview → Extension: `{ type: "openFile" | "requestConfig" | "statusUpdate", ... }`

### Critical Constraints

1. **retainContextWhenHidden: true** - Set in package.json and panel creation. Without this, the webview is destroyed when hidden, interrupting audio playback and losing React state.

2. **HTML is set once** - Both providers set `webview.html` only in their resolve/constructor. Re-setting HTML reloads the entire webview, destroying state.

3. **localResourceRoots** - Must include user's home directory (`os.homedir()`) and `/Volumes` (macOS external drives) for local media file access via `asWebviewUri()`.

4. **Dual tsconfigs** - `tsconfig.json` for extension (CommonJS), `tsconfig.webview.json` for webview (ESNext/bundler).

5. **Media types** - Supports audio (mp3, flac, ogg, aac, m4a, wav) and video (mp4, webm, mkv, avi, mov). Video tracks hide the album art in TrackInfo.

## esbuild Configuration

Single esbuild.js builds both targets in parallel:
- Extension: `src/extension.ts` → `out/extension.js` (CJS, node20, external: vscode)
- Webview: `webview/src/index.tsx` → `out/webview/player.js` (IIFE, browser, inline CSS/SVG)
