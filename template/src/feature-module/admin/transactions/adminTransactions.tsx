import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Spin, message, Pagination, Select } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchTransactions } from '../../../core/redux/adminSlice';


const AdminTransactions = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { transactions, transactionsPagination, isLoadingTransactions, error } =
    useAppSelector((state) => state.admin);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    dispatch(fetchTransactions({ page: currentPage, size: 20 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      COMPLETED: { cls: 'badge-success', label: 'Completed' },
      PENDING:   { cls: 'badge-warning', label: 'Pending' },
      FAILED:    { cls: 'badge-danger',  label: 'Failed' },
      REFUNDED:  { cls: 'badge-slate',   label: 'Refunded' },
    };
    const b = map[status] || { cls: 'badge-info', label: status };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      SUBSCRIPTION:    { cls: 'badge-warning', label: 'Subscription' },
      COURSE_PURCHASE: { cls: 'badge-info',    label: 'Course Purchase' },
    };
    const b = map[type] || { cls: 'badge-info', label: type };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const filteredTransactions = (transactions || []).filter((tx: any) => {
    if (statusFilter && tx.status !== statusFilter) return false;
    if (typeFilter && tx.transactionType !== typeFilter) return false;
    return true;
  });

  const totalRevenue = (transactions || [])
    .filter((tx: any) => tx.status === 'COMPLETED')
    .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

  const subscriptionRevenue = (transactions || [])
    .filter((tx: any) => tx.status === 'COMPLETED' && tx.transactionType === 'SUBSCRIPTION')
    .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

  const courseRevenue = (transactions || [])
    .filter((tx: any) => tx.status === 'COMPLETED' && tx.transactionType === 'COURSE_PURCHASE')
    .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

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
          },
          {
            label: t('admin.sidebar.subscriptions', 'Subscriptions'),
            value: formatCurrency(subscriptionRevenue),
            icon: 'isax isax-crown',
            color: 'sage',
          },
          {
            label: t('admin.transactions.courseSales', 'Course Sales'),
            value: formatCurrency(courseRevenue),
            icon: 'isax isax-book',
            color: 'slate',
          },
        ].map((s, i) => (
          <div key={i} className="col-md-4">
            <div className="lx-stat-card">
              <div className={`stat-icon ${s.color}`}>
                <i className={s.icon} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{s.label}</p>
                <h3 className="stat-value" style={{ fontSize: 20 }}>{s.value}</h3>
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
              onChange={(value) => setStatusFilter(value || '')}
              options={[
                { value: 'COMPLETED', label: t('admin.transactions.completed', 'Completed') },
                { value: 'PENDING',   label: t('common.pending', 'Pending') },
                { value: 'FAILED',    label: t('admin.transactions.failed', 'Failed') },
                { value: 'REFUNDED',  label: t('admin.transactions.refunded', 'Refunded') },
              ]}
            />
            <Select
              placeholder={t('admin.transactions.filterByType', 'Filter by type')}
              allowClear
              style={{ width: 160 }}
              onChange={(value) => setTypeFilter(value || '')}
              options={[
                { value: 'SUBSCRIPTION',    label: t('admin.sidebar.subscriptions', 'Subscription') },
                { value: 'COURSE_PURCHASE', label: t('admin.transactions.coursePurchase', 'Course Purchase') },
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
              <p>{t('common.noResults', 'No transactions match the current filter criteria.')}</p>
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
                            {transaction.userName || 'Unknown User'}
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
                          {formatCurrency(transaction.amount || 0, transaction.currency || 'USD')}
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
