import React, { useState, useEffect } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { message, Pagination } from 'antd';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchPendingCourses, approveCourse, deleteCourse } from '../../../core/redux/adminSlice';

const levelBadge = (level: string) => {
  const map: Record<string, string> = {
    BEGINNER: 'badge-success',
    INTERMEDIATE: 'badge-info',
    ADVANCED: 'badge-danger',
    ALL_LEVELS: 'badge-slate',
  };
  const labels: Record<string, string> = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
    ALL_LEVELS: 'All Levels',
  };
  return <span className={`lx-badge ${map[level] ?? 'badge-slate'}`}>{labels[level] ?? level}</span>;
};

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const AdminPendingCourses = () => {
  const dispatch = useAppDispatch();
  const { pendingCourses, pendingCoursesPagination, isLoadingCourses, error } = useAppSelector(
    (state) => state.admin
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    dispatch(fetchPendingCourses({ page: currentPage, size: 20 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const handlePageChange = (page: number) => setCurrentPage(page - 1);

  const handleApproveCourse = async (courseId: string) => {
    try {
      await dispatch(approveCourse(courseId)).unwrap();
      message.success('Course approved and published successfully!');
    } catch {
      message.error('Failed to approve course');
    }
  };

  const handleRejectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (selectedCourseId) {
      try {
        await dispatch(deleteCourse(selectedCourseId)).unwrap();
        message.success('Course rejected');
        setRejectModalVisible(false);
        setRejectReason('');
        setSelectedCourseId(null);
      } catch {
        message.error('Failed to reject course');
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid rgba(107, 29, 42, 0.12)',
    borderRadius: 'var(--lx-radius-sm)',
    fontSize: 14,
    outline: 'none',
    background: 'rgba(255,255,255,0.6)',
    color: 'var(--lx-text)',
    resize: 'vertical',
  };

  return (
    <LuxuryDashboardLayout>
      {/* Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', marginBottom: 24,
        borderRadius: 'var(--lx-radius)', background: 'rgba(197, 151, 62, 0.08)',
        border: '1px solid rgba(197, 151, 62, 0.15)',
      }}>
        <i className="isax isax-info-circle" style={{ fontSize: 24, color: '#C5973E', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--lx-text)', fontSize: 14 }}>Pending Approvals</strong>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-mid)' }}>
            Review and approve courses submitted by instructors. Approved courses will be published and visible to students.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="lx-card">
        <div className="lx-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
            Courses Awaiting Approval
            {pendingCourses.length > 0 && (
              <span style={{
                marginLeft: 8, padding: '2px 10px', borderRadius: 12,
                background: 'rgba(197, 151, 62, 0.12)', color: '#C5973E', fontSize: 12, fontWeight: 600,
              }}>
                {pendingCourses.length}
              </span>
            )}
          </h5>
          <Link to={all_routes.adminCourses} className="lx-btn lx-btn-outline lx-btn-sm">
            <i className="isax isax-arrow-left" style={{ marginRight: 4 }} /> All Courses
          </Link>
        </div>

        <div className="lx-card-body" style={{ padding: 0 }}>
          {isLoadingCourses ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          ) : pendingCourses.length === 0 ? (
            <div className="lx-empty-state">
              <span className="empty-icon" style={{ background: 'rgba(45, 95, 63, 0.08)' }}>
                <i className="isax isax-tick-circle" style={{ fontSize: 28, color: '#2D5F3F' }} />
              </span>
              <h6 style={{ fontWeight: 600, color: 'var(--lx-text)' }}>All Caught Up!</h6>
              <p>No courses pending approval at the moment.</p>
            </div>
          ) : (
            <table className="lx-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Level</th>
                  <th>Price</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={course.thumbnailUrl || '/assets/img/course/course-01.jpg'}
                          alt=""
                          style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 'var(--lx-radius-sm)' }}
                        />
                        <div>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>{course.title}</p>
                          <small style={{ color: 'var(--lx-text-muted)' }}>
                            {course.category?.name || 'Uncategorized'} · {course.lessonsCount || 0} lessons
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={course.instructor?.avatarUrl || '/assets/img/user/user-01.jpg'}
                          alt=""
                          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '50%' }}
                        />
                        <small style={{ fontWeight: 500 }}>{course.instructor?.fullName || 'Unknown'}</small>
                      </div>
                    </td>
                    <td>{levelBadge(course.level)}</td>
                    <td>
                      {!course.requiresPurchase ? (
                        <span className="lx-badge badge-success">Free</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: 'var(--lx-text)' }}>{formatCurrency(course.price)}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <Link
                          to={`${all_routes.courseDetails}/${course.slug || course.id}`}
                          className="lx-btn lx-btn-outline lx-btn-sm"
                          title="Preview Course"
                        >
                          <i className="isax isax-eye" />
                        </Link>
                        <button
                          className="lx-btn lx-btn-sm"
                          style={{ background: 'rgba(45, 95, 63, 0.1)', color: '#2D5F3F', border: '1px solid rgba(45, 95, 63, 0.15)' }}
                          onClick={() => handleApproveCourse(course.id)}
                          title="Approve & Publish"
                        >
                          <i className="isax isax-tick-circle" />
                        </button>
                        <button
                          className="lx-btn lx-btn-sm"
                          style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1px solid rgba(139, 35, 53, 0.12)' }}
                          onClick={() => handleRejectCourse(course.id)}
                          title="Reject"
                        >
                          <i className="isax isax-close-circle" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pendingCoursesPagination.totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={currentPage + 1}
              total={pendingCoursesPagination.totalElements}
              pageSize={20}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalVisible && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setRejectModalVisible(false); setRejectReason(''); setSelectedCourseId(null); } }}
        >
          <div style={{
            width: '100%', maxWidth: 460,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Reject Course</h5>
              <button onClick={() => { setRejectModalVisible(false); setRejectReason(''); setSelectedCourseId(null); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
                Are you sure you want to reject this course?
              </p>
              <textarea
                style={inputStyle as React.CSSProperties}
                placeholder="Reason for rejection (will be sent to instructor)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => { setRejectModalVisible(false); setRejectReason(''); setSelectedCourseId(null); }}>Cancel</button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                onClick={confirmReject}
              >
                Reject Course
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default AdminPendingCourses;
