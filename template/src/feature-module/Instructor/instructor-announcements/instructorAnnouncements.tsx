import React, { useCallback, useEffect, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { instructorService, Announcement } from '../../../services/api/instructor.service';

type ModalState = 'none' | 'add' | 'view' | 'edit' | 'delete';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)',
  fontSize: 14,
  outline: 'none',
  background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--lx-text-mid)',
  marginBottom: 6,
};

const InstructorAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [modal, setModal] = useState<ModalState>('none');
  const [selected, setSelected] = useState<Announcement | null>(null);

  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        setError(null);
        const data = await instructorService.getMyAnnouncements(page, pageSize);
        setAnnouncements(Array.isArray(data?.content) ? data.content : []);
        setTotalPages(data?.totalPages ?? 0);
        setTotalElements(data?.totalElements ?? 0);
        setCurrentPage(data?.page ?? page);
      } catch (err) {
        console.error('Failed to load announcements:', err);
        setError('Failed to load announcements. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => { fetchAnnouncements(0); }, [fetchAnnouncements]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const openAdd = () => { setAddTitle(''); setAddContent(''); setModal('add'); };
  const openView = (ann: Announcement) => { setSelected(ann); setModal('view'); };
  const openEdit = (ann: Announcement) => { setSelected(ann); setEditTitle(ann.title ?? ''); setEditContent(ann.content ?? ''); setModal('edit'); };
  const openDelete = (ann: Announcement) => { setSelected(ann); setModal('delete'); };
  const closeModal = () => { setModal('none'); setSelected(null); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addContent.trim()) return;
    setAddSubmitting(true);
    try {
      await instructorService.createAnnouncement(addTitle.trim(), addContent.trim());
      closeModal();
      fetchAnnouncements(0);
    } catch (err) {
      console.error('Failed to create announcement:', err);
      setError('Failed to create announcement. Please try again.');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !editTitle.trim() || !editContent.trim()) return;
    setEditSubmitting(true);
    try {
      await instructorService.updateAnnouncement(selected.id, editTitle.trim(), editContent.trim());
      closeModal();
      fetchAnnouncements(currentPage);
    } catch (err) {
      console.error('Failed to update announcement:', err);
      setError('Failed to update announcement. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteSubmitting(true);
    try {
      await instructorService.deleteAnnouncement(selected.id);
      closeModal();
      const nextPage = announcements.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      fetchAnnouncements(nextPage);
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setError('Failed to delete announcement. Please try again.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
          Page {currentPage + 1} of {totalPages} · {totalElements} announcements
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={currentPage === 0} onClick={() => fetchAnnouncements(currentPage - 1)}>
            <i className="isax isax-arrow-left" style={{ marginRight: 4 }} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`lx-btn lx-btn-sm ${i === currentPage ? 'lx-btn-gold' : 'lx-btn-outline'}`} onClick={() => fetchAnnouncements(i)}>
              {i + 1}
            </button>
          ))}
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={currentPage >= totalPages - 1} onClick={() => fetchAnnouncements(currentPage + 1)}>
            Next <i className="isax isax-arrow-right" style={{ marginLeft: 4 }} />
          </button>
        </div>
      </div>
    );
  };

  // Glass modal wrapper
  const GlassModal = ({ children, maxWidth = 560 }: { children: React.ReactNode; maxWidth?: number }) => (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div style={{
        width: '100%', maxWidth,
        background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
        borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
        boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
      }}>
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title }: { title: string }) => (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{title}</h5>
      <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
        <i className="isax isax-close-circle" />
      </button>
    </div>
  );

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
          Announcements
          {!loading && (
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--lx-text-muted)', marginLeft: 8 }}>({totalElements})</span>
          )}
        </h5>
        <button className="lx-btn lx-btn-gold" onClick={openAdd}>
          <i className="isax isax-add-circle" style={{ marginRight: 6 }} /> Add Announcement
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--lx-radius-sm)',
          background: 'rgba(139, 35, 53, 0.06)', border: '1px solid rgba(139, 35, 53, 0.12)',
          color: '#8B2335', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="isax isax-warning-2" /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="lx-empty-state">
          <span className="empty-icon"><i className="isax isax-notification" style={{ fontSize: 28 }} /></span>
          <p>No announcements yet. Create your first one!</p>
        </div>
      ) : (
        <>
          <div className="lx-card">
            <div className="lx-card-body" style={{ padding: 0 }}>
              <table className="lx-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Date</th>
                    <th>Announcement</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 120 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann) => (
                    <tr key={ann.id}>
                      <td style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>{formatDate(ann.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openView(ann)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                          <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: 'var(--lx-text)' }}>
                            {ann.title || '(No title)'}
                          </p>
                        </button>
                        <p style={{ margin: '2px 0 0', color: 'var(--lx-text-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
                          {ann.content}
                        </p>
                      </td>
                      <td><span className="lx-badge badge-success">Published</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" title="View" onClick={() => openView(ann)}>
                            <i className="isax isax-eye" />
                          </button>
                          <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" title="Edit" onClick={() => openEdit(ann)}>
                            <i className="isax isax-edit-2" />
                          </button>
                          <button
                            type="button"
                            className="lx-btn lx-btn-sm"
                            title="Delete"
                            onClick={() => openDelete(ann)}
                            style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1px solid rgba(139, 35, 53, 0.12)' }}
                          >
                            <i className="isax isax-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {renderPagination()}
        </>
      )}

      {/* ─── Add Modal ─── */}
      {modal === 'add' && (
        <GlassModal>
          <ModalHeader title="Add New Announcement" />
          <form onSubmit={handleAdd}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Title <span style={{ color: '#8B2335' }}>*</span></label>
                <input type="text" style={inputStyle} placeholder="Announcement title" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Content <span style={{ color: '#8B2335' }}>*</span></label>
                <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={5} placeholder="Write your announcement here..." value={addContent} onChange={(e) => setAddContent(e.target.value)} required />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="lx-btn lx-btn-gold" disabled={addSubmitting || !addTitle.trim() || !addContent.trim()}>
                {addSubmitting ? (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                ) : 'Publish'}
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* ─── View Modal ─── */}
      {modal === 'view' && selected && (
        <GlassModal>
          <ModalHeader title="Announcement Details" />
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 'var(--lx-radius)', background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>Title</p>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--lx-text)', fontSize: 15 }}>{selected.title || '(No title)'}</p>
            </div>
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 'var(--lx-radius)', background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>Content</p>
              <p style={{ margin: 0, color: 'var(--lx-text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.content}</p>
            </div>
            <div style={{ padding: 16, borderRadius: 'var(--lx-radius)', background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>Published on</p>
              <p style={{ margin: 0, color: 'var(--lx-text)', fontSize: 14 }}>{formatDate(selected.createdAt)}</p>
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Close</button>
            <button type="button" className="lx-btn lx-btn-gold" onClick={() => openEdit(selected)}>
              <i className="isax isax-edit-2" style={{ marginRight: 4 }} /> Edit
            </button>
          </div>
        </GlassModal>
      )}

      {/* ─── Edit Modal ─── */}
      {modal === 'edit' && selected && (
        <GlassModal>
          <ModalHeader title="Edit Announcement" />
          <form onSubmit={handleEdit}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Title <span style={{ color: '#8B2335' }}>*</span></label>
                <input type="text" style={inputStyle} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Content <span style={{ color: '#8B2335' }}>*</span></label>
                <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={5} value={editContent} onChange={(e) => setEditContent(e.target.value)} required />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="lx-btn lx-btn-gold" disabled={editSubmitting || !editTitle.trim() || !editContent.trim()}>
                {editSubmitting ? (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* ─── Delete Modal ─── */}
      {modal === 'delete' && selected && (
        <GlassModal maxWidth={420}>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(139, 35, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 8 }}>Delete Announcement</h4>
            <p style={{ fontWeight: 500, color: 'var(--lx-text)', marginBottom: 4 }}>"{selected.title || '(No title)'}"</p>
            <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, marginBottom: 24 }}>
              Are you sure you want to delete this announcement? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal} disabled={deleteSubmitting}>Cancel</button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                onClick={handleDelete}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #8B2335', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                ) : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </GlassModal>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorAnnouncements;
