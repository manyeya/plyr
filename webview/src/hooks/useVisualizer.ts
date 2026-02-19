import { useRef, useEffect, useCallback } from "react";

interface VisualizerOptions {
    barCount?: number;
    color?: string;
    peakColor?: string;
}

const PEAK_HOLD_FRAMES = 20;  // frames to hold peak before it drops
const PEAK_DROP_SPEED = 1.5;  // px per frame

export function useVisualizer(
    audioRef: React.RefObject<HTMLAudioElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    playing: boolean,
    options: VisualizerOptions = {}
) {
    const { barCount = 8, color = "#a78bfa", peakColor = "#ffffff" } = options;

    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number>(0);
    const dataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0) as Uint8Array<ArrayBuffer>);
    const lastFrameRef = useRef<number>(0);

    // Peak tracking: [peakHeight, holdFrames]
    const peaksRef = useRef<Array<[number, number]>>(
        Array.from({ length: barCount }, () => [0, 0])
    );

    const setup = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || sourceRef.current) return;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        sourceRef.current = source;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;                  // smallest useful size for 8 bars
        analyser.smoothingTimeConstant = 0.82;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

        // Reset peaks when a new audio context is set up
        peaksRef.current = Array.from({ length: barCount }, () => [0, 0]);

        source.connect(analyser);
        analyser.connect(ctx.destination);
    }, [audioRef, barCount]);

    const draw = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        // Throttle to ~30 fps
        if (timestamp - lastFrameRef.current < 33) {
            rafRef.current = requestAnimationFrame(draw);
            return;
        }
        lastFrameRef.current = timestamp;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        analyser.getByteFrequencyData(dataRef.current);
        ctx.clearRect(0, 0, W, H);

        const gap = Math.floor(W * 0.04);           // 4% of width as gap
        const barWidth = Math.floor((W - gap * (barCount - 1)) / barCount);
        const radius = Math.min(barWidth / 2, 6);

        for (let i = 0; i < barCount; i++) {
            const dataIdx = Math.floor((i / barCount) * dataRef.current.length);
            const value = dataRef.current[dataIdx] / 255;
            const barH = Math.max(radius * 2, value * H * 0.88);
            const x = i * (barWidth + gap);
            const y = H - barH;

            // Update peak
            const peak = peaksRef.current[i];
            if (barH >= peak[0]) {
                peak[0] = barH;
                peak[1] = PEAK_HOLD_FRAMES;
            } else {
                if (peak[1] > 0) {
                    peak[1]--;
                } else {
                    peak[0] = Math.max(0, peak[0] - PEAK_DROP_SPEED);
                }
            }

            // Bar gradient — top is semi-transparent, bottom is solid
            const grad = ctx.createLinearGradient(x, y, x, H);
            grad.addColorStop(0, color + "99");
            grad.addColorStop(1, color + "ff");

            // Rounded-rectangle bar
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, H);
            ctx.lineTo(x, H);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Peak line — 2px tall, slightly inset
            const peakY = H - peak[0];
            if (peak[0] > radius * 2) {
                ctx.fillStyle = peakColor + "cc";
                ctx.fillRect(x + 2, peakY - 2, barWidth - 4, 2);
            }
        }

        rafRef.current = requestAnimationFrame(draw);
    }, [canvasRef, barCount, color, peakColor]);

    const drawIdle = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const W = canvas.width;
        const H = canvas.height;
        const gap = Math.floor(W * 0.04);
        const barWidth = Math.floor((W - gap * (barCount - 1)) / barCount);
        const radius = Math.min(barWidth / 2, 6);
        for (let i = 0; i < barCount; i++) {
            const barH = radius * 2;
            const x = i * (barWidth + gap);
            const y = H - barH;
            ctx.fillStyle = color + "30";
            ctx.beginPath();
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
    }, [canvasRef, barCount, color]);

    useEffect(() => {
        if (playing) {
            if (audioCtxRef.current?.state === "suspended") {
                audioCtxRef.current.resume();
            }
            setup();
            rafRef.current = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(rafRef.current);
            drawIdle();
        }
        return () => cancelAnimationFrame(rafRef.current);
    }, [playing, draw, drawIdle, setup]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ro = new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            if (!playing) drawIdle();
        });
        ro.observe(canvas);
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        return () => ro.disconnect();
    }, [canvasRef, playing, drawIdle]);
}
