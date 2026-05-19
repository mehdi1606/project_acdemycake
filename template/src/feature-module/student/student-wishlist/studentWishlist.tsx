import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { courseService } from '../../../services/api/course.service';
import { Course } from '../../../services/api/types';
import { getFileUrl } from '../../../environment';

const PAGE_SIZE = 9;

const StudentWishlist = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
  const [removingAll, setRemovingAll] = useState(false);

  const loadWishlist = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await courseService.getWishlist(p, PAGE_SIZE);
      setCourses(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist(page);
  }, [loadWishlist, page]);

  const handleRemove = async (courseId: string) => {
    setRemovingId(courseId);
    try {
      await courseService.removeFromWishlist(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setTotalElements((prev) => prev - 1);
    } catch {
      // silently fail
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveAll = async () => {
    setRemovingAll(true);
    try {
      await Promise.all(courses.map((c) => courseService.removeFromWishlist(c.id)));
      setCourses([]);
      setTotalElements(0);
      setShowRemoveAllModal(false);
    } catch {
      await loadWishlist(0);
      setPage(0);
    } finally {
      setRemovingAll(false);
    }
  };

  const getThumbnail = (url?: string) =>
    getFileUrl(url) ?? 'assets/img/course/course-01.jpg';

  const getInstructorAvatar = (url?: string) =>
    getFileUrl(url) ?? 'assets/img/user/user-02.jpg';

  const formatPrice = (course: Course) => {
    if (!course.requiresPurchase) return 'Free';
    if (!course.price) return 'Free';
    const symbol = course.currency === 'USD' ? '$' : course.currency || '$';
    return `${symbol}${Number(course.price).toFixed(2)}`;
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>
          {t('student.wishlist.title', 'Wishlist')}
          {totalElements > 0 && (
            <span style={{
              marginLeft: 10, padding: '2px 10px', borderRadius: 12,
              background: 'rgba(107, 29, 42, 0.08)', color: 'var(--lx-primary)',
              fontSize: 12, fontWeight: 600,
            }}>
              {totalElements}
            </span>
          )}
        </h5>
        {courses.length > 0 && (
          <button
            type="button"
            className="lx-btn lx-btn-sm"
            style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1px solid rgba(139, 35, 53, 0.12)' }}
            onClick={() => setShowRemoveAllModal(true)}
          >
            <i className="isax isax-trash" style={{ marginRight: 4 }} />
            {t('student.wishlist.removeAll', 'Remove All')}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 20,
          borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139, 35, 53, 0.06)',
          border: '1px solid rgba(139, 35, 53, 0.12)', color: '#8B2335', fontSize: 14,
        }}>
          <i className="isax isax-warning-2" />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" onClick={() => loadWishlist(page)}>
            {t('common.tryAgain', 'Retry')}
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : courses.length === 0 ? (
        <div className="lx-card">
          <div className="lx-empty-state">
            <span className="empty-icon" style={{ background: 'rgba(139, 35, 53, 0.06)' }}>
              <i className="isax isax-heart" style={{ fontSize: 28, color: '#8B2335' }} />
            </span>
            <h6 style={{ fontWeight: 600, color: 'var(--lx-text)' }}>{t('student.wishlist.empty', 'Your wishlist is empty')}</h6>
            <p>{t('student.wishlist.emptyDesc', 'Save courses you\'re interested in and come back to them later.')}</p>
            <Link to={all_routes.courseGrid} className="lx-btn lx-btn-gold">
              {t('student.wishlist.browseNow', 'Browse Courses')}
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                borderRadius: 'var(--lx-radius)', overflow: 'hidden',
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(107, 29, 42, 0.06)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(44, 24, 16, 0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <Link to={`${all_routes.courseDetails}/${course.slug}`}>
                  <img
                    src={getThumbnail(course.thumbnailUrl)}
                    alt={course.title}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg'; }}
                  />
                </Link>
                <button
                  type="button"
                  style={{
                    position: 'absolute', top: 10, left: 10,
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(139, 35, 53, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#8B2335', fontSize: 16,
                  }}
                  title={t('student.wishlist.remove', 'Remove from wishlist')}
                  disabled={removingId === course.id}
                  onClick={() => handleRemove(course.id)}
                >
                  {removingId === course.id ? (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #8B2335', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <i className="isax isax-heart5" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={getInstructorAvatar(course.instructor?.avatarUrl)}
                      alt=""
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/user/user-02.jpg'; }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
                      {course.instructor?.fullName || 'Instructor'}
                    </span>
                  </div>
                  {course.category?.name && (
                    <span className="lx-badge badge-slate">{course.category.name}</span>
                  )}
                </div>

                <h6 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                  <Link to={`${all_routes.courseDetails}/${course.slug}`} style={{ color: 'var(--lx-text)' }}>
                    {course.title}
                  </Link>
                </h6>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                  <i className="fa-solid fa-star" style={{ fontSize: 12, color: '#C5973E' }} />
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
                    {course.ratingAverage
                      ? `${Number(course.ratingAverage).toFixed(1)} (${course.ratingCount ?? 0})`
                      : t('student.reviews.noReviews', 'No reviews')}
                  </span>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(107, 29, 42, 0.06)' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: !course.requiresPurchase ? '#2D5F3F' : 'var(--lx-primary)' }}>
                    {formatPrice(course)}
                  </span>
                  <Link
                    to={`${all_routes.courseDetails}/${course.slug}`}
                    className="lx-btn lx-btn-sm lx-btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {t('common.view', 'View Course')}
                    <i className="fas fa-angle-right" style={{ fontSize: 10 }} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Page {page + 1} of {totalPages}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="lx-btn lx-btn-sm lx-btn-outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ opacity: page === 0 ? 0.4 : 1 }}
            >
              <i className="fas fa-angle-left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`lx-btn lx-btn-sm ${page === i ? 'lx-btn-gold' : 'lx-btn-outline'}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              className="lx-btn lx-btn-sm lx-btn-outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ opacity: page === totalPages - 1 ? 0.4 : 1 }}
            >
              <i className="fas fa-angle-right" />
            </button>
          </div>
        </div>
      )}

      {/* Remove All Modal */}
      {showRemoveAllModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !removingAll) { setShowRemoveAllModal(false); } }}
        >
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)', padding: 32, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(139, 35, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>{t('student.wishlist.removeAll', 'Remove All')}</h5>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
              {t('student.wishlist.removeAllConfirm', 'Are you sure you want to remove all')} {totalElements} {t('student.wishlist.courses', 'course')}{totalElements !== 1 ? 's' : ''} {t('student.wishlist.fromWishlist', 'from your wishlist?')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button
                type="button"
                className="lx-btn lx-btn-outline"
                onClick={() => setShowRemoveAllModal(false)}
                disabled={removingAll}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                onClick={handleRemoveAll}
                disabled={removingAll}
              >
                {removingAll ? t('student.wishlist.removing', 'Removing...') : t('student.wishlist.yesRemoveAll', 'Yes, Remove All')}
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentWishlist;
