import React, { useCallback, useRef } from "react";
import type { Track } from "../hooks/usePlayer";

interface PlaylistProps {
    tracks: Track[];
    currentIndex: number;
    onSelect: (index: number) => void;
    onRemove: (id: string) => void;
    onAddFiles: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
    tracks,
    currentIndex,
    onSelect,
    onRemove,
    onAddFiles,
}) => {
    const dropRef = useRef<HTMLDivElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        dropRef.current?.classList.add("playlist__drop--active");
    }, []);

    const handleDragLeave = useCallback(() => {
        dropRef.current?.classList.remove("playlist__drop--active");
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            dropRef.current?.classList.remove("playlist__drop--active");
            const files = Array.from(e.dataTransfer.files).filter((f) =>
                /\.(mp3|mp4|wav|ogg|flac|aac|m4a|webm|mkv|avi|mov)$/i.test(f.name)
            );
            if (files.length === 0) return;
            // We can't use file paths directly from drag in webview context,
            // so we create blob URLs which the audio element can load
            const mapped = files.map((f) => ({
                name: f.name,
                url: URL.createObjectURL(f),
            }));
            // Dispatch to parent via custom event for simplicity
            const ev = new CustomEvent("player:addFiles", { detail: mapped });
            window.dispatchEvent(ev);
        },
        []
    );

    return (
        <div
            className="playlist"
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="playlist__header">
                <h3 className="playlist__title">
                    Playlist <span className="playlist__count">{tracks.length}</span>
                </h3>
                <button className="ctrl-btn ctrl-btn--sm" onClick={onAddFiles} title="Add files">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>

            {tracks.length === 0 ? (
                <div className="playlist__empty">
                    <p>Drop media files here</p>
                    <p className="playlist__empty-sub">or click + to add files</p>
                </div>
            ) : (
                <ul className="playlist__list" role="listbox" aria-label="Playlist">
                    {tracks.map((track, idx) => (
                        <li
                            key={track.id}
                            className={`playlist__item ${idx === currentIndex ? "playlist__item--active" : ""}`}
                            role="option"
                            aria-selected={idx === currentIndex}
                            onClick={() => onSelect(idx)}
                        >
                            <span className="playlist__item-icon">
                                {idx === currentIndex ? (
                                    <span className="playlist__now-playing" aria-label="Now playing">▶</span>
                                ) : (
                                    <span className="playlist__index">{idx + 1}</span>
                                )}
                            </span>
                            <span className="playlist__item-name" title={track.name}>
                                {track.name}
                            </span>
                            <span className="playlist__item-type">{track.type === "video" ? "🎬" : "🎵"}</span>
                            <button
                                className="playlist__remove"
                                aria-label={`Remove ${track.name}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(track.id);
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
