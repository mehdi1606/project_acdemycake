import React, { useEffect, useState } from 'react'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath'
import { Link } from 'react-router-dom'
import Slider from 'react-slick';
import { all_routes } from '../../../router/all_routes';
import { courseService } from '../../../../services/api/course.service';
import { FeaturedInstructor } from '../../../../services/api/types';
import { getFileUrl } from '../../../../environment';
import { Spin } from 'antd';

const Featureinstructor = () => {

    const route = all_routes;
    const [instructors, setInstructors] = useState<FeaturedInstructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setLoading(true);
                const response = await courseService.getFeaturedInstructors(8);
                if (Array.isArray(response)) {
                    setInstructors(response);
                } else if (response && typeof response === 'object') {
                    const data = (response as any).content || (response as any).data || [];
                    setInstructors(Array.isArray(data) ? data : []);
                } else {
                    setInstructors([]);
                }
            } catch (err) {
                console.error('Error fetching featured instructors:', err);
                setInstructors([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInstructors();
    }, []);

    const getAvatarUrl = (instructor: FeaturedInstructor) =>
        getFileUrl(instructor.avatarUrl) ?? 'assets/img/instructor/instructor-09.jpg';

    //Feature Instructor Slider
    const featurinstructorslider = {
        infinite: instructors.length > 4,
        slidesToShow: Math.min(4, instructors.length),
        slidesToScroll: Math.min(4, instructors.length),
        arrows: false,
        responsive: [
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: Math.min(3, instructors.length),
              slidesToScroll: Math.min(3, instructors.length),
              infinite: instructors.length > 3,
              dots: false,
            },
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: Math.min(2, instructors.length),
              slidesToScroll: Math.min(2, instructors.length),
            },
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      };

    if (loading) {
        return (
            <div className="featured-instructor-sec">
                <div className="container text-center py-5">
                    <Spin size="large" />
                    <p className="mt-3 text-white">Loading instructors...</p>
                </div>
            </div>
        );
    }

    if (instructors.length === 0) {
        return (
            <div className="featured-instructor-sec">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="fw-medium text-light text-decoration-underline mb-2 d-inline-block">
                            Featured Instructors
                        </span>
                        <h2 className="text-white">
                            Top Class &amp; Professional Instructors
                        </h2>
                        <p className="text-light">
                            Our instructors are getting ready. Check back soon!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* featured instructor */}
            <div className="featured-instructor-sec">
                <div className="container">
                    <div className="section-header text-center" data-aos="fade-up">
                        <span className="fw-medium text-light text-decoration-underline mb-2 d-inline-block">
                            Featured Instructors
                        </span>
                        <h2 className="text-white">
                            Top Class &amp; Professional Instructors{" "}
                        </h2>
                        <p className="text-light">
                            Empowering Change: Stories from Those Who Took the Leap
                        </p>
                    </div>
                    <Slider {...featurinstructorslider} className="featured-instructor-slider lazy">
                        {instructors.map((instructor) => (
                            <div
                                key={instructor.id}
                                className="instructor-item instructor-item-three mb-0"
                                data-aos="flip-left"
                            >
                                <div className="instructors-img">
                                    <Link to={route.instructorList} tabIndex={0}>
                                        <img
                                            className="img-fluid"
                                            alt={instructor.fullName}
                                            src={getAvatarUrl(instructor)}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'assets/img/instructor/instructor-09.jpg';
                                            }}
                                        />
                                    </Link>
                                    <div className="position-absolute start-0 top-0 d-flex align-items-start w-100 z-index-2 p-2">
                                        <span className="verify">
                                            <ImageWithBasePath
                                                src="assets/img/icons/verify-icon.svg"
                                                alt="img"
                                                className="img-fluid"
                                            />
                                        </span>
                                        <Link to="#" className="favourite ms-auto">
                                            <i className="isax isax-heart" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="instructor-content">
                                    <div>
                                        <h3 className="title">
                                            <Link to={route.instructorDetails}>{instructor.fullName}</Link>
                                        </h3>
                                        <span className="designation">
                                            {instructor.totalCourses} Course{instructor.totalCourses !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <p className="rating">
                                        <i className="fas fa-star me-1" />
                                        {instructor.averageRating > 0 ? instructor.averageRating.toFixed(1) : 'New'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
            {/* featured instructor */}
        </>

    )
}

export default Featureinstructor
