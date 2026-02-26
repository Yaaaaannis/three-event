import { useRef, useEffect, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useSelfieSegmentation } from '../../hooks/useSelfieSegmentation'
import { useMirrorCanvas } from '../../hooks/useMirrorCanvas'
import forestSrc from '../../assets/forest.webm'
import BreachPlane from './BreachPlane'
import RedRoom from './RedRoom'
import Mirror from './Mirror'

// ── SceneManager ──────────────────────────────────────────────────────────────
// Owns all shared heavy resources (webcam stream, MediaPipe segmenter,
// forest video). Each mirror gets its own delayed canvas texture via
// useMirrorCanvas — all reading from the same ring buffer, zero extra ML cost.
// ─────────────────────────────────────────────────────────────────────────────
export default function SceneManager() {
    // ── 1. Webcam (single stream) ─────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        const video = document.createElement('video')
        video.autoplay = true
        video.muted = true
        video.playsInline = true
        videoRef.current = video

        navigator.mediaDevices
            .getUserMedia({ video: { width: 640, height: 480 } })
            .then((stream) => {
                video.srcObject = stream
                video.play()
            })
            .catch((err) => console.error('[SceneManager] Webcam error', err))

        return () => {
            if (video.srcObject)
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        }
    }, [])

    // ── 2. MediaPipe segmentation (single instance) → shared ring buffer ──────
    const { ringRef, frameIndexRef, isReady } = useSelfieSegmentation(videoRef)

    // ── 3. Per-mirror canvas textures — each reads the ring at its own delay ──
    //   delay=0  → live (no lag)
    //   delay=20 → ~0.33 s lag at 60 fps
    //   delay=45 → ~0.75 s lag at 60 fps
    const canvasTexCenter = useMirrorCanvas(ringRef, frameIndexRef, isReady, 12)
    const canvasTexLeft = useMirrorCanvas(ringRef, frameIndexRef, isReady, 24)
    const canvasTexRight = useMirrorCanvas(ringRef, frameIndexRef, isReady, 45)

    // ── 4. Forest background video (single decode, shared) ────────────────────
    const [forestTex, setForestTex] = useState<THREE.VideoTexture | null>(null)

    useEffect(() => {
        const vid = document.createElement('video')
        vid.src = forestSrc
        vid.loop = true
        vid.muted = true
        vid.playsInline = true
        vid.autoplay = true
        vid.play().catch(() => { })
        const tex = new THREE.VideoTexture(vid)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        setForestTex(tex)
        return () => { vid.pause(); tex.dispose() }
    }, [])

    return (
        <>
            <OrbitControls
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI / 2.5}
                maxPolarAngle={Math.PI / 2}
                minAzimuthAngle={-0.2}
                maxAzimuthAngle={0.2}
                dampingFactor={0.05}
            />

            {/*
              Le BreachPlane se tient devant la caméra
              Il masque la scène tant que isBreached/breachProgress n'est pas rempli
            */}
            <BreachPlane />

            <group position={[0, -0.2, -3]}>
                <RedRoom />

                {/* Grand miroir central — live (delay 0) */}
                <Mirror
                    position={[0, 1.4, 0]}
                    size={[2, 3]}
                    canvasTex={canvasTexCenter}
                    forestTex={forestTex}
                />

                {/* Petit miroir gauche — ~0.33 s de retard */}
                <Mirror
                    position={[-2.8, 0.8, -0.3]}
                    rotation={[0, Math.PI * 0.4, -Math.PI * 0.2]}
                    size={[1.2, 1.8]}
                    canvasTex={canvasTexLeft}
                    forestTex={forestTex}
                />

                {/* Miroir fin droite — ~0.75 s de retard */}
                <Mirror
                    position={[2.6, 1.6, -0.2]}
                    rotation={[-Math.PI * 0.1, -Math.PI * 0.3, -Math.PI * 0.2]}
                    size={[1, 2.5]}
                    canvasTex={canvasTexRight}
                    forestTex={forestTex}
                />
            </group>
        </>
    )
}
