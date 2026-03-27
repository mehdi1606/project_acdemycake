import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../services/api/types';
import { all_routes } from '../feature-module/router/all_routes';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { addToWishlist, removeFromWishlist } from '../core/redux/courseSlice';
import { message } from 'antd';
import { getFileUrl } from '../environment';

interface LuxuryCourseCardProps {
  course: Course;
  index?: number;
}

const LuxuryCourseCard: React.FC<LuxuryCourseCardProps> = ({ course, index = 0 }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [imageLoaded, setImageLoaded] = useState(false);

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
        stars.push(<i key={i} className="fa-solid fa-star" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="fa-solid fa-star-half-alt" />);
      } else {
        stars.push(<i key={i} className="fa-regular fa-star" />);
      }
    }
    return stars;
  };

  const animationDelay = `${index * 0.1}s`;

  return (
    <div
      className="course-card-luxury"
      style={{ animationDelay }}
    >
      {/* Image Section */}
      <div className="course-img-wrapper">
        {!imageLoaded && (
          <div className="loading-gold" style={{ height: '220px' }} />
        )}
        <img
          src={thumbnailUrl}
          alt={course.title}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
            setImageLoaded(true);
          }}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />

        {/* Badge */}
        {(discount > 0 || !course.requiresPurchase) && (
          <span className="course-badge">
            {!course.requiresPurchase ? 'Free' : `${discount}% OFF`}
          </span>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleWishlistToggle}
          className={`course-favorite ${course.isWishlisted ? 'active' : ''}`}
          aria-label={course.isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`fa-${course.isWishlisted ? 'solid' : 'regular'} fa-heart`} />
        </button>

        {/* Overlay */}
        <div className="course-overlay">
          <div className="overlay-content">
            <span className="d-flex align-items-center gap-2 mb-2">
              <i className="fa-solid fa-clock" />
              {course.durationMinutes ? `${Math.floor(course.durationMinutes / 60)}h ${course.durationMinutes % 60}m` : '0h 0m'}
            </span>
            <span className="d-flex align-items-center gap-2">
              <i className="fa-solid fa-play-circle" />
              {course.lessonsCount || 0} lessons
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="course-content">
        {/* Category */}
        <span className="course-category">
          {course.category?.name || 'Cake Design'}
        </span>

        {/* Title */}
        <h4 className="course-title">
          <Link to={`${all_routes.courseDetails}/${course.slug}`}>
            {course.title}
          </Link>
        </h4>

        {/* Meta Info */}
        <div className="course-meta">
          <span className="meta-item">
            <i className="fa-solid fa-users" />
            {course.enrolledCount || 0} students
          </span>
          <span className="meta-item">
            <i className="fa-solid fa-signal" />
            {course.level || 'All Levels'}
          </span>
        </div>

        {/* Instructor */}
        <div className="course-instructor">
          <img
            src={instructorAvatar}
            alt={course.instructor?.fullName}
            className="instructor-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'assets/img/user/user-29.jpg';
            }}
          />
          <div className="instructor-info">
            <span className="instructor-name">
              {course.instructor?.fullName || 'Master Chef'}
            </span>
            <span className="instructor-title">
              {course.instructor?.headline || 'Expert Instructor'}
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className="course-rating">
          <div className="stars">
            {renderStars(course.ratingAverage)}
          </div>
          <span className="rating-text">
            {course.ratingAverage.toFixed(1)} ({course.ratingCount} reviews)
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="course-footer">
        <div className="course-price">
          {!course.requiresPurchase ? (
            <span className="current-price" style={{ color: '#788E75' }}>Free</span>
          ) : (
            <>
              <span className="current-price">${displayPrice}</span>
              {discount > 0 && (
                <span className="original-price">${course.originalPrice}</span>
              )}
            </>
          )}
        </div>
        <Link
          to={`${all_routes.courseDetails}/${course.slug}`}
          className="enroll-btn"
        >
          Enroll Now
          <i className="fa-solid fa-arrow-right ms-2" />
        </Link>
      </div>
    </div>
  );
};

export default LuxuryCourseCard;
