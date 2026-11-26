import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, Pagination, message } from 'antd';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import DashSkeleton from '../../../components/DashSkeleton';
import InvoiceDownloadButton from '../../../components/InvoiceDownloadButton';
import { formatMAD } from '../../../core/common/formatMoney';
import { extractApiError } from '../../../services/api/error.utils';
import invoiceService, {
  AdminInvoiceFilter,
  AdminInvoiceList,
  Invoice,
  InvoiceCategory,
} from '../../../services/api/invoice.service';

const PAGE_SIZE = 20;

type SeriesFilter = '' | 'A' | 'MAIN';
type TypeFilter = '' | 'subscription' | 'course' | 'masterclass' | 'ebook' | 'manual';

/** YYYY-MM-DD of a local date. */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const quickRange = (kind: 'thisMonth' | 'lastMonth' | 'thisYear'): { from: string; to: string } => {
  const now = new Date();
  if (kind === 'thisYear') return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: ymd(new Date(now.getFullYear(), 11, 31)) };
  const offset = kind === 'lastMonth' ? -1 : 0;
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: ymd(first), to: ymd(last) };
};

const AdminInvoices: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir?.() === 'rtl' || i18n.language?.startsWith('ar');
  const locale = i18n.language?.startsWith('ar') ? 'ar-MA' : 'en-GB';

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [series, setSeries] = useState<SeriesFilter>('');
  const [type, setType] = useState<TypeFilter>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<AdminInvoiceList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'zip' | 'pdf' | null>(null);

  // Search waits for a short pause in typing.
  useEffect(() => {
    const id = window.setTimeout(() => { setQ(search.trim()); setPage(0); }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const filter: AdminInvoiceFilter = useMemo(() => ({ q, series, type, from, to }), [q, series, type, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await invoiceService.adminList(filter, page, PAGE_SIZE));
    } catch (err) {
      setError(extractApiError(err, t('adminInvoices.loadError', "We couldn't load the invoices. Please try again.")));
    } finally {
      setLoading(false);
    }
  }, [filter, page, t]);

  useEffect(() => { load(); }, [load]);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0); };
  const applyRange = (kind: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const r = quickRange(kind);
    setFrom(r.from); setTo(r.to); setPage(0);
  };
  const clearFilters = () => {
    setSearch(''); setQ(''); setSeries(''); setType(''); setFrom(''); setTo(''); setPage(0);
  };
  const hasFilters = Boolean(q || series || type || from || to);

  const typeLabel = (c?: InvoiceCategory) => {
    switch (c) {
      case 'SUBSCRIPTION': return t('adminInvoices.type.subscription', 'Subscription');
      case 'COURSE':       return t('adminInvoices.type.course', 'Course');
      case 'MASTERCLASS':  return t('adminInvoices.type.masterclass', 'Masterclass');
      case 'EBOOK':        return t('adminInvoices.type.ebook', 'Ebook');
      case 'MANUAL':       return t('adminInvoices.type.manual', 'Direct booking');
      default:             return t('adminInvoices.type.other', 'Other');
    }
  };
  const seriesLabel = (s?: string) => (s === 'A'
    ? t('adminInvoices.series.archive', 'Archive (A)')
    : t('adminInvoices.series.main', 'Main'));

  const fmtDate = (iso?: string, withTime = false) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return withTime
      ? d.toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const runExport = async (kind: 'csv' | 'zip') => {
    if (exporting) return;
    if (kind === 'zip' && (data?.totals.count ?? 0) > invoiceService.maxZip) {
      message.info(t('adminInvoices.zipCapped', 'Only the newest {{max}} invoices are included. Narrow the filter to get the others.',
        { max: invoiceService.maxZip }));
    }
    setExporting(kind);
    try {
      if (kind === 'csv') await invoiceService.adminExportCsv(filter);
      else await invoiceService.adminExportZip(filter);
    } catch (err: any) {
      if (!err?.response || err.response.status < 500) {
        message.error(t('adminInvoices.exportError', "The export didn't work. Please try again."));
      }
    } finally {
      setExporting(null);
    }
  };

  const downloadSelected = async () => {
    if (!selected || exporting) return;
    setExporting('pdf');
    try {
      await invoiceService.downloadInvoice(selected.id);
    } catch (err: any) {
      if (!err?.response || err.response.status < 500) {
        message.error(t('invoice.downloadError', "We couldn't download the invoice. Please try again."));
      }
    } finally {
      setExporting(null);
    }
  };

  const totals = data?.totals;
  const rows = data?.invoices.content ?? [];
  const contact = (i: Invoice) => i.buyerEmail || i.buyerPhone || '';

  const stats = [
    { key: 'count', label: t('adminInvoices.stats.count', 'Invoices'), value: String(totals?.count ?? 0), icon: 'isax-receipt-2' },
    { key: 'ht', label: t('adminInvoices.stats.ht', 'Total excl. VAT'), value: formatMAD(totals?.amountHt), icon: 'isax-money-3' },
    { key: 'vat', label: t('adminInvoices.stats.vat', 'VAT'), value: formatMAD(totals?.vatAmount), icon: 'isax-percentage-square' },
    { key: 'ttc', label: t('adminInvoices.stats.ttc', 'Total incl. VAT'), value: formatMAD(totals?.amountTtc), icon: 'isax-wallet-money' },
  ];

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="lx-section-header mb-4">
          <div>
            <h5 className="lx-page-title mb-1">{t('adminInvoices.title', 'Invoices')}</h5>
            <p className="text-muted fs-13 mb-0">
              {t('adminInvoices.subtitle', 'Every invoice issued for a payment, with exports for your accountant.')}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => runExport('csv')}
              disabled={!!exporting || !totals?.count}>
              <i className="isax isax-document-text" />
              {exporting === 'csv' ? t('adminInvoices.exporting', 'Preparing…') : t('adminInvoices.exportCsv', 'Export CSV')}
            </button>
            <button type="button" className="lx-btn lx-btn-gold lx-btn-sm" onClick={() => runExport('zip')}
              disabled={!!exporting || !totals?.count}>
              <i className="isax isax-document-download" />
              {exporting === 'zip' ? t('adminInvoices.exporting', 'Preparing…') : t('adminInvoices.exportZip', 'Download all (ZIP)')}
            </button>
          </div>
        </div>

        {error && (
          <div className="lx-alert mb-4" role="alert">
            <i className="isax isax-warning-2" />
            <span>{error}</span>
            <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={load}>
              {t('common.tryAgain', 'Try Again')}
            </button>
          </div>
        )}

        {loading && !data ? (
          <DashSkeleton stats={4} cards={1} />
        ) : (
          <>
            {/* Totals for the current filter */}
            <div className="row g-3 g-md-4 mb-4">
              {stats.map((s) => (
                <div key={s.key} className="col-6 col-xl-3">
                  <div className={`lx-stat-card h-100${s.key === 'ttc' ? ' is-key' : ''}`}>
                    <div className="stat-icon"><i className={`isax ${s.icon}`} /></div>
                    <div className="stat-info">
                      <p className="stat-label">{s.label}</p>
                      <h3 className="stat-value" dir="ltr">{s.value}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="lx-card mb-4">
              <div className="lx-card-body">
                <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                  <div className="position-relative flex-grow-1" style={{ minWidth: 220, maxWidth: 420 }}>
                    <i className="isax isax-search-normal-1" aria-hidden="true"
                      style={{ position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.55 }} />
                    <input
                      type="search"
                      className="form-control"
                      style={{ paddingInlineStart: 40 }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('adminInvoices.searchPlaceholder', 'Number, name, email or phone')}
                      aria-label={t('adminInvoices.searchPlaceholder', 'Number, name, email or phone')}
                    />
                  </div>
                  <div className="lx-seg" role="group" aria-label={t('adminInvoices.series.label', 'Series')}>
                    {(['', 'MAIN', 'A'] as SeriesFilter[]).map((s) => (
                      <button key={s || 'all'} type="button" aria-pressed={series === s}
                        className={`lx-seg-btn${series === s ? ' is-active' : ''}`}
                        onClick={() => resetPage(setSeries)(s)}>
                        {s === '' ? t('adminInvoices.series.all', 'All') : seriesLabel(s)}
                      </button>
                    ))}
                  </div>
                  <select className="form-select" style={{ width: 'auto', minWidth: 170 }} value={type}
                    aria-label={t('adminInvoices.type.label', 'Type')}
                    onChange={(e) => resetPage(setType)(e.target.value as TypeFilter)}>
                    <option value="">{t('adminInvoices.type.all', 'All types')}</option>
                    <option value="subscription">{t('adminInvoices.type.subscription', 'Subscription')}</option>
                    <option value="course">{t('adminInvoices.type.course', 'Course')}</option>
                    <option value="masterclass">{t('adminInvoices.type.masterclass', 'Masterclass')}</option>
                    <option value="ebook">{t('adminInvoices.type.ebook', 'Ebook')}</option>
                    <option value="manual">{t('adminInvoices.type.manual', 'Direct booking')}</option>
                  </select>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <label className="d-flex align-items-center gap-2 fs-13 text-muted mb-0">
                    {t('adminInvoices.from', 'From')}
                    <input type="date" className="form-control form-control-sm" style={{ width: 'auto' }} value={from}
                      max={to || undefined} onChange={(e) => resetPage(setFrom)(e.target.value)} />
                  </label>
                  <label className="d-flex align-items-center gap-2 fs-13 text-muted mb-0">
                    {t('adminInvoices.to', 'To')}
                    <input type="date" className="form-control form-control-sm" style={{ width: 'auto' }} value={to}
                      min={from || undefined} onChange={(e) => resetPage(setTo)(e.target.value)} />
                  </label>
                  <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => applyRange('thisMonth')}>
                    {t('adminInvoices.range.thisMonth', 'This month')}
                  </button>
                  <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => applyRange('lastMonth')}>
                    {t('adminInvoices.range.lastMonth', 'Last month')}
                  </button>
                  <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => applyRange('thisYear')}>
                    {t('adminInvoices.range.thisYear', 'This year')}
                  </button>
                  {hasFilters && (
                    <button type="button" className="lx-btn lx-btn-sm" onClick={clearFilters}>
                      <i className="isax isax-close-circle" />
                      {t('adminInvoices.range.clear', 'Clear filters')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="lx-card" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }} aria-busy={loading}>
              {rows.length === 0 ? (
                <div className="lx-card-body">
                  <LxEmptyState
                    icon="isax-receipt-2"
                    title={t('adminInvoices.empty.title', 'No invoices found')}
                    text={hasFilters
                      ? t('adminInvoices.empty.filtered', 'No invoice matches these filters.')
                      : t('adminInvoices.empty.text', 'Invoices appear here as soon as a payment succeeds.')}
                  >
                    {hasFilters && (
                      <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={clearFilters}>
                        {t('adminInvoices.range.clear', 'Clear filters')}
                      </button>
                    )}
                  </LxEmptyState>
                </div>
              ) : (
                <>
                  <div className="lx-table-scroll">
                    <table className="lx-table table mb-0">
                      <thead>
                        <tr>
                          <th>{t('adminInvoices.col.number', 'Number')}</th>
                          <th>{t('adminInvoices.col.buyer', 'Buyer')}</th>
                          <th>{t('adminInvoices.col.item', 'Item')}</th>
                          <th>{t('adminInvoices.col.type', 'Type')}</th>
                          <th style={{ textAlign: 'end' }}>{t('adminInvoices.col.ttc', 'Total incl. VAT')}</th>
                          <th><span className="visually-hidden">{t('invoice.download', 'Download invoice')}</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((inv) => (
                          <tr
                            key={inv.id}
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelected(inv)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setSelected(inv); }}
                            aria-label={t('adminInvoices.openDetails', 'Open invoice {{number}}', { number: inv.invoiceNumber })}
                          >
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div dir="ltr" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontWeight: 700, color: 'var(--gl-burg, #651C32)', textAlign: 'start' }}>{inv.invoiceNumber}</div>
                              <div className="text-muted fs-12">{fmtDate(inv.issuedAt)}</div>
                            </td>
                            <td style={{ minWidth: 170 }}>
                              <div className="fw-semibold fs-14" dir="auto">{inv.buyerName || '—'}</div>
                              {contact(inv) && <div className="text-muted fs-12" dir="ltr" style={{ textAlign: 'start' }}>{contact(inv)}</div>}
                            </td>
                            <td className="fs-13" dir="auto"><div title={inv.itemDescription} style={{ maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.itemDescription}</div></td>
                            <td><span className={`lx-badge ${inv.category === 'MANUAL' ? 'badge-gold' : 'badge-slate'}`} style={{ whiteSpace: 'nowrap' }}>{typeLabel(inv.category)}</span></td>
                            <td className="fw-semibold" dir="ltr" style={{ textAlign: 'end', whiteSpace: 'nowrap' }}>{formatMAD(inv.amountTtc, inv.currency)}</td>
                            <td style={{ textAlign: 'end' }}><InvoiceDownloadButton invoiceId={inv.id} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(data?.invoices.totalPages ?? 0) > 1 && (
                    <div className="d-flex justify-content-center" style={{ padding: '16px 24px' }}>
                      <Pagination
                        current={page + 1}
                        total={data?.invoices.totalElements ?? 0}
                        pageSize={PAGE_SIZE}
                        onChange={(p) => setPage(p - 1)}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Invoice details */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        placement={isRtl ? 'left' : 'right'}
        width={Math.min(460, typeof window !== 'undefined' ? window.innerWidth : 460)}
        title={selected?.invoiceNumber}
        footer={selected && (
          <button type="button" className="lx-btn lx-btn-gold w-100 justify-content-center" onClick={downloadSelected}
            disabled={exporting === 'pdf'}>
            <i className="isax isax-document-download" />
            {exporting === 'pdf' ? t('invoice.downloading', 'Preparing your invoice…') : t('adminInvoices.drawer.download', 'Download PDF')}
          </button>
        )}
      >
        {selected && (
          <dl className="mb-0" style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 40%) 1fr', gap: '10px 16px' }}>
            <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.drawer.series', 'Series')}</dt>
            <dd className="mb-0">{seriesLabel(selected.series)}</dd>
            <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.col.date', 'Date')}</dt>
            <dd className="mb-0">{fmtDate(selected.issuedAt, true)}</dd>
            <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.col.buyer', 'Buyer')}</dt>
            <dd className="mb-0">
              <div className="fw-semibold" dir="auto">{selected.buyerName || '—'}</div>
              {selected.buyerEmail && <div className="fs-13 text-muted" dir="ltr" style={{ textAlign: 'start' }}>{selected.buyerEmail}</div>}
              {selected.buyerPhone && <div className="fs-13 text-muted" dir="ltr" style={{ textAlign: 'start' }}>{selected.buyerPhone}</div>}
            </dd>
            <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.col.item', 'Item')}</dt>
            <dd className="mb-0" dir="auto">{selected.itemDescription}</dd>
            <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.col.type', 'Type')}</dt>
            <dd className="mb-0"><span className={`lx-badge ${selected.category === 'MANUAL' ? 'badge-gold' : 'badge-slate'}`}>{typeLabel(selected.category)}</span></dd>
            {selected.paymentMethod && (<>
              <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.drawer.method', 'Payment method')}</dt>
              <dd className="mb-0" dir="auto">{selected.paymentMethod}</dd>
            </>)}
            {selected.orderReference && (<>
              <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.drawer.orderRef', 'Order reference')}</dt>
              <dd className="mb-0" dir="ltr" style={{ textAlign: 'start' }}>{selected.orderReference}</dd>
            </>)}
            {selected.paymentReference && (<>
              <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.drawer.authCode', 'Authorisation code')}</dt>
              <dd className="mb-0" dir="ltr" style={{ textAlign: 'start' }}>{selected.paymentReference}</dd>
            </>)}
            <dt className="text-muted fs-13 fw-normal pt-2" style={{ borderTop: '1px solid rgba(60,20,35,.08)' }}>{t('adminInvoices.stats.ht', 'Total excl. VAT')}</dt>
            <dd className="mb-0 pt-2" dir="ltr" style={{ textAlign: 'end', borderTop: '1px solid rgba(60,20,35,.08)' }}>{formatMAD(selected.amountHt, selected.currency)}</dd>
            <dt className="text-muted fs-13 fw-normal">{t('adminInvoices.drawer.vat', 'VAT {{rate}} %', { rate: Number(selected.vatRate ?? 0) })}</dt>
            <dd className="mb-0" dir="ltr" style={{ textAlign: 'end' }}>{formatMAD(selected.vatAmount, selected.currency)}</dd>
            <dt className="fw-bold">{t('adminInvoices.stats.ttc', 'Total incl. VAT')}</dt>
            <dd className="mb-0 fw-bold" dir="ltr" style={{ textAlign: 'end', color: 'var(--gl-gold-dk, #9A6A14)', fontSize: 18 }}>
              {formatMAD(selected.amountTtc, selected.currency)}
            </dd>
          </dl>
        )}
      </Drawer>
    </LuxuryDashboardLayout>
  );
};

export default AdminInvoices;
