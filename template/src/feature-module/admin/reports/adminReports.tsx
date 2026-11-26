import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import { formatMAD } from '../../../core/common/formatMoney';
import adminService, { AdminReport, ReportType } from '../../../services/api/admin.service';
import { extractApiError } from '../../../services/api/error.utils';

/**
 * Admin Reports — aggregate summaries computed by the backend over the whole
 * dataset (GET /admin/reports?type=revenue|users|courses|subscriptions).
 * Money figures are realised CMI payments (COMPLETED transactions), the same
 * source as the dashboard and the Transactions page.
 */

interface Metric {
  key: string;
  labelKey: string;
  fallback: string;
  icon: string;
  color: 'gold' | 'sage' | 'rose' | 'slate' | 'amber';
  money?: boolean;
}

interface Breakdown {
  totalKey: string;
  titleKey: string;
  titleFallback: string;
  money?: boolean;
  parts: { key: string; labelKey: string; fallback: string; color: string }[];
}

const TABS: { type: ReportType; labelKey: string; fallback: string; icon: string }[] = [
  { type: 'revenue',       labelKey: 'admin.reports.tabRevenue',       fallback: 'Revenue',       icon: 'isax isax-dollar-circle' },
  { type: 'users',         labelKey: 'admin.reports.tabUsers',         fallback: 'Users',         icon: 'isax isax-people' },
  { type: 'courses',       labelKey: 'admin.reports.tabCourses',       fallback: 'Courses',       icon: 'isax isax-book' },
  { type: 'subscriptions', labelKey: 'admin.reports.tabSubscriptions', fallback: 'Subscriptions', icon: 'isax isax-crown' },
];

const METRICS: Record<ReportType, Metric[]> = {
  revenue: [
    { key: 'totalRevenue',        labelKey: 'admin.reports.metrics.totalRevenue',        fallback: 'Total revenue',        icon: 'isax isax-dollar-circle', color: 'gold',  money: true },
    { key: 'monthlyRevenue',      labelKey: 'admin.reports.metrics.monthlyRevenue',      fallback: 'Revenue this month',   icon: 'isax isax-calendar-1',    color: 'sage',  money: true },
    { key: 'subscriptionRevenue', labelKey: 'admin.reports.metrics.subscriptionRevenue', fallback: 'Subscription revenue', icon: 'isax isax-crown',         color: 'rose',  money: true },
    { key: 'courseRevenue',       labelKey: 'admin.reports.metrics.courseRevenue',       fallback: 'Course sales',         icon: 'isax isax-book',          color: 'slate', money: true },
    { key: 'ebookRevenue',        labelKey: 'admin.reports.metrics.ebookRevenue',        fallback: 'Ebook sales',          icon: 'isax isax-book-1',        color: 'amber', money: true },
    { key: 'pendingAmount',       labelKey: 'admin.reports.metrics.pendingAmount',       fallback: 'Pending payments',     icon: 'isax isax-clock',         color: 'amber', money: true },
    { key: 'refundedAmount',      labelKey: 'admin.reports.metrics.refundedAmount',      fallback: 'Refunded',             icon: 'isax isax-money-remove',  color: 'rose',  money: true },
    { key: 'completedCount',      labelKey: 'admin.reports.metrics.completedCount',      fallback: 'Completed payments',   icon: 'isax isax-tick-circle',   color: 'sage' },
    { key: 'pendingCount',        labelKey: 'admin.reports.metrics.pendingCount',        fallback: 'Pending payments (count)', icon: 'isax isax-timer-1',   color: 'slate' },
    { key: 'failedCount',         labelKey: 'admin.reports.metrics.failedCount',         fallback: 'Failed payments',      icon: 'isax isax-close-circle',  color: 'rose' },
  ],
  users: [
    { key: 'totalUsers',        labelKey: 'admin.reports.metrics.totalUsers',        fallback: 'Total users',          icon: 'isax isax-people',       color: 'gold' },
    { key: 'students',          labelKey: 'admin.reports.metrics.students',          fallback: 'Students',             icon: 'isax isax-user',         color: 'sage' },
    { key: 'instructors',       labelKey: 'admin.reports.metrics.instructors',       fallback: 'Instructors',          icon: 'isax isax-teacher',      color: 'slate' },
    { key: 'admins',            labelKey: 'admin.reports.metrics.admins',            fallback: 'Admins',               icon: 'isax isax-shield-tick',  color: 'rose' },
    { key: 'newUsersThisMonth', labelKey: 'admin.reports.metrics.newUsersThisMonth', fallback: 'New users this month', icon: 'isax isax-user-add',     color: 'amber' },
    { key: 'activeSubscribers', labelKey: 'admin.reports.metrics.activeSubscribers', fallback: 'Active subscribers',   icon: 'isax isax-crown',        color: 'gold' },
  ],
  courses: [
    { key: 'totalCourses',         labelKey: 'admin.reports.metrics.totalCourses',         fallback: 'Total courses',     icon: 'isax isax-book',         color: 'gold' },
    { key: 'publishedCourses',     labelKey: 'admin.reports.metrics.publishedCourses',     fallback: 'Published',         icon: 'isax isax-tick-circle',  color: 'sage' },
    { key: 'pendingReviewCourses', labelKey: 'admin.reports.metrics.pendingReviewCourses', fallback: 'Pending review',    icon: 'isax isax-clock',        color: 'amber' },
    { key: 'draftCourses',         labelKey: 'admin.reports.metrics.draftCourses',         fallback: 'Drafts',            icon: 'isax isax-edit-2',       color: 'slate' },
    { key: 'archivedCourses',      labelKey: 'admin.reports.metrics.archivedCourses',      fallback: 'Archived',          icon: 'isax isax-archive-1',    color: 'rose' },
    { key: 'totalEnrollments',     labelKey: 'admin.reports.metrics.totalEnrollments',     fallback: 'Total enrollments', icon: 'isax isax-teacher',      color: 'sage' },
    { key: 'coursesSold',          labelKey: 'admin.reports.metrics.coursesSold',          fallback: 'Courses sold',      icon: 'isax isax-shopping-cart', color: 'gold' },
    { key: 'courseRevenue',        labelKey: 'admin.reports.metrics.courseRevenue',        fallback: 'Course sales',      icon: 'isax isax-dollar-circle', color: 'gold', money: true },
  ],
  subscriptions: [
    { key: 'totalSubscriptions',         labelKey: 'admin.reports.metrics.totalSubscriptions',         fallback: 'Total subscriptions',         icon: 'isax isax-crown',         color: 'gold' },
    { key: 'activeSubscriptions',        labelKey: 'admin.reports.metrics.activeSubscriptions',        fallback: 'Active',                      icon: 'isax isax-tick-circle',   color: 'sage' },
    { key: 'pastDueSubscriptions',       labelKey: 'admin.reports.metrics.pastDueSubscriptions',       fallback: 'Past due',                    icon: 'isax isax-warning-2',     color: 'amber' },
    { key: 'cancelledSubscriptions',     labelKey: 'admin.reports.metrics.cancelledSubscriptions',     fallback: 'Cancelled',                   icon: 'isax isax-close-circle',  color: 'rose' },
    { key: 'expiredSubscriptions',       labelKey: 'admin.reports.metrics.expiredSubscriptions',       fallback: 'Expired',                     icon: 'isax isax-timer-pause',   color: 'slate' },
    { key: 'subscriptionRevenue',        labelKey: 'admin.reports.metrics.subscriptionRevenue',        fallback: 'Subscription revenue',        icon: 'isax isax-dollar-circle', color: 'gold', money: true },
    { key: 'monthlySubscriptionRevenue', labelKey: 'admin.reports.metrics.monthlySubscriptionRevenue', fallback: 'Subscription revenue this month', icon: 'isax isax-calendar-1', color: 'sage', money: true },
  ],
};

const BREAKDOWNS: Record<ReportType, Breakdown> = {
  revenue: {
    totalKey: 'totalRevenue', titleKey: 'admin.reports.revenueSplit', titleFallback: 'Revenue by source', money: true,
    parts: [
      { key: 'subscriptionRevenue', labelKey: 'admin.reports.metrics.subscriptionRevenue', fallback: 'Subscription revenue', color: '#651C32' },
      { key: 'courseRevenue',       labelKey: 'admin.reports.metrics.courseRevenue',       fallback: 'Course sales',         color: '#C5912C' },
      { key: 'ebookRevenue',        labelKey: 'admin.reports.metrics.ebookRevenue',        fallback: 'Ebook sales',          color: '#855A0E' },
    ],
  },
  users: {
    totalKey: 'totalUsers', titleKey: 'admin.reports.usersSplit', titleFallback: 'Users by role',
    parts: [
      { key: 'students',    labelKey: 'admin.reports.metrics.students',    fallback: 'Students',    color: '#C5912C' },
      { key: 'instructors', labelKey: 'admin.reports.metrics.instructors', fallback: 'Instructors', color: '#855A0E' },
      { key: 'admins',      labelKey: 'admin.reports.metrics.admins',      fallback: 'Admins',      color: '#651C32' },
    ],
  },
  courses: {
    totalKey: 'totalCourses', titleKey: 'admin.reports.coursesSplit', titleFallback: 'Courses by status',
    parts: [
      { key: 'publishedCourses',     labelKey: 'admin.reports.metrics.publishedCourses',     fallback: 'Published',      color: '#855A0E' },
      { key: 'pendingReviewCourses', labelKey: 'admin.reports.metrics.pendingReviewCourses', fallback: 'Pending review', color: '#C5912C' },
      { key: 'draftCourses',         labelKey: 'admin.reports.metrics.draftCourses',         fallback: 'Drafts',         color: '#7C6A73' },
      { key: 'archivedCourses',      labelKey: 'admin.reports.metrics.archivedCourses',      fallback: 'Archived',       color: '#651C32' },
    ],
  },
  subscriptions: {
    totalKey: 'totalSubscriptions', titleKey: 'admin.reports.subscriptionsSplit', titleFallback: 'Subscriptions by status',
    parts: [
      { key: 'activeSubscriptions',    labelKey: 'admin.reports.metrics.activeSubscriptions',    fallback: 'Active',    color: '#855A0E' },
      { key: 'pastDueSubscriptions',   labelKey: 'admin.reports.metrics.pastDueSubscriptions',   fallback: 'Past due',  color: '#C5912C' },
      { key: 'cancelledSubscriptions', labelKey: 'admin.reports.metrics.cancelledSubscriptions', fallback: 'Cancelled', color: '#651C32' },
      { key: 'expiredSubscriptions',   labelKey: 'admin.reports.metrics.expiredSubscriptions',   fallback: 'Expired',   color: '#7C6A73' },
    ],
  },
};

const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const AdminReports: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [type, setType] = useState<ReportType>('revenue');
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (rtype: ReportType) => {
    setLoading(true);
    setError('');
    try {
      setReport(await adminService.getReports(rtype));
    } catch (err) {
      setReport(null);
      setError(extractApiError(err, t('admin.reports.loadFailed', 'Failed to load the report')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(type); }, [type, load]);

  const currency = (report?.currency as string) || 'MAD';
  const display = (m: { key: string; money?: boolean }) => {
    const v = toNumber(report?.[m.key]);
    return m.money ? formatMAD(v, currency) : v.toLocaleString(i18n.language);
  };

  const generatedAt = report?.generatedAt
    ? new Date(String(report.generatedAt)).toLocaleString(i18n.language, {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  const breakdown = BREAKDOWNS[type];
  const breakdownTotal = toNumber(report?.[breakdown.totalKey]);

  return (
    <LuxuryDashboardLayout>
      {/* ── Header + tabs ── */}
      <div className="lx-card mb-4">
        <div className="lx-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h6 style={{ margin: 0 }}>{t('admin.reports.title', 'Reports')}</h6>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
              {generatedAt
                ? t('admin.reports.generatedAt', { date: generatedAt, defaultValue: `Generated ${generatedAt}` })
                : t('admin.reports.subtitle', 'Platform-wide summaries computed from live data')}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                className={`lx-btn lx-btn-sm ${type === tab.type ? 'lx-btn-gold' : 'lx-btn-outline'}`}
                onClick={() => setType(tab.type)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <i className={tab.icon} />
                {t(tab.labelKey, tab.fallback)}
              </button>
            ))}
            <button
              type="button"
              className="lx-btn lx-btn-sm lx-btn-outline"
              onClick={() => load(type)}
              disabled={loading}
              title={t('admin.reports.refresh', 'Refresh')}
            >
              <i className="isax isax-refresh" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="lx-card mb-4" style={{ borderColor: 'rgba(101, 28, 50,0.25)' }}>
          <div className="lx-card-body" style={{ color: '#651C32', fontSize: 14 }}>
            <i className="isax isax-warning-2" style={{ marginRight: 6 }} />{error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spin size="large" />
        </div>
      ) : report && (
        <>
          {/* ── Figures ── */}
          <div className="row g-4 mb-4">
            {METRICS[type].map((m) => (
              <div key={m.key} className="col-xxl-3 col-lg-4 col-md-6">
                <div className="lx-stat-card">
                  <div className={`stat-icon ${m.color}`}>
                    <i className={m.icon} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">{t(m.labelKey, m.fallback)}</p>
                    <h3 className="stat-value" style={m.money ? { fontSize: 20 } : undefined}>{display(m)}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Breakdown ── */}
          <div className="lx-card">
            <div className="lx-card-header">
              <h6>{t(breakdown.titleKey, breakdown.titleFallback)}</h6>
            </div>
            <div className="lx-card-body">
              {breakdownTotal <= 0 ? (
                <LxEmptyState
                  compact
                  icon="isax-chart-21"
                  title={t('admin.reports.noData', 'No data yet.')}
                  text={t('emptyStates.reportText', 'Figures appear here as soon as there is activity in this period.')}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {breakdown.parts.map((part) => {
                    const value = toNumber(report[part.key]);
                    const pct = Math.min(100, Math.round((value / breakdownTotal) * 100));
                    return (
                      <div key={part.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: 'var(--lx-text)' }}>{t(part.labelKey, part.fallback)}</span>
                          <span style={{ color: 'var(--lx-text-muted)' }}>
                            {breakdown.money ? formatMAD(value, currency) : value.toLocaleString(i18n.language)} · {pct}%
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(101, 28, 50,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: part.color, transition: 'width .4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default AdminReports;
