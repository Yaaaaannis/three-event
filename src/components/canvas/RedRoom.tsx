import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material'

const floorVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
  }
`

const floorFragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uScale;

  void main() {
    // Échelle pour multiplier le motif
    vec2 pos = vUv * uScale;
    
    // 1. On crée la forme de dent de scie sur l'axe X (0 à 1 puis 1 à 0)
    // abs(fract(pos.x) * 2.0 - 1.0) donne un pic triangulaire \/\/\/\/
    float zigzagOffset = abs(fract(pos.x) * 2.0 - 1.0);
    
    // 2. On ajoute ce décalage à la position Y
    // L'amplitude de l'offset détermine la "pente" du zigzag.
    // En ajoutant l'offset à pos.y, on ondule ligne par ligne.
    float stripe = fract(pos.y + zigzagOffset);
    
    // 3. On coupe net à 0.5 pour avoir 50% noir, 50% blanc
    float pattern = step(0.5, stripe);

    vec3 color = mix(uColor1, uColor2, pattern);
    
    // Injection pour le PBR avec CustomShaderMaterial
    csm_DiffuseColor = vec4(color, 1.0);
  }
`

const curtainVertexShader = `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vUv = uv;

    // 1. Onde procedurale (les plis du rideau)
    float wave = sin(position.x * 5.0 + uTime * 0.5) * 0.2;
    float anchor = smoothstep(0.0, 0.2, position.y + 5.0) * smoothstep(10.0, 9.8, position.y + 5.0);
    
    // 2. Courber le plan géant en forme de "U" autour de la scène
    // On prend le plane de 40 de large et on l'enroule
    // position.x varie de -20 à 20
    float angle = (position.x / 40.0) * 3.14159; // Donne de -PI/2 à PI/2 (un demi-cercle)
    float radius = 10.0;
    
    // Calcul de la nouvelle position en arc de cercle
    vec3 newPosition;
    newPosition.x = sin(angle) * (radius + wave * anchor);
    newPosition.y = position.y;
    newPosition.z = -cos(angle) * (radius + wave * anchor);

    csm_Position = newPosition;
    
    // Recalcul simple des normales
    vec3 tangent = normalize(vec3(cos(angle), 0.0, sin(angle))); // Tangente au cercle
    vec3 bitangent = vec3(0.0, 1.0, 0.0);
    csm_Normal = normalize(cross(tangent, bitangent));
  }
`

const curtainFragmentShader = `
  varying vec2 vUv;

  void main() {
    // On peut utiliser vUv pour générer des ombres procédurales dans les creux,
    // mais le PBR s'en chargera avec nos nouvelles normales !
    // Just apply a rich red color:
    csm_DiffuseColor = vec4(0.5, 0.0, 0.0, 1.0);
  }
`

export default function RedRoom() {
    const floorMaterialRef = useRef<any>(null)
    const curtainMaterialRef = useRef<any>(null)

    useFrame((state) => {
        if (curtainMaterialRef.current) {
            curtainMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return (
        <group>
            {/* Sol procédural zigzag avec reflets PBR */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <CustomShaderMaterial
                    ref={floorMaterialRef}
                    baseMaterial={THREE.MeshStandardMaterial}
                    vertexShader={floorVertexShader}
                    fragmentShader={floorFragmentShader}
                    uniforms={{
                        uColor1: { value: new THREE.Color("#000000") }, // Noir absolu
                        uColor2: { value: new THREE.Color("#ffffff") }, // Blanc pur
                        uScale: { value: 60.0 } // Échelle plus grande pour des zigzags plus petits
                    }}
                    roughness={0.05} // Très glossy (presque un miroir)
                    metalness={0.8} // Rend le sol très réfléchissant à la lumière
                />
            </mesh>

            {/* Rideaux rouges (Plane subdivisé et courbé procéduralement) */}
            <mesh position={[0, 4, -8]}>
                {/* Beaucoup de segments sur l'axe X pour une ondulation fluide */}
                <planeGeometry args={[40, 10, 256, 1]} />
                <CustomShaderMaterial
                    ref={curtainMaterialRef}
                    baseMaterial={THREE.MeshStandardMaterial}
                    vertexShader={curtainVertexShader}
                    fragmentShader={curtainFragmentShader}
                    uniforms={{
                        uTime: { value: 0 }
                    }}
                    side={THREE.DoubleSide}
                    roughness={0.9} // Le tissu absorbe la lumière
                    metalness={0.1}
                    color="#880000" // C'est csm_DiffuseColor qui gagne si défini, mais on place une fallback
                />
            </mesh>

            {/* Brouillard environnemental géré dans SceneManager ou ici */}
            <fog attach="fog" args={['#000000', 5, 20]} />

            <ambientLight intensity={0.2} color="#ff8888" />
            <pointLight position={[0, 5, 0]} intensity={1} color="#ff0000" distance={20} />
        </group>
    )
}
