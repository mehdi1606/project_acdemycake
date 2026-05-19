import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchMyEnrollments } from '../../../core/redux/studentSlice';
import { SkeletonCardGrid } from '../../../components/Skeleton';
import { getFileUrl } from '../../../environment';
import certificateService from '../../../services/api/certificate.service';
import { Certificate } from '../../../services/api/types';


type FilterTab = 'all' | 'active' | 'completed';

type Enrollment = {
  id: string;
  isCompleted: boolean;
  progressPercentage: number;
  enrollmentType: string;
  courseSlug: string;
  courseTitle: string;
  courseThumbnail?: string;
  courseCategory?: string;
  completedLessons: number;
  totalLessons: number;
  certificateId?: string;
};

const PAGE_SIZE = 9;

const StudentCourse: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { enrollments, totalPages, currentPage: _currentPage, isLoading, error } = useAppSelector(
    (state: any) => state.student
  ) as {
    enrollments: Enrollment[];
    totalPages: number;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
  };

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState<number>(0);

  // ── Certificate modal state ──
  const [certModal, setCertModal] = useState(false);
  const [certData, setCertData] = useState<Certificate | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certDownloading, setCertDownloading] = useState(false);

  const openCertificate = async (enrollment: Enrollment) => {
    if (!enrollment.certificateId) return;
    setCertLoading(true);
    setCertModal(true);
    try {
      const cert = await certificateService.getCertificateById(enrollment.certificateId);
      setCertData(cert);
    } catch {
      setCertData(null);
    } finally {
      setCertLoading(false);
    }
  };

  const closeCertModal = () => {
    setCertModal(false);
    setCertData(null);
  };

  const handleCertDownload = async (cert: Certificate) => {
    setCertDownloading(true);
    try {
      const blob = await certificateService.downloadCertificate(cert.id);
      certificateService.triggerDownload(blob, `certificate-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`);
    } catch {
      // ignore
    } finally {
      setCertDownloading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    dispatch(fetchMyEnrollments({ page, size: PAGE_SIZE }));
  }, [dispatch, page]);

  const filteredEnrollments = useMemo(() => {
    return (enrollments || []).filter((e: Enrollment) => {
      if (activeTab === 'active') return !e.isCompleted;
      if (activeTab === 'completed') return e.isCompleted;
      return true;
    });
  }, [enrollments, activeTab]);

  const allCount = enrollments?.length || 0;
  const activeCount = (enrollments || []).filter((e: Enrollment) => !e.isCompleted).length;
  const completedCount = (enrollments || []).filter((e: Enrollment) => e.isCompleted).length;

  const getThumbnail = (thumbnail?: string) =>
    getFileUrl(thumbnail) ?? 'assets/img/course/course-01.jpg';

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: t('student.courses.all', 'All'), count: allCount },
    { key: 'active', label: t('student.courses.active', 'Active'), count: activeCount },
    { key: 'completed', label: t('student.courses.completed', 'Completed'), count: completedCount },
  ];

  return (
    <LuxuryDashboardLayout>
      {/* ── Glass Page Header ── */}
      <div className="lx-section-header mb-4">
        <h5 className="section-title">{t('student.courses.title', 'Enrolled Courses')}</h5>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 18px',
                borderRadius: 'var(--lx-radius)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--lx-transition)',
                border: activeTab === tab.key ? 'none' : '1.5px solid rgba(107, 29, 42, 0.10)',
                background: activeTab === tab.key
                  ? 'linear-gradient(135deg, var(--lx-primary) 0%, var(--lx-primary-dark) 100%)'
                  : 'var(--lx-glass-light)',
                color: activeTab === tab.key ? '#fff' : 'var(--lx-text-mid)',
                backdropFilter: activeTab === tab.key ? 'none' : 'blur(8px)',
                boxShadow: activeTab === tab.key ? '0 4px 16px rgba(107, 29, 42, 0.25)' : 'none',
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div
          className="lx-card mb-4"
          style={{ border: '1.5px solid rgba(139, 35, 53, 0.20)', background: 'rgba(139, 35, 53, 0.04)' }}
        >
          <div className="lx-card-body d-flex align-items-center gap-3">
            <i className="isax isax-warning-2" style={{ fontSize: 20, color: '#8B2335' }} />
            <span style={{ flex: 1, color: 'var(--lx-text-mid)', fontSize: 14 }}>{error}</span>
            <button
              className="lx-btn lx-btn-outline lx-btn-sm"
              onClick={() => dispatch(fetchMyEnrollments({ page, size: PAGE_SIZE }))}
            >
              {t('common.tryAgain', 'Retry')}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading ? (
        <div style={{ marginTop: 8 }}>
          <SkeletonCardGrid count={6} />
        </div>
      ) : filteredEnrollments.length === 0 ? (
        /* ── Empty state ── */
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-book" /></div>
              <h6>
                {activeTab === 'completed'
                  ? t('student.courses.noCompletedCourses', 'No completed courses yet')
                  : activeTab === 'active'
                  ? t('student.courses.noActiveCourses', 'No active courses')
                  : t('student.courses.noCourses', 'No courses enrolled yet')}
              </h6>
              <p>
                {activeTab === 'all'
                  ? t('student.dashboard.startLearning', 'Start your learning journey by enrolling in a course.')
                  : t('student.courses.keepLearning', 'Keep learning to see courses here.')}
              </p>
              {activeTab === 'all' && (
                <Link to={all_routes.courseGrid} className="lx-btn lx-btn-gold">
                  {t('student.courses.browseNow', 'Browse Courses')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Glass Course Cards ── */
        <div className="row g-4">
          {filteredEnrollments.map((enrollment: Enrollment) => (
            <div key={enrollment.id} className="col-xl-4 col-md-6">
              <div className="lx-course-card">
                <div className="course-img-wrap">
                  <Link to={`${all_routes.courseDetails}/${enrollment.courseSlug}`}>
                    <img
                      src={getThumbnail(enrollment.courseThumbnail)}
                      alt={enrollment.courseTitle}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
                      }}
                    />
                  </Link>
                  <div className="course-progress-bar">
                    <div className="bar-fill" style={{ width: `${enrollment.progressPercentage}%` }} />
                  </div>
                  <span className="course-pct-badge">{enrollment.progressPercentage}%</span>

                  {/* Completed badge */}
                  {enrollment.isCompleted && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(45, 95, 63, 0.85)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: 'var(--lx-radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <i className="isax isax-tick-circle" style={{ fontSize: 13 }} />
                      {t('student.courses.completed', 'Completed')}
                    </span>
                  )}
                </div>

                <div className="course-info">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <p className="course-cat mb-0">{enrollment.courseCategory || 'General'}</p>
                    <span className="lx-badge badge-info">{enrollment.enrollmentType}</span>
                  </div>

                  <Link
                    to={`${all_routes.courseDetails}/${enrollment.courseSlug}`}
                    className="course-title"
                  >
                    {enrollment.courseTitle}
                  </Link>

                  <p className="course-meta">
                    {enrollment.completedLessons} / {enrollment.totalLessons} {t('common.lessons', 'lessons')} {t('common.completed', 'completed')}
                  </p>

                  <div className="d-flex align-items-center gap-2">
                    {enrollment.isCompleted ? (
                      enrollment.certificateId ? (
                        <button
                          onClick={() => openCertificate(enrollment)}
                          className="lx-btn lx-btn-gold lx-btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <i className="isax isax-medal-star" />
                          {t('student.certificates.download', 'View Certificate')}
                        </button>
                      ) : (
                        <Link
                          to={all_routes.studentCertificates ?? '/student/certificates'}
                          className="lx-btn lx-btn-outline lx-btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <i className="isax isax-medal" />
                          {t('student.certificates.title', 'My Certificates')}
                        </Link>
                      )
                    ) : (
                      <Link
                        to={`${all_routes.courseWatch}/${enrollment.courseSlug}`}
                        className="lx-btn lx-btn-gold lx-btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <i className="isax isax-play-circle" />
                        {t('student.dashboard.continueLearning', 'Continue Learning')}
                      </Link>
                    )}
                    <Link
                      to={`${all_routes.courseDetails}/${enrollment.courseSlug}`}
                      className="lx-btn lx-btn-outline lx-btn-sm"
                      title="View details"
                    >
                      <i className="isax isax-eye" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Glass Pagination ── */}
      {!isLoading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="lx-btn lx-btn-outline lx-btn-sm"
              onClick={() => setPage((p: number) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ opacity: page === 0 ? 0.5 : 1 }}
            >
              <i className="isax isax-arrow-left-3" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--lx-radius-sm)',
                  border: page === i ? 'none' : '1px solid rgba(107, 29, 42, 0.10)',
                  background: page === i
                    ? 'var(--lx-primary)'
                    : 'var(--lx-glass-light)',
                  color: page === i ? '#fff' : 'var(--lx-text-mid)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--lx-transition)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="lx-btn lx-btn-outline lx-btn-sm"
              onClick={() => setPage((p: number) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ opacity: page === totalPages - 1 ? 0.5 : 1 }}
            >
              <i className="isax isax-arrow-right-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Certificate Modal ── */}
      {certModal && (
        <>
          <div
            onClick={closeCertModal}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(44, 24, 16, 0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 1040,
            }}
          />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
            <div style={{
              width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto',
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
              borderRadius: 'var(--lx-radius-lg)',
              border: '1px solid rgba(107, 29, 42, 0.10)',
              boxShadow: '0 24px 48px rgba(44, 24, 16, 0.18)',
              overflow: 'hidden',
            }}>
              {/* Modal header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0, fontSize: 16 }}>
                  <i className="isax isax-medal-star" style={{ color: 'var(--lx-gold)', marginRight: 8 }} />
                  {t('student.certificates.title', 'Certificate of Completion')}
                </h5>
                <button onClick={closeCertModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--lx-text-muted)', fontSize: 20 }}>
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: 24 }}>
                {certLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, color: 'var(--lx-text-muted)', fontSize: 14 }}>{t('student.certificates.loading', 'Loading certificate...')}</p>
                  </div>
                ) : !certData ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <i className="isax isax-warning-2" style={{ fontSize: 32, color: '#8B2335', display: 'block', marginBottom: 12 }} />
                    <p style={{ color: 'var(--lx-text-muted)', fontSize: 14 }}>{t('student.certificates.loadError', 'Could not load certificate. Please try again.')}</p>
                  </div>
                ) : (
                  <>
                    {/* Certificate preview */}
                    <div style={{
                      padding: '40px 32px', borderRadius: 'var(--lx-radius)',
                      background: 'linear-gradient(135deg, var(--lx-bg-warm, #fdf8f3) 0%, var(--lx-bg-structure, #f8f4ef) 100%)',
                      border: '1.5px solid rgba(197, 151, 62, 0.18)',
                      textAlign: 'center', marginBottom: 24,
                    }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(197,151,62,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <i className="isax isax-medal-star" style={{ fontSize: 36, color: 'var(--lx-gold, #C5973E)' }} />
                      </div>
                      <p style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: 'var(--lx-text-muted)', letterSpacing: '1px', marginBottom: 12 }}>
                        {t('student.certificates.title', 'Certificate of Completion')}
                      </p>
                      <p style={{ fontSize: 15, color: 'var(--lx-text-muted)', marginBottom: 6 }}>{t('student.certificates.certifyText', 'This is to certify that')}</p>
                      <h3 style={{ fontWeight: 800, color: 'var(--lx-text)', marginBottom: 6, fontSize: 22 }}>{certData.studentName}</h3>
                      <p style={{ fontSize: 15, color: 'var(--lx-text-muted)', marginBottom: 6 }}>{t('student.certificates.successfullyCompleted', 'has successfully completed')}</p>
                      <h4 style={{ fontWeight: 700, color: 'var(--lx-primary)', marginBottom: 16, fontSize: 18 }}>{certData.courseTitle}</h4>
                      {certData.instructorName && (
                        <p style={{ fontSize: 14, color: 'var(--lx-text-muted)', marginBottom: 4 }}>
                          {t('common.instructor', 'Instructor')}: <strong style={{ color: 'var(--lx-text)' }}>{certData.instructorName}</strong>
                        </p>
                      )}
                      <p style={{ fontSize: 14, color: 'var(--lx-text-muted)', marginBottom: 16 }}>
                        {t('student.certificates.completedOn', 'Completed on')} {formatDate(certData.completionDate || certData.issuedAt)}
                      </p>
                      <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
                        <span style={{ color: 'var(--lx-text-muted)', fontSize: 12, marginRight: 4 }}>Certificate #:</span>
                        <code style={{ fontSize: 12, fontWeight: 700 }}>{certData.certificateNumber}</code>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { label: t('student.certificates.studentName', 'Student Name'), value: certData.studentName },
                        { label: t('student.certificates.courseName', 'Course'), value: certData.courseTitle },
                        { label: t('student.certificates.certificateId', 'Certificate #'), value: certData.certificateNumber, code: true },
                        { label: t('student.certificates.issuedDate', 'Issued Date'), value: formatDate(certData.issuedAt) },
                        ...(certData.instructorName ? [{ label: t('common.instructor', 'Instructor'), value: certData.instructorName }] : []),
                      ].map((item) => (
                        <div key={item.label}>
                          <p style={{ fontSize: 11, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</p>
                          {item.code ? (
                            <code style={{ fontSize: 12, background: 'rgba(107,29,42,0.04)', padding: '2px 8px', borderRadius: 4 }}>{item.value}</code>
                          ) : (
                            <p style={{ fontWeight: 500, marginBottom: 0, color: 'var(--lx-text)', fontSize: 14 }}>{item.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107,29,42,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="lx-btn lx-btn-outline" onClick={closeCertModal}>{t('common.close', 'Close')}</button>
                {certData && (
                  <button
                    className="lx-btn lx-btn-gold"
                    onClick={() => handleCertDownload(certData)}
                    disabled={certDownloading}
                  >
                    {certDownloading ? (
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <i className="isax isax-import" />
                    )}
                    {t('student.certificates.download', 'Download PDF')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentCourse;
