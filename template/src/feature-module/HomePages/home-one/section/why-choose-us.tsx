/**
 * WhyChooseUs — SARALÖWE Academy
 * ─────────────────────────────────────────────────────────────────────────────
 * Cinematic "Why Choose Us" section with:
 *  • Animated count-up stats on scroll-entry
 *  • Visual story panels (3 mockup images with overlay labels)
 *  • Cinematic scan-line dark background
 *  • Staggered entrance animations
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'

// ── Individual animated stat ──────────────────────────────────────────────────
const Stat: React.FC<{
    end: number
    suffix?: string
    prefix?: string
    label: string
    desc: string
    inView: boolean
    delay?: number
}> = ({ end, suffix = '', prefix = '', label, desc, inView, delay = 0 }) => {
    const count = useCountUp(end, 2000, 0, inView)
    return (
        <div
            className="sl-why__stat"
            data-aos="fade-up"
            data-aos-delay={delay}
            data-aos-duration="800"
        >
            <div className="sl-why__label">{label}</div>
            <div className="sl-why__number">
                {prefix}
                <span className="sl-stat-number"
                    style={{ '--delay': `${delay}ms` } as React.CSSProperties}>
                    {count}
                </span>
                {suffix && (
                    <span className="sl-why__suffix">{suffix}</span>
                )}
            </div>
            <p className="sl-why__desc">{desc}</p>
        </div>
    )
}

// ── Visual story panel ────────────────────────────────────────────────────────
const StoryPanel: React.FC<{
    src: string
    fallbackSrc?: string
    label: string
    sub?: string
    tall?: boolean
    delay?: number
}> = ({ src, fallbackSrc, label, sub, tall = false, delay = 0 }) => (
    <div
        className="sl-why-mockup"
        style={{
            height: tall ? '420px' : '280px',
            position: 'relative',
            overflow: 'hidden',
        }}
        data-aos="fade-up"
        data-aos-delay={delay}
        data-aos-duration="900"
    >
        <img
            src={`${process.env.PUBLIC_URL}/assets/img/${src}`}
            alt={label}
            onError={e => {
                const img = e.target as HTMLImageElement
                if (fallbackSrc) img.src = `${process.env.PUBLIC_URL}/assets/img/${fallbackSrc}`
                else img.parentElement!.style.display = 'none'
            }}
        />
        <div className="sl-why-mockup__label">
            {label}
            {sub && (
                <span style={{
                    display: 'block',
                    fontFamily: 'var(--sl-font-body)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(245,218,223,0.5)',
                    marginTop: '0.25rem',
                }}>
                    {sub}
                </span>
            )}
        </div>
    </div>
)

// ── Main Section ──────────────────────────────────────────────────────────────
const WhyChooseUs: React.FC = () => {
    const route = all_routes
    const { ref, inView } = useInView<HTMLDivElement>(0.2)

    return (
        <section className="sl-why sl-section" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
            {/* Decorative graphic */}
            <img
                src={`${process.env.PUBLIC_URL}/assets/img/Graphics/Graphics Elements-09.svg`}
                alt="" aria-hidden="true"
                style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '30%', opacity: 0.04, pointerEvents: 'none',
                }}
            />

            <div className="container" style={{ position: 'relative', zIndex: 2 }}>

                {/* Section header */}
                <div
                    className="sl-section__header center"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <div className="sl-ornament justify-content-center">
                        <span className="sl-script" style={{ fontSize: '1.8rem', color: 'var(--sl-gold)' }}>
                            By the numbers
                        </span>
                    </div>
                    <h2 className="light" style={{ marginTop: '0.4rem' }}>Why SARALÖWE Stands Apart</h2>
                    <p className="light">
                        Numbers that reflect a decade of craftsmanship, community, and couture education.
                    </p>
                </div>

                {/* ── Animated stats grid ── */}
                <div ref={ref} className="row g-0 mb-5">
                    <div className="col-md-3 col-6">
                        <Stat end={50} suffix="K+" label="Students Worldwide" desc="Across 50+ countries who have transformed their passion into profession." inView={inView} delay={0} />
                    </div>
                    <div className="col-md-3 col-6">
                        <Stat end={98} suffix="%" label="Satisfaction Rate" desc="Students who rate SARALÖWE 5 stars and would recommend it." inView={inView} delay={120} />
                    </div>
                    <div className="col-md-3 col-6">
                        <Stat end={120} suffix="+" label="Expert Courses" desc="Programmes spanning every discipline of couture pastry design." inView={inView} delay={240} />
                    </div>
                    <div className="col-md-3 col-6">
                        <Stat end={15} suffix="+" label="Award-Winning Tutors" desc="World-class pastry artists guiding you step by step." inView={inView} delay={360} />
                    </div>
                </div>

                {/* ── Visual story panels ── */}
                <div
                    className="sl-cinematic-divider mb-5"
                    data-aos="fade-up"
                    data-aos-duration="600"
                />

                <div className="row g-3">
                    {/* Tall feature panel */}
                    <div className="col-md-5">
                        <StoryPanel
                            src="Mockups/013.jpg"
                            fallbackSrc="Mockups/011.jpg"
                            label="Prestige Stationery"
                            sub="Every detail, considered"
                            tall
                            delay={0}
                        />
                    </div>
                    {/* Two stacked panels */}
                    <div className="col-md-7">
                        <div className="row g-3 h-100">
                            <div className="col-12">
                                <StoryPanel
                                    src="Mockups/004.jpg"
                                    fallbackSrc="Mockups/003.jpg"
                                    label="Saralöwe Academy Studio"
                                    sub="CRAFTED BY SCIENCE, ELEVATED BY ART"
                                    delay={100}
                                />
                            </div>
                            <div className="col-6">
                                <StoryPanel
                                    src="Mockups/007 (1).jpg"
                                    fallbackSrc="Mockups/009.jpg"
                                    label="Signature Pattern"
                                    delay={200}
                                />
                            </div>
                            <div className="col-6">
                                <StoryPanel
                                    src="Mockups/012.jpg"
                                    fallbackSrc="Mockups/011.jpg"
                                    label="Toile de Jouy"
                                    delay={300}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div
                    className="text-center mt-5"
                    data-aos="fade-up"
                    data-aos-delay="200"
                    data-aos-duration="700"
                >
                    <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
                        Discover Our World <i className="isax isax-arrow-right-1" />
                    </Link>
                </div>

            </div>
        </section>
    )
}

export default WhyChooseUs
