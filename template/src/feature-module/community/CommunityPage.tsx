import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal, Spin } from 'antd';
import LuxuryDashboardLayout from '../../components/LuxuryDashboardLayout';
import communityService from '../../services/api/community.service';
import { CommunityPost, CreatePostRequest, PostType } from '../../services/api/types';
import { getFileUrl } from '../../environment';
import { all_routes } from '../router/all_routes';
import BadgeAvatar from '../../components/BadgeAvatar';
import { getBadgeFromRole } from '../../config/badges';
import { useAppSelector } from '../../core/redux/hooks';

// ─── helpers ──────────────────────────────────────────────────────────────────

const avatarUrl = (url?: string) => getFileUrl(url) ?? 'assets/img/user/user-02.jpg';

const TYPE_BADGE: Record<PostType, string> = {
  DISCUSSION:   'primary',
  QUESTION:     'warning',
  SHOWCASE:     'success',
  ANNOUNCEMENT: 'danger',
  CHALLENGE:    'purple',
};

// Achievement icon options
const ACHIEVEMENT_ICONS = [
  { key: 'isax-trophy',        label: 'Trophy'      },
  { key: 'isax-award',         label: 'Award'       },
  { key: 'isax-crown',         label: 'Crown'       },
  { key: 'isax-star',          label: 'Star'        },
  { key: 'isax-medal',         label: 'Medal'       },
  { key: 'isax-teacher',       label: 'Learned'     },
  { key: 'isax-tick-circle',   label: 'Completed'   },
  { key: 'isax-heart',         label: 'Love'        },
];

// Achievement badge display (reused in list + detail)
export const AchievementBadge: React.FC<{ text: string; icon: string; size?: 'sm' | 'md' }> = ({
  text, icon, size = 'sm',
}) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: size === 'md' ? 8 : 6,
    background: 'linear-gradient(135deg, rgba(197,145,44,0.12) 0%, rgba(197,145,44,0.06) 100%)',
    border: '1px solid rgba(197,145,44,0.35)',
    borderRadius: 20,
    padding: size === 'md' ? '7px 14px' : '5px 11px',
    marginTop: 8,
  }}>
    <i className={`isax ${icon}`} style={{
      fontSize: size === 'md' ? 16 : 13,
      color: '#C5912C',
    }} />
    <span style={{
      fontSize: size === 'md' ? 13 : 12,
      fontWeight: 700,
      color: '#9B7B50',
      fontFamily: '"Montserrat", sans-serif',
    }}>
      {text}
    </span>
  </div>
);

// ─── component ────────────────────────────────────────────────────────────────

const CommunityPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  const TYPE_LABELS: Record<PostType, string> = {
    DISCUSSION:   t('community.type.DISCUSSION',   'Discussion'),
    QUESTION:     t('community.type.QUESTION',     'Question'),
    SHOWCASE:     t('community.type.SHOWCASE',     'Resource'),
    ANNOUNCEMENT: t('community.type.ANNOUNCEMENT', 'Announcement'),
    CHALLENGE:    t('community.type.CHALLENGE',    'Challenge'),
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' });

  const [posts,       setPosts]       = useState<CommunityPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [filterType,  setFilterType]  = useState<PostType | ''>('');
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Create post modal
  const [modalOpen,    setModalOpen]    = useState(false);
  const [formTitle,    setFormTitle]    = useState('');
  const [formContent,  setFormContent]  = useState('');
  const [formType,     setFormType]     = useState<PostType>('DISCUSSION');
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState('');

  // Achievement
  const [achievementText, setAchievementText] = useState('');
  const [achievementIcon, setAchievementIcon] = useState('isax-trophy');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fetch posts ───────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (p: number, type: PostType | '', q: string) => {
    setLoading(true);
    try {
      const res = await communityService.getPosts(p, 12, type || undefined, q || undefined);
      setPosts(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(page, filterType, search);
  }, [page, filterType, search, fetchPosts]);

  // ── search debounce ───────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(0);
      setSearch(val);
    }, 400);
  };

  // ── like toggle ───────────────────────────────────────────────────────────
  const toggleLike = async (post: CommunityPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasLiked = post.isLikedByCurrentUser;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, isLikedByCurrentUser: !wasLiked, likesCount: p.likesCount + (wasLiked ? -1 : 1) }
          : p
      )
    );
    try {
      if (wasLiked) await communityService.unlikePost(post.id);
      else          await communityService.likePost(post.id);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, isLikedByCurrentUser: wasLiked, likesCount: p.likesCount + (wasLiked ? 1 : -1) }
            : p
        )
      );
    }
  };

  // ── create post ───────────────────────────────────────────────────────────
  const openModal = () => {
    setFormTitle(''); setFormContent(''); setFormType('DISCUSSION'); setFormError('');
    setAchievementText(''); setAchievementIcon('isax-trophy');
    setModalOpen(true);
  };

  const submitPost = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError(t('community.errorRequired', 'Title and content are required.'));
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const req: CreatePostRequest = {
        title:   formTitle.trim(),
        content: formContent.trim(),
        postType: formType,
        ...(achievementText.trim() ? { achievementText: achievementText.trim(), achievementIcon } : {}),
      };
      const created = await communityService.createPost(req);
      setPosts((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch {
      setFormError(t('community.errorCreate', 'Failed to publish post. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterType = (ptype: PostType | '') => { setFilterType(ptype); setPage(0); };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--lx-primary, #6B1D2A)' }}>
              {t('community.title', 'Community')}
            </h4>
            <p className="text-muted mb-0 fs-14">{t('community.description', 'Share, discuss and grow together.')}</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openModal}>
            <i className="isax isax-add-circle fs-18" />
            {t('community.newPost', 'New Post')}
          </button>
        </div>

        {/* Filters */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
          <div className="input-icon flex-grow-1" style={{ maxWidth: 320 }}>
            <span className="input-icon-addon">
              <i className="isax isax-search-normal-1 fs-14" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={t('community.searchPlaceholder', 'Search posts…')}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="btn-group flex-wrap" role="group">
            <button type="button"
              className={`btn btn-sm ${filterType === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterType('')}
            >{t('community.all', 'All')}</button>
            {(Object.keys(TYPE_LABELS) as PostType[]).map((ptype) => (
              <button key={ptype} type="button"
                className={`btn btn-sm ${
                  filterType === ptype
                    ? ptype === 'CHALLENGE' ? 'btn-secondary' : `btn-${TYPE_BADGE[ptype]}`
                    : 'btn-outline-secondary'
                }`}
                onClick={() => handleFilterType(ptype)}
              >
                {ptype === 'CHALLENGE' && <i className="isax isax-crown me-1" style={{ fontSize: 11 }} />}
                {TYPE_LABELS[ptype]}
              </button>
            ))}
          </div>
        </div>

        {/* Post list */}
        {loading ? (
          <div className="d-flex justify-content-center py-5"><Spin size="large" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="isax isax-message-text fs-1 d-block mb-2" />
            <p>{t('community.noPostsFound', 'No posts found.')}</p>
          </div>
        ) : (
          <div className="row g-3">
            {posts.map((post) => (
              <div key={post.id} className="col-12">
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{ cursor: 'pointer', transition: 'box-shadow .2s' }}
                  onClick={() => navigate(all_routes.communityPost.replace(':postId', post.id))}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(107,29,42,.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
                >
                  {/* Challenge header strip */}
                  {post.postType === 'CHALLENGE' && (
                    <div style={{
                      background: 'linear-gradient(90deg, #4E1420 0%, #7A2240 100%)',
                      padding: '8px 20px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      borderRadius: '8px 8px 0 0',
                    }}>
                      <i className="isax isax-crown" style={{ color: '#C5912C', fontSize: 14 }} />
                      <span style={{ color: '#DEBB6B', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {t('community.challenge', 'Challenge')} — {t('community.respondInComments', 'Respond in comments')}
                      </span>
                    </div>
                  )}

                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <BadgeAvatar
                          avatarUrl={avatarUrl(post.userAvatar)}
                          name={post.userName}
                          badge={getBadgeFromRole((post as any).userRole)}
                          size="sm"
                        />
                        <div>
                          <p className="mb-0 fw-semibold fs-14">{post.userName}</p>
                          <p className="mb-0 text-muted fs-12">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                        {post.isPinned && (
                          <span className="badge bg-warning-subtle text-warning rounded-pill px-2">
                            <i className="fa-solid fa-thumbtack me-1" style={{ fontSize: 9 }} />
                            {t('community.pinned', 'Pinned')}
                          </span>
                        )}
                        <span className={`badge rounded-pill px-3 ${
                          post.postType === 'CHALLENGE'
                            ? 'text-white'
                            : `bg-${TYPE_BADGE[post.postType]}-subtle text-${TYPE_BADGE[post.postType]}`
                        }`} style={post.postType === 'CHALLENGE' ? { background: '#4E1420' } : {}}>
                          {post.postType === 'CHALLENGE' && <i className="isax isax-crown me-1" style={{ fontSize: 10 }} />}
                          {TYPE_LABELS[post.postType]}
                        </span>
                      </div>
                    </div>

                    <h6 className="fw-bold mb-1 mt-2">{post.title}</h6>
                    <p className="text-muted fs-14 mb-2" style={{
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {post.content}
                    </p>

                    {/* Achievement badge */}
                    {post.achievementText && post.achievementIcon && (
                      <AchievementBadge text={post.achievementText} icon={post.achievementIcon} />
                    )}

                    <div className="d-flex align-items-center gap-3 mt-3">
                      <button
                        type="button"
                        className={`btn btn-sm d-flex align-items-center gap-1 ${post.isLikedByCurrentUser ? 'btn-danger' : 'btn-outline-secondary'}`}
                        onClick={(e) => toggleLike(post, e)}
                      >
                        <i className={`isax ${post.isLikedByCurrentUser ? 'isax-heart5' : 'isax-heart'} fs-14`} />
                        {post.likesCount}
                      </button>
                      <span className="d-flex align-items-center gap-1 text-muted fs-14">
                        <i className="isax isax-message-text fs-16" /> {post.commentsCount}
                      </span>
                      <span className="d-flex align-items-center gap-1 text-muted fs-14">
                        <i className="isax isax-eye fs-16" /> {post.viewsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4 gap-2">
            <button className="btn btn-outline-secondary btn-sm" disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}>
              <i className="isax isax-arrow-left-2 fs-14" /> {t('community.prev', 'Prev')}
            </button>
            <span className="btn btn-sm disabled text-muted">{page + 1} / {totalPages}</span>
            <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}>
              {t('community.next', 'Next')} <i className="isax isax-arrow-right-3 fs-14" />
            </button>
          </div>
        )}
      </div>

      {/* ── Create Post Modal ─────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitPost}
        okText={t('community.post', 'Publish Post')}
        cancelText={t('common.cancel', 'Cancel')}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !formTitle.trim() || !formContent.trim() }}
        width={600}
        styles={{ body: { padding: 0 } }}
        footer={null}
        closable={false}
      >
        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
          {/* Modal header */}
          <div style={{
            background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
            padding: '20px 24px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: '"Pinyon Script", cursive', color: '#C5912C', fontSize: '1.1rem', lineHeight: 1 }}>
                Share
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>
                {t('community.createPost', 'Create a Post')}
              </div>
            </div>
            <button type="button" onClick={() => setModalOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="isax isax-close-circle" />
            </button>
          </div>

          {/* Modal body */}
          <div style={{ padding: '24px', background: 'var(--sl-ivory, #F2EFE8)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {formError && <div className="alert alert-danger py-2 mb-0">{formError}</div>}

            {/* TYPE */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#651C32', marginBottom: 8, display: 'block' }}>
                {t('community.typeLabel', 'Type')}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(TYPE_LABELS) as PostType[]).filter((ptype) => isInstructor || ptype !== 'CHALLENGE').map((ptype) => (
                  <button key={ptype} type="button"
                    onClick={() => setFormType(ptype)}
                    style={{
                      padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                      border: formType === ptype ? 'none' : '1.5px solid rgba(101,28,50,0.2)',
                      background: formType === ptype
                        ? (ptype === 'CHALLENGE' ? 'linear-gradient(135deg,#4E1420,#7A2240)' : '#651C32')
                        : '#fff',
                      color: formType === ptype ? '#fff' : '#651C32',
                      transition: 'all 0.2s',
                    }}>
                    {ptype === 'CHALLENGE' && <i className="isax isax-crown me-1" style={{ fontSize: 11 }} />}
                    {TYPE_LABELS[ptype]}
                  </button>
                ))}
              </div>
              {/* Challenge hint */}
              {formType === 'CHALLENGE' && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(78,20,32,0.06)', border: '1px solid rgba(78,20,32,0.12)',
                  fontSize: 12, color: '#651C32', display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <i className="isax isax-info-circle" style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} />
                  <span>
                    {t('community.challengeHint', 'Write the challenge instructions in the content below. Students will respond in the comments.')}
                  </span>
                </div>
              )}
            </div>

            {/* TITLE */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#651C32', marginBottom: 8, display: 'block' }}>
                {t('community.titleLabel', 'Title')} <span style={{ color: '#B03060' }}>*</span>
              </label>
              <input type="text"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(101,28,50,0.2)', fontSize: 14, outline: 'none', background: '#fff', color: '#2C1810' }}
                placeholder={t('community.titlePlaceholder', "What's on your mind?")}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* CONTENT */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#651C32', marginBottom: 8, display: 'block' }}>
                {t('community.contentLabel', 'Content')} <span style={{ color: '#B03060' }}>*</span>
              </label>
              <textarea
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(101,28,50,0.2)', fontSize: 14, outline: 'none', background: '#fff', color: '#2C1810', resize: 'vertical', minHeight: 120 }}
                placeholder={t('community.contentPlaceholder', 'Share your thoughts, question, or resource…')}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={5}
              />
            </div>

            {/* ACHIEVEMENT */}
            <div style={{
              padding: '16px', borderRadius: 12,
              border: '1.5px solid rgba(197,145,44,0.25)',
              background: 'rgba(197,145,44,0.04)',
            }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B7B50', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="isax isax-trophy" style={{ fontSize: 14, color: '#C5912C' }} />
                {t('community.achievementLabel', 'Achievement (optional)')}
              </label>

              {/* Icon selector */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {ACHIEVEMENT_ICONS.map((ic) => (
                  <button key={ic.key} type="button"
                    title={ic.label}
                    onClick={() => setAchievementIcon(ic.key)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: achievementIcon === ic.key
                        ? 'linear-gradient(135deg, #C5912C, #DEBB6B)'
                        : 'rgba(197,145,44,0.1)',
                      transition: 'all 0.15s',
                    }}>
                    <i className={`isax ${ic.key}`} style={{ fontSize: 16, color: achievementIcon === ic.key ? '#4E1420' : '#C5912C' }} />
                  </button>
                ))}
              </div>

              {/* Achievement text */}
              <input type="text"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(197,145,44,0.2)', fontSize: 13, outline: 'none', background: '#fff', color: '#2C1810' }}
                placeholder={t('community.achievementPlaceholder', 'e.g. Completed Fondant Mastery Course')}
                value={achievementText}
                onChange={(e) => setAchievementText(e.target.value)}
                maxLength={200}
              />

              {/* Preview */}
              {achievementText.trim() && (
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: '#9B7B50', marginRight: 8 }}>Preview:</span>
                  <AchievementBadge text={achievementText.trim()} icon={achievementIcon} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button type="button" onClick={() => setModalOpen(false)}
                style={{ padding: '11px 24px', borderRadius: 10, border: '1.5px solid rgba(101,28,50,0.2)', background: '#fff', color: '#651C32', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button type="button" onClick={submitPost}
                disabled={submitting || !formTitle.trim() || !formContent.trim()}
                style={{
                  padding: '11px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 50%, #C5912C 100%)',
                  color: '#4E1420', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  opacity: (submitting || !formTitle.trim() || !formContent.trim()) ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                {submitting ? <Spin size="small" /> : <i className="isax isax-send-2" />}
                {t('community.post', 'Publish Post')}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </LuxuryDashboardLayout>
  );
};

export default CommunityPage;
