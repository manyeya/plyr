# Plyr

<div align="center">

<img src="resources/icon.png" alt="Plyr Logo" width="128" height="128">

A feature-rich media player (audio & video) embedded directly inside VS Code.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Open VSX](https://img.shields.io/badge/Open%20VSX-Download-10ACCD.svg)](https://open-vsx.org/extension/manyeya/plyr)
![VS Code Version](https://img.shields.io/badge/VS%20Code-%5E1.85.0-blue.svg)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Configuration](#configuration) • [Development](#development)

</div>

---

## Overview

Plyr brings a fully-featured media player directly into your editor. Listen to music, podcasts, or watch videos without ever leaving your IDE. Perfect for coding sessions with background music, reviewing video tutorials, or accessing media files while working on projects.

Available on the **Open VSX Registry** — compatible with VS Code, VSCodium, Cursor, Windsurf, Eclipse Theia/Che, Gitpod, code-server, Google Cloud Shell Editor, and more.

## Features

### Core Playback
- **Audio & Video Support** - Play MP3, FLAC, OGG, AAC, M4A, WAV, MP4, WEBM, MKV, AVI, MOV files
- **Embedded Metadata Reading** - Automatically extracts album art, track titles, and artist names from audio files using `music-metadata`
- **Gapless Playback** - Smooth transitions between tracks
- **Persistent State** - Playlist, volume, and settings survive sidebar toggles and editor restarts

### Playlist Management
- **Drag & Drop** - Reorder tracks by dragging the handle icon
- **External File Drops** - Drag files directly from your OS into the playlist
- **Queue Management** - Add multiple files at once via file picker
- **Track Removal** - Remove individual tracks with hover-reveal delete button
- **Smart Track Display** - Shows embedded metadata (title/artist) when available, falls back to filename

### Playback Controls
- **Play/Pause** - Click the center button or press `Space`
- **Seek** - Click anywhere on the progress bar or use arrow keys
- **Skip** - Previous/Next track buttons with smart restart (if >3s played, prev restarts current track)
- **Volume Control** - Slider with mute toggle button
- **Playback Speed** - Choose from 0.5× to 2× speed
- **Shuffle Mode** - Randomize playback order
- **Repeat Modes** - Off, Repeat All, Repeat One

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Toggle Play/Pause |
| `←` / `→` | Seek backward/forward 10 seconds |
| `↑` / `↓` | Volume up/down |
| `M` | Toggle mute |
| `N` | Next track |
| `P` | Previous track |
| `S` | Toggle shuffle |
| `R` | Cycle repeat mode |

### Visual Design
- **Glassmorphism UI** - Modern, translucent design that adapts to VS Code themes
- **Theme Integration** - Automatically matches your VS Code color scheme (light/dark/high-contrast)
- **Animated Album Art** - Pulsing glow effect on currently playing track
- **Status Bar Integration** - Shows current track in VS Code's status bar
- **Responsive Layout** - Adapts to sidebar width vs. full panel view
- **Video Support** - Displays video content inline for video files

### UI Views
- **Sidebar View** - Compact, always-accessible player in the activity bar
- **Panel View** - Expanded view for larger album art and more spacious controls

## Installation

Plyr is available on the [Open VSX Registry](https://open-vsx.org/extension/manyeya/plyr), which is compatible with:

- **VS Code** (requires [Open VSX Extension](https://marketplace.visualstudio.com/items?itemName=eamodio.open-vsx))
- **VSCodium** - native Open VSX support
- **Cursor** - native Open VSX support
- **Windsurf** - native Open VSX support
- **Eclipse Theia / Eclipse Che**
- **Gitpod**
- **code-server**
- **Google Cloud Shell Editor**
- **GNOME Builder**
- And other Open VSX-supporting IDEs

### Option 1: Install from Open VSX (Most IDEs)

**VSCodium / Cursor / Windsurf:**
1. Open the Extensions panel
2. Search for "Plyr"
3. Click **Install**

**VS Code (requires extension):**
1. Install the [Open VSX Extension](https://marketplace.visualstudio.com/items?itemName=eamodio.open-vsx)
2. Click the Extensions icon in the activity bar
3. Click the "..." menu and select "Search Open VSX Registry..."
4. Search for "Plyr" and click **Install**

**Eclipse Theia / Eclipse Che / Gitpod / code-server:**
1. Open the Extensions panel
2. Search for "Plyr"
3. Click **Install**

### Option 2: Install from VSIX
1. Download the latest `.vsix` file from the [Releases](https://github.com/manyeya/plyr/releases) page
2. In VS Code, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Type "Extensions: Install from VSIX..."
4. Select the downloaded file

### Option 3: Build from Source
If no pre-built VSIX is available, you can build the extension yourself:

```bash
# Clone the repository
git clone https://github.com/manyeya/plyr.git
cd plyr

# Install dependencies
bun install

# Build the extension
bun run compile

# Package the extension
npx vsce package
```

Then install the generated `.vsix` file using Option 2.

## Usage

### Opening the Player
- **Sidebar**: Click the Plyr icon in the activity bar (left side)
- **Command Palette**: Press `Ctrl+Shift+P` → type "Plyr: Open Player"
- **Keyboard Shortcut**: Press `Ctrl+Shift+M` (or `Cmd+Shift+M` on macOS)

### Adding Media Files

#### Method 1: File Picker
1. Click the **+** button in the playlist header, or
2. Press `Ctrl+Shift+P` → type "Plyr: Open Media File"
3. Select one or more media files

#### Method 2: Drag & Drop
Simply drag media files from your file explorer directly onto the playlist area.

### Controlling Playback
- Use the on-screen controls in the sidebar/panel
- Use keyboard shortcuts (see table above)
- Click the status bar item to focus the player

## Configuration

Plyr can be configured through VS Code's settings. Navigate to **Settings** → search for "Plyr" or "mediaPlayer".

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mediaPlayer.defaultVolume` | Number (0-100) | `80` | Default playback volume when opening files |
| `mediaPlayer.autoplay` | Boolean | `false` | Automatically play media when opened |
| `mediaPlayer.defaultSpeed` | Number | `1` | Default playback speed (0.5, 0.75, 1, 1.25, 1.5, 1.75, or 2) |

### Example Configuration

```json
{
  "mediaPlayer.defaultVolume": 60,
  "mediaPlayer.autoplay": true,
  "mediaPlayer.defaultSpeed": 1.25
}
```

## Commands

| Command ID | Title | Description |
|------------|-------|-------------|
| `player.open` | Open Plyr | Opens the media player in the main editor panel |
| `player.openFile` | Open Media File | Opens a file picker to add media files |
| `player.togglePlay` | Toggle Play/Pause | Toggles playback of the current media |
| `player.next` | Next Track | Skips to the next track in the playlist |
| `player.prev` | Previous Track | Goes to the previous track |

### Keybindings

| Shortcut | Command | Platform |
|----------|---------|----------|
| `Ctrl+Shift+M` | Open Plyr | Windows/Linux |
| `Cmd+Shift+M` | Open Plyr | macOS |
| `Ctrl+Shift+Space` | Toggle Play/Pause | Windows/Linux |
| `Cmd+Shift+Space` | Toggle Play/Pause | macOS |

## Architecture

Plyr is built as a VS Code extension with a dual-process architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ extension.ts │  │   Sidebar    │  │    Panel     │      │
│  │              │  │   Provider   │  │   Provider   │      │
│  │ - Commands   │  │              │  │              │      │
│  │ - Status Bar │  │ - Webview    │  │ - Webview    │      │
│  │ - Metadata   │  │   HTML/CSP   │  │   HTML/CSP   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ postMessage
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Webview Process                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App.tsx    │  │  usePlayer   │  │  Components  │      │
│  │              │  │    Hook      │  │              │      │
│  │ - Message    │  │ - State      │  │ - TrackInfo  │      │
│  │   Handler    │  │ - Audio/Video│  │ - Controls   │      │
│  │ - React Root │  │   Elements   │  │ - Playlist   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Extension Host (Node.js)
- **`extension.ts`** - Entry point, registers commands, status bar, and view providers
- **`MediaPlayerViewProvider.ts`** - Sidebar webview provider (primary UI)
- **`MediaPlayerPanel.ts`** - Optional full-panel webview for wider view
- **`utils.ts`** - Media metadata parsing using `music-metadata` library

### Webview Frontend (React)
- **`App.tsx`** - Root component, handles message passing with extension
- **`usePlayer.ts`** - Core player state/logic hook (450+ lines)
- **`components/`** - React UI components
  - `TrackInfo` - Album art, title, artist display
  - `Controls` - Seek bar, playback buttons, volume, speed
  - `Playlist` - Track list with drag-drop reordering (react-dnd)

### Communication Protocol

**Extension → Webview:**
```typescript
{ type: "addFiles", files: Array<{url, name, artwork?, title?, artist?}> }
{ type: "togglePlay" }
{ type: "next" | "prev" }
{ type: "config", defaultVolume, autoplay, defaultSpeed }
```

**Webview → Extension:**
```typescript
{ type: "openFile" }
{ type: "requestConfig" }
{ type: "statusUpdate", playing, trackName }
```

### Key Technical Details

1. **`retainContextWhenHidden: true`** - Critical setting that keeps the webview alive (and audio playing) when the sidebar is hidden or user switches views

2. **State Persistence** - Player state (playlist, volume, shuffle, repeat) is stored in VS Code's webview state API, surviving page reloads

3. **Dual Media Elements** - Separate `<audio>` and `<video>` elements allow seamless switching between audio and video content

4. **Theme Variables** - CSS variables map to VS Code's theme tokens for automatic light/dark/high-contrast support

5. **File Access** - `localResourceRoots` includes user's home directory and `/Volumes` (macOS external drives)

## Development

### Prerequisites
- Node.js 20+
- Bun (package manager) or npm
- VS Code

### Getting Started

```bash
# Clone the repository
git clone https://github.com/manyeya/plyr.git
cd plyr

# Install dependencies
bun install

# Watch mode for development
bun run watch

# Open in VS Code
code .
```

### Build Commands

```bash
# Production build
bun run compile

# Development build (watch mode)
bun run watch

# Lint code
bun run lint
```

### Project Structure

```
plyr/
├── src/                          # Extension host (Node.js)
│   ├── extension.ts              # Entry point
│   ├── MediaPlayerViewProvider.ts
│   ├── MediaPlayerPanel.ts
│   └── utils.ts
├── webview/
│   └── src/                      # React frontend
│       ├── App.tsx               # Root component
│       ├── components/           # UI components
│       │   ├── Controls.tsx
│       │   ├── Playlist.tsx
│       │   └── TrackInfo.tsx
│       ├── hooks/
│       │   └── usePlayer.ts      # Player logic
│       ├── styles/
│       │   └── index.css
│       └── vscode.ts             # VS Code API shim
├── out/                          # Build output
│   ├── extension.js              # Compiled extension
│   └── webview/
│       └── player.js             # Bundled React app
├── esbuild.js                    # Build configuration
├── tsconfig.json                 # Extension TS config
├── tsconfig.webview.json         # Webview TS config
└── package.json
```

### Debugging

1. Press `F5` in VS Code to launch the Extension Development Host
2. The extension will be loaded in a new VS Code window
3. Make changes to the source code
4. Press `Ctrl+R` (or `Cmd+R`) in the debug window to reload

### Testing

To test changes interactively:
1. Run `bun run watch` for automatic recompilation
2. Press `F5` to launch the Extension Development Host
3. Open the Plyr sidebar and test your changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## License

MIT © 2026 [manyeya](https://github.com/manyeya)

See [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Media metadata via [music-metadata](https://github.com/Borewit/music-metadata)
- Drag & drop via [react-dnd](https://react-dnd.github.io/react-dnd/)
- Iconography with inline SVG

---

<div align="center">

**Made with ❤️ for developers who need music while coding**

[GitHub](https://github.com/manyeya/plyr) • [Open VSX](https://open-vsx.org/extension/manyeya/plyr) • [Report Issues](https://github.com/manyeya/plyr/issues)

</div>
