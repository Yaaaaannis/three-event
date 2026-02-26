import React from 'react'
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing'

export default function Effects() {
    return (
        <EffectComposer enableNormalPass={false}>
            <Bloom
                luminanceThreshold={0.5}
                luminanceSmoothing={0.9}
                intensity={0.8}
                mipmapBlur
            />
            <Noise opacity={0.3} />
        </EffectComposer>
    )
}
