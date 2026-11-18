import React from 'react'
import { Butterfly, drawing } from './heroShared'

/**
 * The living animals of the garden wallpaper.
 *
 * Each one is the brand toile drawing cut into parts with CSS clip-paths (the
 * same image stacked several times, each copy showing one part), so the parts
 * can move on their own: legs swing, a tail sways, a head turns, a wing beats.
 * Coordinates are % of each drawing's own box.
 */

type Part = { clip: string; origin: string; className?: string; style?: React.CSSProperties }

const Puppet: React.FC<{ n: number; parts: Part[]; flip?: boolean }> = ({ n, parts, flip }) => (
    <div style={{ position: 'relative', width: '100%', transform: flip ? 'scaleX(-1)' : undefined }}>
        {/* sizing copy (invisible) */}
        <img src={drawing(n)} alt="" style={{ display: 'block', width: '100%', height: 'auto', visibility: 'hidden' }} />
        {parts.map((p, i) => (
            <div key={i} className={p.className} style={{
                position: 'absolute', inset: 0, clipPath: p.clip, WebkitClipPath: p.clip,
                transformOrigin: p.origin, ...p.style,
            }}>
                <img src={drawing(n)} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
            </div>
        ))}
    </div>
)

const rect = (x0: number, y0: number, x1: number, y1: number) =>
    `polygon(${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`

/** The standing lion (drawing 03), facing right. Walks while `walking`, then idles. */
export const WalkingLion: React.FC<{ walking: boolean }> = ({ walking }) => {
    const legA = walking ? 'hv-leg hv-leg--a' : 'hv-leg-rest'
    const legB = walking ? 'hv-leg hv-leg--b' : 'hv-leg-rest'
    return (
        <div className={walking ? 'hv-body-walk' : 'hv-breathe'}>
            <Puppet n={3} parts={[
                // far legs first, then body, near legs, tail
                { clip: rect(27, 64.5, 39, 93), origin: '33% 65%', className: legB },        // back leg (far)
                { clip: rect(53, 63.5, 61.3, 90), origin: '57% 64%', className: legA },      // front leg (far)
                { clip: 'polygon(0% 0%, 100% 0%, 100% 64%, 53% 64%, 53% 65.5%, 25% 65.5%, 25% 46%, 0% 46%)', origin: '50% 50%' }, // body + head
                { clip: rect(17.5, 65.5, 27, 93), origin: '22% 66%', className: legA },      // back leg (near)
                { clip: rect(61.3, 63.5, 70, 90), origin: '65% 64%', className: legB },      // front leg (near)
                { clip: 'polygon(0% 46%, 25% 46%, 25% 65.5%, 17.5% 65.5%, 17.5% 93%, 0% 93%)', origin: '23% 47%', className: 'hv-tail' },
            ]} />
        </div>
    )
}

/** The resting lion (drawing 02): breathes and slowly looks around. */
export const RestingLion: React.FC = () => (
    <div className="hv-breathe" style={{ animationDuration: '4.6s' }}>
        <Puppet n={2} parts={[
            { clip: 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 16.7% 12%, 55.8% 12%, 55.8% 59%, 16.7% 59%, 16.7% 12%)', origin: '50% 50%' },
            { clip: rect(16.7, 12, 55.8, 59), origin: '38% 56%', className: 'hv-head-look' },
        ]} />
    </div>
)

/** A bird (drawing 26) whose raised wing beats from the shoulder. */
export const FlappingBird: React.FC<{ speed?: number }> = ({ speed = 0.3 }) => (
    <Puppet n={26} parts={[
        { clip: 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 30% 3%, 70% 3%, 70% 60%, 55% 66%, 30% 58%, 30% 3%)', origin: '50% 50%' },
        { clip: 'polygon(30% 3%, 70% 3%, 70% 60%, 55% 66%, 30% 58%)', origin: '55% 64%', className: 'hv-flap', style: { animationDuration: `${speed}s` } },
    ]} />
)

/** The garden butterfly (drawing 27) in the wallpaper red, wings beating. */
export const GardenButterfly: React.FC<{ size: number }> = ({ size }) => (
    <Butterfly n={27} color="#A61E2F" size={size} speed={0.22} style={{ position: 'relative' }} />
)
