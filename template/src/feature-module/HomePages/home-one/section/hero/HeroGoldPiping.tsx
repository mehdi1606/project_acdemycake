import React from 'react'
import HeroCopy from './HeroCopy'
import { Butterfly, FIG, GOLD, HeroShell, IVORY, Toile, asset } from './heroShared'

/**
 * Variant 3 — "The gold piping signature".
 * Keeps today's Moroccan garden art. A gold piping line draws a three-tier
 * couture cake stroke by stroke, the gold logo appears with a shimmer, and the
 * Saralöwe toile figures come alive: birds cross the sky, butterflies circle
 * the cake, palm leaves sway, sugar sparkles fall.
 */

// Each path is drawn with pathLength=1, so one dash length fits every stroke.
type Stroke = { d: string; dur: number; delay: number; w?: number }

const CAKE: Stroke[] = [
    // stand
    { d: 'M60 470 Q200 500 340 470 Q200 446 60 470 Z', dur: 1.2, delay: 0.2, w: 2.4 },
    { d: 'M180 488 Q172 506 150 512 L250 512 Q228 506 220 488', dur: 0.9, delay: 0.6 },
    // bottom tier
    { d: 'M78 462 L78 352 Q200 330 322 352 L322 462', dur: 1.4, delay: 0.9, w: 2.6 },
    { d: 'M78 352 Q200 374 322 352', dur: 0.8, delay: 1.6 },
    // drapes on the bottom tier
    { d: 'M78 380 Q113 412 148 384 Q183 414 218 384 Q253 414 288 384 Q308 400 322 384', dur: 1.4, delay: 2.0 },
    { d: 'M78 404 Q113 440 148 408 Q183 442 218 408 Q253 442 288 408 Q308 426 322 408', dur: 1.4, delay: 2.3, w: 1.4 },
    // middle tier
    { d: 'M112 346 L112 256 Q200 238 288 256 L288 346', dur: 1.2, delay: 2.6, w: 2.4 },
    { d: 'M112 256 Q200 274 288 256', dur: 0.7, delay: 3.2 },
    // piped scallops on the middle tier
    { d: 'M112 338 q11 -12 22 0 q11 -12 22 0 q11 -12 22 0 q11 -12 22 0 q11 -12 22 0 q11 -12 22 0 q11 -12 22 0 q11 -12 22 0', dur: 1.3, delay: 3.4 },
    { d: 'M130 282 L130 322 M156 286 L156 326 M182 288 L182 328 M218 288 L218 328 M244 286 L244 326 M270 282 L270 322', dur: 1.2, delay: 3.7, w: 1.2 },
    // top tier
    { d: 'M142 250 L142 178 Q200 164 258 178 L258 250', dur: 1.1, delay: 4.0, w: 2.4 },
    { d: 'M142 178 Q200 192 258 178', dur: 0.6, delay: 4.6 },
    { d: 'M142 244 q9 -10 18 0 q9 -10 18 0 q9 -10 18 0 q9 -10 18 0 q9 -10 18 0 q9 -10 18 0 q9 -10 18 0', dur: 1.0, delay: 4.8 },
    // ribbon bow
    { d: 'M142 206 Q200 220 258 206 M200 214 q-26 -22 -40 -6 q12 16 40 6 q28 10 40 -6 q-14 -16 -40 6 M200 214 l-12 24 M200 214 l12 24', dur: 1.4, delay: 5.0, w: 1.6 },
    // sugar rose on top
    { d: 'M200 160 q-14 -4 -16 -18 q2 -16 18 -16 q14 2 14 14 q-2 10 -12 10 q-8 -2 -8 -8 q2 -6 8 -4', dur: 1.4, delay: 5.6, w: 2 },
    { d: 'M184 150 q-24 -6 -30 -26 q22 0 30 20 M216 150 q24 -6 30 -26 q-22 0 -30 20', dur: 1.2, delay: 6.0, w: 1.6 },
]

const PEARLS = [
    [96, 352], [124, 347], [152, 343], [180, 341], [208, 341], [236, 343], [264, 346], [292, 350],
    [128, 256], [156, 252], [184, 250], [212, 250], [240, 252], [268, 255],
]

const HeroGoldPiping: React.FC = () => (
    <HeroShell>
        {/* Swaying palm leaves (top corners) */}
        <Toile n={FIG.palms} color={GOLD} width={340} ratio={0.85} className="hv-sway"
            style={{ position: 'absolute', top: -40, right: -60, opacity: 0.22, zIndex: 2 }} />
        <Toile n={FIG.roseBranch} color={IVORY} width={300} ratio={0.85} className="hv-sway hv-sway--left"
            style={{ position: 'absolute', top: 60, left: -70, opacity: 0.12, zIndex: 2, transform: 'scaleX(-1)' }} />

        {/* Clouds and a passing flight of birds */}
        <Toile n={FIG.cloudB} color={IVORY} width={260} ratio={0.4} className="hv-drift"
            style={{ position: 'absolute', top: 120, left: '38%', opacity: 0.1, zIndex: 2 }} />
        <div className="hv-fly" style={{ top: '16%', animationDuration: '26s', zIndex: 2 }}>
            <Toile n={FIG.birdB} color={GOLD} width={70} ratio={0.7} style={{ opacity: 0.55 }} />
        </div>
        <div className="hv-fly" style={{ top: '24%', animationDuration: '34s', animationDelay: '-12s', zIndex: 2 }}>
            <Toile n={FIG.birdC} color={IVORY} width={48} ratio={0.62} style={{ opacity: 0.35 }} />
        </div>
        <div className="hv-fly hv-fly--rtl" style={{ top: '9%', animationDuration: '41s', animationDelay: '-20s', zIndex: 2 }}>
            <Toile n={FIG.birdA} color={GOLD} width={56} ratio={0.75} style={{ opacity: 0.4 }} />
        </div>

        {/* Falling sugar sparkles */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 14 }, (_, i) => (
                <span key={i} className="hv-sparkle" style={{
                    left: `${(i * 37) % 100}%`, animationDuration: `${7 + (i % 5) * 1.6}s`, animationDelay: `${-i * 1.3}s`,
                    width: i % 3 === 0 ? 5 : 3, height: i % 3 === 0 ? 5 : 3,
                }} />
            ))}
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 3 }}>
            <div className="row align-items-center g-5 g-lg-4">
                <div className="col-lg-6"><HeroCopy /></div>

                <div className="col-lg-6 d-flex justify-content-center">
                    <div style={{ position: 'relative', width: '100%', maxWidth: 420, paddingBottom: 120 }}>
                        {/* Butterflies circling the cake */}
                        <div className="hv-wander" style={{ top: 70, left: 10, zIndex: 4 }}>
                            <Butterfly n={FIG.butterflyA} size={54} color={GOLD} style={{ position: 'relative' }} />
                        </div>
                        <div className="hv-wander" style={{ top: 230, right: 0, zIndex: 4, animationDuration: '17s', animationDelay: '-6s' }}>
                            <Butterfly n={FIG.butterflyB} size={40} color={IVORY} speed={0.3} style={{ position: 'relative', opacity: 0.85 }} />
                        </div>

                        <svg viewBox="0 0 400 530" width="100%" role="img" aria-label="A couture cake drawn in gold piping"
                            style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 0 10px rgba(197,145,44,0.35))' }}>
                            <g fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round">
                                {CAKE.map((s, i) => (
                                    <path key={i} d={s.d} pathLength={1} strokeWidth={s.w ?? 1.8} className="hv-draw"
                                        style={{ ['--len' as string]: 1, ['--dur' as string]: `${s.dur}s`, ['--delay' as string]: `${s.delay}s` } as React.CSSProperties} />
                                ))}
                            </g>
                            {PEARLS.map(([x, y], i) => (
                                <circle key={i} cx={x} cy={y} r={3.2} fill="#F4DFA9" className="hv-fade-in"
                                    style={{ ['--delay' as string]: `${2.2 + i * 0.12}s` } as React.CSSProperties} />
                            ))}
                        </svg>

                        {/* The logo appears once the cake is piped */}
                        <div className="hv-fade-in" style={{ ['--delay' as string]: '6.8s', position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' } as React.CSSProperties}>
                            <div className="hv-shimmer" style={{ ['--delay' as string]: '7.4s', width: 118, borderRadius: 8 } as React.CSSProperties}>
                                <img src={asset('/assets/img/email/logo-gold.png')} alt="Saralöwe Academy" width={118}
                                    style={{ display: 'block', width: 118, height: 'auto' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </HeroShell>
)

export default HeroGoldPiping
