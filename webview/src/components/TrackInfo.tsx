import React from "react";
import type { Track } from "../hooks/usePlayer";

interface TrackInfoProps {
    track: Track | null;
    playing: boolean;
    enableShadows?: boolean;
    artworkShape?: "square" | "circle";
}


export const TrackInfo: React.FC<TrackInfoProps> = ({
    track,
    playing,
    enableShadows = true,
    artworkShape = "square"
}) => {
    const bg = track?.artwork ? undefined : "var(--surface)";

    const showPreview = track?.type !== "video"; // hide preview for video types

    return (
        <div className="track-info">
            {showPreview && (
                <div
                    className={`album-art ${playing ? "album-art--playing" : ""} ${artworkShape === "circle" ? "album-art--circle" : ""} ${!enableShadows ? "album-art--no-shadow" : ""}`}
                    style={{ background: bg }}
                    aria-label="Album art"
                >
                    {track?.artwork ? (
                        // Actual embedded cover art
                        <img
                            src={track.artwork}
                            alt="Album art"
                            className="album-art__img"
                            draggable={false}
                        />
                    ) : track ? (
                        <div className="album-art__icon">
                            {track.type === "video" ? (
                                // Film icon
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                                    <line x1="7" y1="2" x2="7" y2="22" />
                                    <line x1="17" y1="2" x2="17" y2="22" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <line x1="2" y1="7" x2="7" y2="7" />
                                    <line x1="2" y1="17" x2="7" y2="17" />
                                    <line x1="17" y1="17" x2="22" y2="17" />
                                    <line x1="17" y1="7" x2="22" y2="7" />
                                </svg>
                            ) : (
                                // Music note icon
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18V5l12-2v13" />
                                    <circle cx="6" cy="18" r="3" />
                                    <circle cx="18" cy="16" r="3" />
                                </svg>
                            )}
                        </div>
                    ) : (
                        <div className="album-art__icon album-art__icon--empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>
                    )}

                </div>
            )}

            <div className="track-meta">
                <p className="track-meta__title" title={track?.title ?? track?.name ?? "No track loaded"}>
                    {track?.title ?? track?.name ?? "No track loaded"}
                </p>
                {track?.artist && <p className="track-meta__artist" title={track.artist}>{track.artist}</p>}
                <p className="track-meta__type">
                    {track
                        ? track.type === "video"
                            ? "Video"
                            : "Audio"
                        : "Open a file to begin"}
                </p>
            </div>
        </div>
    );
};
