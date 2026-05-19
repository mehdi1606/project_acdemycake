import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { adminService } from '../../../services/api/admin.service';
import { extractApiError } from '../../../services/api/error.utils';

type ReportType = 'revenue' | 'enrollment' | 'users';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  RESOLVED: 'badge-success',
  DISMISSED: 'badge-secondary',
};

const TARGET_BADGE: Record<string, string> = {
  POST: 'badge-info',
  COMMENT: 'badge-primary',
  USER: 'badge-danger',
  COURSE: 'badge-success',
};

const AdminReports: React.FC = () => {
  const { t } = useTranslation()
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState<ReportType>('revenue');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(async (p: number, rtype: ReportType) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getReports(rtype, p, 20);
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
    load(page, type);
  }, [page, type, load]);

  const handleType = (rtype: ReportType) => {
    setType(rtype);
    setPage(0);
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-1">Reports</h5>
            <p className="text-muted fs-13 mb-0">{totalElements} report{totalElements !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

        {/* Tabs */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {(['revenue', 'enrollment', 'users'] as ReportType[]).map((rtype) => (
            <button
              key={rtype}
              className={`btn btn-sm ${type === rtype ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleType(rtype)}
            >
              {rtype.charAt(0).toUpperCase() + rtype.slice(1)}
            </button>
          ))}
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3">Reporter</th>
                    <th>Target</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th className="pe-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <div className="spinner-border spinner-border-sm" style={{ color: 'var(--lx-primary)' }} />
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">No reports found.</td>
                    </tr>
                  ) : (
                    rows.map((r: any) => (
                      <tr key={r.id}>
                        <td className="ps-4 py-3 fs-14">{r.reporterName ?? '—'}</td>
                        <td className="py-3">
                          <span className={`badge ${TARGET_BADGE[r.targetType] ?? 'badge-secondary'} rounded-pill fs-11`}>
                            {r.targetType}
                          </span>
                        </td>
                        <td className="py-3 fs-13 text-muted" style={{ maxWidth: 280 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {r.reason ?? '—'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-secondary'} rounded-pill`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="pe-4 py-3 fs-13 text-muted">{fmt(r.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <p className="text-muted fs-13 mb-0">Page {page + 1} of {totalPages}</p>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminReports;
