import React from 'react'
import HeroCopy from './HeroCopy'
import Cake3D from './Cake3D'
import { Butterfly, FIG, GOLD, HeroShell, IVORY, Toile, useReducedMotion } from './heroShared'

/**
 * Variant 1 — "Layer by layer (3D)".
 * A real-time 3D couture cake assembles itself next to the headline, guarded
 * by the two Saralöwe lions (from the brand toile), with butterflies around.
 */
const HeroCake3D: React.FC = () => {
    const reduced = useReducedMotion()
    return (
        <HeroShell>
            <Toile n={FIG.cloudC} color={IVORY} width={300} ratio={0.35} className="hv-drift"
                style={{ position: 'absolute', top: 120, right: '18%', opacity: 0.08, zIndex: 2 }} />
            <div className="container" style={{ position: 'relative', zIndex: 3 }}>
                <div className="row align-items-center g-5 g-lg-4">
                    <div className="col-lg-6"><HeroCopy /></div>
                    <div className="col-lg-6">
                        <div style={{ position: 'relative', height: 'min(600px, 92vw)', minHeight: 360 }}>
                            {/* soft golden halo behind the cake */}
                            <div aria-hidden="true" style={{
                                position: 'absolute', left: '50%', top: '48%', width: '78%', aspectRatio: '1',
                                transform: 'translate(-50%, -50%)', borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(197,145,44,0.28) 0%, rgba(197,145,44,0.08) 45%, transparent 70%)',
                            }} />
                            <Toile n={FIG.lionStanding} color={GOLD} width="30%" ratio={0.78}
                                style={{ position: 'absolute', left: '-4%', bottom: '4%', opacity: 0.55, zIndex: 1 }} />
                            <Toile n={FIG.lionStanding} color={GOLD} width="30%" ratio={0.78}
                                style={{ position: 'absolute', right: '-4%', bottom: '4%', opacity: 0.55, zIndex: 1, transform: 'scaleX(-1)' }} />
                            <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                                <Cake3D reduced={reduced} />
                            </div>
                            <div className="hv-wander" style={{ top: '14%', left: '14%', zIndex: 3 }}>
                                <Butterfly n={FIG.butterflyA} size={44} color={GOLD} style={{ position: 'relative' }} />
                            </div>
                            <div className="hv-wander" style={{ top: '30%', right: '10%', zIndex: 3, animationDuration: '18s', animationDelay: '-7s' }}>
                                <Butterfly n={FIG.butterflyB} size={34} color={IVORY} speed={0.28} style={{ position: 'relative', opacity: 0.85 }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HeroShell>
    )
}

export default HeroCake3D
