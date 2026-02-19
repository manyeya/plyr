import React, { useEffect, useCallback } from "react";
import { usePlayer } from "./hooks/usePlayer";
import { TrackInfo } from "./components/TrackInfo";
import { Controls } from "./components/Controls";
import { Visualizer } from "./components/Visualizer";
import { Playlist } from "./components/Playlist";
import { postToExtension } from "./vscode";

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
    } = usePlayer(config.defaultVolume, config.defaultSpeed);

    // Bind media element events once on mount. The elements are always rendered
    // (hidden), so refs are populated by the time this runs.
    useEffect(() => {
        const cleanupAudio = bindMediaEvents(audioRef.current);
        const cleanupVideo = bindMediaEvents(videoRef.current);
        return () => {
            cleanupAudio();
            cleanupVideo();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally run once — refs are stable

    // Re-bind when the track changes so the status bar name stays current
    useEffect(() => {
        const cleanupAudio = bindMediaEvents(audioRef.current);
        const cleanupVideo = bindMediaEvents(videoRef.current);
        return () => {
            cleanupAudio();
            cleanupVideo();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.currentTrack?.name]);

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
        <div className="app">
            {/* Hidden media elements — always mounted so refs are stable */}
            <audio ref={audioRef} style={{ display: "none" }} />
            <video
                ref={videoRef}
                className={`video-element ${videoVisible ? "video-element--visible" : ""}`}
            />

            <div className="app__main">
                {/* Left panel: track info + visualizer + controls */}
                <div className="app__panel app__panel--left">
                    <div className="player-card">
                        <TrackInfo track={state.currentTrack} playing={state.playing} />

                        {videoVisible ? (
                            <div className="video-placeholder" aria-hidden="true" />
                        ) : (
                            <Visualizer
                                audioRef={audioRef as React.RefObject<HTMLAudioElement>}
                                playing={state.playing}
                                isAudio={isAudio}
                            />
                        )}

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
                        onSelect={goToIndex}
                        onRemove={removeTrack}
                        onAddFiles={handleOpenFile}
                    />
                </div>
            </div>
        </div>
    );
};
