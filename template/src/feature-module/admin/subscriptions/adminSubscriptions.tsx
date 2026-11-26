import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import { adminService } from '../../../services/api/admin.service';
import { extractApiError } from '../../../services/api/error.utils';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-success',
  CANCELLED: 'badge-warning',
  EXPIRED: 'badge-danger',
  PAST_DUE: 'badge-info',
};

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface SubscriptionRow {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

const SUB_STATUS_DEFAULTS: Record<string, string> = {
  ACTIVE: 'Active', PAST_DUE: 'Past due', CANCELLED: 'Cancelled', EXPIRED: 'Expired',
};
const PLAN_DEFAULTS: Record<string, string> = { monthly: 'Monthly', yearly: 'Yearly', annual: 'Yearly' };

const AdminSubscriptions: React.FC = () => {
  const { t } = useTranslation();
  const subStatusLabel = (s?: string) => (s ? t(`enums.subscriptionStatus.${s}`, SUB_STATUS_DEFAULTS[s] ?? s.replace('_', ' ')) : '—');
  const planLabel = (p?: string) => {
    const k = (p || '').toLowerCase();
    return PLAN_DEFAULTS[k] ? t(`enums.planType.${k}`, PLAN_DEFAULTS[k]) : (p || '—');
  };
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async (p: number, status: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getSubscriptions(p, 20, status || undefined);
      setRows((res as any).content ?? []);
      setTotalPages((res as any).totalPages ?? 0);
      setTotalElements((res as any).totalElements ?? 0);
    } catch (err) {
      setError(extractApiError(err, t('admin.subscriptions.loadError', "We couldn't load the subscriptions. Please try again.")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load(page, statusFilter);
  }, [page, statusFilter, load]);

  const handleStatus = (s: string) => {
    setStatusFilter(s);
    setPage(0);
  };

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h5 className="fw-bold mb-1">{t('admin.subscriptions.title', 'Subscriptions')}</h5>
            <p className="text-muted fs-13 mb-0">
              {t('admin.subscriptions.totalCount', '{{n}} subscriptions in total', { n: totalElements })}
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 mb-3 d-flex align-items-center gap-2 flex-wrap">
            <span className="flex-grow-1">{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => load(page, statusFilter)}>
              {t('common.tryAgain', 'Try Again')}
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="lx-seg mb-3" role="group">
          {['', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={statusFilter === s}
              className={`lx-seg-btn${statusFilter === s ? ' is-active' : ''}`}
              onClick={() => handleStatus(s)}
            >
              {s ? subStatusLabel(s) : t('common.all', 'All')}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3">{t('admin.subscriptions.user', 'User')}</th>
                    <th>{t('admin.subscriptions.plan', 'Plan')}</th>
                    <th>{t('admin.subscriptions.status', 'Status')}</th>
                    <th>{t('admin.subscriptions.startDate', 'Start')}</th>
                    <th>{t('admin.subscriptions.endDate', 'Expires')}</th>
                    <th className="pe-4">{t('admin.subscriptions.amount', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="spinner-border spinner-border-sm" style={{ color: 'var(--lx-primary)' }} />
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <LxEmptyState
                          compact
                          icon="isax-crown"
                          title={t('admin.subscriptions.noSubscriptions', 'No subscriptions found.')}
                          text={t('emptyStates.subscriptionsText', 'Members who subscribe to a plan will be listed here.')}
                        />
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td className="ps-4 py-3">
                          <div className="fw-semibold fs-14">{r.userFullName || '—'}</div>
                          <div className="text-muted fs-12">{r.userEmail}</div>
                        </td>
                        <td className="py-3 fs-14 text-capitalize">{planLabel(r.planType)}</td>
                        <td className="py-3">
                          <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-secondary'} rounded-pill`}>
                            {subStatusLabel(r.status)}
                          </span>
                          {r.cancelAtPeriodEnd && (
                            <span className="badge badge-warning rounded-pill ms-1 fs-11">{t('admin.subscriptions.cancelsAtPeriodEnd', 'Cancels at period end')}</span>
                          )}
                        </td>
                        <td className="py-3 fs-13 text-muted">{fmt(r.currentPeriodStart)}</td>
                        <td className="py-3 fs-13 text-muted">{fmt(r.currentPeriodEnd)}</td>
                        <td className="pe-4 py-3 fw-semibold fs-14">
                          {r.currency} {r.amount?.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
            <p className="text-muted fs-13 mb-0">{t('common.pageOf', 'Page {{page}} of {{total}}', { page: page + 1, total: totalPages })}</p>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                {t('common.previous', 'Previous')}
              </button>
              <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                {t('common.next', 'Next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminSubscriptions;
