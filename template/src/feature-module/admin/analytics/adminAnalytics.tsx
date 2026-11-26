import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactApexChart from 'react-apexcharts';
import LxEmptyState from '../../../components/LxEmptyState';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { formatMAD } from '../../../core/common/formatMoney';
import { adminService, Analytics } from '../../../services/api/admin.service';
import { extractApiError } from '../../../services/api/error.utils';

type Period = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

// Keys match GET /admin/analytics. Revenue / courses sold / new users / new enrollments
// are for the selected period; total users and active subscriptions are current totals.
const STAT_CARDS = [
  { key: 'totalRevenue',        icon: 'isax-dollar-circle' },
  { key: 'coursesSold',         icon: 'isax-book-1' },
  { key: 'newUsers',            icon: 'isax-user-add' },
  { key: 'newEnrollments',      icon: 'isax-teacher' },
  { key: 'totalUsers',          icon: 'isax-people' },
  { key: 'activeSubscriptions', icon: 'isax-medal-star' },
];

const AdminAnalytics: React.FC = () => {
  const { t } = useTranslation()
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<Period>('MONTH');
  const [reloadKey, setReloadKey] = useState(0);

  const statLabels: Record<string, string> = {
    totalRevenue: t('admin.analytics.revenuePeriod', 'Revenue (period)'),
    coursesSold: t('admin.analytics.coursesSoldPeriod', 'Courses Sold (period)'),
    newUsers: t('admin.analytics.newUsersPeriod', 'New Users (period)'),
    newEnrollments: t('admin.analytics.newEnrollmentsPeriod', 'New Enrollments (period)'),
    totalUsers: t('admin.analytics.totalUsers', 'Total Users'),
    activeSubscriptions: t('admin.analytics.activeSubscriptions', 'Active Subscriptions'),
  };
  const periodLabels: Record<Period, string> = {
    WEEK: t('enums.period.WEEK', 'Week'),
    MONTH: t('enums.period.MONTH', 'Month'),
    QUARTER: t('enums.period.QUARTER', 'Quarter'),
    YEAR: t('enums.period.YEAR', 'Year'),
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminService.getAnalytics(period);
        setData(res);
      } catch (err) {
        setError(extractApiError(err, t('admin.analytics.loadError', "We couldn't load the analytics. Please try again.")));
      } finally {
        setLoading(false);
      }
    })();
  }, [period, reloadKey, t]);

  const revenueChart = data?.revenueByDay ? {
    chart: { type: 'area' as const, height: 220, toolbar: { show: false }, sparkline: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05, gradientToColors: ['#F3D58E'] } },
    colors: ['#C5912C'],
    xaxis: { categories: data.revenueByDay.map((d) => d.date), tickAmount: 10, labels: { rotate: -45, style: { fontSize: '12px' } } },
    yaxis: { labels: { formatter: (v: number) => `${v.toFixed(0)} MAD` } },
    tooltip: { theme: 'light' },
    series: [{ name: t('admin.analytics.revenue', 'Revenue'), data: data.revenueByDay.map((d) => Number(d.amount) || 0) }],
  } : null;

  const usersChart = data?.usersByDay ? {
    chart: { type: 'bar' as const, height: 220, toolbar: { show: false } },
    dataLabels: { enabled: false },
    colors: ['#651C32'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    xaxis: { categories: data.usersByDay.map((d) => d.date), tickAmount: 10, labels: { rotate: -45, style: { fontSize: '12px' } } },
    yaxis: { labels: { formatter: (v: number) => `${Math.round(v)}` } },
    series: [{ name: t('admin.analytics.newUsers', 'New Users'), data: data.usersByDay.map((d) => d.count) }],
    tooltip: { theme: 'light' },
  } : null;

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h5 className="lx-page-title mb-1">{t('admin.analytics.title', 'Analytics')}</h5>
            <p className="text-muted fs-13 mb-0">{t('admin.analytics.subtitle', 'Platform performance overview')}</p>
          </div>
          <div className="lx-seg" role="group">
            {(['WEEK', 'MONTH', 'QUARTER', 'YEAR'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                className={`lx-seg-btn${period === p ? ' is-active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 mb-4 d-flex align-items-center gap-2 flex-wrap">
            <span className="flex-grow-1">{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setReloadKey((k) => k + 1)}>
              {t('common.tryAgain', 'Try Again')}
            </button>
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border" style={{ color: 'var(--lx-primary)' }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="row g-3 mb-4">
              {STAT_CARDS.map(({ key, icon }) => (
                <div key={key} className="col-12 col-sm-6 col-xl-4">
                  <div className={`lx-stat-card h-100${key === 'totalRevenue' ? ' is-key' : ''}`}>
                    <div className="stat-icon">
                      <i className={`isax ${icon}`} />
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">{statLabels[key]}</p>
                      <h3 className="stat-value">
                        {key === 'totalRevenue'
                          ? formatMAD(data?.totalRevenue ?? 0)
                          : Number(data?.[key as keyof Analytics] ?? 0).toLocaleString()}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="row g-3 mb-4">
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">{t('admin.analytics.revenueOverTime', 'Revenue Over Time')}</h6>
                    {revenueChart ? (
                      <ReactApexChart options={revenueChart} series={revenueChart.series} type="area" height={220} />
                    ) : (
                      <LxEmptyState compact icon="isax-chart-21" title={t('emptyStates.chartTitle', 'Nothing to chart yet')} text={t('admin.analytics.noData', 'No data for this period yet.')} />
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">{t('admin.analytics.newUsersOverTime', 'New Users Over Time')}</h6>
                    {usersChart ? (
                      <ReactApexChart options={usersChart} series={usersChart.series} type="bar" height={220} />
                    ) : (
                      <LxEmptyState compact icon="isax-chart-21" title={t('emptyStates.chartTitle', 'Nothing to chart yet')} text={t('admin.analytics.noData', 'No data for this period yet.')} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top courses */}
            {(data?.topCourses?.length ?? 0) > 0 && (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3">{t('admin.analytics.topCourses', 'Top Courses by Revenue (period)')}</h6>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>{t('admin.analytics.course', 'Course')}</th>
                          <th>{t('admin.analytics.sales', 'Sales')}</th>
                          <th>{t('admin.analytics.revenue', 'Revenue')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data!.topCourses.map((c) => (
                          <tr key={c.courseId}>
                            <td className="fw-semibold fs-14">{c.title ?? t('admin.analytics.deletedCourse', 'Deleted course')}</td>
                            <td className="fs-14">{c.sales}</td>
                            <td className="fs-14 lx-money">
                              {formatMAD(c.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminAnalytics;
