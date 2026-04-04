import React, { useEffect, useMemo, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchMyEnrollments } from '../../../core/redux/studentSlice';
import { SkeletonCardGrid } from '../../../components/Skeleton';
import { getFileUrl } from '../../../environment';


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
};

const PAGE_SIZE = 9;

const StudentCourse: React.FC = () => {
  const dispatch = useAppDispatch();

  const { enrollments, totalPages, currentPage, isLoading, error } = useAppSelector(
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
    { key: 'all', label: 'All', count: allCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <LuxuryDashboardLayout>
      {/* ── Glass Page Header ── */}
      <div className="lx-section-header mb-4">
        <h5 className="section-title">Enrolled Courses</h5>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '7px 18px',
                borderRadius: 'var(--lx-radius)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--lx-transition)',
                border: activeTab === t.key ? 'none' : '1.5px solid rgba(107, 29, 42, 0.10)',
                background: activeTab === t.key
                  ? 'linear-gradient(135deg, var(--lx-primary) 0%, var(--lx-primary-dark) 100%)'
                  : 'var(--lx-glass-light)',
                color: activeTab === t.key ? '#fff' : 'var(--lx-text-mid)',
                backdropFilter: activeTab === t.key ? 'none' : 'blur(8px)',
                boxShadow: activeTab === t.key ? '0 4px 16px rgba(107, 29, 42, 0.25)' : 'none',
              }}
            >
              {t.label} ({t.count})
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
              Retry
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
                  ? 'No completed courses yet'
                  : activeTab === 'active'
                  ? 'No active courses'
                  : 'No courses enrolled yet'}
              </h6>
              <p>
                {activeTab === 'all'
                  ? 'Start your learning journey by enrolling in a course.'
                  : 'Keep learning to see courses here.'}
              </p>
              {activeTab === 'all' && (
                <Link to={all_routes.courseGrid} className="lx-btn lx-btn-gold">
                  Browse Courses
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
                      Completed
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
                    {enrollment.completedLessons} / {enrollment.totalLessons} lessons completed
                  </p>

                  <div className="d-flex align-items-center gap-2">
                    {enrollment.isCompleted ? (
                      <Link
                        to={`${all_routes.courseDetails}/${enrollment.courseSlug}`}
                        className="lx-btn lx-btn-outline lx-btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <i className="isax isax-medal" />
                        View Certificate
                      </Link>
                    ) : (
                      <Link
                        to={`${all_routes.courseWatch}/${enrollment.courseSlug}`}
                        className="lx-btn lx-btn-gold lx-btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <i className="isax isax-play-circle" />
                        Continue Learning
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
    </LuxuryDashboardLayout>
  );
};

export default StudentCourse;
