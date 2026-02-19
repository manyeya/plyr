import React, { useRef } from "react";
import { useVisualizer } from "../hooks/useVisualizer";

interface VisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playing: boolean;
    isAudio: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({
    audioRef,
    playing,
    isAudio,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useVisualizer(audioRef, canvasRef, playing && isAudio, {
        barCount: 80,
        color: "#a78bfa",
        glowColor: "#7c3aed",
    });

    if (!isAudio) return null;

    return (
        <div className="visualizer">
            <canvas ref={canvasRef} className="visualizer__canvas" aria-hidden="true" />
        </div>
    );
};
