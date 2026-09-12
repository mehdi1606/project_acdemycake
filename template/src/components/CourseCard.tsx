import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { Course } from '../services/api/types';
import { all_routes } from '../feature-module/router/all_routes';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { addToWishlist, removeFromWishlist } from '../core/redux/courseSlice';
import { getFileUrl } from '../environment';
import BadgeAvatar from './BadgeAvatar';
import { getBadgeFromRole } from '../config/badges';
import { useLocalizedCourse } from '../hooks/useLocalizedCourse';
import { getLocalizedCategory } from '../hooks/useLocalizedCategory';

/*
 * The one course card used everywhere (home, category, masterclasses, instructor
 * profile), so the same course never looks different from page to page.
 *
 *   PLAN      – subscription course, burgundy accent, "Included in Premium"
 *   RECORDED  – same layout as a plan course + gold "Masterclass" badge + MAD price
 *   LIVE      – bespoke session booked on WhatsApp: green accent, seats left, Reserve
 */

// Absolute on purpose: a relative "assets/..." path breaks on nested routes such as
// /pages/instructor-details/:id, which is what left cards with a blank image.
const FALLBACK_THUMB = `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`;

const BURG = '#651C32';
const BURG_D = '#4E1420';
const GOLD = '#C5912C';
const GOLD_L = '#DEBB6B';
const WA = '#1DA851';
const WA_L = '#25D366';

export type CourseKind = 'PLAN' | 'RECORDED' | 'LIVE';

export const getCourseKind = (course: Course): CourseKind => {
  if (course.courseType !== 'MASTERCLASS') return 'PLAN';
  return course.masterclassFormat === 'LIVE' ? 'LIVE' : 'RECORDED';
};

interface CourseCardProps {
  course: Course;
  /** Kept for backward compatibility; every layout renders this same card. */
  layout?: 'grid' | 'list';
  inCart?: boolean;
  onCart?: (course: Course) => void;
  /** When provided, enables the AOS entrance animation with a staggered delay. */
  index?: number;
  /** Optional page-owned wishlist state; when omitted the card uses the Redux wishlist. */
  inWishlist?: boolean;
  isLoadingWishlist?: boolean;
  onWishlist?: (courseId: string) => void;
  /** Optional translated level label (listing pages pass their own formatter). */
  levelLabel?: (level: Course['level']) => string;
}

const Stars: React.FC<{ rating: number; color: string }> = ({ rating, color }) => (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className="fa-solid fa-star"
        style={{ color: i < Math.floor(rating) ? color : 'rgba(197,145,44,0.2)', fontSize: '0.65rem' }}
      />
    ))}
  </>
);

const pill: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
};

const CourseCard: React.FC<CourseCardProps> = ({
  course, inCart = false, onCart, index, inWishlist, isLoadingWishlist = false, onWishlist, levelLabel,
}) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const cardRef = useRef<HTMLDivElement>(null);
  const localCourse = useLocalizedCourse(course, i18n.language);

  const route = all_routes;
  const kind = getCourseKind(course);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';
  const detailsHref = `${route.courseDetails}/${course.slug}`;
  const currency = course.currency || 'MAD';

  const accent = kind === 'LIVE' ? WA : kind === 'RECORDED' ? GOLD : BURG;
  const accentTint =
    kind === 'LIVE' ? 'rgba(37,211,102,0.12)' : kind === 'RECORDED' ? 'rgba(197,145,44,0.1)' : 'rgba(101,28,50,0.07)';
  const borderIdle =
    kind === 'LIVE' ? 'rgba(37,211,102,0.35)' : 'rgba(197,145,44,0.15)';
  const shadowIdle =
    kind === 'LIVE' ? '0 4px 20px rgba(29,168,81,0.10)' : '0 4px 20px rgba(78,20,32,0.07)';
  const shadowHover =
    kind === 'LIVE' ? '0 12px 40px rgba(29,168,81,0.20)' : '0 12px 40px rgba(78,20,32,0.14)';

  const seatCap = course.maxStudents;
  const seatsLeft =
    kind === 'LIVE' && seatCap && seatCap > 0 ? Math.max(0, seatCap - (course.enrolledCount ?? 0)) : null;
  const hasDiscount =
    kind !== 'LIVE' && !!course.originalPrice && course.originalPrice > (course.price ?? 0);
  const discountPct = hasDiscount ? Math.round((1 - (course.price ?? 0) / course.originalPrice!) * 100) : 0;
  const isIncluded = kind === 'PLAN' && !course.requiresPurchase;
  const isWishlisted = inWishlist ?? !!course.isWishlisted;

  const thumb = getFileUrl(course.thumbnailUrl) ?? FALLBACK_THUMB;
  const avatar = getFileUrl(course.instructor?.avatarUrl) ?? null;

  // ── Interactions ───────────────────────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transition = 'transform 0.1s linear';
    el.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) scale(1.025)`;
  };
  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.3s ease';
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    el.style.boxShadow = shadowIdle;
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) {
      onWishlist(course.id);
      return;
    }
    if (!isAuthenticated) {
      message.warning(t('courseTile.loginForWishlist', 'Please log in to use your wishlist'));
      return;
    }
    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(course.id)).unwrap();
        message.success(t('courseTile.wishlistRemoved', 'Removed from wishlist'));
      } else {
        await dispatch(addToWishlist(course.id)).unwrap();
        message.success(t('courseTile.wishlistAdded', 'Added to wishlist'));
      }
    } catch {
      message.error(t('courseTile.wishlistFailed', 'Failed to update wishlist'));
    }
  };

  const aos =
    index !== undefined
      ? { 'data-aos': 'fade-up', 'data-aos-delay': String(index * 60), 'data-aos-duration': '700' }
      : {};

  // ── Top-left badge ─────────────────────────────────────────────────────────
  const badge =
    kind === 'LIVE' ? (
      <span style={{
        background: `linear-gradient(135deg, ${WA} 0%, ${WA_L} 100%)`, color: '#fff',
        boxShadow: '0 2px 8px rgba(29,168,81,0.4)',
      }} className="sl-tile-badge">
        <i className="fa-brands fa-whatsapp" style={{ fontSize: 11 }} /> {t('courseTile.live', 'Live · Bespoke')}
      </span>
    ) : kind === 'RECORDED' ? (
      <span style={{
        background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`, color: BURG_D,
        boxShadow: '0 2px 8px rgba(197,145,44,0.4)',
      }} className="sl-tile-badge">
        <i className="isax isax-crown" style={{ fontSize: 10 }} /> {t('courseTile.masterclass', 'Masterclass')}
      </span>
    ) : (
      <span style={{ background: 'rgba(101,28,50,0.92)', color: '#F5DADF' }} className="sl-tile-badge">
        {course.category
          ? getLocalizedCategory(course.category, i18n.language).name
          : t('courseTile.course', 'Course')}
      </span>
    );

  // ── Price / status ─────────────────────────────────────────────────────────
  let priceBlock: React.ReactNode;
  if (course.isEnrolled && kind !== 'LIVE') {
    priceBlock = (
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A7F4B', display: 'flex', alignItems: 'center', gap: 4 }}>
        <i className="fa-solid fa-check-circle" /> {t('courseTile.enrolled', 'Enrolled')}
      </span>
    );
  } else if (kind === 'LIVE') {
    priceBlock = (
      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: seatsLeft === 0 ? '#DC2626' : BURG_D, display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="fa-solid fa-users" style={{ fontSize: 11, color: WA }} />
        {seatsLeft !== null
          ? t('courseDetails.placesLeft', '{{count}} places left', { count: seatsLeft })
          : t('courseDetails.limitedPlaces', 'Limited places')}
      </span>
    );
  } else if (isStaff && kind === 'RECORDED') {
    priceBlock = (
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: BURG, display: 'flex', alignItems: 'center', gap: 4 }}>
        <i className="fa-solid fa-shield-halved" style={{ fontSize: 10 }} /> {t('courseTile.freeAccess', 'Free access')}
      </span>
    );
  } else if (isIncluded) {
    priceBlock = (
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: BURG, display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="isax isax-crown-1" style={{ fontSize: 12, color: GOLD }} />
        {t('courseTile.includedInPremium', 'Included in Premium')}
      </span>
    );
  } else {
    priceBlock = (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', fontWeight: 800, color: BURG_D }}>
          {course.price ?? 0} {currency}
        </span>
        {hasDiscount && (
          <del style={{ fontSize: '0.75rem', color: 'rgba(58,30,32,0.35)' }}>
            {course.originalPrice} {currency}
          </del>
        )}
      </div>
    );
  }

  // ── Call to action ─────────────────────────────────────────────────────────
  let cta: React.ReactNode;
  if (kind === 'LIVE') {
    cta = (
      <Link
        to={detailsHref}
        style={{ ...pill, background: `linear-gradient(135deg, ${WA} 0%, ${WA_L} 100%)`, color: '#fff', boxShadow: '0 2px 8px rgba(29,168,81,0.3)' }}
      >
        <i className="fa-brands fa-whatsapp" style={{ fontSize: 13 }} /> {t('courseTile.reserve', 'Reserve')}
      </Link>
    );
  } else if (course.isEnrolled) {
    cta = (
      <Link
        to={`${route.courseWatch}/${course.slug}`}
        style={{ ...pill, background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`, color: BURG_D, boxShadow: '0 2px 8px rgba(197,145,44,0.3)' }}
      >
        {t('courseTile.continue', 'Continue')} <i className="isax isax-arrow-right-1" style={{ fontSize: 11 }} />
      </Link>
    );
  } else if (isStaff) {
    cta = (
      <Link
        to={detailsHref}
        style={{ ...pill, background: `linear-gradient(135deg, ${BURG} 0%, #8B2335 100%)`, color: '#fff', boxShadow: '0 2px 8px rgba(101,28,50,0.25)' }}
      >
        <i className="fa-solid fa-shield-halved" style={{ fontSize: 11 }} /> {t('courseTile.access', 'Access')}
      </Link>
    );
  } else if (kind === 'RECORDED' && onCart) {
    cta = inCart ? (
      <Link
        to={route.courseCart}
        style={{ ...pill, background: 'rgba(101,28,50,0.06)', color: BURG, border: '1px solid rgba(101,28,50,0.2)' }}
      >
        {t('courseTile.inCart', 'In cart')} <i className="isax isax-bag-tick" style={{ fontSize: 11 }} />
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => onCart(course)}
        style={{ ...pill, background: `linear-gradient(135deg, ${BURG_D} 0%, #6B1D2A 100%)`, color: '#fff', boxShadow: '0 2px 8px rgba(78,20,32,0.2)' }}
      >
        <i className="isax isax-bag-add" style={{ fontSize: 13 }} /> {t('courseTile.addToCart', 'Add to cart')}
      </button>
    );
  } else {
    cta = (
      <Link
        to={detailsHref}
        style={{ ...pill, background: `linear-gradient(135deg, ${BURG_D} 0%, #6B1D2A 100%)`, color: '#fff', boxShadow: '0 2px 8px rgba(78,20,32,0.2)' }}
      >
        {t('courseTile.view', 'View')} <i className="isax isax-arrow-right-1" style={{ fontSize: 11 }} />
      </Link>
    );
  }

  return (
    <div
      ref={cardRef}
      {...aos}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = shadowHover; }}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${borderIdle}`,
        boxShadow: shadowIdle,
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <style>{`
        .sl-tile-badge {
          font-size: 0.58rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;
          max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>

      {/* Thumbnail */}
      <Link to={detailsHref} style={{ position: 'relative', display: 'block', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={thumb}
          alt={localCourse.title}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallback) return; // never loop if the fallback itself fails
            img.dataset.fallback = '1';
            img.src = FALLBACK_THUMB;
          }}
          style={{
            width: '100%', height: 200, objectFit: 'cover', display: 'block', background: '#F2EFE8',
            transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
          onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.07)'; }}
          onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
        />

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: kind === 'LIVE'
            ? 'linear-gradient(to top, rgba(20,80,45,0.55) 0%, transparent 55%)'
            : 'linear-gradient(to top, rgba(78,20,32,0.55) 0%, transparent 50%)',
        }} />

        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
        }}>
          {badge}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasDiscount && (
              <span style={{ background: BURG, color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                -{discountPct}%
              </span>
            )}
            <button
              type="button"
              onClick={handleWishlistToggle}
              disabled={isLoadingWishlist}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{
                width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.92)', color: isWishlisted ? '#DC2626' : BURG,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <i className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart`} style={{ fontSize: 13 }} />
            </button>
          </div>
        </div>

        {course.isEnrolled && kind !== 'LIVE' && (
          <span style={{
            position: 'absolute', bottom: 10, left: 12,
            background: 'rgba(26,127,75,0.9)', color: '#fff',
            fontSize: '0.58rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <i className="fa-solid fa-check" style={{ fontSize: 9 }} /> {t('courseTile.enrolled', 'Enrolled')}
          </span>
        )}
      </Link>

      {/* Body */}
      <div style={{ padding: '1.1rem 1.2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link
          to={`${route.instructorDetails}/${course.instructor?.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: '0.6rem', minWidth: 0 }}
        >
          <BadgeAvatar
            avatarUrl={avatar}
            name={course.instructor?.fullName}
            badge={getBadgeFromRole('INSTRUCTOR')}
            size="sm"
          />
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, color: 'rgba(58,30,32,0.65)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {course.instructor?.fullName || t('courseTile.instructor', 'Instructor')}
          </span>
          <span style={{
            marginInlineStart: 'auto', flexShrink: 0,
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: kind === 'LIVE' ? '#146C35' : '#9A6F1A', background: accentTint,
            padding: '2px 8px', borderRadius: 10,
          }}>
            {levelLabel ? levelLabel(course.level) : (course.level?.replace('_', ' ') || 'All Levels')}
          </span>
        </Link>

        <h3 style={{
          fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700,
          color: BURG_D, lineHeight: 1.4, marginBottom: '0.5rem', flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          <Link to={detailsHref} style={{ color: 'inherit', textDecoration: 'none' }}>
            {localCourse.title}
          </Link>
        </h3>

        <div style={{
          height: 1, margin: '0.65rem 0',
          background: `linear-gradient(90deg, ${accent} 0%, rgba(197,145,44,0.08) 100%)`,
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Stars rating={course.ratingAverage ?? 0} color={GOLD} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: GOLD, marginInlineStart: 3 }}>
              {(course.ratingAverage ?? 0).toFixed(1)}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(58,30,32,0.4)' }}>({course.ratingCount ?? 0})</span>
          </span>
          <span style={{ color: 'rgba(197,145,44,0.4)', fontSize: '0.55rem' }}>✦</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(58,30,32,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {kind === 'LIVE' ? (
              <><i className="isax isax-video" style={{ fontSize: 12, color: WA }} /> {t('courseTile.liveSession', 'Live session')}</>
            ) : (
              <><i className="isax isax-video-play" style={{ fontSize: 12 }} /> {t('courseTile.lessons', '{{n}} lessons', { n: course.lessonsCount ?? 0 })}</>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>{priceBlock}</div>
          {cta}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CourseCard);
