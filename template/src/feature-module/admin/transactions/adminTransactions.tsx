import React, { useEffect, useState } from 'react';
import { formatMAD } from '../../../core/common/formatMoney';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Spin, message, Pagination, Select } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchTransactions } from '../../../core/redux/adminSlice';
import adminService, { TransactionStats } from '../../../services/api/admin.service';
import InvoiceDownloadButton from '../../../components/InvoiceDownloadButton';


const AdminTransactions = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { transactions, transactionsPagination, isLoadingTransactions, error } =
    useAppSelector((state) => state.admin);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Aggregate revenue stats — computed on the backend over the WHOLE dataset
  // (every CMI payment), so the cards are correct regardless of which page is open.
  const [stats, setStats] = useState<TransactionStats | null>(null);

  useEffect(() => {
    dispatch(fetchTransactions({
      page: currentPage,
      size: 20,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    }));
  }, [dispatch, currentPage, statusFilter, typeFilter]);

  // Refresh aggregate stats whenever the visible page changes (so a freshly
  // completed payment is reflected without a full reload).
  useEffect(() => {
    let active = true;
    adminService.getTransactionStats()
      .then((s) => { if (active) setStats(s); })
      .catch(() => { /* non-fatal: cards fall back to 0 */ });
    return () => { active = false; };
  }, [currentPage]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  // Filters are applied server-side; a new filter always starts from the first page.
  const handleStatusFilterChange = (value?: string) => {
    setStatusFilter(value || '');
    setCurrentPage(0);
  };

  const handleTypeFilterChange = (value?: string) => {
    setTypeFilter(value || '');
    setCurrentPage(0);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      COMPLETED: { cls: 'badge-success', label: t('enums.paymentStatus.COMPLETED', 'Completed') },
      PENDING:   { cls: 'badge-warning', label: t('enums.paymentStatus.PENDING', 'Pending') },
      FAILED:    { cls: 'badge-danger',  label: t('enums.paymentStatus.FAILED', 'Failed') },
      REFUNDED:  { cls: 'badge-slate',   label: t('enums.paymentStatus.REFUNDED', 'Refunded') },
      CANCELLED: { cls: 'badge-slate',   label: t('enums.paymentStatus.CANCELLED', 'Cancelled') },
    };
    const b = map[status] || { cls: 'badge-info', label: status };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      SUBSCRIPTION:    { cls: 'badge-warning', label: t('enums.transactionType.SUBSCRIPTION', 'Subscription') },
      COURSE_PURCHASE: { cls: 'badge-info',    label: t('enums.transactionType.COURSE_PURCHASE', 'Course Purchase') },
      EBOOK_PURCHASE:  { cls: 'badge-success', label: t('enums.transactionType.EBOOK_PURCHASE', 'Ebook Purchase') },
    };
    const b = map[type] || { cls: 'badge-info', label: type };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  const formatCurrency = (amount: number, currency: string = 'MAD') => formatMAD(amount, currency);

  // Status/type filtering is done server-side; the page already holds only matching rows.
  const filteredTransactions = transactions || [];

  // Revenue figures come from the backend aggregate (all CMI payments), not the
  // current page. Realised revenue = COMPLETED payments only.
  const totalRevenue        = stats?.totalRevenue        ?? 0;
  const subscriptionRevenue = stats?.subscriptionRevenue ?? 0;
  const courseRevenue       = stats?.courseRevenue       ?? 0;
  const ebookRevenue        = stats?.ebookRevenue        ?? 0;
  const pendingAmount       = stats?.pendingAmount       ?? 0;

  return (
    <LuxuryDashboardLayout>
      {/* ── Revenue Stats ── */}
      <div className="row g-4 mb-4">
        {[
          {
            label: t('admin.dashboard.totalRevenue', 'Total Revenue'),
            value: formatCurrency(totalRevenue),
            icon: 'isax isax-dollar-circle',
            color: 'gold',
            // Show in-flight (pending) volume only on the total card.
            sub: pendingAmount > 0
              ? `${formatCurrency(pendingAmount)} ${t('admin.transactions.pending', 'pending')}`
              : null,
          },
          {
            label: t('admin.sidebar.subscriptions', 'Subscriptions'),
            value: formatCurrency(subscriptionRevenue),
            icon: 'isax isax-crown',
            color: 'sage',
            sub: null,
          },
          {
            label: t('admin.transactions.courseSales', 'Course Sales'),
            value: formatCurrency(courseRevenue),
            icon: 'isax isax-book',
            color: 'slate',
            sub: null,
          },
          {
            label: t('admin.transactions.ebookSales', 'Ebook Sales'),
            value: formatCurrency(ebookRevenue),
            icon: 'isax isax-book-1',
            color: 'rose',
            sub: null,
          },
        ].map((s, i) => (
          <div key={i} className="col-xxl-3 col-md-6">
            <div className="lx-stat-card">
              <div className={`stat-icon ${s.color}`}>
                <i className={s.icon} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{s.label}</p>
                <h3 className="stat-value" style={{ fontSize: 20 }}>{s.value}</h3>
                {s.sub && (
                  <p className="stat-label" style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>
                    <i className="isax isax-clock me-1" />{s.sub}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Transactions Table Card ── */}
      <div className="lx-card">
        <div className="lx-card-header">
          <h6>{t('admin.transactions.title', 'All Transactions')}</h6>
          <div className="d-flex flex-wrap gap-2">
            <Select
              placeholder={t('admin.transactions.filterByStatus', 'Filter by status')}
              allowClear
              style={{ width: 150 }}
              value={statusFilter || undefined}
              onChange={(value?: string) => handleStatusFilterChange(value)}
              options={[
                { value: 'COMPLETED', label: t('admin.transactions.completed', 'Completed') },
                { value: 'PENDING',   label: t('common.pending', 'Pending') },
                { value: 'FAILED',    label: t('admin.transactions.failed', 'Failed') },
                { value: 'REFUNDED',  label: t('admin.transactions.refunded', 'Refunded') },
                { value: 'CANCELLED', label: t('admin.transactions.cancelled', 'Cancelled') },
              ]}
            />
            <Select
              placeholder={t('admin.transactions.filterByType', 'Filter by type')}
              allowClear
              style={{ width: 160 }}
              value={typeFilter || undefined}
              onChange={(value?: string) => handleTypeFilterChange(value)}
              options={[
                { value: 'SUBSCRIPTION',    label: t('admin.sidebar.subscriptions', 'Subscription') },
                { value: 'COURSE_PURCHASE', label: t('admin.transactions.coursePurchase', 'Course Purchase') },
                { value: 'EBOOK_PURCHASE',  label: t('admin.transactions.ebookPurchase', 'Ebook Purchase') },
              ]}
            />
          </div>
        </div>

        <div className="lx-card-body" style={{ padding: 0 }}>
          {isLoadingTransactions ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spin size="large" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-card" /></div>
              <h6>{t('admin.transactions.noTransactions', 'No Transactions Found')}</h6>
              <p>
              {statusFilter || typeFilter
                ? t('common.noResults', 'No transactions match the current filter criteria.')
                : t('admin.transactions.noTransactionsYet', 'No payment transactions have been recorded yet.')}
            </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>{t('admin.transactions.transactionId', 'Transaction ID')}</th>
                    <th>{t('admin.transactions.user', 'User')}</th>
                    <th>{t('admin.transactions.type', 'Type')}</th>
                    <th>{t('admin.transactions.amount', 'Amount')}</th>
                    <th>{t('admin.transactions.status', 'Status')}</th>
                    <th>{t('admin.transactions.date', 'Date')}</th>
                    <th aria-label={t('invoice.download', 'Download invoice')} />
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction: any) => (
                    <tr key={transaction.id}>
                      <td>
                        <code style={{ fontSize: 12, color: 'var(--lx-primary)', background: 'rgba(107, 29, 42, 0.04)', padding: '2px 8px', borderRadius: 4 }}>
                          {transaction.payzoneTransactionId ||
                            transaction.payzoneOrderId ||
                            transaction.id}
                        </code>
                      </td>
                      <td>
                        <div>
                          <p style={{ marginBottom: 2, fontWeight: 600, fontSize: 13, color: 'var(--lx-text)' }}>
                            {transaction.userName || t('admin.transactions.unknownUser', 'Unknown User')}
                          </p>
                          <small style={{ color: 'var(--lx-text-muted)', fontSize: 12 }}>
                            {transaction.userEmail}
                          </small>
                        </div>
                      </td>
                      <td>{getTypeBadge(transaction.transactionType)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: transaction.status === 'REFUNDED' ? '#8B2335' : 'var(--lx-green)',
                          }}
                        >
                          {transaction.status === 'REFUNDED' ? '-' : ''}
                          {formatCurrency(transaction.amount || 0, transaction.currency || 'MAD')}
                        </span>
                      </td>
                      <td>{getStatusBadge(transaction.status)}</td>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
                          {transaction.createdAt
                            ? `${new Date(transaction.createdAt).toLocaleDateString()} ${new Date(
                                transaction.createdAt
                              ).toLocaleTimeString()}`
                            : '—'}
                        </span>
                      </td>
                      <td>
                        {transaction.status === 'COMPLETED' && (
                          <InvoiceDownloadButton paymentId={transaction.id} admin />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {transactionsPagination?.totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={currentPage + 1}
              total={transactionsPagination.totalElements}
              pageSize={20}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminTransactions;
