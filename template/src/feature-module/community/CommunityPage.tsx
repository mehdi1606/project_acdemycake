import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal, Spin } from 'antd';
import LuxuryDashboardLayout from '../../components/LuxuryDashboardLayout';
import communityService from '../../services/api/community.service';
import { CommunityPost, CreatePostRequest, PostType } from '../../services/api/types';
import { getFileUrl } from '../../environment';
import { all_routes } from '../router/all_routes';

// ─── helpers ──────────────────────────────────────────────────────────────────

const avatarUrl = (url?: string) => getFileUrl(url) ?? 'assets/img/user/user-02.jpg';

const TYPE_BADGE: Record<PostType, string> = {
  DISCUSSION:   'primary',
  QUESTION:     'warning',
  RESOURCE:     'success',
  ANNOUNCEMENT: 'danger',
};

// ─── component ────────────────────────────────────────────────────────────────

const CommunityPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const TYPE_LABELS: Record<PostType, string> = {
    DISCUSSION:   t('community.type.DISCUSSION'),
    QUESTION:     t('community.type.QUESTION'),
    RESOURCE:     t('community.type.RESOURCE'),
    ANNOUNCEMENT: t('community.type.ANNOUNCEMENT'),
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' });

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

  // Image upload
  const [_imageFile,     setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedUrl,    setUploadedUrl]    = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      else await communityService.likePost(post.id);
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

  // ── image selection ───────────────────────────────────────────────────────
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
      setFormError(t('community.errorImageUpload'));
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

  // ── create post ───────────────────────────────────────────────────────────
  const openModal = () => {
    setFormTitle(''); setFormContent(''); setFormType('DISCUSSION'); setFormError('');
    removeImage();
    setModalOpen(true);
  };

  const submitPost = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError(t('community.errorRequired'));
      return;
    }
    if (uploadingImage) {
      setFormError(t('community.waitForUpload'));
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const req: CreatePostRequest = {
        title: formTitle.trim(),
        content: formContent.trim(),
        postType: formType,
        ...(uploadedUrl ? { imageUrls: [uploadedUrl] } : {}),
      };
      const created = await communityService.createPost(req);
      setPosts((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch {
      setFormError(t('community.errorCreate'));
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
              {t('community.title')}
            </h4>
            <p className="text-muted mb-0 fs-14">{t('community.description')}</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openModal}>
            <i className="isax isax-add-circle fs-18" />
            {t('community.newPost')}
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
              placeholder={t('community.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="btn-group" role="group">
            <button type="button"
              className={`btn btn-sm ${filterType === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterType('')}
            >{t('community.all')}</button>
            {(Object.keys(TYPE_LABELS) as PostType[]).map((ptype) => (
              <button key={ptype} type="button"
                className={`btn btn-sm ${filterType === ptype ? `btn-${TYPE_BADGE[ptype]}` : 'btn-outline-secondary'}`}
                onClick={() => handleFilterType(ptype)}
              >
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
            <p>{t('community.noPostsFound')}</p>
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
                            <i className="fa-solid fa-thumbtack me-1" style={{ fontSize: 9 }} />
                            {t('community.pinned')}
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
              <i className="isax isax-arrow-left-2 fs-14" /> {t('community.prev')}
            </button>
            <span className="btn btn-sm disabled text-muted">{page + 1} / {totalPages}</span>
            <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}>
              {t('community.next')} <i className="isax isax-arrow-right-3 fs-14" />
            </button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <Modal
        title={t('community.createPost')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitPost}
        okText={t('community.post')}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !formTitle.trim() || !formContent.trim() || uploadingImage }}
        width={600}
      >
        <div className="d-flex flex-column gap-3 pt-2">
          {formError && <div className="alert alert-danger py-2 mb-0">{formError}</div>}

          <div>
            <label className="form-label fw-semibold">{t('community.titleLabel')} *</label>
            <input type="text" className="form-control"
              placeholder={t('community.titlePlaceholder')}
              value={formTitle} onChange={(e) => setFormTitle(e.target.value)} maxLength={200} />
          </div>

          <div>
            <label className="form-label fw-semibold">{t('community.typeLabel')} *</label>
            <div className="d-flex gap-2 flex-wrap">
              {(Object.keys(TYPE_LABELS) as PostType[]).map((ptype) => (
                <button key={ptype} type="button"
                  className={`btn btn-sm ${formType === ptype ? `btn-${TYPE_BADGE[ptype]}` : 'btn-outline-secondary'}`}
                  onClick={() => setFormType(ptype)}>
                  {TYPE_LABELS[ptype]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label fw-semibold">{t('community.contentLabel')} *</label>
            <textarea className="form-control" rows={5}
              placeholder={t('community.contentPlaceholder')}
              value={formContent} onChange={(e) => setFormContent(e.target.value)} />
          </div>

          {/* Image upload */}
          <div>
            <label className="form-label fw-semibold">{t('community.attachImage')}</label>
            {imagePreview ? (
              <div className="position-relative d-inline-block">
                <img src={imagePreview} alt="preview"
                  style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, border: '1px solid #dee2e6' }} />
                {uploadingImage && (
                  <div className="position-absolute inset-0 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, inset: 0 }}>
                    <Spin size="small" />
                    <span className="ms-2 fs-12">{t('community.uploadingImage')}</span>
                  </div>
                )}
                {!uploadingImage && (
                  <button type="button" className="btn btn-sm btn-danger ms-2 mt-1"
                    onClick={removeImage}>
                    <i className="isax isax-trash fs-14" /> {t('community.removeImage')}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="d-none"
                  onChange={handleImageSelect}
                />
                <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}>
                  <i className="isax isax-image fs-16" />
                  {t('community.chooseImage')}
                </button>
                <p className="text-muted fs-12 mt-1 mb-0">{t('community.imageTip')}</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </LuxuryDashboardLayout>
  );
};

export default CommunityPage;
