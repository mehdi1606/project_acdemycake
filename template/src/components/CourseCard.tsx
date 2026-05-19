import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Course } from '../services/api/types';
import { all_routes } from '../feature-module/router/all_routes';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { addToWishlist, removeFromWishlist } from '../core/redux/courseSlice';
import { message } from 'antd';
import { getFileUrl } from '../environment';

interface CourseCardProps {
  course: Course;
  layout?: 'grid' | 'list';
}

const CourseCard: React.FC<CourseCardProps> = ({ course, layout = 'grid' }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      message.warning('Please login to add courses to your wishlist');
      return;
    }

    try {
      if (course.isWishlisted) {
        await dispatch(removeFromWishlist(course.id)).unwrap();
        message.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(course.id)).unwrap();
        message.success('Added to wishlist');
      }
    } catch {
      message.error('Failed to update wishlist');
    }
  };

  const getDiscountPercentage = () => {
    if (course.originalPrice && course.price && course.originalPrice > course.price) {
      return Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
    }
    return 0;
  };

  const displayPrice = course.price;
  const discount = getDiscountPercentage();

  const thumbnailUrl = getFileUrl(course.thumbnailUrl) ?? 'assets/img/course/course-01.jpg';
  const instructorAvatar = getFileUrl(course.instructor?.avatarUrl) ?? 'assets/img/user/user-29.jpg';

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <i key={i} className="fa-solid fa-star text-warning me-1" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <i key={i} className="fa-solid fa-star-half-alt text-warning me-1" />
        );
      } else {
        stars.push(
          <i key={i} className="fa-solid fa-star text-light me-1" />
        );
      }
    }
    return stars;
  };

  if (layout === 'list') {
    return (
      <div className="course-item course-item-list">
        <div className="row g-0">
          <div className="col-md-4">
            <div className="course-img h-100">
              <Link to={`${all_routes.courseDetails}/${course.slug}`}>
                <img
                  src={thumbnailUrl}
                  alt={course.title}
                  className="img-fluid h-100 object-fit-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
                  }}
                />
              </Link>
              <div className="position-absolute start-0 top-0 d-flex align-items-start w-100 z-index-2 p-3">
                {discount > 0 && (
                  <div className="badge text-bg-danger">{discount}% off</div>
                )}
                {!course.requiresPurchase && (
                  <div className="badge text-bg-success">Free</div>
                )}
                {course.requiresPurchase && (
                  <div className="badge text-bg-warning">Premium</div>
                )}
                {course.isEnrolled && (
                  <div className="badge text-bg-primary ms-1">
                    <i className="fa-solid fa-check me-1" />
                    Enrolled
                  </div>
                )}
                <button
                  onClick={handleWishlistToggle}
                  className={`fav-icon ms-auto border-0 bg-transparent ${course.isWishlisted ? 'text-danger' : ''}`}
                >
                  <i className={`isax ${course.isWishlisted ? 'isax-heart5' : 'isax-heart'}`} />
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-8">
            <div className="course-content p-4">
              <div className="d-flex justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  <Link to={`${all_routes.instructorDetails}/${course.instructor?.id}`} className="avatar avatar-sm">
                    <img
                      src={instructorAvatar}
                      alt={course.instructor?.fullName}
                      className="img-fluid avatar avatar-sm rounded-circle"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'assets/img/user/user-29.jpg';
                      }}
                    />
                  </Link>
                  <div className="ms-2">
                    <Link to={`${all_routes.instructorDetails}/${course.instructor?.id}`} className="link-default fs-14">
                      {course.instructor?.fullName || 'Unknown Instructor'}
                    </Link>
                  </div>
                </div>
                <span className="badge badge-light rounded-pill bg-light d-inline-flex align-items-center fs-13 fw-medium mb-0">
                  {course.category?.name || 'General'}
                </span>
              </div>
              <h6 className="title mb-2">
                <Link to={`${all_routes.courseDetails}/${course.slug}`}>
                  {course.title}
                </Link>
              </h6>
              <p className="text-muted mb-2 text-truncate">{course.shortDescription}</p>
              <div className="d-flex align-items-center mb-3">
                {renderStars(course.ratingAverage)}
                <span className="ms-2">
                  {course.ratingAverage.toFixed(1)} ({course.ratingCount} Reviews)
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  {course.isEnrolled ? (
                    <span className="badge bg-success-subtle text-success fs-12 fw-medium px-2 py-1">
                      <i className="fa-solid fa-check-circle me-1" />
                      Owned
                    </span>
                  ) : !course.requiresPurchase ? (
                    <h5 className="text-success mb-0">Free</h5>
                  ) : (
                    <div className="d-flex align-items-center">
                      <h5 className="text-secondary mb-0">${displayPrice}</h5>
                      {discount > 0 && (
                        <span className="text-muted text-decoration-line-through ms-2">
                          ${course.originalPrice}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {course.isEnrolled ? (
                  <Link
                    to={`${all_routes.courseWatch}/${course.slug}`}
                    className="btn btn-primary btn-sm d-inline-flex align-items-center"
                  >
                    Continue Learning
                    <i className="isax isax-arrow-right-3 ms-1" />
                  </Link>
                ) : (
                  <Link
                    to={`${all_routes.courseDetails}/${course.slug}`}
                    className="btn btn-dark btn-sm d-inline-flex align-items-center"
                  >
                    View Course
                    <i className="isax isax-arrow-right-3 ms-1" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className="course-item-two course-item mx-0">
      <div className="course-img">
        <Link to={`${all_routes.courseDetails}/${course.slug}`}>
          <img
            src={thumbnailUrl}
            alt={course.title}
            className="img-fluid"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
            }}
          />
        </Link>
        <div className="position-absolute start-0 top-0 d-flex align-items-start w-100 z-index-2 p-3">
          {discount > 0 && (
            <div className="badge text-bg-danger">{discount}% off</div>
          )}
          {!course.requiresPurchase && (
            <div className="badge text-bg-success">Free</div>
          )}
          {course.requiresPurchase && (
            <div className="badge text-bg-warning">Premium</div>
          )}
          {course.isEnrolled && (
            <div className="badge text-bg-primary ms-1">
              <i className="fa-solid fa-check me-1" />
              Enrolled
            </div>
          )}
          <button
            onClick={handleWishlistToggle}
            className={`fav-icon ms-auto border-0 bg-transparent ${course.isWishlisted ? 'text-danger' : ''}`}
          >
            <i className={`isax ${course.isWishlisted ? 'isax-heart5' : 'isax-heart'}`} />
          </button>
        </div>
      </div>
      <div className="course-content">
        <div className="d-flex justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <Link to={`${all_routes.instructorDetails}/${course.instructor?.id}`} className="avatar avatar-sm">
              <img
                src={instructorAvatar}
                alt={course.instructor?.fullName}
                className="img-fluid avatar avatar-sm rounded-circle"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'assets/img/user/user-29.jpg';
                }}
              />
            </Link>
            <div className="ms-2">
              <Link to={`${all_routes.instructorDetails}/${course.instructor?.id}`} className="link-default fs-14">
                {course.instructor?.fullName || 'Unknown Instructor'}
              </Link>
            </div>
          </div>
          <span className="badge badge-light rounded-pill bg-light d-inline-flex align-items-center fs-13 fw-medium mb-0">
            {course.category?.name || 'General'}
          </span>
        </div>
        <h6 className="title mb-2">
          <Link to={`${all_routes.courseDetails}/${course.slug}`}>
            {course.title}
          </Link>
        </h6>
        <p className="d-flex align-items-center mb-3">
          <i className="fa-solid fa-star text-warning me-2" />
          {course.ratingAverage.toFixed(1)} ({course.ratingCount} Reviews)
        </p>
        <div className="d-flex align-items-center justify-content-between">
          {course.isEnrolled ? (
            <span className="badge bg-success-subtle text-success fs-12 fw-medium px-2 py-1">
              <i className="fa-solid fa-check-circle me-1" />
              Owned
            </span>
          ) : !course.requiresPurchase ? (
            <h5 className="text-success mb-0">Free</h5>
          ) : (
            <div>
              <h5 className="text-secondary mb-0 d-inline">${displayPrice}</h5>
              {discount > 0 && (
                <span className="text-muted text-decoration-line-through ms-2 small">
                  ${course.price}
                </span>
              )}
            </div>
          )}
          {course.isEnrolled ? (
            <Link
              to={`${all_routes.courseWatch}/${course.slug}`}
              className="btn btn-primary btn-sm d-inline-flex align-items-center"
            >
              Continue
              <i className="isax isax-arrow-right-3 ms-1" />
            </Link>
          ) : (
            <Link
              to={`${all_routes.courseDetails}/${course.slug}`}
              className="btn btn-dark btn-sm d-inline-flex align-items-center"
            >
              View Course
              <i className="isax isax-arrow-right-3 ms-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CourseCard);
