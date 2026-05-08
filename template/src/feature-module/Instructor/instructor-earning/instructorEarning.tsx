import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import ReactApexChart from 'react-apexcharts';
import instructorService from '../../../services/api/instructor.service';
import {
  InstructorEarning as EarningItem,
  EarningsSummary,
  Payout,
  PayoutRequest,
} from '../../../services/api/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'earnings' | 'payouts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val?: number | null, currency = 'MAD') => {
  if (val == null) return '0.00 ' + currency
  return Number(val).toFixed(2) + ' ' + currency
}

const fmtDate = (str?: string) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const sourceLabel = (type?: string) =>
  type === 'COURSE_PURCHASE' ? 'Course Sale' : type === 'SUBSCRIPTION_SHARE' ? 'Subscription' : type ?? '—'

// ─── Payout Form Fields ──────────────────────────────────────────────────────

interface PayoutFormProps {
  form: PayoutRequest
  pending: number
  onChange: (field: keyof PayoutRequest, value: string | number) => void
}

const PayoutFormFields = ({ form, pending, onChange }: PayoutFormProps) => (
  <>
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
        Amount <span style={{ color: '#8B2335' }}>*</span>
      </label>
      <div className="d-flex">
        <input
          type="number"
          placeholder="0.00"
          min="1"
          max={pending}
          step="0.01"
          value={form.amount || ''}
          onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1.5px solid rgba(107, 29, 42, 0.12)',
            borderRadius: 'var(--lx-radius-sm) 0 0 var(--lx-radius-sm)',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
            color: 'var(--lx-text)',
          }}
        />
        <span
          style={{
            padding: '10px 14px',
            background: 'rgba(107, 29, 42, 0.04)',
            border: '1.5px solid rgba(107, 29, 42, 0.12)',
            borderLeft: 'none',
            borderRadius: '0 var(--lx-radius-sm) var(--lx-radius-sm) 0',
            fontSize: 13,
            color: 'var(--lx-text-mid)',
            fontWeight: 600,
          }}
        >
          MAD
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginTop: 4 }}>
        Available: <strong style={{ color: 'var(--lx-green)' }}>{fmt(pending)}</strong>
      </p>
    </div>

    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
        Payment Method <span style={{ color: '#8B2335' }}>*</span>
      </label>
      <select
        value={form.paymentMethod}
        onChange={(e) => onChange('paymentMethod', e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1.5px solid rgba(107, 29, 42, 0.12)',
          borderRadius: 'var(--lx-radius-sm)',
          fontSize: 14,
          outline: 'none',
          background: 'rgba(255,255,255,0.6)',
          color: 'var(--lx-text)',
        }}
      >
        <option value="">— Select method —</option>
        <option value="BANK_TRANSFER">Bank Transfer</option>
        <option value="PAYPAL">PayPal</option>
        <option value="CASH">Cash</option>
        <option value="OTHER">Other</option>
      </select>
    </div>

    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
        Bank / Account Info <span style={{ color: '#8B2335' }}>*</span>
      </label>
      <textarea
        rows={3}
        placeholder="IBAN, account number, PayPal email, etc."
        value={form.bankAccountInfo}
        onChange={(e) => onChange('bankAccountInfo', e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1.5px solid rgba(107, 29, 42, 0.12)',
          borderRadius: 'var(--lx-radius-sm)',
          fontSize: 14,
          outline: 'none',
          background: 'rgba(255,255,255,0.6)',
          color: 'var(--lx-text)',
          resize: 'vertical',
        }}
      />
    </div>

    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
        Notes (optional)
      </label>
      <textarea
        rows={2}
        placeholder="Any additional notes for the admin…"
        value={form.notes ?? ''}
        onChange={(e) => onChange('notes', e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1.5px solid rgba(107, 29, 42, 0.12)',
          borderRadius: 'var(--lx-radius-sm)',
          fontSize: 14,
          outline: 'none',
          background: 'rgba(255,255,255,0.6)',
          color: 'var(--lx-text)',
          resize: 'vertical',
        }}
      />
    </div>
  </>
)

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status?: string }) => {
  const map: Record<string, string> = {
    PENDING:    'badge-warning',
    PAID:       'badge-success',
    CANCELLED:  'badge-danger',
    REQUESTED:  'badge-info',
    PROCESSING: 'badge-slate',
    COMPLETED:  'badge-success',
    REJECTED:   'badge-danger',
  }
  const cls = map[status ?? ''] ?? 'badge-info'
  return <span className={`lx-badge ${cls}`}>{status ?? '—'}</span>
}

// ─── Component ────────────────────────────────────────────────────────────────

const InstructorEarning = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('earnings')

  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [earnings, setEarnings] = useState<EarningItem[]>([])
  const [earningsLoading, setEarningsLoading] = useState(true)
  const [earningsError, setEarningsError] = useState<string | null>(null)
  const [ePage, setEPage] = useState(0)
  const [eTotalPages, setETotalPages] = useState(0)
  const [eTotalElements, setETotalElements] = useState(0)
  const pageSize = 15

  const [payouts, setPayouts] = useState<Payout[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [payoutsError, setPayoutsError] = useState<string | null>(null)
  const [pPage, setPPage] = useState(0)
  const [pTotalPages, setPTotalPages] = useState(0)
  const [pTotalElements, setPTotalElements] = useState(0)

  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutForm, setPayoutForm] = useState<PayoutRequest>({
    amount: 0,
    paymentMethod: '',
    bankAccountInfo: '',
    notes: '',
  })
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutSuccess, setPayoutSuccess] = useState(false)

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      const data = await instructorService.getEarningsSummary()
      setSummary(data)
    } catch (err) {
      console.error('Failed to load earnings summary:', err)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const fetchEarnings = useCallback(async (page: number) => {
    try {
      setEarningsLoading(true)
      setEarningsError(null)
      const data = await instructorService.getEarnings(page, pageSize)
      setEarnings(Array.isArray(data?.content) ? data.content : [])
      setETotalPages(data?.totalPages ?? 0)
      setETotalElements(data?.totalElements ?? 0)
      setEPage(data?.number ?? page)
    } catch (err) {
      console.error('Failed to load earnings:', err)
      setEarningsError('Failed to load earnings. Please try again.')
    } finally {
      setEarningsLoading(false)
    }
  }, [])

  const fetchPayouts = useCallback(async (page: number) => {
    try {
      setPayoutsLoading(true)
      setPayoutsError(null)
      const data = await instructorService.getPayouts(page, 10)
      setPayouts(Array.isArray(data?.content) ? data.content : [])
      setPTotalPages(data?.totalPages ?? 0)
      setPTotalElements(data?.totalElements ?? 0)
      setPPage(data?.number ?? page)
    } catch (err) {
      console.error('Failed to load payouts:', err)
      setPayoutsError('Failed to load payout history. Please try again.')
    } finally {
      setPayoutsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    fetchEarnings(0)
  }, [fetchSummary, fetchEarnings])

  useEffect(() => {
    if (activeTab === 'payouts') fetchPayouts(0)
  }, [activeTab, fetchPayouts])

  // ── Chart config ───────────────────────────────────────────────────────────
  const chartLabels = (summary?.monthlyBreakdown ?? []).map((m) => m.month)
  const chartValues = (summary?.monthlyBreakdown ?? []).map((m) => Number(m.amount))

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', height: 280, toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#6B1D2A'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, gradientToColors: ['#E8A0A8'] },
    },
    xaxis: {
      categories: chartLabels.length ? chartLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { fontSize: '11px', colors: 'var(--lx-text-muted)' } },
    },
    yaxis: {
      labels: {
        formatter: (val) => (val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val.toFixed(0)),
        style: { colors: 'var(--lx-text-muted)' },
      },
    },
    tooltip: { y: { formatter: (val) => val.toFixed(2) + ' MAD' } },
    grid: { borderColor: 'rgba(101,28,50,0.08)' },
  }

  const chartSeries = [{ name: 'Net Earnings (MAD)', data: chartValues.length ? chartValues : [] }]

  // ── Payout form helpers ──────────────────────────────────────────────────
  const updatePayoutForm = useCallback(
    (field: keyof PayoutRequest, value: string | number) => {
      setPayoutForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const openPayoutModal = () => {
    setPayoutForm({ amount: 0, paymentMethod: '', bankAccountInfo: '', notes: '' })
    setPayoutError(null)
    setPayoutSuccess(false)
    setShowPayoutModal(true)
  }

  const closePayoutModal = () => setShowPayoutModal(false)

  const submitPayout = async () => {
    if (!payoutForm.amount || payoutForm.amount <= 0) {
      setPayoutError('Please enter a valid amount.')
      return
    }
    if (!payoutForm.paymentMethod) {
      setPayoutError('Please select a payment method.')
      return
    }
    if (!payoutForm.bankAccountInfo.trim()) {
      setPayoutError('Please enter your bank / account info.')
      return
    }

    setPayoutSubmitting(true)
    setPayoutError(null)
    try {
      await instructorService.requestPayout(payoutForm)
      setPayoutSuccess(true)
      await fetchSummary()
      await fetchPayouts(0)
      setTimeout(() => {
        closePayoutModal()
        setActiveTab('payouts')
      }, 1500)
    } catch (err: any) {
      setPayoutError(err?.message ?? 'Failed to submit payout request.')
    } finally {
      setPayoutSubmitting(false)
    }
  }

  // ── Render pagination ──────────────────────────────────────────────────────
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalElements: number,
    label: string,
    onPageChange: (page: number) => void,
  ) => {
    if (totalPages <= 1) return null
    return (
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ padding: '16px 0 0' }}>
        <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>
          Page {currentPage + 1} of {totalPages} · {totalElements} {label}
        </p>
        <div className="d-flex gap-1">
          <button
            className="lx-btn lx-btn-outline lx-btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
          >
            <i className="isax isax-arrow-left-2" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`lx-btn lx-btn-sm ${i === currentPage ? 'lx-btn-gold' : 'lx-btn-outline'}`}
              onClick={() => onPageChange(i)}
              style={{ minWidth: 36, justifyContent: 'center' }}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="lx-btn lx-btn-outline lx-btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            style={{ opacity: currentPage === totalPages - 1 ? 0.4 : 1 }}
          >
            <i className="isax isax-arrow-right-3" />
          </button>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LuxuryDashboardLayout>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>Earnings</h5>
        <button
          className="lx-btn lx-btn-gold lx-btn-sm"
          onClick={openPayoutModal}
          disabled={summaryLoading || (summary?.pendingEarnings ?? 0) <= 0}
        >
          <i className="isax isax-money-send" />
          Request Payout
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="row g-4 mb-4">
        {[
          { label: 'Total Earnings', value: fmt(summary?.totalEarnings), sub: 'All-time net',       icon: 'isax isax-dollar-circle', color: 'sage' },
          { label: 'Pending Payout', value: fmt(summary?.pendingEarnings), sub: 'Awaiting payout',  icon: 'isax isax-clock',          color: 'amber' },
          { label: 'This Month',     value: fmt(summary?.monthlyEarnings), sub: 'Current month',    icon: 'isax isax-calendar-tick',  color: 'slate' },
          { label: 'Total Paid Out', value: fmt(summary?.totalPaidOut), sub: 'Completed payouts',   icon: 'isax isax-tick-circle',    color: 'gold' },
        ].map((s, i) => (
          <div key={i} className="col-xxl-3 col-lg-6 col-md-6">
            <div className="lx-stat-card">
              <div className={`stat-icon ${s.color}`}>
                <i className={s.icon} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{s.label}</p>
                {summaryLoading ? (
                  <div style={{ height: 24, width: 80, borderRadius: 6, background: 'rgba(107, 29, 42, 0.06)', animation: 'pulse 1.5s infinite' }} />
                ) : (
                  <h3 className="stat-value" style={{ fontSize: 18 }}>{s.value}</h3>
                )}
                <p style={{ fontSize: 11, color: 'var(--lx-text-muted)', margin: 0 }}>{s.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="lx-card mb-4">
        <div className="lx-card-header">
          <h6>Earnings — Last 12 Months</h6>
          <span className="lx-badge badge-info">Net earnings (MAD)</span>
        </div>
        <div className="lx-card-body">
          {summaryLoading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ height: 280 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={280}
            />
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="lx-card">
        <div className="lx-card-header">
          <div className="d-flex gap-2">
            {(['earnings', 'payouts'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`lx-btn lx-btn-sm ${activeTab === tab ? '' : 'lx-btn-outline'}`}
                style={activeTab === tab ? {
                  background: 'var(--lx-primary)',
                  color: '#fff',
                  border: '1.5px solid var(--lx-primary)',
                } : {}}
              >
                <i className={tab === 'earnings' ? 'isax isax-dollar-circle' : 'isax isax-money-send'} />
                {tab === 'earnings' ? 'Transactions' : 'Payout History'}
                {tab === 'earnings' && !earningsLoading && eTotalElements > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'rgba(107, 29, 42, 0.08)',
                      padding: '1px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {eTotalElements}
                  </span>
                )}
                {tab === 'payouts' && !payoutsLoading && pTotalElements > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'rgba(107, 29, 42, 0.08)',
                      padding: '1px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {pTotalElements}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lx-card-body">
          {/* ── Transactions tab ── */}
          {activeTab === 'earnings' && (
            <>
              {earningsError && (
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
                  <i className="isax isax-warning-2" />{earningsError}
                </div>
              )}

              {earningsLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading transactions…</p>
                </div>
              ) : earnings.length === 0 ? (
                <div className="lx-empty-state">
                  <div className="empty-icon"><i className="isax isax-dollar-circle" /></div>
                  <h6>No earnings yet.</h6>
                  <p>Earnings are created automatically when students enrol in your courses.</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="lx-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th style={{ textAlign: 'right' }}>Gross</th>
                          <th style={{ textAlign: 'right' }}>Platform Fee</th>
                          <th style={{ textAlign: 'right' }}>Net</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.map((e) => (
                          <tr key={e.id}>
                            <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{fmtDate(e.createdAt)}</td>
                            <td>
                              <span className="lx-badge badge-info" style={{ fontSize: 11 }}>
                                {sourceLabel(e.sourceType)}
                              </span>
                            </td>
                            <td style={{ fontSize: 14, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {e.description ?? '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 14 }}>{Number(e.amount).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontSize: 14, color: '#8B2335' }}>
                              -{Number(e.platformFee).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--lx-green)' }}>
                              {Number(e.netAmount).toFixed(2)}
                            </td>
                            <td><StatusBadge status={e.payoutStatus} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(ePage, eTotalPages, eTotalElements, 'transactions', fetchEarnings)}
                </>
              )}
            </>
          )}

          {/* ── Payout history tab ── */}
          {activeTab === 'payouts' && (
            <>
              {payoutsError && (
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
                  <i className="isax isax-warning-2" />{payoutsError}
                </div>
              )}

              {payoutsLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading payouts…</p>
                </div>
              ) : payouts.length === 0 ? (
                <div className="lx-empty-state">
                  <div className="empty-icon"><i className="isax isax-money-send" /></div>
                  <h6>No payout requests yet.</h6>
                  <p>Click <strong>"Request Payout"</strong> above to withdraw your earnings.</p>
                  <button
                    className="lx-btn lx-btn-gold lx-btn-sm"
                    onClick={openPayoutModal}
                    disabled={(summary?.pendingEarnings ?? 0) <= 0}
                  >
                    <i className="isax isax-money-send" />
                    Request Payout
                  </button>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="lx-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th>Method</th>
                          <th>Reference</th>
                          <th>Status</th>
                          <th>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((p) => (
                          <tr key={p.id}>
                            <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{fmtDate(p.createdAt)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 14 }}>
                              {Number(p.amount).toFixed(2)} {p.currency}
                            </td>
                            <td style={{ fontSize: 13 }}>{p.paymentMethod ?? '—'}</td>
                            <td>
                              {p.transactionReference ? (
                                <code style={{ fontSize: 12, background: 'rgba(107, 29, 42, 0.04)', padding: '2px 8px', borderRadius: 4 }}>
                                  {p.transactionReference}
                                </code>
                              ) : (
                                <span style={{ color: 'var(--lx-text-muted)' }}>—</span>
                              )}
                            </td>
                            <td><StatusBadge status={p.status} /></td>
                            <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{fmtDate(p.completedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(pPage, pTotalPages, pTotalElements, 'payouts', fetchPayouts)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Request Payout Modal ── */}
      {showPayoutModal && (
        <>
          <div
            onClick={closePayoutModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(44, 24, 16, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 1040,
            }}
          />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderRadius: 'var(--lx-radius-lg)',
                border: '1px solid rgba(107, 29, 42, 0.1)',
                boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Modal header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0, fontSize: 16 }}>Request Payout</h5>
                <button
                  onClick={closePayoutModal}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--lx-text-muted)', fontSize: 20 }}
                >
                  <i className="isax isax-close-circle" />
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: 24 }}>
                {payoutSuccess ? (
                  <div className="text-center" style={{ padding: '24px 0' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'rgba(45, 95, 63, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <i className="isax isax-tick-circle" style={{ fontSize: 28, color: 'var(--lx-green)' }} />
                    </div>
                    <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 8 }}>Payout Requested!</h5>
                    <p style={{ color: 'var(--lx-text-muted)', fontSize: 14 }}>
                      Your payout request has been submitted. The admin will process it shortly.
                    </p>
                  </div>
                ) : (
                  <>
                    {payoutError && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--lx-radius-sm)',
                          background: 'rgba(139, 35, 53, 0.06)',
                          border: '1px solid rgba(139, 35, 53, 0.12)',
                          color: '#8B2335',
                          fontSize: 13,
                          marginBottom: 16,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <i className="isax isax-warning-2" />{payoutError}
                      </div>
                    )}
                    <PayoutFormFields
                      form={payoutForm}
                      pending={summary?.pendingEarnings ?? 0}
                      onChange={updatePayoutForm}
                    />
                  </>
                )}
              </div>

              {/* Modal footer */}
              {!payoutSuccess && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    className="lx-btn lx-btn-outline"
                    onClick={closePayoutModal}
                    disabled={payoutSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="lx-btn lx-btn-gold"
                    onClick={submitPayout}
                    disabled={payoutSubmitting}
                  >
                    {payoutSubmitting ? (
                      <>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <i className="isax isax-money-send" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorEarning
