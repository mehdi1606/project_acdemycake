import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import certificateService from '../../../services/api/certificate.service';
import { useTranslation } from 'react-i18next';
import { Certificate } from '../../../services/api/types';

// ─── Component ────────────────────────────────────────────────────────────────

const InstructorCertificate = () => {
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [selected, setSelected] = useState<Certificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchCertificates = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateService.getInstructorCertificates(page, pageSize);
      setCertificates(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setCurrentPage(data?.page ?? 0);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCertificates(0); }, [fetchCertificates]);

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id);
    try {
      const blob = await certificateService.downloadCertificateByInstructor(cert.id);
      certificateService.triggerDownload(
        blob,
        `certificate-${cert.studentName.replace(/\s+/g, '-')}-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`
      );
    } catch (err) {
      console.error('Failed to download certificate:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>
          Page {currentPage + 1} of {totalPages} · {totalElements} certificates
        </p>
        <div className="d-flex gap-1">
          <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => fetchCertificates(currentPage - 1)}
            disabled={currentPage === 0} style={{ opacity: currentPage === 0 ? 0.4 : 1 }}>
            <i className="isax isax-arrow-left-2" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`lx-btn lx-btn-sm ${i === currentPage ? 'lx-btn-gold' : 'lx-btn-outline'}`}
              onClick={() => fetchCertificates(i)} style={{ minWidth: 36, justifyContent: 'center' }}>
              {i + 1}
            </button>
          ))}
          <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => fetchCertificates(currentPage + 1)}
            disabled={currentPage === totalPages - 1} style={{ opacity: currentPage === totalPages - 1 ? 0.4 : 1 }}>
            <i className="isax isax-arrow-right-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <LuxuryDashboardLayout>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
            Issued Certificates
            {!loading && totalElements > 0 && (
              <span style={{ color: 'var(--lx-text-muted)', fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
                ({totalElements})
              </span>
            )}
          </h5>
          <p style={{ color: 'var(--lx-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Certificates automatically generated when students complete your courses
          </p>
        </div>
      </div>

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 18px', borderRadius: 'var(--lx-radius)',
        background: 'rgba(197, 151, 62, 0.06)', border: '1px solid rgba(197, 151, 62, 0.18)',
        marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <i className="isax isax-medal-star" style={{ color: '#C5973E', fontSize: 20, marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 13.5, color: 'var(--lx-text-mid)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--lx-text)' }}>Automatic generation:</strong> When a student completes 100% of
          your course, a personalized certificate is automatically generated with their name, course name,
          your name as instructor, and the completion date — no setup required.
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--lx-radius-sm)',
          background: 'rgba(139,35,53,0.06)', border: '1px solid rgba(139,35,53,0.12)',
          color: '#8B2335', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="isax isax-warning-2" />{error}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading certificates…</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-medal-star" /></div>
              <h6>No certificates issued yet.</h6>
              <p>Certificates will appear here as students complete your courses.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="lx-card">
          <div className="lx-card-body" style={{ padding: 0 }}>
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
                        <code style={{ fontSize: 12, background: 'rgba(107,29,42,0.04)', padding: '2px 8px', borderRadius: 4, color: 'var(--lx-text)' }}>
                          {cert.certificateNumber}
                        </code>
                      </td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(cert.issuedAt)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button className="lx-btn lx-btn-outline lx-btn-sm" title="View certificate"
                            onClick={() => setSelected(cert)}>
                            <i className="isax isax-eye" />
                          </button>
                          <button className="lx-btn lx-btn-outline lx-btn-sm" title="Download PDF"
                            onClick={() => handleDownload(cert)} disabled={downloadingId === cert.id}>
                            {downloadingId === cert.id
                              ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                              : <i className="isax isax-import" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 20px 16px' }}>{renderPagination()}</div>
          </div>
        </div>
      )}

      {/* ── Certificate Preview Modal ─────────────────────────────────────── */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{
            position: 'fixed', inset: 0,
            background: 'rgba(30, 12, 18, 0.55)', backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)', zIndex: 1040,
          }} />
          <div style={{
            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1050, padding: 16, overflowY: 'auto',
          }}>
            <div style={{
              width: '100%', maxWidth: 740,
              background: '#fff', borderRadius: 16,
              border: '1px solid rgba(107,29,42,0.12)',
              boxShadow: '0 32px 80px rgba(30,12,18,0.25)',
              overflow: 'hidden',
            }}>
              {/* Modal header */}
              <div style={{
                padding: '18px 24px', borderBottom: '1px solid rgba(107,29,42,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(252,248,240,0.8)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="isax isax-medal-star" style={{ fontSize: 22, color: '#C5973E' }} />
                  <h5 style={{ fontWeight: 700, color: '#4B121C', margin: 0, fontSize: 16 }}>Certificate of Completion</h5>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9e7a7a', fontSize: 22, padding: 4, lineHeight: 1,
                }}>
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Certificate visual — landscape layout matching PDF */}
              <div style={{ display: 'flex', minHeight: 280 }}>

                {/* Left maroon strip */}
                <div style={{
                  width: '26%', background: '#4B121C', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'space-between', padding: '28px 16px 24px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Ribbon decorations */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {[72, 60, 48].map((h, i) => (
                      <div key={i} style={{
                        width: 10, height: h, background: '#C5973E',
                        borderRadius: '0 0 4px 4px',
                      }} />
                    ))}
                  </div>

                  {/* Academy name */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#C5973E', fontWeight: 800, fontSize: 13, letterSpacing: 3, margin: 0 }}>SARALOWE</p>
                    <p style={{ color: 'rgba(245,235,200,0.7)', fontSize: 9, letterSpacing: 4, margin: '2px 0 0' }}>ACADEMY</p>
                  </div>

                  {/* Medal */}
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #FFE082, #C5973E)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="isax isax-medal-star" style={{ fontSize: 28, color: '#4B121C' }} />
                  </div>
                </div>

                {/* Right content */}
                <div style={{
                  flex: 1, background: '#FDF8F0',
                  padding: '28px 32px 24px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  position: 'relative',
                }}>
                  {/* Double border */}
                  <div style={{
                    position: 'absolute', inset: 8,
                    border: '1.5px solid #C5973E', borderRadius: 6, pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 13,
                    border: '0.5px solid rgba(197,151,62,0.35)', borderRadius: 4, pointerEvents: 'none',
                  }} />

                  <div style={{ position: 'relative', textAlign: 'center', paddingTop: 8 }}>
                    <p style={{
                      fontSize: 22, fontWeight: 900, color: '#4B121C',
                      letterSpacing: 5, margin: 0, textTransform: 'uppercase',
                    }}>CERTIFICATE</p>
                    <p style={{
                      fontSize: 11, color: '#C5973E', letterSpacing: 4,
                      textTransform: 'uppercase', margin: '2px 0 16px',
                    }}>OF COMPLETION</p>

                    <p style={{ fontSize: 12, color: '#9e7a7a', margin: '0 0 6px' }}>
                      This certificate is proudly presented to
                    </p>

                    <p style={{
                      fontSize: 26, fontWeight: 700, fontStyle: 'italic',
                      color: '#6B1D2A', margin: '0 0 2px', lineHeight: 1.2,
                    }}>
                      {selected.studentName}
                    </p>
                    <div style={{
                      height: 1.5, background: 'linear-gradient(90deg, transparent, #C5973E, transparent)',
                      margin: '6px auto 12px', width: '60%',
                    }} />

                    <p style={{ fontSize: 12, color: '#9e7a7a', margin: '0 0 4px' }}>
                      has successfully completed the course
                    </p>
                    <p style={{
                      fontSize: 16, fontWeight: 700, color: '#4B121C',
                      margin: '0 0 6px',
                    }}>
                      {selected.courseTitle}
                    </p>
                    <p style={{ fontSize: 11, color: '#9e7a7a', margin: 0 }}>
                      Completed on&nbsp;<strong style={{ color: '#6B1D2A' }}>
                        {formatDate(selected.completionDate || selected.issuedAt)}
                      </strong>
                    </p>
                  </div>

                  {/* Signatures */}
                  <div style={{
                    position: 'relative', display: 'flex',
                    justifyContent: 'space-around', paddingTop: 16,
                  }}>
                    {[
                      { name: selected.instructorName ?? 'Instructor', role: 'Course Instructor' },
                      { name: 'Saralowe Academy', role: 'Academy Director' },
                    ].map((sig, i) => (
                      <div key={i} style={{ textAlign: 'center', minWidth: 120 }}>
                        <div style={{ height: 1, background: '#6B1D2A', marginBottom: 4 }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#4B121C', margin: 0 }}>{sig.name}</p>
                        <p style={{ fontSize: 9, color: '#9e7a7a', letterSpacing: 1, margin: 0 }}>{sig.role.toUpperCase()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cert number */}
                  <p style={{
                    position: 'relative', textAlign: 'center',
                    fontSize: 9, color: '#b0948a', margin: '10px 0 0', letterSpacing: 1,
                  }}>
                    Certificate No: <strong style={{ color: '#6B1D2A' }}>{selected.certificateNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Modal footer */}
              <div style={{
                padding: '14px 24px', borderTop: '1px solid rgba(107,29,42,0.07)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(252,248,240,0.6)', flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Student', value: selected.studentName },
                    { label: 'Instructor', value: selected.instructorName ?? '—' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p style={{ fontSize: 10, color: '#9e7a7a', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#4B121C', margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  <button className="lx-btn lx-btn-outline" onClick={() => setSelected(null)}>Close</button>
                  <button className="lx-btn lx-btn-gold" onClick={() => handleDownload(selected)}
                    disabled={downloadingId === selected.id}>
                    {downloadingId === selected.id
                      ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      : <i className="isax isax-import" />}
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorCertificate;
