import { create } from 'zustand'

interface StoreState {
    isBreached: boolean
    breachProgress: number // 0 to 1
    touchPosition: { x: number; y: number }
    setIsBreached: (status: boolean) => void
    setBreachProgress: (progress: number) => void
    setTouchPosition: (pos: { x: number; y: number }) => void
}

export const useStore = create<StoreState>((set) => ({
    isBreached: false,
    breachProgress: 0,
    touchPosition: { x: 0.5, y: 0.5 }, // UV space defaults to center
    setIsBreached: (status) => set({ isBreached: status }),
    setBreachProgress: (progress) => set({ breachProgress: progress }),
    setTouchPosition: (pos) => set({ touchPosition: pos }),
}))
