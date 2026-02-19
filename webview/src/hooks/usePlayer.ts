import { useState, useRef, useCallback, useEffect } from "react";
import { postToExtension, getVsCodeApi } from "../vscode";

// Shape of what we persist in VS Code's webview state
interface PersistedState {
    playlist: Track[];
    currentIndex: number;
    volume: number;
    muted: boolean;
    speed: number;
}

export interface Track {
    id: string;
    name: string;
    path: string;
    url: string;
    duration?: number;
    type: "audio" | "video";
}

export interface PlayerState {
    currentTrack: Track | null;
    playlist: Track[];
    currentIndex: number;
    playing: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    speed: number;
    loading: boolean;
}

export function usePlayer(defaultVolume = 80, defaultSpeed = 1) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Restore persisted state from VS Code's webview state storage (survives panel hides)
    const [state, setState] = useState<PlayerState>(() => {
        const saved = getVsCodeApi()?.getState() as PersistedState | null | undefined;
        return {
            currentTrack: saved?.playlist?.[saved?.currentIndex ?? -1] ?? null,
            playlist: saved?.playlist ?? [],
            currentIndex: saved?.currentIndex ?? -1,
            playing: false,        // always start paused after restore
            currentTime: 0,
            duration: 0,
            volume: saved?.volume ?? defaultVolume / 100,
            muted: saved?.muted ?? false,
            speed: saved?.speed ?? defaultSpeed,
            loading: false,
        };
    });

    const getMedia = useCallback((): HTMLMediaElement | null => {
        const track = state.currentTrack;
        if (!track) return null;
        return track.type === "video" ? videoRef.current : audioRef.current;
    }, [state.currentTrack]);

    const loadTrack = useCallback(
        (track: Track, play = true) => {
            setState((prev) => ({ ...prev, currentTrack: track, loading: true, playing: false, currentTime: 0 }));
            // Media element picks up the new src via useEffect
            setTimeout(() => {
                const media = track.type === "video" ? videoRef.current : audioRef.current;
                if (media) {
                    media.src = track.url;
                    media.load();
                    if (play) media.play().catch(() => { });
                }
            }, 0);
        },
        []
    );

    const play = useCallback(() => {
        getMedia()?.play().catch(() => { });
    }, [getMedia]);

    const pause = useCallback(() => {
        getMedia()?.pause();
    }, [getMedia]);

    const togglePlay = useCallback(() => {
        const media = getMedia();
        if (!media) return;
        if (media.paused) media.play().catch(() => { });
        else media.pause();
    }, [getMedia]);

    const seek = useCallback(
        (time: number) => {
            const media = getMedia();
            if (media) media.currentTime = time;
        },
        [getMedia]
    );

    const setVolume = useCallback((vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        setState((prev) => ({ ...prev, volume: clamped }));
        const applyToEl = (el: HTMLMediaElement | null) => {
            if (el) el.volume = clamped;
        };
        applyToEl(audioRef.current);
        applyToEl(videoRef.current);
    }, []);

    const toggleMute = useCallback(() => {
        setState((prev) => {
            const newMuted = !prev.muted;
            if (audioRef.current) audioRef.current.muted = newMuted;
            if (videoRef.current) videoRef.current.muted = newMuted;
            return { ...prev, muted: newMuted };
        });
    }, []);

    const setSpeed = useCallback((speed: number) => {
        setState((prev) => ({ ...prev, speed }));
        if (audioRef.current) audioRef.current.playbackRate = speed;
        if (videoRef.current) videoRef.current.playbackRate = speed;
    }, []);

    const goToIndex = useCallback(
        (index: number) => {
            setState((prev) => {
                if (index < 0 || index >= prev.playlist.length) return prev;
                const track = prev.playlist[index];
                loadTrack(track, true);
                return { ...prev, currentIndex: index };
            });
        },
        [loadTrack]
    );

    const next = useCallback(() => {
        setState((prev) => {
            const nextIdx = (prev.currentIndex + 1) % prev.playlist.length;
            if (prev.playlist.length === 0) return prev;
            const track = prev.playlist[nextIdx];
            loadTrack(track, true);
            return { ...prev, currentIndex: nextIdx };
        });
    }, [loadTrack]);

    const prev = useCallback(() => {
        setState((prev) => {
            if (prev.playlist.length === 0) return prev;
            // if > 3s played, restart; else go previous
            const media = prev.currentTrack?.type === "video" ? videoRef.current : audioRef.current;
            if (media && media.currentTime > 3) {
                media.currentTime = 0;
                return prev;
            }
            const prevIdx =
                (prev.currentIndex - 1 + prev.playlist.length) % prev.playlist.length;
            const track = prev.playlist[prevIdx];
            loadTrack(track, true);
            return { ...prev, currentIndex: prevIdx };
        });
    }, [loadTrack]);

    const addFiles = useCallback(
        (files: { url: string; name: string }[]) => {
            const newTracks: Track[] = files.map((f) => {
                const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
                const videoExts = ["mp4", "mkv", "webm", "avi", "mov", "m4v"];
                return {
                    id: `${Date.now()}-${Math.random()}`,
                    name: f.name.replace(/\.[^.]+$/, ""),
                    path: f.url,
                    url: f.url,  // Already a proper webview URI from the extension host
                    type: videoExts.includes(ext) ? "video" : "audio",
                } as Track;
            });

            setState((prev) => {
                const combined = [...prev.playlist, ...newTracks];
                const shouldLoad = prev.currentIndex === -1 && newTracks.length > 0;
                if (shouldLoad) {
                    setTimeout(() => loadTrack(newTracks[0], true), 0);
                    return { ...prev, playlist: combined, currentIndex: prev.playlist.length };
                }
                return { ...prev, playlist: combined };
            });
        },
        [loadTrack]
    );

    // Persist important state to VS Code webview state whenever it changes
    useEffect(() => {
        const api = getVsCodeApi();
        if (!api) return;
        const persisted: PersistedState = {
            playlist: state.playlist,
            currentIndex: state.currentIndex,
            volume: state.volume,
            muted: state.muted,
            speed: state.speed,
        };
        api.setState(persisted);
    }, [state.playlist, state.currentIndex, state.volume, state.muted, state.speed]);

    // On first load, if we restored a playlist, re-attach the current track src
    // (VS Code state survives panel hide but NOT a full reload; on true reload
    // blob: URLs are gone, but vscode-webview URIs are still valid)
    const didRestore = useRef(false);
    useEffect(() => {
        if (didRestore.current) return;
        didRestore.current = true;
        const track = state.currentTrack;
        if (!track) return;
        const media = track.type === "video" ? videoRef.current : audioRef.current;
        if (media) {
            media.src = track.url;
            media.load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const removeTrack = useCallback((id: string) => {
        setState((prev) => {
            const idx = prev.playlist.findIndex((t) => t.id === id);
            if (idx === -1) return prev;
            const newPlaylist = prev.playlist.filter((t) => t.id !== id);
            let newIndex = prev.currentIndex;
            if (idx < prev.currentIndex) newIndex -= 1;
            else if (idx === prev.currentIndex) {
                newIndex = Math.min(newIndex, newPlaylist.length - 1);
                if (newPlaylist[newIndex]) loadTrack(newPlaylist[newIndex], false);
            }
            return { ...prev, playlist: newPlaylist, currentIndex: newIndex };
        });
    }, [loadTrack]);

    // Sync media element events back to state
    const bindMediaEvents = useCallback(
        (el: HTMLMediaElement | null) => {
            if (!el) return () => { };
            const onTimeUpdate = () =>
                setState((prev) => ({ ...prev, currentTime: el.currentTime }));
            const onDurationChange = () =>
                setState((prev) => ({ ...prev, duration: el.duration || 0 }));
            const onPlay = () => {
                setState((prev) => ({ ...prev, playing: true, loading: false }));
                postToExtension({
                    type: "statusUpdate",
                    playing: true,
                    trackName: state.currentTrack?.name,
                });
            };
            const onPause = () => {
                setState((prev) => ({ ...prev, playing: false }));
                postToExtension({
                    type: "statusUpdate",
                    playing: false,
                    trackName: state.currentTrack?.name,
                });
            };
            const onEnded = () => next();
            const onWaiting = () => setState((prev) => ({ ...prev, loading: true }));
            const onCanPlay = () => setState((prev) => ({ ...prev, loading: false }));

            el.addEventListener("timeupdate", onTimeUpdate);
            el.addEventListener("durationchange", onDurationChange);
            el.addEventListener("play", onPlay);
            el.addEventListener("pause", onPause);
            el.addEventListener("ended", onEnded);
            el.addEventListener("waiting", onWaiting);
            el.addEventListener("canplay", onCanPlay);

            return () => {
                el.removeEventListener("timeupdate", onTimeUpdate);
                el.removeEventListener("durationchange", onDurationChange);
                el.removeEventListener("play", onPlay);
                el.removeEventListener("pause", onPause);
                el.removeEventListener("ended", onEnded);
                el.removeEventListener("waiting", onWaiting);
                el.removeEventListener("canplay", onCanPlay);
            };
        },
        [next, state.currentTrack?.name]
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            switch (e.key) {
                case " ":
                    e.preventDefault();
                    togglePlay();
                    break;
                case "ArrowRight":
                    seek((getMedia()?.currentTime ?? 0) + 10);
                    break;
                case "ArrowLeft":
                    seek(Math.max(0, (getMedia()?.currentTime ?? 0) - 10));
                    break;
                case "ArrowUp":
                    setVolume(Math.min(1, state.volume + 0.05));
                    break;
                case "ArrowDown":
                    setVolume(Math.max(0, state.volume - 0.05));
                    break;
                case "m":
                case "M":
                    toggleMute();
                    break;
                case "n":
                case "N":
                    next();
                    break;
                case "p":
                case "P":
                    prev();
                    break;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [togglePlay, seek, setVolume, toggleMute, next, prev, getMedia, state.volume]);

    return {
        state,
        audioRef,
        videoRef,
        togglePlay,
        play,
        pause,
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
    };
}
