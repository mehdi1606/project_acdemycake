import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { all_routes } from '../../../router/all_routes';
import { courseService } from '../../../../services/api/course.service';
import { Course } from '../../../../services/api/types';
import { getFileUrl } from '../../../../environment';
import { Spin } from 'antd';

const Featuredcourse = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await courseService.getLatestCourses(8);
        // Handle different response formats
        if (Array.isArray(response)) {
          setCourses(response);
        } else if (response && typeof response === 'object') {
          // Handle paginated response or wrapped response
          const data = (response as any).content || (response as any).data || [];
          setCourses(Array.isArray(data) ? data : []);
        } else {
          setCourses([]);
        }
      } catch (err) {
        setError('Failed to load courses');
        console.error('Error fetching courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const featurecourseslider = {
    dots: false,
    infinite: true,
    speed: 300,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1300,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
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

  const route = all_routes;

  const getThumbnailUrl = (course: Course) =>
    getFileUrl(course.thumbnailUrl) ?? 'assets/img/course/course-01.jpg';

  const getInstructorAvatar = (course: Course) =>
    getFileUrl(course.instructor?.avatarUrl) ?? 'assets/img/user/user-01.jpg';

  const getDisplayPrice = (course: Course) => {
    if (!course.requiresPurchase) return 'Free';
    return `$${course.price || 0}`;
  };

  if (loading) {
    return (
      <section className="featured-courses-section">
        <div className="container text-center py-5">
          <Spin size="large" />
          <p className="mt-3">Loading courses...</p>
        </div>
      </section>
    );
  }

  if (error || courses.length === 0) {
    return (
      <section className="featured-courses-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="fw-medium text-secondary text-decoration-underline mb-2 d-inline-block">
              Featured Courses
            </span>
            <h2>What's New in SARALOWE</h2>
            <p>
              {error || 'No courses available at the moment. Check back soon!'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="featured-courses-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="fw-medium text-secondary text-decoration-underline mb-2 d-inline-block">
              Featured Courses
            </span>
            <h2>What's New in SARALOWE</h2>
            <p>
              Discover our featured courses, specially curated to help you gain
              in-demand skills
            </p>
          </div>
          <div className="feature-course-slider-22 top-courses-slider">
            <Slider {...featurecourseslider}>
              {courses.map((course) => (
                <div key={course.id}>
                  <div className="course-item">
                    <div className="course-img">
                      <Link to={`${route.courseDetails}/${course.slug}`}>
                        <img
                          src={getThumbnailUrl(course)}
                          alt={course.title}
                          className="img-fluid"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
                          }}
                        />
                      </Link>
                      <div className="position-absolute start-0 top-0 d-flex align-items-start w-100 z-index-2 p-2">
                        <span className="price-badge ms-auto">{getDisplayPrice(course)}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="badge badge-md badge-soft-info rounded-pill">
                        {course.category?.name || 'General'}
                      </span>
                      <Link to="#" className="fav-icon">
                        <i className={`isax ${course.isWishlisted ? 'isax-heart5 text-danger' : 'isax-heart'}`} />
                      </Link>
                    </div>
                    <div className="pb-3 border-bottom mb-3">
                      <h5>
                        <Link to={`${route.courseDetails}/${course.slug}`}>
                          {course.title}
                        </Link>
                      </h5>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="course-rating">
                        <span className="course-user">
                          <Link to={route.instructorDetails}>
                            <img
                              src={getInstructorAvatar(course)}
                              alt={course.instructor?.fullName}
                              className="img-fluid"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'assets/img/user/user-01.jpg';
                              }}
                            />
                          </Link>
                        </span>
                        <Link to={route.instructorDetails}>
                          {course.instructor?.fullName || 'Instructor'}
                        </Link>
                      </div>
                      <div className="d-flex">
                        <span className="d-flex align-items-center rating">
                          <i className="fa-solid fa-star text-warning me-2" />
                          {course.ratingAverage?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                    <Link to={`${route.courseDetails}/${course.slug}`} className="btn buy-course-btn">
                      {!course.requiresPurchase ? 'Enroll Free' : 'Buy Course Now'}
                    </Link>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
          <div className="d-flex align-items-center justify-content-center">
            <Link to={route.courseList} className="btn btn-primary btn-md">
              View All Courses
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Featuredcourse;
