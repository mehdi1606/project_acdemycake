import React, { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import BannerSection from './section/banner'
import Benefits from './section/benefits'
import Featuredcourse from './section/featured-course'
import Howitworks from './section/how-it-works'
import BrandGallery from './section/brand-gallery'
import Featureinstructor from './section/feature-instructor'
import Testimonials from './section/testimonials'
import Faq from './section/faq'
import Footer from './footer'

// ── Marquee strip ────────────────────────────────────────────────────────────
const SlMarquee = () => {
    const items = [
        { script: 'Fondant Sculpting',  mono: 'Master Class'  },
        { script: 'Sugar Flowers',      mono: 'Atelier'       },
        { script: 'Isomalt Art',        mono: 'Advanced'      },
        { script: 'Wafer Paper',        mono: 'Techniques'    },
        { script: 'Airbrushing',        mono: 'Essentials'    },
        { script: 'Royal Icing',        mono: 'Couture'       },
        { script: 'Wedding Cakes',      mono: 'Workshop'      },
        { script: 'Chocolate Work',     mono: 'Masterclass'   },
    ]
    const track = [...items, ...items] // duplicate for seamless loop
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

// ── Main HomeOne page ────────────────────────────────────────────────────────
const HomeOne = () => {
    useEffect(() => {
        AOS.init({
            once: true,          // animate only once per element
            easing: 'ease-out-cubic',
            duration: 800,
            offset: 60,
        })
        // Re-apply after any dynamic content updates
        AOS.refresh()
    }, [])

    return (
        <div>
            {/* 1. Hero */}
            <BannerSection />

            {/* 2. Gold marquee discipline strip */}
            <SlMarquee />

            {/* 3. Why Us / Benefits (with certificate mockup) */}
            <Benefits />

            {/* 4. Featured Courses */}
            <Featuredcourse />

            {/* 5. How It Works (with storefront image) */}
            <Howitworks />

            {/* 6. Brand Identity Gallery */}
            <BrandGallery />

            {/* 7. Featured Instructors */}
            <Featureinstructor />

            {/* 8. Testimonials + Trust Stats */}
            <Testimonials />

            {/* 9. FAQ */}
            <Faq />

            {/* 10. Footer */}
            <Footer />
        </div>
    )
}

export default HomeOne
