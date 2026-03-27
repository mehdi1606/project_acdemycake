import React, { useState, useEffect, useCallback } from 'react'
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout'
import { instructorService, Assignment, AssignmentStatus } from '../../../services/api/instructor.service'
import { Course } from '../../../services/api/types'

type ModalState = 'none' | 'add' | 'view' | 'edit' | 'delete'

interface AssignmentForm {
  courseId: string
  title: string
  description: string
  instructions: string
  dueDate: string
  totalMark: string
  status: AssignmentStatus
}

const emptyForm = (): AssignmentForm => ({
  courseId: '',
  title: '',
  description: '',
  instructions: '',
  dueDate: '',
  totalMark: '100',
  status: 'DRAFT',
})

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)',
  fontSize: 14,
  outline: 'none',
  background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--lx-text-mid)',
  marginBottom: 6,
}

const StatusBadge: React.FC<{ status: AssignmentStatus }> = ({ status }) => (
  <span className={`lx-badge ${status === 'PUBLISHED' ? 'badge-success' : 'badge-info'}`}>
    {status === 'PUBLISHED' ? 'Published' : 'Draft'}
  </span>
)

interface FormFieldsProps {
  form: AssignmentForm
  courses: Course[]
  onChange: (field: keyof AssignmentForm, value: string) => void
}

const AssignmentFormFields: React.FC<FormFieldsProps> = ({ form, courses, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div>
      <label style={labelStyle}>Course <span style={{ color: '#8B2335' }}>*</span></label>
      <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.courseId} onChange={(e) => onChange('courseId', e.target.value)} required>
        <option value="">Select a course</option>
        {courses.map((c: Course) => (<option key={c.id} value={c.id}>{c.title}</option>))}
      </select>
    </div>
    <div>
      <label style={labelStyle}>Assignment Title <span style={{ color: '#8B2335' }}>*</span></label>
      <input type="text" style={inputStyle} placeholder="Enter assignment title" value={form.title} onChange={(e) => onChange('title', e.target.value)} required />
    </div>
    <div>
      <label style={labelStyle}>Description</label>
      <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={3} placeholder="Enter description" value={form.description} onChange={(e) => onChange('description', e.target.value)} />
    </div>
    <div>
      <label style={labelStyle}>Instructions</label>
      <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={4} placeholder="Enter instructions" value={form.instructions} onChange={(e) => onChange('instructions', e.target.value)} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
      <div>
        <label style={labelStyle}>Total Mark</label>
        <input type="number" style={inputStyle} min={1} max={1000} value={form.totalMark} onChange={(e) => onChange('totalMark', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Due Date</label>
        <input type="date" style={inputStyle} value={form.dueDate} onChange={(e) => onChange('dueDate', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Status <span style={{ color: '#8B2335' }}>*</span></label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={(e) => onChange('status', e.target.value as AssignmentStatus)}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>
    </div>
  </div>
)

const InstructorAssignment: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 10

  const [modal, setModal] = useState<ModalState>('none')
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [form, setForm] = useState<AssignmentForm>(emptyForm())
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false)

  const fetchAssignments = useCallback(async (page: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await instructorService.getMyAssignments(page, pageSize)
      setAssignments(Array.isArray(data?.content) ? data.content : [])
      setTotalPages(data?.totalPages ?? 0)
      setTotalElements(data?.totalElements ?? 0)
      setCurrentPage(data?.page ?? 0)
    } catch (err) {
      console.error('Failed to load assignments:', err)
      setError('Failed to load assignments.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const data = await instructorService.getMyCourses(0, 100)
      setCourses(Array.isArray(data?.content) ? data.content : [])
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }, [])

  useEffect(() => {
    fetchAssignments(0)
    fetchCourses()
  }, [fetchAssignments, fetchCourses])

  const updateForm = useCallback((field: keyof AssignmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const openAdd = () => { setForm(emptyForm()); setModal('add'); }
  const openView = (a: Assignment) => { setSelected(a); setModal('view'); }
  const openEdit = (a: Assignment) => {
    setSelected(a);
    setForm({
      courseId: a.courseId || '',
      title: a.title || '',
      description: a.description || '',
      instructions: a.instructions || '',
      dueDate: a.dueDate ? a.dueDate.split('T')[0] : '',
      totalMark: String(a.totalMark ?? 100),
      status: a.status || 'DRAFT',
    });
    setModal('edit');
  }
  const openDelete = (a: Assignment) => { setSelected(a); setModal('delete'); }
  const closeModal = () => { setModal('none'); setSelected(null); }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.courseId) return
    setSubmitting(true)
    try {
      await instructorService.createAssignment({
        courseId: form.courseId, title: form.title.trim(), description: form.description.trim(),
        instructions: form.instructions.trim(), dueDate: form.dueDate || undefined,
        totalMark: parseInt(form.totalMark) || 100, status: form.status,
      })
      closeModal()
      fetchAssignments(0)
    } catch { setError('Failed to create assignment.') }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !form.title.trim()) return
    setSubmitting(true)
    try {
      await instructorService.updateAssignment(selected.id, {
        title: form.title.trim(), description: form.description.trim(),
        instructions: form.instructions.trim(), dueDate: form.dueDate || undefined,
        totalMark: parseInt(form.totalMark) || 100, status: form.status,
      })
      closeModal()
      fetchAssignments(currentPage)
    } catch { setError('Failed to update assignment.') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setDeleteSubmitting(true)
    try {
      await instructorService.deleteAssignment(selected.id)
      closeModal()
      const nextPage = assignments.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage
      fetchAssignments(nextPage)
    } catch { setError('Failed to delete assignment.') }
    finally { setDeleteSubmitting(false) }
  }

  const GlassModal = ({ children, maxWidth = 600 }: { children: React.ReactNode; maxWidth?: number }) => (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div style={{ width: '100%', maxWidth, background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)', borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)', boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)' }}>
        {children}
      </div>
    </div>
  )

  const ModalHeader = ({ title }: { title: string }) => (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{title}</h5>
      <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
        <i className="isax isax-close-circle" />
      </button>
    </div>
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>Page {currentPage + 1} of {totalPages} · {totalElements} assignments</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={currentPage === 0} onClick={() => fetchAssignments(currentPage - 1)}>Previous</button>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={currentPage >= totalPages - 1} onClick={() => fetchAssignments(currentPage + 1)}>Next</button>
        </div>
      </div>
    )
  }

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
          Assignments
          {!loading && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--lx-text-muted)', marginLeft: 8 }}>({totalElements})</span>}
        </h5>
        <button className="lx-btn lx-btn-gold" onClick={openAdd}>
          <i className="isax isax-add-circle" style={{ marginRight: 6 }} /> Add Assignment
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139, 35, 53, 0.06)', border: '1px solid rgba(139, 35, 53, 0.12)', color: '#8B2335', fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : assignments.length === 0 ? (
        <div className="lx-empty-state">
          <span className="empty-icon"><i className="isax isax-document-text" style={{ fontSize: 28 }} /></span>
          <p>No assignments yet. Create your first one!</p>
        </div>
      ) : (
        <div className="lx-card">
          <div className="lx-card-body" style={{ padding: 0 }}>
            <table className="lx-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Mark</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td><span style={{ fontWeight: 500 }}>{a.title}</span></td>
                    <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{a.courseTitle || '—'}</td>
                    <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(a.dueDate)}</td>
                    <td style={{ fontWeight: 600 }}>{a.totalMark}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openView(a)} title="View"><i className="isax isax-eye" /></button>
                        <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openEdit(a)} title="Edit"><i className="isax isax-edit-2" /></button>
                        <button type="button" className="lx-btn lx-btn-sm" onClick={() => openDelete(a)} title="Delete" style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1px solid rgba(139, 35, 53, 0.12)' }}><i className="isax isax-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {renderPagination()}

      {/* Add Modal */}
      {modal === 'add' && (
        <GlassModal>
          <ModalHeader title="Add New Assignment" />
          <form onSubmit={handleAdd}>
            <div style={{ padding: 24 }}><AssignmentFormFields form={form} courses={courses} onChange={updateForm} /></div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting || !form.title.trim() || !form.courseId}>
                {submitting ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : 'Create'}
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <GlassModal>
          <ModalHeader title="Assignment Details" />
          <div style={{ padding: 24 }}>
            {[
              { label: 'Title', value: selected.title },
              { label: 'Course', value: selected.courseTitle || '—' },
              { label: 'Description', value: selected.description || '—' },
              { label: 'Instructions', value: selected.instructions || '—' },
              { label: 'Due Date', value: formatDate(selected.dueDate) },
              { label: 'Total Mark', value: String(selected.totalMark ?? '—') },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: 16, padding: 14, borderRadius: 'var(--lx-radius)', background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>{f.label}</p>
                <p style={{ margin: 0, color: 'var(--lx-text)', whiteSpace: 'pre-wrap' }}>{f.value}</p>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)' }}>Status:</span>
              <StatusBadge status={selected.status} />
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Close</button>
            <button type="button" className="lx-btn lx-btn-gold" onClick={() => openEdit(selected)}><i className="isax isax-edit-2" style={{ marginRight: 4 }} /> Edit</button>
          </div>
        </GlassModal>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && selected && (
        <GlassModal>
          <ModalHeader title="Edit Assignment" />
          <form onSubmit={handleEdit}>
            <div style={{ padding: 24 }}><AssignmentFormFields form={form} courses={courses} onChange={updateForm} /></div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting || !form.title.trim()}>
                {submitting ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <GlassModal maxWidth={420}>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(139, 35, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 8 }}>Delete Assignment</h4>
            <p style={{ fontWeight: 500, color: 'var(--lx-text)', marginBottom: 4 }}>"{selected.title}"</p>
            <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, marginBottom: 24 }}>This cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal} disabled={deleteSubmitting}>Cancel</button>
              <button type="button" className="lx-btn" style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }} onClick={handleDelete} disabled={deleteSubmitting}>
                {deleteSubmitting ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #8B2335', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </GlassModal>
      )}
    </LuxuryDashboardLayout>
  )
}

export default InstructorAssignment
