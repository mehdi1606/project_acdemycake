import React, { useCallback, useEffect, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { instructorService } from '../../../services/api/instructor.service';
import { useTranslation } from 'react-i18next';
import { InstructorEarning, PaginatedResponse } from '../../../services/api/types';

function formatDate(iso: string, locale = 'en-US') {
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatAmount(n: number, currency = 'MAD') {
  return `${n.toFixed(2)} ${currency}`;
}

function shortId(id: string) {
  return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

const SourceBadge = ({ type }: { type: string }) => {
  const { t } = useTranslation();
  const isSubscription = type === 'SUBSCRIPTION_SHARE';
  return (
    <span className={`lx-badge ${isSubscription ? 'badge-info' : 'badge-slate'}`}>
      {isSubscription ? t('enums.earningSource.SUBSCRIPTION_SHARE', 'Subscription') : t('enums.transactionType.COURSE_PURCHASE', 'Course Purchase')}
    </span>
  );
};

const PayoutStatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const map: Record<string, string> = { PENDING: 'badge-warning', PAID: 'badge-success', CANCELLED: 'badge-danger' };
  const labels: Record<string, string> = { PENDING: 'Pending', PAID: 'Paid', CANCELLED: 'Cancelled' };
  return <span className={`lx-badge ${map[status] ?? 'badge-slate'}`}>{t(`enums.payoutStatus.${status}`, labels[status] ?? status)}</span>;
};

const InstructorStatement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('ar') ? 'ar-MA' : 'en-US';
  const [data, setData] = useState<PaginatedResponse<InstructorEarning> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [selected, setSelected] = useState<InstructorEarning | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchStatements = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instructorService.getStatements(page, pageSize);
      setData(res);
    } catch {
      setError(t('instructor.statementsPage.loadError', 'We couldn\'t load your statements. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchStatements(currentPage); }, [fetchStatements, currentPage]);

  const openModal = (item: InstructorEarning) => { setSelected(item); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelected(null); };

  const filtered = data
    ? data.content.filter((e) => {
        const srcOk = filterSource === 'ALL' || e.sourceType === filterSource;
        const stsOk = filterStatus === 'ALL' || e.payoutStatus === filterStatus;
        return srcOk && stsOk;
      })
    : [];

  const totalPages = data?.totalPages ?? 0;

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: '1.5px solid rgba(107, 29, 42, 0.12)',
    borderRadius: 'var(--lx-radius-sm)',
    fontSize: 13,
    background: 'rgba(255,255,255,0.6)',
    color: 'var(--lx-text)',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>{t('instructor.statementsPage.title', 'Statements')}</h5>
        {data && (
          <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
            {t('instructor.statementsPage.totalCount', '{{n}} transactions total', { n: data.totalElements })}
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <select style={selectStyle} value={filterSource} onChange={e => { setFilterSource(e.target.value); setCurrentPage(0); }}>
          <option value="ALL">{t('instructor.statementsPage.allTypes', 'All Types')}</option>
          <option value="COURSE_PURCHASE">{t('enums.transactionType.COURSE_PURCHASE', 'Course Purchase')}</option>
          <option value="SUBSCRIPTION_SHARE">{t('instructor.statementsPage.subscriptionShare', 'Subscription Share')}</option>
        </select>
        <select style={selectStyle} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(0); }}>
          <option value="ALL">{t('instructor.statementsPage.allStatuses', 'All Statuses')}</option>
          <option value="PENDING">{t('enums.payoutStatus.PENDING', 'Pending')}</option>
          <option value="PAID">{t('enums.payoutStatus.PAID', 'Paid')}</option>
          <option value="CANCELLED">{t('enums.payoutStatus.CANCELLED', 'Cancelled')}</option>
        </select>
        {(filterSource !== 'ALL' || filterStatus !== 'ALL') && (
          <button
            type="button"
            className="lx-btn lx-btn-sm"
            onClick={() => { setFilterSource('ALL'); setFilterStatus('ALL'); setCurrentPage(0); }}
            style={{ color: '#8B2335', background: 'rgba(139, 35, 53, 0.06)', border: 'none', fontSize: 12 }}
          >
            <i className="isax isax-close-circle" style={{ marginInlineEnd: 4 }} /> {t('instructor.statementsPage.clearFilters', 'Clear filters')}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>{t('instructor.statementsPage.loading', 'Loading statements...')}</p>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139, 35, 53, 0.06)', border: '1px solid rgba(139, 35, 53, 0.12)', color: '#8B2335', fontSize: 14 }}>
          <i className="isax isax-info-circle" /> {error}
          <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" style={{ marginInlineStart: 'auto' }} onClick={() => fetchStatements(currentPage)}>{t('common.tryAgain', 'Try Again')}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lx-empty-state">
          <span className="empty-icon"><i className="isax isax-document-text" style={{ fontSize: 28 }} /></span>
          <p>{data?.content.length === 0
            ? t('instructor.statementsPage.empty', 'No transactions yet. They appear here when students buy or access your courses.')
            : t('instructor.statementsPage.noMatch', 'No transactions match the current filters.')}</p>
        </div>
      ) : (
        <div className="lx-card">
          <div className="lx-card-body" style={{ padding: 0 }}>
            <table className="lx-table">
              <thead>
                <tr>
                  <th>{t('instructor.statementsPage.orderId', 'Order ID')}</th>
                  <th>{t('instructor.statementsPage.course', 'Course')}</th>
                  <th>{t('common.date', 'Date')}</th>
                  <th>{t('common.type', 'Type')}</th>
                  <th style={{ textAlign: 'end' }}>{t('instructor.earningsPage.gross', 'Gross')}</th>
                  <th style={{ textAlign: 'end' }}>{t('instructor.earningsPage.platformFee', 'Platform Fee')}</th>
                  <th style={{ textAlign: 'end' }}>{t('instructor.statementsPage.netEarned', 'Net Earned')}</th>
                  <th>{t('common.status', 'Status')}</th>
                  <th style={{ textAlign: 'center' }}>{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button type="button" onClick={() => openModal(item)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--lx-primary)', fontWeight: 600, fontSize: 13 }}>
                        {shortId(item.id)}
                      </button>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: 13 }} title={item.courseName}>
                        {item.courseName ? (item.courseName.length > 30 ? `${item.courseName.slice(0, 30)}…` : item.courseName) : <span style={{ color: 'var(--lx-text-muted)' }}>—</span>}
                      </span>
                    </td>
                    <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(item.createdAt, dateLocale)}</td>
                    <td><SourceBadge type={item.sourceType} /></td>
                    <td style={{ textAlign: 'end', fontWeight: 500 }}>{formatAmount(item.amount, item.currency)}</td>
                    <td style={{ textAlign: 'end', color: '#8B2335' }}>− {formatAmount(item.platformFee, item.currency)}</td>
                    <td style={{ textAlign: 'end', fontWeight: 600, color: '#2D5F3F' }}>{formatAmount(item.netAmount, item.currency)}</td>
                    <td><PayoutStatusBadge status={item.payoutStatus} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" title={t('instructor.statementsPage.viewDetails', 'View details')} onClick={() => openModal(item)}>
                        <i className="isax isax-eye" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>
            <i className="isax isax-arrow-left" style={{ marginInlineEnd: 4 }} /> {t('common.previous', 'Previous')}
          </button>
          <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>{t('common.pageOf', 'Page {{page}} of {{total}}', { page: currentPage + 1, total: totalPages })}</span>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>
            {t('common.next', 'Next')} <i className="isax isax-arrow-right" style={{ marginInlineStart: 4 }} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ width: '100%', maxWidth: 620, background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)', borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)', boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>
                {t('instructor.statementsPage.detailTitle', 'Statement Detail — {{id}}', { id: shortId(selected.id) })}
              </h5>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                {[
                  { label: t('instructor.earningsPage.reference', 'Reference'), value: shortId(selected.id) },
                  { label: t('common.date', 'Date'), value: formatDate(selected.createdAt, dateLocale) },
                  { label: t('common.type', 'Type'), badge: <SourceBadge type={selected.sourceType} /> },
                  { label: t('instructor.statementsPage.payoutStatus', 'Payout Status'), badge: <PayoutStatusBadge status={selected.payoutStatus} /> },
                ].map((f) => (
                  <div key={f.label}>
                    <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>{f.label}</p>
                    {f.badge || <p style={{ margin: 0, fontWeight: 600, color: 'var(--lx-text)' }}>{f.value}</p>}
                  </div>
                ))}
              </div>

              {selected.courseName && (
                <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>{t('instructor.statementsPage.course', 'Course')}</p>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--lx-text)' }}>{selected.courseName}</p>
                </div>
              )}

              {selected.description && (
                <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>{t('common.description', 'Description')}</p>
                  <p style={{ margin: 0, color: 'var(--lx-text)' }}>{selected.description}</p>
                </div>
              )}

              {/* Amount Breakdown */}
              <h6 style={{ fontSize: 14, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 12 }}>{t('instructor.statementsPage.breakdown', 'Amount Breakdown')}</h6>
              <div style={{ borderRadius: 'var(--lx-radius)', overflow: 'hidden', border: '1px solid rgba(107, 29, 42, 0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(107, 29, 42, 0.03)' }}>
                      <th style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', textAlign: 'start' }}>{t('common.description', 'Description')}</th>
                      <th style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', textAlign: 'end' }}>{t('instructor.statementsPage.amountIn', 'Amount ({{currency}})', { currency: selected.currency })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: '1px solid rgba(107, 29, 42, 0.06)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 14 }}>{t('instructor.statementsPage.grossSale', 'Gross Sale Amount')}</td>
                      <td style={{ padding: '10px 16px', fontSize: 14, textAlign: 'end' }}>{formatAmount(selected.amount, selected.currency)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid rgba(107, 29, 42, 0.06)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 14, color: '#8B2335' }}>{t('instructor.statementsPage.feeDeducted', 'Platform Fee (deducted)')}</td>
                      <td style={{ padding: '10px 16px', fontSize: 14, textAlign: 'end', color: '#8B2335' }}>− {formatAmount(selected.platformFee, selected.currency)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid rgba(107, 29, 42, 0.1)', background: 'rgba(45, 95, 63, 0.04)' }}>
                      <th style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, textAlign: 'start' }}>{t('instructor.statementsPage.netAmount', 'Net Amount (Your Earnings)')}</th>
                      <th style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, textAlign: 'end', color: '#2D5F3F' }}>{formatAmount(selected.netAmount, selected.currency)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p style={{ margin: '16px 0 0', fontSize: 12, color: 'var(--lx-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="isax isax-info-circle" /> {t('instructor.statementsPage.payoutNote', 'Payout status reflects whether this earning has been included in a completed payout.')}
              </p>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={closeModal}>{t('common.close', 'Close')}</button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorStatement;
