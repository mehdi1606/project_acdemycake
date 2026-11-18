import React, { useEffect, useState } from 'react'
import './hero-variants.css'

export const GOLD = '#C5912C'
export const IVORY = '#F2EFE8'
export const BURG = '#651C32'
export const DARK = '#2B0F1E'

const PUB = process.env.PUBLIC_URL || ''

/** URL of a Saralöwe toile drawing (Graphics Elements-NN.svg). */
export const drawing = (n: number) => `${PUB}/assets/img/Graphics/Graphics%20Elements-${String(n).padStart(2, '0')}.svg`
export const asset = (path: string) => `${PUB}${path}`

// The toile drawings used as moving figures.
export const FIG = {
    lionResting: 2, lionStanding: 3, gardenGate: 4, fountain: 5, cakeTable: 6, teaTable: 7,
    macaronTower: 8, bridge: 9, cloudA: 13, cloudB: 14, cloudC: 15, palms: 16, branch: 17,
    roseBranch: 18, blossom: 19, swan: 20, birdA: 21, lily: 22, birdB: 23, flower: 24,
    birdC: 26, butterflyA: 27, butterflyB: 28,
}

/** True when the visitor asked the OS for less motion — every hero then stays still. */
export const useReducedMotion = () => {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
        if (!mq) return
        setReduced(mq.matches)
        const on = (e: MediaQueryListEvent) => setReduced(e.matches)
        mq.addEventListener?.('change', on)
        return () => mq.removeEventListener?.('change', on)
    }, [])
    return reduced
}

/**
 * One toile drawing, recoloured with a CSS mask (the SVGs are brand red; on the
 * burgundy hero they read best in gold or ivory). Purely decorative.
 */
export const Toile: React.FC<{
    n: number
    color?: string
    width: number | string
    ratio?: number            // height / width of the drawing
    className?: string
    style?: React.CSSProperties
}> = ({ n, color = GOLD, width, ratio = 0.75, className, style }) => (
    <div
        aria-hidden="true"
        className={className}
        style={{
            width, aspectRatio: `${1 / ratio}`,
            backgroundColor: color,
            WebkitMaskImage: `url("${drawing(n)}")`, maskImage: `url("${drawing(n)}")`,
            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center', maskPosition: 'center',
            WebkitMaskSize: 'contain', maskSize: 'contain',
            pointerEvents: 'none',
            ...style,
        }}
    />
)

/** A butterfly whose two wings beat (the drawing is mirrored into two halves). */
export const Butterfly: React.FC<{ n?: number; color?: string; size: number; style?: React.CSSProperties; speed?: number }> = ({
    n = FIG.butterflyA, color = GOLD, size, style, speed = 0.35,
}) => (
    <div aria-hidden="true" className="hv-butterfly" style={{ width: size, height: size * 0.72, ...style }}>
        {(['left', 'right'] as const).map(side => (
            <div key={side} className={`hv-wing hv-wing--${side}`} style={{ animationDuration: `${speed}s` }}>
                <Toile n={n} color={color} width={size} ratio={0.72}
                    style={{ position: 'absolute', top: 0, [side === 'left' ? 'left' : 'right']: 0 }} />
            </div>
        ))}
    </div>
)

/** The standard hero section shell: Moroccan garden art + burgundy overlay (same as today). */
export const HeroShell: React.FC<{
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    background?: boolean
    onMouseMove?: React.MouseEventHandler<HTMLElement>
    onMouseLeave?: React.MouseEventHandler<HTMLElement>
    sectionRef?: React.Ref<HTMLElement>
}> = ({ children, className = '', style, background = true, onMouseMove, onMouseLeave, sectionRef }) => (
    <section
        ref={sectionRef}
        className={`sl-banner ${className}`}
        style={{ cursor: 'default', ...(background ? { backgroundImage: `url(${PUB}/assets/img/Landscape.jpeg)` } : {}), ...style }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
    >
        {children}
    </section>
)
