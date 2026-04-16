import { useState, useEffect } from 'react'

/**
 * Returns the current window.scrollY value, updated every animation frame.
 * Use it to drive parallax offsets: `translateY(scrollY * factor)`
 */
export const useScrollParallax = (): number => {
    const [scrollY, setScrollY] = useState(0)

    useEffect(() => {
        let rafId: number
        const tick = () => {
            setScrollY(window.scrollY)
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [])

    return scrollY
}
