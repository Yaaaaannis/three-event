import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useStore } from '../../store/useStore'

export default function OverlayUI() {
    const containerRef = useRef<HTMLDivElement>(null)
    const circleRef = useRef<HTMLDivElement>(null)

    // Use specific selectors to avoid re-rendering this UI 60 times a second
    const isBreached = useStore(state => state.isBreached)
    const setIsBreached = useStore(state => state.setIsBreached)
    const setBreachProgress = useStore(state => state.setBreachProgress)
    const setTouchPosition = useStore(state => state.setTouchPosition)
    const pressTimer = useRef<number | null>(null)
    const progressTween = useRef<gsap.core.Tween | null>(null)

    // Durée pour atteindre l'ouverture finale (en secondes)
    const duration = 5

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isBreached) return

        console.log("Pointer Down!")

        // Update touch position for the shader (normalize screen coords to 0-1)
        setTouchPosition({
            x: e.clientX / window.innerWidth,
            y: 1.0 - (e.clientY / window.innerHeight), // Invert Y for WebGL UVs
        })

        // Prepare circle at touch pos
        if (circleRef.current) {
            gsap.set(circleRef.current, {
                x: e.clientX - 25,
                y: e.clientY - 25,
                scale: 0,
                opacity: 1
            })
            gsap.to(circleRef.current, { scale: 1, duration: 0.3, ease: 'back.out(1.7)' })
        }

        // Start progress animation
        const progressObj = { value: 0 }
        progressTween.current = gsap.to(progressObj, {
            value: 1,
            duration: duration,
            ease: 'none', // Linéaire pour le shader
            onUpdate: () => {
                setBreachProgress(progressObj.value)
                console.log("Progress:", progressObj.value)

                // Tremblement de l'UI
                if (containerRef.current) {
                    const shake = progressObj.value * 2
                    gsap.set(containerRef.current, {
                        x: (Math.random() - 0.5) * shake,
                        y: (Math.random() - 0.5) * shake
                    })
                }
            },
            onComplete: () => {
                console.log("Breach Complete!")
                setIsBreached(true)
                if (containerRef.current) {
                    gsap.to(containerRef.current, { opacity: 0, duration: 1, ease: 'power2.inOut', pointerEvents: 'none' })
                }
                if (circleRef.current) {
                    gsap.to(circleRef.current, { scale: 10, opacity: 0, duration: 0.5 })
                }
            }
        })
    }

    const handlePointerUpOrLeave = () => {
        if (isBreached) return

        console.log("Pointer Up/Leave!")

        if (progressTween.current) {
            progressTween.current.kill()
        }

        // Reset progress
        setBreachProgress(0)

        // Reset UI shake
        if (containerRef.current) {
            gsap.to(containerRef.current, { x: 0, y: 0, duration: 0.3 })
        }

        if (circleRef.current) {
            gsap.to(circleRef.current, { scale: 0, opacity: 0, duration: 0.3 })
        }
    }

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-auto touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            onPointerCancel={handlePointerUpOrLeave}
        >
            <h1 className="text-5xl tracking-tighter mix-blend-difference pointer-events-none mb-4">ENTER</h1>
            <p className="text-sm opacity-50 uppercase tracking-widest pointer-events-none mix-blend-difference">
                Long press to reveal
            </p>

            {/* Visual indicator of the press */}
            <div
                ref={circleRef}
                className="absolute top-0 left-0 w-[50px] h-[50px] border border-white rounded-full opacity-0 pointer-events-none mix-blend-difference"
            />

            <div className="absolute bottom-6 text-[10px] opacity-20 tracking-widest uppercase pointer-events-none">
                WebGL Installation
            </div>
        </div>
    )
}
