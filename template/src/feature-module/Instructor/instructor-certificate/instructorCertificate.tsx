import React, { useState, useEffect, useCallback, useRef } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import certificateService from '../../../services/api/certificate.service'
import instructorService from '../../../services/api/instructor.service'
import { Certificate } from '../../../services/api/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseItem {
  id: string
  title: string
  thumbnailUrl?: string
  hasCertificateTemplate: boolean
}

type ActiveTab = 'templates' | 'issued'
type ModalState = 'none' | 'view'

// ─── Component ────────────────────────────────────────────────────────────────

const InstructorCertificate = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('templates')

  const [courses, setCourses] = useState<CourseItem[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [successId, setSuccessId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 10

  const [modal, setModal] = useState<ModalState>('none')
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true)
      setCoursesError(null)
      const data = await instructorService.getMyCourses(0, 100)
      setCourses(
        (data?.content ?? []).map((c: any) => ({
          id: String(c.id),
          title: c.title,
          thumbnailUrl: c.thumbnailUrl,
          hasCertificateTemplate: Boolean(c.hasCertificateTemplate),
        }))
      )
    } catch (err) {
      console.error('Failed to load courses:', err)
      setCoursesError('Failed to load your courses. Please try again.')
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  const fetchCertificates = useCallback(async (page: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await certificateService.getInstructorCertificates(page, pageSize)
      setCertificates(Array.isArray(data?.content) ? data.content : [])
      setTotalPages(data?.totalPages ?? 0)
      setTotalElements(data?.totalElements ?? 0)
      setCurrentPage(data?.page ?? 0)
    } catch (err) {
      console.error('Failed to load certificates:', err)
      setError('Failed to load certificates. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  useEffect(() => {
    if (activeTab === 'issued') fetchCertificates(0)
  }, [activeTab, fetchCertificates])

  const handleTemplateUpload = async (courseId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a PNG or JPG image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10 MB.')
      return
    }

    setUploadError(null)
    setUploadingId(courseId)
    setUploadProgress((prev) => ({ ...prev, [courseId]: 0 }))

    try {
      await certificateService.uploadCertificateTemplate(courseId, file, (pct) => {
        setUploadProgress((prev) => ({ ...prev, [courseId]: pct }))
      })
      setSuccessId(courseId)
      await fetchCourses()
      setTimeout(() => setSuccessId(null), 3000)
    } catch (err) {
      console.error('Failed to upload template:', err)
      setUploadError('Failed to upload the template. Please try again.')
    } finally {
      setUploadingId(null)
      setUploadProgress((prev) => {
        const next = { ...prev }
        delete next[courseId]
        return next
      })
      if (fileInputRefs.current[courseId]) {
        fileInputRefs.current[courseId]!.value = ''
      }
    }
  }

  const openView = (cert: Certificate) => { setSelected(cert); setModal('view') }
  const closeModal = () => { setModal('none'); setSelected(null) }

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id)
    try {
      const blob = await certificateService.downloadCertificateByInstructor(cert.id)
      certificateService.triggerDownload(
        blob,
        `certificate-${cert.studentName.replace(/\s+/g, '-')}-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`
      )
    } catch (err) {
      console.error('Failed to download certificate:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  // ── Render pagination ────────────────────────────────────────────────────
  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>
          Page {currentPage + 1} of {totalPages} · {totalElements} certificates
        </p>
        <div className="d-flex gap-1">
          <button
            className="lx-btn lx-btn-outline lx-btn-sm"
            onClick={() => fetchCertificates(currentPage - 1)}
            disabled={currentPage === 0}
            style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
          >
            <i className="isax isax-arrow-left-2" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`lx-btn lx-btn-sm ${i === currentPage ? 'lx-btn-gold' : 'lx-btn-outline'}`}
              onClick={() => fetchCertificates(i)}
              style={{ minWidth: 36, justifyContent: 'center' }}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="lx-btn lx-btn-outline lx-btn-sm"
            onClick={() => fetchCertificates(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            style={{ opacity: currentPage === totalPages - 1 ? 0.4 : 1 }}
          >
            <i className="isax isax-arrow-right-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <LuxuryDashboardLayout>

      {/* Header + tabs */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>Certificates</h5>
        <div className="d-flex gap-2">
          {(['templates', 'issued'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`lx-btn lx-btn-sm ${activeTab === tab ? '' : 'lx-btn-outline'}`}
              style={activeTab === tab ? {
                background: 'var(--lx-primary)',
                color: '#fff',
                border: '1.5px solid var(--lx-primary)',
              } : {}}
            >
              <i className={tab === 'templates' ? 'isax isax-gallery' : 'isax isax-medal-star'} />
              {tab === 'templates' ? 'Templates' : 'Issued'}
              {tab === 'issued' && !loading && totalElements > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'rgba(107, 29, 42, 0.08)',
                    padding: '1px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {totalElements}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB 1 — Templates ══════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div>
          {/* Info banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--lx-radius)',
              background: 'rgba(74, 125, 170, 0.06)',
              border: '1px solid rgba(74, 125, 170, 0.12)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <i className="isax isax-info-circle" style={{ color: '#4A7DAA', fontSize: 18, marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13.5, color: 'var(--lx-text-mid)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--lx-text)' }}>How it works:</strong> Upload a certificate background image
              (PNG/JPG, landscape A4) for each course. When a student completes the
              course, their <strong style={{ color: 'var(--lx-text)' }}>name will be written automatically</strong> on your
              template and the certificate will be issued instantly.
            </div>
          </div>

          {uploadError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(139, 35, 53, 0.06)',
                border: '1px solid rgba(139, 35, 53, 0.12)',
                color: '#8B2335',
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="isax isax-warning-2" />{uploadError}
              <button
                onClick={() => setUploadError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8B2335', fontSize: 16 }}
              >
                ×
              </button>
            </div>
          )}

          {coursesError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(139, 35, 53, 0.06)',
                border: '1px solid rgba(139, 35, 53, 0.12)',
                color: '#8B2335',
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="isax isax-warning-2" />{coursesError}
            </div>
          )}

          {coursesLoading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading your courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-book" /></div>
              <h6>No courses found.</h6>
              <p>Create a course first to upload its certificate template.</p>
            </div>
          ) : (
            <div className="row g-3">
              {courses.map((course) => (
                <div key={course.id} className="col-md-6">
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 'var(--lx-radius)',
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(107, 29, 42, 0.08)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Course info row */}
                    <div className="d-flex align-items-start gap-3" style={{ marginBottom: 12 }}>
                      <img
                        src={course.thumbnailUrl || '/assets/img/course/course-default.jpg'}
                        alt={course.title}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--lx-radius-sm)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--lx-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={course.title}>
                          {course.title}
                        </p>
                        {course.hasCertificateTemplate ? (
                          <span className="lx-badge badge-success" style={{ fontSize: 11 }}>
                            <i className="isax isax-tick-circle" style={{ marginRight: 4 }} />Template uploaded
                          </span>
                        ) : (
                          <span className="lx-badge badge-warning" style={{ fontSize: 11 }}>
                            <i className="isax isax-warning-2" style={{ marginRight: 4 }} />No template yet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {uploadingId === course.id && uploadProgress[course.id] !== undefined && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(107, 29, 42, 0.06)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${uploadProgress[course.id]}%`,
                              height: '100%',
                              borderRadius: 3,
                              background: 'linear-gradient(90deg, var(--lx-primary), var(--lx-primary-light))',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <p style={{ color: 'var(--lx-text-muted)', fontSize: 11, marginTop: 4, marginBottom: 0 }}>
                          Uploading… {uploadProgress[course.id]}%
                        </p>
                      </div>
                    )}

                    {/* Success feedback */}
                    {successId === course.id && (
                      <div
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--lx-radius-sm)',
                          background: 'rgba(45, 95, 63, 0.06)',
                          border: '1px solid rgba(45, 95, 63, 0.12)',
                          color: 'var(--lx-green)',
                          fontSize: 13,
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <i className="isax isax-tick-circle" />Template saved!
                      </div>
                    )}

                    {/* Upload button */}
                    <label
                      className={`lx-btn lx-btn-sm ${course.hasCertificateTemplate ? 'lx-btn-outline' : 'lx-btn-gold'}`}
                      style={{
                        width: '100%',
                        marginTop: 'auto',
                        justifyContent: 'center',
                        cursor: uploadingId === course.id ? 'not-allowed' : 'pointer',
                        opacity: uploadingId === course.id ? 0.6 : 1,
                      }}
                    >
                      {uploadingId === course.id ? (
                        <>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <i className={`isax ${course.hasCertificateTemplate ? 'isax-refresh' : 'isax-gallery-add'}`} />
                          {course.hasCertificateTemplate ? 'Replace Template' : 'Upload Template'}
                        </>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[course.id] = el }}
                        type="file"
                        style={{ display: 'none' }}
                        accept="image/png,image/jpeg,image/jpg"
                        disabled={uploadingId === course.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleTemplateUpload(course.id, file)
                        }}
                      />
                    </label>
                    <p style={{ color: 'var(--lx-text-muted)', fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 0 }}>
                      PNG or JPG · Landscape A4 · Max 10 MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2 — Issued Certificates ════════════════════════════ */}
      {activeTab === 'issued' && (
        <div className="lx-card">
          <div className="lx-card-body" style={{ padding: error || loading || certificates.length === 0 ? 24 : 0 }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--lx-radius-sm)',
                  background: 'rgba(139, 35, 53, 0.06)',
                  border: '1px solid rgba(139, 35, 53, 0.12)',
                  color: '#8B2335',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="isax isax-warning-2" />{error}
              </div>
            )}

            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading certificates…</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="lx-empty-state">
                <div className="empty-icon"><i className="isax isax-medal-star" /></div>
                <h6>No certificates issued yet.</h6>
                <p>Upload a template for your courses — certificates are issued automatically when students complete them.</p>
                <button
                  className="lx-btn lx-btn-outline lx-btn-sm"
                  onClick={() => setActiveTab('templates')}
                >
                  <i className="isax isax-gallery-add" />
                  Go to Templates
                </button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="lx-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th style={{ width: 175 }}>Certificate #</th>
                        <th style={{ width: 120 }}>Issued Date</th>
                        <th style={{ width: 90 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert.id}>
                          <td>
                            <p style={{ fontWeight: 600, marginBottom: 2, fontSize: 13.5, color: 'var(--lx-text)' }}>{cert.studentName}</p>
                            {cert.studentEmail && (
                              <p style={{ color: 'var(--lx-text-muted)', fontSize: 12, marginBottom: 0 }}>{cert.studentEmail}</p>
                            )}
                          </td>
                          <td>
                            <p style={{ fontWeight: 500, fontSize: 13.5, color: 'var(--lx-text)', marginBottom: 0 }}>{cert.courseTitle}</p>
                          </td>
                          <td>
                            <code style={{ fontSize: 12, background: 'rgba(107, 29, 42, 0.04)', padding: '2px 8px', borderRadius: 4, color: 'var(--lx-text)' }}>
                              {cert.certificateNumber}
                            </code>
                          </td>
                          <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(cert.issuedAt)}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                className="lx-btn lx-btn-outline lx-btn-sm"
                                title="View details"
                                onClick={() => openView(cert)}
                              >
                                <i className="isax isax-eye" />
                              </button>
                              <button
                                className="lx-btn lx-btn-outline lx-btn-sm"
                                title="Download PDF"
                                onClick={() => handleDownload(cert)}
                                disabled={downloadingId === cert.id}
                              >
                                {downloadingId === cert.id ? (
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <i className="isax isax-import" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '0 20px 16px' }}>
                  {renderPagination()}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── View Certificate Modal ── */}
      {modal === 'view' && selected && (
        <>
          <div
            onClick={closeModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(44, 24, 16, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 1040,
            }}
          />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
            <div
              style={{
                width: '100%',
                maxWidth: 700,
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderRadius: 'var(--lx-radius-lg)',
                border: '1px solid rgba(107, 29, 42, 0.1)',
                boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0, fontSize: 16 }}>Certificate Details</h5>
                <button
                  onClick={closeModal}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--lx-text-muted)', fontSize: 20 }}
                >
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: 24 }}>
                {/* Certificate preview */}
                <div
                  style={{
                    padding: 32,
                    borderRadius: 'var(--lx-radius)',
                    background: 'linear-gradient(135deg, var(--lx-bg-warm) 0%, var(--lx-bg-structure) 100%)',
                    border: '1px solid rgba(107, 29, 42, 0.06)',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(197, 151, 62, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <i className="isax isax-medal-star" style={{ fontSize: 32, color: 'var(--lx-gold)' }} />
                  </div>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, color: 'var(--lx-text-muted)', letterSpacing: '0.5px', marginBottom: 4 }}>Certificate of Completion</p>
                  <p style={{ fontSize: 14, color: 'var(--lx-text-muted)', marginBottom: 8 }}>This is to certify that</p>
                  <h4 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 4 }}>{selected.studentName}</h4>
                  <p style={{ fontSize: 14, color: 'var(--lx-text-muted)', marginBottom: 8 }}>has successfully completed</p>
                  <h5 style={{ fontWeight: 600, color: 'var(--lx-primary)', marginBottom: 16 }}>{selected.courseTitle}</h5>
                  {selected.instructorName && (
                    <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', marginBottom: 4 }}>Instructor: <strong style={{ color: 'var(--lx-text)' }}>{selected.instructorName}</strong></p>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>
                    Completed on {formatDate(selected.completionDate || selected.issuedAt)}
                  </p>
                </div>

                {/* Details grid */}
                <div className="row g-3">
                  {[
                    { label: 'Student', value: selected.studentName, sub: selected.studentEmail },
                    { label: 'Course', value: selected.courseTitle },
                    { label: 'Certificate Number', value: selected.certificateNumber, code: true },
                    { label: 'Issued On', value: formatDate(selected.issuedAt) },
                  ].map((item, idx) => (
                    <div key={idx} className="col-md-6">
                      <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.label}
                      </p>
                      {item.code ? (
                        <code style={{ fontSize: 12, background: 'rgba(107, 29, 42, 0.04)', padding: '2px 8px', borderRadius: 4 }}>{item.value}</code>
                      ) : (
                        <p style={{ fontWeight: 500, marginBottom: 0, color: 'var(--lx-text)', fontSize: 14 }}>{item.value}</p>
                      )}
                      {item.sub && <p style={{ color: 'var(--lx-text-muted)', fontSize: 12, margin: 0 }}>{item.sub}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="lx-btn lx-btn-outline" onClick={closeModal}>Close</button>
                <button
                  className="lx-btn lx-btn-gold"
                  onClick={() => handleDownload(selected)}
                  disabled={downloadingId === selected.id}
                >
                  {downloadingId === selected.id ? (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <i className="isax isax-import" />
                  )}
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorCertificate
