import React from 'react'
import HeroCopy from './HeroCopy'
import { FIG, GOLD, HeroShell, Toile, asset, useReducedMotion } from './heroShared'

/**
 * Variant 5 — "Cinematic reel".
 * Slow-motion footage from the Saralöwe chocolate masterclass fills the hero
 * behind a burgundy veil; the fairies cake turns inside a Moroccan arch on the
 * right. Both loops are short, silent and compressed (≈1.5 MB + 1.1 MB).
 * Visitors who prefer reduced motion see the still posters instead.
 */
const HeroCinematic: React.FC = () => {
    const reduced = useReducedMotion()

    return (
        <HeroShell background={false} className="hv-cinematic" style={{ backgroundColor: '#2B0F1E' }}>
            {reduced ? (
                <img src={asset('/assets/img/hero/reel-atelier-poster.jpg')} alt="" aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            ) : (
                <video autoPlay muted loop playsInline preload="auto" aria-hidden="true"
                    poster={asset('/assets/img/hero/reel-atelier-poster.jpg')}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}>
                    <source src={asset('/assets/img/hero/reel-atelier.mp4')} type="video/mp4" />
                </video>
            )}
            {/* Burgundy veil: darker behind the text, lighter on the right */}
            <div aria-hidden="true" style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'linear-gradient(100deg, rgba(43,15,30,0.92) 0%, rgba(74,14,31,0.74) 42%, rgba(74,14,31,0.34) 72%, rgba(43,15,30,0.55) 100%)',
            }} />
            {/* Gold letterbox lines */}
            <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 86, height: 1, background: 'rgba(197,145,44,0.25)', zIndex: 2 }} />
            <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 28, height: 1, background: 'rgba(197,145,44,0.25)', zIndex: 2 }} />

            <div className="container" style={{ position: 'relative', zIndex: 3 }}>
                <div className="row align-items-center g-5 g-lg-4">
                    <div className="col-lg-7"><HeroCopy /></div>

                    <div className="col-lg-5 d-flex justify-content-center">
                        <div style={{ position: 'relative', width: 'min(330px, 80vw)' }} data-aos="fade-left" data-aos-duration="1100">
                            <Toile n={FIG.lily} color={GOLD} width={120} ratio={1.3}
                                style={{ position: 'absolute', left: -78, bottom: 10, opacity: 0.5, zIndex: 2 }} className="hv-sway hv-sway--left" />
                            <div style={{ position: 'relative' }}>
                                {/* gold outline offset behind the arch */}
                                <div aria-hidden="true" style={{
                                    position: 'absolute', inset: -12, border: '1px solid rgba(197,145,44,0.55)',
                                    borderRadius: '999px 999px 22px 22px',
                                }} />
                                <div className="hv-arch" style={{
                                    aspectRatio: '9 / 15', border: `2px solid ${GOLD}`, boxShadow: '0 30px 70px rgba(0,0,0,0.55)', background: '#1a0a10',
                                }}>
                                    {reduced ? (
                                        <img src={asset('/assets/img/hero/reel-fairies-poster.jpg')} alt="Fairies cake by Saralöwe"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        <video autoPlay muted loop playsInline preload="auto"
                                            poster={asset('/assets/img/hero/reel-fairies-poster.jpg')}
                                            aria-label="Fairies cake by Saralöwe"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
                                            <source src={asset('/assets/img/hero/reel-fairies.mp4')} type="video/mp4" />
                                        </video>
                                    )}
                                </div>
                            </div>
                            <p style={{
                                margin: '22px 0 0', textAlign: 'center', fontFamily: 'var(--sl-font-display)', fontStyle: 'italic',
                                color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.72rem',
                            }}>
                                L'art du gâteau
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </HeroShell>
    )
}

export default HeroCinematic
