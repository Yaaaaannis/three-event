import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

// Un shader très basique pour l'instant
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uProgress;
  uniform vec2 uTouchPos;
  uniform float uTime;
  
  varying vec2 vUv;

  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    float dist = distance(vUv, uTouchPos);
    
    // Noise pour le bord
    float noise = random(vUv * 10.0 +  uTime * 0.1); 
    float currentRadius = (uProgress * 2.0) + (noise * 0.05);

    if (dist < currentRadius) {
      discard;
    }
    
    // Le papier de base (blanc cassé)
    vec3 color = vec3(0.95);
    
    // Bordure roussie
    float edgeThickness = 0.05;
    if (dist < currentRadius + edgeThickness) {
      float burnFactor = (dist - currentRadius) / edgeThickness;
      color = mix(vec3(1.0, 0.2, 0.0), color, burnFactor); // Rouge vif au bord
    }

    gl_FragColor = vec4(color, 1.0);
  }
`

export default function BreachPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (materialRef.current && meshRef.current) {
      const { breachProgress, touchPosition, isBreached } = useStore.getState()
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uProgress.value = breachProgress
      materialRef.current.uniforms.uTouchPos.value.set(touchPosition.x, touchPosition.y)

      // Hide the plane smoothly if breached, without unmounting it
      meshRef.current.visible = !isBreached
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 1]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uTouchPos: { value: new THREE.Vector2(0.5, 0.5) },
        }}
        transparent
      />
    </mesh>
  )
}
