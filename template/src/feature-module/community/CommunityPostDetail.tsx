import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Spin } from 'antd';
import LuxuryDashboardLayout from '../../components/LuxuryDashboardLayout';
import communityService from '../../services/api/community.service';
import { CommunityComment, CommunityPost, PostType } from '../../services/api/types';
import { getFileUrl } from '../../environment';
import { all_routes } from '../router/all_routes';
import BadgeAvatar from '../../components/BadgeAvatar';
import { getBadgeFromRole } from '../../config/badges';
import { useAppSelector } from '../../core/redux/hooks';

// ─── achievement icons available for challenge responses ──────────────────────

const ACHIEVEMENT_ICONS = [
  { icon: '🏆', label: 'Trophy'       },
  { icon: '🥇', label: 'Gold Medal'   },
  { icon: '⭐', label: 'Star'          },
  { icon: '🔥', label: 'Fire'          },
  { icon: '💡', label: 'Idea'          },
  { icon: '🚀', label: 'Rocket'        },
  { icon: '🎯', label: 'Target'        },
  { icon: '💪', label: 'Strong'        },
  { icon: '✅', label: 'Completed'     },
  { icon: '🌟', label: 'Shining Star' },
  { icon: '🎉', label: 'Celebrate'    },
  { icon: '📚', label: 'Studied'      },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

const avatarUrl = (url?: string) => getFileUrl(url) ?? 'assets/img/user/user-02.jpg';

const TYPE_LABELS: Record<PostType, string> = {
  DISCUSSION:   'Discussion',
  QUESTION:     'Question',
  SHOWCASE:     'Resource',
  ANNOUNCEMENT: 'Announcement',
  CHALLENGE:    'Challenge',
};

const TYPE_BADGE: Record<PostType, string> = {
  DISCUSSION:   'primary',
  QUESTION:     'warning',
  SHOWCASE:     'success',
  ANNOUNCEMENT: 'danger',
  CHALLENGE:    'purple',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── component ────────────────────────────────────────────────────────────────

const CommunityPostDetail: React.FC = () => {
  const { t } = useTranslation();
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  // current logged-in user (for achievement one-per-user check)
  const { user } = useAppSelector((s) => s.auth);

  const [post,        setPost]        = useState<CommunityPost | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [postError,   setPostError]   = useState('');

  const [comments,           setComments]           = useState<CommunityComment[]>([]);
  const [commentsLoading,    setCommentsLoading]    = useState(false);
  const [commentsPage,       setCommentsPage]       = useState(0);
  const [commentsTotalPages, setCommentsTotalPages] = useState(0);

  const [newComment,        setNewComment]        = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError,      setCommentError]      = useState('');

  // Achievement state — only used for CHALLENGE posts
  const [showAchievementPicker, setShowAchievementPicker] = useState(false);
  const [selectedAchievementIcon, setSelectedAchievementIcon] = useState('🏆');
  const [achievementText, setAchievementText]               = useState('');
  const [attachAchievement, setAttachAchievement]           = useState(false);
  const [achievementFile, setAchievementFile]               = useState<File | null>(null);
  const [achievementFileUrl, setAchievementFileUrl]         = useState<string>('');
  const [achievementFileUploading, setAchievementFileUploading] = useState(false);
  const achievementFileRef = useRef<HTMLInputElement>(null);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<PostType>('DISCUSSION');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editImageUploading, setEditImageUploading] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Action menu state
  const [showActionMenu, setShowActionMenu] = useState(false);

  const effectiveRole = user?.role ?? (() => {
    try { return JSON.parse(localStorage.getItem('user') ?? '{}').role; } catch { return undefined; }
  })();
  const isAdminOrInstructor = effectiveRole === 'ADMIN' || effectiveRole === 'INSTRUCTOR';
  const canManage = user?.id === post?.userId || effectiveRole === 'ADMIN';

  const id = postId ?? '';

  // ── fetch post ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setPostLoading(true);
    communityService
      .getPostById(id)
      .then(setPost)
      .catch(() => setPostError('Post not found or failed to load.'))
      .finally(() => setPostLoading(false));
  }, [id]);

  // ── fetch comments ────────────────────────────────────────────────────────
  const fetchComments = useCallback(async (p: number) => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const res = await communityService.getPostComments(id, p, 20);
      if (p === 0) {
        setComments(res.content ?? []);
      } else {
        setComments((prev) => [...prev, ...(res.content ?? [])]);
      }
      setCommentsTotalPages(res.totalPages ?? 0);
    } catch {
      // silent
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchComments(0);
  }, [id, fetchComments]);

  // ── derived: has current user already used their achievement on this post? ─
  const currentUserId = user?.id ?? '';
  const currentUserAlreadyHasAchievement = comments.some(
    (c) => c.userId === currentUserId && !!c.achievementText
  );

  // ── like post ─────────────────────────────────────────────────────────────
  const togglePostLike = async () => {
    if (!post) return;
    const wasLiked = post.isLikedByCurrentUser;
    setPost((p) =>
      p ? { ...p, isLikedByCurrentUser: !wasLiked, likesCount: p.likesCount + (wasLiked ? -1 : 1) } : p
    );
    try {
      if (wasLiked) await communityService.unlikePost(post.id);
      else          await communityService.likePost(post.id);
    } catch {
      setPost((p) =>
        p ? { ...p, isLikedByCurrentUser: wasLiked, likesCount: p.likesCount + (wasLiked ? 1 : -1) } : p
      );
    }
  };

  // ── like comment ──────────────────────────────────────────────────────────
  const toggleCommentLike = async (comment: CommunityComment) => {
    const wasLiked = comment.isLikedByCurrentUser;
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? { ...c, isLikedByCurrentUser: !wasLiked, likesCount: c.likesCount + (wasLiked ? -1 : 1) }
          : c
      )
    );
    try {
      if (wasLiked) await communityService.unlikeComment(comment.id);
      else          await communityService.likeComment(comment.id);
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? { ...c, isLikedByCurrentUser: wasLiked, likesCount: c.likesCount + (wasLiked ? 1 : -1) }
            : c
        )
      );
    }
  };

  // ── achievement file upload ────────────────────────────────────────────────
  const handleAchievementFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAchievementFile(file);
    setAchievementFileUploading(true);
    try {
      const url = await communityService.uploadAchievementFile(file);
      setAchievementFileUrl(url);
    } catch {
      setCommentError('Failed to upload achievement file. Please try again.');
      setAchievementFile(null);
    } finally {
      setAchievementFileUploading(false);
    }
    // reset input so the same file can be re-selected if needed
    if (achievementFileRef.current) achievementFileRef.current.value = '';
  };

  const removeAchievementFile = () => {
    setAchievementFile(null);
    setAchievementFileUrl('');
    if (achievementFileRef.current) achievementFileRef.current.value = '';
  };

  // ── submit comment ─────────────────────────────────────────────────────────
  const submitComment = async () => {
    if (!newComment.trim() || !id) return;
    setSubmittingComment(true);
    setCommentError('');
    try {
      const canAttach = attachAchievement && !currentUserAlreadyHasAchievement;
      const finalAchievementText    = canAttach && achievementText.trim() ? achievementText.trim() : undefined;
      const finalAchievementIcon    = canAttach ? selectedAchievementIcon : undefined;
      const finalAchievementFileUrl = canAttach && achievementFileUrl ? achievementFileUrl : undefined;

      const created = await communityService.addComment(
        id,
        newComment.trim(),
        finalAchievementText,
        finalAchievementIcon,
        finalAchievementFileUrl
      );
      setComments((prev) => [created, ...prev]);
      setPost((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      setNewComment('');
      setAchievementText('');
      setAchievementFile(null);
      setAchievementFileUrl('');
      setAttachAchievement(false);
      setShowAchievementPicker(false);
      commentInputRef.current?.focus();
    } catch {
      setCommentError('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const loadMoreComments = () => {
    const next = commentsPage + 1;
    setCommentsPage(next);
    fetchComments(next);
  };

  // ── edit post ─────────────────────────────────────────────────────────────
  const openEditModal = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditType(post.postType);
    setEditImageUrl(post.images?.[0] ?? null);
    setEditError('');
    setEditModalOpen(true);
    setShowActionMenu(false);
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageUploading(true);
    setEditError('');
    try {
      const url = await communityService.uploadPostImage(file);
      setEditImageUrl(url);
    } catch {
      setEditError('Failed to upload image.');
    } finally {
      setEditImageUploading(false);
      if (editImageInputRef.current) editImageInputRef.current.value = '';
    }
  };

  const submitEdit = async () => {
    if (!editTitle.trim() || !editContent.trim() || !post) return;
    setEditSubmitting(true);
    setEditError('');
    try {
      const updated = await communityService.updatePost(post.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        postType: editType,
        ...(editImageUrl ? { imageUrls: [editImageUrl] } : {}),
      });
      setPost(updated);
      setEditModalOpen(false);
    } catch {
      setEditError('Failed to update post.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── delete post ───────────────────────────────────────────────────────────
  const handleDeletePost = async () => {
    if (!post) return;
    setShowActionMenu(false);
    if (!window.confirm(t('community.confirmDelete', 'Are you sure you want to delete this post?'))) return;
    try {
      await communityService.deletePost(post.id);
      navigate(all_routes.blogGrid);
    } catch {
      // silent
    }
  };

  // ── pin / unpin ───────────────────────────────────────────────────────────
  const handleTogglePin = async () => {
    if (!post) return;
    setShowActionMenu(false);
    try {
      if (post.isPinned) {
        await communityService.unpinPost(post.id);
      } else {
        await communityService.pinPost(post.id);
      }
      setPost((p) => p ? { ...p, isPinned: !p.isPinned } : p);
    } catch {
      // silent
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────
  if (postLoading) {
    return (
      <LuxuryDashboardLayout>
        <div className="d-flex justify-content-center py-5"><Spin size="large" /></div>
      </LuxuryDashboardLayout>
    );
  }

  if (postError || !post) {
    return (
      <LuxuryDashboardLayout>
        <div className="container-fluid py-4">
          <div className="alert alert-danger">{postError || 'Post not found.'}</div>
          <button className="btn btn-outline-secondary" onClick={() => navigate(all_routes.blogGrid)}>
            <i className="isax isax-arrow-left-2 me-2" /> Back to Community
          </button>
        </div>
      </LuxuryDashboardLayout>
    );
  }

  const isChallenge = post.postType === 'CHALLENGE';

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4" style={{ maxWidth: 820 }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <button type="button" className="btn btn-link p-0 text-decoration-none text-muted fs-14"
                onClick={() => navigate(all_routes.blogGrid)}>
                Community
              </button>
            </li>
            <li className="breadcrumb-item active fs-14 text-truncate" style={{ maxWidth: 200 }}>
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Post card */}
        <div className="card border-0 shadow-sm mb-4">
          {/* Challenge header strip */}
          {isChallenge && (
            <div style={{
              background: 'linear-gradient(90deg, #4E1420 0%, #7A2240 100%)',
              padding: '10px 24px',
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: '8px 8px 0 0',
            }}>
              <i className="isax isax-crown" style={{ color: '#C5912C', fontSize: 16 }} />
              <span style={{ color: '#DEBB6B', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('community.challenge', 'Challenge')}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 4 }}>
                — {t('community.respondInComments', 'Share your response in the comments')}
              </span>
            </div>
          )}

          <div className="card-body p-4">
            <div className="mb-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                {isChallenge ? (
                  <span className="badge rounded-pill px-3 fs-12 text-white" style={{ background: '#4E1420' }}>
                    <i className="isax isax-crown me-1" style={{ fontSize: 10 }} />
                    {TYPE_LABELS[post.postType]}
                  </span>
                ) : (
                  <span className={`badge bg-${TYPE_BADGE[post.postType]}-subtle text-${TYPE_BADGE[post.postType]} rounded-pill px-3 fs-12`}>
                    {TYPE_LABELS[post.postType]}
                  </span>
                )}
                {post.isPinned && (
                  <span className="badge bg-warning-subtle text-warning rounded-pill px-3 fs-12">
                    <i className="fa-solid fa-thumbtack me-1" />{t('community.pinned', 'Pinned')}
                  </span>
                )}
                {post.isEdited && (
                  <span className="text-muted fs-11">({t('community.edited', 'edited')})</span>
                )}
              </div>

              {/* Action menu */}
              {(canManage || isAdminOrInstructor) && (
                <div style={{ position: 'relative' }}>
                  <button type="button" className="btn btn-sm btn-light"
                    style={{ padding: '2px 10px', lineHeight: 1 }}
                    onClick={() => setShowActionMenu(!showActionMenu)}>
                    <i className="fa-solid fa-ellipsis-vertical" />
                  </button>
                  {showActionMenu && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                        onClick={() => setShowActionMenu(false)} />
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', zIndex: 100,
                        background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.08)', minWidth: 180, overflow: 'hidden',
                      }}>
                        {canManage && (
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                            onClick={openEditModal}>
                            <i className="isax isax-edit-2 fs-16" style={{ color: '#6B1D2A' }} />
                            {t('community.edit', 'Edit')}
                          </button>
                        )}
                        {isAdminOrInstructor && (
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                            onClick={handleTogglePin}>
                            <i className={`fa-solid fa-thumbtack fs-14 ${post.isPinned ? 'text-warning' : ''}`}
                              style={!post.isPinned ? { color: '#6B1D2A' } : {}} />
                            {post.isPinned
                              ? t('community.unpin', 'Unpin')
                              : t('community.pin', 'Pin')}
                          </button>
                        )}
                        {canManage && (
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger"
                            onClick={handleDeletePost}>
                            <i className="isax isax-trash fs-16" />
                            {t('community.delete', 'Delete')}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <h4 className="fw-bold mb-3">{post.title}</h4>

            <div className="d-flex align-items-center gap-2 mb-3">
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

            <div className="fs-15 lh-lg" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {post.content}
            </div>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {post.images.map((img, i) => (
                  <img key={i} src={getFileUrl(img) ?? img} alt={`attachment-${i}`}
                    style={{ maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                ))}
              </div>
            )}

            <div className="d-flex align-items-center gap-3 mt-4 pt-3 border-top">
              <button type="button"
                className={`btn btn-sm d-flex align-items-center gap-2 ${post.isLikedByCurrentUser ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={togglePostLike}>
                <i className={`isax ${post.isLikedByCurrentUser ? 'isax-heart5' : 'isax-heart'} fs-16`} />
                {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
              </button>
              <span className="d-flex align-items-center gap-2 text-muted fs-14">
                <i className="isax isax-message-text fs-16" />
                {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
              </span>
              <span className="d-flex align-items-center gap-2 text-muted fs-14">
                <i className="isax isax-eye fs-16" /> {post.viewsCount} Views
              </span>
            </div>
          </div>
        </div>

        {/* ── Add comment ───────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            {/* CHALLENGE header for comment form */}
            {isChallenge ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                padding: '10px 14px', borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(78,20,32,0.06) 0%, rgba(78,20,32,0.03) 100%)',
                border: '1px solid rgba(78,20,32,0.12)',
              }}>
                <i className="isax isax-crown" style={{ color: '#C5912C', fontSize: 18 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#4E1420' }}>
                    {t('community.yourChallengeResponse', 'Your Challenge Response')}
                  </div>
                  <div style={{ fontSize: 12, color: '#9B7B50' }}>
                    {t('community.challengeCommentHint', 'Share your work, result, or feedback below!')}
                  </div>
                </div>
              </div>
            ) : (
              <h6 className="fw-bold mb-3">Add a Comment</h6>
            )}

            {commentError && <div className="alert alert-danger py-2 mb-3">{commentError}</div>}

            <textarea
              ref={commentInputRef}
              className="form-control mb-3"
              rows={3}
              placeholder="Share your thoughts…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            />

            {/* hidden file input for achievement */}
            <input
              ref={achievementFileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
              style={{ display: 'none' }}
              onChange={handleAchievementFileSelect}
            />

            {/* ── Achievement section — CHALLENGE posts only ─────────────── */}
            {isChallenge && !currentUserAlreadyHasAchievement && (
              <div className="mb-3">
                {/* toggle to attach achievement */}
                <label
                  className="d-flex align-items-center gap-2 mb-0"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={attachAchievement}
                    onChange={(e) => {
                      setAttachAchievement(e.target.checked);
                      setShowAchievementPicker(e.target.checked);
                      if (!e.target.checked) removeAchievementFile();
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#C5912C' }}>
                    🏆 {t('community.attachAchievement', 'Attach your achievement to this response')}
                  </span>
                </label>

                {attachAchievement && (
                  <div style={{
                    marginTop: 12,
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(197,145,44,0.08) 0%, rgba(197,145,44,0.04) 100%)',
                    border: '1.5px solid rgba(197,145,44,0.3)',
                  }}>
                    {/* achievement description */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 13, color: '#4E1420' }}>
                        Achievement description <span className="text-muted fw-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Completed the challenge in under 2 hours!"
                        maxLength={200}
                        value={achievementText}
                        onChange={(e) => setAchievementText(e.target.value)}
                      />
                      <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                        {achievementText.length}/200
                      </div>
                    </div>

                    {/* icon picker */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 13, color: '#4E1420' }}>
                        Choose an icon
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {ACHIEVEMENT_ICONS.map(({ icon, label }) => (
                          <button
                            key={icon}
                            type="button"
                            title={label}
                            onClick={() => setSelectedAchievementIcon(icon)}
                            style={{
                              width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer',
                              fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: selectedAchievementIcon === icon
                                ? 'rgba(197,145,44,0.3)'
                                : 'rgba(255,255,255,0.8)',
                              outline: selectedAchievementIcon === icon
                                ? '2px solid #C5912C'
                                : '1.5px solid rgba(0,0,0,0.08)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* file upload */}
                    <div className="mb-2">
                      <label className="form-label fw-semibold" style={{ fontSize: 13, color: '#4E1420' }}>
                        Upload proof <span className="text-muted fw-normal">(image or PDF, optional)</span>
                      </label>

                      {achievementFile ? (
                        /* preview / file attached */
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(197,145,44,0.3)',
                        }}>
                          {achievementFile.type === 'application/pdf' ? (
                            <i className="isax isax-document-text fs-24" style={{ color: '#C5912C' }} />
                          ) : (
                            <img
                              src={achievementFileUrl || URL.createObjectURL(achievementFile)}
                              alt="preview"
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                            />
                          )}
                          <div className="flex-grow-1">
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#4E1420' }}>
                              {achievementFile.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#9B7B50' }}>
                              {achievementFileUploading
                                ? '⏳ Uploading…'
                                : achievementFileUrl ? '✅ Ready' : '❌ Upload failed'}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            onClick={removeAchievementFile}
                            title="Remove file"
                          >
                            <i className="isax isax-close-circle fs-14" />
                          </button>
                        </div>
                      ) : (
                        /* choose file button */
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                          style={{ borderStyle: 'dashed' }}
                          onClick={() => achievementFileRef.current?.click()}
                          disabled={achievementFileUploading}
                        >
                          <i className="isax isax-document-upload fs-16" />
                          Choose image or PDF
                        </button>
                      )}
                    </div>

                    <div className="mt-2" style={{ fontSize: 11, color: '#9B7B50' }}>
                      <i className="isax isax-info-circle me-1" />
                      You can only submit one achievement per challenge. Choose wisely!
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Already-submitted achievement notice */}
            {isChallenge && currentUserAlreadyHasAchievement && (
              <div className="mb-3 d-flex align-items-center gap-2" style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(197,145,44,0.08)', border: '1px solid rgba(197,145,44,0.25)',
                fontSize: 13, color: '#9B7B50',
              }}>
                <span style={{ fontSize: 16 }}>🏆</span>
                {t('community.achievementAlreadySubmitted', 'You already submitted your achievement for this challenge.')}
              </div>
            )}

            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={submitComment}
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? <Spin size="small" /> : <i className="isax isax-send-2 fs-16" />}
              Post Comment
            </button>
          </div>
        </div>

        {/* ── Comments ───────────────────────────────────────────────────────── */}
        <div className="mb-2 d-flex align-items-center gap-2">
          <h6 className="fw-bold mb-0">Comments</h6>
          <span className="badge bg-secondary rounded-pill">{post.commentsCount}</span>
        </div>

        {commentsLoading && commentsPage === 0 ? (
          <div className="d-flex justify-content-center py-4"><Spin /></div>
        ) : comments.length === 0 ? (
          <p className="text-muted fs-14">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {comments.map((comment) => (
              <div key={comment.id} className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  {/* Achievement badge strip — shown if comment has achievement */}
                  {(comment.achievementText || comment.achievementFileUrl) && (
                    <div style={{
                      marginBottom: 10,
                      padding: '10px 14px', borderRadius: 10,
                      background: 'linear-gradient(90deg, rgba(197,145,44,0.12) 0%, rgba(197,145,44,0.06) 100%)',
                      border: '1px solid rgba(197,145,44,0.3)',
                    }}>
                      {/* icon + text row */}
                      {comment.achievementText && (
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span style={{ fontSize: 20 }}>{comment.achievementIcon || '🏆'}</span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#7A5C00' }}>
                            {comment.achievementText}
                          </span>
                        </div>
                      )}
                      {/* attached file */}
                      {comment.achievementFileUrl && (() => {
                        const url = getFileUrl(comment.achievementFileUrl) ?? comment.achievementFileUrl;
                        const isPdf = comment.achievementFileUrl.toLowerCase().includes('.pdf');
                        return isPdf ? (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="d-flex align-items-center gap-2 text-decoration-none"
                            style={{ fontSize: 13, color: '#C5912C', fontWeight: 600 }}>
                            <i className="isax isax-document-text fs-18" />
                            View PDF attachment
                          </a>
                        ) : (
                          <img
                            src={url}
                            alt="achievement"
                            style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, objectFit: 'contain', display: 'block', marginTop: comment.achievementText ? 8 : 0 }}
                          />
                        );
                      })()}
                    </div>
                  )}

                  <div className="d-flex align-items-start gap-3">
                    <BadgeAvatar
                      avatarUrl={avatarUrl(comment.userAvatar)}
                      name={comment.userName}
                      badge={getBadgeFromRole((comment as any).userRole)}
                      size="sm"
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-semibold fs-14">{comment.userName}</span>
                        <span className="text-muted fs-12">{formatDate(comment.createdAt)}</span>
                        {comment.isEdited && (
                          <span className="text-muted fs-11">(edited)</span>
                        )}
                      </div>
                      <p className="mb-2 fs-14" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {comment.content}
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm py-0 d-flex align-items-center gap-1 ${comment.isLikedByCurrentUser ? 'btn-danger' : 'btn-outline-secondary'}`}
                          onClick={() => toggleCommentLike(comment)}
                        >
                          <i className={`isax ${comment.isLikedByCurrentUser ? 'isax-heart5' : 'isax-heart'} fs-12`} />
                          <span className="fs-12">{comment.likesCount}</span>
                        </button>
                        {(comment.userId === user?.id || effectiveRole === 'ADMIN') && (
                          <button
                            type="button"
                            className="btn btn-sm py-0 btn-outline-danger d-flex align-items-center gap-1"
                            onClick={async () => {
                              if (!window.confirm(t('community.confirmDeleteComment', 'Delete this comment?'))) return;
                              try {
                                await communityService.deleteComment(comment.id);
                                setComments((prev) => prev.filter((c) => c.id !== comment.id));
                                setPost((p) => p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p);
                              } catch { /* silent */ }
                            }}
                          >
                            <i className="isax isax-trash fs-12" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {commentsPage < commentsTotalPages - 1 && (
              <div className="text-center pt-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={loadMoreComments}
                  disabled={commentsLoading}
                >
                  {commentsLoading ? <Spin size="small" /> : 'Load more comments'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Post Modal ──────────────────────────────────────────────── */}
      <Modal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        closable={false}
        width={600}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
            padding: '20px 24px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: '"Pinyon Script", cursive', color: '#C5912C', fontSize: '1.1rem', lineHeight: 1 }}>
                Edit
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>
                {t('community.editPost', 'Edit Post')}
              </div>
            </div>
            <button type="button" onClick={() => setEditModalOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="isax isax-close-circle" />
            </button>
          </div>

          <div style={{ padding: '24px', background: 'var(--sl-ivory, #F2EFE8)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {editError && <div className="alert alert-danger py-2 mb-0">{editError}</div>}

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#651C32', marginBottom: 8, display: 'block' }}>
                {t('community.titleLabel', 'Title')} <span style={{ color: '#B03060' }}>*</span>
              </label>
              <input type="text"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(101,28,50,0.2)', fontSize: 14, outline: 'none', background: '#fff', color: '#2C1810' }}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#651C32', marginBottom: 8, display: 'block' }}>
                {t('community.contentLabel', 'Content')} <span style={{ color: '#B03060' }}>*</span>
              </label>
              <textarea
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(101,28,50,0.2)', fontSize: 14, outline: 'none', background: '#fff', color: '#2C1810', resize: 'vertical', minHeight: 120 }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#651C32', marginBottom: 8, display: 'block' }}>
                {t('community.attachImage', 'Image (optional)')}
              </label>
              <input ref={editImageInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }} onChange={handleEditImageSelect} />
              {editImageUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={getFileUrl(editImageUrl) ?? editImageUrl} alt="preview"
                    style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'cover', border: '1.5px solid rgba(101,28,50,0.15)' }} />
                  <button type="button" onClick={() => setEditImageUrl(null)}
                    style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    ✕
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => editImageInputRef.current?.click()} disabled={editImageUploading}
                  style={{ padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: '1.5px dashed rgba(101,28,50,0.3)', background: '#fff', color: '#651C32', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editImageUploading
                    ? <><Spin size="small" /> {t('community.uploadingImage', 'Uploading…')}</>
                    : <><i className="isax isax-image fs-16" /> {t('community.chooseImage', 'Choose Image')}</>}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button type="button" onClick={() => setEditModalOpen(false)}
                style={{ padding: '11px 24px', borderRadius: 10, border: '1.5px solid rgba(101,28,50,0.2)', background: '#fff', color: '#651C32', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button type="button" onClick={submitEdit}
                disabled={editSubmitting || !editTitle.trim() || !editContent.trim()}
                style={{
                  padding: '11px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 50%, #C5912C 100%)',
                  color: '#4E1420', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  opacity: (editSubmitting || !editTitle.trim() || !editContent.trim()) ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                {editSubmitting ? <Spin size="small" /> : <i className="isax isax-edit-2" />}
                {t('community.saveChanges', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </LuxuryDashboardLayout>
  );
};

export default CommunityPostDetail;
