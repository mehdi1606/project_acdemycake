import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { all_routes } from '../../../router/all_routes'
import CourseCard from '../../../../components/CourseCard'
import { courseService } from '../../../../services/api/course.service'
import { Course } from '../../../../services/api/types'

// ── Section ───────────────────────────────────────────────────────────────────
const Featuredcourse: React.FC = () => {
  const { t } = useTranslation();
    const route = all_routes
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        courseService.getLatestCourses(8)
            .then(res => {
                if (Array.isArray(res)) setCourses(res)
                else setCourses((res as any).content || (res as any).data || [])
            })
            .catch(() => setCourses([]))
            .finally(() => setLoading(false))
    }, [])

    const sliderSettings = {
        dots: true,
        infinite: courses.length > 3,
        speed: 600,
        slidesToShow: 3,
        slidesToScroll: 1,
        cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        responsive: [
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 992, settings: { slidesToShow: 2 } },
            { breakpoint: 640, settings: { slidesToShow: 1 } },
        ],
    }

    return (
        <section className="sl-section sl-section--white sl-section-reveal">
            <div className="container">
                {/* Header */}
                <div
                    className="sl-section__header center"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <div className="sl-ornament justify-content-center">
                        <span className="sl-script" style={{ fontSize: '1.8rem' }}>{t('home.featured.ornament', 'Programmes')}</span>
                    </div>
                    <h2 style={{ marginTop: '0.4rem' }}>{t('home.featured.title', 'Featured Courses')}</h2>
                    <p>
                        {t('home.featured.description', 'Discover our most-loved programmes, curated by industry-leading pastry artists for every level of cake designer.')}
                    </p>
                </div>

                {/* Cards */}
                {loading ? (
                    <div className="text-center py-5" style={{
                        color: 'var(--sl-burgundy)', fontFamily: 'var(--sl-font-body)',
                        letterSpacing: '0.1em', opacity: 0.5,
                    }}>
                        {t('home.featured.loadingCourses', 'Loading courses…')}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-5" style={{
                        color: 'rgba(101,28,50,0.45)', fontFamily: 'var(--sl-font-body)',
                    }}>
                        {t('home.featured.noCoursesYet', 'No courses available yet. Check back soon.')}
                    </div>
                ) : (
                    <div className="sl-slider-wrap">
                        <Slider {...sliderSettings}>
                            {courses.map(course => (
                                <div key={course.id} style={{ padding: '0 8px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CourseCard course={course} />
                                </div>
                            ))}
                        </Slider>
                    </div>
                )}

                {/* CTA */}
                <div
                    className="text-center mt-5"
                    data-aos="fade-up"
                    data-aos-delay="150"
                    data-aos-duration="700"
                >
                    <Link to={route.courseList} className="sl-btn-dark sl-btn-magnetic">
                        {t('home.featured.viewAllCourses', 'View All Courses')} <i className="isax isax-arrow-right-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Featuredcourse
