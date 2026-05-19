import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from `start` to `end` over `duration` ms.
 * Only starts when `trigger` becomes true (tie to useInView).
 */
export const useCountUp = (
    end: number,
    duration = 2200,
    start = 0,
    trigger = true
): number => {
    const [count, setCount] = useState(start)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!trigger) return
        let startTime: number | null = null

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(start + (end - start) * eased))
            if (progress < 1) requestAnimationFrame(step)
        }

        requestAnimationFrame(step)
        const timer = timerRef.current
        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [end, duration, start, trigger])

    return count
}
