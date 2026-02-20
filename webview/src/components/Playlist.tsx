import React, { useCallback, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { Track } from "../hooks/usePlayer";
import type { RepeatMode } from "../hooks/usePlayer";

const ITEM_TYPE = "TRACK";

interface DragItem {
    index: number;
    id: string;
}

interface DraggableTrackItemProps {
    track: Track;
    index: number;
    isActive: boolean;
    onSelect: () => void;
    onRemove: () => void;
    onMove: (from: number, to: number) => void;
}

const DraggableTrackItem: React.FC<DraggableTrackItemProps> = ({
    track,
    index,
    isActive,
    onSelect,
    onRemove,
    onMove,
}) => {
    const ref = useRef<HTMLLIElement>(null);

    const [{ isDragging }, drag, preview] = useDrag<DragItem, unknown, { isDragging: boolean }>({
        type: ITEM_TYPE,
        item: { index, id: track.id },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });

    const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>({
        accept: ITEM_TYPE,
        collect: (monitor) => ({ isOver: monitor.isOver() }),
        hover(item) {
            if (item.index === index) return;
            onMove(item.index, index);
            item.index = index;
        },
    });

    // preview + drop on the whole row; drag only from handle
    preview(drop(ref));

    return (
        <li
            ref={ref}
            className={[
                "playlist__item",
                isActive ? "playlist__item--active" : "",
                isDragging ? "playlist__item--dragging" : "",
                isOver ? "playlist__item--over" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            role="option"
            aria-selected={isActive}
            onClick={onSelect}
        >
            {/* Drag handle */}
            <span
                ref={drag as unknown as React.RefObject<HTMLSpanElement>}
                className="playlist__drag-handle"
                title="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
            >
                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                </svg>
            </span>

            <span className="playlist__item-icon">
                {isActive ? (
                    <span className="playlist__now-playing" aria-label="Now playing">▶</span>
                ) : (
                    <span className="playlist__index">{index + 1}</span>
                )}
            </span>

            <span className="playlist__item-name" title={track.title && track.artist ? `${track.artist} - ${track.title}` : track.title ?? track.name}>
                {track.title && track.artist ? `${track.artist} - ${track.title}` : track.title ?? track.name}
            </span>

            <span className="playlist__item-type">
                {track.type === "video" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                    </svg>
                )}
            </span>

            <button
                className="playlist__remove"
                aria-label={`Remove ${track.name}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </li>
    );
};

// ── Repeat icon ──────────────────────────────────────────────
const RepeatIcon: React.FC<{ mode: RepeatMode }> = ({ mode }) => {
    if (mode === "one") {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                <text x="10" y="14" fontSize="6" fill="currentColor" stroke="none" fontWeight="700">1</text>
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
    );
};

// ── Shuffle icon ─────────────────────────────────────────────
const ShuffleIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
);

// ── Playlist component ───────────────────────────────────────
interface PlaylistProps {
    tracks: Track[];
    currentIndex: number;
    shuffle: boolean;
    repeatMode: RepeatMode;
    onSelect: (index: number) => void;
    onRemove: (id: string) => void;
    onAddFiles: () => void;
    onToggleShuffle: () => void;
    onCycleRepeat: () => void;
    onReorder: (from: number, to: number) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
    tracks,
    currentIndex,
    shuffle,
    repeatMode,
    onSelect,
    onRemove,
    onAddFiles,
    onToggleShuffle,
    onCycleRepeat,
    onReorder,
}) => {
    const dropRef = useRef<HTMLDivElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        // Only handle file drags (not DnD reorder drags)
        if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            dropRef.current?.classList.add("playlist__drop--active");
        }
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
            const mapped = files.map((f) => ({
                name: f.name,
                url: URL.createObjectURL(f),
            }));
            const ev = new CustomEvent("player:addFiles", { detail: mapped });
            window.dispatchEvent(ev);
        },
        []
    );

    return (
        <DndProvider backend={HTML5Backend}>
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

                    <div className="playlist__header-actions">
                        {/* Shuffle */}
                        <button
                            className={`ctrl-btn ctrl-btn--sm ${shuffle ? "ctrl-btn--active" : ""}`}
                            onClick={onToggleShuffle}
                            title={shuffle ? "Shuffle: on (click to disable)" : "Shuffle: off"}
                            aria-label="Toggle shuffle"
                            aria-pressed={shuffle}
                        >
                            <ShuffleIcon />
                        </button>

                        {/* Repeat */}
                        <button
                            className={`ctrl-btn ctrl-btn--sm ${repeatMode !== "off" ? "ctrl-btn--active" : ""}`}
                            onClick={onCycleRepeat}
                            title={
                                repeatMode === "off" ? "Repeat: off" :
                                    repeatMode === "all" ? "Repeat: all" : "Repeat: one"
                            }
                            aria-label="Cycle repeat mode"
                        >
                            <RepeatIcon mode={repeatMode} />
                            {repeatMode === "one" && (
                                <span className="playlist__mode-badge">1</span>
                            )}
                        </button>

                        {/* Add files */}
                        <button
                            className="ctrl-btn ctrl-btn--sm"
                            onClick={onAddFiles}
                            title="Add files"
                            aria-label="Add files"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {tracks.length === 0 ? (
                    <div className="playlist__empty">
                        <p>Drop media files here</p>
                        <p className="playlist__empty-sub">or click + to add files</p>
                    </div>
                ) : (
                    <ul className="playlist__list" role="listbox" aria-label="Playlist">
                        {tracks.map((track, idx) => (
                            <DraggableTrackItem
                                key={track.id}
                                track={track}
                                index={idx}
                                isActive={idx === currentIndex}
                                onSelect={() => onSelect(idx)}
                                onRemove={() => onRemove(track.id)}
                                onMove={onReorder}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </DndProvider>
    );
};
