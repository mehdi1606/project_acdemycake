import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Spin } from 'antd';
import LuxuryDashboardLayout from '../../components/LuxuryDashboardLayout';
import communityService from '../../services/api/community.service';
import { CommunityComment, CommunityPost, PostType } from '../../services/api/types';
import { getFileUrl } from '../../environment';
import { all_routes } from '../router/all_routes';
import { AchievementBadge } from './CommunityPage';

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
  const { t } = useTranslation()
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post,        setPost]        = useState<CommunityPost | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [postError,   setPostError]   = useState('');

  const [comments,          setComments]          = useState<CommunityComment[]>([]);
  const [commentsLoading,   setCommentsLoading]   = useState(false);
  const [commentsPage,      setCommentsPage]      = useState(0);
  const [commentsTotalPages, setCommentsTotalPages] = useState(0);

  const [newComment,        setNewComment]        = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError,      setCommentError]      = useState('');

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

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

  // ── like post ─────────────────────────────────────────────────────────────
  const togglePostLike = async () => {
    if (!post) return;
    const wasLiked = post.isLikedByCurrentUser;
    setPost((p) =>
      p ? { ...p, isLikedByCurrentUser: !wasLiked, likesCount: p.likesCount + (wasLiked ? -1 : 1) } : p
    );
    try {
      if (wasLiked) await communityService.unlikePost(post.id);
      else await communityService.likePost(post.id);
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
      else await communityService.likeComment(comment.id);
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

  // ── submit comment ─────────────────────────────────────────────────────────
  const submitComment = async () => {
    if (!newComment.trim() || !id) return;
    setSubmittingComment(true);
    setCommentError('');
    try {
      const created = await communityService.addComment(id, newComment.trim());
      setComments((prev) => [created, ...prev]);
      setPost((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      setNewComment('');
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
          <button className="btn btn-outline-secondary" onClick={() => navigate(all_routes.community)}>
            <i className="isax isax-arrow-left-2 me-2" /> Back to Community
          </button>
        </div>
      </LuxuryDashboardLayout>
    );
  }

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4" style={{ maxWidth: 820 }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <button type="button" className="btn btn-link p-0 text-decoration-none text-muted fs-14"
                onClick={() => navigate(all_routes.community)}>
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
          {post.postType === 'CHALLENGE' && (
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
            <div className="mb-3 d-flex align-items-center gap-2">
              {post.postType === 'CHALLENGE' ? (
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
                  <i className="fa-solid fa-thumbtack me-1" />Pinned
                </span>
              )}
            </div>

            <h4 className="fw-bold mb-3">{post.title}</h4>

            <div className="d-flex align-items-center gap-2 mb-3">
              <img src={avatarUrl(post.userAvatar)} alt={post.userName} className="rounded-circle"
                style={{ width: 40, height: 40, objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/user/user-02.jpg'; }} />
              <div>
                <p className="mb-0 fw-semibold fs-14">{post.userName}</p>
                <p className="mb-0 text-muted fs-12">{formatDate(post.createdAt)}</p>
              </div>
            </div>

            <div className="fs-15 lh-lg" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {post.content}
            </div>

            {/* Achievement badge */}
            {post.achievementText && post.achievementIcon && (
              <AchievementBadge text={post.achievementText} icon={post.achievementIcon} size="md" />
            )}

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

        {/* Add comment */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            {post.postType === 'CHALLENGE' ? (
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
            <textarea ref={commentInputRef} className="form-control mb-2" rows={3}
              placeholder="Share your thoughts…" value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }} />
            <button className="btn btn-primary d-flex align-items-center gap-2"
              onClick={submitComment} disabled={submittingComment || !newComment.trim()}>
              {submittingComment ? <Spin size="small" /> : <i className="isax isax-send-2 fs-16" />}
              Post Comment
            </button>
          </div>
        </div>

        {/* Comments */}
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
                  <div className="d-flex align-items-start gap-3">
                    <img src={avatarUrl(comment.userAvatar)} alt={comment.userName}
                      className="rounded-circle flex-shrink-0"
                      style={{ width: 34, height: 34, objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/user/user-02.jpg'; }} />
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
                      <button type="button"
                        className={`btn btn-sm py-0 d-flex align-items-center gap-1 ${comment.isLikedByCurrentUser ? 'btn-danger' : 'btn-outline-secondary'}`}
                        onClick={() => toggleCommentLike(comment)}>
                        <i className={`isax ${comment.isLikedByCurrentUser ? 'isax-heart5' : 'isax-heart'} fs-12`} />
                        <span className="fs-12">{comment.likesCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {commentsPage < commentsTotalPages - 1 && (
              <div className="text-center pt-2">
                <button className="btn btn-outline-secondary btn-sm"
                  onClick={loadMoreComments} disabled={commentsLoading}>
                  {commentsLoading ? <Spin size="small" /> : 'Load more comments'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default CommunityPostDetail;
