import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { App } from 'antd';
import { all_routes } from '../../router/all_routes';
import { courseService } from '../../../services/api/course.service';
import { Course, CourseCategory, CourseLevel } from '../../../services/api/types';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';
import SubscriptionGate from '../../common/SubscriptionGate';
import BadgeAvatar from '../../../components/BadgeAvatar';
import { getBadgeFromRole } from '../../../config/badges';
import { useLocalizedCourse } from '../../../hooks/useLocalizedCourse';
import { getLocalizedCategory } from '../../../hooks/useLocalizedCategory';

// ── Representative image for a category (its own image, else an on-brand cake) ──
const CAKE_POOL = Array.from({ length: 15 }, (_, i) => `cake/${i + 1}.png`);
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const categoryImage = (cat: CourseCategory): string =>
  cat.imageUrl
    ? (getFileUrl(cat.imageUrl) ?? cat.imageUrl)
    : `${process.env.PUBLIC_URL}/assets/img/${CAKE_POOL[hashStr(cat.slug || cat.id) % CAKE_POOL.length]}`;

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
  const { t, i18n } = useTranslation();
  const route   = all_routes;
  const localCourse = useLocalizedCourse(course, i18n.language);
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
          alt={localCourse.title}
          onError={e => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`; }}
        />
        <div className="sl-cl-card__thumb-overlay" />

        {/* Category ribbon */}
        <span className="sl-cl-card__badge">{course.category ? getLocalizedCategory(course.category, i18n.language).name : 'Pastry Arts'}</span>

        {/* Wishlist */}
        <button
          className={`sl-cl-card__wishlist${inWishlist ? ' active' : ''}`}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onWishlist(course.id); }}
          disabled={isLoadingWishlist}
          aria-label={inWishlist ? t('courseList.removeFromWishlist', 'Remove from wishlist') : t('courseList.addToWishlist', 'Add to wishlist')}
        >
          <i className={inWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
        </button>

        {course.requiresPurchase && (
          <span className="sl-cl-card__label sl-cl-card__label--premium">
            <i className="isax isax-crown" /> {t('courseList.premium', 'Premium')}
          </span>
        )}
        {course.isEnrolled && (
          <span className="sl-cl-card__label sl-cl-card__label--enrolled">
            <i className="fa-solid fa-check" /> {t('courseList.enrolled', 'Enrolled')}
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
            <BadgeAvatar
              avatarUrl={avatar}
              name={course.instructor?.fullName}
              badge={getBadgeFromRole('INSTRUCTOR')}
              size="sm"
            />
            <span>{course.instructor?.fullName || 'Master Instructor'}</span>
          </Link>
          <span className="sl-cl-card__level-badge">{getLevelDisplay(course.level)}</span>
        </div>

        {/* Title */}
        <h3 className="sl-cl-card__title">
          <Link to={`${route.courseDetails}/${course.slug}`}>{localCourse.title}</Link>
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
            {course.lessonsCount ?? 0} {t('common.lessons', 'lessons')}
          </span>
        </div>

        {/* Footer */}
        <div className="sl-cl-card__footer">
          <div className="sl-cl-card__price-wrap">
            {course.isEnrolled ? (
              <span className="sl-cl-card__price sl-cl-card__price--owned">
                <i className="fa-solid fa-check-circle" /> {t('courseList.owned', 'Owned')}
              </span>
            ) : !course.requiresPurchase ? (
              <span className="sl-cl-card__price sl-cl-card__price--free">{t('courseList.free', 'Free')}</span>
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
              {t('courseList.continue', 'Continue')} <i className="isax isax-arrow-right-1" />
            </Link>
          ) : (
            <Link to={`${route.courseDetails}/${course.slug}`} className="sl-btn-dark sl-btn-magnetic sl-cl-card__cta">
              {t('courseList.viewCourse', 'View Course')} <i className="isax isax-arrow-right-1" />
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
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState<Set<string>>(new Set(['categories', 'level']));
  const toggle = (s: string) =>
    setOpen(p => { const n = new Set(p); if (n.has(s)) n.delete(s); else n.add(s); return n; });

  return (
    <aside className="sl-cl-sidebar" data-aos="fade-right" data-aos-duration="700">
      {/* Sidebar header */}
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
                <span className="sl-cl-check__label">{getLocalizedCategory(cat, i18n.language).name}</span>
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

// ── Category landing (browse-by-category grid) ────────────────────────────────
interface CategoryLandingProps {
  categories: CourseCategory[];
  loading: boolean;
  onSelect: (id: string) => void;
}

const CategoryLanding: React.FC<CategoryLandingProps> = ({ categories, loading, onSelect }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="sl-cat-landing">
      <style>{`
        .sl-cat-landing__head { text-align: center; max-width: 680px; margin: 0 auto 44px; }
        .sl-cat-landing__title {
          font-family: var(--sl-font-display); color: var(--sl-burgundy);
          font-size: clamp(1.8rem, 3.6vw, 2.6rem); margin: .4rem 0 .7rem; line-height: 1.2;
        }
        .sl-cat-landing__sub { color: rgba(101,28,50,.62); font-size: 1.02rem; line-height: 1.7; margin: 0; }

        .sl-cat-card {
          width: 100%; height: 100%; text-align: ${isRtl ? 'right' : 'left'};
          background: #fff; border: 1px solid rgba(197,145,44,.18); border-radius: 18px;
          overflow: hidden; cursor: pointer; display: flex; flex-direction: column;
          box-shadow: 0 12px 34px rgba(101,28,50,.07);
          transition: transform .4s cubic-bezier(.25,.46,.45,.94), box-shadow .4s, border-color .4s;
        }
        .sl-cat-card:hover { transform: translateY(-8px); box-shadow: 0 26px 60px rgba(101,28,50,.16); border-color: var(--sl-gold); }
        .sl-cat-card:focus-visible { outline: 2px solid var(--sl-gold); outline-offset: 3px; }
        .sl-cat-card__media { position: relative; aspect-ratio: 16 / 11; overflow: hidden; }
        .sl-cat-card__media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .9s cubic-bezier(.25,.46,.45,.94); }
        .sl-cat-card:hover .sl-cat-card__media img { transform: scale(1.08); }
        .sl-cat-card__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(58,12,24,.58), rgba(58,12,24,.06) 55%, transparent); }
        .sl-cat-card__corner {
          position: absolute; top: .8rem; ${isRtl ? 'left' : 'right'}: .8rem; width: 1.5rem; height: 1.5rem;
          border-top: 1px solid var(--sl-gold); border-${isRtl ? 'left' : 'right'}: 1px solid var(--sl-gold); opacity: .85;
        }
        .sl-cat-card__count {
          position: absolute; bottom: .85rem; ${isRtl ? 'right' : 'left'}: .85rem;
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.93); color: var(--sl-burgundy);
          font-family: var(--sl-font-body); font-size: .7rem; font-weight: 700; letter-spacing: .03em;
          padding: .32rem .72rem; border-radius: 999px;
        }
        .sl-cat-card__count i { color: var(--sl-gold); font-size: .82rem; }
        .sl-cat-card__body { padding: 1.2rem 1.3rem 1.35rem; display: flex; flex-direction: column; flex: 1; }
        .sl-cat-card__name { font-family: var(--sl-font-display); font-weight: 700; color: var(--sl-burgundy); font-size: 1.2rem; margin: 0 0 .45rem; }
        .sl-cat-card__desc {
          color: rgba(101,28,50,.6); font-size: .85rem; line-height: 1.6; margin: 0 0 1rem; flex: 1;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .sl-cat-card__cta { display: inline-flex; align-items: center; gap: 7px; color: var(--sl-gold); font-weight: 700; font-size: .82rem; letter-spacing: .03em; margin-top: auto; transition: gap .25s ease; }
        .sl-cat-card:hover .sl-cat-card__cta { gap: 11px; }
        .sl-cat-skeleton { height: 318px; border-radius: 18px; background: linear-gradient(110deg, #efe9e0 30%, #f7f3ec 50%, #efe9e0 70%); background-size: 200% 100%; animation: sl-cat-shim 1.4s linear infinite; }
        @keyframes sl-cat-shim { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>

      <div className="sl-cat-landing__head" data-aos="fade-up" data-aos-duration="700">
        <div className="sl-ornament justify-content-center">
          <span className="sl-script" style={{ fontSize: '1.7rem' }}>{t('courseList.discover', 'Discover')}</span>
        </div>
        <h2 className="sl-cat-landing__title">{t('courseList.browseByCategory', 'Browse by Category')}</h2>
        <p className="sl-cat-landing__sub">{t('courseList.browseByCategorySub', 'Choose the category that inspires you, and explore every programme inside it.')}</p>
      </div>

      {loading && categories.length === 0 ? (
        <div className="row g-4">
          {[...Array(6)].map((_, i) => (
            <div className="col-lg-4 col-md-6" key={i}><div className="sl-cat-skeleton" style={{ animationDelay: `${i * 0.08}s` }} /></div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="sl-cl-empty" data-aos="fade-up">
          <i className="isax isax-category sl-cl-empty__icon" />
          <h4 className="sl-cl-empty__title">{t('courseList.noCategoriesAvailable', 'No categories available')}</h4>
        </div>
      ) : (
        <div className="row g-4">
          {categories.map((cat, i) => (
            <div className="col-lg-4 col-md-6" key={cat.id}>
              <div
                className="sl-cat-card"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(cat.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(cat.id); } }}
                aria-label={getLocalizedCategory(cat, i18n.language).name}
                data-aos="fade-up"
                data-aos-delay={String((i % 3) * 70)}
                data-aos-duration="700"
              >
                <div className="sl-cat-card__media">
                  <img
                    src={categoryImage(cat)}
                    alt={getLocalizedCategory(cat, i18n.language).name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/cake/1.png`; }}
                  />
                  <span className="sl-cat-card__overlay" />
                  <span className="sl-cat-card__corner" aria-hidden="true" />
                  <span className="sl-cat-card__count">
                    <i className="isax isax-book-1" /> {cat.coursesCount ?? 0} {t('courseList.programmes', 'programmes')}
                  </span>
                </div>
                <div className="sl-cat-card__body">
                  <h3 className="sl-cat-card__name">{getLocalizedCategory(cat, i18n.language).name}</h3>
                  {cat.description && <p className="sl-cat-card__desc">{cat.description}</p>}
                  <span className="sl-cat-card__cta">
                    {t('courseList.exploreCategory', 'Explore')}
                    <i className={`isax ${isRtl ? 'isax-arrow-left-2' : 'isax-arrow-right-1'}`} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const CourseList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const route = all_routes;
  const pageRef = useRef<HTMLElement>(null);
  const { message } = App.useApp();

  /* server data */
  const [courses,       setCourses]       = useState<Course[]>([]);
  const [categories,    setCategories]    = useState<CourseCategory[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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

  const displayedCourses = useMemo(() => courses, [courses]);

  const fetchCategories = async () => {
    try {
      const res = await courseService.getCategories();
      setCategories(Array.isArray(res) ? res : ((res as any).content || (res as any).data || []));
    } catch {}
    finally { setCategoriesLoading(false); }
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

  // From the category landing → open that category's programmes.
  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    setCurrentPage(1);
    requestAnimationFrame(() => pageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

  const getLevelDisplay = (level: CourseLevel): string => {
    const found = LEVELS_DATA.find(l => l.value === level);
    return found ? t(found.labelKey, found.labelFallback) : level;
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedLevel || sortBy !== 'newest'
  );

  // Show the browse-by-category grid until the visitor picks a category or searches.
  const showCategoryLanding = !selectedCategory && !selectedLevel && !searchQuery;

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
              <span className="sl-script" style={{ fontSize: '1.7rem' }}>{t('courseList.catalogue', 'Catalogue')}</span>
            </div>

            <h1
              className="sl-cl-hero__title"
              data-aos="fade-up"
              data-aos-delay="80"
              data-aos-duration="700"
            >
              {t('courseList.allProgrammes', 'All Programmes')}
            </h1>

            <p
              className="sl-cl-hero__sub"
              data-aos="fade-up"
              data-aos-delay="160"
              data-aos-duration="700"
            >
              {t('courseList.heroSubtitle', 'Curated by master pastry artists — discover your perfect atelier experience')}
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
                placeholder={t('courseList.searchPlaceholder2', 'Search programmes, techniques, instructors…')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="sl-cl-hero__search-btn">
                {t('common.search', 'Search')}
              </button>
            </form>

            {/* Breadcrumb */}
            <nav
              className="sl-cl-hero__breadcrumb"
              data-aos="fade-up"
              data-aos-delay="300"
              data-aos-duration="700"
            >
              <Link to={route.homeone}>{t('sharedComponents.breadcrumb.home', 'Home')}</Link>
              <span>✦</span>
              <span>{t('courseList.allProgrammes', 'All Programmes')}</span>
            </nav>
          </div>
        </div>

        <div className="sl-cinematic-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      {/* ── Back-to-categories button ── */}
      <style>{`
        .sl-cat-back {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fff; border: 1px solid rgba(197,145,44,.35); color: var(--sl-burgundy);
          font-family: var(--sl-font-body); font-weight: 600; font-size: .8rem; letter-spacing: .04em;
          padding: .55rem 1.1rem; border-radius: 999px; cursor: pointer;
          margin-bottom: 1.6rem; transition: background .25s ease, border-color .25s ease, gap .25s ease;
        }
        .sl-cat-back:hover { background: var(--sl-gold); border-color: var(--sl-gold); color: #2A0E18; gap: 12px; }
        .sl-cat-back i { font-size: .95rem; }
      `}</style>

      {/* ── Main content ── */}
      <section className="sl-cl-page" ref={pageRef}>
        <div className="container">

          {showCategoryLanding ? (
            <CategoryLanding
              categories={categories}
              loading={categoriesLoading}
              onSelect={handleSelectCategory}
            />
          ) : (
          <>
          {/* Back to all categories */}
          <button type="button" className="sl-cat-back" onClick={clearFilters}>
            <i className={`isax ${isRtl ? 'isax-arrow-right-1' : 'isax-arrow-left-2'}`} />
            {t('courseList.allCategories', 'All Categories')}
          </button>

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
                  {loading ? t('courseList.loadingProgrammes', 'Loading programmes…') : (
                    <>{t('courseList.showing', 'Showing')} <strong>{start}–{end}</strong> {t('courseList.of', 'of')} <strong>{totalElements}</strong> {t('courseList.programmes', 'programmes')}</>
                  )}
                </p>
                <div className="sl-cl-toolbar__controls">
                  <div className="sl-cl-view-toggle">
                    <Link to={route.courseGrid} className="sl-cl-view-toggle__btn" title={t('courseList.gridView', 'Grid view')}>
                      <i className="feather-grid" />
                    </Link>
                    <button className="sl-cl-view-toggle__btn is-active" title={t('courseList.listView', 'List view')}>
                      <i className="isax isax-task" />
                    </button>
                  </div>
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
                        {getLocalizedCategory(cat, i18n.language).name}
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
                      {SORT_OPTIONS(t).find(o => o.value === sortBy)?.label}
                      <button onClick={() => { setSortBy('newest'); setCurrentPage(1); }}>×</button>
                    </span>
                  )}
                  <button className="sl-cl-chip sl-cl-chip--clear" onClick={clearFilters}>
                    {t('courseList.clearAll', 'Clear All')}
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
          )} {/* end isAuthenticated gate */}
          </>
          )} {/* end category landing */}
        </div>
      </section>
    </>
  );
};

export default CourseList;
