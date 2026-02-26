import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSelfieSegmentation } from '../../hooks/useSelfieSegmentation'
import forestSrc from '../../assets/forest.webm'

// ── Distortion shader ──────────────────────────────────────────────────────────
const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform sampler2D uTex;
  uniform float     uTime;
  varying vec2      vUv;

  // Pseudo-random hash
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // ── 1. Subtle organic warp ───────────────────────────────────────
    float warp = sin(uv.y * 14.0 + uTime * 1.1) * 0.005
               + sin(uv.x * 9.0  + uTime * 0.8) * 0.003;
    uv.x += warp;
    uv.y += sin(uv.x * 11.0 + uTime * 1.4) * 0.003;

    // ── 2. Chromatic aberration (stronger at edges) ──────────────────
    float dist  = length(vUv - 0.5);
    float aberr = dist * 0.028;
    float r = texture2D(uTex, uv + vec2( aberr,  0.0 )).r;
    float g = texture2D(uTex, uv                      ).g;
    float b = texture2D(uTex, uv - vec2( aberr,  0.0 )).b;
    float a = texture2D(uTex, uv                      ).a;
    vec3 color = vec3(r, g, b);

    // ── 3. Color grade: Twin Peaks palette ──────────────────────────
    //    cool blue-purple shadows, warm amber/red highlights
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 coolShadow = vec3(0.65, 0.75, 1.10); // cold midnight blue
    vec3 warmLight  = vec3(1.10, 0.90, 0.70); // amber fire
    color *= mix(coolShadow, warmLight, lum);

    // Slight desaturation (0 = grey, 1 = full color)
    color = mix(vec3(lum), color, 0.75);

    // Contrast crush (dark blacks, blown whites)
    color = (color - 0.45) * 1.45 + 0.45;

    // ── 4. Vignette — darkness pooling at edges like black oil ───────
    float vig = smoothstep(0.85, 0.18, dist);         // soft fall-off
    float corner = 1.0 - pow(dist * 1.4, 3.0) * 0.6; // extra corner crush
    color *= vig * corner;

    // ── 5. CRT Scanlines ─────────────────────────────────────────────
    float scan = sin(vUv.y * 700.0) * 0.025;
    color -= scan;

    // ── 6. Film grain (changes every frame via uTime) ─────────────────
    float grain = (hash(vUv + fract(uTime * 0.07)) - 0.5) * 0.10;
    color += grain;

    // ── 7. Luminance flicker (random per ~8 frames) ───────────────────
    float flicker = 1.0 + (hash(vec2(floor(uTime * 12.0), 0.5)) - 0.5) * 0.06;
    color *= flicker;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), a);
  }
`

export default function Mirror({ position = [0, 2, 0] }: { position?: [number, number, number] }) {
    const videoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        const video = document.createElement('video')
        video.autoplay = true
        video.muted = true
        video.playsInline = true
        videoRef.current = video

        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then((stream) => {
                video.srcObject = stream
                video.addEventListener('playing', () => { }, { once: true })
                video.play()
            })
            .catch((err) => console.error('Webcam error', err))

        return () => {
            if (video.srcObject)
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        }
    }, [])

    const { canvasRef, isReady } = useSelfieSegmentation(videoRef)

    // — Forest background video texture —
    const [forestTexture, setForestTexture] = useState<THREE.VideoTexture | null>(null)
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
        setForestTexture(tex)
        return () => { vid.pause(); tex.dispose() }
    }, [])

    const [canvasTexture, setCanvasTexture] = useState<THREE.CanvasTexture | null>(null)

    useEffect(() => {
        if (!isReady || !canvasRef.current) return
        const tex = new THREE.CanvasTexture(canvasRef.current)
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        setCanvasTexture(tex)
        return () => tex.dispose()
    }, [isReady])

    const uniforms = useMemo(() => ({
        uTex: { value: null as THREE.Texture | null },
        uTime: { value: 0 }
    }), [])

    const shaderRef = useRef<THREE.ShaderMaterial>(null)

    useFrame(({ clock }) => {
        if (canvasTexture) {
            canvasTexture.needsUpdate = true
        }
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = clock.getElapsedTime()
            if (canvasTexture && !shaderRef.current.uniforms.uTex.value) {
                shaderRef.current.uniforms.uTex.value = canvasTexture
            }
        }
    })

    return (
        <group position={position}>
            {/* Mirror frame */}
            <mesh position={[0, 0, -0.05]}>
                <boxGeometry args={[2.2, 3.2, 0.1]} />
                <meshStandardMaterial color="#222" metalness={1} roughness={0.1} />
            </mesh>

            {/* Forest video background */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2, 3]} />
                {forestTexture
                    ? <meshBasicMaterial map={forestTexture} />
                    : <meshStandardMaterial color="#111" />
                }
            </mesh>

            {/* Distorted person overlay */}
            {canvasTexture && (
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[2, 3]} />
                    <shaderMaterial
                        ref={shaderRef}
                        vertexShader={vertexShader}
                        fragmentShader={fragmentShader}
                        uniforms={{ ...uniforms, uTex: { value: canvasTexture } }}
                        transparent
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    )
}
