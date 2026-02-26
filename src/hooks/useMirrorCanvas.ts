import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DISPLAY_W = 480;
const DISPLAY_H = 720;
const MAX_DELAY = 60;

/**
 * Reads from the shared ring buffer (produced by useSelfieSegmentation)
 * at `delay` frames behind the current frame, and exposes a CanvasTexture
 * that Three.js can sample.
 *
 * @param ringRef       Shared ring buffer ref from useSelfieSegmentation
 * @param frameIndexRef Current write head ref
 * @param isReady       Whether the segmenter is initialised
 * @param delay         How many frames behind to display (0 = live, 24 = ~0.4 s lag at 60 fps)
 */
export function useMirrorCanvas(
    ringRef: React.RefObject<(ImageData | null)[]>,
    frameIndexRef: React.RefObject<number>,
    isReady: boolean,
    delay: number,
) {
    // Each mirror owns its own canvas + ctx
    // NOTE: useRef does NOT accept a lazy initializer — pass the value directly
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [canvasTex, setCanvasTex] = useState<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        if (!isReady) return;
        canvasRef.current.width = DISPLAY_W;
        canvasRef.current.height = DISPLAY_H;
        ctxRef.current = canvasRef.current.getContext('2d');
        const tex = new THREE.CanvasTexture(canvasRef.current);
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        setCanvasTex(tex);
        return () => tex.dispose();
    }, [isReady]);

    // Each frame: pull the correct delayed frame from the shared ring buffer
    useFrame(() => {
        if (!ctxRef.current || !canvasTex) return;

        const ring = ringRef.current;
        const head = frameIndexRef.current;
        const clampedDelay = Math.min(delay, MAX_DELAY - 1);

        // Index of the frame we want: head - delay - 1 (wrapping)
        const targetIdx = ((head - clampedDelay - 1) % MAX_DELAY + MAX_DELAY) % MAX_DELAY;
        const frame = ring[targetIdx];

        if (frame) {
            ctxRef.current.clearRect(0, 0, DISPLAY_W, DISPLAY_H);
            ctxRef.current.putImageData(frame, 0, 0);
            canvasTex.needsUpdate = true;
        }
    });

    return canvasTex;
}
