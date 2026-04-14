import React, { useState, useEffect, useCallback } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { Spin, App } from 'antd';
import { communityService } from '../../../services/api/community.service';
import { CommunityPost as Post, PostType } from '../../../services/api/types';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';

/* ── helpers ── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_LABELS: Record<PostType, string> = {
  DISCUSSION:   'Discussion',
  QUESTION:     'Question',
  ANNOUNCEMENT: 'Announcement',
  RESOURCE:     'Resource',
};

const TYPE_COLORS: Record<PostType, string> = {
  DISCUSSION:   '#3B82F6',
  QUESTION:     '#10B981',
  ANNOUNCEMENT: '#6B1D2A',
  RESOURCE:     '#C5973E',
};

const ALL_TYPES: PostType[] = ['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'RESOURCE'];

const BlogGrid = () => {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { message } = App.useApp();

  const [posts,       setPosts]       = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeType,  setActiveType]  = useState<PostType | undefined>(undefined);
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [liking,      setLiking]      = useState<Set<string>>(new Set());

  /* ── Create post modal state ── */
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle,   setNewTitle]   = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType,    setNewType]    = useState<PostType>('DISCUSSION');
  const [creating,   setCreating]   = useState(false);

  const PAGE_SIZE = 6;

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await communityService.getPosts(currentPage, PAGE_SIZE, activeType, search || undefined);
      setPosts(result.content ?? []);
      setTotalPages(result.totalPages ?? 0);
      setTotalElements(result.totalElements ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeType, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleLike = async (post: Post) => {
    if (!isAuthenticated) { message.warning('Please login to like posts'); return; }
    if (liking.has(post.id)) return;
    setLiking((prev) => new Set(prev).add(post.id));
    try {
      if (post.isLikedByCurrentUser) {
        await communityService.unlikePost(post.id);
        setPosts((prev) => prev.map((p) =>
          p.id === post.id ? { ...p, isLikedByCurrentUser: false, likesCount: p.likesCount - 1 } : p
        ));
      } else {
        await communityService.likePost(post.id);
        setPosts((prev) => prev.map((p) =>
          p.id === post.id ? { ...p, isLikedByCurrentUser: true, likesCount: p.likesCount + 1 } : p
        ));
      }
    } catch {
      message.error('Failed to update like');
    } finally {
      setLiking((prev) => { const n = new Set(prev); n.delete(post.id); return n; });
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      message.warning('Please fill in all fields');
      return;
    }
    try {
      setCreating(true);
      const created = await communityService.createPost({ title: newTitle, content: newContent, postType: newType });
      setPosts((prev) => [created, ...prev]);
      setNewTitle(''); setNewContent(''); setNewType('DISCUSSION');
      setShowCreate(false);
      message.success('Post created successfully!');
    } catch {
      message.error('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Breadcrumb title="Community" />
      <div className="content">
        <div className="container">

          {/* ── Top bar ── */}
          <div className="row align-items-center mb-4 gap-3 gap-md-0">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* All button */}
                <button
                  className={`btn btn-sm rounded-pill ${!activeType ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => { setActiveType(undefined); setCurrentPage(0); }}
                >
                  All
                </button>
                {ALL_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`btn btn-sm rounded-pill ${activeType === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => { setActiveType(t); setCurrentPage(0); }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center justify-content-md-end gap-2">
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
                  <i className="isax isax-search-normal-1" style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: '#9ca3af', fontSize: 15,
                  }} />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search posts…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                {/* New post button */}
                {isAuthenticated && (
                  <button
                    className="btn btn-primary rounded-pill flex-shrink-0"
                    onClick={() => setShowCreate(true)}
                  >
                    <i className="isax isax-add-circle me-1" />
                    New Post
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Results count ── */}
          {!loading && (
            <p className="text-muted small mb-3">
              {totalElements} post{totalElements !== 1 ? 's' : ''}
              {activeType && ` · ${TYPE_LABELS[activeType]}`}
              {search && ` · "${search}"`}
            </p>
          )}

          {/* ── Posts ── */}
          {loading ? (
            <div className="text-center py-5">
              <Spin size="large" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-5">
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(107,29,42,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <i className="isax isax-message-text" style={{ fontSize: 30, color: 'rgba(107,29,42,0.3)' }} />
              </div>
              <h5 className="mb-2">No posts yet</h5>
              <p className="text-muted">Be the first to start a conversation!</p>
              {isAuthenticated && (
                <button className="btn btn-primary rounded-pill mt-2" onClick={() => setShowCreate(true)}>
                  Create a Post
                </button>
              )}
            </div>
          ) : (
            <div className="row justify-content-center">
              {posts.map((post) => {
                const avatar = getFileUrl(post.userAvatar);
                const color = TYPE_COLORS[post.postType] ?? '#6B1D2A';
                const images = post.images?.filter(Boolean) ?? [];

                return (
                  <div key={post.id} className="col-lg-9 mb-4">
                    <div className="blog" style={{
                      borderRadius: 14,
                      border: '1px solid rgba(107,29,42,0.08)',
                      overflow: 'hidden',
                      boxShadow: '0 2px 12px rgba(107,29,42,0.06)',
                      background: '#fff',
                    }}>
                      {/* Image (first image if any) */}
                      {images.length > 0 && (
                        <div className="blog-image" style={{ maxHeight: 280, overflow: 'hidden' }}>
                          <img
                            src={getFileUrl(images[0]) ?? images[0]}
                            alt={post.title}
                            className="img-fluid w-100"
                            style={{ objectFit: 'cover', height: 280 }}
                          />
                        </div>
                      )}

                      <div className="blog-item p-4">
                        {/* Type badge + pinned */}
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span style={{
                            background: `${color}18`, color,
                            fontSize: 11, fontWeight: 700,
                            padding: '3px 10px', borderRadius: 20,
                          }}>
                            {TYPE_LABELS[post.postType]}
                          </span>
                          {post.isPinned && (
                            <span style={{
                              background: 'rgba(197,151,62,0.15)', color: '#C5973E',
                              fontSize: 11, fontWeight: 700,
                              padding: '3px 10px', borderRadius: 20,
                            }}>
                              <i className="fa-solid fa-thumbtack me-1" style={{ fontSize: 9 }} />
                              Pinned
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h5 className="mb-2">
                          <Link
                            to={`/community/${post.id}`}
                            style={{ color: '#2C1810', textDecoration: 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#6B1D2A')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#2C1810')}
                          >
                            {post.title}
                          </Link>
                        </h5>

                        {/* Content preview */}
                        <p style={{
                          color: '#6b7280', fontSize: 14, lineHeight: 1.6,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          marginBottom: 16,
                        }}>
                          {post.content}
                        </p>

                        {/* Footer */}
                        <div className="blog-info">
                          <div className="d-flex align-items-center flex-wrap justify-content-between gap-2">
                            {/* Author */}
                            <div className="d-flex align-items-center user-profile gap-2">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={post.userName}
                                  className="rounded-pill"
                                  style={{ width: 32, height: 32, objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: `${color}20`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13, fontWeight: 700, color,
                                }}>
                                  {post.userName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="user-name" style={{ fontWeight: 600, fontSize: 13 }}>
                                {post.userName}
                              </span>
                            </div>

                            {/* Stats */}
                            <div className="d-flex align-items-center gap-3">
                              <span style={{ fontSize: 13, color: '#6b7280' }}>
                                <i className="isax isax-calendar-1 me-1" />
                                {timeAgo(post.createdAt)}
                              </span>

                              {/* Like button */}
                              <button
                                onClick={() => handleLike(post)}
                                disabled={liking.has(post.id)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  color: post.isLikedByCurrentUser ? '#e53e3e' : '#6b7280',
                                  fontSize: 13, padding: 0,
                                  transition: 'color 0.15s',
                                }}
                              >
                                <i className={post.isLikedByCurrentUser ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                                {post.likesCount}
                              </button>

                              {/* Comments */}
                              <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="isax isax-message-2" />
                                {post.commentsCount}
                              </span>

                              {/* Views */}
                              <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="isax isax-eye" />
                                {post.viewsCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="row align-items-center mt-2 mb-4">
              <div className="col-md-12">
                <ul className="pagination justify-content-center">
                  <li className={`page-item prev ${currentPage === 0 ? 'disabled' : ''}`}>
                    <button
                      className="page-link border-0 bg-transparent"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <i className="fas fa-angle-left" />
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(i)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item next ${currentPage === totalPages - 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link border-0 bg-transparent"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1}
                    >
                      <i className="fas fa-angle-right" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Create Post Modal ── */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 560,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h5 className="mb-0" style={{ color: '#2C1810', fontWeight: 700 }}>Create a Post</h5>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}
              >
                <i className="isax isax-close-circle" />
              </button>
            </div>

            {/* Post type */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Post Type</label>
              <div className="d-flex gap-2 flex-wrap">
                {ALL_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewType(t)}
                    style={{
                      padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: `2px solid ${newType === t ? TYPE_COLORS[t] : '#e5e7eb'}`,
                      background: newType === t ? `${TYPE_COLORS[t]}15` : 'transparent',
                      color: newType === t ? TYPE_COLORS[t] : '#6b7280',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="What's on your mind?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Content *</label>
              <textarea
                className="form-control"
                placeholder="Share your thoughts, questions, or resources…"
                rows={5}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-light rounded-pill px-4"
                onClick={() => setShowCreate(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary rounded-pill px-4"
                onClick={handleCreatePost}
                disabled={creating || !newTitle.trim() || !newContent.trim()}
              >
                {creating ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogGrid;
