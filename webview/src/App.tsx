import React, { useEffect, useCallback, useRef } from "react";
import { usePlayer } from "./hooks/usePlayer";
import { TrackInfo } from "./components/TrackInfo";
import { Controls } from "./components/Controls";
import { Playlist } from "./components/Playlist";
import { Settings } from "./components/Settings";
import { postToExtension, getVsCodeApi } from "./vscode";

interface VSCodeMessage {
    type: string;
    files?: { url: string; name: string }[];
    defaultVolume?: number;
    defaultSpeed?: number;
    errorSoundEnabled?: boolean;
    errorSoundCooldown?: number;
    errorSoundDeduplication?: boolean;
    soundUrl?: string;
    volume?: number;
    wasPlaying?: boolean;
    name?: string;
    customSoundName?: string;
}

export const App: React.FC = () => {
    const [config, setConfig] = React.useState({ defaultVolume: 80, defaultSpeed: 1 });
    const [videoVisible, setVideoVisible] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [settings, setSettings] = React.useState({
        enableShadows: false,
        artworkShape: "square" as "square" | "circle",
        errorSoundEnabled: true,
        errorSoundCooldown: 5000,
        errorSoundDeduplication: true,
    });
    const [customSoundName, setCustomSoundName] = React.useState<string | undefined>(undefined);

    // Dedicated hidden audio element for the error sound
    const errorAudioRef = useRef<HTMLAudioElement>(null);

    // Restore settings from persisted state
    useEffect(() => {
        const api = getVsCodeApi();
        if (api) {
            const savedState = api.getState() as any;
            if (savedState?.settings) {
                setSettings({
                    enableShadows: savedState.settings.enableShadows ?? false,
                    artworkShape: savedState.settings.artworkShape ?? "square",
                    errorSoundEnabled: savedState.settings.errorSoundEnabled ?? true,
                    errorSoundCooldown: savedState.settings.errorSoundCooldown ?? 5000,
                    errorSoundDeduplication: savedState.settings.errorSoundDeduplication ?? true,
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

    useEffect(() => {
        const cleanupAudio = bindMediaEvents(audioRef.current);
        const cleanupVideo = bindMediaEvents(videoRef.current);
        return () => {
            cleanupAudio();
            cleanupVideo();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setVideoVisible(state.currentTrack?.type === "video");
    }, [state.currentTrack?.type]);

    // Ref so the playErrorSound handler can read current playing state without
    // needing to be in the dependency array (avoids re-registering on every tick)
    const playingRef = useRef(state.playing);
    useEffect(() => { playingRef.current = state.playing; }, [state.playing]);
    const togglePlayRef = useRef(togglePlay);
    useEffect(() => { togglePlayRef.current = togglePlay; }, [togglePlay]);

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
                    if (msg.customSoundName !== undefined) {
                        setCustomSoundName(msg.customSoundName || undefined);
                    }
                    if (msg.errorSoundCooldown !== undefined) {
                        setSettings((prev) => ({ ...prev, errorSoundCooldown: msg.errorSoundCooldown! }));
                    }
                    if (msg.errorSoundDeduplication !== undefined) {
                        setSettings((prev) => ({ ...prev, errorSoundDeduplication: msg.errorSoundDeduplication! }));
                    }
                    break;
                case "openSettings":
                    setSettingsOpen(true);
                    break;
                case "syncErrorSound":
                    if (typeof msg.errorSoundEnabled === "boolean") {
                        setSettings((prev) => ({ ...prev, errorSoundEnabled: msg.errorSoundEnabled! }));
                    }
                    break;

                case "errorSoundFileSet":
                    // Custom sound was picked (or cleared) by the file dialog
                    setCustomSoundName(msg.name || undefined);
                    break;

                case "playErrorSound": {
                    // Play the error sound through the dedicated hidden <audio> element.
                    // Pause the main player first; resume it when the sound ends.
                    const el = errorAudioRef.current;
                    if (!el || !msg.soundUrl) break;

                    const wasPlaying = msg.wasPlaying ?? false;

                    // Pause main player if it was playing
                    if (wasPlaying && playingRef.current) {
                        togglePlayRef.current();
                    }

                    el.src = msg.soundUrl;
                    el.volume = Math.max(0, Math.min(100, msg.volume ?? 80)) / 100;

                    el.onended = () => {
                        el.onended = null;
                        el.onerror = null;
                        // Resume main player only if we paused it
                        if (wasPlaying && !playingRef.current) {
                            togglePlayRef.current();
                        }
                    };
                    el.onerror = () => {
                        el.onended = null;
                        el.onerror = null;
                        if (wasPlaying && !playingRef.current) {
                            togglePlayRef.current();
                        }
                    };

                    el.load();
                    el.play().catch(() => { });
                    break;
                }
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

    const handleOpenFile = useCallback(() => {
        postToExtension({ type: "openFile" });
    }, []);

    return (
        <div className={`app ${!settings.enableShadows ? "app--no-shadows" : ""}`}>
            {/* Hidden audio element for the main player */}
            <audio ref={audioRef} style={{ display: "none" }} />
            {/* Hidden audio element dedicated to the error sound */}
            <audio ref={errorAudioRef} style={{ display: "none" }} />

            <div className="app__main">
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
                customSoundName={customSoundName}
                onUpdateSettings={(newSettings) => {
                    setSettings(newSettings);
                    const api = getVsCodeApi();
                    if (api) {
                        const currentState = api.getState() as any || {};
                        api.setState({ ...currentState, settings: newSettings });
                    }
                    postToExtension({ type: "updateErrorSound", enabled: newSettings.errorSoundEnabled, cooldown: newSettings.errorSoundCooldown, deduplication: newSettings.errorSoundDeduplication });
                }}
                onBrowseErrorSound={() => postToExtension({ type: "openErrorSoundFile" })}
                onClearErrorSound={() => postToExtension({ type: "clearErrorSoundFile" })}
                onTestErrorSound={() => postToExtension({ type: "testErrorSound" })}
            />
        </div>
    );
};
