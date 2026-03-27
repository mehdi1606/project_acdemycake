import React, { useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { all_routes } from '../../router/all_routes';

interface Review {
  id: number;
  user: string;
  avatar: string;
  timeAgo: string;
  rating: number;
  text: string;
  reply?: string;
}

const staticReviews: Review[] = [
  {
    id: 1, user: 'Ronald Richard', avatar: 'assets/img/user/user-02.jpg', timeAgo: '6 months ago', rating: 4,
    text: 'This is the second Photoshop course I have completed with Nancy Duarte. Worth every penny and recommend it highly. To get the most out of this course, its best to take the Beginner to Advanced course first. The sound and video quality is of a good standard. Thank you Nancy Duarte.',
    reply: 'As a learner who has navigated through various online platforms, the sophistication and user-centric design of this website set a new',
  },
  {
    id: 2, user: 'Ronald Richard', avatar: 'assets/img/user/user-02.jpg', timeAgo: '9 months ago', rating: 4,
    text: "I've been using this LMS for several months for my online courses, and it's been a game-changer. The interface is incredibly user-friendly, making it easy for both instructors and students to navigate through the courses.",
  },
  {
    id: 3, user: 'Ronald Richard', avatar: 'assets/img/user/user-02.jpg', timeAgo: '9 months ago', rating: 4,
    text: "Any time I've had a question or encountered a minor issue, the customer support team has been quick to respond and incredibly helpful. Moreover, the reliability of this LMS has impressed me—downtime is nearly non-existent.",
  },
  {
    id: 4, user: 'Ronald Richard', avatar: 'assets/img/user/user-02.jpg', timeAgo: '9 months ago', rating: 4,
    text: 'From the onset, my experience with this LMS Website has been nothing short of extraordinary. As a learner who has navigated through various online platforms, the sophistication and user-centric design of this website set a new benchmark for what digital education should look like.',
  },
];

const StudentReviews = () => {
  const route = all_routes;
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editRating, setEditRating] = useState(4);
  const [editText, setEditText] = useState('');

  const openEdit = (review: Review) => {
    setEditRating(review.rating);
    setEditText(review.text);
    setEditModal(true);
  };

  const renderStars = (rating: number) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className="fa-solid fa-star"
          style={{ fontSize: 14, color: star <= rating ? '#C5973E' : 'rgba(107, 29, 42, 0.12)' }}
        />
      ))}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid rgba(107, 29, 42, 0.12)',
    borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
    outline: 'none', background: 'rgba(255,255,255,0.6)',
    color: 'var(--lx-text)', resize: 'vertical',
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div className="lx-section-header" style={{ marginBottom: 24 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Reviews</h5>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {staticReviews.map((review) => (
          <div
            key={review.id}
            style={{
              padding: '18px 20px', borderRadius: 'var(--lx-radius)',
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(107, 29, 42, 0.06)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to={route.studentsDetails}>
                  <img
                    src={review.avatar}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                </Link>
                <div>
                  <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    <Link to={route.studentsDetails} style={{ color: 'var(--lx-text)' }}>{review.user}</Link>
                  </h6>
                  <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{review.timeAgo}</span>
                </div>
              </div>
              {renderStars(review.rating)}
            </div>

            {/* Body */}
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--lx-text-mid)', lineHeight: 1.6 }}>
              {review.text}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: review.reply ? 12 : 0 }}>
              <button
                type="button"
                onClick={() => openEdit(review)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, color: 'var(--lx-primary)', fontWeight: 500,
                }}
              >
                <i className="isax isax-edit-2" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteModal(true)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, color: '#8B2335', fontWeight: 500,
                }}
              >
                <i className="isax isax-trash" /> Delete
              </button>
            </div>

            {/* Reply */}
            {review.reply && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(107, 29, 42, 0.03)', border: '1px solid rgba(107, 29, 42, 0.05)',
              }}>
                <h6 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)' }}>Reply</h6>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-mid)' }}>{review.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>Page 1 of 2</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" disabled style={{ opacity: 0.4 }}>
            <i className="fas fa-angle-left" />
          </button>
          <button type="button" className="lx-btn lx-btn-sm lx-btn-gold">1</button>
          <button type="button" className="lx-btn lx-btn-sm lx-btn-outline">2</button>
          <button type="button" className="lx-btn lx-btn-sm lx-btn-outline">3</button>
          <button type="button" className="lx-btn lx-btn-sm lx-btn-outline">
            <i className="fas fa-angle-right" />
          </button>
        </div>
      </div>

      {/* Edit Review Modal */}
      {editModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 500,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Edit Review</h5>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 8 }}>
                  Your Rating <span style={{ color: '#8B2335' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <i
                        className="fa-solid fa-star"
                        style={{ fontSize: 20, color: star <= editRating ? '#C5973E' : 'rgba(107, 29, 42, 0.12)' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                  Write Your Review <span style={{ color: '#8B2335' }}>*</span>
                </label>
                <textarea
                  style={inputStyle}
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setEditModal(false)}>Cancel</button>
              <button type="button" className="lx-btn lx-btn-gold" onClick={() => setEditModal(false)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
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
            <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>Delete Review</h5>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
              Are you sure you want to delete this review?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setDeleteModal(false)}>Cancel</button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                onClick={() => setDeleteModal(false)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentReviews;
