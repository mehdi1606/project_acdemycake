import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Spin, message } from 'antd';
import ReactApexChart from 'react-apexcharts';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import PredefinedDateRanges from '../../../core/common/range-picker/datePicker';
import { all_routes } from '../../router/all_routes';
import { useAppSelector } from '../../../core/redux/hooks';
import { instructorService } from '../../../services/api/instructor.service';
import { InstructorDashboard as InstructorDashboardType, Course } from '../../../services/api/types';

const InstructorDashboard = () => {
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
        message.error('Failed to load dashboard data');
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

  const earningsChart = {
    chart:  { height: 260, type: 'bar', stacked: true, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: false } },
    series: [{ name: 'Earnings ($)', data: chartData.data }],
    xaxis:  { categories: chartData.categories, labels: { style: { colors: '#8B6D5E', fontSize: '12px' } } },
    yaxis:  { labels: { offsetX: -10, style: { colors: '#8B6D5E', fontSize: '12px' }, formatter: (v: number) => `$${v}` } },
    grid:   { borderColor: '#EDE0D4', strokeDashArray: 4 },
    legend: { show: false },
    dataLabels: { enabled: false },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light', type: 'vertical', shadeIntensity: 0.3,
        gradientToColors: ['#E8A0A8'], inverseColors: false,
        opacityFrom: 1, opacityTo: 0.85, stops: [0, 100],
      },
    },
    colors: ['#6B1D2A'],
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Instructor';

  const stats = [
    { label: 'Total Students',     value: dashboardData?.totalStudents,        icon: 'isax isax-people',     color: 'gold'  },
    { label: 'Total Courses',      value: dashboardData?.totalCourses,         icon: 'isax isax-book',       color: 'rose'  },
    { label: 'Total Earnings',     value: `$${dashboardData?.totalEarnings?.toFixed(2) ?? '0.00'}`, icon: 'isax isax-wallet', color: 'sage'  },
    { label: 'Pending Payout',     value: `$${dashboardData?.pendingPayout?.toFixed(2) ?? '0.00'}`, icon: 'isax isax-wallet-money', color: 'amber' },
    { label: 'Average Rating',     value: dashboardData?.averageRating?.toFixed(1) ?? '0.0',        icon: 'isax isax-star',   color: 'gold'  },
    { label: 'Recent Enrollments', value: dashboardData?.recentEnrollments?.length ?? 0,            icon: 'isax isax-user-add', color: 'slate' },
  ];

  return (
    <LuxuryDashboardLayout>
      {/* ── Welcome Banner ── */}
      <div className="lx-dashboard-welcome">
        <div className="welcome-text">
          <p className="welcome-greeting">Instructor Panel</p>
          <h4>Welcome back, {firstName}! 🎓</h4>
          <p>Manage your courses, track student progress, and grow your impact.</p>
        </div>
        <div className="welcome-actions">
          <Link to={all_routes.addNewCourse} className="lx-btn lx-btn-gold">
            <i className="isax isax-add-circle" />
            Create Course
          </Link>
          <Link to={all_routes.instructorCourse} className="lx-btn lx-btn-outline">
            <i className="isax isax-book" />
            My Courses
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <Spin size="large" tip="Loading dashboard…" />
        </div>
      ) : (
        <>
          {/* ── Stats Cards ── */}
          <div className="row g-4 mb-4">
            {stats.map((s, i) => (
              <div key={i} className="col-md-6 col-xl-4">
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

          {/* ── Earnings Chart ── */}
          <div className="lx-card mb-4">
            <div className="lx-card-header">
              <h6>Earnings Overview</h6>
              <div className="input-icon position-relative input-range-picker">
                <span className="input-icon-addon">
                  <i className="isax isax-calendar" />
                </span>
                <PredefinedDateRanges />
              </div>
            </div>
            <div className="lx-card-body" style={{ paddingTop: 8 }}>
              <ReactApexChart
                options={earningsChart as any}
                series={earningsChart.series}
                type="bar"
                height={260}
              />
            </div>
          </div>

          {/* ── Recent Courses Table ── */}
          <div className="lx-card">
            <div className="lx-card-header">
              <h6>Recently Created Courses</h6>
              <Link to={all_routes.instructorCourse} className="lx-view-all">
                View All
              </Link>
            </div>
            <div className="lx-card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="lx-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Enrolled</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCourses.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="lx-empty-state">
                            <div className="empty-icon"><i className="isax isax-book" /></div>
                            <h6>No courses yet</h6>
                            <Link to={all_routes.addNewCourse} className="lx-btn lx-btn-gold lx-btn-sm">
                              Create Your First Course
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recentCourses.map((course) => (
                        <tr key={course.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: 44, height: 44, borderRadius: 8,
                                  overflow: 'hidden', flexShrink: 0,
                                  background: 'rgba(107, 29, 42, 0.06)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                {course.thumbnailUrl ? (
                                  <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <i className="isax isax-book" style={{ color: '#6B1D2A', fontSize: 18 }} />
                                )}
                              </div>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--lx-brown)' }}>
                                {course.title}
                              </span>
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
                              {course.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`${all_routes.instructorCourseManage}/${course.id}`}
                              className="lx-btn lx-btn-outline lx-btn-sm"
                            >
                              Manage
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
