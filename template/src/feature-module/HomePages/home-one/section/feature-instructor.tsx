import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { all_routes } from '../../../router/all_routes'
import { courseService } from '../../../../services/api/course.service'
import { FeaturedInstructor } from '../../../../services/api/types'
import { getFileUrl } from '../../../../environment'

const Featureinstructor = () => {
    const route = all_routes
    const [instructors, setInstructors] = useState<FeaturedInstructor[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        courseService.getFeaturedInstructors(8)
            .then(res => {
                if (Array.isArray(res)) setInstructors(res)
                else setInstructors((res as any).content || (res as any).data || [])
            })
            .catch(() => setInstructors([]))
            .finally(() => setLoading(false))
    }, [])

    const getAvatar = (ins: FeaturedInstructor) =>
        getFileUrl(ins.avatarUrl) ?? 'assets/img/instructor/instructor-09.jpg'

    const sliderSettings = {
        infinite: instructors.length > 4,
        slidesToShow: Math.min(4, Math.max(1, instructors.length)),
        slidesToScroll: 1,
        arrows: false,
        dots: true,
        responsive: [
            { breakpoint: 1200, settings: { slidesToShow: Math.min(3, instructors.length || 1) } },
            { breakpoint: 992, settings: { slidesToShow: Math.min(2, instructors.length || 1) } },
            { breakpoint: 640, settings: { slidesToShow: 1 } },
        ],
    }

    return (
        <section className="sl-section sl-section--ivory">
            <div className="container">
                <div className="sl-section__header center" data-aos="fade-up" data-aos-duration="800">
                    <div className="sl-ornament justify-content-center">
                        <span className="sl-script" style={{ fontSize: '1.6rem' }}>The artists</span>
                    </div>
                    <h2>Meet Our Instructors</h2>
                    <p>
                        Award-winning pastry artists and cake couturiers who bring decades of
                        real-world luxury experience into every lesson.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-5" style={{ color: 'var(--sl-burgundy)', fontFamily: 'var(--sl-font-body)', letterSpacing: '0.1em' }}>
                        Loading instructors…
                    </div>
                ) : instructors.length === 0 ? (
                    <div className="text-center py-5" style={{ color: 'rgba(101,28,50,0.5)', fontFamily: 'var(--sl-font-body)' }}>
                        Our instructors are preparing their masterclasses. Check back soon!
                    </div>
                ) : (
                    <div className="sl-slider-wrap">
                        <Slider {...sliderSettings}>
                            {instructors.map(ins => (
                                <div key={ins.id} className="px-2">
                                    <div className="sl-instructor-card">
                                        <div className="sl-instructor-card__img">
                                            <img
                                                src={getAvatar(ins)}
                                                alt={ins.fullName}
                                                onError={e => { (e.target as HTMLImageElement).src = 'assets/img/instructor/instructor-09.jpg' }}
                                            />
                                        </div>
                                        <div className="sl-instructor-card__name">
                                            <Link to={route.instructorDetails}>{ins.fullName}</Link>
                                        </div>
                                        <div className="sl-instructor-card__role">
                                            Pastry Artist
                                        </div>
                                        <div className="sl-instructor-card__divider" />
                                        <div className="sl-instructor-card__stats">
                                            <span>
                                                <i className="isax isax-book-1" />
                                                {ins.totalCourses} course{ins.totalCourses !== 1 ? 's' : ''}
                                            </span>
                                            <span>
                                                <i className="fa-solid fa-star" />
                                                {ins.averageRating > 0 ? ins.averageRating.toFixed(1) : 'New'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                )}

                <div className="text-center mt-5">
                    <Link to={route.instructorList} className="sl-btn-dark">
                        All Instructors <i className="isax isax-arrow-right-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Featureinstructor
