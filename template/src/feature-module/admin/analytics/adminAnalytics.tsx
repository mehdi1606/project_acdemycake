import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactApexChart from 'react-apexcharts';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { formatMAD } from '../../../core/common/formatMoney';
import { adminService, Analytics } from '../../../services/api/admin.service';
import { extractApiError } from '../../../services/api/error.utils';

type Period = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

// Keys match GET /admin/analytics. Revenue / courses sold / new users / new enrollments
// are for the selected period; total users and active subscriptions are current totals.
const STAT_CARDS = [
  { key: 'totalRevenue',        label: 'Revenue (period)',       icon: 'isax-dollar-circle',  color: '#C9A227' },
  { key: 'coursesSold',         label: 'Courses Sold (period)',  icon: 'isax-book-1',         color: '#8B5CF6' },
  { key: 'newUsers',            label: 'New Users (period)',     icon: 'isax-user-add',       color: '#3B82F6' },
  { key: 'newEnrollments',      label: 'New Enrollments (period)', icon: 'isax-teacher',      color: '#F59E0B' },
  { key: 'totalUsers',          label: 'Total Users',            icon: 'isax-people',         color: '#0EA5E9' },
  { key: 'activeSubscriptions', label: 'Active Subscriptions',   icon: 'isax-medal-star',     color: '#10B981' },
];

const AdminAnalytics: React.FC = () => {
  const { t } = useTranslation()
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<Period>('MONTH');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminService.getAnalytics(period);
        setData(res);
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  const revenueChart = data?.revenueByDay ? {
    chart: { type: 'area' as const, height: 220, toolbar: { show: false }, sparkline: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    colors: ['#C9A227'],
    xaxis: { categories: data.revenueByDay.map((d) => d.date), tickAmount: 10, labels: { rotate: -45, style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: (v: number) => `${v.toFixed(0)} MAD` } },
    tooltip: { theme: 'dark' },
    series: [{ name: 'Revenue', data: data.revenueByDay.map((d) => Number(d.amount) || 0) }],
  } : null;

  const usersChart = data?.usersByDay ? {
    chart: { type: 'bar' as const, height: 220, toolbar: { show: false } },
    dataLabels: { enabled: false },
    colors: ['#3B82F6'],
    xaxis: { categories: data.usersByDay.map((d) => d.date), tickAmount: 10, labels: { rotate: -45, style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: (v: number) => `${Math.round(v)}` } },
    series: [{ name: 'New Users', data: data.usersByDay.map((d) => d.count) }],
    tooltip: { theme: 'dark' },
  } : null;

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h5 className="fw-bold mb-1">Analytics</h5>
            <p className="text-muted fs-13 mb-0">Platform performance overview</p>
          </div>
          <div className="btn-group">
            {(['WEEK', 'MONTH', 'QUARTER', 'YEAR'] as Period[]).map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${period === p ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 mb-4">{error}</div>}

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border" style={{ color: 'var(--lx-primary)' }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="row g-3 mb-4">
              {STAT_CARDS.map(({ key, label, icon, color }) => (
                <div key={key} className="col-6 col-xl-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-3 d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 44, height: 44, background: `${color}18` }}>
                        <i className={`isax ${icon} fs-20`} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-muted fs-12 mb-0">{label}</p>
                        <h5 className="fw-bold mb-0">
                          {key === 'totalRevenue'
                            ? formatMAD(data?.totalRevenue ?? 0)
                            : Number(data?.[key as keyof Analytics] ?? 0).toLocaleString()}
                        </h5>
                      </div>
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
                    <h6 className="fw-bold mb-3">Revenue Over Time</h6>
                    {revenueChart ? (
                      <ReactApexChart options={revenueChart} series={revenueChart.series} type="area" height={220} />
                    ) : (
                      <p className="text-muted fs-14">No data available.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">New Users Over Time</h6>
                    {usersChart ? (
                      <ReactApexChart options={usersChart} series={usersChart.series} type="bar" height={220} />
                    ) : (
                      <p className="text-muted fs-14">No data available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top courses */}
            {(data?.topCourses?.length ?? 0) > 0 && (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3">Top Courses by Revenue (period)</h6>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Sales</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data!.topCourses.map((c) => (
                          <tr key={c.courseId}>
                            <td className="fw-semibold fs-14">{c.title ?? 'Deleted course'}</td>
                            <td className="fs-14">{c.sales}</td>
                            <td className="fs-14 fw-semibold" style={{ color: 'var(--lx-gold)' }}>
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
