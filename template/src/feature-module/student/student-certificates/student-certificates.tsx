import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import certificateService from '../../../services/api/certificate.service';
import { Certificate } from '../../../services/api/types';

// ── Design tokens (Saralöwe pink certificate palette) ─────────────────────────
const PINK_BG  = '#FCE6E8';
const CRIMSON  = '#9D1C34';
const CRIM_DK  = '#781224';
const WHITE    = '#FFFFFF';

// ── Art Nouveau ribbon SVG ─────────────────────────────────────────────────────
// Portrait 595 × 210 view-box matching the PDF banner area
const RibbonSvg = () => (
  <svg
    viewBox="0 0 595 210"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', display: 'block' }}
    preserveAspectRatio="none"
  >
    {/* ── Main crimson wave band ── */}
    <path
      d={[
        'M0,0 L595,0 L595,148',
        'C524,123 387,141 297.5,120',
        'C208,99  71,133  0,148 Z',
      ].join(' ')}
      fill={CRIMSON}
    />

    {/* ── LEFT Art-Nouveau swirl knot (circle mostly off-page) ── */}
    {/* Outer ring */}
    <circle cx="-18" cy="148" r="75" fill="none" stroke={CRIMSON} strokeWidth="20" />
    {/* Inner filled dot */}
    <circle cx="-18" cy="148" r="28" fill={CRIMSON} />
    {/* Ribbon tail sweeping right-downward */}
    <path
      d="M55,162 C95,178 120,205 90,230 C60,255 28,242 40,268"
      fill="none" stroke={CRIMSON} strokeWidth="18" strokeLinecap="round"
    />

    {/* ── RIGHT Art-Nouveau swirl knot (mirror) ── */}
    <circle cx="613" cy="148" r="75" fill="none" stroke={CRIMSON} strokeWidth="20" />
    <circle cx="613" cy="148" r="28" fill={CRIMSON} />
    <path
      d="M540,162 C500,178 475,205 505,230 C535,255 567,242 555,268"
      fill="none" stroke={CRIMSON} strokeWidth="18" strokeLinecap="round"
    />

    {/* ── "COUTURE PASTRY" ── */}
    <text
      x="297.5" y="52"
      textAnchor="middle"
      fontFamily="'Cinzel', 'Trajan Pro', Georgia, serif"
      fontSize="11" fill={WHITE} letterSpacing="5"
    >COUTURE PASTRY</text>

    {/* ── "SARALÖWE" ── */}
    <text
      x="297.5" y="104"
      textAnchor="middle"
      fontFamily="'Cinzel', 'Trajan Pro', Georgia, serif"
      fontWeight="700" fontSize="52" fill={WHITE} letterSpacing="5"
    >SARALÖWE</text>

    {/* ── "CRAFTED BY SCIENCE, ELEVATED BY ART!" ── */}
    <text
      x="297.5" y="127"
      textAnchor="middle"
      fontFamily="'Cinzel', 'Trajan Pro', Georgia, serif"
      fontSize="9" fill={WHITE} letterSpacing="3"
    >CRAFTED BY SCIENCE, ELEVATED BY ART!</text>
  </svg>
);

// ── Certificate Preview Component ─────────────────────────────────────────────
const CertificatePreview = ({ cert, formatDate }: { cert: Certificate; formatDate: (d?: string) => string }) => {
  const instructorDisplay = cert.instructorName || 'Saralöwe Academy';

  return (
    <div style={{
      background: PINK_BG,
      width: '100%',
      maxWidth: 595,
      margin: '0 auto',
      fontFamily: "'Lato', 'Segoe UI', sans-serif",
      position: 'relative',
      boxShadow: `0 8px 48px rgba(120,18,36,0.28)`,
      aspectRatio: '595 / 842',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Ribbon banner area ── */}
      <div style={{ position: 'relative', width: '100%', height: '25%', flexShrink: 0 }}>
        <RibbonSvg />
      </div>

      {/* ── Certificate content ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 6% 3%',
        position: 'relative',
      }}>

        {/* "Certificate" script */}
        <div style={{
          fontFamily: "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive",
          fontSize: 'clamp(32px, 8vw, 64px)',
          color: CRIMSON,
          lineHeight: 1.1,
          marginTop: '2%',
          textAlign: 'center',
        }}>
          Certificate
        </div>

        {/* "ISSUED BY SARALÖWE ACADEMY" */}
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: 'clamp(7px, 1.4vw, 10px)',
          color: CRIMSON,
          letterSpacing: '0.25em',
          marginTop: '0.5%',
          textAlign: 'center',
        }}>
          ISSUED BY &nbsp;&nbsp; SARALÖWE ACADEMY
        </div>

        {/* Thin rule with diamond */}
        <div style={{ position: 'relative', width: '65%', margin: '2% 0' }}>
          <div style={{ height: 1, background: CRIMSON, width: '100%' }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            width: 7, height: 7, background: CRIMSON,
          }} />
        </div>

        {/* "THIS CERTIFICATE IS AWARDED TO" */}
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: 'clamp(7px, 1.5vw, 11px)',
          color: CRIMSON,
          letterSpacing: '0.2em',
          textAlign: 'center',
          marginBottom: '2%',
        }}>
          THIS CERTIFICATE IS AWARDED TO
        </div>

        {/* Student name + underline */}
        <div style={{ width: '78%', position: 'relative', textAlign: 'center', marginBottom: '1.5%' }}>
          <div style={{
            fontFamily: "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive",
            fontSize: 'clamp(24px, 5.5vw, 40px)',
            color: CRIMSON,
            lineHeight: 1.1,
          }}>
            {cert.studentName}
          </div>
          <div style={{ height: 1, background: CRIMSON, marginTop: '0.5%' }} />
        </div>

        {/* Recognition text */}
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: 'clamp(6px, 1.3vw, 9.5px)',
          color: CRIMSON,
          letterSpacing: '0.17em',
          textAlign: 'center',
          lineHeight: 1.85,
          marginBottom: '2.5%',
        }}>
          IN RECOGNITION OF THE DEDICATION, DISCIPLINE, AND<br />
          ARTISTRY DEMONSTRATED THROUGHOUT THE<br />
          <strong>{cert.courseTitle.toUpperCase()} COURSE</strong>
        </div>

        {/* ── Fields ── */}
        <div style={{ width: '100%', marginBottom: 'auto' }}>
          {[
            { label: 'Course :', value: cert.courseTitle },
            { label: 'Instructor :', value: instructorDisplay },
            { label: 'Date :', value: formatDate(cert.completionDate || cert.issuedAt) },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'baseline',
              gap: '1.5%', marginBottom: '1.8%',
            }}>
              <span style={{
                fontFamily: "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive",
                fontSize: 'clamp(14px, 3vw, 22px)',
                color: CRIMSON,
                flexShrink: 0,
                minWidth: '20%',
              }}>
                {label}
              </span>
              <div style={{ flex: 1, position: 'relative', paddingBottom: 2 }}>
                <span style={{
                  fontFamily: "'Lato', 'Segoe UI', sans-serif",
                  fontSize: 'clamp(7px, 1.3vw, 10px)',
                  color: CRIMSON,
                  position: 'absolute',
                  bottom: 4,
                  left: 4,
                  right: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {value}
                </span>
                <div style={{ borderBottom: `0.5px solid ${CRIMSON}`, width: '100%', marginTop: '1.6em' }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom row: Instructor name (left) + Seal (right) ── */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '2%',
        }}>
          {/* Left: Instructor block */}
          <div>
            <div style={{
              fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
              fontSize: 'clamp(6px, 1.3vw, 9.5px)',
              color: CRIMSON,
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}>
              {instructorDisplay.toUpperCase()}
            </div>
            <div style={{
              fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
              fontSize: 'clamp(5px, 1.1vw, 8px)',
              color: CRIMSON,
              letterSpacing: '0.18em',
              marginTop: 3,
            }}>
              COURSE INSTRUCTOR
            </div>
          </div>

          {/* Right: Circular seal */}
          <div style={{
            width: 'clamp(52px, 11%, 78px)',
            aspectRatio: '1',
            borderRadius: '50%',
            border: `2px solid ${CRIMSON}`,
            boxShadow: `inset 0 0 0 6px ${PINK_BG}, inset 0 0 0 7px ${CRIMSON}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
              fontSize: 'clamp(5px, 1.1vw, 7.5px)',
              color: CRIMSON,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              SARALÖWE<br />ACADEMY<br />
              <span style={{ fontSize: '0.85em', letterSpacing: '0.06em' }}>EST. 2010</span>
            </div>
          </div>
        </div>

        {/* Certificate number */}
        <div style={{
          marginTop: '2%',
          fontFamily: "'Lato', 'Segoe UI', sans-serif",
          fontSize: 'clamp(5px, 1vw, 7.5px)',
          color: CRIMSON,
          textAlign: 'center',
          opacity: 0.75,
        }}>
          Certificate No: {cert.certificateNumber}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const StudentCertificates = () => {
  const [certificates, setCertificates]   = useState<Certificate[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [selected, setSelected]           = useState<Certificate | null>(null);
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

  useEffect(() => { fetchCertificates(0); }, [fetchCertificates]);

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
                          onClick={() => setSelected(cert)}
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
                            onClick={() => setSelected(cert)}>
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
            onClick={() => setSelected(null)}
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
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: CRIMSON, fontSize: 22, padding: 4, lineHeight: 1,
                    opacity: 0.7,
                  }}
                >
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Certificate preview */}
              <div style={{ background: '#eee', padding: '20px 20px 0' }}>
                <CertificatePreview cert={selected} formatDate={formatDate} />
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
                    onClick={() => setSelected(null)}
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
