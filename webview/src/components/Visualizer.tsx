import React, { useRef, useEffect, useState } from "react";
import { useVisualizer } from "../hooks/useVisualizer";

interface VisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playing: boolean;
    isAudio: boolean;
}

/** Resolve a CSS custom property — checks body first (VS Code injects there), then :root */
function resolveCssVar(...varNames: string[]): string {
    const bodyStyle = getComputedStyle(document.body);
    const rootStyle = getComputedStyle(document.documentElement);
    for (const name of varNames) {
        const fromBody = bodyStyle.getPropertyValue(name).trim();
        if (fromBody) return fromBody;
        const fromRoot = rootStyle.getPropertyValue(name).trim();
        if (fromRoot) return fromRoot;
    }
    return "";
}

export const Visualizer: React.FC<VisualizerProps> = ({
    audioRef,
    playing,
    isAudio,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [colors, setColors] = useState({ bar: "#a78bfa", peak: "#ffffff" });
    useEffect(() => {
        // VS Code injects --vscode-* vars onto document.body.
        // Fall back through progressBar, focusBorder, then the app's own --accent.
        const bar =
            resolveCssVar(
                "--vscode-button-background",
                "--vscode-progressBar-background",
                "--vscode-focusBorder",
                "--accent"
            ) || "#a78bfa";

        const peak =
            resolveCssVar(
                "--vscode-editor-foreground",
                "--vscode-foreground"
            ) || "#ffffff";

        setColors({ bar, peak });
    }, []);

    useVisualizer(audioRef, canvasRef, playing && isAudio, {
        barCount: 8,
        color: colors.bar,
        peakColor: colors.peak,
    });

    if (!isAudio) return null;

    return (
        <div className="visualizer">
            <canvas ref={canvasRef} className="visualizer__canvas" aria-hidden="true" />
        </div>
    );
};
