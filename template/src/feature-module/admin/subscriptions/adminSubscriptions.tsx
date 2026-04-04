import React, { useCallback, useEffect, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { adminService } from '../../../services/api/admin.service';
import { extractApiError } from '../../../services/api/error.utils';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-success',
  CANCELLED: 'badge-warning',
  EXPIRED: 'badge-danger',
  PENDING: 'badge-info',
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

const AdminSubscriptions: React.FC = () => {
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
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
            <h5 className="fw-bold mb-1">Subscriptions</h5>
            <p className="text-muted fs-13 mb-0">
              {totalElements} total subscription{totalElements !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

        {/* Filters */}
        <div className="d-flex gap-2 flex-wrap mb-3">
          {['', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleStatus(s)}
            >
              {s || 'All'}
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
                    <th className="ps-4 py-3">User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>Expires</th>
                    <th className="pe-4">Amount</th>
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
                      <td colSpan={6} className="text-center py-5 text-muted">No subscriptions found.</td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td className="ps-4 py-3">
                          <div className="fw-semibold fs-14">{r.userFullName}</div>
                          <div className="text-muted fs-12">{r.userEmail}</div>
                        </td>
                        <td className="py-3 fs-14 text-capitalize">{r.planType}</td>
                        <td className="py-3">
                          <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-secondary'} rounded-pill`}>
                            {r.status}
                          </span>
                          {r.cancelAtPeriodEnd && (
                            <span className="badge badge-warning rounded-pill ms-1 fs-11">Cancels at period end</span>
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
            <p className="text-muted fs-13 mb-0">Page {page + 1} of {totalPages}</p>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                Previous
              </button>
              <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminSubscriptions;
