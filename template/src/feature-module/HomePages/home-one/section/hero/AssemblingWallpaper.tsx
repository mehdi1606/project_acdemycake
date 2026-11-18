import React, { useEffect, useRef, useState } from 'react'
import { asset, drawing, useReducedMotion } from './heroShared'
import { ACTORS, WALLPAPER_PIECES, WALLPAPER_RATIO, WallpaperPiece } from './wallpaperPieces'
import { FlappingBird, GardenButterfly, RestingLion, WalkingLion } from './GardenActors'

/**
 * The Moroccan-garden wallpaper building itself — and staying alive.
 *
 * It starts as the empty pink paper; every figure moves into the exact spot it
 * has in the wallpaper (gate and fountain rise, trees grow, tables drop, clouds
 * drift). Meanwhile the animals really move: the standing lion walks in on its
 * four legs and stops at its place, the resting lion breathes and looks around,
 * birds beat their wings across the sky, the butterfly flutters. When the scene
 * is built, a copy of the wallpaper without the animals (garden-plate.jpg)
 * fades in underneath, and the animals keep living on top of it.
 */

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

const LION_WALK_DELAY = 1.3   // s
const LION_WALK_TIME = 4.4    // s (matches .hv-walk-in)

const AssemblingWallpaper: React.FC = () => {
    const reduced = useReducedMotion()
    const boxRef = useRef<HTMLDivElement>(null)
    const [cover, setCover] = useState<{ w: number; h: number } | null>(null)
    const [phase, setPhase] = useState<'build' | 'settle' | 'done'>('build')
    const [lionWalking, setLionWalking] = useState(true)

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

    const total = Math.max(
        LION_WALK_DELAY + LION_WALK_TIME,
        ...WALLPAPER_PIECES.map(p => p.delay + ENTRANCE[p.enter].dur),
    )
    useEffect(() => {
        if (reduced) { setPhase('done'); setLionWalking(false); return }
        const a = window.setTimeout(() => setPhase('settle'), (total + 0.2) * 1000)
        const b = window.setTimeout(() => setPhase('done'), (total + 1.6) * 1000)
        const c = window.setTimeout(() => setLionWalking(false), (LION_WALK_DELAY + LION_WALK_TIME) * 1000)
        return () => { window.clearTimeout(a); window.clearTimeout(b); window.clearTimeout(c) }
    }, [reduced, total])

    const place = (p: { left: number; top: number; width: number }): React.CSSProperties => ({
        position: 'absolute', left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%`,
    })

    return (
        <div ref={boxRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, background: '#FAD6F3' }}>
            {cover && (
                <div style={{
                    position: 'absolute', left: '50%', top: '50%', width: cover.w, height: cover.h,
                    transform: 'translate(-50%, -50%)',
                }}>
                    {/* the finished garden without its animals */}
                    <img src={asset('/assets/img/hero/garden/garden-plate.jpg')} alt="" style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        opacity: phase === 'build' ? 0 : 1, transition: 'opacity 1.2s ease',
                    }} />

                    {/* figures flying, rising and growing into place */}
                    {phase !== 'done' && WALLPAPER_PIECES.map((p, i) => {
                        const e = ENTRANCE[p.enter]
                        return (
                            <div key={i} className="hv-assemble" style={{
                                ...place(p), transformOrigin: e.origin, zIndex: p.src?.includes('lion-branch') ? 3 : 1,
                                animationDuration: `${e.dur}s`, animationDelay: `${p.delay}s`,
                                ['--fx' as string]: e.fx, ['--fy' as string]: e.fy, ['--fr' as string]: e.fr, ['--fs' as string]: e.fs,
                                opacity: phase === 'settle' ? 0 : undefined, transition: 'opacity 1.2s ease',
                            } as React.CSSProperties}>
                                <div style={{ transform: p.flip ? 'scaleX(-1)' : undefined }}>
                                    <img src={p.src ? asset(p.src) : drawing(p.n ?? 0)} alt=""
                                        style={{ display: 'block', width: '100%', height: 'auto' }} />
                                </div>
                            </div>
                        )
                    })}

                    {/* ── the animals ── */}
                    <div className="hv-fade-up" style={{ ...place(ACTORS.restingLion), zIndex: 2, animationDelay: '1.1s' }}>
                        <RestingLion />
                    </div>

                    <div style={{ ...place(ACTORS.walkingLion), zIndex: 2 }}>
                        <div className={reduced ? undefined : 'hv-walk-in'} style={{ animationDelay: `${LION_WALK_DELAY}s` }}>
                            <WalkingLion walking={lionWalking && !reduced} />
                        </div>
                    </div>

                    <div className="hv-wander" style={{ ...place(ACTORS.butterfly), zIndex: 4, animationDuration: '11s' }}>
                        <div className="hv-fade-up" style={{ animationDelay: '2.6s' }}>
                            <GardenButterfly size={Math.round(cover.w * ACTORS.butterfly.width / 100)} />
                        </div>
                    </div>

                    {ACTORS.birds.map((b, i) => (
                        <div key={i} className="hv-bird-path" style={{
                            top: `${b.top}%`, width: `${b.width}%`, zIndex: 4,
                            animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s`,
                            animationFillMode: 'backwards',
                        }}>
                            <div style={{ animationDelay: `${-i * 0.8}s` }}>
                                <FlappingBird speed={0.26 + i * 0.06} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AssemblingWallpaper
