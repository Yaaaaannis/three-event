import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

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
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 coolShadow = vec3(0.65, 0.75, 1.10);
    vec3 warmLight  = vec3(1.10, 0.90, 0.70);
    color *= mix(coolShadow, warmLight, lum);

    // Slight desaturation
    color = mix(vec3(lum), color, 0.75);

    // Contrast crush
    color = (color - 0.45) * 1.45 + 0.45;

    // ── 4. Vignette ───────────────────────────────────────────────────
    float vig = smoothstep(0.85, 0.18, dist);
    float corner = 1.0 - pow(dist * 1.4, 3.0) * 0.6;
    color *= vig * corner;

    // ── 5. CRT Scanlines ─────────────────────────────────────────────
    float scan = sin(vUv.y * 700.0) * 0.025;
    color -= scan;

    // ── 6. Film grain ─────────────────────────────────────────────────
    float grain = (hash(vUv + fract(uTime * 0.07)) - 0.5) * 0.10;
    color += grain;

    // ── 7. Luminance flicker ──────────────────────────────────────────
    float flicker = 1.0 + (hash(vec2(floor(uTime * 12.0), 0.5)) - 0.5) * 0.06;
    color *= flicker;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), a);
  }
`

// ── Props ──────────────────────────────────────────────────────────────────────
interface MirrorProps {
  position?: [number, number, number]
  /** [width, height] of the mirror plane in world units. Default: [2, 3] */
  size?: [number, number]
  /** Segmented person canvas texture (shared, produced by SceneManager) */
  canvasTex: THREE.CanvasTexture | null
  /** Forest background video texture (shared, produced by SceneManager) */
  forestTex: THREE.VideoTexture | null
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Mirror({ position = [0, 2, 0], size = [2, 3], canvasTex, forestTex }: MirrorProps) {
  const [w, h] = size
  const shaderRef = useRef<THREE.ShaderMaterial>(null)

  // Each mirror gets its own uniforms object so uTime can differ per instance
  // (currently all sync'd, but allows future per-mirror FX easily)
  const uniforms = useMemo(() => ({
    uTex: { value: canvasTex ?? null },
    uTime: { value: 0 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []) // intentionally created once — texture ref updated imperatively below

  useFrame(({ clock }) => {
    if (!shaderRef.current) return
    shaderRef.current.uniforms.uTime.value = clock.getElapsedTime()
    // Keep the shared texture reference in sync (canvasTex may arrive after mount)
    if (canvasTex && shaderRef.current.uniforms.uTex.value !== canvasTex) {
      shaderRef.current.uniforms.uTex.value = canvasTex
    }
  })

  return (
    <group position={position}>
      {/* Mirror frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[w + 0.2, h + 0.2, 0.1]} />
        <meshStandardMaterial color="#222" metalness={1} roughness={0.1} />
      </mesh>

      {/* Forest video background */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[w, h]} />
        {forestTex
          ? <meshBasicMaterial map={forestTex} />
          : <meshStandardMaterial color="#111" />
        }
      </mesh>

      {/* Distorted person overlay */}
      {canvasTex && (
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[w, h]} />
          <shaderMaterial
            ref={shaderRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
