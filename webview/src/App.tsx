import React, { useEffect, useCallback } from "react";
import { usePlayer } from "./hooks/usePlayer";
import { TrackInfo } from "./components/TrackInfo";
import { Controls } from "./components/Controls";
import { Playlist } from "./components/Playlist";
import { Settings } from "./components/Settings";
import { postToExtension, getVsCodeApi } from "./vscode";

interface VSCodeMessage {
    type: string;
    // Files always come from the extension host with pre-converted webview URIs
    files?: { url: string; name: string }[];
    defaultVolume?: number;
    defaultSpeed?: number;
}

export const App: React.FC = () => {
    const [config, setConfig] = React.useState({ defaultVolume: 80, defaultSpeed: 1 });
    const [videoVisible, setVideoVisible] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [settings, setSettings] = React.useState({
        enableShadows: true,
        artworkShape: "square" as "square" | "circle",
    });

    // Restore settings from persisted state
    useEffect(() => {
        const api = getVsCodeApi();
        if (api) {
            const savedState = api.getState() as any;
            if (savedState?.settings) {
                setSettings({
                    enableShadows: savedState.settings.enableShadows ?? true,
                    artworkShape: savedState.settings.artworkShape ?? "square",
                });
            }
        }
    }, []);

    const {
        state,
        audioRef,
        videoRef,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        setSpeed,
        next,
        prev,
        goToIndex,
        addFiles,
        removeTrack,
        bindMediaEvents,
        toggleShuffle,
        cycleRepeat,
        reorderPlaylist,
    } = usePlayer(config.defaultVolume, config.defaultSpeed);

    // Bind media element events once — bindMediaEvents is now stable (uses a ref
    // internally for track name) so a single bind on mount is sufficient.
    useEffect(() => {
        const cleanupAudio = bindMediaEvents(audioRef.current);
        const cleanupVideo = bindMediaEvents(videoRef.current);
        return () => {
            cleanupAudio();
            cleanupVideo();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally run once — refs are stable

    // Show/hide video depending on current track type
    useEffect(() => {
        setVideoVisible(state.currentTrack?.type === "video");
    }, [state.currentTrack?.type]);

    // Handle messages from the extension host
    useEffect(() => {
        const handler = (e: MessageEvent<VSCodeMessage>) => {
            const msg = e.data;
            switch (msg.type) {
                case "addFiles":
                    if (msg.files) addFiles(msg.files);
                    break;
                case "togglePlay":
                    togglePlay();
                    break;
                case "next":
                    next();
                    break;
                case "prev":
                    prev();
                    break;
                case "config":
                    setConfig({
                        defaultVolume: msg.defaultVolume ?? 80,
                        defaultSpeed: msg.defaultSpeed ?? 1,
                    });
                    break;
                case "openSettings":
                    setSettingsOpen(true);
                    break;
            }
        };
        window.addEventListener("message", handler);
        postToExtension({ type: "requestConfig" });
        return () => window.removeEventListener("message", handler);
    }, [addFiles, togglePlay, next, prev]);

    // Handle drag-drop events dispatched by Playlist component
    useEffect(() => {
        const handler = (e: Event) => {
            const files = (e as CustomEvent<{ url: string; name: string }[]>).detail;
            addFiles(files);
        };
        window.addEventListener("player:addFiles", handler);
        return () => window.removeEventListener("player:addFiles", handler);
    }, [addFiles]);

    // Ask the extension host to open the file dialog
    const handleOpenFile = useCallback(() => {
        postToExtension({ type: "openFile" });
    }, []);

    const isAudio = state.currentTrack?.type !== "video";

    return (
        <div className={`app ${!settings.enableShadows ? "app--no-shadows" : ""}`}>
            {/* Hidden audio element — always mounted so ref is stable */}
            <audio ref={audioRef} style={{ display: "none" }} />

            <div className="app__main">
                {/* Left panel: track info + visualizer + controls */}
                <div className="app__panel app__panel--left">
                    <video
                        ref={videoRef}
                        className={`video-element ${videoVisible ? "video-element--visible" : ""}`}
                    />
                    <div className="player-card">
                        <TrackInfo
                            track={state.currentTrack}
                            playing={state.playing}
                            enableShadows={settings.enableShadows}
                            artworkShape={settings.artworkShape}
                        />


                        <Controls
                            playing={state.playing}
                            currentTime={state.currentTime}
                            duration={state.duration}
                            volume={state.volume}
                            muted={state.muted}
                            speed={state.speed}
                            loading={state.loading}
                            hasPlaylist={state.playlist.length > 1}
                            onTogglePlay={togglePlay}
                            onSeek={seek}
                            onSetVolume={setVolume}
                            onToggleMute={toggleMute}
                            onSetSpeed={setSpeed}
                            onNext={next}
                            onPrev={prev}
                        />
                    </div>
                </div>

                {/* Right panel: playlist */}
                <div className="app__panel app__panel--right">
                    <Playlist
                        tracks={state.playlist}
                        currentIndex={state.currentIndex}
                        shuffle={state.shuffle}
                        repeatMode={state.repeatMode}
                        onSelect={goToIndex}
                        onRemove={removeTrack}
                        onAddFiles={handleOpenFile}
                        onToggleShuffle={toggleShuffle}
                        onCycleRepeat={cycleRepeat}
                        onReorder={reorderPlaylist}
                    />
                </div>
            </div>

            <Settings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
                onUpdateSettings={(newSettings) => {
                    setSettings(newSettings);
                    const api = getVsCodeApi();
                    if (api) {
                        const currentState = api.getState() as any || {};
                        api.setState({ ...currentState, settings: newSettings });
                    }
                }}
            />
        </div>
    );
};
