import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Slider, App } from 'antd';
import type { SliderSingleProps } from 'antd';
import { all_routes } from '../../router/all_routes';
import { courseService } from '../../../services/api/course.service';
import { Course, CourseCategory, CourseLevel } from '../../../services/api/types';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';
import SubscriptionGate from '../../common/SubscriptionGate';

const SORT_OPTIONS = (t: (key: string, fallback: string) => string) => [
  { label: t('courseList.newlyPublished', 'Newly Published'),   value: 'newest' },
  { label: t('courseList.mostPopular', 'Most Popular'),          value: 'popular' },
  { label: t('courseList.topRated', 'Top Rated'),               value: 'rating' },
  { label: t('courseList.priceLowHigh2', 'Price: Low → High'),  value: 'price_asc' },
  { label: t('courseList.priceHighLow2', 'Price: High → Low'),  value: 'price_desc' },
];

const LEVELS_DATA: { value: CourseLevel; labelKey: string; labelFallback: string }[] = [
  { value: 'BEGINNER',     labelKey: 'courseList.beginner',     labelFallback: 'Beginner' },
  { value: 'INTERMEDIATE', labelKey: 'courseList.intermediate', labelFallback: 'Intermediate' },
  { value: 'ADVANCED',     labelKey: 'courseList.advanced',     labelFallback: 'Advanced' },
  { value: 'ALL_LEVELS',   labelKey: 'courseList.allLevels',    labelFallback: 'All Levels' },
];

// ── Stars ─────────────────────────────────────────────────────────────────────
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className="fa-solid fa-star"
        style={{ color: i < Math.floor(rating) ? 'var(--sl-gold)' : 'rgba(197,145,44,0.22)', fontSize: '0.6rem' }}
      />
    ))}
  </>
);

// ── Grid Card ─────────────────────────────────────────────────────────────────
interface CourseGridCardProps {
  course: Course;
  inWishlist: boolean;
  isLoadingWishlist: boolean;
  onWishlist: (id: string) => void;
  getLevelDisplay: (level: CourseLevel) => string;
  index: number;
}

const CourseGridCard: React.FC<CourseGridCardProps> = ({
  course, inWishlist, isLoadingWishlist, onWishlist, getLevelDisplay, index,
}) => {
  const { t } = useTranslation();
  const route  = all_routes;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transition = 'transform 0.12s linear';
    el.style.transform = `perspective(1000px) rotateX(${-y * 4}deg) rotateY(${x * 6}deg) scale(1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)';
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  const thumb  = course.thumbnailUrl
    ? (getFileUrl(course.thumbnailUrl) ?? course.thumbnailUrl)
    : `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`;

  const avatar = course.instructor?.avatarUrl
    ? (getFileUrl(course.instructor.avatarUrl) ?? course.instructor.avatarUrl)
    : `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-aos="fade-up"
      data-aos-delay={String(index * 60)}
      data-aos-duration="700"
      style={{
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(78,20,32,0.07)',
        border: '1px solid rgba(197,145,44,0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(78,20,32,0.14)'; }}
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
            width: '100%', height: 190, objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
          onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
        />
        {/* Overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(78,20,32,0.5) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />

        {/* Category badge */}
        <span style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(78,20,32,0.85)',
          backdropFilter: 'blur(8px)',
          color: '#C5912C', fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 20,
        }}>
          {course.category?.name || 'Pastry Arts'}
        </span>

        {/* Wishlist button */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onWishlist(course.id); }}
          disabled={isLoadingWishlist}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: inWishlist ? '#651C32' : 'rgba(255,255,255,0.9)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}
          aria-label={inWishlist ? t('courseList.removeFromWishlist', 'Remove from wishlist') : t('courseList.addToWishlist', 'Add to wishlist')}
        >
          <i
            className={inWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
            style={{ fontSize: 13, color: inWishlist ? '#fff' : '#651C32' }}
          />
        </button>

        {/* Premium / Enrolled labels */}
        {course.requiresPurchase && (
          <span style={{
            position: 'absolute', bottom: 10, left: 12,
            background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
            color: '#4E1420', fontSize: '0.58rem', fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <i className="isax isax-crown" style={{ fontSize: 10 }} /> {t('courseList.premium', 'Premium')}
          </span>
        )}
        {course.isEnrolled && (
          <span style={{
            position: 'absolute', bottom: 10, left: 12,
            background: 'rgba(26,127,75,0.9)',
            color: '#fff', fontSize: '0.58rem', fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <i className="fa-solid fa-check" style={{ fontSize: 9 }} /> {t('courseList.enrolled', 'Enrolled')}
          </span>
        )}
      </Link>

      {/* Card body */}
      <div style={{ padding: '1rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Instructor + Level */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <Link
            to={`${route.instructorDetails}/${course.instructor?.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              textDecoration: 'none',
            }}
          >
            <img
              src={avatar}
              alt={course.instructor?.fullName}
              onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`; }}
              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(197,145,44,0.3)' }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(58,30,32,0.65)', fontFamily: 'var(--sl-font-body)' }}>
              {course.instructor?.fullName || 'Instructor'}
            </span>
          </Link>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#651C32', background: 'rgba(101,28,50,0.07)',
            padding: '3px 8px', borderRadius: 10,
          }}>
            {getLevelDisplay(course.level)}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '0.98rem', fontWeight: 600,
          color: 'var(--sl-burgundy)', lineHeight: 1.45,
          marginBottom: '0.5rem',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          flex: 1,
        }}>
          <Link to={`${route.courseDetails}/${course.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {course.title}
          </Link>
        </h3>

        {/* Gold divider */}
        <div className="sl-gold-bar" style={{ margin: '0.7rem 0' }} />

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Stars rating={course.ratingAverage ?? 0} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C5912C', marginLeft: 3 }}>
              {(course.ratingAverage ?? 0).toFixed(1)}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(58,30,32,0.4)' }}>
              ({course.ratingCount ?? 0})
            </span>
          </span>
          <span style={{ color: 'rgba(197,145,44,0.4)', fontSize: '0.55rem' }}>✦</span>
          <span style={{ fontSize: '0.68rem', color: 'rgba(58,30,32,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="isax isax-video-play" style={{ fontSize: 12 }} />
            {course.lessonsCount ?? 0} {t('common.lessons', 'lessons')}
          </span>
        </div>

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {course.isEnrolled ? (
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A7F4B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="fa-solid fa-check-circle" /> {t('courseList.owned', 'Owned')}
              </span>
            ) : !course.requiresPurchase ? (
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1A7F4B' }}>{t('courseList.free', 'Free')}</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 800, color: '#4E1420' }}>
                  ${course.price ?? 0}
                </span>
                {course.originalPrice && course.originalPrice > (course.price ?? 0) && (
                  <del style={{ fontSize: '0.75rem', color: 'rgba(58,30,32,0.35)' }}>${course.originalPrice}</del>
                )}
              </div>
            )}
          </div>

          {course.isEnrolled ? (
            <Link
              to={`${route.courseWatch}/${course.slug}`}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem',
                fontWeight: 600, textDecoration: 'none',
                background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
                color: '#4E1420', boxShadow: '0 2px 8px rgba(197,145,44,0.3)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {t('courseList.continue', 'Continue')} <i className="isax isax-arrow-right-1" style={{ fontSize: 11 }} />
            </Link>
          ) : (
            <Link
              to={`${route.courseDetails}/${course.slug}`}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem',
                fontWeight: 600, textDecoration: 'none',
                background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
                color: '#fff',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {t('courseGrid.view', 'View')} <i className="isax isax-arrow-right-1" style={{ fontSize: 11 }} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonGridCard: React.FC<{ index: number }> = ({ index }) => (
  <div
    className="sl-cl-skeleton"
    style={{ animationDelay: `${index * 0.07}s`, flexDirection: 'column', minHeight: 340 }}
  >
    <div className="sl-cl-skeleton__thumb" style={{ height: 190, width: '100%' }} />
    <div className="sl-cl-skeleton__body">
      <div className="sl-cl-skeleton__line" style={{ width: '60%', height: 12, marginBottom: 10 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '90%', height: 18, marginBottom: 6 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '72%', height: 12, marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="sl-cl-skeleton__line" style={{ width: 50, height: 20 }} />
        <div className="sl-cl-skeleton__line" style={{ width: 80, height: 32, borderRadius: 20 }} />
      </div>
    </div>
  </div>
);

// ── Sidebar Filter (shared with CourseList) ───────────────────────────────────
interface SidebarFilterProps {
  categories: CourseCategory[];
  selectedCategory: string | null;
  selectedLevel: CourseLevel | null;
  priceRange: [number, number];
  onCategoryChange: (id: string) => void;
  onLevelChange: (l: CourseLevel) => void;
  onPriceChange: (v: [number, number]) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({
  categories, selectedCategory, selectedLevel, priceRange,
  onCategoryChange, onLevelChange, onPriceChange, onClear, hasActiveFilters,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Set<string>>(new Set(['categories', 'price', 'level']));
  const toggle = (s: string) =>
    setOpen(p => { const n = new Set(p); if (n.has(s)) n.delete(s); else n.add(s); return n; });

  const priceFormatter: NonNullable<SliderSingleProps['tooltip']>['formatter'] = v => `$${v}`;

  return (
    <aside className="sl-cl-sidebar" data-aos="fade-right" data-aos-duration="700">
      <div className="sl-cl-sidebar__header">
        <div className="sl-ornament sl-ornament--left" style={{ marginBottom: '0.5rem' }}>
          <span className="sl-script" style={{ fontSize: '1.3rem' }}>{t('courseList.refine', 'Refine')}</span>
        </div>
        <div className="sl-cl-sidebar__header-row">
          <h5 className="sl-cl-sidebar__title">
            <i className="isax isax-filter" /> {t('courseList.filters', 'Filters')}
          </h5>
          {hasActiveFilters && (
            <button className="sl-cl-sidebar__clear" onClick={onClear}>{t('courseList.clearAll', 'Clear All')}</button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className={`sl-cl-filter-group${open.has('categories') ? ' is-open' : ''}`}>
        <button className="sl-cl-filter-group__head" onClick={() => toggle('categories')}>
          <span>{t('courseList.categories', 'Categories')}</span>
          <i className={`fa-solid fa-chevron-${open.has('categories') ? 'up' : 'down'}`} />
        </button>
        {open.has('categories') && (
          <div className="sl-cl-filter-group__body">
            {categories.length > 0 ? categories.map(cat => (
              <label key={cat.id} className="sl-cl-check">
                <input
                  type="checkbox"
                  checked={selectedCategory === cat.id}
                  onChange={() => onCategoryChange(cat.id)}
                />
                <span className="sl-cl-check__box" />
                <span className="sl-cl-check__label">{cat.name}</span>
                {cat.coursesCount !== undefined && (
                  <span className="sl-cl-check__count">{cat.coursesCount}</span>
                )}
              </label>
            )) : (
              <p className="sl-cl-filter-empty">{t('courseList.noCategoriesAvailable', 'No categories available')}</p>
            )}
          </div>
        )}
      </div>

      {/* Price */}
      <div className={`sl-cl-filter-group${open.has('price') ? ' is-open' : ''}`}>
        <button className="sl-cl-filter-group__head" onClick={() => toggle('price')}>
          <span>{t('courseGrid.priceRange', 'Price Range')}</span>
          <i className={`fa-solid fa-chevron-${open.has('price') ? 'up' : 'down'}`} />
        </button>
        {open.has('price') && (
          <div className="sl-cl-filter-group__body">
            <Slider
              range
              tooltip={{ formatter: priceFormatter }}
              min={0} max={500}
              value={priceRange}
              onChange={v => onPriceChange(v as [number, number])}
              className="sl-cl-price-slider"
            />
            <div className="sl-cl-price-labels">
              <span>{priceRange[0] === 0 ? t('courseList.free', 'Free') : `$${priceRange[0]}`}</span>
              <span>{priceRange[1] >= 500 ? '$500+' : `$${priceRange[1]}`}</span>
            </div>
          </div>
        )}
      </div>

      {/* Level */}
      <div className={`sl-cl-filter-group${open.has('level') ? ' is-open' : ''}`}>
        <button className="sl-cl-filter-group__head" onClick={() => toggle('level')}>
          <span>{t('courseList.skillLevel', 'Skill Level')}</span>
          <i className={`fa-solid fa-chevron-${open.has('level') ? 'up' : 'down'}`} />
        </button>
        {open.has('level') && (
          <div className="sl-cl-filter-group__body">
            {LEVELS_DATA.map(({ value, labelKey, labelFallback }) => (
              <label key={value} className="sl-cl-check">
                <input
                  type="checkbox"
                  checked={selectedLevel === value}
                  onChange={() => onLevelChange(value)}
                />
                <span className="sl-cl-check__box" />
                <span className="sl-cl-check__label">{t(labelKey, labelFallback)}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const CourseGrid: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const route = all_routes;
  const { message } = App.useApp();

  const [courses,       setCourses]       = useState<Course[]>([]);
  const [categories,    setCategories]    = useState<CourseCategory[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);

  const [wishlist,        setWishlist]        = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading] = useState<Set<string>>(new Set());

  const [currentPage,      setCurrentPage]      = useState(parseInt(searchParams.get('page') || '1'));
  const [searchQuery,      setSearchQuery]       = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory]  = useState<string | null>(searchParams.get('category') || null);
  const [selectedLevel,    setSelectedLevel]     = useState<CourseLevel | null>(
    (searchParams.get('level') as CourseLevel) || null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy,     setSortBy]     = useState(searchParams.get('sort') || 'newest');

  const { isAuthenticated, user } = useAppSelector(s => s.auth);

  useEffect(() => {
    AOS.init({ once: true, easing: 'ease-out-cubic', duration: 800, offset: 40 });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    courseService.getWishlist(0, 500)
      .then(res => setWishlist(new Set((res.content || []).map((c: Course) => c.id))))
      .catch(() => {});
  }, [isAuthenticated]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCategories(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCourses(); }, [currentPage, selectedCategory, selectedLevel, sortBy]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => {
      if (currentPage === 1) fetchCourses(); else setCurrentPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const displayedCourses = useMemo(() => {
    const [min, max] = priceRange;
    if (min === 0 && max === 500) return courses;
    return courses.filter(c => { const p = c.price ?? 0; return p >= min && p <= max; });
  }, [courses, priceRange]);

  const fetchCategories = async () => {
    try {
      const res = await courseService.getCategories();
      setCategories(Array.isArray(res) ? res : ((res as any).content || (res as any).data || []));
    } catch {}
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage - 1, size: 9, sortBy };
      if (searchQuery)      params.search     = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedLevel)    params.level      = selectedLevel;
      const res = await courseService.getCourses(params);
      if (res) {
        setCourses(res.content || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      }
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  const handleWishlist = async (courseId: string) => {
    if (!isAuthenticated) { message.warning(t('courseList.loginToSave', 'Please login to save courses')); return; }
    if (wishlistLoading.has(courseId)) return;
    setWishlistLoading(p => new Set(p).add(courseId));
    try {
      if (wishlist.has(courseId)) {
        await courseService.removeFromWishlist(courseId);
        setWishlist(p => { const n = new Set(p); n.delete(courseId); return n; });
        message.success(t('courseList.removedFromWishlist', 'Removed from wishlist'));
      } else {
        await courseService.addToWishlist(courseId);
        setWishlist(p => new Set(p).add(courseId));
        message.success(t('courseList.savedToWishlist', 'Saved to wishlist'));
      }
    } catch { message.error(t('courseList.wishlistError', 'Failed to update wishlist')); }
    finally { setWishlistLoading(p => { const n = new Set(p); n.delete(courseId); return n; }); }
  };

  const isWishlisted = (c: Course) => wishlist.has(c.id) || Boolean(c.isWishlisted);

  const handleCategoryChange = (id: string) => {
    setSelectedCategory(p => p === id ? null : id);
    setCurrentPage(1);
  };

  const handleLevelChange = (level: CourseLevel) => {
    setSelectedLevel(p => p === level ? null : level);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedLevel(null);
    setPriceRange([0, 500]);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const getLevelDisplay = (level: CourseLevel): string => {
    const found = LEVELS_DATA.find(l => l.value === level);
    return found ? t(found.labelKey, found.labelFallback) : level;
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedLevel ||
    priceRange[0] > 0 || priceRange[1] < 500 || sortBy !== 'newest'
  );

  const start = displayedCourses.length > 0 ? (currentPage - 1) * 9 + 1 : 0;
  const end   = (currentPage - 1) * 9 + displayedCourses.length;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <>
      {/* ── Luxury hero strip ─────────────────────────────────────────────── */}
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
              <span className="sl-script" style={{ fontSize: '1.7rem' }}>{t('courseList.catalogue', 'Catalogue')}</span>
            </div>
            <h1 className="sl-cl-hero__title" data-aos="fade-up" data-aos-delay="80" data-aos-duration="700">
              {t('courseList.allProgrammes', 'All Programmes')}
            </h1>
            <p className="sl-cl-hero__sub" data-aos="fade-up" data-aos-delay="160" data-aos-duration="700">
              {t('courseList.heroSubtitle', 'Curated by master pastry artists — discover your perfect atelier experience')}
            </p>

            {/* Search */}
            <form
              className="sl-cl-hero__search"
              onSubmit={e => { e.preventDefault(); if (currentPage !== 1) setCurrentPage(1); else fetchCourses(); }}
              data-aos="fade-up" data-aos-delay="240" data-aos-duration="700"
            >
              <i className="isax isax-search-normal-1" />
              <input
                type="text"
                placeholder={t('courseList.searchPlaceholder2', 'Search programmes, techniques, instructors…')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="sl-cl-hero__search-btn">{t('common.search', 'Search')}</button>
            </form>

            {/* Breadcrumb */}
            <nav className="sl-cl-hero__breadcrumb" data-aos="fade-up" data-aos-delay="300" data-aos-duration="700">
              <Link to={route.homeone}>{t('sharedComponents.breadcrumb.home', 'Home')}</Link>
              <span>✦</span>
              <span>{t('courseList.allProgrammes', 'All Programmes')}</span>
            </nav>
          </div>
        </div>

        <div className="sl-cinematic-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <section className="sl-cl-page">
        <div className="container">

          {/* Subscription gate — Admin and Instructor always bypass */}
          {(!isAuthenticated || (user?.role === 'STUDENT' && user?.subscriptionStatus !== 'ACTIVE')) ? (
            <SubscriptionGate type="course" ghostCount={6} isAuthenticated={isAuthenticated} />
          ) : (
            <div className="row g-4 g-lg-5 align-items-start">

              {/* Sidebar */}
              <div className="col-lg-3">
                <SidebarFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  selectedLevel={selectedLevel}
                  priceRange={priceRange}
                  onCategoryChange={handleCategoryChange}
                  onLevelChange={handleLevelChange}
                  onPriceChange={setPriceRange}
                  onClear={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>

              {/* Course area */}
              <div className="col-lg-9">

                {/* Toolbar */}
                <div className="sl-cl-toolbar" data-aos="fade-down" data-aos-duration="600">
                  <p className="sl-cl-toolbar__results">
                    {loading ? t('courseList.loadingProgrammes', 'Loading programmes…') : (
                      <>{t('courseList.showing', 'Showing')} <strong>{start}–{end}</strong> {t('courseList.of', 'of')} <strong>{totalElements}</strong> {t('courseList.programmes', 'programmes')}</>
                    )}
                  </p>
                  <div className="sl-cl-toolbar__controls">
                    {/* View toggle */}
                    <div className="sl-cl-view-toggle">
                      <button className="sl-cl-view-toggle__btn is-active" title={t('courseList.gridView', 'Grid view')}>
                        <i className="feather-grid" />
                      </button>
                      <Link to={route.courseList} className="sl-cl-view-toggle__btn" title={t('courseList.listView', 'List view')}>
                        <i className="isax isax-task" />
                      </Link>
                    </div>
                    {/* Sort */}
                    <div className="sl-cl-sort">
                      <i className="isax isax-arrow-swap-vertical" />
                      <select
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                      >
                        {SORT_OPTIONS(t).map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active filter chips */}
                {hasActiveFilters && (
                  <div className="sl-cl-chips" data-aos="fade-up" data-aos-duration="500">
                    {selectedCategory && (() => {
                      const cat = categories.find(c => c.id === selectedCategory);
                      return cat ? (
                        <span className="sl-cl-chip">
                          {cat.name}
                          <button onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}>×</button>
                        </span>
                      ) : null;
                    })()}
                    {selectedLevel && (
                      <span className="sl-cl-chip">
                        {getLevelDisplay(selectedLevel)}
                        <button onClick={() => { setSelectedLevel(null); setCurrentPage(1); }}>×</button>
                      </span>
                    )}
                    {(priceRange[0] > 0 || priceRange[1] < 500) && (
                      <span className="sl-cl-chip">
                        ${priceRange[0]}–{priceRange[1] >= 500 ? '500+' : `$${priceRange[1]}`}
                        <button onClick={() => setPriceRange([0, 500])}>×</button>
                      </span>
                    )}
                    {sortBy !== 'newest' && (
                      <span className="sl-cl-chip">
                        {SORT_OPTIONS(t).find(o => o.value === sortBy)?.label}
                        <button onClick={() => { setSortBy('newest'); setCurrentPage(1); }}>×</button>
                      </span>
                    )}
                    <button className="sl-cl-chip sl-cl-chip--clear" onClick={clearFilters}>
                      {t('courseList.clearAll', 'Clear All')}
                    </button>
                  </div>
                )}

                {/* Course grid */}
                {loading ? (
                  <div className="row g-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="col-md-6 col-xl-4">
                        <SkeletonGridCard index={i} />
                      </div>
                    ))}
                  </div>
                ) : displayedCourses.length === 0 ? (
                  <div className="sl-cl-empty" data-aos="fade-up">
                    <div className="sl-ornament">
                      <span className="sl-script" style={{ fontSize: '2rem' }}>{t('courseList.oops', 'Oops')}</span>
                    </div>
                    <i className="isax isax-search-status sl-cl-empty__icon" />
                    <h4 className="sl-cl-empty__title">{t('courseList.noProgrammesFound', 'No programmes found')}</h4>
                    <p className="sl-cl-empty__text">
                      {t('courseList.adjustFilters', 'Adjust your filters or search terms to discover our full catalogue.')}
                    </p>
                    <button className="sl-btn-gold sl-btn-magnetic" onClick={clearFilters}>
                      {t('courseList.browseAllProgrammes', 'Browse All Programmes')} <i className="isax isax-arrow-right-1" />
                    </button>
                  </div>
                ) : (
                  <div className="row g-4">
                    {displayedCourses.map((course, i) => (
                      <div key={course.id} className="col-md-6 col-xl-4" style={{ display: 'flex' }}>
                        <CourseGridCard
                          course={course}
                          inWishlist={isWishlisted(course)}
                          isLoadingWishlist={wishlistLoading.has(course.id)}
                          onWishlist={handleWishlist}
                          getLevelDisplay={getLevelDisplay}
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
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label={t('common.previous', 'Previous')}
                    >
                      <i className="fa-solid fa-chevron-left" />
                    </button>

                    {pageNumbers.map((p, i) =>
                      p === '…' ? (
                        <span key={`el-${i}`} className="sl-cl-pagination__ellipsis">…</span>
                      ) : (
                        <button
                          key={p}
                          className={`sl-cl-pagination__page${currentPage === p ? ' is-active' : ''}`}
                          onClick={() => setCurrentPage(p as number)}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      className="sl-cl-pagination__arrow"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label={t('common.next', 'Next')}
                    >
                      <i className="fa-solid fa-chevron-right" />
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CourseGrid;
