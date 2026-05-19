import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import CircleProgress from '../../Instructor/instructor-dashboard/circleProgress';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import {
  fetchRecentEnrollments,
  fetchPaymentHistory,
  fetchStudentStats,
} from '../../../core/redux/studentSlice';
import { getFileUrl } from '../../../environment';

const StudentDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { recentEnrollments, transactions, stats, isLoading } = useAppSelector(
    (s) => s.student
  );
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchStudentStats());
    dispatch(fetchRecentEnrollments());
    dispatch(fetchPaymentHistory({ page: 0, size: 5 }));
  }, [dispatch]);

  const statusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'badge-success',
      PENDING:   'badge-warning',
      FAILED:    'badge-danger',
      REFUNDED:  'badge-info',
    };
    return map[status] || 'badge-pending';
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Student';

  return (
    <LuxuryDashboardLayout>
      {/* ── Welcome Banner ── */}
      <div className="lx-dashboard-welcome">
        <div className="welcome-text">
          <p className="welcome-greeting">{t('student.dashboard.welcome', 'Good to see you again')}</p>
          <h4>{t('student.dashboard.welcomeBack', 'Welcome back')}, {firstName}!</h4>
          <p>{t('student.dashboard.continueLearning', 'Continue your learning journey — you\'re doing great.')}</p>
        </div>
        <div className="welcome-actions">
          <Link to={all_routes.courseGrid} className="lx-btn lx-btn-gold">
            <i className="isax isax-book" />
            {t('student.wishlist.browseNow', 'Browse Courses')}
          </Link>
          <Link to={all_routes.studentCourses} className="lx-btn lx-btn-outline">
            <i className="isax isax-play-circle" />
            {t('student.dashboard.continueLearning', 'Continue Learning')}
          </Link>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="row g-4 mb-4">
        {[
          { label: t('student.dashboard.enrolledCourses', 'Enrolled Courses'), value: stats.enrolledCourses,  icon: 'isax isax-book',        color: 'gold' },
          { label: t('student.dashboard.activeCourses', 'Active Courses'),   value: stats.activeCourses,    icon: 'isax isax-play-circle', color: 'rose' },
          { label: t('common.completed', 'Completed'),        value: stats.completedCourses, icon: 'isax isax-medal',       color: 'sage' },
        ].map((s, i) => (
          <div key={i} className="col-md-4">
            <div className="lx-stat-card">
              <div className={`stat-icon ${s.color}`}>
                <i className={s.icon} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{s.label}</p>
                <h3 className="stat-value">
                  {isLoading ? <Spin size="small" /> : (s.value ?? 0)}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recently Enrolled Courses ── */}
      <div className="lx-section-header mb-4">
        <h5 className="section-title">{t('student.dashboard.recentCourses', 'Recently Enrolled Courses')}</h5>
        <Link to={all_routes.studentCourses} className="lx-btn lx-btn-outline lx-btn-sm">
          {t('common.viewAll', 'View All')}
        </Link>
      </div>

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <Spin size="large" />
        </div>
      ) : recentEnrollments.length === 0 ? (
        <div className="lx-card mb-4">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-book" /></div>
              <h6>{t('student.dashboard.noCoursesYet', 'No courses enrolled yet')}</h6>
              <p>{t('student.dashboard.startLearning', 'Start your learning journey by enrolling in a course.')}</p>
              <Link to={all_routes.courseGrid} className="lx-btn lx-btn-gold">
                {t('student.wishlist.browseNow', 'Browse Courses')}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4 mb-4">
          {recentEnrollments.map((enr) => (
            <div key={enr.id} className="col-xl-4 col-md-6">
              <div className="lx-course-card">
                <div className="course-img-wrap">
                  <img
                    src={getFileUrl(enr.courseThumbnail) ?? 'assets/img/course/course-01.jpg'}
                    alt={enr.courseTitle}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
                    }}
                  />
                  <div className="course-progress-bar">
                    <div className="bar-fill" style={{ width: `${enr.progressPercentage}%` }} />
                  </div>
                  <span className="course-pct-badge">{enr.progressPercentage}%</span>
                </div>
                <div className="course-info">
                  <p className="course-cat">{enr.courseCategory || 'General'}</p>
                  <Link
                    to={`${all_routes.courseDetails}/${enr.courseSlug}`}
                    className="course-title"
                  >
                    {enr.courseTitle}
                  </Link>
                  <p className="course-meta">
                    {enr.completedLessons} / {enr.totalLessons} {t('common.lessons', 'lessons')} {t('common.completed', 'completed')}
                  </p>
                  <Link
                    to={`${all_routes.courseWatch}/${enr.courseSlug}`}
                    className="lx-btn lx-btn-gold lx-btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <i className="isax isax-play-circle" />
                    {t('student.dashboard.continueLearning', 'Continue Learning')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom row: Invoices + Progress ── */}
      <div className="row g-4">
        {/* Recent Invoices */}
        <div className="col-xl-7">
          <div className="lx-card h-100">
            <div className="lx-card-header">
              <h6>{t('student.dashboard.recentInvoices', 'Recent Invoices')}</h6>
              <Link to={all_routes.studentOrderHistory} className="lx-view-all">
                {t('common.viewAll', 'View All')}
              </Link>
            </div>
            <div className="lx-card-body">
              {isLoading ? (
                <div className="text-center py-4"><Spin /></div>
              ) : transactions.length === 0 ? (
                <div className="lx-empty-state" style={{ padding: '32px 0' }}>
                  <div className="empty-icon"><i className="isax isax-card" /></div>
                  <p>{t('student.orders.noOrders', 'No transactions yet.')}</p>
                </div>
              ) : (
                transactions.map((txn) => (
                  <div key={txn.id} className="lx-transaction-item">
                    <div className="txn-icon"><i className="isax isax-card" /></div>
                    <div className="txn-info">
                      <p className="txn-name">
                        {txn.courseName ||
                          (txn.transactionType === 'SUBSCRIPTION' ? t('student.subscription.title', 'Subscription') : t('student.dashboard.coursePurchase', 'Course Purchase'))}
                      </p>
                      <span className="txn-id">
                        #{txn.payzoneOrderId || txn.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="txn-amount">${txn.amount}</span>
                      <span className={`lx-badge ${statusBadgeClass(txn.status)}`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <div className="col-xl-5">
          <div className="lx-card h-100">
            <div className="lx-card-header">
              <h6>{t('student.dashboard.myProgress', 'Course Progress')}</h6>
            </div>
            <div className="lx-card-body">
              {isLoading ? (
                <div className="text-center py-4"><Spin /></div>
              ) : recentEnrollments.length === 0 ? (
                <div className="lx-empty-state" style={{ padding: '32px 0' }}>
                  <div className="empty-icon"><i className="isax isax-chart" /></div>
                  <p>{t('student.dashboard.noCoursesYet', 'No courses in progress.')}</p>
                </div>
              ) : (
                recentEnrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="d-flex align-items-center justify-content-between mb-3 pb-3"
                    style={{ borderBottom: '1px solid var(--lx-cream-border)' }}
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--lx-brown)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enr.courseTitle}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--lx-brown-muted)', margin: 0 }}>
                        {enr.completedLessons} / {enr.totalLessons} {t('common.lessons', 'lessons')}
                      </p>
                    </div>
                    <CircleProgress value={enr.progressPercentage} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentDashboard;
