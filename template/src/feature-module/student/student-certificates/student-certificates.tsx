import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import certificateService from '../../../services/api/certificate.service';
import { Certificate } from '../../../services/api/types';

const PINK_BG = '#FCE6E8';
const CRIMSON = '#9D1C34';
const CRIM_DK = '#781224';

const StudentCertificates = () => {
  const { t } = useTranslation();
  const [certificates, setCertificates]   = useState<Certificate[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [selected, setSelected]           = useState<Certificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCertificates = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateService.getMyCertificates(page, pageSize);
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

  const handlePreview = async (cert: Certificate) => {
    setPreviewLoading(true);
    try {
      const blob = await certificateService.downloadCertificate(cert.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setSelected(cert);
    } catch {
      setPreviewUrl(null);
      setSelected(cert);
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id);
    try {
      const blob = await certificateService.downloadCertificate(cert.id);
      certificateService.triggerDownload(blob, `certificate-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Failed to download certificate:', err);
    } finally {
      setDownloadingId(null);
    }
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

      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
          My Certificates
          {!loading && (
            <span style={{ color: 'var(--lx-text-muted)', fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
              ({totalElements})
            </span>
          )}
        </h5>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--lx-radius-sm)',
          background: 'rgba(139,35,53,0.06)', border: '1px solid rgba(139,35,53,0.12)',
          color: '#8B2335', fontSize: 13, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="isax isax-warning-2" />{error}
        </div>
      )}

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid var(--lx-primary)', borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>
            Loading your certificates...
          </p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-medal-star" /></div>
              <h6>No certificates yet.</h6>
              <p>Complete a course to automatically earn your certificate!</p>
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
                    <th style={{ width: 40 }}>#</th>
                    <th>Certificate Name</th>
                    <th>Date</th>
                    <th>Certificate #</th>
                    <th>Instructor</th>
                    <th style={{ width: 90 }} />
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert, idx) => (
                    <tr key={cert.id}>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>
                        {currentPage * pageSize + idx + 1}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handlePreview(cert)}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            cursor: 'pointer', fontWeight: 600,
                            color: 'var(--lx-primary)', fontSize: 13.5, textAlign: 'left',
                          }}
                        >
                          {cert.courseTitle} Certificate
                        </button>
                      </td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>
                        {formatDate(cert.issuedAt)}
                      </td>
                      <td>
                        <code style={{
                          fontSize: 12, background: 'rgba(107,29,42,0.04)',
                          padding: '2px 8px', borderRadius: 4, color: 'var(--lx-text)',
                        }}>
                          {cert.certificateNumber}
                        </code>
                      </td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>
                        {cert.instructorName ?? '—'}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button className="lx-btn lx-btn-outline lx-btn-sm"
                            title="Preview certificate"
                            onClick={() => handlePreview(cert)}>
                            <i className="isax isax-eye" />
                          </button>
                          <button className="lx-btn lx-btn-outline lx-btn-sm"
                            title="Download PDF"
                            onClick={() => handleDownload(cert)}
                            disabled={downloadingId === cert.id}>
                            {downloadingId === cert.id
                              ? <div style={{
                                  width: 14, height: 14, borderRadius: '50%',
                                  border: '2px solid currentColor', borderTopColor: 'transparent',
                                  animation: 'spin 1s linear infinite',
                                }} />
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

      {/* ── Certificate Preview Modal ── */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelected(null); }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(20, 8, 12, 0.72)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1040,
            }}
          />

          {/* Modal */}
          <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1050, padding: '16px',
            overflowY: 'auto',
          }}>
            <div style={{
              width: '100%',
              maxWidth: 640,
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 40px 100px rgba(20,8,12,0.35)',
              overflow: 'hidden',
              border: `1px solid ${CRIMSON}22`,
            }}>

              {/* Modal header */}
              <div style={{
                padding: '16px 22px',
                borderBottom: `1px solid ${CRIMSON}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: PINK_BG,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="isax isax-medal-star" style={{ fontSize: 20, color: CRIMSON }} />
                  <span style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontWeight: 700, color: CRIM_DK, fontSize: 15,
                    letterSpacing: '0.05em',
                  }}>
                    Certificate of Completion
                  </span>
                </div>
                <button
                  onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelected(null); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: CRIMSON, fontSize: 22, padding: 4, lineHeight: 1,
                    opacity: 0.7,
                  }}
                >
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Certificate preview — the actual generated PDF */}
              <div style={{ background: '#eee', padding: 0, height: 'min(70vh, 520px)', position: 'relative' }}>
                {previewLoading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(101,28,50,0.15)', borderTopColor: CRIMSON, animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                {previewUrl ? (
                  <iframe title="Certificate" src={`${previewUrl}#toolbar=0&navpanes=0`} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
                ) : !previewLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: CRIMSON, fontFamily: "'Cinzel', Georgia, serif", fontSize: 14 }}>
                    Failed to load certificate preview
                  </div>
                ) : null}
              </div>

              {/* Modal footer */}
              <div style={{
                padding: '14px 22px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: PINK_BG,
                borderTop: `1px solid ${CRIMSON}18`,
                flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 10, color: `${CRIMSON}88`, margin: 0, letterSpacing: '0.1em' }}>
                      COURSE
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: CRIM_DK, margin: 0 }}>
                      {selected.courseTitle}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: `${CRIMSON}88`, margin: 0, letterSpacing: '0.1em' }}>
                      ISSUED
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: CRIM_DK, margin: 0 }}>
                      {formatDate(selected.issuedAt)}
                    </p>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="lx-btn lx-btn-outline"
                    onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelected(null); }}
                    style={{ borderColor: `${CRIMSON}44`, color: CRIMSON }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownload(selected)}
                    disabled={downloadingId === selected.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '9px 22px', borderRadius: 50,
                      background: `linear-gradient(135deg, ${CRIMSON} 0%, ${CRIM_DK} 100%)`,
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 13,
                      boxShadow: `0 4px 16px ${CRIMSON}55`,
                      opacity: downloadingId === selected.id ? 0.7 : 1,
                    }}
                  >
                    {downloadingId === selected.id
                      ? <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                          animation: 'spin 1s linear infinite',
                        }} />
                      : <i className="isax isax-import" />}
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Google Fonts — load Great Vibes + Cinzel */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Lato:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </LuxuryDashboardLayout>
  );
};

export default StudentCertificates;
