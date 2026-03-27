import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Link, useParams, useNavigate } from 'react-router-dom';
import VideoModal from '../../HomePages/home-one/section/videoModal';
import { all_routes } from '../../router/all_routes';
import { courseService } from '../../../services/api/course.service';
import { Course, CourseModule, CourseReview } from '../../../services/api/types';
import { getFileUrl } from '../../../environment';
import { Spin, message, Rate, Collapse } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { addToWishlist, removeFromWishlist } from '../../../core/redux/courseSlice';

const { Panel } = Collapse;

const CourseDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [course, setCourse] = useState<Course | null>(null);
  const [curriculum, setCurriculum] = useState<CourseModule[]>([]);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const courseData = await courseService.getCourseBySlug(slug);
        setCourse(courseData);

        // Fetch curriculum
        const curriculumData = await courseService.getCourseCurriculum(courseData.id);
        setCurriculum(curriculumData);

        // Fetch reviews
        const reviewsData = await courseService.getCourseReviews(courseData.id, 0, 5);
        setReviews(reviewsData.content);
      } catch (err) {
        console.error('Error fetching course:', err);
        message.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [slug]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      message.warning('Please login to enroll in this course');
      return;
    }

    if (!course) return;

    try {
      setEnrolling(true);
      await courseService.enrollInCourse(course.id);
      message.success('Successfully enrolled in the course!');
      // Refresh course data to update enrollment status
      const updatedCourse = await courseService.getCourseBySlug(slug!);
      setCourse(updatedCourse);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg: string = err?.response?.data?.message ?? '';
      if (status === 400 && serverMsg.toLowerCase().includes('already enrolled')) {
        message.info('You are already enrolled in this course');
        navigate(`${route.courseWatch}/${course.slug}`);
      } else {
        console.error('Error enrolling:', err);
        message.error('Failed to enroll in the course');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      message.warning('Please login to add to wishlist');
      return;
    }

    if (!course) return;

    try {
      if (course.isWishlisted) {
        await dispatch(removeFromWishlist(course.id)).unwrap();
        message.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(course.id)).unwrap();
        message.success('Added to wishlist');
      }
      // Refresh course data
      const updatedCourse = await courseService.getCourseBySlug(slug!);
      setCourse(updatedCourse);
    } catch (err) {
      message.error('Failed to update wishlist');
    }
  };

  const getThumbnailUrl = () =>
    getFileUrl(course?.thumbnailUrl) ?? 'assets/img/course/course-01.jpg';

  const getInstructorAvatar = () =>
    getFileUrl(course?.instructor?.avatarUrl) ?? 'assets/img/user/user-01.jpg';

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}hr ${mins}min`;
  };

  const route = all_routes;

  if (loading) {
    return (
      <>
        <Breadcrumb title="Course Detail" />
        <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Breadcrumb title="Course Not Found" />
        <div className="container py-5 text-center">
          <i className="isax isax-book fs-1 text-muted mb-3 d-block" />
          <h3>Course Not Found</h3>
          <p className="text-muted">The course you're looking for doesn't exist or has been removed.</p>
          <Link to={route.courseGrid} className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      </>
    );
  }

  const displayPrice = course.price;
  const hasDiscount = course.originalPrice && course.price && course.originalPrice > course.price;
  const discountPercent = hasDiscount
    ? Math.round(((course.originalPrice! - course.price!) / course.originalPrice!) * 100)
    : 0;

  return (
    <>
      <Breadcrumb title="Course Detail" />

      <section className="course-details-two">
        <div className="container">
          <div className="row">
            <div className="col-12">
              {/* Course Header */}
              <div className="card bg-light">
                <div className="card-body d-lg-flex align-items-center">
                  <div className="position-relative">
                    <Link
                      to="#"
                      id="openVideoBtn"
                      onClick={() => setShowModal(true)}
                    >
                      <img
                        className="img-fluid rounded-2"
                        src={getThumbnailUrl()}
                        alt={course.title}
                        style={{ maxWidth: '400px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
                        }}
                      />
                      {course.previewVideoUrl && (
                        <div className="play-icon">
                          <i className="ti ti-player-play-filled fs-28" />
                        </div>
                      )}
                    </Link>
                  </div>
                  {course.previewVideoUrl && (
                    <VideoModal
                      show={showModal}
                      handleClose={() => setShowModal(false)}
                      videoUrl={course.previewVideoUrl}
                    />
                  )}
                  <div className="w-100 ps-lg-4">
                    <h3 className="mb-2">{course.title}</h3>
                    <p className="fs-14 mb-3">{course.shortDescription}</p>
                    <div className="d-flex align-items-center gap-2 gap-sm-3 gap-xl-4 flex-wrap my-3 my-sm-0">
                      <p className="fw-medium d-flex align-items-center mb-0">
                        <ImageWithBasePath className="me-2" src="./assets/img/icons/book.svg" alt="img" />
                        {course.lessonsCount}+ Lessons
                      </p>
                      <p className="fw-medium d-flex align-items-center mb-0">
                        <ImageWithBasePath className="me-2" src="./assets/img/icons/timer-start.svg" alt="img" />
                        {formatDuration(course.durationMinutes)}
                      </p>
                      <p className="fw-medium d-flex align-items-center mb-0">
                        <ImageWithBasePath className="me-2" src="./assets/img/icons/people.svg" alt="img" />
                        {course.enrolledCount} students enrolled
                      </p>
                      <span className="badge badge-sm rounded-pill bg-warning fs-12">
                        {course.category?.name || 'General'}
                      </span>
                    </div>
                    <div className="d-sm-flex align-items-center justify-content-sm-between mt-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-lg">
                          <img
                            className="rounded-circle"
                            src={getInstructorAvatar()}
                            alt={course.instructor?.fullName}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'assets/img/user/user-01.jpg';
                            }}
                          />
                        </div>
                        <div className="ms-2">
                          <h5 className="fs-18 fw-semibold">
                            <Link to={route.instructorDetails}>{course.instructor?.fullName}</Link>
                          </h5>
                          <p className="fs-14">{course.instructor?.headline || 'Instructor'}</p>
                        </div>
                      </div>
                      <div className="rating mt-2 mt-sm-0">
                        <Rate disabled defaultValue={course.ratingAverage} allowHalf />
                        <span className="ms-2">{course.ratingAverage.toFixed(1)} ({course.ratingCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                {/* Course Content */}
                <div className="col-lg-8">
                  {/* Course Description */}
                  <div className="card">
                    <div className="card-body">
                      <h4 className="mb-3">Course Overview</h4>
                      <div dangerouslySetInnerHTML={{ __html: course.description }} />
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  {course.whatYouWillLearn && course.whatYouWillLearn.trim().length > 0 && (
                    <div className="card">
                      <div className="card-body">
                        <h4 className="mb-3">What you'll learn</h4>
                        <div className="row">
                          {course.whatYouWillLearn.split('\n').filter(o => o.trim()).map((objective, index) => (
                            <div key={index} className="col-md-6 mb-2">
                              <div className="d-flex align-items-start">
                                <i className="fa-solid fa-check text-success me-2 mt-1" />
                                <span>{objective}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {course.requirements && course.requirements.trim().length > 0 && (
                    <div className="card">
                      <div className="card-body">
                        <h4 className="mb-3">Requirements</h4>
                        <ul className="list-unstyled">
                          {course.requirements.split('\n').filter(r => r.trim()).map((req, index) => (
                            <li key={index} className="mb-2">
                              <i className="fa-solid fa-circle-dot text-primary me-2" style={{ fontSize: '8px' }} />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Curriculum */}
                  <div className="card">
                    <div className="card-body">
                      <h4 className="mb-3">Course Curriculum</h4>
                      {curriculum.length === 0 ? (
                        <p className="text-muted">Curriculum will be available soon.</p>
                      ) : (
                        <Collapse accordion>
                          {curriculum.map((module) => (
                            <Panel
                              key={module.id}
                              header={
                                <div className="d-flex justify-content-between align-items-center w-100">
                                  <span className="fw-medium">{module.title}</span>
                                  <span className="text-muted small">
                                    {module.lessons?.length || module.lessonsCount || 0} lessons • {formatDuration(Math.floor((module.totalDurationSeconds || 0) / 60))}
                                  </span>
                                </div>
                              }
                            >
                              {(module.lessons || []).map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="d-flex justify-content-between align-items-center py-2 border-bottom"
                                >
                                  <div className="d-flex align-items-center">
                                    <i
                                      className={`me-2 ${
                                        lesson.contentType === 'VIDEO'
                                          ? 'fa-solid fa-play-circle text-primary'
                                          : lesson.contentType === 'QUIZ'
                                          ? 'fa-solid fa-question-circle text-warning'
                                          : 'fa-solid fa-file-alt text-info'
                                      }`}
                                    />
                                    <span>{lesson.title}</span>
                                    {(lesson.isPreview || lesson.isFreePreview) && (
                                      <span className="badge bg-success-subtle text-success ms-2">Preview</span>
                                    )}
                                  </div>
                                  <span className="text-muted small">{Math.floor((lesson.videoDurationSeconds || 0) / 60)} min</span>
                                </div>
                              ))}
                            </Panel>
                          ))}
                        </Collapse>
                      )}
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="card">
                    <div className="card-body">
                      <h4 className="mb-3">Student Reviews</h4>
                      {reviews.length === 0 ? (
                        <p className="text-muted">No reviews yet. Be the first to review!</p>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="border-bottom pb-3 mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <img
                                src={review.user?.avatarUrl || 'assets/img/user/user-01.jpg'}
                                alt={review.user?.fullName}
                                className="rounded-circle me-2"
                                style={{ width: '40px', height: '40px' }}
                              />
                              <div>
                                <h6 className="mb-0">{review.user?.fullName}</h6>
                                <Rate disabled defaultValue={review.rating} className="fs-12" />
                              </div>
                            </div>
                            <p className="mb-0">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                  <div className="card sticky-top" style={{ top: '100px' }}>
                    <div className="card-body">
                      {/* Price */}
                      <div className="text-center mb-4">
                        {!course.requiresPurchase ? (
                          <h2 className="text-success">Free</h2>
                        ) : (
                          <>
                            <h2 className="mb-0">${displayPrice}</h2>
                            {hasDiscount && (
                              <div>
                                <span className="text-muted text-decoration-line-through me-2">${course.originalPrice}</span>
                                <span className="badge bg-danger">{discountPercent}% OFF</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {course.isEnrolled ? (
                        <Link
                          to={`${route.courseWatch}/${course.slug}`}
                          className="btn btn-primary w-100 mb-3"
                        >
                          <i className="fa-solid fa-play me-2" />
                          Continue Learning
                        </Link>
                      ) : (
                        <button
                          className="btn btn-primary w-100 mb-3"
                          onClick={handleEnroll}
                          disabled={enrolling}
                        >
                          {enrolling ? (
                            <Spin size="small" />
                          ) : (
                            <>
                              <i className="fa-solid fa-graduation-cap me-2" />
                              {!course.requiresPurchase ? 'Enroll Free' : 'Enroll Now'}
                            </>
                          )}
                        </button>
                      )}

                      <button
                        className={`btn ${course.isWishlisted ? 'btn-danger' : 'btn-outline-primary'} w-100 mb-4`}
                        onClick={handleWishlistToggle}
                      >
                        <i className={`fa-${course.isWishlisted ? 'solid' : 'regular'} fa-heart me-2`} />
                        {course.isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      </button>

                      {/* Course Info */}
                      <h5 className="mb-3">This course includes:</h5>
                      <ul className="list-unstyled">
                        <li className="d-flex align-items-center mb-2">
                          <i className="fa-solid fa-video text-primary me-2" />
                          {formatDuration(course.durationMinutes)} on-demand video
                        </li>
                        <li className="d-flex align-items-center mb-2">
                          <i className="fa-solid fa-file-alt text-primary me-2" />
                          {course.lessonsCount} lessons
                        </li>
                        <li className="d-flex align-items-center mb-2">
                          <i className="fa-solid fa-layer-group text-primary me-2" />
                          {course.modulesCount} modules
                        </li>
                        <li className="d-flex align-items-center mb-2">
                          <i className="fa-solid fa-infinity text-primary me-2" />
                          Full lifetime access
                        </li>
                        <li className="d-flex align-items-center mb-2">
                          <i className="fa-solid fa-certificate text-primary me-2" />
                          Certificate of completion
                        </li>
                        <li className="d-flex align-items-center">
                          <i className="fa-solid fa-signal text-primary me-2" />
                          {course.level.replace('_', ' ')}
                        </li>
                      </ul>

                      {/* Tags */}
                      {course.tags && course.tags.trim().length > 0 && (
                        <div className="mt-4">
                          <h6>Tags:</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {course.tags.split(',').filter(t => t.trim()).map((tag, index) => (
                              <span key={index} className="badge bg-light text-dark">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CourseDetails;
