import React from "react";
import type { Track } from "../hooks/usePlayer";

interface TrackInfoProps {
    track: Track | null;
    playing: boolean;
}

/** Deterministic solid color from a track name — no gradients */
function solidColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = ((hash >>> 0) % 360);
    return `hsl(${hue}, 40%, 28%)`;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, playing }) => {
    const bg = track
        ? track.artwork
            ? undefined                   // image handles the background
            : solidColor(track.name)
        : "hsl(230, 25%, 14%)";           // empty state

    return (
        <div className="track-info">
            <div
                className={`album-art ${playing ? "album-art--playing" : ""}`}
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
                    <>
                        <div className="album-art__icon">
                            {track.type === "video" ? "🎬" : "🎵"}
                        </div>
                        {playing && (
                            <div className="equalizer" aria-hidden="true">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="equalizer__bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="album-art__icon album-art__icon--empty">♫</div>
                )}
            </div>

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
