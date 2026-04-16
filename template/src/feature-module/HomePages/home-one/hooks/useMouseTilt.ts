import { useRef, useCallback } from 'react'

interface TiltOptions {
    maxAngle?: number       // max degrees to rotate (default 12)
    perspective?: number    // CSS perspective in px (default 800)
    scale?: number          // hover scale (default 1.03)
    resetDuration?: number  // reset transition ms (default 600)
}

/**
 * Attaches mouse-tracking 3D tilt to a container.
 * Returns `{ containerRef, handleMouseMove, handleMouseLeave }`
 * Attach containerRef to a wrapper div, bind the two handlers.
 */
export const useMouseTilt = (options: TiltOptions = {}) => {
    const {
        maxAngle = 12,
        perspective = 800,
        scale = 1.03,
        resetDuration = 600,
    } = options

    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            // Normalised -0.5 → +0.5
            const x = (e.clientX - rect.left) / rect.width - 0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5
            // rotateY follows horizontal mouse; rotateX follows vertical (inverted)
            const rotateY = x * maxAngle * 2
            const rotateX = -y * maxAngle * 2
            el.style.transition = 'transform 0.1s linear'
            el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
        },
        [maxAngle, perspective, scale]
    )

    const handleMouseLeave = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        el.style.transition = `transform ${resetDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
        el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`
    }, [perspective, resetDuration])

    return { containerRef, handleMouseMove, handleMouseLeave }
}
