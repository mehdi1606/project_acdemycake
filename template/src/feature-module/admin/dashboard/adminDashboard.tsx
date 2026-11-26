import React, { useEffect } from 'react';
import { hideOnError } from '../../../core/common/imageFallback';
import { Link } from 'react-router-dom';
import { Spin, message } from 'antd';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchAdminDashboard } from '../../../core/redux/adminSlice';
import { getFileUrl } from '../../../environment';
import AvatarImage from '../../../components/AvatarImage';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { dashboard, isLoading, error } = useAppSelector((s) => s.admin);
  const revLabel = t('admin.dashboard.revenueSeries', 'Revenue');
  const enrLabel = t('admin.dashboard.enrollmentsSeries', 'Enrollments');
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => { dispatch(fetchAdminDashboard()); }, [dispatch]);
  useEffect(() => { if (error) message.error(error); }, [error]);

  // Platform currency is MAD (CMI payments). Keep this consistent with the
  // Transactions page so revenue never shows mismatched symbols/values.
  const fmt = (n?: number) => {
    const v = n ?? 0;
    try {
      return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 }).format(v);
    } catch {
      return `${v.toFixed(2)} MAD`;
    }
  };

  /* Revenue chart */
  const revenueOptions: ApexOptions = {
    chart:       { type: 'area', height: 300, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif' },
    colors:      ['#651C32', '#C5912C'],
    legend:      { fontFamily: 'Inter, sans-serif', markers: { size: 6 } as any },
    dataLabels:  { enabled: false },
    stroke:      { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    xaxis: { categories: dashboard?.revenueHistory?.map((r) => r.month) || [], labels: { style: { colors: '#8B6D75', fontSize: '12px' } } },
    // Two y-axes: revenue in MAD on the left, enrollment count (unscaled) on the right.
    yaxis: [
      {
        seriesName: revLabel,
        title: { text: 'MAD', style: { color: '#8B6D75', fontSize: '11px' } },
        labels: { style: { colors: '#8B6D75', fontSize: '12px' }, formatter: (v: number) => `${Math.round(v).toLocaleString()} MAD` },
      },
      {
        seriesName: enrLabel,
        opposite: true,
        min: 0,
        forceNiceScale: true,
        labels: { style: { colors: '#8B6D75', fontSize: '12px' }, formatter: (v: number) => `${Math.round(v)}` },
      },
    ],
    tooltip: {
      y: {
        formatter: (v: number, opts?: { seriesIndex: number }) =>
          opts?.seriesIndex === 1 ? `${Math.round(v)}` : `${Math.round(v).toLocaleString()} MAD`,
      },
    },
    grid:   { borderColor: 'rgba(101,28,50,0.08)', strokeDashArray: 4 },
  };

  const revenueSeries = [
    { name: revLabel,      data: dashboard?.revenueHistory?.map((r) => r.revenue)             || [] },
    { name: enrLabel,      data: dashboard?.revenueHistory?.map((r) => r.enrollments ?? 0) || [] },
  ];

  const firstName = user?.fullName?.split(' ')[0] || t('common.admin', 'Admin');

  const statsRow1 = [
    { label: t('admin.dashboard.totalUsers', 'Total Users'),             value: dashboard?.totalUsers,           icon: 'isax isax-people',    color: 'gold'  },
    { label: t('admin.dashboard.totalCourses', 'Total Courses'),         value: dashboard?.totalCourses,         icon: 'isax isax-book',      color: 'rose'  },
    { label: t('admin.dashboard.activeSubscriptions', 'Active Subs'),    value: dashboard?.activeSubscriptions,  icon: 'isax isax-crown',     color: 'sage'  },
    { label: t('admin.dashboard.newEnrollments', 'Enrollments'),         value: dashboard?.totalEnrollments,     icon: 'isax isax-teacher',   color: 'slate' },
  ];

  return (
    <LuxuryDashboardLayout>
      {/* ── Welcome Banner ── */}
      <div className="lx-dashboard-welcome">
        <div className="welcome-text">
          <p className="welcome-greeting">{t('admin.sidebar.panel', 'Admin Panel')}</p>
          <h4>{t('admin.dashboard.title', 'Admin Dashboard')}, {firstName}</h4>
          <p>{t('admin.dashboard.platformStats', "Here's an overview of your academy's performance today.")}</p>
        </div>
        <div className="welcome-actions">
          <Link to={all_routes.adminUsers} className="lx-btn lx-btn-gold">
            <i className="isax isax-people" />
            {t('admin.users.title', 'Manage Users')}
          </Link>
          <Link to={all_routes.adminCourses} className="lx-btn lx-btn-outline">
            <i className="isax isax-book" />
            {t('admin.courses.title', 'Manage Courses')}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* ── Stats Row 1 ── */}
          <div className="row g-4 mb-4">
            {statsRow1.map((s, i) => (
              <div key={i} className="col-md-6 col-xl-3">
                <div className="lx-stat-card">
                  <div className={`stat-icon ${s.color}`}>
                    <i className={s.icon} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">{s.label}</p>
                    <h3 className="stat-value">{s.value ?? 0}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Revenue Stats Row ── */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="lx-stat-card is-hero">
                <div className="stat-icon">
                  <i className="isax isax-dollar-circle" />
                </div>
                <div className="stat-info">
                  <p className="stat-label">{t('admin.dashboard.totalRevenue', 'Total Revenue')}</p>
                  <h3 className="stat-value">{fmt(dashboard?.totalRevenue)}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="lx-stat-card is-hero is-ink">
                <div className="stat-icon">
                  <i className="isax isax-chart-2" />
                </div>
                <div className="stat-info">
                  <p className="stat-label">{t('admin.reports.thisMonth', 'This Month')}</p>
                  <h3 className="stat-value">
                    {fmt(dashboard?.monthlyRevenue || dashboard?.revenueThisMonth)}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* ── Revenue Chart ── */}
          <div className="lx-card mb-4">
            <div className="lx-card-header">
              <h6>{t('admin.reports.revenue', 'Revenue Overview')}</h6>
              <Link to={all_routes.adminAnalytics} className="lx-view-all">
                {t('admin.reports.generate', 'View Analytics')}
              </Link>
            </div>
            <div className="lx-card-body" style={{ paddingTop: 8 }}>
              {dashboard?.revenueHistory?.length ? (
                <ReactApexChart
                  options={revenueOptions}
                  series={revenueSeries}
                  type="area"
                  height={300}
                />
              ) : (
                <div className="lx-empty-state">
                  <div className="empty-icon"><i className="isax isax-chart" /></div>
                  <p>{t('admin.dashboard.revenueEmpty', 'No revenue data available yet.')}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="lx-card mb-4">
            <div className="lx-card-header">
              <h6>{t('admin.dashboard.quickActions', 'Quick Actions')}</h6>
            </div>
            <div className="lx-card-body">
              <div className="row g-3">
                {[
                  { label: t('admin.sidebar.pendingApprovals', 'Pending Approvals'), icon: 'isax isax-clock',         route: all_routes.adminPendingCourses },
                  { label: t('admin.users.title', 'Manage Users'),                 icon: 'isax isax-user-add',      route: all_routes.adminUsers },
                  { label: t('admin.transactions.title', 'Transactions'),           icon: 'isax isax-card',          route: all_routes.adminTransactions },
                  { label: t('admin.reports.title', 'View Reports'),               icon: 'isax isax-document-text', route: all_routes.adminReports },
                ].map((a, i) => (
                  <div key={i} className="col-md-3 col-6">
                    <Link to={a.route} className="lx-quick-tile">
                      <i className={a.icon} />
                      <span>{a.label}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Top Courses & Instructors ── */}
          <div className="row g-4">
            {/* Top Courses */}
            <div className="col-lg-6">
              <div className="lx-card">
                <div className="lx-card-header">
                  <h6>{t('admin.dashboard.topCourses', 'Top Courses')}</h6>
                  <Link to={all_routes.adminCourses} className="lx-view-all">{t('common.viewAll', 'View All')}</Link>
                </div>
                <div className="lx-card-body" style={{ padding: 0 }}>
                  {dashboard?.topCourses?.length ? (
                    <div className="table-responsive"><table className="lx-table">
                      <thead>
                        <tr>
                          <th>{t('admin.courses.courseTitle', 'Course')}</th>
                          <th style={{ textAlign: 'center' }}>{t('admin.dashboard.newEnrollments', 'Enrollments')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.dashboard.totalRevenue', 'Revenue')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.topCourses.slice(0, 5).map((item, i) => (
                          <tr key={i}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <span className="lx-thumb">
                                  {item.course?.thumbnailUrl ? (
                                    <img src={getFileUrl(item.course.thumbnailUrl) ?? item.course.thumbnailUrl} alt="" onError={hideOnError} />
                                  ) : (
                                    <i className="isax isax-cake" />
                                  )}
                                </span>
                                <span className="lx-row-title" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.course?.title || t('admin.dashboard.courseFallback', 'Course')}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.enrollmentsCount}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="lx-money">{fmt(item.revenue)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  ) : (
                    <div className="lx-empty-state" style={{ padding: '32px 0' }}>
                      <div className="empty-icon"><i className="isax isax-book" /></div>
                      <p>{t('admin.courses.noCourses', 'No courses yet.')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Instructors */}
            <div className="col-lg-6">
              <div className="lx-card">
                <div className="lx-card-header">
                  <h6>{t('admin.dashboard.topInstructors', 'Top Instructors')}</h6>
                  <Link to={all_routes.adminUsers} className="lx-view-all">{t('common.viewAll', 'View All')}</Link>
                </div>
                <div className="lx-card-body" style={{ padding: 0 }}>
                  {dashboard?.topInstructors?.length ? (
                    <div className="table-responsive"><table className="lx-table">
                      <thead>
                        <tr>
                          <th>{t('admin.courses.instructor', 'Instructor')}</th>
                          <th style={{ textAlign: 'center' }}>{t('admin.courses.students', 'Students')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.dashboard.totalRevenue', 'Revenue')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.topInstructors.slice(0, 5).map((item, i) => (
                          <tr key={i}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <AvatarImage
                                  src={item.user?.avatarUrl ? (getFileUrl(item.user.avatarUrl) ?? item.user.avatarUrl) : null}
                                  name={item.user?.fullName}
                                  size={38}
                                />
                                <span className="lx-row-title">
                                  {item.user?.fullName || t('common.instructor', 'Instructor')}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.studentsCount}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="lx-money">{fmt(item.totalRevenue)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  ) : (
                    <div className="lx-empty-state" style={{ padding: '32px 0' }}>
                      <div className="empty-icon"><i className="isax isax-teacher" /></div>
                      <p>{t('admin.dashboard.noInstructors', 'No instructors yet.')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default AdminDashboard;
