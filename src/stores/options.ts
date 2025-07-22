import { create } from "zustand";

interface Options {
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    toggleShowGrid: () => void;
    showAxes: boolean;
    setShowAxes: (show: boolean) => void;
    toggleShowAxes: () => void;
    autoRotate: boolean;
    setAutoRotate: (autoRotate: boolean) => void;
    toggleAutoRotate: () => void;
}

export const useOptions = create<Options>((set) => ({
    // Show Grid
    showGrid: true,
    setShowGrid: (show) => set(() => ({ showGrid: show })),
    toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    // Show Axes
    showAxes: true,
    setShowAxes: (show) => set(() => ({ showAxes: show })),
    toggleShowAxes: () => set((state) => ({ showAxes: !state.showAxes })),
    // Auto Rotate
    autoRotate: false,
    setAutoRotate: (autoRotate) => set(() => ({ autoRotate })),
    toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
}));
