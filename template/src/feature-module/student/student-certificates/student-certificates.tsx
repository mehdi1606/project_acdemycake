import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import certificateService from '../../../services/api/certificate.service';
import { Certificate } from '../../../services/api/types';

type ModalState = 'none' | 'view';

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [modal, setModal] = useState<ModalState>('none');
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchCertificates(0);
  }, [fetchCertificates]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const openView = (cert: Certificate) => {
    setSelected(cert);
    setModal('view');
  };

  const closeModal = () => {
    setModal('none');
    setSelected(null);
  };

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id);
    try {
      const blob = await certificateService.downloadCertificate(cert.id);
      certificateService.triggerDownload(
        blob,
        `certificate-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`
      );
    } catch (err) {
      console.error('Failed to download certificate:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Pagination ──────────────────────────────────────────────────────────
  const renderPagination = () => {
    if (totalPages <= 1) return null;
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
    );
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
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
          <i className="isax isax-warning-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading your certificates...</p>
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
                          onClick={() => openView(cert)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: 'var(--lx-primary)',
                            fontSize: 13.5,
                            textAlign: 'left',
                          }}
                        >
                          {cert.courseTitle} Certificate
                        </button>
                      </td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(cert.issuedAt)}</td>
                      <td>
                        <code style={{ fontSize: 12, background: 'rgba(107, 29, 42, 0.04)', padding: '2px 8px', borderRadius: 4, color: 'var(--lx-text)' }}>
                          {cert.certificateNumber}
                        </code>
                      </td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{cert.instructorName ?? '—'}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            className="lx-btn lx-btn-outline lx-btn-sm"
                            title="View certificate"
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
                maxHeight: '90vh',
                overflowY: 'auto',
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
                <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0, fontSize: 16 }}>View Certificate</h5>
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
                    padding: '40px 32px',
                    borderRadius: 'var(--lx-radius)',
                    background: 'linear-gradient(135deg, var(--lx-bg-warm) 0%, var(--lx-bg-structure) 100%)',
                    border: '1px solid rgba(107, 29, 42, 0.06)',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'rgba(197, 151, 62, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <i className="isax isax-medal-star" style={{ fontSize: 36, color: 'var(--lx-gold)' }} />
                  </div>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, color: 'var(--lx-text-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Certificate of Completion
                  </p>
                  <p style={{ fontSize: 15, color: 'var(--lx-text-muted)', marginBottom: 8 }}>This is to certify that</p>
                  <h3 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 8 }}>{selected.studentName}</h3>
                  <p style={{ fontSize: 15, color: 'var(--lx-text-muted)', marginBottom: 8 }}>has successfully completed</p>
                  <h4 style={{ fontWeight: 700, color: 'var(--lx-primary)', marginBottom: 16 }}>{selected.courseTitle}</h4>
                  {selected.instructorName && (
                    <p style={{ fontSize: 14, color: 'var(--lx-text-muted)', marginBottom: 4 }}>
                      Instructor: <strong style={{ color: 'var(--lx-text)' }}>{selected.instructorName}</strong>
                    </p>
                  )}
                  <p style={{ fontSize: 14, color: 'var(--lx-text-muted)', marginBottom: 16 }}>
                    Completed on {formatDate(selected.completionDate || selected.issuedAt)}
                  </p>
                                                                                                                                                                                           <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 16px',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span style={{ color: 'var(--lx-text-muted)', fontSize: 12, marginRight: 4 }}>Certificate #:</span>
                    <code style={{ fontSize: 12, fontWeight: 600 }}>{selected.certificateNumber}</code>
                  </div>
                </div>

                {/* Details grid */}
                <div className="row g-3">
                  {[
                    { label: 'Student Name', value: selected.studentName },
                    { label: 'Course', value: selected.courseTitle },
                    { label: 'Certificate Number', value: selected.certificateNumber, code: true },
                    { label: 'Issued Date', value: formatDate(selected.issuedAt) },
                    ...(selected.instructorName ? [{ label: 'Instructor', value: selected.instructorName }] : []),
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

export default StudentCertificates;
