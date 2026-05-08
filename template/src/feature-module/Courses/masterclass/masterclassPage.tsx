import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { App } from 'antd';
import { courseService } from '../../../services/api/course.service';
import { CourseCategory, Course } from '../../../services/api/types';
import { getFileUrl } from '../../../environment';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { addToCart } from '../../../core/redux/cartSlice';
import { all_routes } from '../../router/all_routes';

const PAGE_SIZE = 9;

// ── Stars ─────────────────────────────────────────────────────────────────────
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <i key={i} className="fa-solid fa-star" style={{
        color: i < Math.floor(rating) ? '#C5912C' : 'rgba(197,145,44,0.2)',
        fontSize: '0.65rem',
      }} />
    ))}
  </>
);

// ── Masterclass Card ──────────────────────────────────────────────────────────
const MasterclassCard: React.FC<{
  course: Course;
  inCart: boolean;
  onCart: (c: Course) => void;
  index: number;
}> = ({ course, inCart, onCart, index }) => {
  const route   = all_routes;
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAppSelector(s => s.auth);
  const isStaff   = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transition = 'transform 0.1s linear';
    el.style.transform  = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) scale(1.025)`;
  };
  const handleMouseLeave = () => {
    const el = cardRef.current; if (!el) return;
    el.style.transition = 'transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94)';
    el.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
  };

  const thumb  = getFileUrl(course.thumbnailUrl) ?? `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`;
  const avatar = getFileUrl(course.instructor?.avatarUrl) ?? `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`;

  const discounted = course.originalPrice && course.originalPrice > (course.price ?? 0);
  const discountPct = discounted
    ? Math.round((1 - (course.price ?? 0) / course.originalPrice!) * 100)
    : 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-aos="fade-up"
      data-aos-delay={String(index * 60)}
      data-aos-duration="700"
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(197,145,44,0.15)',
        boxShadow: '0 4px 20px rgba(78,20,32,0.07)',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(78,20,32,0.14)'; }}
    >
      {/* Thumbnail */}
      <Link
        to={`${route.courseDetails}/${course.slug}`}
        style={{ position: 'relative', display: 'block', overflow: 'hidden', flexShrink: 0 }}
      >
        <img
          src={thumb}
          alt={course.title}
          onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`; }}
          style={{
            width: '100%', height: 200, objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
          onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.07)'; }}
          onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(78,20,32,0.55) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* Crown badge */}
        <span style={{
          position: 'absolute', top: 12, left: 12,
          background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
          color: '#4E1420', fontSize: '0.58rem', fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 2px 8px rgba(197,145,44,0.4)',
        }}>
          <i className="isax isax-crown" style={{ fontSize: 10 }} /> Masterclass
        </span>

        {/* Discount badge */}
        {discounted && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            background: '#651C32', color: '#fff',
            fontSize: '0.6rem', fontWeight: 700,
            padding: '3px 8px', borderRadius: 20,
          }}>
            -{discountPct}%
          </span>
        )}

        {/* Enrolled badge */}
        {course.isEnrolled && (
          <span style={{
            position: 'absolute', bottom: 10, left: 12,
            background: 'rgba(26,127,75,0.9)', color: '#fff',
            fontSize: '0.58rem', fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <i className="fa-solid fa-check" style={{ fontSize: 9 }} /> Enrolled
          </span>
        )}
      </Link>

      {/* Body */}
      <div style={{ padding: '1.1rem 1.2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Instructor */}
        <Link
          to={`${route.instructorDetails}/${course.instructor?.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: '0.6rem' }}
        >
          <img
            src={avatar}
            alt={course.instructor?.fullName}
            onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`; }}
            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(197,145,44,0.4)' }}
          />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(58,30,32,0.65)' }}>
            {course.instructor?.fullName || 'Instructor'}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#9A6F1A', background: 'rgba(197,145,44,0.1)',
            padding: '2px 8px', borderRadius: 10,
          }}>
            {course.level?.replace('_', ' ') || 'All Levels'}
          </span>
        </Link>

        {/* Title */}
        <h3 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '1rem', fontWeight: 700,
          color: '#4E1420', lineHeight: 1.4,
          marginBottom: '0.5rem', flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          <Link to={`${route.courseDetails}/${course.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {course.title}
          </Link>
        </h3>

        {/* Gold divider */}
        <div style={{
          height: 1, margin: '0.65rem 0',
          background: 'linear-gradient(90deg, #C5912C 0%, rgba(197,145,44,0.1) 100%)',
        }} />

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Stars rating={course.ratingAverage ?? 0} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C5912C', marginLeft: 3 }}>
              {(course.ratingAverage ?? 0).toFixed(1)}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(58,30,32,0.4)' }}>
              ({course.ratingCount ?? 0})
            </span>
          </span>
          <span style={{ color: 'rgba(197,145,44,0.4)', fontSize: '0.55rem' }}>✦</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(58,30,32,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="isax isax-video-play" style={{ fontSize: 12 }} />
            {course.lessonsCount ?? 0} lessons
          </span>
        </div>

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Price */}
          <div>
            {course.isEnrolled ? (
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A7F4B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="fa-solid fa-check-circle" /> Enrolled
              </span>
            ) : isStaff ? (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#651C32', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: 10 }} /> Free Access
              </span>
            ) : !course.requiresPurchase || (course.price ?? 0) === 0 ? (
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1A7F4B' }}>Free</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '1.15rem', fontWeight: 800, color: '#4E1420',
                }}>
                  {course.price} MAD
                </span>
                {discounted && (
                  <del style={{ fontSize: '0.75rem', color: 'rgba(58,30,32,0.35)' }}>
                    {course.originalPrice} MAD
                  </del>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          {course.isEnrolled ? (
            <Link
              to={`${route.courseWatch}/${course.slug}`}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
                color: '#4E1420', boxShadow: '0 2px 8px rgba(197,145,44,0.3)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Continue <i className="isax isax-arrow-right-1" style={{ fontSize: 11 }} />
            </Link>
          ) : isStaff ? (
            /* Admin / Instructor: direct access — no payment */
            <Link
              to={`${route.courseDetails}/${course.slug}`}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #651C32 0%, #8B2335 100%)',
                color: '#fff', boxShadow: '0 2px 8px rgba(101,28,50,0.25)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ fontSize: 11 }} /> Access
            </Link>
          ) : inCart ? (
            <Link
              to={route.courseCart}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                textDecoration: 'none',
                background: 'rgba(101,28,50,0.06)',
                color: '#651C32', border: '1px solid rgba(101,28,50,0.2)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              In Cart <i className="isax isax-bag-tick" style={{ fontSize: 11 }} />
            </Link>
          ) : (
            <button
              onClick={() => onCart(course)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
                color: '#fff', boxShadow: '0 2px 8px rgba(78,20,32,0.2)',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)'; e.currentTarget.style.color = '#4E1420'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)'; e.currentTarget.style.color = '#fff'; }}
            >
              <i className="isax isax-bag-add" style={{ fontSize: 13 }} /> Enroll
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <div className="sl-cl-skeleton" style={{ animationDelay: `${index * 0.07}s`, flexDirection: 'column', minHeight: 360 }}>
    <div className="sl-cl-skeleton__thumb" style={{ height: 200, width: '100%' }} />
    <div className="sl-cl-skeleton__body">
      <div className="sl-cl-skeleton__line" style={{ width: '50%', height: 12, marginBottom: 12 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '90%', height: 18, marginBottom: 6 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '70%', height: 14, marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="sl-cl-skeleton__line" style={{ width: 70, height: 22 }} />
        <div className="sl-cl-skeleton__line" style={{ width: 90, height: 34, borderRadius: 20 }} />
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const MasterclassPage: React.FC = () => {
  const route    = all_routes;
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { items: cartItems } = useAppSelector(s => s.cart);
  const { isAuthenticated } = useAppSelector(s => s.auth);

  const [categories,    setCategories]    = useState<CourseCategory[]>([]);
  const [activeTab,     setActiveTab]     = useState<string>('all');
  const [courses,       setCourses]       = useState<Course[]>([]);
  const [catLoading,    setCatLoading]    = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage,   setCurrentPage]   = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);
  const [searchQuery,   setSearchQuery]   = useState('');

  useEffect(() => {
    AOS.init({ once: true, easing: 'ease-out-cubic', duration: 800, offset: 40 });
  }, []);

  // Load categories
  useEffect(() => {
    courseService.getCategories()
      .then(cats => setCategories(cats ?? []))
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  const fetchCourses = useCallback(async (categoryId: string, page: number, search?: string) => {
    try {
      setCourseLoading(true);
      const params: any = {
        page,
        size: PAGE_SIZE,
        sortBy: 'newest',
        courseType: 'MASTERCLASS',
      };
      if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
      if (search && search.trim()) params.search = search.trim();

      const result = await courseService.getCourses(params);
      setCourses(result.content ?? []);
      setTotalElements(result.totalElements ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch {
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  }, []);

  // Re-fetch when tab or page changes
  useEffect(() => {
    setCurrentPage(0);
    fetchCourses(activeTab, 0, searchQuery);
  }, [activeTab]);

  useEffect(() => {
    fetchCourses(activeTab, currentPage, searchQuery);
  }, [currentPage]);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(0);
      fetchCourses(activeTab, 0, searchQuery);
    }, 450);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleCart = (course: Course) => {
    if (cartItems.some(i => i.id === course.id)) { message.info('Already in cart'); return; }
    dispatch(addToCart({
      id: course.id, slug: course.slug, title: course.title,
      thumbnailUrl: course.thumbnailUrl, price: course.price ?? 0,
      originalPrice: course.originalPrice,
      instructorName: course.instructor?.fullName,
      instructorId: course.instructor?.id,
    }));
    message.success('Added to cart');
  };

  // Pagination numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - (currentPage + 1)) <= 1)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
      acc.push(p); return acc;
    }, []);

  return (
    <>
      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #2C1106 0%, #4E1420 40%, #3A1A10 100%)',
        position: 'relative', overflow: 'hidden',
        padding: '80px 0 60px',
      }}>
        {/* Toile pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C5912C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Floating particles */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="sl-particle" style={{ left: `${12 + i * 15}%`, bottom: '20%', animationDelay: `${i * 0.8}s` }} />
          ))}
        </div>

        {/* Gold accent lines */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent 0%, #C5912C 30%, #DEBB6B 50%, #C5912C 70%, transparent 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
            {/* Script ornament */}
            <div data-aos="fade-up" data-aos-duration="600" style={{ marginBottom: '0.5rem' }}>
              <span style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic', fontSize: '1.8rem',
                color: '#C5912C', opacity: 0.85,
              }}>
                Exclusivité
              </span>
            </div>

            {/* Crown icon */}
            <div data-aos="fade-up" data-aos-delay="60" style={{ marginBottom: '0.8rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(197,145,44,0.15) 0%, rgba(197,145,44,0.05) 100%)',
                border: '1px solid rgba(197,145,44,0.3)',
              }}>
                <i className="isax isax-crown" style={{ fontSize: 26, color: '#C5912C' }} />
              </span>
            </div>

            <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="700" style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700,
              color: '#fff', marginBottom: '0.8rem', lineHeight: 1.2,
            }}>
              Masterclasses
            </h1>

            <p data-aos="fade-up" data-aos-delay="180" data-aos-duration="700" style={{
              fontSize: '1rem', color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7, marginBottom: '1.8rem',
            }}>
              Premium one-time courses crafted by our master pastry artists —
              purchase individually and own them forever.
            </p>

            {/* Search bar */}
            <form
              data-aos="fade-up" data-aos-delay="260" data-aos-duration="700"
              onSubmit={e => e.preventDefault()}
              style={{
                display: 'flex', alignItems: 'center', maxWidth: 520, margin: '0 auto 1.5rem',
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(197,145,44,0.25)', borderRadius: 40,
                padding: '6px 6px 6px 20px',
              }}
            >
              <i className="isax isax-search-normal-1" style={{ color: 'rgba(255,255,255,0.4)', marginRight: 10, fontSize: 16 }} />
              <input
                type="text"
                placeholder="Search masterclasses…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.9rem',
                }}
              />
              <button type="submit" style={{
                background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
                border: 'none', borderRadius: 30, padding: '8px 20px',
                color: '#4E1420', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
              }}>
                Search
              </button>
            </form>

            {/* Breadcrumb */}
            <nav data-aos="fade-up" data-aos-delay="320" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
            }}>
              <Link to={route.homeone} style={{ color: 'rgba(197,145,44,0.7)', textDecoration: 'none' }}>Home</Link>
              <span style={{ fontSize: '0.5rem' }}>✦</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Masterclasses</span>
            </nav>
          </div>
        </div>

        {/* Bottom divider */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(197,145,44,0.3) 50%, transparent 100%)',
        }} />
      </div>

      {/* ── Main Content ── */}
      <section style={{ padding: '3rem 0 5rem', background: '#fdfaf7' }}>
        <div className="container">

          {/* ── Category Filter Tabs ── */}
          {catLoading ? (
            <div className="d-flex gap-2 mb-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="sl-cl-skeleton__line" style={{ width: 100, height: 40, borderRadius: 30 }} />
              ))}
            </div>
          ) : (
            <div
              data-aos="fade-up" data-aos-duration="600"
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '2.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(197,145,44,0.12)',
              }}
            >
              {/* "All" tab */}
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '8px 22px',
                  fontSize: '0.72rem', fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  border: activeTab === 'all'
                    ? '1.5px solid #C5912C'
                    : '1.5px solid rgba(197,145,44,0.2)',
                  background: activeTab === 'all'
                    ? 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)'
                    : 'transparent',
                  color: activeTab === 'all' ? '#C5912C' : 'rgba(78,20,32,0.55)',
                  borderRadius: 30, cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <i className="isax isax-crown" style={{ fontSize: 13 }} />
                All Masterclasses
                {totalElements > 0 && (
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 700,
                    background: activeTab === 'all' ? 'rgba(197,145,44,0.2)' : 'rgba(197,145,44,0.08)',
                    color: '#C5912C', padding: '1px 6px', borderRadius: 20,
                  }}>
                    {totalElements}
                  </span>
                )}
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  style={{
                    padding: '8px 22px',
                    fontSize: '0.72rem', fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    border: activeTab === cat.id
                      ? '1.5px solid #C5912C'
                      : '1.5px solid rgba(197,145,44,0.2)',
                    background: activeTab === cat.id
                      ? 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)'
                      : 'transparent',
                    color: activeTab === cat.id ? '#C5912C' : 'rgba(78,20,32,0.55)',
                    borderRadius: 30, cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* ── Toolbar ── */}
          {!courseLoading && courses.length > 0 && (
            <div className="sl-cl-toolbar" style={{ marginBottom: '1.75rem' }} data-aos="fade-down">
              <p className="sl-cl-toolbar__results">
                Showing <strong>{totalElements}</strong> masterclass{totalElements !== 1 ? 'es' : ''}
                {activeTab !== 'all' && (
                  <> in <strong>{categories.find(c => c.id === activeTab)?.name}</strong></>
                )}
                {searchQuery && <> matching "<strong>{searchQuery}</strong>"</>}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none', border: '1px solid rgba(197,145,44,0.3)',
                    borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                    fontSize: '0.7rem', color: '#9A6F1A',
                  }}
                >
                  <i className="isax isax-close-circle" style={{ marginRight: 4 }} />
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* ── Course Grid ── */}
          {courseLoading ? (
            <div className="row g-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="col-xl-4 col-md-6"><SkeletonCard index={i} /></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="sl-cl-empty" data-aos="fade-up">
              <div className="sl-ornament">
                <span className="sl-script" style={{ fontSize: '2rem' }}>
                  {searchQuery ? 'No Results' : 'Coming Soon'}
                </span>
              </div>
              <i className="isax isax-crown sl-cl-empty__icon" style={{ color: '#C5912C' }} />
              <h4 className="sl-cl-empty__title">
                {searchQuery
                  ? `No masterclasses found for "${searchQuery}"`
                  : 'No masterclasses in this category yet'}
              </h4>
              <p className="sl-cl-empty__text">
                {searchQuery
                  ? 'Try a different search term or browse all masterclasses.'
                  : 'Our master instructors are crafting exclusive masterclasses for this discipline. Check back soon.'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                className="sl-btn-gold sl-btn-magnetic"
              >
                Browse All Masterclasses <i className="isax isax-arrow-right-1" />
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {courses.map((course, i) => (
                <div key={course.id} className="col-xl-4 col-md-6" style={{ display: 'flex' }}>
                  <MasterclassCard
                    course={course}
                    inCart={cartItems.some(item => item.id === course.id)}
                    onCart={handleCart}
                    index={i}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="sl-cl-pagination" data-aos="fade-up" data-aos-duration="600">
              <button
                className="sl-cl-pagination__arrow"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous"
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
                aria-label="Next"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}

          {/* ── Bottom CTA strip ── */}
          {!courseLoading && courses.length > 0 && (
            <div
              data-aos="fade-up" data-aos-duration="700"
              style={{
                marginTop: '4rem', padding: '2.5rem 2rem', borderRadius: 20, textAlign: 'center',
                background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
                border: '1px solid rgba(197,145,44,0.2)',
              }}
            >
              <i className="isax isax-book-1" style={{ fontSize: 36, color: 'rgba(197,145,44,0.6)', marginBottom: 12, display: 'block' }} />
              <h4 style={{ fontFamily: '"Playfair Display", serif', color: '#fff', marginBottom: 8 }}>
                Looking for subscription courses?
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Access hundreds of Plan courses with a single SARALÖWE subscription.
              </p>
              <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
                Browse Plan Courses <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
          )}

        </div>
      </section>
    </>
  );
};

export default MasterclassPage;
