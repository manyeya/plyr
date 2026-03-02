# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.5] - 2025-03-02

### Added
- **Error Sound Feature 🔊**: Plays a "Faaaaaah" sound when you open a file containing diagnostic errors
  - Automatic error detection via `vscode.languages.getDiagnostics()`
  - Configurable cooldown (5s, 10s, 30s, 1m, 5m, or Never) via Settings UI
  - **Per-file deduplication toggle** — Sound plays only once per file until closed (can be disabled)
  - Custom sound file support — replace the default with your own audio
  - Volume control for error sounds (0-100)
  - Test button in Settings to preview the sound
- **New Settings Modal Controls**: Cooldown presets for error sound with visual buttons

### Changed
- **Shadows are now OFF by default** — for a cleaner, more minimal appearance
- Error sound cooldown now persisted to `globalState` instead of reading from VS Code config
- Settings UI now shows current cooldown value with formatted labels (e.g., "Wait 5s between sounds")
- Improved settings state management with cooldown and deduplication persistence

### Technical
- Added `ErrorSoundManager.ts` — monitors file diagnostics and manages error sound playback
- Added `setCooldown()` and `setDeduplication()` methods for runtime setting updates
- Cooldown of 0 means "no limit" — sound plays every time (subject to per-file deduplication)
- Per-file deduplication can be disabled to allow sounds to play repeatedly for the same file

## [0.2.0] - 2026-02-25

### Added
- **Settings Modal**: New settings modal accessible via gear icon in sidebar title
  - Toggle to enable/disable shadow effects on album art
  - Artwork shape selector (square or circular disc style)
  - Settings are persisted using VSCode webview state API
- **Spinning Animation**: Circular artwork now spins when playing
- **Sidebar Status Callbacks**: New callback system in MediaPlayerViewProvider for status updates
  - Enables sidebar to notify status bar of playback changes
- **Responsive Styles**: Added responsive styles for narrow sidebars

### Changed
- Improved status bar with truncated long track names
- Status bar now uses pulse icon for playing state
- Adjusted padding values for playlist header
- Updated header name

## [0.1.0] - Initial Release

### Added
- Feature-rich media player (audio & video) embedded inside VS Code
- Sidebar panel with playback controls
- Playlist management with drag-and-drop support
- Support for various media formats
- Keyboard shortcuts for play/pause and opening the player
- Configurable default volume, autoplay, and playback speed
