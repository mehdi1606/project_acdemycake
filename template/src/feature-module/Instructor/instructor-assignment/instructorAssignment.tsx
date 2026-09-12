import React, { useState, useEffect, useCallback } from 'react'
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout'
import { useTranslation } from 'react-i18next'
import { instructorService, Assignment, AssignmentStatus } from '../../../services/api/instructor.service'
import { Course, Submission } from '../../../services/api/types'
import { assignmentService } from '../../../services/api/assignment.service'
import { extractApiError } from '../../../services/api/error.utils'
import { message } from 'antd'

type ModalState = 'none' | 'add' | 'view' | 'edit' | 'delete' | 'submissions'

interface AssignmentForm {
  courseId: string
  title: string
  description: string
  instructions: string
  titleAr: string
  descriptionAr: string
  instructionsAr: string
  dueDate: string
  totalMark: string
  status: AssignmentStatus
}

const emptyForm = (): AssignmentForm => ({
  courseId: '',
  title: '',
  description: '',
  instructions: '',
  titleAr: '',
  descriptionAr: '',
  instructionsAr: '',
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

const TITLE_MAX = 255
const TEXT_MAX = 5000

type FormLang = 'en' | 'ar'
const LANG_FIELDS: Record<FormLang, {
  title: 'title' | 'titleAr'
  description: 'description' | 'descriptionAr'
  instructions: 'instructions' | 'instructionsAr'
}> = {
  en: { title: 'title', description: 'description', instructions: 'instructions' },
  ar: { title: 'titleAr', description: 'descriptionAr', instructions: 'instructionsAr' },
}

const hasTitle = (f: AssignmentForm) => !!(f.title.trim() || f.titleAr.trim())
const tooLong = (f: AssignmentForm) =>
  f.title.length > TITLE_MAX || f.titleAr.length > TITLE_MAX ||
  [f.description, f.descriptionAr, f.instructions, f.instructionsAr].some(v => v.length > TEXT_MAX)

const toPayload = (f: AssignmentForm) => ({
  // `title` is required server-side; an Arabic-only assignment reuses its Arabic title.
  title: f.title.trim() || f.titleAr.trim(),
  titleAr: f.titleAr.trim(),
  description: f.description.trim(),
  descriptionAr: f.descriptionAr.trim(),
  instructions: f.instructions.trim(),
  instructionsAr: f.instructionsAr.trim(),
  dueDate: f.dueDate || undefined,
  totalMark: parseInt(f.totalMark) || 100,
  status: f.status,
})

/**
 * Writing-assistant extensions (Grammarly etc.) inject overlays into text fields and can
 * swallow keystrokes or pasted text while typing fast; these attributes opt the fields out.
 */
const NO_WRITING_ASSIST = { 'data-gramm': 'false', 'data-gramm_editor': 'false', 'data-enable-grammarly': 'false' }

const FieldLabel: React.FC<{ text: string; value: string; max: number; required?: boolean }> = ({ text, value, max, required }) => {
  const over = value.length > max
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
      <label style={{ ...labelStyle, marginBottom: 0 }}>
        {text} {required && <span style={{ color: '#8B2335' }}>*</span>}
      </label>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: over ? '#dc2626' : 'var(--lx-text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {value.length.toLocaleString('en-US')} / {max.toLocaleString('en-US')}{over ? ' · too long' : ''}
      </span>
    </div>
  )
}

interface FormFieldsProps {
  form: AssignmentForm
  courses: Course[]
  onChange: (field: keyof AssignmentForm, value: string) => void
}

const AssignmentFormFields: React.FC<FormFieldsProps> = ({ form, courses, onChange }) => {
  const [lang, setLang] = useState<FormLang>('en')
  const keys = LANG_FIELDS[lang]
  const rtl = lang === 'ar'
  const dir = rtl ? 'rtl' : 'ltr'
  const textStyle: React.CSSProperties = { ...inputStyle, textAlign: rtl ? 'right' : 'left', lineHeight: 1.6 }
  const filled = (l: FormLang) => {
    const k = LANG_FIELDS[l]
    return !!(form[k.title].trim() || form[k.description].trim() || form[k.instructions].trim())
  }
  const L = rtl
    ? { title: 'عنوان الواجب', description: 'الوصف', instructions: 'التعليمات', titlePh: 'اكتب عنوان الواجب', descPh: 'اكتب وصف الواجب', instrPh: 'اكتب التعليمات للطالب' }
    : { title: 'Assignment Title', description: 'Description', instructions: 'Instructions', titlePh: 'Enter assignment title', descPh: 'Enter description', instrPh: 'Enter instructions' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Course <span style={{ color: '#8B2335' }}>*</span></label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.courseId} onChange={(e) => onChange('courseId', e.target.value)} required>
          <option value="">Select a course</option>
          {courses.map((c: Course) => (<option key={c.id} value={c.id}>{c.title}</option>))}
        </select>
      </div>

      {/* Language tabs — the same assignment written in English and Arabic */}
      <div>
        <div role="tablist" style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10, background: 'rgba(107,29,42,0.06)' }}>
          {(['en', 'ar'] as FormLang[]).map(l => {
            const active = l === lang
            return (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLang(l)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 18px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: active ? '#6B1D2A' : 'transparent', color: active ? '#fff' : 'var(--lx-text-mid)',
                }}
              >
                {l === 'en' ? 'English' : 'العربية'}
                <span
                  title={filled(l) ? 'Written' : 'Empty'}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: filled(l) ? '#22c55e' : (active ? 'rgba(255,255,255,0.45)' : 'rgba(107,29,42,0.25)') }}
                />
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
          Students see the language of their site (AR / EN). If one language is empty, the other is shown. A title is required in at least one language.
        </p>
      </div>

      <div>
        <FieldLabel text={L.title} value={form[keys.title]} max={TITLE_MAX} required />
        <input
          key={keys.title}
          type="text" dir={dir} spellCheck autoComplete="off"
          style={textStyle}
          placeholder={L.titlePh}
          value={form[keys.title]}
          onChange={(e) => onChange(keys.title, e.target.value)}
          {...NO_WRITING_ASSIST}
        />
      </div>
      <div>
        <FieldLabel text={L.description} value={form[keys.description]} max={TEXT_MAX} />
        <textarea
          key={keys.description}
          dir={dir} spellCheck rows={4}
          style={{ ...textStyle, resize: 'vertical' }}
          placeholder={L.descPh}
          value={form[keys.description]}
          onChange={(e) => onChange(keys.description, e.target.value)}
          {...NO_WRITING_ASSIST}
        />
      </div>
      <div>
        <FieldLabel text={L.instructions} value={form[keys.instructions]} max={TEXT_MAX} />
        <textarea
          key={keys.instructions}
          dir={dir} spellCheck rows={6}
          style={{ ...textStyle, resize: 'vertical' }}
          placeholder={L.instrPh}
          value={form[keys.instructions]}
          onChange={(e) => onChange(keys.instructions, e.target.value)}
          {...NO_WRITING_ASSIST}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
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
}

const isGraded = (s: Submission) => s.grade !== undefined && s.grade !== null

/**
 * Renders the student's attachment INLINE so the instructor never has to click
 * through: images render as a picture, PDFs in an embedded viewer, and formats
 * browsers cannot display (doc/docx) fall back to a labelled open-link.
 */
const AttachmentPreview: React.FC<{ url: string }> = ({ url }) => {
  const [imgFailed, setImgFailed] = useState(false)
  useEffect(() => { setImgFailed(false) }, [url])

  const clean = url.split('?')[0].toLowerCase()
  const ext = clean.slice(clean.lastIndexOf('.') + 1)
  // A dead image URL must fall through to the generic file card, not a broken glyph.
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) && !imgFailed
  const isPdf = ext === 'pdf'

  const frame: React.CSSProperties = {
    border: '1px solid rgba(107,29,42,0.14)', borderRadius: 10,
    overflow: 'hidden', background: '#fff',
  }

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lx-text-mid)' }}>
          <i className="isax isax-paperclip-2" style={{ marginInlineEnd: 5 }} />
          Attachment ({ext.toUpperCase()})
        </span>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--lx-primary)', fontWeight: 600 }}>
          Open full size ↗
        </a>
      </div>

      {isImage && (
        <a href={url} target="_blank" rel="noreferrer" style={{ ...frame, display: 'block' }}>
          <img src={url} alt="Student attachment" onError={() => setImgFailed(true)} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', background: '#faf8f5' }} />
        </a>
      )}

      {isPdf && (
        <div style={frame}>
          <iframe src={`${url}#toolbar=0&view=FitH`} title="Student attachment" style={{ width: '100%', height: 460, border: 'none', display: 'block' }} />
        </div>
      )}

      {!isImage && !isPdf && (
        <a
          href={url} target="_blank" rel="noreferrer"
          style={{ ...frame, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', textDecoration: 'none' }}
        >
          <i className="isax isax-document-text" style={{ fontSize: 26, color: 'var(--lx-primary)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lx-text)' }}>{ext.toUpperCase()} file</div>
            <div style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>Preview not supported — click to open</div>
          </div>
        </a>
      )}
    </div>
  )
}

/**
 * NOTE: GlassModal and ModalHeader MUST stay at module scope.
 * If they are declared inside InstructorAssignment they get a new function
 * identity on every render, so React treats them as a different component type
 * and unmounts/remounts the whole modal on each keystroke — which makes the
 * inputs lose focus after every character typed.
 */
const GlassModal: React.FC<{ children: React.ReactNode; maxWidth?: number; onClose: () => void }> = ({
  children, maxWidth = 600, onClose,
}) => (
  <div
    style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div style={{ width: '100%', maxWidth, background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)', borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)', boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)' }}>
      {children}
    </div>
  </div>
)

const ModalHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{title}</h5>
    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
      <i className="isax isax-close-circle" />
    </button>
  </div>
)

const InstructorAssignment: React.FC = () => {
  const { t } = useTranslation();
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

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsError, setSubmissionsError] = useState<string | null>(null)
  const [activeSubId, setActiveSubId] = useState<string | null>(null)
  const [subSearch, setSubSearch] = useState('')
  const [subFilter, setSubFilter] = useState<'all' | 'ungraded' | 'graded'>('all')
  const [gradeValue, setGradeValue] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [grading, setGrading] = useState(false)

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

  const openSubmissions = useCallback(async (a: Assignment) => {
    setSelected(a)
    setSubmissions([])
    setSubmissionsError(null)
    setActiveSubId(null)
    setSubSearch('')
    setSubFilter('all')
    setGradeValue('')
    setGradeFeedback('')
    setModal('submissions')
    setSubmissionsLoading(true)
    try {
      const data = await assignmentService.getSubmissionsForAssignment(a.id, 0, 200)
      const list = Array.isArray(data?.content) ? data.content : []
      setSubmissions(list)
      if (list.length > 0) selectSubmission(list[0])   // open the first student straight away
    } catch (e) {
      setSubmissionsError(extractApiError(e, 'Failed to load submissions'))
    } finally {
      setSubmissionsLoading(false)
    }
  }, [])

  /** Show one student's work and preload their existing grade into the form. */
  function selectSubmission(sub: Submission) {
    setActiveSubId(sub.id)
    setGradeValue(sub.grade !== undefined && sub.grade !== null ? String(sub.grade) : '')
    setGradeFeedback(sub.feedback || '')
  }

  const submitGrade = async (submissionId: string) => {
    const grade = parseInt(gradeValue)
    if (isNaN(grade) || grade < 0) return
    setGrading(true)
    setSubmissionsError(null)
    try {
      const updated = await assignmentService.gradeSubmission(submissionId, { grade, feedback: gradeFeedback.trim() || undefined })
      setSubmissions(prev => prev.map(s => s.id === submissionId ? updated : s))
    } catch (e) {
      setSubmissionsError(extractApiError(e, 'Failed to save grade'))
    } finally {
      setGrading(false)
    }
  }

  // ── Derived view state for the submissions modal ──────────────────────────
  const gradedCount = submissions.filter(isGraded).length
  const visibleSubmissions = submissions.filter(s => {
    if (subFilter === 'graded' && !isGraded(s)) return false
    if (subFilter === 'ungraded' && isGraded(s)) return false
    const q = subSearch.trim().toLowerCase()
    if (!q) return true
    return (s.studentName || '').toLowerCase().includes(q)
        || (s.studentEmail || '').toLowerCase().includes(q)
  })
  const activeSub = submissions.find(s => s.id === activeSubId) || null

  const openAdd = () => { setForm(emptyForm()); setModal('add'); }
  const openView = (a: Assignment) => { setSelected(a); setModal('view'); }
  const openEdit = (a: Assignment) => {
    setSelected(a);
    setForm({
      courseId: a.courseId || '',
      // An Arabic-only assignment also stores its Arabic title in `title` (the column is
      // required) — keep that copy out of the English tab.
      title: a.titleAr && a.title === a.titleAr ? '' : (a.title || ''),
      titleAr: a.titleAr || '',
      description: a.description || '',
      descriptionAr: a.descriptionAr || '',
      instructions: a.instructions || '',
      instructionsAr: a.instructionsAr || '',
      dueDate: a.dueDate ? a.dueDate.split('T')[0] : '',
      totalMark: String(a.totalMark ?? 100),
      status: a.status || 'DRAFT',
    });
    setModal('edit');
  }
  const openDelete = (a: Assignment) => { setSelected(a); setModal('delete'); }
  const closeModal = () => { setModal('none'); setSelected(null); }

  const formValid = hasTitle(form) && !tooLong(form)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid || !form.courseId) return
    setSubmitting(true)
    try {
      await instructorService.createAssignment({ courseId: form.courseId, ...toPayload(form) })
      closeModal()
      fetchAssignments(0)
    } catch (err) { message.error(extractApiError(err, 'Failed to create assignment.')) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !formValid) return
    setSubmitting(true)
    try {
      await instructorService.updateAssignment(selected.id, toPayload(form))
      closeModal()
      fetchAssignments(currentPage)
    } catch (err) { message.error(extractApiError(err, 'Failed to update assignment.')) }
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
                        <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openSubmissions(a)} title="Submissions"><i className="isax isax-document-text" /></button>
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
        <GlassModal maxWidth={700} onClose={closeModal}>
          <ModalHeader title="Add New Assignment" onClose={closeModal} />
          <form onSubmit={handleAdd}>
            <div style={{ padding: 24, maxHeight: '68vh', overflowY: 'auto' }}><AssignmentFormFields form={form} courses={courses} onChange={updateForm} /></div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting || !formValid || !form.courseId}>
                {submitting ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : 'Create'}
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <GlassModal onClose={closeModal}>
          <ModalHeader title="Assignment Details" onClose={closeModal} />
          <div style={{ padding: 24, maxHeight: '68vh', overflowY: 'auto' }}>
            {[
              { label: 'Title', value: selected.titleAr && selected.title === selected.titleAr ? '—' : selected.title },
              { label: 'Title (Arabic)', value: selected.titleAr || '—' },
              { label: 'Course', value: selected.courseTitle || '—' },
              { label: 'Description', value: selected.description || '—' },
              { label: 'Description (Arabic)', value: selected.descriptionAr || '—' },
              { label: 'Instructions', value: selected.instructions || '—' },
              { label: 'Instructions (Arabic)', value: selected.instructionsAr || '—' },
              { label: 'Due Date', value: formatDate(selected.dueDate) },
              { label: 'Total Mark', value: String(selected.totalMark ?? '—') },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: 16, padding: 14, borderRadius: 'var(--lx-radius)', background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>{f.label}</p>
                <p dir="auto" style={{ margin: 0, color: 'var(--lx-text)', whiteSpace: 'pre-wrap' }}>{f.value}</p>
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
        <GlassModal maxWidth={700} onClose={closeModal}>
          <ModalHeader title="Edit Assignment" onClose={closeModal} />
          <form onSubmit={handleEdit}>
            <div style={{ padding: 24, maxHeight: '68vh', overflowY: 'auto' }}><AssignmentFormFields form={form} courses={courses} onChange={updateForm} /></div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting || !formValid}>
                {submitting ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* Submissions Modal */}
      {modal === 'submissions' && selected && (
        <GlassModal maxWidth={1080} onClose={closeModal}>
          <ModalHeader title={`Submissions — ${selected.title}`} onClose={closeModal} />

          {submissionsLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--lx-text-muted)' }}>Loading…</div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--lx-text-muted)', fontSize: 14 }}>
              <i className="isax isax-document" style={{ fontSize: 34, display: 'block', marginBottom: 10, opacity: 0.4 }} />
              No submissions yet
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div style={{ display: 'flex', gap: 18, padding: '12px 24px', borderBottom: '1px solid rgba(107,29,42,0.08)', fontSize: 12.5, color: 'var(--lx-text-mid)', flexWrap: 'wrap' }}>
                <span><strong>{submissions.length}</strong> submitted</span>
                <span style={{ color: '#16a34a' }}><strong>{gradedCount}</strong> graded</span>
                <span style={{ color: '#d97706' }}><strong>{submissions.length - gradedCount}</strong> ungraded</span>
                <span style={{ marginInlineStart: 'auto' }}>Total mark: <strong>{selected.totalMark}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 420, maxHeight: '62vh' }}>

                {/* ── Left: student list ── */}
                <div style={{ flex: '0 0 258px', borderInlineEnd: '1px solid rgba(107,29,42,0.08)', display: 'flex', flexDirection: 'column', background: 'rgba(107,29,42,0.015)' }}>
                  <div style={{ padding: '12px 12px 8px' }}>
                    <input
                      type="text"
                      value={subSearch}
                      onChange={e => setSubSearch(e.target.value)}
                      placeholder="Search student…"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(107,29,42,0.14)', fontSize: 12.5, outline: 'none', background: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      {(['all', 'ungraded', 'graded'] as const).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setSubFilter(f)}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                            border: '1px solid ' + (subFilter === f ? 'transparent' : 'rgba(107,29,42,0.14)'),
                            background: subFilter === f ? '#6B1D2A' : '#fff',
                            color: subFilter === f ? '#fff' : 'var(--lx-text-mid)',
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 10px' }}>
                    {visibleSubmissions.length === 0 ? (
                      <p style={{ fontSize: 12.5, color: 'var(--lx-text-muted)', textAlign: 'center', padding: '18px 6px', margin: 0 }}>
                        No student matches
                      </p>
                    ) : visibleSubmissions.map(sub => {
                      const active = sub.id === activeSubId
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => selectSubmission(sub)}
                          style={{
                            width: '100%', textAlign: 'start', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 9,
                            padding: '9px 10px', marginBottom: 4, borderRadius: 8,
                            border: '1px solid ' + (active ? 'rgba(107,29,42,0.22)' : 'transparent'),
                            background: active ? '#fff' : 'transparent',
                            boxShadow: active ? '0 2px 8px rgba(44,24,16,0.07)' : 'none',
                          }}
                        >
                          <span style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: isGraded(sub) ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.12)',
                            color: isGraded(sub) ? '#16a34a' : '#d97706',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800,
                          }}>
                            {(sub.studentName || '?').charAt(0).toUpperCase()}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--lx-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.studentName}
                            </span>
                            <span style={{ display: 'block', fontSize: 11, color: isGraded(sub) ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                              {isGraded(sub) ? `${sub.grade}/${sub.totalMark}` : 'Ungraded'}
                            </span>
                          </span>
                          {sub.fileUrl && <i className="isax isax-paperclip-2" style={{ fontSize: 12, color: 'var(--lx-text-muted)' }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Right: the selected student's work ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', minWidth: 0 }}>
                  {submissionsError && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(139,35,53,0.06)', color: '#8B2335', fontSize: 13, marginBottom: 14 }}>
                      {submissionsError}
                    </div>
                  )}

                  {!activeSub ? (
                    <p style={{ color: 'var(--lx-text-muted)', fontSize: 13.5, textAlign: 'center', paddingTop: 40 }}>
                      Select a student on the left to review their work.
                    </p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                        <div>
                          <h6 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--lx-text)' }}>{activeSub.studentName}</h6>
                          <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{activeSub.studentEmail}</span>
                        </div>
                        <span style={{
                          fontSize: 12.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                          background: isGraded(activeSub) ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)',
                          color: isGraded(activeSub) ? '#16a34a' : '#d97706',
                        }}>
                          {isGraded(activeSub) ? `${activeSub.grade} / ${activeSub.totalMark}` : 'Ungraded'}
                        </span>
                      </div>

                      {/* Written answer */}
                      <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lx-text-mid)', display: 'block', marginBottom: 6 }}>
                          <i className="isax isax-note-1" style={{ marginInlineEnd: 5 }} />Answer
                        </span>
                        <div style={{ fontSize: 13.5, color: 'var(--lx-text)', background: 'rgba(107,29,42,0.025)', border: '1px solid rgba(107,29,42,0.08)', borderRadius: 8, padding: '11px 13px', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                          {activeSub.content || <em style={{ color: 'var(--lx-text-muted)' }}>No written answer</em>}
                        </div>
                      </div>

                      {/* Attachment — rendered inline, no click needed */}
                      {activeSub.fileUrl
                        ? <AttachmentPreview url={activeSub.fileUrl} />
                        : (
                          <p style={{ fontSize: 12.5, color: 'var(--lx-text-muted)', fontStyle: 'italic', margin: '0 0 4px' }}>
                            No attachment submitted
                          </p>
                        )}

                      {/* Grading — always visible for the selected student */}
                      <div style={{ marginTop: 18, padding: '14px 16px', background: 'rgba(107,29,42,0.03)', borderRadius: 10, border: '1px solid rgba(107,29,42,0.08)' }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                          <div style={{ flex: '0 0 110px' }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mark (/{activeSub.totalMark})</label>
                            <input
                              type="number" min={0} max={activeSub.totalMark}
                              value={gradeValue}
                              onChange={e => setGradeValue(e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid rgba(107,29,42,0.16)', fontSize: 13, outline: 'none' }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Feedback (optional)</label>
                            <input
                              type="text"
                              value={gradeFeedback}
                              onChange={e => setGradeFeedback(e.target.value)}
                              placeholder="Great work! / Needs improvement…"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid rgba(107,29,42,0.16)', fontSize: 13, outline: 'none' }}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="lx-btn lx-btn-sm lx-btn-primary"
                          disabled={grading || gradeValue === ''}
                          onClick={() => submitGrade(activeSub.id)}
                        >
                          {grading ? 'Saving…' : isGraded(activeSub) ? 'Update Mark' : 'Save Mark'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(107,29,42,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>Close</button>
          </div>
        </GlassModal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <GlassModal maxWidth={420} onClose={closeModal}>
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
