import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { all_routes } from '../feature-module/router/all_routes';

interface LuxuryHeroProps {
  title?: string;
  highlightedText?: string;
  description?: string;
  showSearch?: boolean;
  showStats?: boolean;
  variant?: 'light' | 'dark';
  backgroundImage?: string;
}

const LuxuryHero: React.FC<LuxuryHeroProps> = ({
  title = 'Master the Art of',
  highlightedText = 'Cake Design',
  description = 'Transform your passion into expertise with world-class courses from master pastry chefs. Learn luxury cake decoration techniques that will elevate your creations.',
  showSearch = true,
  showStats = true,
  variant = 'light',
}) => {
  const { t } = useTranslation()
  return (
    <section className={`hero-luxury ${variant === 'dark' ? 'hero-luxury-dark' : ''}`}>
      {/* Parallax Background Elements */}
      <div className="hero-parallax-elements">
        <div className="parallax-shape shape-1" />
        <div className="parallax-shape shape-2" />
        <div className="parallax-shape shape-3" />
        <div className="parallax-shape shape-4" />
        <div className="parallax-shape shape-5" />
      </div>

      <div className="container">
        <div className="row align-items-center">
          {/* Content Column */}
          <div className="col-lg-6">
            <div className="hero-content-luxury">
              {/* Badge */}
              <div className="hero-badge">
                <span className="badge-icon">
                  <i className="fa-solid fa-crown" />
                </span>
                <span className="badge-text">{t('luxuryHero.premiumPlatform', 'Premium E-Learning Platform')}</span>
              </div>

              {/* Title */}
              <h1 className="hero-title-luxury">
                {title} <span className="highlight">{highlightedText}</span>
              </h1>

              {/* Description */}
              <p className="hero-description">{description}</p>

              {/* Search Bar */}
              {showSearch && (
                <div className="hero-search-luxury">
                  <input
                    type="text"
                    className="search-input"
                    placeholder={t('luxuryHero.searchPlaceholder', 'What do you want to learn today?')}
                  />
                  <button className="search-btn">
                    <i className="fa-solid fa-search" />
                    <span>{t('common.search', 'Search')}</span>
                  </button>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="hero-cta-group">
                <Link to={all_routes.courseList} className="btn-hero-primary">
                  {t('luxuryHero.exploreCourses', 'Explore Courses')}
                  <i className="fa-solid fa-arrow-right" />
                </Link>
                <button className="btn-hero-secondary">
                  <span className="play-icon">
                    <i className="fa-solid fa-play" />
                  </span>
                  {t('luxuryHero.watchDemo', 'Watch Demo')}
                </button>
              </div>

              {/* Stats */}
              {showStats && (
                <div className="hero-stats">
                  <div className="stat-item">
                    <div className="stat-value">
                      15<span>K+</span>
                    </div>
                    <div className="stat-label">{t('luxuryHero.activeStudents', 'Active Students')}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      200<span>+</span>
                    </div>
                    <div className="stat-label">{t('luxuryHero.expertCourses', 'Expert Courses')}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      4.9<span>/5</span>
                    </div>
                    <div className="stat-label">{t('luxuryHero.studentRating', 'Student Rating')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Column */}
          <div className="col-lg-6">
            <div className="hero-image-wrapper">
              <div className="hero-image-luxury">
                <img
                  src="assets/img/hero/hero-cake.jpg"
                  alt={t('luxuryHero.luxuryCakeDesign', 'Luxury Cake Design')}
                  className="main-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'assets/img/banner/banner-img.png';
                  }}
                />

                {/* Floating Cards */}
                <div className="floating-card card-students">
                  <div className="student-avatars">
                    <img src="assets/img/user/user-01.jpg" alt={t('common.student', 'Student')} />
                    <img src="assets/img/user/user-02.jpg" alt={t('common.student', 'Student')} />
                    <img src="assets/img/user/user-03.jpg" alt={t('common.student', 'Student')} />
                  </div>
                  <div className="student-info">
                    <div className="count">15K+</div>
                    <div className="label">{t('luxuryHero.happyStudents', 'Happy Students')}</div>
                  </div>
                </div>

                <div className="floating-card card-rating">
                  <div className="rating-stars">
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                  </div>
                  <div className="rating-value">4.9</div>
                  <div className="rating-label">{t('luxuryHero.courseRating', 'Course Rating')}</div>
                </div>

                <div className="floating-card card-course">
                  <div className="course-icon">
                    <i className="fa-solid fa-graduation-cap" />
                  </div>
                  <div className="course-info">
                    <div className="count">200+</div>
                    <div className="label">{t('luxuryHero.premiumCourses', 'Premium Courses')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero-scroll-indicator">
        <span className="scroll-text">{t('luxuryHero.scroll', 'Scroll')}</span>
        <span className="scroll-line" />
      </div>
    </section>
  );
};

export default LuxuryHero;
