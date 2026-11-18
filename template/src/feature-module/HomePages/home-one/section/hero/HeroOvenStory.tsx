import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import HeroCopy from './HeroCopy'
import { FIG, GOLD, HeroShell, IVORY, Toile, asset, useReducedMotion } from './heroShared'

/**
 * Variant 2 — "From oven to masterpiece".
 * Desktop: the hero stays pinned while the visitor scrolls, and the scroll
 * tells the story — the oven glows and the sponge rises (Bake), the layers
 * stack with cream (Assemble), then it becomes a real Saralöwe cake (Decorate).
 * Phones / reduced motion: the same story plays on its own, no pinning.
 */

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => 1 - Math.pow(1 - t, 3)

const OvenScene: React.FC<{ bake: number; t: number }> = ({ bake, t }) => {
    const glow = 0.55 + 0.45 * Math.sin(t * 3)
    const rise = 0.28 + 0.72 * ease(bake)
    return (
        <g>
            {/* oven body */}
            <rect x="60" y="70" width="300" height="330" rx="22" fill="rgba(43,15,30,0.55)" stroke={GOLD} strokeWidth="2.5" />
            <rect x="60" y="70" width="300" height="62" rx="22" fill="none" stroke={GOLD} strokeWidth="1.5" />
            {[110, 160, 210, 260, 310].map(cx => (
                <g key={cx}>
                    <circle cx={cx} cy="101" r="13" fill="none" stroke={GOLD} strokeWidth="1.6" />
                    <line x1={cx} y1="101" x2={cx + 7 * Math.cos(t + cx)} y2={101 + 7 * Math.sin(t + cx)} stroke={GOLD} strokeWidth="1.6" />
                </g>
            ))}
            {/* window with warm glow */}
            <rect x="92" y="156" width="236" height="196" rx="14" fill="#7a2a12" opacity={0.35 + 0.5 * glow * (0.4 + 0.6 * bake)} />
            <rect x="92" y="156" width="236" height="196" rx="14" fill="none" stroke={GOLD} strokeWidth="2" />
            <line x1="92" y1="300" x2="328" y2="300" stroke={GOLD} strokeWidth="1.2" strokeDasharray="4 6" />
            {/* the sponge rising in its tin */}
            <g transform={`translate(210 300) scale(1 ${rise}) translate(-210 -300)`}>
                <path d="M150 300 L150 262 Q150 222 210 220 Q270 222 270 262 L270 300 Z" fill="#E9C28A" />
                <path d="M158 256 q12 -8 24 0 q12 -8 24 0 q12 -8 24 0 q12 -8 24 0" fill="none" stroke="#C99555" strokeWidth="2" />
            </g>
            <path d="M144 300 L276 300 L268 318 L152 318 Z" fill="none" stroke={GOLD} strokeWidth="2" />
            {/* heat waves */}
            {[0, 1, 2].map(i => (
                <path key={i} d={`M${170 + i * 40} 210 q8 -10 0 -20 q-8 -10 0 -20`} fill="none" stroke={IVORY}
                    strokeWidth="1.6" strokeLinecap="round" opacity={0.15 + 0.35 * bake * (0.5 + 0.5 * Math.sin(t * 2 + i))}
                    transform={`translate(0 ${-6 * Math.sin(t * 2 + i)})`} />
            ))}
            {/* handle + feet */}
            <rect x="120" y="366" width="180" height="10" rx="5" fill="none" stroke={GOLD} strokeWidth="2" />
            <rect x="82" y="400" width="26" height="14" rx="4" fill={GOLD} /><rect x="312" y="400" width="26" height="14" rx="4" fill={GOLD} />
        </g>
    )
}

const LayerScene: React.FC<{ layer: number }> = ({ layer }) => {
    const parts = [
        { y: 330, h: 54, w: 250, color: '#E9C28A' },   // bottom sponge
        { y: 316, h: 14, w: 240, color: IVORY },       // cream
        { y: 262, h: 54, w: 236, color: '#E3B67A' },   // sponge
        { y: 248, h: 14, w: 226, color: IVORY },       // cream
        { y: 194, h: 54, w: 222, color: '#E9C28A' },   // top sponge
    ]
    return (
        <g>
            <path d="M70 400 Q210 432 350 400 Q210 378 70 400 Z" fill="none" stroke={GOLD} strokeWidth="2.4" />
            <path d="M196 414 L188 440 L232 440 L224 414" fill="none" stroke={GOLD} strokeWidth="2" />
            {parts.map((p, i) => {
                const k = ease(clamp(clamp((layer - 0.22) / 0.78) * parts.length - i))
                return (
                    <rect key={i} x={210 - p.w / 2} y={p.y + 16 - (1 - k) * 260} width={p.w} height={p.h} rx="6"
                        fill={p.color} opacity={k} />
                )
            })}
            {/* crumb coat lines */}
            <path d="M99 400 L99 210 M321 400 L321 210" stroke={GOLD} strokeWidth="1.2" opacity={clamp(layer * 1.4 - 0.6)} />
            {/* piped cream border once the top layer is on */}
            <path d="M99 212 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 22 0"
                fill="none" stroke={IVORY} strokeWidth="4" strokeLinecap="round" opacity={clamp(layer * 3 - 2)} />
        </g>
    )
}

const STEPS = [
    { key: 'bake', en: 'Bake' },
    { key: 'assemble', en: 'Assemble' },
    { key: 'decorate', en: 'Decorate' },
]

const HeroOvenStory: React.FC = () => {
    const { t } = useTranslation()
    const reduced = useReducedMotion()
    const wrapRef = useRef<HTMLDivElement>(null)
    const [pinned, setPinned] = useState(true)
    const [p, setP] = useState(0)
    const [time, setTime] = useState(0)

    // Desktop + motion allowed → scroll-driven and pinned. Otherwise a timed loop.
    useEffect(() => {
        const check = () => setPinned(window.innerWidth >= 992 && !reduced)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [reduced])

    useEffect(() => {
        let raf = 0
        const start = performance.now()
        const tick = (now: number) => {
            const secs = (now - start) / 1000
            setTime(secs)
            if (pinned) {
                const el = wrapRef.current
                if (el) {
                    const total = el.offsetHeight - window.innerHeight
                    const scrolled = -el.getBoundingClientRect().top
                    setP(clamp(total > 0 ? scrolled / total : 0))
                }
            } else if (!reduced) {
                // 10 s loop: bake → assemble → decorate → hold
                const loop = (secs % 10) / 10
                setP(clamp(loop / 0.85))
            } else {
                setP(1)
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [pinned, reduced])

    // The copy never changes: keep the same element so 60 fps updates skip it.
    const copy = useMemo(() => <HeroCopy />, [])

    const bake = clamp(p / 0.34)
    const layer = clamp((p - 0.34) / 0.3)
    const deco = clamp((p - 0.66) / 0.26)
    const step = deco > 0 ? 2 : layer > 0 ? 1 : 0

    const stage = (
        <div style={{ position: 'relative', width: '100%', maxWidth: 460, marginInline: 'auto' }}>
            <svg viewBox="0 0 420 460" width="100%" role="img" aria-label="A cake being baked, layered and decorated"
                style={{ display: 'block', overflow: 'visible' }}>
                <g style={{ opacity: 1 - clamp(layer * 4.5) }}><OvenScene bake={bake} t={time} /></g>
                <g style={{ opacity: layer * (1 - deco) }}><LayerScene layer={layer} /></g>
            </svg>
            {/* Decorate: the real Saralöwe cake */}
            <div style={{
                position: 'absolute', left: '50%', top: '4%', width: '62%',
                transform: `translateX(-50%) scale(${0.86 + 0.14 * ease(deco)})`, opacity: deco,
                transformOrigin: 'bottom center',
            }}>
                <div className="hv-arch" style={{ aspectRatio: '3 / 4.2', border: `2px solid ${GOLD}`, boxShadow: '0 26px 60px rgba(0,0,0,.5)' }}>
                    <img src={asset('/assets/img/hero/floral.webp')} alt="Floral couture cake by Saralöwe"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            </div>
            {deco > 0.6 && (
                <div aria-hidden="true" style={{ position: 'absolute', inset: '-10% -10% 0', pointerEvents: 'none', overflow: 'hidden' }}>
                    {Array.from({ length: 10 }, (_, i) => (
                        <span key={i} className="hv-sparkle" style={{ left: `${8 + i * 9}%`, animationDuration: `${4 + (i % 4)}s`, animationDelay: `${-i * 0.6}s` }} />
                    ))}
                </div>
            )}

            {/* Step indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
                {STEPS.map((s, i) => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase',
                            color: i <= step ? GOLD : 'rgba(245,218,223,0.35)', fontWeight: 700, transition: 'color .3s',
                        }}>
                            {t(`heroVariants.${s.key}`, s.en)}
                        </span>
                        {i < STEPS.length - 1 && (
                            <span style={{ width: 36, height: 1, background: 'rgba(197,145,44,0.3)', position: 'relative', overflow: 'hidden' }}>
                                <span style={{ position: 'absolute', inset: 0, background: GOLD,
                                    transform: `scaleX(${i === 0 ? bake : layer})`, transformOrigin: 'left' }} />
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )

    const content = (
        <HeroShell style={pinned ? { minHeight: '100vh', height: '100vh' } : undefined}>
            <Toile n={FIG.teaTable} color={GOLD} width={300} ratio={0.75}
                style={{ position: 'absolute', bottom: 20, left: -40, opacity: 0.07, zIndex: 2 }} />
            <Toile n={FIG.cloudA} color={IVORY} width={240} ratio={0.4} className="hv-drift"
                style={{ position: 'absolute', top: 110, right: '8%', opacity: 0.08, zIndex: 2 }} />
            <div className="container" style={{ position: 'relative', zIndex: 3 }}>
                <div className="row align-items-center g-5 g-lg-4">
                    <div className="col-lg-6">{copy}</div>
                    <div className="col-lg-6">{stage}</div>
                </div>
            </div>
            {pinned && p < 0.05 && (
                <div aria-hidden="true" style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 4,
                    color: GOLD, fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center' }}>
                    {t('heroVariants.scroll', 'Scroll')}
                    <div className="hv-bob" style={{ fontSize: 18, animationDuration: '1.6s' }}>↓</div>
                </div>
            )}
        </HeroShell>
    )

    if (!pinned) return content
    return (
        <div ref={wrapRef} style={{ height: '240vh', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>{content}</div>
        </div>
    )
}

export default HeroOvenStory
