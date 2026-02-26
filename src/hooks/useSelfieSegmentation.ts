import { useEffect, useRef, useState } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';

// Display canvas aspect: 2:3 (portrait, matching the 3D mirror plane)
const DISPLAY_W = 480;
const DISPLAY_H = 720;

// Maximum ring buffer size — supports delays up to this many frames
const MAX_DELAY = 60;

export function useSelfieSegmentation(videoRef: React.RefObject<HTMLVideoElement | null>) {
    const segmenterRef = useRef<ImageSegmenter | null>(null);

    // Intermediate canvases at MediaPipe's output resolution
    const compositeCanvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const maskCanvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));

    const [isReady, setIsReady] = useState(false);
    const requestRef = useRef<number>(0);

    // ── Shared ring buffer — all mirrors read from this at their own offset ──
    const ringRef = useRef<(ImageData | null)[]>(Array(MAX_DELAY).fill(null));
    const frameIndexRef = useRef<number>(0);

    useEffect(() => {
        let active = true;

        async function initMediaPipe() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                );
                const segmenter = await ImageSegmenter.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: '/models/selfie_segmenter.tflite',
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    outputCategoryMask: true,
                    outputConfidenceMasks: false
                });
                if (!active) { segmenter.close(); return; }
                segmenterRef.current = segmenter;
                setIsReady(true);
                console.log("[MediaPipe] Segmenter ready");
            } catch (err) {
                console.error("[MediaPipe] Init failed:", err);
            }
        }
        initMediaPipe();

        return () => {
            active = false;
            segmenterRef.current?.close();
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isReady || !videoRef.current) return;

        const video = videoRef.current;
        let active = true;

        // Reusable snap canvas (avoid allocating one per frame)
        const snap = document.createElement('canvas');
        snap.width = DISPLAY_W;
        snap.height = DISPLAY_H;
        const snapCtx = snap.getContext('2d')!;

        const startSegmentation = () => {
            let lastVideoTime = -1;

            const processVideo = () => {
                if (!active || !segmenterRef.current) return;

                if (video.currentTime !== lastVideoTime) {
                    lastVideoTime = video.currentTime;
                    try {
                        segmenterRef.current.segmentForVideo(video, performance.now(), (result) => {
                            if (!result.categoryMask || !active) return;

                            const { width: mw, height: mh } = result.categoryMask;
                            const comp = compositeCanvas.current;
                            const mask = maskCanvas.current;

                            if (comp.width !== mw || comp.height !== mh) {
                                comp.width = mw; comp.height = mh;
                                mask.width = mw; mask.height = mh;
                            }

                            // 1. Build binary mask
                            const catArr = result.categoryMask.getAsUint8Array();
                            const rgba = new Uint8ClampedArray(mw * mh * 4);
                            for (let y = 0; y < mh; y++) {
                                for (let x = 0; x < mw; x++) {
                                    const srcI = y * mw + (mw - 1 - x);
                                    const dstI = y * mw + x;
                                    const o = dstI * 4;
                                    rgba[o] = rgba[o + 1] = rgba[o + 2] = 255;
                                    rgba[o + 3] = catArr[srcI] === 0 ? 255 : 0;
                                }
                            }
                            mask.getContext('2d')!.putImageData(new ImageData(rgba, mw, mh), 0, 0);

                            // 2. Composite: mask → source-in → mirrored video
                            const compCtx = comp.getContext('2d')!;
                            compCtx.save();
                            compCtx.clearRect(0, 0, mw, mh);
                            compCtx.drawImage(mask, 0, 0);
                            compCtx.globalCompositeOperation = 'source-in';
                            compCtx.scale(-1, 1);
                            compCtx.drawImage(video, -mw, 0, mw, mh);
                            compCtx.restore();

                            // 3. Crop to portrait 2:3 into snap canvas
                            const scale = DISPLAY_H / mh;
                            const scaledW = mw * scale;
                            const sx = (scaledW - DISPLAY_W) / 2 / scale;
                            const sw = DISPLAY_W / scale;
                            snapCtx.clearRect(0, 0, DISPLAY_W, DISPLAY_H);
                            snapCtx.drawImage(comp, sx, 0, sw, mh, 0, 0, DISPLAY_W, DISPLAY_H);

                            // 4. Push current frame into shared ring buffer
                            const idx = frameIndexRef.current;
                            ringRef.current[idx % MAX_DELAY] = snapCtx.getImageData(0, 0, DISPLAY_W, DISPLAY_H);
                            frameIndexRef.current = idx + 1;

                            result.categoryMask.close();
                        });
                    } catch (e) {
                        console.error("[MediaPipe] Segmentation error", e);
                    }
                }
                requestRef.current = requestAnimationFrame(processVideo);
            };
            processVideo();
        };

        if (video.readyState < 2) {
            const onPlaying = () => { startSegmentation(); video.removeEventListener('playing', onPlaying); };
            video.addEventListener('playing', onPlaying);
            return () => { active = false; cancelAnimationFrame(requestRef.current); };
        }
        startSegmentation();

        return () => { active = false; cancelAnimationFrame(requestRef.current); };
    }, [isReady, videoRef]);

    return { ringRef, frameIndexRef, isReady };
}
