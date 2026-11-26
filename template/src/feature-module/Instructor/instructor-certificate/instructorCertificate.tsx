import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import certificateService from '../../../services/api/certificate.service';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { Certificate } from '../../../services/api/types';

// ─── Component ────────────────────────────────────────────────────────────────

const InstructorCertificate = () => {
  const { t, i18n } = useTranslation();
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
      setError(t('instructor.certificatesPage.loadError', 'We couldn\'t load the certificates. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setError(t('instructor.certificatesPage.downloadError', 'The PDF couldn\'t be downloaded. Please try again in a moment.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-MA' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>
          {t('common.pageOf', 'Page {{page}} of {{total}}', { page: currentPage + 1, total: totalPages })} · {t('student.certificates.count', '{{count}} certificates', { count: totalElements })}
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
            {t('instructor.certificatesPage.title', 'Issued Certificates')}
            {!loading && totalElements > 0 && (
              <span style={{ color: 'var(--lx-text-muted)', fontSize: 14, fontWeight: 400, marginInlineStart: 8 }}>
                ({totalElements})
              </span>
            )}
          </h5>
          <p style={{ color: 'var(--lx-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            {t('instructor.certificatesPage.subtitle', 'Certificates automatically generated when students complete your courses')}
          </p>
        </div>
      </div>

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 18px', borderRadius: 'var(--lx-radius)',
        background: 'rgba(197, 145, 44, 0.06)', border: '1px solid rgba(197, 145, 44, 0.18)',
        marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <i className="isax isax-medal-star" style={{ color: '#C5912C', fontSize: 20, marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 13.5, color: 'var(--lx-text-mid)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--lx-text)' }}>{t('instructor.certificatesPage.autoTitle', 'Automatic generation:')}</strong>{' '}
          {t('instructor.certificatesPage.autoDesc', 'When a student completes 100% of your course, a personalized certificate is automatically generated with their name, course name, your name as instructor, and the completion date — no setup required.')}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--lx-radius-sm)',
          background: 'rgba(101, 28, 50,0.06)', border: '1px solid rgba(101, 28, 50,0.12)',
          color: '#651C32', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="isax isax-warning-2" />{error}
          <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" style={{ marginInlineStart: 'auto' }} onClick={() => fetchCertificates(currentPage)}>
            {t('common.tryAgain', 'Try Again')}
          </button>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>{t('student.certificates.loading', 'Loading your certificates...')}</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-medal-star" /></div>
              <h6>{t('instructor.certificatesPage.emptyTitle', 'No certificates issued yet')}</h6>
              <p>{t('instructor.certificatesPage.emptyDesc', 'Certificates will appear here as students complete your courses.')}</p>
              <Link to={all_routes.studentsList} className="lx-btn lx-btn-outline lx-btn-sm">
                <i className="isax isax-people" /> {t('instructor.certificatesPage.seeStudents', 'See your students\' progress')}
              </Link>
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
                    <th>{t('common.student', 'Student')}</th>
                    <th>{t('instructor.certificatesPage.course', 'Course')}</th>
                    <th style={{ width: 175 }}>{t('student.certificates.certificateNo', 'Certificate #')}</th>
                    <th style={{ width: 120 }}>{t('instructor.certificatesPage.issuedDate', 'Issued Date')}</th>
                    <th style={{ width: 90 }}>{t('common.actions', 'Actions')}</th>
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
                        <code style={{ fontSize: 12, background: 'rgba(101, 28, 50,0.04)', padding: '2px 8px', borderRadius: 4, color: 'var(--lx-text)' }}>
                          {cert.certificateNumber}
                        </code>
                      </td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(cert.issuedAt)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button className="lx-btn lx-btn-outline lx-btn-sm" title={t('instructor.certificatesPage.view', 'View certificate')}
                            onClick={() => setSelected(cert)}>
                            <i className="isax isax-eye" />
                          </button>
                          <button className="lx-btn lx-btn-outline lx-btn-sm" title={t('student.certificates.downloadPdf', 'Download PDF')}
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
            background: 'rgba(43, 15, 30, 0.55)', backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)', zIndex: 1040,
          }} />
          <div style={{
            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1050, padding: 16, overflowY: 'auto',
          }}>
            <div style={{
              width: '100%', maxWidth: 740,
              background: '#fff', borderRadius: 16,
              border: '1px solid rgba(101, 28, 50,0.12)',
              boxShadow: '0 32px 80px rgba(43, 15, 30,0.25)',
              overflow: 'hidden',
            }}>
              {/* Modal header */}
              <div style={{
                padding: '18px 24px', borderBottom: '1px solid rgba(101, 28, 50,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(252,248,240,0.8)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="isax isax-medal-star" style={{ fontSize: 22, color: '#C5912C' }} />
                  <h5 style={{ fontWeight: 700, color: '#4A1428', margin: 0, fontSize: 16 }}>{t('student.certificates.ofCompletion', 'Certificate of Completion')}</h5>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#7C6A73', fontSize: 22, padding: 4, lineHeight: 1,
                }}>
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Certificate visual — landscape layout matching PDF */}
              <div style={{ display: 'flex', minHeight: 280 }}>

                {/* Left maroon strip */}
                <div style={{
                  width: '26%', background: '#4A1428', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'space-between', padding: '28px 16px 24px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Ribbon decorations */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {[72, 60, 48].map((h, i) => (
                      <div key={i} style={{
                        width: 10, height: h, background: '#C5912C',
                        borderRadius: '0 0 4px 4px',
                      }} />
                    ))}
                  </div>

                  {/* Academy name */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#C5912C', fontWeight: 800, fontSize: 13, letterSpacing: 3, margin: 0 }}>SARALOWE</p>
                    <p style={{ color: 'rgba(245,235,200,0.7)', fontSize: 12, letterSpacing: 4, margin: '2px 0 0' }}>ACADEMY</p>
                  </div>

                  {/* Medal */}
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #F3D58E, #C5912C)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="isax isax-medal-star" style={{ fontSize: 28, color: '#4A1428' }} />
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
                    border: '1.5px solid #C5912C', borderRadius: 6, pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 13,
                    border: '0.5px solid rgba(197, 145, 44,0.35)', borderRadius: 4, pointerEvents: 'none',
                  }} />

                  <div style={{ position: 'relative', textAlign: 'center', paddingTop: 8 }}>
                    <p style={{
                      fontSize: 22, fontWeight: 900, color: '#4A1428',
                      letterSpacing: 5, margin: 0, textTransform: 'uppercase',
                    }}>CERTIFICATE</p>
                    <p style={{
                      fontSize: 12, color: '#C5912C', letterSpacing: 4,
                      textTransform: 'uppercase', margin: '2px 0 16px',
                    }}>OF COMPLETION</p>

                    <p style={{ fontSize: 12, color: '#7C6A73', margin: '0 0 6px' }}>
                      This certificate is proudly presented to
                    </p>

                    <p style={{
                      fontSize: 26, fontWeight: 700, fontStyle: 'italic',
                      color: '#651C32', margin: '0 0 2px', lineHeight: 1.2,
                    }}>
                      {selected.studentName}
                    </p>
                    <div style={{
                      height: 1.5, background: 'linear-gradient(90deg, transparent, #C5912C, transparent)',
                      margin: '6px auto 12px', width: '60%',
                    }} />

                    <p style={{ fontSize: 12, color: '#7C6A73', margin: '0 0 4px' }}>
                      has successfully completed the course
                    </p>
                    <p style={{
                      fontSize: 16, fontWeight: 700, color: '#4A1428',
                      margin: '0 0 6px',
                    }}>
                      {selected.courseTitle}
                    </p>
                    <p style={{ fontSize: 12, color: '#7C6A73', margin: 0 }}>
                      Completed on&nbsp;<strong style={{ color: '#651C32' }}>
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
                        <div style={{ height: 1, background: '#651C32', marginBottom: 4 }} />
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#4A1428', margin: 0 }}>{sig.name}</p>
                        <p style={{ fontSize: 12, color: '#7C6A73', letterSpacing: 1, margin: 0 }}>{sig.role.toUpperCase()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cert number */}
                  <p style={{
                    position: 'relative', textAlign: 'center',
                    fontSize: 12, color: '#7C6A73', margin: '10px 0 0', letterSpacing: 1,
                  }}>
                    Certificate No: <strong style={{ color: '#651C32' }}>{selected.certificateNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Modal footer */}
              <div style={{
                padding: '14px 24px', borderTop: '1px solid rgba(101, 28, 50,0.07)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(252,248,240,0.6)', flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: t('common.student', 'Student'), value: selected.studentName },
                    { label: t('common.instructor', 'Instructor'), value: selected.instructorName ?? '—' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p style={{ fontSize: 12, color: '#7C6A73', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#4A1428', margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  <button className="lx-btn lx-btn-outline" onClick={() => setSelected(null)}>{t('common.close', 'Close')}</button>
                  <button className="lx-btn lx-btn-gold" onClick={() => handleDownload(selected)}
                    disabled={downloadingId === selected.id}>
                    {downloadingId === selected.id
                      ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      : <i className="isax isax-import" />}
                    {t('student.certificates.downloadPdf', 'Download PDF')}
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
