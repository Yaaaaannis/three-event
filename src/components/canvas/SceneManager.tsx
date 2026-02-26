import React, { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import BreachPlane from './BreachPlane'
import RedRoom from './RedRoom'
import Pedestal from './Pedestal'
import Mirror from './Mirror'

export default function SceneManager() {
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
        Il masque la scène tant que isBreached/breachProgress nest pas rempli
      */}
            <BreachPlane />

            <group position={[0, -0.2, -3]}>
                <RedRoom />
                {/* <Pedestal position={[0, 0, 0]} /> */}
                <Mirror position={[0, 1.4, 0]} />
            </group>
        </>
    )
}
