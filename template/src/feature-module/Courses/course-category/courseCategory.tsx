import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { App } from 'antd';
import { courseService } from '../../../services/api/course.service';
import { CourseCategory as CourseCategoryType, Course } from '../../../services/api/types';
import { getFileUrl } from '../../../environment';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { addToCart } from '../../../core/redux/cartSlice';
import SubscriptionGate from '../../common/SubscriptionGate';

// ── Stars ─────────────────────────────────────────────────────────────────────
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <i key={i} className="fa-solid fa-star" style={{
        color: i < Math.floor(rating) ? 'var(--sl-gold)' : 'rgba(197,145,44,0.22)',
        fontSize: '0.65rem',
      }} />
    ))}
  </>
);

// ── Course card (grid style matching home featured-course) ────────────────────
const CourseCard: React.FC<{
  course: Course;
  inCart: boolean;
  onCart: (c: Course) => void;
  index: number;
}> = ({ course, inCart, onCart, index }) => {
  const { t } = useTranslation();
  const route  = all_routes;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transition = 'transform 0.1s linear';
    el.style.transform  = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) scale(1.03)`;
  };
  const handleMouseLeave = () => {
    const el = cardRef.current; if (!el) return;
    el.style.transition = 'transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94)';
    el.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
  };

  const thumb  = getFileUrl(course.thumbnailUrl) ?? `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`;
  const avatar = getFileUrl(course.instructor?.avatarUrl) ?? `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`;

  return (
    <div
      ref={cardRef}
      className="sl-course-card sl-tilt-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-aos="fade-up"
      data-aos-delay={String(index * 60)}
      data-aos-duration="700"
      style={{ position: 'relative' }}
    >
      {/* Image */}
      <div className="sl-course-card__img">
        <img src={thumb} alt={course.title}
          onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`; }} />
        <div className="sl-course-card__img-overlay" />
        <div className="sl-course-card__badge">{course.category?.name || 'Pastry Arts'}</div>
        {course.isEnrolled && (
          <span style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            background: 'rgba(29,60,52,0.9)', color: 'var(--sl-gold)',
            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', padding: '0.3rem 0.6rem', zIndex: 2,
          }}>
            <i className="fa-solid fa-check me-1" />{t('courseList.enrolled', 'Enrolled')}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="sl-course-card__body">
        <div className="sl-course-card__meta">
          <Link to={`${route.instructorDetails}/${course.instructor?.id}`} className="sl-course-card__instructor">
            <img src={avatar} alt={course.instructor?.fullName}
              onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`; }} />
            <span>{course.instructor?.fullName || 'Instructor'}</span>
          </Link>
          <span className="sl-course-card__category">{course.level?.replace('_', ' ') || 'All Levels'}</span>
        </div>

        <div className="sl-course-card__title">
          <Link to={`${route.courseDetails}/${course.slug}`}>{course.title}</Link>
        </div>

        <div className="sl-course-card__rating">
          <span className="stars"><Stars rating={course.ratingAverage ?? 0} /></span>
          <span>{(course.ratingAverage ?? 0).toFixed(1)}</span>
          <span style={{ opacity: 0.5 }}>· {course.enrolledCount ?? 0} {t('common.students', 'students')}</span>
        </div>

        <div className="sl-course-card__footer">
          <span className="sl-course-card__price">
            {course.isEnrolled ? (
              <span style={{ color: 'var(--sl-sage)', fontWeight: 700 }}>
                <i className="fa-solid fa-check-circle me-1" />{t('courseList.owned', 'Owned')}
              </span>
            ) : !course.requiresPurchase ? t('courseList.free', 'Free') : `$${course.price ?? 0}`}
          </span>
          {course.isEnrolled ? (
            <Link to={`${route.courseWatch}/${course.slug}`} className="sl-course-card__cta sl-btn-magnetic">
              {t('courseList.continue', 'Continue')} <i className="isax isax-arrow-right-1" />
            </Link>
          ) : course.requiresPurchase ? (
            <button
              className="sl-course-card__cta sl-btn-magnetic"
              onClick={() => onCart(course)}
              style={{
                background: inCart ? 'var(--sl-forest)' : 'var(--sl-burgundy)',
                color: 'var(--sl-blush)', border: 'none', cursor: 'pointer',
              }}
            >
              {inCart ? <><i className="fa-solid fa-check me-1" />{t('courseDetails.inCart', 'In Cart')}</> : t('courseDetails.addToCart', 'Add to Cart')}
            </button>
          ) : (
            <Link to={`${route.courseDetails}/${course.slug}`} className="sl-course-card__cta sl-btn-magnetic">
              {t('courseDetails.enrollFree', 'Enrol Free')} <i className="isax isax-arrow-right-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="sl-cl-skeleton" style={{ minHeight: 340 }}>
    <div className="sl-cl-skeleton__thumb" style={{ height: 180 }} />
    <div className="sl-cl-skeleton__body">
      <div className="sl-cl-skeleton__line" style={{ width: '40%', height: 11, marginBottom: 12 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '85%', height: 18, marginBottom: 8 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '60%', height: 12, marginBottom: 24 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="sl-cl-skeleton__line" style={{ width: 56, height: 20 }} />
        <div className="sl-cl-skeleton__line" style={{ width: 100, height: 36 }} />
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const CourseCategory = () => {
  const { t } = useTranslation()
  const route    = all_routes;
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { items: cartItems } = useAppSelector((s) => s.cart);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const [categories,    setCategories]    = useState<CourseCategoryType[]>([]);
  const [activeTab,     setActiveTab]     = useState<string>('');
  const [courses,       setCourses]       = useState<Course[]>([]);
  const [catLoading,    setCatLoading]    = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage,   setCurrentPage]   = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);
  const PAGE_SIZE = 9;

  useEffect(() => {
    AOS.init({ once: true, easing: 'ease-out-cubic', duration: 800, offset: 40 });
  }, []);

  useEffect(() => {
    courseService.getCategories()
      .then(cats => { if (cats.length > 0) { setCategories(cats); setActiveTab(cats[0].id); } })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  const fetchCourses = useCallback(async (categoryId: string, page: number) => {
    if (!categoryId) return;
    try {
      setCourseLoading(true);
      const result = await courseService.getCourses({ categoryId, page, size: PAGE_SIZE, sortBy: 'newest', courseType: 'MASTERCLASS' });
      setCourses(result.content ?? []);
      setTotalElements(result.totalElements ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch { setCourses([]); }
    finally { setCourseLoading(false); }
  }, []);

  useEffect(() => { if (activeTab) { setCurrentPage(0); fetchCourses(activeTab, 0); } }, [activeTab, fetchCourses]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab) fetchCourses(activeTab, currentPage); }, [currentPage]);

  const handleCart = (course: Course) => {
    if (cartItems.some(i => i.id === course.id)) { message.info(t('courseCategory.alreadyInCart', 'Already in cart')); return; }
    dispatch(addToCart({
      id: course.id, slug: course.slug, title: course.title,
      thumbnailUrl: course.thumbnailUrl, price: course.price ?? 0,
      originalPrice: course.originalPrice,
      instructorName: course.instructor?.fullName,
      instructorId: course.instructor?.id,
      instructorAvatar: course.instructor?.avatarUrl,
      rating: course.ratingAverage, ratingCount: course.ratingCount, level: course.level,
    }));
    message.success(t('courseCategory.addedToCart', '"{{title}}" added to cart', { title: course.title }));
  };

  const activeCategory = categories.find(c => c.id === activeTab);

  // Page numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - (currentPage + 1)) <= 1)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
      acc.push(p); return acc;
    }, []);

  return (
    <>
      {/* ── Luxury hero strip ── */}
      <div className="sl-cl-hero">
        <div className="sl-cl-hero__toile" aria-hidden="true" />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sl-particle" style={{ left: `${18 + i * 16}%`, bottom: '18%', animationDelay: `${i * 0.9}s` }} />
          ))}
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="sl-cl-hero__inner">
            <div className="sl-ornament justify-content-center" data-aos="fade-up" data-aos-duration="600">
              <span className="sl-script" style={{ fontSize: '1.7rem' }}>{t('courseCategory.byDiscipline', 'By Discipline')}</span>
            </div>
            <h1 className="sl-cl-hero__title" data-aos="fade-up" data-aos-delay="80" data-aos-duration="700">
              {t('nav.masterclasses', 'Masterclasses')}
            </h1>
            <p className="sl-cl-hero__sub" data-aos="fade-up" data-aos-delay="160" data-aos-duration="700">
              {t('courseCategory.heroSubtitle', 'Explore our programmes by discipline — from sugar flowers to architectural cake design')}
            </p>
            <nav className="sl-cl-hero__breadcrumb" data-aos="fade-up" data-aos-delay="240" data-aos-duration="700">
              <Link to={route.homeone}>{t('sharedComponents.breadcrumb.home', 'Home')}</Link>
              <span>✦</span>
              <span>{t('nav.masterclasses', 'Masterclasses')}</span>
            </nav>
          </div>
        </div>
        <div className="sl-cinematic-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      {/* ── Main content ── */}
      <section className="sl-cl-page">
        <div className="container">

          {/* Category tabs */}
          {catLoading ? (
            <div className="d-flex gap-2 mb-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sl-cl-skeleton__line" style={{ width: 90, height: 38, borderRadius: 4 }} />
              ))}
            </div>
          ) : (
            <div
              className="d-flex flex-wrap gap-2 mb-5"
              data-aos="fade-up" data-aos-duration="600"
              style={{
                borderBottom: '1px solid rgba(101,28,50,0.10)',
                paddingBottom: '1.25rem',
              }}
            >
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  style={{
                    padding: '8px 20px',
                    fontFamily: 'var(--sl-font-body)',
                    fontSize: '0.72rem', fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    border: activeTab === cat.id
                      ? '1px solid var(--sl-gold)'
                      : '1px solid rgba(101,28,50,0.15)',
                    background: activeTab === cat.id
                      ? 'var(--sl-burgundy)'
                      : 'transparent',
                    color: activeTab === cat.id ? 'var(--sl-gold)' : 'rgba(101,28,50,0.65)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {cat.name}
                  {cat.coursesCount > 0 && (
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 700,
                      background: activeTab === cat.id ? 'rgba(197,145,44,0.2)' : 'rgba(101,28,50,0.08)',
                      color: activeTab === cat.id ? 'var(--sl-gold)' : 'rgba(101,28,50,0.45)',
                      padding: '1px 6px', borderRadius: 2,
                    }}>
                      {cat.coursesCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Toolbar */}
          {!courseLoading && courses.length > 0 && (
            <div className="sl-cl-toolbar" style={{ marginBottom: '1.5rem' }}>
              <p className="sl-cl-toolbar__results">
                <strong>{totalElements}</strong> {totalElements !== 1 ? t('courseCategory.masterclasses', 'masterclasses') : t('courseCategory.masterclass', 'masterclass')} {t('courseCategory.inCategory', 'in')}{' '}
                <strong>{activeCategory?.name}</strong>
              </p>
              <Link
                to={`${route.courseList}?category=${activeTab}`}
                className="sl-btn-dark sl-btn-magnetic"
                style={{ fontSize: '0.65rem', padding: '8px 18px' }}
              >
                {t('courseCategory.viewAll', 'View All')} <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
          )}

          {/* Gate for unauthenticated visitors */}
          {!isAuthenticated ? (
            <SubscriptionGate type="masterclass" ghostCount={6} />
          ) : courseLoading ? (
            <div className="row g-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="col-xl-4 col-md-6"><SkeletonCard /></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="sl-cl-empty" data-aos="fade-up">
              <div className="sl-ornament">
                <span className="sl-script" style={{ fontSize: '2rem' }}>{t('courseCategory.comingSoon', 'Coming Soon')}</span>
              </div>
              <i className="isax isax-book sl-cl-empty__icon" />
              <h4 className="sl-cl-empty__title">{t('courseCategory.noMasterclassesYet', 'No masterclasses in this category yet')}</h4>
              <p className="sl-cl-empty__text">
                {t('courseCategory.crafting', 'Our master instructors are crafting exclusive masterclasses for this discipline. Check back soon.')}
              </p>
              <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
                {t('courseList.browseAllProgrammes', 'Browse All Programmes')} <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              {courses.map((course, i) => (
                <div key={course.id} className="col-xl-4 col-md-6" style={{ display: 'flex' }}>
                  <CourseCard
                    course={course}
                    inCart={cartItems.some(item => item.id === course.id)}
                    onCart={handleCart}
                    index={i}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="sl-cl-pagination" data-aos="fade-up" data-aos-duration="600">
              <button
                className="sl-cl-pagination__arrow"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              {pageNumbers.map((p, i) =>
                p === '…' ? (
                  <span key={`el-${i}`} className="sl-cl-pagination__ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`sl-cl-pagination__page${currentPage + 1 === p ? ' is-active' : ''}`}
                    onClick={() => setCurrentPage((p as number) - 1)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="sl-cl-pagination__arrow"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}

        </div>
      </section>
    </>
  );
};

export default CourseCategory;
