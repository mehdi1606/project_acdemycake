/**
 * HomeOne — SARALÖWE Academy
 * ─────────────────────────────────────────────────────────────────────────────
 * Cinematic page assembly. Section order follows a storytelling arc:
 *
 *  1. Hero (cinematic intro — first impression)
 *  2. Marquee (brand disciplines — context building)
 *  3. Featured Courses (3D tilt cards — product showcase)
 *  4. Why Choose Us (animated stats + visual story — social proof)
 *  5. Benefits (certificate mockup + 3 pillars — trust building)
 *  6. How It Works (split layout — conversion path)
 *  7. Brand Gallery (identity showcase — emotional depth)
 *  8. Featured Instructors (faces — human connection)
 *  9. Testimonials (social proof — peer validation)
 * 10. Cinematic CTA (full-bleed emotional closer — conversion)
 * 11. FAQ (objection handling — support)
 * 12. Footer
 */
import React, { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

import BannerSection from './section/banner'
import Benefits from './section/benefits'
import Featuredcourse from './section/featured-course'
import WhyChooseUs from './section/why-choose-us'
import Howitworks from './section/how-it-works'
import BrandGallery from './section/brand-gallery'
import Featureinstructor from './section/feature-instructor'
import Testimonials from './section/testimonials'
import CinematicCTA from './section/cinematic-cta'
import Faq from './section/faq'

// ── Gold marquee strip ────────────────────────────────────────────────────────
const SlMarquee: React.FC = () => {
    const items = [
        { script: 'Fondant Sculpting', mono: 'Master Class'  },
        { script: 'Sugar Flowers',     mono: 'Atelier'       },
        { script: 'Isomalt Art',       mono: 'Advanced'      },
        { script: 'Wafer Paper',       mono: 'Techniques'    },
        { script: 'Airbrushing',       mono: 'Essentials'    },
        { script: 'Royal Icing',       mono: 'Couture'       },
        { script: 'Wedding Cakes',     mono: 'Workshop'      },
        { script: 'Chocolate Work',    mono: 'Masterclass'   },
    ]
    const track = [...items, ...items]

    return (
        <div className="sl-marquee">
            <div className="sl-marquee__track">
                {track.map((item, i) => (
                    <div key={i} className="sl-marquee__item">
                        <span className="sl-marquee__text">{item.script}</span>
                        <span className="sl-marquee__dot">✦</span>
                        <span className="sl-marquee__text-mono">{item.mono}</span>
                        <span className="sl-marquee__dot">✦</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const HomeOne: React.FC = () => {
    useEffect(() => {
        AOS.init({
            once: true,
            easing: 'ease-out-cubic',
            duration: 800,
            offset: 55,
        })
        AOS.refresh()
    }, [])

    return (
        <div>
            {/* 1 — Cinematic hero */}
            <BannerSection />

            {/* 2 — Marquee discipline strip */}
            <SlMarquee />

            {/* 3 — Featured Courses (3D tilt) */}
            <Featuredcourse />

            {/* 4 — Why Choose Us (animated stats + visual panels) */}
            <WhyChooseUs />

            {/* 5 — Benefits + certificate visual */}
            <Benefits />

            {/* 6 — How It Works (split layout) */}
            <Howitworks />

            {/* 7 — Brand Identity Gallery */}
            <BrandGallery />

            {/* 8 — Featured Instructors */}
            <Featureinstructor />

            {/* 9 — Testimonials + trust stats */}
            <Testimonials />

            {/* 10 — Cinematic CTA (full-bleed) */}
            <CinematicCTA />

            {/* 11 — FAQ */}
            <Faq />
        </div>
    )
}

export default HomeOne
