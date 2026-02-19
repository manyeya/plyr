import { useRef, useEffect, useCallback } from "react";

interface VisualizerOptions {
    barCount?: number;
    color?: string;
    glowColor?: string;
}

export function useVisualizer(
    audioRef: React.RefObject<HTMLAudioElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    playing: boolean,
    options: VisualizerOptions = {}
) {
    const { barCount = 80, color = "#a78bfa", glowColor = "#7c3aed" } = options;
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number>(0);

    const setup = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || sourceRef.current) return;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        sourceRef.current = source;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(ctx.destination);
    }, [audioRef]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        ctx.clearRect(0, 0, W, H);

        const barWidth = (W / barCount) * 0.7;
        const gap = (W / barCount) * 0.3;

        for (let i = 0; i < barCount; i++) {
            const dataIdx = Math.floor((i / barCount) * data.length);
            const value = data[dataIdx] / 255;
            const barH = value * H * 0.85;

            const x = i * (barWidth + gap);
            const y = H - barH;

            // Gradient per bar
            const gradient = ctx.createLinearGradient(x, H, x, y);
            gradient.addColorStop(0, glowColor + "ff");
            gradient.addColorStop(0.5, color + "cc");
            gradient.addColorStop(1, color + "44");

            ctx.shadowBlur = 8;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = gradient;

            // Rounded top
            ctx.beginPath();
            const radius = Math.min(barWidth / 2, 3);
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, H);
            ctx.lineTo(x, H);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }

        rafRef.current = requestAnimationFrame(draw);
    }, [canvasRef, barCount, color, glowColor]);

    useEffect(() => {
        if (playing) {
            if (audioCtxRef.current?.state === "suspended") {
                audioCtxRef.current.resume();
            }
            setup();
            rafRef.current = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(rafRef.current);
            // Draw idle bars
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const barWidth = (canvas.width / barCount) * 0.7;
                    const gap = (canvas.width / barCount) * 0.3;
                    for (let i = 0; i < barCount; i++) {
                        const x = i * (barWidth + gap);
                        const barH = 3 + Math.sin(i * 0.4) * 2;
                        ctx.fillStyle = color + "33";
                        ctx.fillRect(x, canvas.height - barH, barWidth, barH);
                    }
                }
            }
        }
        return () => cancelAnimationFrame(rafRef.current);
    }, [playing, draw, setup, canvasRef, barCount, color]);

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ro = new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        });
        ro.observe(canvas);
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        return () => ro.disconnect();
    }, [canvasRef]);
}
