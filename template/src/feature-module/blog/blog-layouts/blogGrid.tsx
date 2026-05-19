import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { App, Spin } from 'antd';
import { communityService } from '../../../services/api/community.service';
import { CommunityPost as Post, CommunityComment, PostType } from '../../../services/api/types';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';

// ── helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return lang === 'ar' ? 'اليوم' : 'Today';
  if (days === 1) return lang === 'ar' ? 'أمس' : 'Yesterday';
  if (days < 7)  return lang === 'ar' ? `منذ ${days} أيام` : `${days} days ago`;
  return new Date(dateStr).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Gold-tone brand palette for post types
const TYPE_COLORS: Record<PostType, { bg: string; text: string }> = {
  DISCUSSION:   { bg: 'rgba(101,28,50,0.08)',   text: 'var(--sl-burgundy)' },
  QUESTION:     { bg: 'rgba(29,60,52,0.10)',     text: 'var(--sl-forest)'  },
  ANNOUNCEMENT: { bg: 'rgba(197,145,44,0.12)',   text: 'var(--sl-gold)'    },
  RESOURCE:     { bg: 'rgba(101,28,50,0.06)',    text: 'var(--sl-crimson)' },
};

const ALL_TYPES: PostType[] = ['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'RESOURCE'];

// ── Post detail modal ─────────────────────────────────────────────────────────
const PostModal: React.FC<{
  postId: string | null;
  onClose: () => void;
  isAuthenticated: boolean;
}> = ({ postId, onClose, isAuthenticated }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAppSelector(s => s.auth);

  const [post,    setPost]    = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const [comments,      setComments]      = useState<CommunityComment[]>([]);
  const [cmtLoading,    setCmtLoading]    = useState(false);
  const [cmtPage,       setCmtPage]       = useState(0);
  const [cmtTotalPages, setCmtTotalPages] = useState(0);
  const [newComment,    setNewComment]    = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const TYPE_COLORS: Record<PostType, { bg: string; text: string }> = {
    DISCUSSION:   { bg: 'rgba(101,28,50,0.08)', text: 'var(--sl-burgundy)' },
    QUESTION:     { bg: 'rgba(29,60,52,0.10)',  text: 'var(--sl-forest)'  },
    ANNOUNCEMENT: { bg: 'rgba(197,145,44,0.12)', text: 'var(--sl-gold)'   },
    RESOURCE:     { bg: 'rgba(101,28,50,0.06)',  text: 'var(--sl-crimson)' },
  };
  const TYPE_LABELS: Record<PostType, string> = {
    DISCUSSION: t('community.type.DISCUSSION'),
    QUESTION:   t('community.type.QUESTION'),
    ANNOUNCEMENT: t('community.type.ANNOUNCEMENT'),
    RESOURCE:   t('community.type.RESOURCE'),
  };

  // fetch post + comments when postId changes
  useEffect(() => {
    if (!postId) { setPost(null); setComments([]); return; }
    setLoading(true); setPost(null); setComments([]); setCmtPage(0); setActiveImg(0);
    communityService.getPostById(postId)
      .then(p => { setPost(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (!postId || !post) return;
    setCmtLoading(true);
    communityService.getPostComments(postId, 0, 20)
      .then(r => { setComments(r.content ?? []); setCmtTotalPages(r.totalPages ?? 0); })
      .catch(() => {})
      .finally(() => setCmtLoading(false));
  }, [postId, post]);

  const loadMoreComments = async () => {
    if (!postId) return;
    const next = cmtPage + 1;
    setCmtPage(next); setCmtLoading(true);
    try {
      const r = await communityService.getPostComments(postId, next, 20);
      setComments(prev => [...prev, ...(r.content ?? [])]);
      setCmtTotalPages(r.totalPages ?? 0);
    } catch {} finally { setCmtLoading(false); }
  };

  const toggleLike = async () => {
    if (!post || !isAuthenticated) return;
    const was = post.isLikedByCurrentUser;
    setPost(p => p ? { ...p, isLikedByCurrentUser: !was, likesCount: p.likesCount + (was ? -1 : 1) } : p);
    try {
      if (was) await communityService.unlikePost(post.id);
      else     await communityService.likePost(post.id);
    } catch {
      setPost(p => p ? { ...p, isLikedByCurrentUser: was, likesCount: p.likesCount + (was ? 1 : -1) } : p);
    }
  };

  const toggleCommentLike = async (c: CommunityComment) => {
    if (!isAuthenticated) return;
    const was = c.isLikedByCurrentUser;
    setComments(prev => prev.map(x => x.id === c.id ? { ...x, isLikedByCurrentUser: !was, likesCount: x.likesCount + (was ? -1 : 1) } : x));
    try {
      if (was) await communityService.unlikeComment(c.id);
      else     await communityService.likeComment(c.id);
    } catch {
      setComments(prev => prev.map(x => x.id === c.id ? { ...x, isLikedByCurrentUser: was, likesCount: x.likesCount + (was ? 1 : -1) } : x));
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !postId || submitting) return;
    setSubmitting(true);
    try {
      const created = await communityService.addComment(postId, newComment.trim());
      setComments(prev => [created, ...prev]);
      setPost(p => p ? { ...p, commentsCount: p.commentsCount + 1 } : p);
      setNewComment('');
      textRef.current?.focus();
    } catch {} finally { setSubmitting(false); }
  };

  // lock body scroll while open
  useEffect(() => {
    if (postId) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [postId]);

  if (!postId) return null;

  const images = post?.images?.filter(Boolean) ?? [];
  const avatar = getFileUrl(post?.userAvatar);
  const initials = post?.userName?.slice(0, 2).toUpperCase() ?? '??';
  const typeColor = post ? TYPE_COLORS[post.postType] : TYPE_COLORS.DISCUSSION;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(30,5,15,0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--sl-ivory, #F2EFE8)',
        width: '100%', maxWidth: 780,
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(30,5,15,0.45)',
        border: '1px solid rgba(197,145,44,0.2)',
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        overflowY: 'auto',
      }}>
        {/* ── Gold top bar ── */}
        <div style={{
          height: 3, flexShrink: 0,
          background: 'linear-gradient(90deg, transparent 0%, #C5912C 30%, #DEBB6B 50%, #C5912C 70%, transparent 100%)',
        }} />

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.75rem 1rem',
          borderBottom: '1px solid rgba(197,145,44,0.12)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {post && (
              <span style={{
                background: typeColor.bg, color: typeColor.text,
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', padding: '0.3rem 0.8rem',
                fontFamily: 'var(--sl-font-body)',
              }}>
                {TYPE_LABELS[post.postType]}
              </span>
            )}
            {post?.isPinned && (
              <span style={{
                background: 'rgba(197,145,44,0.12)', color: 'var(--sl-gold)',
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '0.3rem 0.8rem',
                fontFamily: 'var(--sl-font-body)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <i className="fa-solid fa-thumbtack" style={{ fontSize: '0.5rem' }} />
                {t('community.pinned')}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(101,28,50,0.06)', border: '1px solid rgba(101,28,50,0.15)',
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(101,28,50,0.6)', fontSize: 16, flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(101,28,50,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(101,28,50,0.06)'; }}
          >
            <i className="isax isax-close-circle" />
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: 200 }}>
            <Spin size="large" />
          </div>
        ) : !post ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(101,28,50,0.5)', fontFamily: 'var(--sl-font-body)' }}>
            {t('community.noPost')}
          </div>
        ) : (
          <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>

            {/* Title */}
            <h2 style={{
              fontFamily: 'var(--sl-font-display)',
              fontSize: 'clamp(1.2rem, 3vw, 1.65rem)', fontWeight: 700,
              color: 'var(--sl-burgundy)', lineHeight: 1.3,
              marginBottom: '1rem',
            }}>
              {post.title}
            </h2>

            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              {avatar ? (
                <img src={avatar} alt={post.userName} style={{
                  width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                  border: '2px solid rgba(197,145,44,0.3)',
                }} />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--sl-burgundy)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-gold)',
                  border: '2px solid rgba(197,145,44,0.3)',
                }}>
                  {initials}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontFamily: 'var(--sl-font-body)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--sl-burgundy)' }}>
                  {post.userName}
                </p>
                <p style={{ margin: 0, fontFamily: 'var(--sl-font-body)', fontSize: '0.72rem', color: 'rgba(101,28,50,0.5)' }}>
                  {formatDate(post.createdAt)}
                  {post.isEdited && <span style={{ marginLeft: 6, fontSize: '0.65rem' }}>· {t('community.edited')}</span>}
                </p>
              </div>
            </div>

            {/* ── Images gallery ── */}
            {images.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Main image */}
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  borderRadius: 0, maxHeight: 380,
                  background: '#000',
                  border: '1px solid rgba(197,145,44,0.15)',
                }}>
                  <img
                    src={getFileUrl(images[activeImg]) ?? images[activeImg]}
                    alt={`image-${activeImg}`}
                    style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                        disabled={activeImg === 0}
                        style={{
                          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff',
                          width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: activeImg === 0 ? 0.3 : 1,
                        }}
                      ><i className="fa-solid fa-chevron-left" /></button>
                      <button
                        onClick={() => setActiveImg(i => Math.min(images.length - 1, i + 1))}
                        disabled={activeImg === images.length - 1}
                        style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff',
                          width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: activeImg === images.length - 1 ? 0.3 : 1,
                        }}
                      ><i className="fa-solid fa-chevron-right" /></button>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveImg(i)}
                        style={{
                          width: 52, height: 52, cursor: 'pointer',
                          border: activeImg === i ? '2px solid #C5912C' : '2px solid transparent',
                          overflow: 'hidden', flexShrink: 0,
                          opacity: activeImg === i ? 1 : 0.65,
                          transition: 'all 0.2s',
                        }}
                      >
                        <img
                          src={getFileUrl(img) ?? img}
                          alt={`thumb-${i}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div style={{
              fontFamily: 'var(--sl-font-body)',
              fontSize: '0.92rem', lineHeight: 1.75,
              color: 'rgba(58,30,32,0.85)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              marginBottom: '1.5rem',
            }}>
              {post.content}
            </div>

            {/* Stats + like button */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '1rem 0', borderTop: '1px solid rgba(197,145,44,0.12)',
              borderBottom: '1px solid rgba(197,145,44,0.12)',
              marginBottom: '1.75rem', flexWrap: 'wrap',
            }}>
              <button
                onClick={toggleLike}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: post.isLikedByCurrentUser ? 'rgba(180,30,50,0.08)' : 'transparent',
                  border: post.isLikedByCurrentUser ? '1px solid rgba(180,30,50,0.25)' : '1px solid rgba(101,28,50,0.15)',
                  padding: '6px 14px', cursor: isAuthenticated ? 'pointer' : 'default',
                  fontFamily: 'var(--sl-font-body)', fontSize: '0.78rem', fontWeight: 600,
                  color: post.isLikedByCurrentUser ? '#B41E32' : 'rgba(101,28,50,0.6)',
                  transition: 'all 0.2s',
                }}
              >
                <i className={post.isLikedByCurrentUser ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                {post.likesCount} {t('community.like')}
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sl-font-body)', fontSize: '0.78rem', color: 'rgba(101,28,50,0.5)' }}>
                <i className="isax isax-message-2" /> {post.commentsCount} {t('community.reply')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sl-font-body)', fontSize: '0.78rem', color: 'rgba(101,28,50,0.5)' }}>
                <i className="isax isax-eye" /> {post.viewsCount}
              </span>
            </div>

            {/* ── Add comment ── */}
            {isAuthenticated && (
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.55)', marginBottom: 8 }}>
                  {t('community.addComment')}
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {user?.avatarUrl ? (
                    <img src={getFileUrl(user.avatarUrl)} alt="me" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(197,145,44,0.25)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--sl-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--sl-gold)', flexShrink: 0 }}>
                      {user?.fullName?.slice(0, 2).toUpperCase() ?? 'ME'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <textarea
                      ref={textRef}
                      rows={2}
                      placeholder={t('community.commentPlaceholder')}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                      style={{
                        width: '100%', padding: '10px 14px', resize: 'none',
                        border: '1px solid rgba(101,28,50,0.18)',
                        background: '#fff', outline: 'none',
                        fontFamily: 'var(--sl-font-body)', fontSize: '0.85rem',
                        color: 'var(--sl-burgundy)', lineHeight: 1.5,
                      }}
                    />
                    <button
                      onClick={submitComment}
                      disabled={submitting || !newComment.trim()}
                      className="sl-btn-gold sl-btn-magnetic"
                      style={{ marginTop: 6, padding: '7px 20px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {submitting ? <Spin size="small" /> : <i className="isax isax-send-2" />}
                      {t('community.post')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Comments list ── */}
            <div>
              <p style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.55)', marginBottom: '1rem' }}>
                {t('community.reply')} · {post.commentsCount}
              </p>

              {cmtLoading && cmtPage === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spin /></div>
              ) : comments.length === 0 ? (
                <p style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.85rem', color: 'rgba(101,28,50,0.4)', textAlign: 'center', padding: '1.5rem 0' }}>
                  {t('community.noCommentsYet')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comments.map(c => {
                    const cAvatar = getFileUrl(c.userAvatar);
                    const cInitials = c.userName?.slice(0, 2).toUpperCase() ?? '??';
                    return (
                      <div key={c.id} style={{
                        display: 'flex', gap: 10,
                        padding: '1rem',
                        background: '#fff', border: '1px solid rgba(197,145,44,0.1)',
                      }}>
                        {cAvatar ? (
                          <img src={cAvatar} alt={c.userName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(197,145,44,0.2)', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sl-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--sl-gold)', flexShrink: 0 }}>
                            {cInitials}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sl-burgundy)' }}>
                              {c.userName}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.65rem', color: 'rgba(101,28,50,0.4)' }}>
                                {timeAgo(c.createdAt, i18n.language)}
                              </span>
                              <button
                                onClick={() => toggleCommentLike(c)}
                                style={{
                                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  fontFamily: 'var(--sl-font-body)', fontSize: '0.7rem',
                                  color: c.isLikedByCurrentUser ? '#B41E32' : 'rgba(101,28,50,0.45)',
                                }}
                              >
                                <i className={c.isLikedByCurrentUser ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                                {c.likesCount > 0 && c.likesCount}
                              </button>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontFamily: 'var(--sl-font-body)', fontSize: '0.84rem', color: 'rgba(58,30,32,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {c.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load more */}
              {cmtPage < cmtTotalPages - 1 && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={loadMoreComments}
                    disabled={cmtLoading}
                    style={{
                      background: 'transparent', border: '1px solid rgba(197,145,44,0.3)',
                      padding: '8px 24px', cursor: 'pointer', fontFamily: 'var(--sl-font-body)',
                      fontSize: '0.72rem', color: '#9A6F1A',
                    }}
                  >
                    {cmtLoading ? <Spin size="small" /> : t('community.loadMore')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
};

// ── Post card ─────────────────────────────────────────────────────────────────
const PostCard: React.FC<{
  post: Post;
  liking: boolean;
  onLike: (p: Post) => void;
  index: number;
}> = ({ post, liking, onLike, index }) => {
  const { t, i18n } = useTranslation();
  const avatar = getFileUrl(post.userAvatar);
  const { bg, text: textColor } = TYPE_COLORS[post.postType] ?? TYPE_COLORS.DISCUSSION;
  const images = post.images?.filter(Boolean) ?? [];
  const initials = post.userName?.slice(0, 2).toUpperCase() ?? '??';

  const TYPE_LABELS: Record<PostType, string> = {
    DISCUSSION:   t('community.type.DISCUSSION'),
    QUESTION:     t('community.type.QUESTION'),
    ANNOUNCEMENT: t('community.type.ANNOUNCEMENT'),
    RESOURCE:     t('community.type.RESOURCE'),
  };

  return (
    <div
      className="sl-cl-card"
      data-aos="fade-up"
      data-aos-delay={String(index * 60)}
      data-aos-duration="700"
      style={{ flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Post image */}
      {images.length > 0 && (
        <div style={{ position: 'relative', overflow: 'hidden', height: 200, flexShrink: 0 }}>
          <img
            src={getFileUrl(images[0]) ?? images[0]}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(60,10,25,0.55) 0%, transparent 60%)',
          }} />
        </div>
      )}

      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.9rem' }}>
          <span style={{
            background: bg, color: textColor,
            fontFamily: 'var(--sl-font-body)',
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', padding: '0.28rem 0.75rem',
          }}>
            {TYPE_LABELS[post.postType]}
          </span>
          {post.isPinned && (
            <span style={{
              background: 'rgba(197,145,44,0.12)', color: 'var(--sl-gold)',
              fontFamily: 'var(--sl-font-body)',
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0.28rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <i className="fa-solid fa-thumbtack" style={{ fontSize: '0.5rem' }} />
              {t('community.pinned')}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 style={{
          fontFamily: 'var(--sl-font-display)',
          fontSize: '1.05rem', fontWeight: 600,
          color: 'var(--sl-burgundy)', lineHeight: 1.4,
          marginBottom: '0.65rem',
        }}>
          <Link
            to={`/community/${post.id}`}
            style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sl-crimson)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--sl-burgundy)'; }}
          >
            {post.title}
          </Link>
        </h4>

        {/* Content preview */}
        <p style={{
          fontFamily: 'var(--sl-font-body)',
          color: 'rgba(58,30,32,0.6)', fontSize: '0.88rem', lineHeight: 1.65,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: '1.1rem', flex: 1,
        }}>
          {post.content}
        </p>

        {/* Gold divider */}
        <div className="sl-gold-bar" style={{ margin: '0 0 1rem' }} />

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {avatar ? (
              <img src={avatar} alt={post.userName} style={{
                width: 30, height: 30, borderRadius: '50%', objectFit: 'cover',
                border: '1.5px solid rgba(197,145,44,0.3)',
              }} />
            ) : (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--sl-burgundy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.62rem', fontWeight: 700, color: 'var(--sl-gold)',
                border: '1.5px solid rgba(197,145,44,0.3)',
              }}>
                {initials}
              </div>
            )}
            <span style={{
              fontFamily: 'var(--sl-font-body)',
              fontSize: '0.72rem', fontWeight: 600,
              color: 'rgba(58,30,32,0.75)',
            }}>
              {post.userName}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(58,30,32,0.45)', fontFamily: 'var(--sl-font-body)' }}>
              <i className="isax isax-calendar-1 me-1" />
              {timeAgo(post.createdAt, i18n.language)}
            </span>
            <button
              onClick={() => onLike(post)}
              disabled={liking}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--sl-font-body)',
                fontSize: '0.72rem',
                color: post.isLikedByCurrentUser ? 'var(--sl-crimson)' : 'rgba(58,30,32,0.45)',
                transition: 'color 0.2s',
              }}
            >
              <i className={post.isLikedByCurrentUser ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
              {post.likesCount}
            </button>
            <span style={{ fontSize: '0.72rem', color: 'rgba(58,30,32,0.45)', fontFamily: 'var(--sl-font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="isax isax-message-2" />{post.commentsCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(58,30,32,0.45)', fontFamily: 'var(--sl-font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="isax isax-eye" />{post.viewsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonPost: React.FC = () => (
  <div className="sl-cl-skeleton">
    <div className="sl-cl-skeleton__body" style={{ padding: '1.5rem' }}>
      <div className="sl-cl-skeleton__line" style={{ width: '25%', height: 20, marginBottom: 14 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '90%', height: 22, marginBottom: 8 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '75%', height: 14, marginBottom: 6 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '55%', height: 14, marginBottom: 24 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="sl-cl-skeleton__line" style={{ width: 80, height: 28 }} />
        <div className="sl-cl-skeleton__line" style={{ width: 120, height: 28 }} />
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const BlogGrid = () => {
  const { t } = useTranslation();
  const route = all_routes;
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const canPost = isAuthenticated && (
    user?.subscriptionStatus === 'ACTIVE' ||
    user?.role === 'ADMIN' ||
    user?.role === 'INSTRUCTOR'
  );
  const { message } = App.useApp();

  const [posts,         setPosts]         = useState<Post[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage,   setCurrentPage]   = useState(0);
  const [activeType,    setActiveType]    = useState<PostType | undefined>(undefined);
  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [liking,        setLiking]        = useState<Set<string>>(new Set());

  const [selectedPostId,    setSelectedPostId]    = useState<string | null>(null);
  const [showCreate,        setShowCreate]        = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [newTitle,          setNewTitle]          = useState('');
  const [newContent,        setNewContent]        = useState('');
  const [newType,           setNewType]           = useState<PostType>('DISCUSSION');
  const [creating,          setCreating]          = useState(false);

  // Image upload
  const [_imageFile,     setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedUrl,    setUploadedUrl]    = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 6;

  const TYPE_LABELS: Record<PostType, string> = {
    DISCUSSION:   t('community.type.DISCUSSION'),
    QUESTION:     t('community.type.QUESTION'),
    ANNOUNCEMENT: t('community.type.ANNOUNCEMENT'),
    RESOURCE:     t('community.type.RESOURCE'),
  };

  useEffect(() => {
    AOS.init({ once: true, easing: 'ease-out-cubic', duration: 800, offset: 40 });
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await communityService.getPosts(currentPage, PAGE_SIZE, activeType, search || undefined);
      setPosts(result.content ?? []);
      setTotalPages(result.totalPages ?? 0);
      setTotalElements(result.totalElements ?? 0);
    } catch {} finally { setLoading(false); }
  }, [currentPage, activeType, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setCurrentPage(0); }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleLike = async (post: Post) => {
    if (!isAuthenticated) { message.warning(t('community.loginToLike')); return; }
    if (liking.has(post.id)) return;
    setLiking(p => new Set(p).add(post.id));
    try {
      if (post.isLikedByCurrentUser) {
        await communityService.unlikePost(post.id);
        setPosts(p => p.map(x => x.id === post.id ? { ...x, isLikedByCurrentUser: false, likesCount: x.likesCount - 1 } : x));
      } else {
        await communityService.likePost(post.id);
        setPosts(p => p.map(x => x.id === post.id ? { ...x, isLikedByCurrentUser: true, likesCount: x.likesCount + 1 } : x));
      }
    } catch { message.error(t('community.errorLike')); }
    finally { setLiking(p => { const n = new Set(p); n.delete(post.id); return n; }); }
  };

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    setUploadedUrl(null);
    try {
      const url = await communityService.uploadPostImage(file);
      setUploadedUrl(url);
    } catch {
      message.error(t('community.errorImageUpload'));
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim()) { message.warning(t('community.errorRequired')); return; }
    if (!newContent.trim()) { message.warning(t('community.errorRequired')); return; }
    if (uploadingImage) { message.warning(t('community.waitForUpload')); return; }
    try {
      setCreating(true);
      const created = await communityService.createPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        postType: newType,
        ...(uploadedUrl ? { imageUrls: [uploadedUrl] } : {}),
      });
      setPosts(p => [created, ...p]);
      setNewTitle(''); setNewContent(''); setNewType('DISCUSSION');
      removeImage();
      setShowCreate(false);
      message.success(t('community.postPublished'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('community.errorCreate');
      message.error(msg);
    }
    finally { setCreating(false); }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - (currentPage + 1)) <= 1)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
      acc.push(p); return acc;
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
              <span className="sl-script" style={{ fontSize: '1.7rem' }}>{t('community.heroScript')}</span>
            </div>
            <h1 className="sl-cl-hero__title" data-aos="fade-up" data-aos-delay="80" data-aos-duration="700">
              {t('community.title')}
            </h1>
            <p className="sl-cl-hero__sub" data-aos="fade-up" data-aos-delay="160" data-aos-duration="700">
              {t('community.heroSub')}
            </p>

            {/* Search + New Post */}
            <div
              className="sl-cl-hero__search"
              style={{ display: 'flex', gap: 0 }}
              data-aos="fade-up" data-aos-delay="240" data-aos-duration="700"
            >
              <i className="isax isax-search-normal-1" style={{ pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={t('community.heroSearchPlaceholder')}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {isAuthenticated && (
                <button
                  type="button"
                  className="sl-cl-hero__search-btn"
                  onClick={() => canPost ? setShowCreate(true) : setShowUpgradePrompt(true)}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <i className="isax isax-add-circle" />
                  {t('community.newPost')}
                </button>
              )}
            </div>

            <nav className="sl-cl-hero__breadcrumb" data-aos="fade-up" data-aos-delay="300" data-aos-duration="700">
              <Link to={route.homeone}>{t('nav.home')}</Link>
              <span>✦</span>
              <span>{t('community.title')}</span>
            </nav>
          </div>
        </div>
        <div className="sl-cinematic-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      {/* ── Main content ── */}
      <section className="sl-cl-page">
        <div className="container">

          {/* Type filter tabs */}
          <div
            className="sl-cl-toolbar"
            data-aos="fade-down" data-aos-duration="600"
            style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                onClick={() => { setActiveType(undefined); setCurrentPage(0); }}
                style={{
                  padding: '6px 18px',
                  fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem',
                  fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                  border: !activeType ? '1px solid var(--sl-gold)' : '1px solid rgba(101,28,50,0.15)',
                  background: !activeType ? 'var(--sl-burgundy)' : 'transparent',
                  color: !activeType ? 'var(--sl-gold)' : 'rgba(101,28,50,0.6)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {t('community.all')}
              </button>
              {ALL_TYPES.map(btype => (
                <button
                  key={btype}
                  onClick={() => { setActiveType(btype); setCurrentPage(0); }}
                  style={{
                    padding: '6px 18px',
                    fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem',
                    fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                    border: activeType === btype ? '1px solid var(--sl-gold)' : '1px solid rgba(101,28,50,0.15)',
                    background: activeType === btype ? 'var(--sl-burgundy)' : 'transparent',
                    color: activeType === btype ? 'var(--sl-gold)' : 'rgba(101,28,50,0.6)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {TYPE_LABELS[btype]}
                </button>
              ))}
            </div>
            {!loading && (
              <p className="sl-cl-toolbar__results" style={{ margin: 0 }}>
                <strong>{totalElements}</strong> {totalElements !== 1 ? t('community.posts') : t('community.post')}
                {activeType && ` · ${TYPE_LABELS[activeType]}`}
                {search && ` · "${search}"`}
              </p>
            )}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="row g-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="col-lg-6"><SkeletonPost /></div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="sl-cl-empty" data-aos="fade-up">
              <div className="sl-ornament">
                <span className="sl-script" style={{ fontSize: '2rem' }}>{t('community.beFirstScript')}</span>
              </div>
              <i className="isax isax-message-text sl-cl-empty__icon" />
              <h4 className="sl-cl-empty__title">{t('community.noPost')}</h4>
              <p className="sl-cl-empty__text">{t('community.noPostDesc')}</p>
              {isAuthenticated && (
                <button
                  className="sl-btn-gold sl-btn-magnetic"
                  onClick={() => canPost ? setShowCreate(true) : setShowUpgradePrompt(true)}
                >
                  {t('community.createPost')} <i className="isax isax-add-circle" />
                </button>
              )}
            </div>
          ) : (
            <div className="row g-4">
              {posts.map((post, i) => (
                <div key={post.id} className="col-lg-6" style={{ display: 'flex', cursor: 'pointer' }}
                  onClick={() => setSelectedPostId(post.id)}>
                  <PostCard
                    post={post}
                    liking={liking.has(post.id)}
                    onLike={handleLike}
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
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              {pageNumbers.map((p, i) =>
                p === '…' ? (
                  <span key={`el-${i}`} className="sl-cl-pagination__ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`sl-cl-pagination__page${currentPage + 1 === p ? ' is-active' : ''}`}
                    onClick={() => setCurrentPage((p as number) - 1)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="sl-cl-pagination__arrow"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ── Post Detail Modal ── */}
      <PostModal
        postId={selectedPostId}
        onClose={() => setSelectedPostId(null)}
        isAuthenticated={isAuthenticated}
      />

      {/* ── Upgrade Prompt Modal ── */}
      {showUpgradePrompt && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(40,8,18,0.72)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setShowUpgradePrompt(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20,
              maxWidth: 420, width: '100%',
              boxShadow: '0 24px 80px rgba(78,20,32,0.25)',
              overflow: 'hidden',
              animation: 'fadeInDown 0.25s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Burgundy header */}
            <div style={{
              background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
              padding: '28px 28px 24px', textAlign: 'center', position: 'relative',
            }}>
              <button
                onClick={() => setShowUpgradePrompt(false)}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(255,255,255,0.12)', border: 'none',
                  borderRadius: '50%', width: 28, height: 28,
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                }}
              >
                <i className="isax isax-close-circle" />
              </button>

              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(197,145,44,0.15)',
                border: '2px solid rgba(197,145,44,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-lock-1" style={{ fontSize: 28, color: '#C5912C' }} />
              </div>

              <div style={{
                fontFamily: '"Pinyon Script", cursive',
                fontSize: '1.2rem', color: 'rgba(197,145,44,0.8)', marginBottom: 6,
              }}>
                {t('community.membersOnly')}
              </div>
              <h4 style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0,
              }}>
                {t('community.subscriptionRequired')}
              </h4>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px 28px', textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--sl-font-body)',
                fontSize: '0.92rem', color: '#5A3A28', lineHeight: 1.65,
                marginBottom: 22,
              }}>
                {t('community.upgradeDesc')}
              </p>

              {/* Feature list */}
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {[
                  t('community.upgradeFeature1'),
                  t('community.upgradeFeature2'),
                  t('community.upgradeFeature3'),
                  t('community.upgradeFeature4'),
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <i className="isax isax-tick-circle" style={{ color: '#1A7F4B', fontSize: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: '#4A3728', fontFamily: 'var(--sl-font-body)' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <button
                onClick={() => { setShowUpgradePrompt(false); navigate(route.pricingPlan); }}
                style={{
                  width: '100%', padding: '13px',
                  background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 50%, #C5912C 100%)',
                  color: '#4E1420', border: 'none', borderRadius: 12,
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(197,145,44,0.35)',
                  marginBottom: 10,
                }}
              >
                <i className="isax isax-crown-1" style={{ fontSize: 18 }} />
                {t('community.viewPlans')}
              </button>
              <button
                onClick={() => setShowUpgradePrompt(false)}
                style={{
                  width: '100%', padding: '11px',
                  background: 'transparent', color: '#9B7B50',
                  border: '1px solid rgba(155,123,80,0.25)', borderRadius: 12,
                  fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer',
                }}
              >
                {t('community.maybeLater')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Post Modal ── */}
      {showCreate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(40,8,18,0.72)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div style={{
            background: 'var(--sl-ivory, #F2EFE8)',
            border: '1px solid rgba(197,145,44,0.25)',
            borderRadius: 0,
            padding: '2.5rem',
            width: '100%', maxWidth: 560,
            boxShadow: '0 32px 80px rgba(40,8,18,0.4)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div className="sl-ornament sl-ornament--left" style={{ marginBottom: '0.25rem' }}>
                  <span className="sl-script" style={{ fontSize: '1.3rem' }}>{t('community.shareScript')}</span>
                </div>
                <h5 style={{ fontFamily: 'var(--sl-font-display)', fontSize: '1.1rem', color: 'var(--sl-burgundy)', margin: 0 }}>
                  {t('community.createPost')}
                </h5>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: 'none', border: '1px solid rgba(101,28,50,0.15)',
                  width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(101,28,50,0.5)', fontSize: 16, transition: 'all 0.2s',
                }}
              >
                <i className="isax isax-close-circle" />
              </button>
            </div>

            {/* Post type */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.6)', display: 'block', marginBottom: 8 }}>
                {t('community.typeLabel')}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ALL_TYPES.map(btype => {
                  const { bg, text: tc } = TYPE_COLORS[btype];
                  return (
                    <button
                      key={btype}
                      onClick={() => setNewType(btype)}
                      style={{
                        padding: '5px 14px', fontSize: '0.65rem', fontWeight: 600,
                        fontFamily: 'var(--sl-font-body)', letterSpacing: '0.12em', textTransform: 'uppercase',
                        border: newType === btype ? `1px solid ${tc}` : '1px solid rgba(101,28,50,0.15)',
                        background: newType === btype ? bg : 'transparent',
                        color: newType === btype ? tc : 'rgba(101,28,50,0.5)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {TYPE_LABELS[btype]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.6)', display: 'block', marginBottom: 6 }}>
                {t('community.titleLabel')} *
              </label>
              <input
                type="text"
                placeholder={t('community.titlePlaceholderAlt')}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                maxLength={200}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid rgba(101,28,50,0.18)',
                  background: '#fff', outline: 'none',
                  fontFamily: 'var(--sl-font-body)', fontSize: '0.9rem',
                  color: 'var(--sl-burgundy)',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Content */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.6)', display: 'block', marginBottom: 6 }}>
                {t('community.contentLabel')} *
              </label>
              <textarea
                placeholder={t('community.contentPlaceholder')}
                rows={5}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid rgba(101,28,50,0.18)',
                  background: '#fff', outline: 'none', resize: 'vertical',
                  fontFamily: 'var(--sl-font-body)', fontSize: '0.88rem',
                  color: 'var(--sl-burgundy)', lineHeight: 1.6,
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Image upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.6)', display: 'block', marginBottom: 6 }}>
                {t('community.attachImage')}
              </label>
              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={imagePreview} alt="preview"
                    style={{ maxHeight: 150, maxWidth: '100%', border: '1px solid rgba(101,28,50,0.18)', display: 'block' }} />
                  {uploadingImage && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(255,255,255,0.75)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', color: 'var(--sl-burgundy)',
                      fontFamily: 'var(--sl-font-body)',
                    }}>
                      <i className="isax isax-refresh me-2" style={{ animation: 'spin 1s linear infinite' }} />
                      {t('community.uploadingImage')}
                    </div>
                  )}
                  {!uploadingImage && (
                    <button type="button" onClick={removeImage}
                      style={{
                        marginTop: 6, background: 'none',
                        border: '1px solid rgba(101,28,50,0.2)',
                        padding: '3px 10px', fontSize: '0.7rem',
                        cursor: 'pointer', color: 'rgba(101,28,50,0.6)',
                        fontFamily: 'var(--sl-font-body)',
                      }}>
                      <i className="isax isax-trash me-1" />
                      {t('community.removeImage')}
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />
                  <button type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'transparent',
                      border: '1px dashed rgba(101,28,50,0.25)',
                      padding: '8px 18px', cursor: 'pointer',
                      fontFamily: 'var(--sl-font-body)', fontSize: '0.75rem',
                      color: 'rgba(101,28,50,0.55)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    <i className="isax isax-image fs-14" />
                    {t('community.chooseImage')}
                  </button>
                  <p style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', color: 'rgba(101,28,50,0.4)', marginTop: 4, marginBottom: 0 }}>
                    {t('community.imageTip')}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="sl-btn-outline"
                style={{ padding: '10px 24px' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreatePost}
                disabled={creating || !newTitle.trim() || !newContent.trim() || uploadingImage}
                className="sl-btn-gold sl-btn-magnetic"
                style={{ padding: '10px 28px' }}
              >
                {creating ? t('community.posting') : t('community.publishPost')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogGrid;
