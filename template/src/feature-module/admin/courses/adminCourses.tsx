import React, { useEffect, useState } from 'react';
import { formatMAD } from '../../../core/common/formatMoney';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { Spin, message, Pagination, Popconfirm, Select } from 'antd';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchCourses, deleteCourse } from '../../../core/redux/adminSlice';
import { getFileUrl } from '../../../environment';
import adminService, { CourseStats } from '../../../services/api/admin.service';

const AdminCourses = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { courses, coursesPagination, isLoadingCourses, error } = useAppSelector(
    (state) => state.admin
  );

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  // Whole-dataset counts per status for the stat cards (not just the current page)
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);

  const loadCourseStats = () => {
    adminService.getCourseStats().then(setCourseStats).catch(() => setCourseStats(null));
  };

  useEffect(() => {
    dispatch(fetchCourses({ page: currentPage, size: 20, status: statusFilter || undefined }));
  }, [dispatch, currentPage, statusFilter]);

  useEffect(() => {
    adminService.getCourseStats().then(setCourseStats).catch(() => setCourseStats(null));
  }, []);

  const handleStatusFilterChange = (value?: string) => {
    setStatusFilter(value || '');
    setCurrentPage(0);
  };

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await dispatch(deleteCourse(courseId)).unwrap();
      message.success(t('admin.courses.deleted', 'Course deleted successfully'));
      dispatch(fetchCourses({ page: currentPage, size: 20, status: statusFilter || undefined }));
      loadCourseStats();
    } catch {
      message.error(t('admin.courses.deleteError', "The course couldn't be deleted. Refresh the page and try again."));
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      PUBLISHED:      { cls: 'badge-success', label: t('enums.courseStatus.PUBLISHED', 'Published') },
      DRAFT:          { cls: 'badge-warning', label: t('enums.courseStatus.DRAFT', 'Draft') },
      PENDING_REVIEW: { cls: 'badge-info',    label: t('enums.courseStatus.PENDING_REVIEW', 'Pending Review') },
      ARCHIVED:       { cls: 'badge-slate',   label: t('enums.courseStatus.ARCHIVED', 'Archived') },
    };
    const b = map[status] || { cls: 'badge-info', label: status };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  const getLevelBadge = (level: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      BEGINNER:     { cls: 'badge-success', label: t('enums.level.BEGINNER', 'Beginner') },
      INTERMEDIATE: { cls: 'badge-info',    label: t('enums.level.INTERMEDIATE', 'Intermediate') },
      ADVANCED:     { cls: 'badge-danger',  label: t('enums.level.ADVANCED', 'Advanced') },
      ALL_LEVELS:   { cls: 'badge-slate',   label: t('enums.level.ALL_LEVELS', 'All Levels') },
    };
    const b = map[level] || { cls: 'badge-info', label: level };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  // Status filtering is done server-side; the page already holds only matching courses.
  const filteredCourses = courses;

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount || amount === 0) return t('common.free', 'Free');
    return formatMAD(amount);
  };

  return (
    <LuxuryDashboardLayout>
      {/* ── Stats Cards ── */}
      <div className="row g-4 mb-4">
        {[
          { label: t('admin.dashboard.totalCourses', 'Total Courses'),  value: courseStats?.total ?? 0,          icon: 'isax isax-book',        color: 'gold' },
          { label: t('common.published', 'Published'),                  value: courseStats?.PUBLISHED ?? 0,      icon: 'isax isax-tick-circle', color: 'sage' },
          { label: t('common.pending', 'Pending'),                      value: courseStats?.PENDING_REVIEW ?? 0, icon: 'isax isax-clock',       color: 'amber' },
          { label: t('common.draft', 'Drafts'),                         value: courseStats?.DRAFT ?? 0,          icon: 'isax isax-edit-2',      color: 'slate' },
        ].map((s, i) => (
          <div key={i} className="col-xxl-3 col-lg-6 col-md-6">
            <div className="lx-stat-card">
              <div className={`stat-icon ${s.color}`}>
                <i className={s.icon} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{s.label}</p>
                <h3 className="stat-value">{s.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Courses Table Card ── */}
      <div className="lx-card">
        <div className="lx-card-header">
          <h6>{t('admin.courses.allCourses', 'All Courses')}</h6>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Select
              placeholder={t('admin.courses.status', 'Filter by status')}
              allowClear
              style={{ width: 180 }}
              value={statusFilter || undefined}
              onChange={(value?: string) => handleStatusFilterChange(value)}
              options={[
                { value: 'PUBLISHED',      label: t('common.published', 'Published') },
                { value: 'DRAFT',          label: t('common.draft', 'Draft') },
                { value: 'PENDING_REVIEW', label: t('admin.courses.pendingApproval', 'Pending Review') },
                { value: 'ARCHIVED',       label: t('admin.courses.archived', 'Archived') },
              ]}
            />
            <Link to={all_routes.adminPendingCourses} className="lx-btn lx-btn-outline lx-btn-sm">
              <i className="isax isax-clock" />
              {t('admin.sidebar.pendingApprovals', 'Pending Approvals')}
            </Link>
          </div>
        </div>

        <div className="lx-card-body" style={{ padding: 0 }}>
          {isLoadingCourses ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spin size="large" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-book" /></div>
              <h6>{t('admin.courses.noCourses', 'No Courses Found')}</h6>
              <p>{t('common.noResults', 'No courses match the current filter criteria.')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>{t('admin.courses.courseTitle', 'Course')}</th>
                    <th>{t('admin.courses.instructor', 'Instructor')}</th>
                    <th>{t('common.level', 'Level')}</th>
                    <th>{t('common.price', 'Price')}</th>
                    <th>{t('admin.courses.status', 'Status')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.courses.students', 'Enrollments')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.courses.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course: any) => (
                    <tr key={course.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={course.thumbnailUrl ? (getFileUrl(course.thumbnailUrl) ?? course.thumbnailUrl) : '/assets/img/course/course-01.jpg'}
                            alt=""
                            style={{
                              width: 50,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 'var(--lx-radius-sm)',
                              flexShrink: 0,
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/img/course/course-01.jpg';
                            }}
                          />
                          <div>
                            <p style={{ marginBottom: 2, fontWeight: 600, fontSize: 13.5, color: 'var(--lx-text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {course.title}
                            </p>
                            <small style={{ color: 'var(--lx-text-muted)', fontSize: 12 }}>
                              {course.category?.name || t('admin.courses.uncategorized', 'Uncategorized')}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
                          {course.instructor?.fullName || t('admin.courses.unknown', 'Unknown')}
                        </span>
                      </td>
                      <td>{getLevelBadge(course.level)}</td>
                      <td>
                        {!course.requiresPurchase ? (
                          <span className="lx-badge badge-success">{t('common.free', 'Free')}</span>
                        ) : (
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--lx-text)' }}>
                            {formatCurrency(course.price)}
                          </span>
                        )}
                      </td>
                      <td>{getStatusBadge(course.status)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="lx-badge badge-info">
                          {course.enrolledCount || 0}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Link
                            to={`${all_routes.courseDetails}/${course.slug || course.id}`}
                            className="lx-btn lx-btn-outline lx-btn-sm"
                            title={t('admin.courses.viewCourse', 'View Course')}
                          >
                            <i className="isax isax-eye" />
                          </Link>
                          <Popconfirm
                            title={t('admin.courses.deleteCourse', 'Delete Course')}
                            description={t('admin.courses.deleteConfirm', 'Are you sure you want to delete this course? This action cannot be undone.')}
                            onConfirm={() => handleDeleteCourse(course.id)}
                            okText={t('common.yesDelete', 'Yes, Delete')}
                            cancelText={t('common.cancel', 'Cancel')}
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              className="lx-btn lx-btn-sm"
                              style={{
                                background: 'rgba(101, 28, 50, 0.08)',
                                color: '#651C32',
                                border: '1.5px solid rgba(101, 28, 50, 0.15)',
                              }}
                              title={t('admin.courses.deleteCourse', 'Delete Course')}
                            >
                              <i className="isax isax-trash" />
                            </button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {coursesPagination?.totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(101, 28, 50, 0.06)', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={currentPage + 1}
              total={coursesPagination.totalElements}
              pageSize={20}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminCourses;
