import React, { useEffect, useRef, useState } from 'react'
import { asset, drawing, useReducedMotion } from './heroShared'
import { WALLPAPER_PIECES, WALLPAPER_RATIO, WallpaperPiece } from './wallpaperPieces'

/**
 * The Moroccan-garden wallpaper (Landscape.jpeg) building itself.
 *
 * The wallpaper is a composition of the Saralöwe toile drawings. It starts as
 * the empty pink paper; every drawing then moves into the exact spot it has in
 * the wallpaper — lions walk in, the gate and fountain rise, trees grow, the
 * tables drop, clouds drift, birds fly in. Once everything has landed, the real
 * wallpaper image fades in underneath, so the final frame is pixel-identical
 * to today's hero. Positions come from matching each drawing in the image.
 */

// Entrance per kind of figure (start pose; the end pose is always "in place").
const ENTRANCE: Record<WallpaperPiece['enter'], { fx: string; fy: string; fr: string; fs: string; origin: string; dur: number }> = {
    walkLeft:  { fx: '-55vw', fy: '0px',   fr: '0deg',   fs: '1',    origin: 'bottom center', dur: 2.6 },
    walkRight: { fx: '55vw',  fy: '0px',   fr: '0deg',   fs: '1',    origin: 'bottom center', dur: 2.6 },
    rise:      { fx: '0px',   fy: '18vh',  fr: '0deg',   fs: '0.9',  origin: 'bottom center', dur: 1.8 },
    grow:      { fx: '0px',   fy: '0px',   fr: '0deg',   fs: '0.05', origin: 'bottom center', dur: 2.0 },
    swing:     { fx: '10vw',  fy: '-20vh', fr: '-18deg', fs: '0.9',  origin: 'top right',     dur: 2.2 },
    drop:      { fx: '0px',   fy: '-70vh', fr: '0deg',   fs: '1',    origin: 'bottom center', dur: 1.5 },
    driftLeft: { fx: '-30vw', fy: '0px',   fr: '0deg',   fs: '1',    origin: 'center',        dur: 3.2 },
    driftRight:{ fx: '30vw',  fy: '0px',   fr: '0deg',   fs: '1',    origin: 'center',        dur: 3.2 },
    fly:       { fx: '-40vw', fy: '-25vh', fr: '-12deg', fs: '0.6',  origin: 'center',        dur: 2.4 },
    flutter:   { fx: '20vw',  fy: '-30vh', fr: '25deg',  fs: '0.4',  origin: 'center',        dur: 2.8 },
}

const AssemblingWallpaper: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
    const reduced = useReducedMotion()
    const boxRef = useRef<HTMLDivElement>(null)
    const [cover, setCover] = useState<{ w: number; h: number } | null>(null)
    const [phase, setPhase] = useState<'build' | 'settle' | 'done'>('build')

    // Same geometry as `background-size: cover; background-position: center`.
    useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const fit = () => {
            const W = el.clientWidth, H = el.clientHeight
            if (!W || !H) return
            const w = Math.max(W, H * WALLPAPER_RATIO)
            setCover({ w, h: w / WALLPAPER_RATIO })
        }
        const ro = new ResizeObserver(fit)
        ro.observe(el)
        fit()
        return () => ro.disconnect()
    }, [])

    const total = Math.max(...WALLPAPER_PIECES.map(p => p.delay + ENTRANCE[p.enter].dur))
    useEffect(() => {
        if (reduced) { setPhase('done'); onDone?.(); return }
        const a = window.setTimeout(() => setPhase('settle'), (total + 0.2) * 1000)
        const b = window.setTimeout(() => { setPhase('done'); onDone?.() }, (total + 1.6) * 1000)
        return () => { window.clearTimeout(a); window.clearTimeout(b) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduced, total])

    return (
        <div ref={boxRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, background: '#FAD6F3' }}>
            {cover && (
                <div style={{
                    position: 'absolute', left: '50%', top: '50%', width: cover.w, height: cover.h,
                    transform: 'translate(-50%, -50%)',
                }}>
                    {/* the real wallpaper, revealed once every drawing has landed */}
                    <img src={asset('/assets/img/Landscape.jpeg')} alt="" style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        opacity: phase === 'build' ? 0 : 1, transition: 'opacity 1.2s ease',
                    }} />

                    {phase !== 'done' && WALLPAPER_PIECES.map((p, i) => {
                        const e = ENTRANCE[p.enter]
                        const walking = p.enter === 'walkLeft' || p.enter === 'walkRight'
                        return (
                            <div key={i} className="hv-assemble" style={{
                                position: 'absolute', left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%`,
                                transformOrigin: e.origin,
                                animationDuration: `${e.dur}s`, animationDelay: `${p.delay}s`,
                                ['--fx' as string]: e.fx, ['--fy' as string]: e.fy, ['--fr' as string]: e.fr, ['--fs' as string]: e.fs,
                                opacity: phase === 'settle' ? 0 : undefined,
                                transition: 'opacity 1.2s ease',
                            } as React.CSSProperties}>
                                <div style={{ transform: p.flip ? 'scaleX(-1)' : undefined }}>
                                    <img src={p.src ? asset(p.src) : drawing(p.n ?? 0)} alt="" className={walking ? 'hv-walk' : undefined}
                                        style={{ display: 'block', width: '100%', height: 'auto', animationDelay: `${p.delay}s` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default AssemblingWallpaper
