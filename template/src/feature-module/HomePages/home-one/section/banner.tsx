import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { courseService } from '../../../../services/api/course.service'
import { PlatformStats } from '../../../../services/api/types'

const formatCount = (count: number): string => {
    if (count >= 1000) return `${Math.floor(count / 1000)}K+`
    return count.toString()
}

const BannerSection = () => {
    const route = all_routes
    const navigate = useNavigate()
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        courseService.getPlatformStats()
            .then(setStats)
            .catch(() => {})
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        navigate(route.courseList)
    }

    return (
        <section className="sl-banner">
            {/* ── Decorative graphic ring (top-right) ── */}
            <img
                src={`${process.env.PUBLIC_URL}/assets/img/Graphics/Graphics Elements-09.svg`}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute', top: '-60px', right: '-80px',
                    width: '520px', opacity: 0.07, pointerEvents: 'none',
                    zIndex: 1,
                }}
            />

            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div className="row align-items-center g-5">

                    {/* ── Left column — copy ── */}
                    <div className="col-lg-6 col-xl-6">
                        <div className="sl-banner__content">

                            {/* Overline */}
                            <div
                                className="sl-banner__badge"
                                data-aos="fade-down"
                                data-aos-duration="700"
                            >
                                <span>Couture Pastry · Academy Est. 2010</span>
                            </div>

                            {/* Script tagline */}
                            <div
                                className="sl-banner__tagline"
                                data-aos="fade-up"
                                data-aos-delay="80"
                                data-aos-duration="800"
                            >
                                The Art of Cake
                            </div>

                            {/* Main title */}
                            <h1
                                className="sl-banner__title"
                                data-aos="fade-up"
                                data-aos-delay="150"
                                data-aos-duration="900"
                            >
                                SARALÖWE
                            </h1>
                            <p
                                className="sl-banner__sub"
                                data-aos="fade-up"
                                data-aos-delay="200"
                                data-aos-duration="700"
                            >
                                Academy of Couture Pastry Design
                            </p>

                            {/* Description */}
                            <p
                                className="sl-banner__description"
                                data-aos="fade-up"
                                data-aos-delay="260"
                                data-aos-duration="800"
                            >
                                Master the world's most coveted sugar art techniques under elite
                                pastry artists. Bespoke programmes, lifetime access, and certificates
                                recognised by luxury hospitality brands globally.
                            </p>

                            {/* Search bar */}
                            <form
                                onSubmit={handleSubmit}
                                className="sl-banner__search"
                                data-aos="fade-up"
                                data-aos-delay="320"
                                data-aos-duration="700"
                            >
                                <button
                                    type="button"
                                    className="sl-search-category"
                                    onClick={() => navigate(route.courseList)}
                                >
                                    All Disciplines
                                    <i className="isax isax-arrow-down5" style={{ fontSize: '0.7rem', marginLeft: '4px' }} />
                                </button>
                                <div className="search-divider" />
                                <input
                                    type="text"
                                    placeholder="Search courses, techniques…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="sl-search-btn">
                                    <i className="isax isax-search-normal" />
                                </button>
                            </form>

                            {/* CTA row */}
                            <div
                                className="d-flex align-items-center gap-3 flex-wrap mb-5"
                                data-aos="fade-up"
                                data-aos-delay="380"
                                data-aos-duration="700"
                            >
                                <Link to={route.courseList} className="sl-btn-gold">
                                    Explore Courses
                                    <i className="isax isax-arrow-right-1" />
                                </Link>
                                <Link to={route.register} className="sl-btn-outline">
                                    Enrol Free
                                </Link>
                            </div>

                            {/* Stats strip */}
                            <div
                                className="d-flex align-items-center gap-4 flex-wrap"
                                data-aos="fade-up"
                                data-aos-delay="440"
                                data-aos-duration="700"
                            >
                                {[
                                    { value: stats ? formatCount(stats.totalCourses) : '—', label: 'Courses' },
                                    { value: stats ? formatCount(stats.totalEnrollments) : '—', label: 'Enrolments' },
                                    { value: stats ? formatCount(stats.totalInstructors) : '—', label: 'Expert Tutors' },
                                ].map((stat, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && (
                                            <div style={{ width: 1, height: 32, background: 'rgba(197,145,44,0.25)', flexShrink: 0 }} />
                                        )}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{
                                                fontFamily: 'var(--sl-font-display)',
                                                fontSize: '1.6rem', fontWeight: 700,
                                                color: 'var(--sl-gold)', lineHeight: 1,
                                            }}>
                                                {stat.value}
                                            </div>
                                            <div style={{
                                                fontFamily: 'var(--sl-font-body)',
                                                fontSize: '0.6rem', letterSpacing: '0.18em',
                                                textTransform: 'uppercase',
                                                color: 'rgba(245,218,223,0.5)',
                                                marginTop: '0.25rem',
                                            }}>
                                                {stat.label}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Right column — brand mockup ── */}
                    <div
                        className="col-lg-6 col-xl-6 d-none d-lg-flex justify-content-center align-items-center"
                        data-aos="fade-left"
                        data-aos-delay="200"
                        data-aos-duration="1000"
                    >
                        <div style={{ position: 'relative', maxWidth: 480, width: '100%' }}>
                            {/* Gold corner accents */}
                            <div style={{
                                position: 'absolute', top: -12, left: -12, right: -12, bottom: -12,
                                border: '1px solid rgba(197,145,44,0.18)',
                                pointerEvents: 'none', zIndex: 0,
                            }} />
                            <div style={{
                                position: 'absolute', top: -4, left: -4,
                                width: 24, height: 24,
                                borderTop: '2px solid var(--sl-gold)',
                                borderLeft: '2px solid var(--sl-gold)',
                                pointerEvents: 'none', zIndex: 2,
                            }} />
                            <div style={{
                                position: 'absolute', bottom: -4, right: -4,
                                width: 24, height: 24,
                                borderBottom: '2px solid var(--sl-gold)',
                                borderRight: '2px solid var(--sl-gold)',
                                pointerEvents: 'none', zIndex: 2,
                            }} />

                            {/* Main hero mockup — cake + SARALÖWE branded stationery */}
                            {!imgError ? (
                                <img
                                    src={`${process.env.PUBLIC_URL}/assets/img/Mockups/011.jpg`}
                                    alt="SARALÖWE — Couture Cake Design"
                                    onError={() => setImgError(true)}
                                    style={{
                                        width: '100%',
                                        display: 'block',
                                        position: 'relative',
                                        zIndex: 1,
                                        filter: 'brightness(0.97) contrast(1.03)',
                                    }}
                                />
                            ) : (
                                /* Fallback if image is missing */
                                <div style={{
                                    width: '100%', aspectRatio: '4/3',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(245,218,223,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <img
                                        src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                                        alt="SARALÖWE"
                                        style={{ width: 120, opacity: 0.4 }}
                                    />
                                </div>
                            )}

                            {/* Floating accreditation badge */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -24,
                                    left: -24,
                                    background: 'rgba(29, 60, 52, 0.95)',
                                    border: '1px solid rgba(197,145,44,0.35)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '1rem 1.4rem',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    zIndex: 3,
                                }}
                                data-aos="fade-right"
                                data-aos-delay="600"
                                data-aos-duration="700"
                            >
                                <img
                                    src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                                    alt=""
                                    style={{ width: 36, height: 36, objectFit: 'contain' }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <div>
                                    <div style={{
                                        fontFamily: 'var(--sl-font-body)',
                                        fontSize: '0.58rem', letterSpacing: '0.18em',
                                        textTransform: 'uppercase', color: 'var(--sl-gold)',
                                    }}>
                                        Industry Recognised
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--sl-font-display)',
                                        fontSize: '0.82rem', color: 'var(--sl-blush)',
                                    }}>
                                        Certificates accepted worldwide
                                    </div>
                                </div>
                            </div>

                            {/* Floating cover art */}
                            <div
                                style={{
                                    position: 'absolute', top: -28, right: -28,
                                    width: 100, height: 100,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid rgba(197,145,44,0.4)',
                                    boxShadow: '0 8px 32px rgba(74,20,37,0.4)',
                                    zIndex: 3,
                                }}
                                data-aos="zoom-in"
                                data-aos-delay="700"
                                data-aos-duration="600"
                            >
                                <img
                                    src={`${process.env.PUBLIC_URL}/assets/img/cover/A5 cover.jpg`}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default BannerSection
