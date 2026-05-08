import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { App } from 'antd';
import { communityService } from '../../../services/api/community.service';
import { CommunityPost as Post, PostType } from '../../../services/api/types';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';

// ── helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_LABELS: Record<PostType, string> = {
  DISCUSSION:   'Discussion',
  QUESTION:     'Question',
  ANNOUNCEMENT: 'Announcement',
  RESOURCE:     'Resource',
};

// Gold-tone brand palette for post types
const TYPE_COLORS: Record<PostType, { bg: string; text: string }> = {
  DISCUSSION:   { bg: 'rgba(101,28,50,0.08)',   text: 'var(--sl-burgundy)' },
  QUESTION:     { bg: 'rgba(29,60,52,0.10)',     text: 'var(--sl-forest)'  },
  ANNOUNCEMENT: { bg: 'rgba(197,145,44,0.12)',   text: 'var(--sl-gold)'    },
  RESOURCE:     { bg: 'rgba(101,28,50,0.06)',    text: 'var(--sl-crimson)' },
};

const ALL_TYPES: PostType[] = ['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'RESOURCE'];

// ── Post card ─────────────────────────────────────────────────────────────────
const PostCard: React.FC<{
  post: Post;
  liking: boolean;
  onLike: (p: Post) => void;
  index: number;
}> = ({ post, liking, onLike, index }) => {
  const avatar = getFileUrl(post.userAvatar);
  const { bg, text: textColor } = TYPE_COLORS[post.postType] ?? TYPE_COLORS.DISCUSSION;
  const images = post.images?.filter(Boolean) ?? [];
  const initials = post.userName?.slice(0, 2).toUpperCase() ?? '??';

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
              Pinned
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
              {timeAgo(post.createdAt)}
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

  const [showCreate,        setShowCreate]        = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [newTitle,          setNewTitle]          = useState('');
  const [newContent,        setNewContent]        = useState('');
  const [newType,           setNewType]           = useState<PostType>('DISCUSSION');
  const [creating,          setCreating]          = useState(false);

  const PAGE_SIZE = 6;

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
    const t = setTimeout(() => { setSearch(searchInput); setCurrentPage(0); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleLike = async (post: Post) => {
    if (!isAuthenticated) { message.warning('Please login to like posts'); return; }
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
    } catch { message.error('Failed to update like'); }
    finally { setLiking(p => { const n = new Set(p); n.delete(post.id); return n; }); }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim()) { message.warning('Please enter a title'); return; }
    if (!newContent.trim()) { message.warning('Please enter content'); return; }
    try {
      setCreating(true);
      const created = await communityService.createPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        postType: newType,
      });
      setPosts(p => [created, ...p]);
      setNewTitle(''); setNewContent(''); setNewType('DISCUSSION');
      setShowCreate(false);
      message.success('Post published!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create post';
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
              <span className="sl-script" style={{ fontSize: '1.7rem' }}>Connect &amp; Share</span>
            </div>
            <h1 className="sl-cl-hero__title" data-aos="fade-up" data-aos-delay="80" data-aos-duration="700">
              Community
            </h1>
            <p className="sl-cl-hero__sub" data-aos="fade-up" data-aos-delay="160" data-aos-duration="700">
              A space for SARALÖWE students to share, question, and inspire one another
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
                placeholder="Search posts, topics, members…"
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
                  New Post
                </button>
              )}
            </div>

            <nav className="sl-cl-hero__breadcrumb" data-aos="fade-up" data-aos-delay="300" data-aos-duration="700">
              <Link to={route.homeone}>Home</Link>
              <span>✦</span>
              <span>Community</span>
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
                All
              </button>
              {ALL_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => { setActiveType(t); setCurrentPage(0); }}
                  style={{
                    padding: '6px 18px',
                    fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem',
                    fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                    border: activeType === t ? '1px solid var(--sl-gold)' : '1px solid rgba(101,28,50,0.15)',
                    background: activeType === t ? 'var(--sl-burgundy)' : 'transparent',
                    color: activeType === t ? 'var(--sl-gold)' : 'rgba(101,28,50,0.6)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            {!loading && (
              <p className="sl-cl-toolbar__results" style={{ margin: 0 }}>
                <strong>{totalElements}</strong> post{totalElements !== 1 ? 's' : ''}
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
                <span className="sl-script" style={{ fontSize: '2rem' }}>Be First</span>
              </div>
              <i className="isax isax-message-text sl-cl-empty__icon" />
              <h4 className="sl-cl-empty__title">No posts yet</h4>
              <p className="sl-cl-empty__text">Start the conversation — share insights, ask questions, or inspire your fellow students.</p>
              {isAuthenticated && (
                <button
                  className="sl-btn-gold sl-btn-magnetic"
                  onClick={() => canPost ? setShowCreate(true) : setShowUpgradePrompt(true)}
                >
                  Create a Post <i className="isax isax-add-circle" />
                </button>
              )}
            </div>
          ) : (
            <div className="row g-4">
              {posts.map((post, i) => (
                <div key={post.id} className="col-lg-6" style={{ display: 'flex' }}>
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

              {/* Lock icon */}
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
                Members Only
              </div>
              <h4 style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0,
              }}>
                Subscription Required
              </h4>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px 28px', textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--sl-font-body)',
                fontSize: '0.92rem', color: '#5A3A28', lineHeight: 1.65,
                marginBottom: 22,
              }}>
                Creating posts and interacting in the community is exclusively available to
                <strong> SARALÖWE Academy subscribers</strong>. Choose a plan to unlock your voice in the community.
              </p>

              {/* Feature list */}
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {[
                  'Create posts & discussions',
                  'Comment and reply to others',
                  'Like and interact with content',
                  'Access all community resources',
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
                View Subscription Plans
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
                Maybe Later
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
                  <span className="sl-script" style={{ fontSize: '1.3rem' }}>Share</span>
                </div>
                <h5 style={{ fontFamily: 'var(--sl-font-display)', fontSize: '1.1rem', color: 'var(--sl-burgundy)', margin: 0 }}>
                  Create a Post
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
                Post Type
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ALL_TYPES.map(t => {
                  const { bg, text: tc } = TYPE_COLORS[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      style={{
                        padding: '5px 14px', fontSize: '0.65rem', fontWeight: 600,
                        fontFamily: 'var(--sl-font-body)', letterSpacing: '0.12em', textTransform: 'uppercase',
                        border: newType === t ? `1px solid ${tc}` : '1px solid rgba(101,28,50,0.15)',
                        background: newType === t ? bg : 'transparent',
                        color: newType === t ? tc : 'rgba(101,28,50,0.5)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.6)', display: 'block', marginBottom: 6 }}>
                Title *
              </label>
              <input
                type="text"
                placeholder="What's on your mind?"
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
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontFamily: 'var(--sl-font-body)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(101,28,50,0.6)', display: 'block', marginBottom: 6 }}>
                Content *
              </label>
              <textarea
                placeholder="Share your thoughts, questions, or resources…"
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

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="sl-btn-outline"
                style={{ padding: '10px 24px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={creating || !newTitle.trim() || !newContent.trim()}
                className="sl-btn-gold sl-btn-magnetic"
                style={{ padding: '10px 28px' }}
              >
                {creating ? 'Posting…' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogGrid;
