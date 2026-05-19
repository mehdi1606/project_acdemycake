import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { paymentService } from '../../../services/api/payment.service';
import { PaymentTransaction, PaymentStatus } from '../../../services/api/types';
import { Spin } from 'antd';


const PAGE_SIZE = 10;

type StatusFilter = 'ALL' | PaymentStatus;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All',       value: 'ALL' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Pending',   value: 'PENDING' },
  { label: 'Failed',    value: 'FAILED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded',  value: 'REFUNDED' },
];

const statusBadge = (status: PaymentStatus) => {
  const map: Record<string, { cls: string; label: string }> = {
    COMPLETED: { cls: 'badge-success',  label: 'Completed' },
    PENDING:   { cls: 'badge-warning',  label: 'Pending' },
    FAILED:    { cls: 'badge-danger',   label: 'Failed' },
    CANCELLED: { cls: 'badge-slate',    label: 'Cancelled' },
    REFUNDED:  { cls: 'badge-info',     label: 'Refunded' },
  };
  const s = map[status] ?? { cls: 'badge-slate', label: String(status) };
  return <span className={`lx-badge ${s.cls}`}>{s.label}</span>;
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAmount = (amount: number, currency: string) =>
  `${currency ?? ''} ${Number(amount ?? 0).toFixed(2)}`;

const StudentOrder: React.FC = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PaymentTransaction | null>(null);

  const load = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await paymentService.getPaymentHistory(p, PAGE_SIZE);
      setTransactions(res.content || []);
      setTotalPages(res.totalPages ?? 0);
      setTotalElements(res.totalElements ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load order history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (transactions || []).filter((tx: PaymentTransaction) => {
      const matchStatus = statusFilter === 'ALL' || tx.status === statusFilter;
      const matchSearch =
        !q ||
        (tx.payzoneOrderId?.toLowerCase().includes(q) ?? false) ||
        (tx.courseName?.toLowerCase().includes(q) ?? false) ||
        (tx.transactionType?.toLowerCase().includes(q) ?? false);
      return matchStatus && matchSearch;
    });
  }, [transactions, statusFilter, search]);

  // ── Pagination ──────────────────────────────────────────────────────────
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>
          Page {page + 1} of {totalPages}
        </p>
        <div className="d-flex gap-1">
          <button
            className="lx-btn lx-btn-outline lx-btn-sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ opacity: page === 0 ? 0.4 : 1 }}
          >
            <i className="isax isax-arrow-left-2" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`lx-btn lx-btn-sm ${page === i ? 'lx-btn-gold' : 'lx-btn-outline'}`}
              onClick={() => setPage(i)}
              style={{ minWidth: 36, justifyContent: 'center' }}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="lx-btn lx-btn-outline lx-btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{ opacity: page === totalPages - 1 ? 0.4 : 1 }}
          >
            <i className="isax isax-arrow-right-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
          Order History
          {totalElements > 0 && (
            <span className="lx-badge badge-info" style={{ marginLeft: 8, fontSize: 11 }}>{totalElements}</span>
          )}
        </h5>
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`lx-btn lx-btn-sm ${statusFilter === opt.value ? '' : 'lx-btn-outline'}`}
              style={statusFilter === opt.value ? { background: 'var(--lx-primary)', color: '#fff', border: '1.5px solid var(--lx-primary)' } : {}}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', maxWidth: 250 }}>
          <i className="isax isax-search-normal-1" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--lx-text-muted)', fontSize: 16 }} />
          <input
            type="text"
            placeholder="Search order or course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              border: '1.5px solid rgba(107, 29, 42, 0.12)',
              borderRadius: 'var(--lx-radius-sm)',
              fontSize: 13,
              outline: 'none',
              background: 'rgba(255,255,255,0.6)',
              color: 'var(--lx-text)',
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--lx-radius-sm)',
            background: 'rgba(139, 35, 53, 0.06)',
            border: '1px solid rgba(139, 35, 53, 0.12)',
            color: '#8B2335',
            fontSize: 14,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <i className="isax isax-warning-2" />{error}
          <button className="lx-btn lx-btn-sm lx-btn-outline" style={{ marginLeft: 'auto' }} onClick={() => load(page)}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spin size="large" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-receipt-item" /></div>
              <h6>No orders found</h6>
              <p>{totalElements === 0 ? "You haven't made any purchases yet." : 'No orders match the current filter.'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="lx-card">
          <div className="lx-card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((txn: PaymentTransaction) => (
                    <tr key={txn.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelected(txn)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--lx-primary)', fontWeight: 600, fontSize: 13 }}
                        >
                          #{txn.payzoneOrderId ?? txn.id.substring(0, 8).toUpperCase()}
                        </button>
                      </td>
                      <td style={{ fontSize: 13.5, color: 'var(--lx-text)' }}>
                        {txn.transactionType === 'COURSE_PURCHASE' ? txn.courseName ?? 'Course Purchase' : 'Subscription'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>{formatDate(txn.createdAt)}</td>
                      <td style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--lx-text)' }}>{formatAmount(txn.amount, txn.currency)}</td>
                      <td>{statusBadge(txn.status)}</td>
                      <td>
                        <button
                          className="lx-btn lx-btn-outline lx-btn-sm"
                          title="View invoice"
                          onClick={() => setSelected(txn)}
                        >
                          <i className="isax isax-eye" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 20px 16px' }}>
              {renderPagination()}
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Detail Modal ── */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1040 }}
          />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
            <div
              style={{
                width: '100%',
                maxWidth: 650,
                maxHeight: '85vh',
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderRadius: 'var(--lx-radius-lg)',
                border: '1px solid rgba(107, 29, 42, 0.1)',
                boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0, fontSize: 16 }}>Invoice</h5>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--lx-text-muted)', fontSize: 20 }}>
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: 24 }}>
                {/* Order reference */}
                <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                  <div className="row justify-content-between align-items-center">
                    <div className="col-md-6">
                      <div style={{ marginBottom: 8 }}>
                        <img src="assets/img/logo.svg" className="img-fluid" alt="logo" style={{ maxHeight: 36 }} />
                      </div>
                    </div>
                    <div className="col-md-6 text-md-end">
                      <h6 style={{ color: 'var(--lx-primary)', fontSize: 16, marginBottom: 4, fontWeight: 700 }}>
                        #{selected.payzoneOrderId ?? selected.id.substring(0, 8).toUpperCase()}
                      </h6>
                      <p style={{ marginBottom: 2, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                        Date: <span style={{ color: 'var(--lx-text)' }}>{formatDate(selected.createdAt)}</span>
                      </p>
                      {selected.completedAt && (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                          Paid on: <span style={{ color: 'var(--lx-text)' }}>{formatDate(selected.completedAt)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Type + status */}
                <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                  <div className="row g-4 align-items-center">
                    <div className="col-lg-6">
                      <p style={{ color: 'var(--lx-text-muted)', marginBottom: 4, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</p>
                      <span className="lx-badge badge-info">
                        {selected.transactionType === 'COURSE_PURCHASE' ? 'Course Purchase' : 'Subscription'}
                      </span>
                    </div>
                    <div className="col-lg-3">
                      <p style={{ color: 'var(--lx-text-muted)', marginBottom: 4, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Status</p>
                      {statusBadge(selected.status)}
                    </div>
                    {selected.paymentMethod && (
                      <div className="col-lg-3">
                        <p style={{ color: 'var(--lx-text-muted)', marginBottom: 4, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Method</p>
                        <span style={{ fontSize: 14, color: 'var(--lx-text)' }}>{selected.paymentMethod}</span>
                      </div>
                    )}
                  </div>

                  {selected.payzoneTransactionId && (
                    <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                      Transaction ref: <span style={{ color: 'var(--lx-text)', fontWeight: 500 }}>{selected.payzoneTransactionId}</span>
                    </p>
                  )}

                  {selected.errorMessage && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '8px 12px',
                        borderRadius: 'var(--lx-radius-sm)',
                        background: 'rgba(139, 35, 53, 0.06)',
                        border: '1px solid rgba(139, 35, 53, 0.12)',
                        color: '#8B2335',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <i className="isax isax-warning-2" />{selected.errorMessage}
                    </div>
                  )}
                </div>

                {/* Line item */}
                <div className="table-responsive" style={{ marginBottom: 16 }}>
                  <table className="lx-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>Description</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ color: 'var(--lx-text)' }}>
                          {selected.transactionType === 'COURSE_PURCHASE' ? selected.courseName ?? 'Course Purchase' : 'Platform Subscription'}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--lx-text-muted)' }}>1</td>
                        <td style={{ textAlign: 'right', color: 'var(--lx-text)' }}>{formatAmount(selected.amount, selected.currency)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                  <div className="d-flex justify-content-end">
                    <div style={{ width: 250 }}>
                      <div className="d-flex justify-content-between" style={{ padding: '8px 0', borderBottom: '1px solid rgba(107, 29, 42, 0.04)' }}>
                        <span style={{ color: 'var(--lx-text-muted)', fontSize: 14 }}>Sub Total</span>
                        <span style={{ fontWeight: 500, color: 'var(--lx-text)' }}>{formatAmount(selected.amount, selected.currency)}</span>
                      </div>
                      <div className="d-flex justify-content-between" style={{ paddingTop: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--lx-text)', fontSize: 15 }}>Total Amount</span>
                        <span style={{ fontWeight: 700, color: 'var(--lx-text)', fontSize: 15 }}>{formatAmount(selected.amount, selected.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ color: 'var(--lx-text-muted)', fontSize: 13, margin: 0 }}>
                  Full payment grants non-transferable access to the purchased content, subject to the provider&apos;s refund policy.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentOrder;
