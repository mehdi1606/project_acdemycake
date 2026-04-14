import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Spin } from 'antd';
import LuxuryDashboardLayout from '../../components/LuxuryDashboardLayout';
import communityService from '../../services/api/community.service';
import { CommunityPost, CreatePostRequest, PostType } from '../../services/api/types';
import { getFileUrl } from '../../environment';
import { all_routes } from '../router/all_routes';

// ─── helpers ──────────────────────────────────────────────────────────────────

const avatarUrl = (url?: string) => getFileUrl(url) ?? 'assets/img/user/user-02.jpg';

const TYPE_LABELS: Record<PostType, string> = {
  DISCUSSION:   'Discussion',
  QUESTION:     'Question',
  RESOURCE:     'Resource',
  ANNOUNCEMENT: 'Announcement',
};

const TYPE_BADGE: Record<PostType, string> = {
  DISCUSSION:   'primary',
  QUESTION:     'warning',
  RESOURCE:     'success',
  ANNOUNCEMENT: 'danger',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

// ─── component ────────────────────────────────────────────────────────────────

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();

  const [posts,      setPosts]      = useState<CommunityPost[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState<PostType | ''>('');
  const [search,     setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Create post modal
  const [modalOpen,   setModalOpen]   = useState(false);
  const [formTitle,   setFormTitle]   = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType,    setFormType]    = useState<PostType>('DISCUSSION');
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');

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
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, isLikedByCurrentUser: !wasLiked, likesCount: p.likesCount + (wasLiked ? -1 : 1) }
          : p
      )
    );
    try {
      if (wasLiked) await communityService.unlikePost(post.id);
      else await communityService.likePost(post.id);
    } catch {
      // Revert on error
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
    setModalOpen(true);
  };

  const submitPost = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError('Title and content are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const req: CreatePostRequest = { title: formTitle.trim(), content: formContent.trim(), postType: formType };
      const created = await communityService.createPost(req);
      setPosts((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch {
      setFormError('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterType = (t: PostType | '') => { setFilterType(t); setPage(0); };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--lx-primary, #6B1D2A)' }}>Community</h4>
            <p className="text-muted mb-0 fs-14">Share knowledge, ask questions, and connect with fellow learners.</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openModal}>
            <i className="isax isax-add-circle fs-18" />
            New Post
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
              placeholder="Search posts…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="btn-group" role="group">
            <button type="button"
              className={`btn btn-sm ${filterType === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterType('')}
            >All</button>
            {(Object.keys(TYPE_LABELS) as PostType[]).map((t) => (
              <button key={t} type="button"
                className={`btn btn-sm ${filterType === t ? `btn-${TYPE_BADGE[t]}` : 'btn-outline-secondary'}`}
                onClick={() => handleFilterType(t)}
              >
                {TYPE_LABELS[t]}
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
            <p>No posts found. Be the first to post!</p>
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
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={avatarUrl(post.userAvatar)}
                          alt={post.userName}
                          className="rounded-circle"
                          style={{ width: 36, height: 36, objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/user/user-02.jpg'; }}
                        />
                        <div>
                          <p className="mb-0 fw-semibold fs-14">{post.userName}</p>
                          <p className="mb-0 text-muted fs-12">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {post.isPinned && (
                          <span className="badge bg-warning-subtle text-warning rounded-pill px-2">
                            <i className="fa-solid fa-thumbtack me-1" style={{ fontSize: 9 }} />Pinned
                          </span>
                        )}
                        <span className={`badge bg-${TYPE_BADGE[post.postType]}-subtle text-${TYPE_BADGE[post.postType]} rounded-pill px-3`}>
                          {TYPE_LABELS[post.postType]}
                        </span>
                      </div>
                    </div>

                    <h6 className="fw-bold mb-1 mt-2">{post.title}</h6>
                    <p className="text-muted fs-14 mb-3" style={{
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {post.content}
                    </p>

                    <div className="d-flex align-items-center gap-3">
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
              <i className="isax isax-arrow-left-2 fs-14" /> Prev
            </button>
            <span className="btn btn-sm disabled text-muted">{page + 1} / {totalPages}</span>
            <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}>
              Next <i className="isax isax-arrow-right-3 fs-14" />
            </button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <Modal
        title="Create New Post"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitPost}
        okText="Post"
        confirmLoading={submitting}
        okButtonProps={{ disabled: !formTitle.trim() || !formContent.trim() }}
        width={600}
      >
        <div className="d-flex flex-column gap-3 pt-2">
          {formError && <div className="alert alert-danger py-2 mb-0">{formError}</div>}
          <div>
            <label className="form-label fw-semibold">Title *</label>
            <input type="text" className="form-control" placeholder="Give your post a descriptive title"
              value={formTitle} onChange={(e) => setFormTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="form-label fw-semibold">Type *</label>
            <div className="d-flex gap-2 flex-wrap">
              {(Object.keys(TYPE_LABELS) as PostType[]).map((t) => (
                <button key={t} type="button"
                  className={`btn btn-sm ${formType === t ? `btn-${TYPE_BADGE[t]}` : 'btn-outline-secondary'}`}
                  onClick={() => setFormType(t)}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label fw-semibold">Content *</label>
            <textarea className="form-control" rows={6}
              placeholder="Share your thoughts, question, or resource…"
              value={formContent} onChange={(e) => setFormContent(e.target.value)} />
          </div>
        </div>
      </Modal>
    </LuxuryDashboardLayout>
  );
};

export default CommunityPage;
