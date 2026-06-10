/**
 * BrandGallery — SARALÖWE Academy
 * "A World of Couture Identity" — a horizontal-scroll showcase of the academy's
 * couture cake creations. Scrolls horizontally (snap + arrow controls) so each
 * piece is presented like a gallery wall, flowing on from the "How It Works"
 * journey that precedes it (same dark burgundy world).
 */
import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { useTranslation } from 'react-i18next'

const BrandGallery = () => {
    const { t } = useTranslation()
    const route = all_routes
    const scrollerRef = useRef<HTMLDivElement>(null)

    // Couture cake showcase — scrolls horizontally.
    const cakeItems = [
        { src: 'cake/1.png',  caption: t('brandGallery.signatureRibbon', 'Signature Creation') },
        { src: 'cake/2.png',  caption: t('brandGallery.goldSeal', 'Artistry') },
        { src: 'cake/3.png',  caption: t('brandGallery.toileBag', 'Couture Design') },
        { src: 'cake/4.png',  caption: t('brandGallery.stationery', 'Hand-Crafted') },
        { src: 'cake/5.png',  caption: t('brandGallery.thankYouCards', 'Fine Detail') },
        { src: 'cake/6.png',  caption: t('brandGallery.stickerCollection', 'The Masterpiece') },
        { src: 'cake/7.png',  caption: t('brandGallery.sugarArt', 'Sugar Artistry') },
        { src: 'cake/8.png',  caption: t('brandGallery.atelier', 'Atelier Finish') },
        { src: 'cake/9.png',  caption: t('brandGallery.elegance', 'Timeless Elegance') },
        { src: 'cake/10.png', caption: t('brandGallery.couture', 'Couture Craft') },
    ]

    const scrollBy = (dir: number) => {
        const el = scrollerRef.current
        if (!el) return
        // Scroll by roughly one card-and-a-half for a pleasing step.
        el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 520), behavior: 'smooth' })
    }

    return (
        <section className="sl-section sl-section--burg" style={{ position: 'relative', overflow: 'hidden' }}>
            <style>{`
              .sl-hscroll {
                display: flex;
                gap: 1.25rem;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                padding: 0.5rem 0 1.25rem;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;          /* Firefox */
              }
              .sl-hscroll::-webkit-scrollbar { display: none; }   /* WebKit */
              .sl-hscroll__card {
                flex: 0 0 auto;
                width: clamp(220px, 30vw, 340px);
                height: clamp(300px, 40vw, 440px);
                scroll-snap-align: start;
                position: relative;
                overflow: hidden;
                border: 1px solid rgba(197,145,44,0.18);
                cursor: pointer;
              }
              .sl-hscroll__card img {
                width: 100%; height: 100%;
                object-fit: cover; display: block;
                transition: transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94);
              }
              .sl-hscroll__card:hover img { transform: scale(1.06); }
              .sl-hscroll__cap {
                position: absolute; left: 0; right: 0; bottom: 0;
                padding: 2.4rem 1.1rem 1rem;
                background: linear-gradient(to top, rgba(34,8,16,0.85), transparent);
                color: var(--sl-ivory);
                font-family: var(--sl-font-display);
                font-size: 0.95rem; letter-spacing: 0.04em;
                opacity: 0; transform: translateY(8px);
                transition: opacity 0.4s ease, transform 0.4s ease;
              }
              .sl-hscroll__card:hover .sl-hscroll__cap { opacity: 1; transform: translateY(0); }
              .sl-hscroll__card::after {
                content: '';
                position: absolute; top: 0.6rem; right: 0.6rem;
                width: 1.4rem; height: 1.4rem;
                border-top: 1px solid var(--sl-gold);
                border-right: 1px solid var(--sl-gold);
                opacity: 0.55;
              }
              .sl-hscroll-nav {
                width: 46px; height: 46px; border-radius: 50%;
                border: 1px solid rgba(197,145,44,0.4);
                background: rgba(197,145,44,0.08);
                color: var(--sl-gold);
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; transition: all 0.25s ease;
                font-size: 1.1rem;
              }
              .sl-hscroll-nav:hover { background: var(--sl-gold); color: #2A0E18; }
              [dir="rtl"] .sl-hscroll { direction: ltr; }   /* keep scroll direction natural */
            `}</style>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div className="sl-section__header center" data-aos="fade-up" data-aos-duration="800">
                    <div className="sl-ornament justify-content-center">
                        <span className="sl-script" style={{ fontSize: '1.8rem', color: 'var(--sl-gold)' }}>
                            {t('brandGallery.ornament', 'The Atelier')}
                        </span>
                    </div>
                    <h2 className="light" style={{ marginTop: '0.5rem' }}>{t('brandGallery.title', 'A World of Couture Identity')}</h2>
                    <p className="light" style={{ maxWidth: 560, margin: '0 auto' }}>
                        {t('brandGallery.description', "Every creation reflects SARALÖWE's commitment to luxury, artistry, and timeless elegance — explore the world you'll learn to craft.")}
                    </p>
                </div>

                {/* Scroll controls */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{
                        fontFamily: 'var(--sl-font-body)', fontSize: '0.7rem',
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: 'rgba(245,218,223,0.45)',
                    }}>
                        <i className="isax isax-mouse-circle me-1" />
                        {t('brandGallery.scrollHint', 'Scroll to explore')}
                    </span>
                    <div className="d-flex gap-2">
                        <button type="button" className="sl-hscroll-nav" aria-label="Previous" onClick={() => scrollBy(-1)}>
                            <i className="isax isax-arrow-left-2" />
                        </button>
                        <button type="button" className="sl-hscroll-nav" aria-label="Next" onClick={() => scrollBy(1)}>
                            <i className="isax isax-arrow-right-1" />
                        </button>
                    </div>
                </div>

                {/* Horizontal scroller */}
                <div className="sl-hscroll" ref={scrollerRef} data-aos="fade-up" data-aos-duration="800">
                    {cakeItems.map((item, i) => (
                        <div className="sl-hscroll__card" key={i}>
                            <img
                                src={`${process.env.PUBLIC_URL}/assets/img/${item.src}`}
                                srcSet={`${process.env.PUBLIC_URL}/assets/img/${item.src} 1x`}
                                alt={item.caption}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                            />
                            <div className="sl-hscroll__cap">{item.caption}</div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-5" data-aos="fade-up" data-aos-delay="200" data-aos-duration="700">
                    <Link to={route.courseList} className="sl-btn-gold">
                        {t('brandGallery.discoverProgrammes', 'Discover Our Programmes')} <i className="isax isax-arrow-right-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default BrandGallery
