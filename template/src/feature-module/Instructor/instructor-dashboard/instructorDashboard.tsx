import React, { useState, useEffect, useMemo } from 'react';
import { formatMAD } from '../../../core/common/formatMoney';
import { hideOnError } from '../../../core/common/imageFallback';
import { Link } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useTranslation } from 'react-i18next';
import ReactApexChart from 'react-apexcharts';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import PredefinedDateRanges from '../../../core/common/range-picker/datePicker';
import { all_routes } from '../../router/all_routes';
import { instructorManageHref } from '../../router/courseLinks';
import { useAppSelector } from '../../../core/redux/hooks';
import { instructorService } from '../../../services/api/instructor.service';
import { InstructorDashboard as InstructorDashboardType, Course } from '../../../services/api/types';
import BadgePopup from '../../../components/BadgePopup';
import { getBadgeForUser } from '../../../config/badges';

const InstructorDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<InstructorDashboardType | null>(null);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [dashboard, coursesRes] = await Promise.all([
          instructorService.getDashboard(),
          instructorService.getMyCourses(0, 5),
        ]);
        setDashboardData(dashboard);
        setRecentCourses(coursesRes.content);
      } catch {
        message.error(t('instructor.dashboard.loadError', "We couldn't load your dashboard. Refresh the page to try again."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    if (dashboardData?.earningsChart?.length) {
      return {
        categories: dashboardData.earningsChart.map((e) => e.month),
        data: dashboardData.earningsChart.map((e) => e.amount),
      };
    }
    return {
      categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      data: [0,0,0,0,0,0,0,0,0,0,0,0],
    };
  }, [dashboardData?.earningsChart]);

  const hasEarnings = chartData.data.some((v) => Number(v) > 0);
  const earningsChart = {
    chart:  { height: 260, type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', animations: { easing: 'easeinout', speed: 700 } },
    plotOptions: { bar: { borderRadius: 8, borderRadiusApplication: 'end', columnWidth: '42%' } },
    series: [{ name: t('instructor.dashboard.earningsSeries', 'Earnings'), data: chartData.data }],
    xaxis:  { categories: chartData.categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: 'rgba(43,15,30,0.5)', fontSize: '12px' } } },
    yaxis:  { labels: { offsetX: -10, style: { colors: 'rgba(43,15,30,0.5)', fontSize: '12px' }, formatter: (v: number) => formatMAD(v) } },
    grid:   { borderColor: 'rgba(101,28,50,0.07)', strokeDashArray: 5 },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => formatMAD(v) } },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light', type: 'vertical', shadeIntensity: 0.2,
        gradientToColors: ['#C5912C'], inverseColors: false,
        opacityFrom: 1, opacityTo: 0.9, stops: [0, 100],
      },
    },
    colors: ['#651C32'],
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Instructor';

  const stats = [
    { label: t('instructor.dashboard.totalStudents', 'Total Students'),     value: dashboardData?.totalStudents,        icon: 'isax isax-people',     color: 'gold'  },
    { label: t('instructor.dashboard.totalCourses', 'Total Courses'),      value: dashboardData?.totalCourses,         icon: 'isax isax-book',       color: 'rose'  },
    { label: t('instructor.dashboard.totalEarnings', 'Total Earnings'),     value: formatMAD(dashboardData?.totalEarnings), icon: 'isax isax-wallet', color: 'sage', key: true },
    { label: t('instructor.earnings.pendingPayout', 'Pending Payout'),     value: formatMAD(dashboardData?.pendingPayout), icon: 'isax isax-wallet-money', color: 'amber' },
    { label: t('common.rating', 'Average Rating'),     value: dashboardData?.averageRating?.toFixed(1) ?? '0.0',        icon: 'isax isax-star',   color: 'gold'  },
    { label: t('instructor.dashboard.recentEnrollmentsLast10', 'Recent enrollments (last 10)'), value: dashboardData?.recentEnrollments?.length ?? 0,            icon: 'isax isax-user-add', color: 'slate' },
  ];

  const instructorBadge = getBadgeForUser(user?.role || 'INSTRUCTOR', 0);

  return (
    <LuxuryDashboardLayout>
      {/* ── Badge Popup (shown once per session) ── */}
      {user && (
        <BadgePopup
          badge={instructorBadge}
          userId={user.id}
          completedCourses={0}
        />
      )}
      {/* ── Welcome Banner ── */}
      <div className="lx-dashboard-welcome">
        <div className="welcome-text">
          <p className="welcome-greeting">{t('common.instructor', 'Instructor')} {t('nav.dashboard', 'Panel')}</p>
          <h4>{t('instructor.dashboard.welcome', 'Welcome back')}, {firstName}</h4>
          <p>{t('instructor.dashboard.welcomeSubtitle', 'Manage your courses, track student progress, and grow your impact.')}</p>
        </div>
        <div className="welcome-actions">
          <Link to={all_routes.addNewCourse} className="lx-btn lx-btn-gold">
            <i className="isax isax-add-circle" />
            {t('instructor.courses.addNew', 'Add New Course')}
          </Link>
          <Link to={all_routes.instructorCourse} className="lx-btn lx-btn-outline">
            <i className="isax isax-book" />
            {t('instructor.courses.title', 'My Courses')}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* ── Stats Cards ── */}
          <div className="row g-4 mb-4">
            {stats.map((s, i) => (
              <div key={i} className="col-md-6 col-xl-4">
                <div className={`lx-stat-card${'key' in s && s.key ? ' is-key' : ''}`}>
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

          {/* ── Earnings Chart ── */}
          <div className="lx-card mb-4">
            <div className="lx-card-header">
              <h6>{t('instructor.dashboard.monthlyRevenue', 'Earnings Overview')}</h6>
              <div className="input-icon position-relative input-range-picker">
                <span className="input-icon-addon">
                  <i className="isax isax-calendar" />
                </span>
                <PredefinedDateRanges />
              </div>
            </div>
            <div className="lx-card-body" style={{ paddingTop: 8 }}>
              {hasEarnings ? (
                <ReactApexChart
                  options={earningsChart as any}
                  series={earningsChart.series}
                  type="bar"
                  height={260}
                />
              ) : (
                <div className="lx-chart-empty">
                  <svg viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="lxChartLine" x1="0" x2="1">
                        <stop offset="0" stopColor="#651C32" stopOpacity="0.15" />
                        <stop offset="0.6" stopColor="#651C32" stopOpacity="0.45" />
                        <stop offset="1" stopColor="#C5912C" stopOpacity="0.9" />
                      </linearGradient>
                      <linearGradient id="lxChartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#C5912C" stopOpacity="0.16" />
                        <stop offset="1" stopColor="#C5912C" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 96 C80 92 130 88 200 80 S320 70 380 56 S500 26 600 10 L600 110 L0 110 Z" fill="url(#lxChartFill)" />
                    <path d="M0 96 C80 92 130 88 200 80 S320 70 380 56 S500 26 600 10" fill="none" stroke="url(#lxChartLine)" strokeWidth="2.5" strokeDasharray="6 7" strokeLinecap="round" />
                    <circle cx="600" cy="10" r="5" fill="#C5912C" />
                  </svg>
                  <h6>{t('instructor.dashboard.chartEmptyTitle', 'Your earnings will draw here')}</h6>
                  <p>{t('instructor.dashboard.chartEmptyText', 'As soon as students buy your courses, each month appears on this chart.')}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Recent Courses Table ── */}
          <div className="lx-card">
            <div className="lx-card-header">
              <h6>{t('instructor.dashboard.coursePerformance', 'Recently Created Courses')}</h6>
              <Link to={all_routes.instructorCourse} className="lx-view-all">
                {t('common.viewAll', 'View All')}
              </Link>
            </div>
            <div className="lx-card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="lx-table">
                  <thead>
                    <tr>
                      <th>{t('instructor.courses.courseTitle', 'Course')}</th>
                      <th>{t('common.enrolled', 'Enrolled')}</th>
                      <th>{t('common.status', 'Status')}</th>
                      <th>{t('common.actions', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCourses.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="lx-empty-state">
                            <div className="empty-icon"><i className="isax isax-book" /></div>
                            <h6>{t('instructor.courses.noCourses', 'No courses yet')}</h6>
                            <Link to={all_routes.addNewCourse} className="lx-btn lx-btn-gold lx-btn-sm">
                              {t('instructor.courses.createFirst', 'Create your first course')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recentCourses.map((course) => (
                        <tr key={course.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <span className="lx-thumb">
                                {course.thumbnailUrl ? (
                                  <img src={course.thumbnailUrl} alt="" onError={hideOnError} />
                                ) : (
                                  <i className="isax isax-cake" />
                                )}
                              </span>
                              <span className="lx-row-title">{course.title}</span>
                            </div>
                          </td>
                          <td>{course.enrolledCount}</td>
                          <td>
                            <span className={`lx-badge ${
                              course.status === 'PUBLISHED'      ? 'badge-success' :
                              course.status === 'DRAFT'          ? 'badge-warning' :
                              course.status === 'PENDING_REVIEW' ? 'badge-info'    :
                              course.status === 'REJECTED'       ? 'badge-danger'  : 'badge-pending'
                            }`}>
                              {t(`enums.courseStatus.${course.status}`, course.status.replace('_', ' '))}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={instructorManageHref(course)}
                              className="lx-btn lx-btn-outline lx-btn-sm"
                            >
                              {t('instructor.courses.manage', 'Manage')}
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorDashboard;
