import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TFunction } from 'i18next';
import { all_routes } from '../../router/all_routes';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { message } from 'antd';
import { reviewService, MyReview } from '../../../services/api/review.service';
import { extractApiError } from '../../../services/api/error.utils';
import { getFileUrl } from '../../../environment';
import AvatarImage from '../../../components/AvatarImage';

const PAGE_SIZE = 10;

const renderStars = (rating: number, interactive = false, onSet?: (n: number) => void) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className="fa-solid fa-star"
        onClick={interactive && onSet ? () => onSet(star) : undefined}
        style={{
          fontSize: interactive ? 20 : 14,
          color: star <= rating ? '#C5973E' : 'rgba(107, 29, 42, 0.12)',
          cursor: interactive ? 'pointer' : 'default',
        }}
      />
    ))}
  </div>
);

const formatDate = (t: TFunction, iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return t('common.today', 'Today');
  if (diffDays === 1) return t('common.yesterday', 'Yesterday');
  if (diffDays < 30) return t('common.daysAgo', '{{n}} days ago', { n: diffDays });
  if (diffDays < 365) return t('common.monthsAgo', '{{n}} months ago', { n: Math.floor(diffDays / 30) });
  return t('common.yearsAgo', '{{n}} years ago', { n: Math.floor(diffDays / 365) });
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
  outline: 'none', background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)', resize: 'vertical',
};

const StudentReviews = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [editingReview, setEditingReview] = useState<MyReview | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchReviews = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await reviewService.getMyReviews(p, PAGE_SIZE);
      setReviews(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      message.error(extractApiError(err, t('student.reviews.loadError', "We couldn't load your reviews. Please try again.")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchReviews(page); }, [page, fetchReviews]);

  const openEdit = (review: MyReview) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditText(review.reviewText || '');
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    setSaving(true);
    try {
      const updated = await reviewService.updateMyReview(editingReview.id, {
        rating: editRating,
        reviewText: editText,
      });
      setReviews((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setEditingReview(null);
      message.success(t('student.reviews.updated', 'Review updated'));
    } catch (err) {
      message.error(extractApiError(err, t('student.reviews.updateError', "Your review couldn't be saved. Please try again.")));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      await reviewService.deleteMyReview(reviewId);
      setDeleteConfirmId(null);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotalElements((n) => n - 1);
      message.success(t('student.reviews.deleted', 'Review deleted'));
    } catch (err) {
      message.error(extractApiError(err, t('student.reviews.deleteError', "The review couldn't be deleted. Please try again.")));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 24 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>
          {t('student.reviews.title', 'My Reviews')}
          {!loading && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--lx-text-muted)', marginLeft: 8 }}>({totalElements})</span>}
        </h5>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--lx-text-muted)', margin: 0 }}>{t('student.reviews.loading', 'Loading reviews...')}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'rgba(255,255,255,0.55)', borderRadius: 'var(--lx-radius)',
          border: '1px solid rgba(107, 29, 42, 0.06)',
        }}>
          <i className="fa-solid fa-star" style={{ fontSize: 40, color: 'rgba(107, 29, 42, 0.15)', marginBottom: 16, display: 'block' }} />
          <h6 style={{ color: 'var(--lx-text)', marginBottom: 8 }}>{t('student.reviews.noReviews', 'No reviews yet')}</h6>
          <p style={{ color: 'var(--lx-text-muted)', margin: '0 0 16px' }}>
            {t('student.reviews.emptyText', "Rate a course you've taken: open it from My courses and leave a review. It will appear here.")}
          </p>
          <Link to={all_routes.studentCourses} className="lx-btn lx-btn-gold lx-btn-sm">
            <i className="isax isax-teacher" /> {t('student.reviews.myCourses', 'My courses')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: '18px 20px', borderRadius: 'var(--lx-radius)',
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(107, 29, 42, 0.06)',
              }}
            >
              {/* Course name */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--lx-primary)',
                  background: 'rgba(107, 29, 42, 0.06)', padding: '3px 10px',
                  borderRadius: 20,
                }}>
                  {review.courseTitle}
                </span>
                {review.isVerifiedPurchase && (
                  <span style={{
                    fontSize: 12, color: '#2D5F3F', background: 'rgba(45, 95, 63, 0.08)',
                    padding: '3px 10px', borderRadius: 20, marginInlineStart: 6,
                  }}>
                    <i className="fa-solid fa-check-circle me-1" /> {t('student.reviews.verified', 'Verified')}
                  </span>
                )}
              </div>

              {/* Header: avatar + date + stars */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AvatarImage
                    src={getFileUrl(review.userAvatar) ?? null}
                    name={review.userName}
                    size={36}
                  />
                  <div>
                    <h6 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--lx-text)' }}>
                      {review.userName}
                    </h6>
                    <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{formatDate(t, review.createdAt)}</span>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              {/* Review text */}
              <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--lx-text-mid)', lineHeight: 1.6 }}>
                {review.reviewText || <em style={{ color: 'var(--lx-text-muted)' }}>{t('student.reviews.noText', 'No written review')}</em>}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  type="button"
                  onClick={() => openEdit(review)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 13, color: 'var(--lx-primary)', fontWeight: 500,
                  }}
                >
                  <i className="isax isax-edit-2" /> {t('common.edit', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(review.id)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 13, color: '#8B2335', fontWeight: 500,
                  }}
                >
                  <i className="isax isax-trash" /> {t('common.delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
            {t('common.pageOf', 'Page {{page}} of {{total}}', { page: page + 1, total: totalPages })}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button" className="lx-btn lx-btn-sm lx-btn-outline"
              disabled={page === 0}
              style={{ opacity: page === 0 ? 0.4 : 1 }}
              onClick={() => setPage((p) => p - 1)}
            >
              <i className="fas fa-angle-left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`lx-btn lx-btn-sm ${i === page ? 'lx-btn-gold' : 'lx-btn-outline'}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button" className="lx-btn lx-btn-sm lx-btn-outline"
              disabled={page >= totalPages - 1}
              style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
              onClick={() => setPage((p) => p + 1)}
            >
              <i className="fas fa-angle-right" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReview && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingReview(null); }}
        >
          <div style={{
            width: '100%', maxWidth: 500,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{t('student.reviews.editReview', 'Edit Review')}</h5>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--lx-text-muted)' }}>{editingReview.courseTitle}</p>
              </div>
              <button onClick={() => setEditingReview(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 8 }}>
                  {t('common.rating', 'Rating')} <span style={{ color: '#8B2335' }}>*</span>
                </label>
                {renderStars(editRating, true, setEditRating)}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                  {t('student.reviews.yourReview', 'Your Review')}
                </label>
                <textarea
                  style={inputStyle}
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder={t('student.reviews.placeholder', 'Share your experience with this course...')}
                  maxLength={2000}
                />
                <small style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{editText.length}/2000</small>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setEditingReview(null)}>{t('common.cancel', 'Cancel')}</button>
              <button type="button" className="lx-btn lx-btn-gold" onClick={handleSaveEdit} disabled={saving}>
                {saving ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)', padding: 32, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(139, 35, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>{t('student.reviews.deleteReview', 'Delete Review')}</h5>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
              {t('student.reviews.deleteConfirm', 'Are you sure you want to delete this review? This cannot be undone.')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setDeleteConfirmId(null)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                disabled={!!deletingId}
                onClick={() => handleDelete(deleteConfirmId)}
              >
                {deletingId === deleteConfirmId ? t('common.deleting', 'Deleting...') : t('common.yesDelete', 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentReviews;
