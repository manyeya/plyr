import React from "react";
import type { Track } from "../hooks/usePlayer";

interface TrackInfoProps {
    track: Track | null;
    playing: boolean;
}

function generateGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = hash & 0xff;
    const hue2 = (hue1 + 50) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 45%), hsl(${hue2}, 80%, 35%))`;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, playing }) => {
    return (
        <div className="track-info">
            <div
                className={`album-art ${playing ? "album-art--playing" : ""}`}
                style={{ background: track ? generateGradient(track.name) : "linear-gradient(135deg, #1a1a2e, #16213e)" }}
                aria-label="Album art"
            >
                {track ? (
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
                <p className="track-meta__title" title={track?.name ?? "No track loaded"}>
                    {track?.name ?? "No track loaded"}
                </p>
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
