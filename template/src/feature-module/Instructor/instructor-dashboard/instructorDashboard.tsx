import React, { useState, useEffect, useMemo } from 'react';
import { formatMAD } from '../../../core/common/formatMoney';
import { hideOnError } from '../../../core/common/imageFallback';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import ReactApexChart from 'react-apexcharts';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { all_routes } from '../../router/all_routes';
import { instructorManageHref } from '../../router/courseLinks';
import { useAppSelector } from '../../../core/redux/hooks';
import { instructorService } from '../../../services/api/instructor.service';
import { InstructorDashboard as InstructorDashboardType, Course } from '../../../services/api/types';
import BadgePopup from '../../../components/BadgePopup';
import { getBadgeForUser } from '../../../config/badges';
import { liveSeatInfo, formatSessionDate } from '../../Courses/course-details/LiveMasterclassBooking';
import { DashSkeleton } from '../../../components/DashSkeleton';

type Attention = { key: string; icon: string; title: string; meta?: string; to: string; tone?: 'gold' };

const InstructorDashboard = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstructorDashboardType | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [dashboard, coursesRes] = await Promise.all([
          instructorService.getDashboard(),
          instructorService.getMyCourses(0, 50),
        ]);
        setData(dashboard);
        setCourses(coursesRes.content ?? []);
      } catch {
        message.error(t('instructor.dashboard.loadError', "We couldn't load your dashboard. Refresh the page to try again."));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  /* ── this month vs last month ── */
  const thisMonth = Number(data?.monthlyEarnings ?? 0);
  const lastMonth = Number(data?.lastMonthEarnings ?? 0);
  const trend = useMemo(() => {
    if (lastMonth > 0) {
      const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
      return t('instructor.dashboard.vsLastMonth', { pct: `${pct >= 0 ? '+' : ''}${pct}%`, defaultValue: '{{pct}} vs last month' });
    }
    return thisMonth > 0
      ? t('instructor.dashboard.firstMonth', 'Your first earnings, well done')
      : t('instructor.dashboard.noEarningsYet', 'No sales yet this month');
  }, [thisMonth, lastMonth, t]);

  /* ── earnings chart: the last 6 months ── */
  const history = data?.revenueHistory ?? [];
  const hasEarnings = history.some((m) => Number(m.revenue) > 0);
  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    try {
      return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short' }).format(new Date(y, (m || 1) - 1, 1));
    } catch { return ym; }
  };
  const chartOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', animations: { easing: 'easeinout', speed: 700 } },
    plotOptions: { bar: { borderRadius: 8, borderRadiusApplication: 'end', columnWidth: '46%' } },
    xaxis: { categories: history.map((m) => monthLabel(m.month)), axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: 'rgba(43,15,30,0.62)', fontSize: '12px' } } },
    yaxis: { labels: { style: { colors: 'rgba(43,15,30,0.62)', fontSize: '12px' }, formatter: (v: number) => formatMAD(v) } },
    grid: { borderColor: 'rgba(60,20,35,0.06)', strokeDashArray: 5 },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => formatMAD(v) } },
    fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.2, gradientToColors: ['#C5912C'], inverseColors: false, opacityFrom: 1, opacityTo: 0.9, stops: [0, 100] } },
    colors: ['#651C32'],
  };
  const chartSeries = [{ name: t('instructor.dashboard.earningsSeries', 'Earnings'), data: history.map((m) => Number(m.revenue)) }];

  /* ── what needs the instructor today ── */
  const attention = useMemo<Attention[]>(() => {
    const out: Attention[] = [];
    const toGrade = data?.submissionsToGrade ?? 0;
    if (toGrade > 0) {
      out.push({
        key: 'grade', icon: 'isax-clipboard-tick', tone: 'gold', to: all_routes.instructorAssignment,
        title: t('instructor.dashboard.toGrade', { count: toGrade, defaultValue: '{{count}} submissions to grade' }),
        meta: t('instructor.dashboard.toGradeMeta', 'Students are waiting for their mark'),
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    courses
      .filter((c) => c.courseType === 'MASTERCLASS' && c.masterclassFormat === 'LIVE' && c.sessionDate && c.sessionDate >= today)
      .sort((a, b) => (a.sessionDate || '').localeCompare(b.sessionDate || ''))
      .slice(0, 2)
      .forEach((c) => {
        const seats = liveSeatInfo(c);
        out.push({
          key: `mc-${c.id}`, icon: 'isax-video-play', to: `${all_routes.instructorMasterclassReservations}?course=${c.id}`,
          title: c.title,
          meta: [
            c.sessionDate ? formatSessionDate(c.sessionDate, lang) : '',
            seats.capacity !== null
              ? t('mcRes.seats', { taken: seats.taken ?? (seats.capacity - (seats.remaining ?? 0)), capacity: seats.capacity, defaultValue: '{{taken}} / {{capacity}} places booked' })
              : '',
          ].filter(Boolean).join(' · '),
        });
      });
    courses.filter((c) => c.status === 'REJECTED').slice(0, 2).forEach((c) => out.push({
      key: `rej-${c.id}`, icon: 'isax-danger', to: instructorManageHref(c),
      title: t('instructor.dashboard.fixRejected', { title: c.title, defaultValue: 'Update “{{title}}”' }),
      meta: t('instructor.dashboard.fixRejectedMeta', 'It was sent back by the review team'),
    }));
    courses.filter((c) => c.status === 'DRAFT').slice(0, 2).forEach((c) => out.push({
      key: `draft-${c.id}`, icon: 'isax-edit-2', to: instructorManageHref(c),
      title: t('instructor.dashboard.finishDraft', { title: c.title, defaultValue: 'Finish “{{title}}”' }),
      meta: t('instructor.dashboard.finishDraftMeta', 'Draft, not visible to students yet'),
    }));
    return out.slice(0, 5);
  }, [data, courses, lang, t]);

  const firstName = user?.fullName?.split(' ')[0] || t('common.instructor', 'Instructor');
  const instructorBadge = getBadgeForUser(user?.role || 'INSTRUCTOR', 0);
  const recentCourses = courses.slice(0, 5);

  return (
    <LuxuryDashboardLayout>
      {user && <BadgePopup badge={instructorBadge} userId={user.id} completedCourses={0} />}

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
        <DashSkeleton stats={4} />
      ) : (
        <>
          {/* ── The four numbers that matter ── */}
          <div className="row g-3 g-md-4 mb-4">
            <div className="col-6 col-xl-3">
              <div className="lx-stat-card is-key">
                <div className="stat-icon"><i className="isax isax-wallet-money" /></div>
                <div className="stat-info">
                  <p className="stat-label">{t('instructor.dashboard.thisMonth', 'This month')}</p>
                  <h3 className="stat-value">{formatMAD(thisMonth)}</h3>
                  <span className="stat-sub">{trend}</span>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="lx-stat-card">
                <div className="stat-icon"><i className="isax isax-user-add" /></div>
                <div className="stat-info">
                  <p className="stat-label">{t('instructor.dashboard.newThisWeek', 'New this week')}</p>
                  <h3 className="stat-value">{data?.newEnrollmentsThisWeek ?? 0}</h3>
                  <span className="stat-sub">{t('instructor.dashboard.enrollments7d', 'enrolments, last 7 days')}</span>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="lx-stat-card">
                <div className="stat-icon"><i className="isax isax-people" /></div>
                <div className="stat-info">
                  <p className="stat-label">{t('instructor.dashboard.totalStudents', 'Total Students')}</p>
                  <h3 className="stat-value">{data?.totalStudents ?? 0}</h3>
                  <span className="stat-sub">{t('instructor.dashboard.coursesCount', { count: data?.totalCourses ?? 0, defaultValue: 'across {{count}} courses' })}</span>
                </div>
              </div>
            </div>
            <div className="col-6 col-xl-3">
              <div className="lx-stat-card">
                <div className="stat-icon"><i className="isax isax-clock" /></div>
                <div className="stat-info">
                  <p className="stat-label">{t('instructor.dashboard.awaitingPayout', 'Awaiting payout')}</p>
                  <h3 className="stat-value">{formatMAD(data?.pendingEarnings)}</h3>
                  <Link to={all_routes.instructorEarning} className="stat-sub stat-link">{t('instructor.dashboard.seeEarnings', 'See earnings')} →</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* ── Needs your attention ── */}
            <div className="col-xl-5">
              <div className="lx-card h-100">
                <div className="lx-card-header">
                  <h6>{t('instructor.dashboard.needsAttention', 'Needs your attention')}</h6>
                </div>
                <div className="lx-card-body">
                  {attention.length === 0 ? (
                    <div className="lx-empty-state" style={{ padding: '28px 0' }}>
                      <div className="empty-icon"><i className="isax isax-tick-circle" /></div>
                      <h6>{t('instructor.dashboard.allClear', 'All clear')}</h6>
                      <p>{t('instructor.dashboard.allClearText', 'Nothing needs you right now. A good moment to plan your next course.')}</p>
                    </div>
                  ) : (
                    <ul className="lx-todo">
                      {attention.map((a) => (
                        <li key={a.key}>
                          <Link to={a.to} className={`lx-todo__item${a.tone === 'gold' ? ' is-gold' : ''}`}>
                            <span className="lx-todo__icon"><i className={`isax ${a.icon}`} /></span>
                            <span className="lx-todo__text">
                              <strong>{a.title}</strong>
                              {a.meta && <small>{a.meta}</small>}
                            </span>
                            <i className="isax isax-arrow-right-3 lx-todo__go" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* ── Earnings, last 6 months ── */}
            <div className="col-xl-7">
              <div className="lx-card h-100">
                <div className="lx-card-header">
                  <h6>{t('instructor.dashboard.monthlyRevenue', 'Earnings Overview')}</h6>
                  <span className="lx-card-hint">{t('instructor.dashboard.last6Months', 'Last 6 months')}</span>
                </div>
                <div className="lx-card-body" style={{ paddingTop: 8 }}>
                  {hasEarnings ? (
                    <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={260} />
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
            </div>
          </div>

          {/* ── Courses ── */}
          <div className="lx-card">
            <div className="lx-card-header">
              <h6>{t('instructor.dashboard.coursePerformance', 'Recently Created Courses')}</h6>
              <Link to={all_routes.instructorCourse} className="lx-view-all">{t('common.viewAll', 'View All')}</Link>
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
                                {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" onError={hideOnError} /> : <i className="isax isax-cake" />}
                              </span>
                              <span className="lx-row-title">{course.title}</span>
                            </div>
                          </td>
                          <td>{course.enrolledCount}</td>
                          <td>
                            <span className={`lx-badge ${
                              course.status === 'PUBLISHED' ? 'badge-success' :
                              course.status === 'DRAFT' ? 'badge-warning' :
                              course.status === 'PENDING_REVIEW' ? 'badge-info' :
                              course.status === 'REJECTED' ? 'badge-danger' : 'badge-pending'
                            }`}>
                              {t(`enums.courseStatus.${course.status}`, course.status.replace('_', ' '))}
                            </span>
                          </td>
                          <td>
                            <Link to={instructorManageHref(course)} className="lx-btn lx-btn-outline lx-btn-sm">
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
