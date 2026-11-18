import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { all_routes } from '../../../../router/all_routes'
import { courseService } from '../../../../../services/api/course.service'
import { PlatformStats } from '../../../../../services/api/types'
import { useCountUp } from '../../hooks/useCountUp'
import { useInView } from '../../hooks/useInView'

/**
 * The home hero's words and actions — identical in every hero design:
 * badge, tagline, headline, description, search, the two buttons and the
 * live platform stats. Each hero variant only changes the visuals around it.
 */

const formatK = (n: number): { value: number; suffix: string } => {
    if (n >= 1000) return { value: Math.floor(n / 1000), suffix: 'K+' }
    return { value: n, suffix: '+' }
}

const StatItem: React.FC<{ rawValue: number; label: string; delay?: number; inView: boolean }> = ({
    rawValue, label, delay = 0, inView,
}) => {
    const { value, suffix } = formatK(rawValue)
    const count = useCountUp(value, 2000, 0, inView)
    return (
        <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{
                fontFamily: 'var(--sl-font-display)', fontSize: '2rem', fontWeight: 700,
                color: 'var(--sl-gold)', lineHeight: 1, animationDelay: `${delay}ms`,
            }}>
                <span className="sl-stat-number" style={{ '--delay': `${delay}ms` } as React.CSSProperties}>{count}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--sl-gold-lt)' }}>{suffix}</span>
            </div>
            <div style={{
                fontFamily: 'var(--sl-font-body)', fontSize: '0.58rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(245,218,223,0.45)', marginTop: '0.3rem',
            }}>
                {label}
            </div>
        </div>
    )
}

const HeroCopy: React.FC<{ center?: boolean }> = ({ center }) => {
    const { t } = useTranslation()
    const route = all_routes
    const navigate = useNavigate()
    const { ref: statsRef, inView: statsVisible } = useInView<HTMLDivElement>(0.3)
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        courseService.getPlatformStats().then(setStats).catch(() => {})
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        navigate(route.courseList)
    }

    const justify = center ? 'justify-content-center' : ''

    return (
        <div className="sl-banner__content" style={center ? { textAlign: 'center', marginInline: 'auto', maxWidth: 760 } : undefined}>
            <div className="sl-banner__badge" data-aos="fade-down" data-aos-duration="700">
                <span>{t('banner.couturePastry', 'Couture Pastry · Academy Est. 2010')}</span>
            </div>

            <div className="sl-text-reveal" style={{ overflow: 'hidden', marginBottom: '0.25rem' }}
                data-aos="fade-up" data-aos-delay="60" data-aos-duration="1000">
                <span className="sl-banner__tagline"
                    style={{ display: 'block', fontSize: 'clamp(1rem, 2.2vw, 1.5rem)', lineHeight: 1.5, maxWidth: center ? undefined : 580 }}>
                    {t('banner.theArtOfCake', 'The first Arabic academy & community specialised in patisserie and cake design')}
                </span>
            </div>

            <div className="sl-text-reveal" data-aos="fade-up" data-aos-delay="140" data-aos-duration="1000">
                <h1 className="sl-banner__title sl-shimmer-text"
                    style={{ marginBottom: '1.25rem', fontSize: 'clamp(2rem, 4.6vw, 3.5rem)', letterSpacing: '0.01em', lineHeight: 1.14 }}>
                    {t('banner.academyHeadline', 'Build Your Future in the World of Patisserie')}
                </h1>
            </div>

            <p className="sl-banner__description" data-aos="fade-up" data-aos-delay="300" data-aos-duration="800"
                style={center ? { marginInline: 'auto' } : undefined}>
                {t('banner.description', "Master the world's most coveted sugar art techniques under elite pastry artists. Bespoke programmes, lifetime access, and certificates recognised by luxury hospitality brands globally.")}
            </p>

            <form onSubmit={handleSubmit} className="sl-banner__search" data-aos="fade-up" data-aos-delay="380" data-aos-duration="700"
                style={center ? { marginInline: 'auto' } : undefined}>
                <button type="button" className="sl-search-category" onClick={() => navigate(route.courseList)}>
                    {t('banner.allDisciplines', 'All Disciplines')}
                    <i className="isax isax-arrow-down5" style={{ fontSize: '0.7rem', marginLeft: 4 }} />
                </button>
                <div className="search-divider" />
                <input type="text" placeholder={t('banner.searchPlaceholder', 'Search courses, techniques…')}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <button type="submit" className="sl-search-btn"><i className="isax isax-search-normal" /></button>
            </form>

            <div className={`d-flex align-items-center gap-3 flex-wrap mb-5 ${justify}`}
                data-aos="fade-up" data-aos-delay="440" data-aos-duration="700">
                <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
                    {t('banner.exploreCourses', 'Explore Courses')} <i className="isax isax-arrow-right-1" />
                </Link>
                <Link to={route.register} className="sl-btn-outline">
                    {t('banner.enrolFree', 'Enrol Free')}
                </Link>
            </div>

            <div ref={statsRef} className={`d-flex align-items-center gap-4 flex-wrap sl-banner-stats ${justify}`}
                data-aos="fade-up" data-aos-delay="520" data-aos-duration="700">
                {stats ? (
                    <>
                        <StatItem rawValue={stats.totalCourses} label={t('banner.courses', 'Courses')} inView={statsVisible} delay={0} />
                        <div className="sl-banner-stats__divider" style={{ width: 1, height: 36, background: 'rgba(197,145,44,0.22)', flexShrink: 0 }} />
                        <StatItem rawValue={stats.totalStudents} label={t('banner.enrolments', 'Enrolments')} inView={statsVisible} delay={200} />
                        <div className="sl-banner-stats__divider" style={{ width: 1, height: 36, background: 'rgba(197,145,44,0.22)', flexShrink: 0 }} />
                        <StatItem rawValue={stats.totalInstructors} label={t('banner.expertTutors', 'Expert Tutors')} inView={statsVisible} delay={400} />
                    </>
                ) : (
                    <div style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.7rem', color: 'rgba(245,218,223,0.3)', letterSpacing: '0.1em' }}>
                        {t('banner.loading', '— Loading —')}
                    </div>
                )}
            </div>
        </div>
    )
}

export default HeroCopy
