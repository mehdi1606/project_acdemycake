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
import { useTranslation } from 'react-i18next'

import BannerSection from './section/banner'
import PromoTakeover, { PromoTape, SnowLayer } from '../../../components/promo/PromoTakeover'
import { useActivePromo } from '../../../components/promo/usePromo'
import { ChallengeHomeSection } from '../../../components/challenge/ChallengeBanners'
import { promoDiscountPercent } from '../../../config/promo'
import Benefits from './section/benefits'
import StorySection from './section/story'
import WhyChooseUs from './section/why-choose-us'
import Howitworks from './section/how-it-works'
import BrandGallery from './section/brand-gallery'
import Featureinstructor from './section/feature-instructor'
import SponsorsSection from './section/sponsors'
import Testimonials from './section/testimonials'
import CinematicCTA from './section/cinematic-cta'
import Faq from './section/faq'

// ── Gold marquee strip ────────────────────────────────────────────────────────
const SlMarquee: React.FC = () => {
    const { t } = useTranslation()
    const items = [
        { script: t('home.marquee.fondantSculpting', 'Fondant Sculpting'), mono: t('home.marquee.masterClass', 'Master Class') },
        { script: t('home.marquee.sugarFlowers', 'Sugar Flowers'),         mono: t('home.marquee.atelier', 'Atelier')           },
        { script: t('home.marquee.isomaltArt', 'Isomalt Art'),             mono: t('home.marquee.advanced', 'Advanced')         },
        { script: t('home.marquee.waferPaper', 'Wafer Paper'),             mono: t('home.marquee.techniques', 'Techniques')     },
        { script: t('home.marquee.airbrushing', 'Airbrushing'),            mono: t('home.marquee.essentials', 'Essentials')     },
        { script: t('home.marquee.royalIcing', 'Royal Icing'),             mono: t('home.marquee.couture', 'Couture')           },
        { script: t('home.marquee.weddingCakes', 'Wedding Cakes'),         mono: t('home.marquee.workshop', 'Workshop')         },
        { script: t('home.marquee.chocolateWork', 'Chocolate Work'),       mono: t('home.marquee.masterclass', 'Masterclass')   },
    ]
    const track = [...items, ...items]

    return (
        <div className="sl-marquee" aria-hidden="true">
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

// ── Smooth blend between a light (ivory) section and a dark (burgundy) one ─────
// Removes the hard colour edge so the page scrolls as one continuous flow.
const IVORY = '#F2EFE8';
const DARK_EDGE = '#4A1425'; // matches the dark sections' radial edge tone
const SectionTransition: React.FC<{ to: 'dark' | 'light' }> = ({ to }) => (
    <div
        aria-hidden="true"
        style={{
            height: 72,
            marginBottom: -1, // avoid sub-pixel seam against the next section
            background:
                to === 'dark'
                    ? `linear-gradient(to bottom, ${IVORY} 0%, ${DARK_EDGE} 100%)`
                    : `linear-gradient(to bottom, ${DARK_EDGE} 0%, ${IVORY} 100%)`,
        }}
    />
)

// ── Page ──────────────────────────────────────────────────────────────────────
const HomeOne: React.FC = () => {
    const { t } = useTranslation();
    useEffect(() => {
        AOS.init({
            once: true,
            easing: 'ease-out-cubic',
            duration: 800,
            offset: 55,
        })
        AOS.refresh()
    }, [])

    // Limited-time offer (Black Friday / Christmas) themes the whole home page while it runs.
    const active = useActivePromo()
    const promo = active?.promo ?? null
    const promoTheme = promo?.theme
    // Theme the (shared) header while the offer runs on the home page.
    useEffect(() => {
        if (!promoTheme) return
        const cls = `sl-promo-theme--${promoTheme}`
        document.body.classList.add(cls)
        return () => document.body.classList.remove(cls)
    }, [promoTheme])

    return (
        <div className={promo ? `sl-home-promo sl-home-promo--${promo.theme}` : undefined}>
            {/* 1 — Cinematic hero, replaced by the themed offer hero while an offer runs */}
            {promo ? (
                <>
                    {promo.theme === 'christmas' && <SnowLayer fixed />}
                    <PromoTakeover />
                    <PromoTape theme={promo.theme} off={promoDiscountPercent(promo)} />
                </>
            ) : (
                <BannerSection />
            )}

            {/* 2 — Marquee discipline strip */}
            <SlMarquee />

            {/* The New Year Cake Challenge (shows itself only while it runs) */}
            <ChallengeHomeSection />

            {/* 3 — Featured Courses (hidden until courses are published) */}
            {/* <Featuredcourse /> */}

            {/* 3 — Brand Identity Gallery (couture showcase — now the 2nd section) */}
            <BrandGallery />

            {/* ↑ blend from the dark gallery into the light sections */}
            <SectionTransition to="light" />

            {/* 4 — Why Choose Us (animated stats + visual panels) */}
            <WhyChooseUs />

            {/* 5 — Benefits + certificate visual */}
            <Benefits />

            {/* 5b — Where the Story Began (heritage + formation album) */}
            <StorySection />

            {/* ↓ smooth blend into the dark "atelier" block */}
            <SectionTransition to="dark" />

            {/* 6 — How It Works (split layout) */}
            <Howitworks />

            {/* 7 — Featured Instructors */}
            <Featureinstructor />

            {/* ↑ blend back to light */}
            <SectionTransition to="light" />

            {/* 8 — Sponsors / partners (auto-scrolling marquee) — right after Meet The Author */}
            <SponsorsSection />

            {/* 9 — Testimonials + trust stats */}
            <Testimonials />

            {/* ↓ blend into the cinematic closer */}
            <SectionTransition to="dark" />

            {/* 10 — Cinematic CTA (full-bleed) */}
            <CinematicCTA />

            {/* ↑ blend back to light */}
            <SectionTransition to="light" />

            {/* 11 — FAQ */}
            <Faq />
        </div>
    )
}

export default HomeOne
