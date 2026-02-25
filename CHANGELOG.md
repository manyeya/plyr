# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
