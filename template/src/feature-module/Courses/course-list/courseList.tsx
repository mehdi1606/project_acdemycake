import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { App } from 'antd';
import { all_routes } from '../../router/all_routes';
import { courseService } from '../../../services/api/course.service';
import { Course, CourseCategory, CourseLevel } from '../../../services/api/types';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';
import SubscriptionGate from '../../common/SubscriptionGate';

const SORT_OPTIONS = [
  { label: 'Newly Published',   value: 'newest' },
  { label: 'Most Popular',      value: 'popular' },
  { label: 'Top Rated',         value: 'rating' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
];

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: 'BEGINNER',     label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED',     label: 'Advanced' },
  { value: 'ALL_LEVELS',   label: 'All Levels' },
];

// ── Stars renderer ────────────────────────────────────────────────────────────
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className="fa-solid fa-star"
        style={{ color: i < Math.floor(rating) ? 'var(--sl-gold)' : 'rgba(197,145,44,0.22)', fontSize: '0.65rem' }}
      />
    ))}
  </>
);

// ── 3D-tilt horizontal course card ───────────────────────────────────────────
interface CourseListCardProps {
  course: Course;
  inWishlist: boolean;
  isLoadingWishlist: boolean;
  onWishlist: (id: string) => void;
  getLevelDisplay: (level: CourseLevel) => string;
  index: number;
}

const CourseListCard: React.FC<CourseListCardProps> = ({
  course, inWishlist, isLoadingWishlist, onWishlist, getLevelDisplay, index,
}) => {
  const route   = all_routes;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transition = 'transform 0.12s linear';
    el.style.transform  = `perspective(1200px) rotateX(${-y * 3}deg) rotateY(${x * 5}deg) scale(1.01)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)';
    el.style.transform  = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  const thumb  = course.thumbnailUrl
    ? (getFileUrl(course.thumbnailUrl) ?? course.thumbnailUrl)
    : `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`;

  const avatar = course.instructor?.avatarUrl
    ? (getFileUrl(course.instructor.avatarUrl) ?? course.instructor.avatarUrl)
    : `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`;

  return (
    <div
      className="sl-cl-card sl-tilt-wrap"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-aos="fade-up"
      data-aos-delay={String(index * 55)}
      data-aos-duration="700"
    >
      {/* Thumb */}
      <Link to={`${route.courseDetails}/${course.slug}`} className="sl-cl-card__thumb">
        <img
          src={thumb}
          alt={course.title}
          onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`; }}
        />
        <div className="sl-cl-card__thumb-overlay" />

        {/* Category ribbon */}
        <span className="sl-cl-card__badge">{course.category?.name || 'Pastry Arts'}</span>

        {/* Wishlist */}
        <button
          className={`sl-cl-card__wishlist${inWishlist ? ' active' : ''}`}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onWishlist(course.id); }}
          disabled={isLoadingWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={inWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
        </button>

        {course.requiresPurchase && (
          <span className="sl-cl-card__label sl-cl-card__label--premium">
            <i className="isax isax-crown" /> Premium
          </span>
        )}
        {course.isEnrolled && (
          <span className="sl-cl-card__label sl-cl-card__label--enrolled">
            <i className="fa-solid fa-check" /> Enrolled
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="sl-cl-card__body">
        {/* Instructor + level */}
        <div className="sl-cl-card__meta">
          <Link
            to={`${route.instructorDetails}/${course.instructor?.id}`}
            className="sl-cl-card__instructor"
          >
            <img
              src={avatar}
              alt={course.instructor?.fullName}
              onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/user/user-01.jpg`; }}
            />
            <span>{course.instructor?.fullName || 'Master Instructor'}</span>
          </Link>
          <span className="sl-cl-card__level-badge">{getLevelDisplay(course.level)}</span>
        </div>

        {/* Title */}
        <h3 className="sl-cl-card__title">
          <Link to={`${route.courseDetails}/${course.slug}`}>{course.title}</Link>
        </h3>

        {/* Description */}
        {course.shortDescription && (
          <p className="sl-cl-card__desc">{course.shortDescription}</p>
        )}

        {/* Gold divider */}
        <div className="sl-gold-bar" style={{ margin: '1rem 0' }} />

        {/* Stats row */}
        <div className="sl-cl-card__stats">
          <span className="sl-cl-card__rating">
            <Stars rating={course.ratingAverage ?? 0} />
            <span className="sl-cl-card__rating-value">{(course.ratingAverage ?? 0).toFixed(1)}</span>
            <span className="sl-cl-card__rating-count">({course.ratingCount ?? 0})</span>
          </span>
          <span className="sl-cl-card__sep">✦</span>
          <span className="sl-cl-card__lessons">
            <i className="isax isax-video-play" />
            {course.lessonsCount ?? 0} lessons
          </span>
        </div>

        {/* Footer */}
        <div className="sl-cl-card__footer">
          <div className="sl-cl-card__price-wrap">
            {course.isEnrolled ? (
              <span className="sl-cl-card__price sl-cl-card__price--owned">
                <i className="fa-solid fa-check-circle" /> Owned
              </span>
            ) : !course.requiresPurchase ? (
              <span className="sl-cl-card__price sl-cl-card__price--free">Free</span>
            ) : (
              <>
                <span className="sl-cl-card__price sl-cl-card__price--current">${course.price ?? 0}</span>
                {course.originalPrice && course.originalPrice > (course.price ?? 0) && (
                  <del className="sl-cl-card__price sl-cl-card__price--original">${course.originalPrice}</del>
                )}
              </>
            )}
          </div>

          {course.isEnrolled ? (
            <Link to={`${route.courseWatch}/${course.slug}`} className="sl-btn-gold sl-btn-magnetic sl-cl-card__cta">
              Continue <i className="isax isax-arrow-right-1" />
            </Link>
          ) : (
            <Link to={`${route.courseDetails}/${course.slug}`} className="sl-btn-dark sl-btn-magnetic sl-cl-card__cta">
              View Course <i className="isax isax-arrow-right-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Luxury skeleton loader ────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <div className="sl-cl-skeleton" style={{ animationDelay: `${index * 0.08}s` }}>
    <div className="sl-cl-skeleton__thumb" />
    <div className="sl-cl-skeleton__body">
      <div className="sl-cl-skeleton__line" style={{ width: '32%', height: 11, marginBottom: 14 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '88%', height: 20, marginBottom: 8 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '72%', height: 14, marginBottom: 20 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '52%', height: 11, marginBottom: 28 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="sl-cl-skeleton__line" style={{ width: 64, height: 22 }} />
        <div className="sl-cl-skeleton__line" style={{ width: 110, height: 38 }} />
      </div>
    </div>
  </div>
);

// ── Sidebar filter ────────────────────────────────────────────────────────────
interface SidebarFilterProps {
  categories: CourseCategory[];
  selectedCategory: string | null;
  selectedLevel: CourseLevel | null;
  onCategoryChange: (id: string) => void;
  onLevelChange: (l: CourseLevel) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({
  categories, selectedCategory, selectedLevel,
  onCategoryChange, onLevelChange, onClear, hasActiveFilters,
}) => {
  const [open, setOpen] = useState<Set<string>>(new Set(['categories', 'level']));
  const toggle = (s: string) =>
    setOpen(p => { const n = new Set(p); if (n.has(s)) n.delete(s); else n.add(s); return n; });

  return (
    <aside className="sl-cl-sidebar" data-aos="fade-right" data-aos-duration="700">
      {/* Sidebar header */}
      <div className="sl-cl-sidebar__header">
        <div className="sl-ornament sl-ornament--left" style={{ marginBottom: '0.5rem' }}>
          <span className="sl-script" style={{ fontSize: '1.3rem' }}>Refine</span>
        </div>
        <div className="sl-cl-sidebar__header-row">
          <h5 className="sl-cl-sidebar__title">
            <i className="isax isax-filter" /> Filters
          </h5>
          {hasActiveFilters && (
            <button className="sl-cl-sidebar__clear" onClick={onClear}>Clear All</button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className={`sl-cl-filter-group${open.has('categories') ? ' is-open' : ''}`}>
        <button className="sl-cl-filter-group__head" onClick={() => toggle('categories')}>
          <span>Categories</span>
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
              <p className="sl-cl-filter-empty">No categories available</p>
            )}
          </div>
        )}
      </div>

      {/* Level */}
      <div className={`sl-cl-filter-group${open.has('level') ? ' is-open' : ''}`}>
        <button className="sl-cl-filter-group__head" onClick={() => toggle('level')}>
          <span>Skill Level</span>
          <i className={`fa-solid fa-chevron-${open.has('level') ? 'up' : 'down'}`} />
        </button>
        {open.has('level') && (
          <div className="sl-cl-filter-group__body">
            {LEVELS.map(({ value, label }) => (
              <label key={value} className="sl-cl-check">
                <input
                  type="checkbox"
                  checked={selectedLevel === value}
                  onChange={() => onLevelChange(value)}
                />
                <span className="sl-cl-check__box" />
                <span className="sl-cl-check__label">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const CourseList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const route = all_routes;
  const { message } = App.useApp();

  /* server data */
  const [courses,       setCourses]       = useState<Course[]>([]);
  const [categories,    setCategories]    = useState<CourseCategory[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);

  /* wishlist */
  const [wishlist,        setWishlist]        = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading] = useState<Set<string>>(new Set());

  /* filters */
  const [currentPage,      setCurrentPage]      = useState(parseInt(searchParams.get('page') || '1'));
  const [searchQuery,      setSearchQuery]       = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory]  = useState<string | null>(searchParams.get('category') || null);
  const [selectedLevel,    setSelectedLevel]     = useState<CourseLevel | null>(
    (searchParams.get('level') as CourseLevel) || null
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

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

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchCourses(); }, [currentPage, selectedCategory, selectedLevel, sortBy]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (currentPage === 1) fetchCourses(); else setCurrentPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const displayedCourses = useMemo(() => courses, [courses]);

  const fetchCategories = async () => {
    try {
      const res = await courseService.getCategories();
      setCategories(Array.isArray(res) ? res : ((res as any).content || (res as any).data || []));
    } catch {}
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage - 1, size: 9, sortBy, courseType: 'PLAN' };
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
    if (!isAuthenticated) { message.warning('Please login to save courses'); return; }
    if (wishlistLoading.has(courseId)) return;
    setWishlistLoading(p => new Set(p).add(courseId));
    try {
      if (wishlist.has(courseId)) {
        await courseService.removeFromWishlist(courseId);
        setWishlist(p => { const n = new Set(p); n.delete(courseId); return n; });
        message.success('Removed from wishlist');
      } else {
        await courseService.addToWishlist(courseId);
        setWishlist(p => new Set(p).add(courseId));
        message.success('Saved to wishlist');
      }
    } catch { message.error('Failed to update wishlist'); }
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
    setSortBy('newest');
    setCurrentPage(1);
  };

  const getLevelDisplay = (level: CourseLevel): string =>
    ({ BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced', ALL_LEVELS: 'All Levels' }[level] ?? level);

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedLevel || sortBy !== 'newest'
  );

  const start = displayedCourses.length > 0 ? (currentPage - 1) * 9 + 1 : 0;
  const end   = (currentPage - 1) * 9 + displayedCourses.length;

  /* Pagination page array with ellipsis */
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
      acc.push(p);
      return acc;
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
              <span className="sl-script" style={{ fontSize: '1.7rem' }}>Catalogue</span>
            </div>

            <h1
              className="sl-cl-hero__title"
              data-aos="fade-up"
              data-aos-delay="80"
              data-aos-duration="700"
            >
              All Programmes
            </h1>

            <p
              className="sl-cl-hero__sub"
              data-aos="fade-up"
              data-aos-delay="160"
              data-aos-duration="700"
            >
              Curated by master pastry artists — discover your perfect atelier experience
            </p>

            {/* Search */}
            <form
              className="sl-cl-hero__search"
              onSubmit={e => { e.preventDefault(); if (currentPage !== 1) setCurrentPage(1); else fetchCourses(); }}
              data-aos="fade-up"
              data-aos-delay="240"
              data-aos-duration="700"
            >
              <i className="isax isax-search-normal-1" />
              <input
                type="text"
                placeholder="Search programmes, techniques, instructors…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="sl-cl-hero__search-btn">
                Search
              </button>
            </form>

            {/* Breadcrumb */}
            <nav
              className="sl-cl-hero__breadcrumb"
              data-aos="fade-up"
              data-aos-delay="300"
              data-aos-duration="700"
            >
              <Link to={route.homeone}>Home</Link>
              <span>✦</span>
              <span>All Programmes</span>
            </nav>
          </div>
        </div>

        <div className="sl-cinematic-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      {/* ── Main content ── */}
      <section className="sl-cl-page">
        <div className="container">

          {/* Gate for guests or students without an active subscription.
              Admin and Instructor always bypass — they can see all courses. */}
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
                onCategoryChange={handleCategoryChange}
                onLevelChange={handleLevelChange}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            {/* Course area */}
            <div className="col-lg-9">

              {/* Toolbar */}
              <div className="sl-cl-toolbar" data-aos="fade-down" data-aos-duration="600">
                <p className="sl-cl-toolbar__results">
                  {loading ? 'Loading programmes…' : (
                    <>Showing <strong>{start}–{end}</strong> of <strong>{totalElements}</strong> programmes</>
                  )}
                </p>
                <div className="sl-cl-toolbar__controls">
                  <div className="sl-cl-view-toggle">
                    <Link to={route.courseGrid} className="sl-cl-view-toggle__btn" title="Grid view">
                      <i className="feather-grid" />
                    </Link>
                    <button className="sl-cl-view-toggle__btn is-active" title="List view">
                      <i className="isax isax-task" />
                    </button>
                  </div>
                  <div className="sl-cl-sort">
                    <i className="isax isax-arrow-swap-vertical" />
                    <select
                      value={sortBy}
                      onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                    >
                      {SORT_OPTIONS.map(o => (
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
                  {sortBy !== 'newest' && (
                    <span className="sl-cl-chip">
                      {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                      <button onClick={() => { setSortBy('newest'); setCurrentPage(1); }}>×</button>
                    </span>
                  )}
                  <button className="sl-cl-chip sl-cl-chip--clear" onClick={clearFilters}>
                    Clear All
                  </button>
                </div>
              )}

              {/* Course items */}
              {loading ? (
                <div className="sl-cl-list">
                  {[...Array(5)].map((_, i) => <SkeletonCard key={i} index={i} />)}
                </div>
              ) : displayedCourses.length === 0 ? (
                <div className="sl-cl-empty" data-aos="fade-up">
                  <div className="sl-ornament">
                    <span className="sl-script" style={{ fontSize: '2rem' }}>Oops</span>
                  </div>
                  <i className="isax isax-search-status sl-cl-empty__icon" />
                  <h4 className="sl-cl-empty__title">No programmes found</h4>
                  <p className="sl-cl-empty__text">
                    Adjust your filters or search terms to discover our full catalogue.
                  </p>
                  <button className="sl-btn-gold sl-btn-magnetic" onClick={clearFilters}>
                    Browse All Programmes <i className="isax isax-arrow-right-1" />
                  </button>
                </div>
              ) : (
                <div className="sl-cl-list">
                  {displayedCourses.map((course, i) => (
                    <CourseListCard
                      key={course.id}
                      course={course}
                      inWishlist={isWishlisted(course)}
                      isLoadingWishlist={wishlistLoading.has(course.id)}
                      onWishlist={handleWishlist}
                      getLevelDisplay={getLevelDisplay}
                      index={i}
                    />
                  ))}
                </div>
              )}

              {/* Luxury pagination */}
              {totalPages > 1 && (
                <div className="sl-cl-pagination" data-aos="fade-up" data-aos-duration="600">
                  <button
                    className="sl-cl-pagination__arrow"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
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
                    aria-label="Next"
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </div>
              )}

            </div>
          </div>
          )} {/* end isAuthenticated gate */}
        </div>
      </section>
    </>
  );
};

export default CourseList;
