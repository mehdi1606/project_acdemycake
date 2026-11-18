import React, { useCallback, useRef } from 'react'
import HeroCopy from './HeroCopy'
import { Butterfly, FIG, GOLD, HeroShell, IVORY, Toile, asset } from './heroShared'

/**
 * Variant 4 — "Floating patisserie".
 * Saralöwe creations (the burgundy studio photos) float in Moroccan-arch frames
 * at different depths. Moving the mouse shifts each layer by its depth, so the
 * scene feels three-dimensional; flour drifts down and a butterfly visits.
 */

type Piece = {
    src: string; alt: string
    w: number; top: string; left: string
    depth: number            // how much it follows the mouse (px at the screen edge)
    shape: 'arch' | 'round' | 'card'
    dur: number; delay: number; rot: number; z: number
}

const PIECES: Piece[] = [
    { src: '/assets/img/hero/wedding.webp',  alt: 'White sugar-lace wedding cake', w: 230, top: '8%',  left: '30%', depth: 26, shape: 'arch',  dur: 8,   delay: 0,    rot: 0,  z: 5 },
    { src: '/assets/img/hero/macaron-tower.webp',  alt: 'Macaron tower',                 w: 150, top: '2%',  left: '0%',  depth: 14, shape: 'arch',  dur: 7,   delay: -2,   rot: -3, z: 3 },
    { src: '/assets/img/hero/cupcake-caramel.webp',  alt: 'Cupcake with caramel shard',    w: 140, top: '56%', left: '2%',  depth: 34, shape: 'round', dur: 6.5, delay: -1,   rot: 3,  z: 6 },
    { src: '/assets/img/hero/raspberry.webp',  alt: 'Raspberry cake',                w: 160, top: '4%',  left: '72%', depth: 18, shape: 'card',  dur: 7.5, delay: -3,   rot: 4,  z: 4 },
    { src: '/assets/img/hero/macarons.webp', alt: 'Pistachio macarons',            w: 130, top: '60%', left: '74%', depth: 40, shape: 'round', dur: 6,   delay: -4,   rot: -4, z: 7 },
    { src: '/assets/img/hero/meringues.webp', alt: 'Meringue kisses',               w: 120, top: '70%', left: '40%', depth: 30, shape: 'card',  dur: 7,   delay: -2.5, rot: 2,  z: 6 },
]

const shapeStyle = (p: Piece): React.CSSProperties => {
    const base: React.CSSProperties = {
        width: p.w, overflow: 'hidden', border: `2px solid rgba(197,145,44,0.75)`,
        boxShadow: '0 22px 50px rgba(0,0,0,0.45), 0 0 0 6px rgba(197,145,44,0.08)', background: '#5a1a2c',
    }
    if (p.shape === 'arch') return { ...base, aspectRatio: '3 / 4.3', borderRadius: '999px 999px 16px 16px' }
    if (p.shape === 'round') return { ...base, aspectRatio: '1', borderRadius: '50%' }
    return { ...base, aspectRatio: '4 / 5', borderRadius: 16 }
}

const HeroFloating: React.FC = () => {
    const stageRef = useRef<HTMLDivElement>(null)
    const onMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const el = stageRef.current
        if (!el) return
        const x = e.clientX / window.innerWidth - 0.5
        const y = e.clientY / window.innerHeight - 0.5
        el.style.setProperty('--mx', x.toFixed(3))
        el.style.setProperty('--my', y.toFixed(3))
    }, [])
    const onLeave = useCallback(() => {
        stageRef.current?.style.setProperty('--mx', '0')
        stageRef.current?.style.setProperty('--my', '0')
    }, [])

    return (
        <HeroShell onMouseMove={onMove} onMouseLeave={onLeave}>
            {/* Flour drifting down */}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden', pointerEvents: 'none' }}>
                {Array.from({ length: 22 }, (_, i) => (
                    <span key={i} className="hv-sparkle" style={{
                        left: `${(i * 29) % 100}%`, animationDuration: `${11 + (i % 6) * 2}s`, animationDelay: `${-i * 1.1}s`,
                        width: 2 + (i % 3), height: 2 + (i % 3), background: '#FFF8EC', boxShadow: '0 0 6px rgba(255,248,236,.5)',
                    }} />
                ))}
            </div>
            <Toile n={FIG.fountain} color={GOLD} width={420} ratio={0.75}
                style={{ position: 'absolute', bottom: -30, right: '6%', opacity: 0.08, zIndex: 2 }} />

            <div className="container" style={{ position: 'relative', zIndex: 3 }}>
                <div className="row align-items-center g-5 g-lg-4">
                    <div className="col-lg-6"><HeroCopy /></div>

                    <div className="col-lg-6">
                        <div ref={stageRef} style={{ position: 'relative', height: 'min(560px, 70vw)', minHeight: 380 } as React.CSSProperties}>
                            {/* faint gold toile behind the photos */}
                            <Toile n={FIG.macaronTower} color={GOLD} width={170} ratio={1.35}
                                style={{ position: 'absolute', top: '22%', left: '50%', opacity: 0.12, transform: 'translateX(-50%)' }} />

                            {PIECES.map((p, i) => (
                                <div key={i} style={{
                                    position: 'absolute', top: p.top, left: p.left, zIndex: p.z,
                                    transform: `translate3d(calc(var(--mx, 0) * ${p.depth * 2}px), calc(var(--my, 0) * ${p.depth * 1.4}px), 0)`,
                                    transition: 'transform .6s cubic-bezier(.2,.7,.2,1)',
                                }}>
                                    <div className="hv-float" style={{ ['--dur' as string]: `${p.dur}s`, ['--delay' as string]: `${p.delay}s`, ['--rot' as string]: `${p.rot}deg` } as React.CSSProperties}>
                                        <div style={shapeStyle(p)}>
                                            <img src={asset(p.src)} alt={p.alt} loading="eager"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="hv-wander" style={{ top: '40%', left: '62%', zIndex: 9 }}>
                                <Butterfly n={FIG.butterflyB} size={46} color={IVORY} style={{ position: 'relative' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HeroShell>
    )
}

export default HeroFloating
