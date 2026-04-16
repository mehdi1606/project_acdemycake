import { useState, useEffect, useRef } from 'react'

/**
 * Returns a ref to attach to any DOM element plus a boolean `inView`.
 * Triggers once when ≥ `threshold` of the element enters the viewport.
 */
export const useInView = <T extends HTMLElement = HTMLDivElement>(
    threshold = 0.15
): { ref: React.RefObject<T | null>; inView: boolean } => {
    const ref = useRef<T>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    observer.unobserve(el) // fire once
                }
            },
            { threshold }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [threshold])

    return { ref, inView }
}
