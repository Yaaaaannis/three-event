import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import OverlayUI from './components/ui/OverlayUI'
import SceneManager from './components/canvas/SceneManager'
import Effects from './components/canvas/Effects'
import { useStore } from './store/useStore'

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black fixed inset-0">
      {/* 1. Interface HTML 2D "Paper White" (Z-Index élevé) */}
      <OverlayUI />

      {/* 2. Rendu 3D R3F */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ alpha: false, antialias: false }} // antialias géré par post-process
        className="absolute top-0 left-0 w-full h-full z-0"
      >
        <Suspense fallback={null}>
          <SceneManager />
          <Effects />
        </Suspense>
      </Canvas>
    </div>
  )
}
