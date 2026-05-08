import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { all_routes } from '../../../router/all_routes'
import { courseService } from '../../../../services/api/course.service'
import { Course } from '../../../../services/api/types'
import { getFileUrl } from '../../../../environment'
import { useMouseTilt } from '../hooks/useMouseTilt'

// ── Single card with 3D tilt ──────────────────────────────────────────────────
const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
    const route = all_routes
    const { containerRef, handleMouseMove, handleMouseLeave } = useMouseTilt({
        maxAngle: 8,
        perspective: 900,
        scale: 1.03,
        resetDuration: 650,
    })

    const getThumbnail = () =>
        getFileUrl(course.thumbnailUrl) ?? 'assets/img/course/course-01.jpg'

    const getAvatar = () =>
        getFileUrl(course.instructor?.avatarUrl) ?? 'assets/img/user/user-01.jpg'

    const getPrice = () =>
        !course.requiresPurchase ? 'Free' : `$${course.price || 0}`

    return (
        <div
            ref={containerRef}
            className="sl-course-card sl-tilt-wrap"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'relative' }}
        >
            {/* Image */}
            <div className="sl-course-card__img">
                <img
                    src={getThumbnail()}
                    alt={course.title}
                    onError={e => {
                        (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg'
                    }}
                />
                <div className="sl-course-card__img-overlay" />
                <div className="sl-course-card__badge">
                    {course.category?.name || 'Cake Design'}
                </div>
            </div>

            {/* Body */}
            <div className="sl-course-card__body">
                <div className="sl-course-card__meta">
                    <Link to={route.instructorDetails} className="sl-course-card__instructor">
                        <img
                            src={getAvatar()}
                            alt={course.instructor?.fullName}
                            onError={e => {
                                (e.target as HTMLImageElement).src = 'assets/img/user/user-01.jpg'
                            }}
                        />
                        <span>{course.instructor?.fullName || 'Instructor'}</span>
                    </Link>
                    <span className="sl-course-card__category">
                        {course.category?.name || 'Design'}
                    </span>
                </div>

                <div className="sl-course-card__title">
                    <Link to={`${route.courseDetails}/${course.slug}`}>
                        {course.title}
                    </Link>
                </div>

                <div className="sl-course-card__rating">
                    <span className="stars">
                        {[1, 2, 3, 4, 5].map(i => (
                            <i key={i} className="fa-solid fa-star" style={{ fontSize: '0.7rem', marginRight: '1px' }} />
                        ))}
                    </span>
                    <span>{course.ratingAverage?.toFixed(1) || '5.0'}</span>
                    <span style={{ opacity: 0.5 }}>· {course.enrolledCount ?? 0} students</span>
                </div>

                <div className="sl-course-card__footer">
                    <span className="sl-course-card__price">{getPrice()}</span>
                    {/* Magnetic CTA button */}
                    <Link
                        to={`${route.courseDetails}/${course.slug}`}
                        className="sl-course-card__cta sl-btn-magnetic"
                    >
                        {!course.requiresPurchase ? 'Enrol Free' : 'View Course'}
                    </Link>
                </div>
            </div>
        </div>
    )
}

// ── Section ───────────────────────────────────────────────────────────────────
const Featuredcourse: React.FC = () => {
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
                        <span className="sl-script" style={{ fontSize: '1.8rem' }}>Programmes</span>
                    </div>
                    <h2 style={{ marginTop: '0.4rem' }}>Featured Courses</h2>
                    <p>
                        Discover our most-loved programmes, curated by industry-leading pastry artists
                        for every level of cake designer.
                    </p>
                </div>

                {/* Cards */}
                {loading ? (
                    <div className="text-center py-5" style={{
                        color: 'var(--sl-burgundy)', fontFamily: 'var(--sl-font-body)',
                        letterSpacing: '0.1em', opacity: 0.5,
                    }}>
                        Loading courses…
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-5" style={{
                        color: 'rgba(101,28,50,0.45)', fontFamily: 'var(--sl-font-body)',
                    }}>
                        No courses available yet. Check back soon.
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
                        View All Courses <i className="isax isax-arrow-right-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Featuredcourse
