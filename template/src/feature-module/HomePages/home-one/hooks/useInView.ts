import { useState, useEffect, useRef } from 'react'

/**
 * Returns a ref to attach to any DOM element plus a boolean `inView`.
 * Triggers once when ≥ `threshold` of the element enters the viewport.
 * Also fires immediately if the element is already visible on mount.
 */
export const useInView = <T extends HTMLElement = HTMLDivElement>(
    threshold = 0.15
): { ref: React.RefObject<T | null>; inView: boolean } => {
    const ref = useRef<T>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        // Fire immediately if element is already in viewport
        const rect = el.getBoundingClientRect()
        const alreadyVisible =
            rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0

        if (alreadyVisible) {
            setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    observer.unobserve(el)
                }
            },
            { threshold }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [threshold])

    return { ref, inView }
}
