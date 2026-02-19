import React, { useRef } from "react";

interface ControlsProps {
    playing: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    speed: number;
    loading: boolean;
    hasPlaylist: boolean;
    onTogglePlay: () => void;
    onSeek: (t: number) => void;
    onSetVolume: (v: number) => void;
    onToggleMute: () => void;
    onSetSpeed: (s: number) => void;
    onNext: () => void;
    onPrev: () => void;
    onOpenFile: () => void;
}

function formatTime(secs: number): string {
    if (!isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export const Controls: React.FC<ControlsProps> = ({
    playing,
    currentTime,
    duration,
    volume,
    muted,
    speed,
    loading,
    hasPlaylist,
    onTogglePlay,
    onSeek,
    onSetVolume,
    onToggleMute,
    onSetSpeed,
    onNext,
    onPrev,
    onOpenFile,
}) => {
    const seekRef = useRef<HTMLInputElement>(null);
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="controls">
            {/* Seek bar */}
            <div className="seek-bar">
                <span className="seek-bar__time">{formatTime(currentTime)}</span>
                <div className="seek-bar__track">
                    <div className="seek-bar__fill" style={{ width: `${progress}%` }} />
                    <input
                        ref={seekRef}
                        type="range"
                        className="seek-bar__input"
                        min={0}
                        max={duration || 100}
                        step={0.5}
                        value={currentTime}
                        aria-label="Seek"
                        onChange={(e) => onSeek(Number(e.target.value))}
                    />
                </div>
                <span className="seek-bar__time">{formatTime(duration)}</span>
            </div>

            {/* Main controls row */}
            <div className="controls__row">
                {/* Left: open file */}
                <div className="controls__side controls__side--left">
                    <button
                        className="ctrl-btn ctrl-btn--icon"
                        onClick={onOpenFile}
                        title="Open file(s) (Ctrl+Shift+O)"
                        aria-label="Open file"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            <line x1="12" y1="11" x2="12" y2="17" />
                            <polyline points="9 14 12 11 15 14" />
                        </svg>
                    </button>
                </div>

                {/* Center: prev, play/pause, next */}
                <div className="controls__center">
                    <button
                        className="ctrl-btn"
                        onClick={onPrev}
                        disabled={!hasPlaylist}
                        title="Previous (P)"
                        aria-label="Previous"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="19 20 9 12 19 4 19 20" />
                            <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth={2} />
                        </svg>
                    </button>

                    <button
                        className={`ctrl-btn ctrl-btn--play ${loading ? "ctrl-btn--loading" : ""}`}
                        onClick={onTogglePlay}
                        title="Play/Pause (Space)"
                        aria-label={playing ? "Pause" : "Play"}
                    >
                        {loading ? (
                            <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <circle cx={12} cy={12} r={10} opacity={0.25} />
                                <path d="M22 12a10 10 0 0 1-10 10" />
                            </svg>
                        ) : playing ? (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        )}
                    </button>

                    <button
                        className="ctrl-btn"
                        onClick={onNext}
                        disabled={!hasPlaylist}
                        title="Next (N)"
                        aria-label="Next"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 4 15 12 5 20 5 4" />
                            <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth={2} />
                        </svg>
                    </button>
                </div>

                {/* Right: volume + speed */}
                <div className="controls__side controls__side--right">
                    <button
                        className="ctrl-btn ctrl-btn--icon"
                        onClick={onToggleMute}
                        title="Mute (M)"
                        aria-label={muted ? "Unmute" : "Mute"}
                    >
                        {muted || volume === 0 ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                        ) : volume < 0.5 ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        )}
                    </button>

                    <input
                        type="range"
                        className="volume-slider"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        aria-label="Volume"
                        onChange={(e) => onSetVolume(Number(e.target.value))}
                        style={{ "--vol": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
                    />

                    <select
                        className="speed-select"
                        value={speed}
                        aria-label="Playback speed"
                        onChange={(e) => onSetSpeed(Number(e.target.value))}
                    >
                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                            <option key={s} value={s}>{s}×</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
