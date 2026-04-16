/**
 * CinematicCTA — SARALÖWE Academy
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-bleed emotional call-to-action section.
 *  • Scroll-driven parallax background (001.jpg gold foil on burgundy)
 *  • Animated spotlight overlay
 *  • Decorative corner frame (pure CSS, no SVG)
 *  • Two CTAs: enrol + browse courses
 *  • Signature script line for emotional resonance
 */
import React, { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { useScrollParallax } from '../hooks/useScrollParallax'

const CinematicCTA: React.FC = () => {
    const route = all_routes
    const scrollY = useScrollParallax()
    const sectionRef = useRef<HTMLElement>(null)

    // Compute bg parallax relative to section top
    const getParallaxOffset = (): number => {
        if (!sectionRef.current) return 0
        const rect = sectionRef.current.getBoundingClientRect()
        const center = rect.top + rect.height / 2
        return center * 0.12
    }

    return (
        <section
            ref={sectionRef}
            className="sl-cinematic-cta sl-section-reveal"
        >
            {/* Parallax background — 001.jpg: gold foil logo on rich burgundy */}
            <div
                className="sl-cinematic-cta__bg"
                style={{
                    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/img/Mockups/001.jpg)`,
                    transform: `translateY(${getParallaxOffset()}px) scale(1.12)`,
                }}
            />

            {/* Gradient overlay */}
            <div className="sl-cinematic-cta__overlay" />

            {/* Atmospheric spotlight */}
            <div className="sl-cinematic-cta__spotlight" />

            {/* Decorative corner frame */}
            <div className="sl-cinematic-cta__frame" aria-hidden="true">
                <span />
            </div>

            {/* Content */}
            <div className="container sl-cinematic-cta__content">
                <div className="row justify-content-center">
                    <div className="col-lg-9 col-xl-8">

                        {/* Eyebrow */}
                        <div
                            className="sl-cinematic-cta__eyebrow"
                            data-aos="fade-down"
                            data-aos-duration="700"
                        >
                            Begin Your Journey
                        </div>

                        {/* Script accent */}
                        <div
                            className="sl-text-reveal"
                            data-aos="fade-up"
                            data-aos-delay="80"
                            data-aos-duration="1000"
                        >
                            <span
                                className="sl-cinematic-cta__script"
                                data-aos="fade-up"
                                data-aos-delay="80"
                            >
                                de la passion à la maîtrise
                            </span>
                        </div>

                        {/* Main title */}
                        <div
                            data-aos="fade-up"
                            data-aos-delay="160"
                            data-aos-duration="1000"
                        >
                            <h2 className="sl-cinematic-cta__title">
                                Elevate Your Art.<br />
                                <span className="sl-shimmer-text">Create the Extraordinary.</span>
                            </h2>
                        </div>

                        {/* Subtitle */}
                        <p
                            className="sl-cinematic-cta__sub"
                            data-aos="fade-up"
                            data-aos-delay="240"
                            data-aos-duration="800"
                        >
                            Join thousands of pastry artists who chose SARALÖWE Academy to master
                            couture cake design — and transformed their passion into a career.
                        </p>

                        {/* Actions */}
                        <div
                            className="sl-cinematic-cta__actions"
                            data-aos="fade-up"
                            data-aos-delay="320"
                            data-aos-duration="700"
                        >
                            <Link to={route.register} className="sl-btn-gold sl-btn-magnetic">
                                <i className="isax isax-user-add" />
                                Enrol Free Today
                            </Link>
                            <Link to={route.courseList} className="sl-btn-outline">
                                Browse Courses
                                <i className="isax isax-arrow-right-1" />
                            </Link>
                        </div>

                        {/* Trust line */}
                        <div
                            style={{
                                marginTop: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '1.5rem',
                                flexWrap: 'wrap',
                            }}
                            data-aos="fade-up"
                            data-aos-delay="400"
                            data-aos-duration="600"
                        >
                            {[
                                { icon: 'isax isax-shield-tick', text: 'Industry-Recognised Certificates' },
                                { icon: 'isax isax-unlimited', text: 'Lifetime Course Access' },
                                { icon: 'isax isax-medal-star', text: 'Award-Winning Tutors' },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        fontFamily: 'var(--sl-font-body)',
                                        fontSize: '0.65rem',
                                        letterSpacing: '0.1em',
                                        color: 'rgba(245,218,223,0.5)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    <i className={item.icon} style={{ color: 'var(--sl-gold)', fontSize: '0.85rem' }} />
                                    {item.text}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}

export default CinematicCTA
