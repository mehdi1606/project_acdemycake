import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { all_routes } from '../../../router/all_routes'
import { courseService } from '../../../../services/api/course.service'
import { PlatformStats } from '../../../../services/api/types'
import { useScrollParallax } from '../hooks/useScrollParallax'
import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatK = (n: number): { value: number; suffix: string } => {
    if (n >= 1000) return { value: Math.floor(n / 1000), suffix: 'K+' }
    return { value: n, suffix: '+' }
}

// ── Animated stat counter ─────────────────────────────────────────────────────
const StatItem: React.FC<{
    rawValue: number
    label: string
    delay?: number
    inView: boolean
}> = ({ rawValue, label, delay = 0, inView }) => {
    const { value, suffix } = formatK(rawValue)
    const count = useCountUp(value, 2000, 0, inView)
    return (
        <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{
                fontFamily: 'var(--sl-font-display)',
                fontSize: '2rem', fontWeight: 700,
                color: 'var(--sl-gold)', lineHeight: 1,
                animationDelay: `${delay}ms`,
            }}>
                <span className="sl-stat-number" style={{ '--delay': `${delay}ms` } as React.CSSProperties}>
                    {count}
                </span>
                <span style={{ fontSize: '1.1rem', color: 'var(--sl-gold-lt)' }}>{suffix}</span>
            </div>
            <div style={{
                fontFamily: 'var(--sl-font-body)',
                fontSize: '0.58rem', letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(245,218,223,0.45)',
                marginTop: '0.3rem',
            }}>
                {label}
            </div>
        </div>
    )
}

// ── Main Banner ───────────────────────────────────────────────────────────────
const BannerSection: React.FC = () => {
  const { t } = useTranslation();
    const route = all_routes
    const navigate = useNavigate()
    const scrollY = useScrollParallax()
    const { ref: statsRef, inView: statsVisible } = useInView<HTMLDivElement>(0.3)
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [imgLoaded, setImgLoaded] = useState(false)

    // Mouse-tracking for 3D mockup tilt
    const mockupRef = useRef<HTMLDivElement>(null)
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const el = mockupRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        el.style.transition = 'transform 0.1s linear'
        el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 14}deg) scale(1.02)`
    }, [])
    const handleMouseLeave = useCallback(() => {
        if (!mockupRef.current) return
        mockupRef.current.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        mockupRef.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)'
    }, [])

    useEffect(() => {
        courseService.getPlatformStats().then(setStats).catch(() => {})
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        navigate(route.courseList)
    }

    // Scroll-driven values
    const _bgParallax = scrollY * 0.3
    const graphicParallax = scrollY * 0.15
    const contentParallax = scrollY * 0.08

    return (
        <section
            className="sl-banner"
            style={{
                cursor: 'default',
                backgroundImage: `url(${process.env.PUBLIC_URL}/assets/img/Landscape.jpeg)`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Layer 1: Graphic element (slowest parallax) ── */}
            <img
                src={`${process.env.PUBLIC_URL}/assets/img/Graphics/Graphics Elements-09.svg`}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute', top: '-80px', right: '-100px',
                    width: '560px', opacity: 0.07, pointerEvents: 'none',
                    zIndex: 3,
                    transform: `translateY(${graphicParallax * 0.5}px) rotate(${graphicParallax * 0.01}deg)`,
                    transition: 'transform 0.1s linear',
                }}
            />
            <img
                src={`${process.env.PUBLIC_URL}/assets/img/Graphics/Graphics Elements-13.svg`}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute', bottom: '-40px', left: '-60px',
                    width: '380px', opacity: 0.05, pointerEvents: 'none',
                    zIndex: 3,
                    transform: `translateY(${-graphicParallax * 0.3}px)`,
                    transition: 'transform 0.1s linear',
                }}
            />

            {/* ── Particle floaters ── */}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="sl-particle"
                        style={{
                            left: `${12 + i * 15}%`,
                            bottom: `${10 + (i % 3) * 8}%`,
                            animationDelay: `${i * 0.8}s`,
                        }}
                    />
                ))}
            </div>

            <div
                className="container"
                style={{
                    position: 'relative', zIndex: 3,
                    transform: `translateY(${contentParallax}px)`,
                    transition: 'transform 0.1s linear',
                }}
            >
                <div className="row align-items-center g-5 g-lg-4">

                    {/* ── Left — Copy ── */}
                    <div className="col-lg-6">
                        <div className="sl-banner__content">

                            {/* Eyebrow badge */}
                            <div
                                className="sl-banner__badge"
                                data-aos="fade-down"
                                data-aos-duration="700"
                            >
                                <span>{t('banner.couturePastry', 'Couture Pastry · Academy Est. 2010')}</span>
                            </div>

                            {/* Animated title block */}
                            <div
                                className="sl-text-reveal"
                                style={{ overflow: 'hidden', marginBottom: '0.25rem' }}
                                data-aos="fade-up"
                                data-aos-delay="60"
                                data-aos-duration="1000"
                            >
                                <span
                                    className="sl-banner__tagline"
                                    style={{ display: 'block' }}
                                >
                                    {t('banner.theArtOfCake', 'The Art of Cake')}
                                </span>
                            </div>

                            <div
                                className="sl-text-reveal"
                                data-aos="fade-up"
                                data-aos-delay="140"
                                data-aos-duration="1000"
                            >
                                <h1
                                    className="sl-banner__title sl-shimmer-text"
                                    style={{ marginBottom: '0.2rem' }}
                                >
                                    SARALÖWE
                                </h1>
                            </div>

                            <p
                                className="sl-banner__sub"
                                data-aos="fade-up"
                                data-aos-delay="220"
                                data-aos-duration="700"
                            >
                                {t('banner.academySubtitle', 'Academy of Couture Pastry Design')}
                            </p>

                            <p
                                className="sl-banner__description"
                                data-aos="fade-up"
                                data-aos-delay="300"
                                data-aos-duration="800"
                            >
                                {t('banner.description', "Master the world's most coveted sugar art techniques under elite pastry artists. Bespoke programmes, lifetime access, and certificates recognised by luxury hospitality brands globally.")}
                            </p>

                            {/* Search */}
                            <form
                                onSubmit={handleSubmit}
                                className="sl-banner__search"
                                data-aos="fade-up"
                                data-aos-delay="380"
                                data-aos-duration="700"
                            >
                                <button type="button" className="sl-search-category"
                                    onClick={() => navigate(route.courseList)}>
                                    {t('banner.allDisciplines', 'All Disciplines')}
                                    <i className="isax isax-arrow-down5" style={{ fontSize: '0.7rem', marginLeft: 4 }} />
                                </button>
                                <div className="search-divider" />
                                <input
                                    type="text"
                                    placeholder={t('banner.searchPlaceholder', 'Search courses, techniques…')}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="sl-search-btn">
                                    <i className="isax isax-search-normal" />
                                </button>
                            </form>

                            {/* CTAs */}
                            <div
                                className="d-flex align-items-center gap-3 flex-wrap mb-5"
                                data-aos="fade-up"
                                data-aos-delay="440"
                                data-aos-duration="700"
                            >
                                <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
                                    {t('banner.exploreCourses', 'Explore Courses')} <i className="isax isax-arrow-right-1" />
                                </Link>
                                <Link to={route.register} className="sl-btn-outline">
                                    {t('banner.enrolFree', 'Enrol Free')}
                                </Link>
                            </div>

                            {/* Animated stats */}
                            <div
                                ref={statsRef}
                                className="d-flex align-items-center gap-4 flex-wrap"
                                data-aos="fade-up"
                                data-aos-delay="520"
                                data-aos-duration="700"
                            >
                                {stats && (
                                    <>
                                        <StatItem rawValue={stats.totalCourses} label={t('banner.courses', 'Courses')} inView={statsVisible} delay={0} />
                                        <div style={{ width: 1, height: 36, background: 'rgba(197,145,44,0.22)', flexShrink: 0 }} />
                                        <StatItem rawValue={stats.totalEnrollments} label={t('banner.enrolments', 'Enrolments')} inView={statsVisible} delay={200} />
                                        <div style={{ width: 1, height: 36, background: 'rgba(197,145,44,0.22)', flexShrink: 0 }} />
                                        <StatItem rawValue={stats.totalInstructors} label={t('banner.expertTutors', 'Expert Tutors')} inView={statsVisible} delay={400} />
                                    </>
                                )}
                                {!stats && (
                                    <div style={{
                                        fontFamily: 'var(--sl-font-body)',
                                        fontSize: '0.7rem',
                                        color: 'rgba(245,218,223,0.3)',
                                        letterSpacing: '0.1em',
                                    }}>
                                        {t('banner.loading', '— Loading —')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right — 3D Mockup ── */}
                    <div
                        className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center"
                        data-aos="fade-left"
                        data-aos-delay="180"
                        data-aos-duration="1100"
                    >
                        {/* 3D tilt container */}
                        <div
                            ref={mockupRef}
                            className="sl-tilt-wrap"
                            style={{
                                position: 'relative',
                                maxWidth: 480,
                                width: '100%',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            {/* Outer gold frame */}
                            <div style={{
                                position: 'absolute', top: -14, left: -14, right: -14, bottom: -14,
                                border: '1px solid rgba(197,145,44,0.16)',
                                pointerEvents: 'none', zIndex: 0,
                            }} />
                            {/* Corner marks */}
                            {[
                                { top: -5, left: -5, borderTop: '2px solid var(--sl-gold)', borderLeft: '2px solid var(--sl-gold)' },
                                { top: -5, right: -5, borderTop: '2px solid var(--sl-gold)', borderRight: '2px solid var(--sl-gold)' },
                                { bottom: -5, left: -5, borderBottom: '2px solid var(--sl-gold)', borderLeft: '2px solid var(--sl-gold)' },
                                { bottom: -5, right: -5, borderBottom: '2px solid var(--sl-gold)', borderRight: '2px solid var(--sl-gold)' },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    position: 'absolute', width: 22, height: 22,
                                    pointerEvents: 'none', zIndex: 2, ...s,
                                }} />
                            ))}

                            {/* Hero mockup image — big couture cake */}
                            <img
                                src={`/assets/img/Mockups/006.jpg`}
                                alt="SARALÖWE — Couture Cake Design"
                                style={{
                                    width: '100%', display: 'block',
                                    position: 'relative', zIndex: 1,
                                    opacity: imgLoaded ? 1 : 0,
                                    transition: 'opacity 0.8s ease, filter 0.5s ease',
                                    filter: 'brightness(1.0) contrast(1.05) saturate(1.08)',
                                }}
                                onLoad={() => setImgLoaded(true)}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />

                            {/* Floating accreditation card */}
                            <div
                                data-aos="fade-right"
                                data-aos-delay="650"
                                data-aos-duration="700"
                                style={{
                                    position: 'absolute', bottom: -28, left: -28,
                                    background: 'rgba(29,60,52,0.96)',
                                    border: '1px solid rgba(197,145,44,0.32)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    padding: '1rem 1.4rem',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    zIndex: 4,
                                    transform: 'translateZ(20px)',
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                                }}
                            >
                                <img
                                    src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                                    alt=""
                                    style={{ width: 36, height: 36, objectFit: 'contain' }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <div>
                                    <div style={{
                                        fontFamily: 'var(--sl-font-body)', fontSize: '0.56rem',
                                        letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sl-gold)',
                                    }}>
                                        {t('banner.industryRecognised', 'Industry Recognised')}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--sl-font-display)', fontSize: '0.8rem', color: 'var(--sl-blush)',
                                    }}>
                                        {t('banner.certificatesEst', 'Certificates · Est. 2010')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default BannerSection
