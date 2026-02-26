import React from 'react'

export default function Pedestal({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Base du piédestal */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#111111" roughness={0.7} />
            </mesh>
            {/* Support fin du miroir */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
                <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    )
}
