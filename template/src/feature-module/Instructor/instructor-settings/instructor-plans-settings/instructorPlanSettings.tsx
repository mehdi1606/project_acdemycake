import React, { useState } from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import InstructorSettingsLink from '../settings-link/instructorSettingsLink';
import { useTranslation } from 'react-i18next';

/* ── Shared Styles ─────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
  outline: 'none', background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)', transition: 'border-color 0.2s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--lx-text-mid)', marginBottom: 6,
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)';
  },
};

/* ── Glass Modal Wrapper ──────────────────────────────── */
const GlassModal = ({
  open, onClose, maxWidth = 480, children,
}: {
  open: boolean; onClose: () => void; maxWidth?: number; children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth,
        background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
        borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
        boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
};

/* ── Data ─────────────────────────────────────────────── */
interface Transaction {
  id: string;
  plan: string;
  method: string;
  subscribedOn: string;
  lastDate: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Cancelled';
}

const transactions: Transaction[] = [
  { id: '#INV1245', plan: 'Standard Plan', method: 'Credit Card', subscribedOn: '11 May 2025', lastDate: '14 Jun 2025', amount: '$199', status: 'Paid' },
  { id: '#INV3215', plan: 'Basic Plan', method: 'Debit Card', subscribedOn: '12 Apr 2025', lastDate: '14 May 2025', amount: '$99', status: 'Pending' },
  { id: '#INV4581', plan: 'Premium Plan', method: 'Paypal', subscribedOn: '14 Mar 2025', lastDate: '14 Apr 2025', amount: '$299', status: 'Paid' },
  { id: '#INV6545', plan: 'Basic Plan', method: 'Debit Card', subscribedOn: '13 Feb 2025', lastDate: '13 Mar 2025', amount: '$99', status: 'Cancelled' },
  { id: '#INV6546', plan: 'Basic Plan', method: 'Debit Card', subscribedOn: '12 Feb 2025', lastDate: '12 Mar 2025', amount: '$99', status: 'Cancelled' },
  { id: '#INV5769', plan: 'Standard Plan', method: 'Stripe', subscribedOn: '05 Jan 2025', lastDate: '05 Feb 2025', amount: '$199', status: 'Paid' },
];

const statusBadge: Record<string, string> = {
  Paid: 'badge-success',
  Pending: 'badge-warning',
  Cancelled: 'badge-danger',
};

interface PlanTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  highlight?: boolean;
}

const plans: PlanTier[] = [
  {
    name: 'Basic', price: 99,
    description: 'Ideal for individuals or small teams starting with online education.',
    features: ['10 active courses', 'Basic course creation tools', 'Student progress tracking', '1 GB storage', 'Email notifications', 'Community support'],
  },
  {
    name: 'Standard', price: 199, highlight: true,
    description: 'Ideal for growing institutions that need advanced tools and greater flexibility.',
    features: ['Access to 20 courses', 'Custom course certificates', 'Basic analytics', '10 GB storage', 'Course scheduling', 'Priority email and chat support'],
  },
  {
    name: 'Premium', price: 299,
    description: 'Designed for large-scale learning with robust features and custom branding.',
    features: ['Unlimited courses', 'Advanced course creation tools', 'Detailed student analytics', '100 GB storage', 'Integration with third-party tools', 'Completion certificates'],
  },
];

interface SavedCard {
  type: string;
  brand: string;
  last4: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

const savedCards: SavedCard[] = [
  { type: 'Credit Card', brand: 'Visa', last4: '1568', icon: 'fa-brands fa-cc-visa', color: '#1A1F71', isDefault: true },
  { type: 'Debit Card', brand: 'Mastercard', last4: '1279', icon: 'fa-brands fa-cc-mastercard', color: '#EB001B', isDefault: false },
];

/* ── Component ────────────────────────────────────────── */
const InstructorPlanSettings = () => {
  const { t } = useTranslation();
  const [showPricing, setShowPricing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [showDeleteCard, setShowDeleteCard] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const filteredTransactions = statusFilter === 'All'
    ? transactions
    : transactions.filter((tx) => tx.status === statusFilter);

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <InstructorSettingsLink />

      {/* ── Top Section: Active Plan + Saved Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', gap: 20, marginBottom: 20 }}>

        {/* Active Plan Card */}
        <div className="lx-card">
          <div className="lx-card-body">
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
            }}>
              <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>Active Plan</h6>
              <button
                type="button"
                className="lx-btn lx-btn-sm lx-btn-outline"
                style={{ fontSize: 12, gap: 4, display: 'inline-flex', alignItems: 'center' }}
              >
                <i className="isax isax-document-download" style={{ fontSize: 13 }} />
                Download PDF
              </button>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 0', marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
            }}>
              <div>
                <h6 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
                  Standard Plan
                </h6>
                <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
                  Valid till: May 2025 - Jun 2025
                </span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--lx-primary)' }}>$199</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" style={{ fontSize: 12 }}>
                Cancel Subscription
              </button>
              <button
                type="button"
                className="lx-btn lx-btn-sm lx-btn-gold"
                style={{ fontSize: 12 }}
                onClick={() => setShowPricing(true)}
              >
                Update Plan
              </button>
            </div>
          </div>
        </div>

        {/* Saved Cards */}
        <div className="lx-card">
          <div className="lx-card-body">
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
            }}>
              <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>Saved Cards</h6>
              <button
                type="button"
                className="lx-btn lx-btn-sm lx-btn-gold"
                style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => setShowAddCard(true)}
              >
                <i className="isax isax-add-circle" style={{ fontSize: 14 }} />
                Add New Card
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {savedCards.map((card) => (
                <div
                  key={card.last4}
                  style={{
                    padding: 16, borderRadius: 'var(--lx-radius-sm)',
                    border: card.isDefault
                      ? '1.5px solid rgba(45, 95, 63, 0.2)'
                      : '1.5px solid rgba(107, 29, 42, 0.08)',
                    background: card.isDefault
                      ? 'rgba(45, 95, 63, 0.03)'
                      : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 40, height: 28, borderRadius: 6,
                      background: `${card.color}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${card.color}20`,
                    }}>
                      <i className={card.icon} style={{ fontSize: 18, color: card.color }} />
                    </div>
                    <div>
                      <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>
                        {card.type}
                      </h6>
                      <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
                        {card.brand} **** {card.last4}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {card.isDefault ? (
                      <span className="lx-badge badge-success" style={{ fontSize: 11 }}>Default</span>
                    ) : (
                      <button
                        type="button"
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          fontSize: 12, fontWeight: 500, color: 'var(--lx-primary)',
                          textDecoration: 'underline',
                        }}
                      >
                        Set as Default
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setShowEditCard(true)}
                        style={{
                          background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                          color: 'var(--lx-text-muted)', fontSize: 15, transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lx-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--lx-text-muted)'; }}
                      >
                        <i className="isax isax-edit" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteCard(true)}
                        style={{
                          background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                          color: 'var(--lx-text-muted)', fontSize: 15, transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#8B2335'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--lx-text-muted)'; }}
                      >
                        <i className="isax isax-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="lx-card">
        <div className="lx-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
            Transaction History
          </h6>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="lx-btn lx-btn-sm lx-btn-outline"
              style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              {statusFilter === 'All' ? 'Status' : statusFilter}
              <i className="isax isax-arrow-down-1" style={{ fontSize: 12 }} />
            </button>
            {showStatusDropdown && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 10,
                background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)',
                borderRadius: 'var(--lx-radius-sm)', border: '1px solid rgba(107, 29, 42, 0.1)',
                boxShadow: '0 8px 24px rgba(44, 24, 16, 0.1)', minWidth: 130, overflow: 'hidden',
              }}>
                {['All', 'Paid', 'Pending', 'Cancelled'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: statusFilter === s ? 600 : 400,
                      color: statusFilter === s ? 'var(--lx-primary)' : 'var(--lx-text)',
                      background: statusFilter === s ? 'rgba(107, 29, 42, 0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 29, 42, 0.04)'; }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = statusFilter === s ? 'rgba(107, 29, 42, 0.04)' : 'transparent';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="lx-card-body" style={{ padding: 0 }}>
          <div className="lx-table" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Plan Name</th>
                  <th>Payment Method</th>
                  <th>Subscribed On</th>
                  <th>Last Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => setShowInvoice(true)}
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          color: 'var(--lx-primary)', fontWeight: 600, fontSize: 13,
                        }}
                      >
                        {tx.id}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setShowPricing(true)}
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          color: 'var(--lx-text)', fontWeight: 600, fontSize: 13,
                        }}
                      >
                        {tx.plan}
                      </button>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>{tx.method}</td>
                    <td style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>{tx.subscribedOn}</td>
                    <td style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>{tx.lastDate}</td>
                    <td style={{ fontSize: 14, fontWeight: 700, color: 'var(--lx-text)' }}>{tx.amount}</td>
                    <td>
                      <span className={`lx-badge ${statusBadge[tx.status]}`}>{tx.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setShowInvoice(true)}
                          style={{
                            background: 'rgba(107, 29, 42, 0.05)', border: 'none', borderRadius: 6,
                            width: 30, height: 30, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--lx-text-muted)', fontSize: 15, transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(107, 29, 42, 0.1)';
                            e.currentTarget.style.color = 'var(--lx-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(107, 29, 42, 0.05)';
                            e.currentTarget.style.color = 'var(--lx-text-muted)';
                          }}
                        >
                          <i className="isax isax-eye" />
                        </button>
                        <button
                          type="button"
                          style={{
                            background: 'rgba(107, 29, 42, 0.05)', border: 'none', borderRadius: 6,
                            width: 30, height: 30, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--lx-text-muted)', fontSize: 15, transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(107, 29, 42, 0.1)';
                            e.currentTarget.style.color = 'var(--lx-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(107, 29, 42, 0.05)';
                            e.currentTarget.style.color = 'var(--lx-text-muted)';
                          }}
                        >
                          <i className="isax isax-import" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL: Pricing Plan ── */}
      <GlassModal open={showPricing} onClose={() => setShowPricing(false)} maxWidth={920}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Pricing Plan</h5>
          <button type="button" onClick={() => setShowPricing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--lx-text-muted)', padding: 4 }}>
            <i className="isax isax-close-circle" />
          </button>
        </div>
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Monthly / Annual Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ fontSize: 14, fontWeight: isAnnual ? 400 : 600, color: isAnnual ? 'var(--lx-text-muted)' : 'var(--lx-text)' }}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              style={{
                width: 44, height: 24, borderRadius: 12, padding: 2,
                border: 'none', cursor: 'pointer', flexShrink: 0,
                background: isAnnual ? 'var(--lx-primary)' : 'rgba(107, 29, 42, 0.12)',
                transition: 'background 0.2s ease',
                display: 'flex', alignItems: 'center',
                justifyContent: isAnnual ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'all 0.2s ease',
              }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: isAnnual ? 600 : 400, color: isAnnual ? 'var(--lx-text)' : 'var(--lx-text-muted)' }}>
              Annually
            </span>
          </div>

          {/* Plan Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  padding: 24, borderRadius: 'var(--lx-radius-sm)',
                  border: plan.highlight
                    ? '2px solid rgba(107, 29, 42, 0.2)'
                    : '1.5px solid rgba(107, 29, 42, 0.08)',
                  background: plan.highlight
                    ? 'rgba(107, 29, 42, 0.03)'
                    : 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <h6 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
                  {plan.name}
                </h6>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--lx-primary)', verticalAlign: 'top' }}>$</span>
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--lx-primary)', lineHeight: 1 }}>
                    {isAnnual ? Math.round(plan.price * 10) : plan.price}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', marginLeft: 4 }}>
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.5 }}>
                  {plan.description}
                </p>

                <div style={{ borderTop: '1px solid rgba(107, 29, 42, 0.06)', paddingTop: 16, marginBottom: 16, flex: 1 }}>
                  {plan.features.map((feat) => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(45, 95, 63, 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="isax isax-tick-circle" style={{ fontSize: 11, color: '#2D5F3F' }} />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className={plan.highlight ? 'lx-btn lx-btn-gold' : 'lx-btn lx-btn-outline'}
                  style={{ width: '100%', fontSize: 13, marginTop: 'auto' }}
                  onClick={() => setShowPricing(false)}
                >
                  Choose Plan
                  <i className="isax isax-arrow-right-3" style={{ fontSize: 12, marginLeft: 6 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </GlassModal>

      {/* ── MODAL: View Invoice ── */}
      <GlassModal open={showInvoice} onClose={() => setShowInvoice(false)} maxWidth={720}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Invoice</h5>
          <button type="button" onClick={() => setShowInvoice(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--lx-text-muted)', padding: 4 }}>
            <i className="isax isax-close-circle" />
          </button>
        </div>
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(107, 29, 42, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
              }}>
                <i className="isax isax-receipt-item" style={{ fontSize: 22, color: 'var(--lx-primary)' }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                3099 Kennedy Court Framingham, MA 01702
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h6 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--lx-primary)' }}>#OI0010</h6>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
                Created: <span style={{ fontWeight: 600, color: 'var(--lx-text)' }}>Aug 25, 2025</span>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                Due: <span style={{ fontWeight: 600, color: 'var(--lx-text)' }}>Aug 30, 2025</span>
              </p>
            </div>
          </div>

          {/* From / To */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 20,
            paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lx-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'block' }}>From</span>
              <h6 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>Thomas Lawler</h6>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--lx-text-muted)' }}>2077 Chicago Avenue Orosi, CA 93647</p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--lx-text-muted)' }}>thomaslawler@example.com</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>+1 987 654 3210</p>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lx-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'block' }}>To</span>
              <h6 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>Ronald Richard</h6>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--lx-text-muted)' }}>3103 Trainer Avenue Peoria, IL 61602</p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--lx-text-muted)' }}>adre3@example.com</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>+1 987 471 6589</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lx-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'block' }}>Status</span>
              <span className="lx-badge badge-success">Completed</span>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="lx-table" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Description</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th style={{ textAlign: 'right' }}>Discount</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--lx-text)' }}>Basic Plan</td>
                  <td style={{ textAlign: 'center', color: 'var(--lx-text-mid)' }}>1</td>
                  <td style={{ textAlign: 'right', color: 'var(--lx-text-mid)' }}>$120</td>
                  <td style={{ textAlign: 'right', color: 'var(--lx-text-mid)' }}>$0</td>
                  <td style={{ textAlign: 'right', color: 'var(--lx-text-mid)' }}>$120</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
          }}>
            <div style={{ width: 260 }}>
              {[
                { label: 'Sub Total', value: '$120' },
                { label: 'Discount (0%)', value: '$0' },
                { label: 'VAT (5%)', value: '$0' },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                  borderBottom: '1px solid rgba(107, 29, 42, 0.04)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lx-text)' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--lx-text)' }}>Total Amount</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--lx-primary)' }}>$120</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--lx-text-muted)' }}>
                Amount in Words: Dollar One Hundred Twenty
              </p>
            </div>
          </div>

          {/* Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24 }}>
            <div>
              <h6 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>Notes</h6>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
                Invoice for course purchase, covering course fee.
              </p>
              <h6 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>Terms and Conditions</h6>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                Full payment grants non-transferable access to the course.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h6 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>Ted M. Davis</h6>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>Assistant Manager</p>
            </div>
          </div>
        </div>
      </GlassModal>

      {/* ── MODAL: Add New Card ── */}
      <GlassModal open={showAddCard} onClose={() => setShowAddCard(false)} maxWidth={480}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Add New Card</h5>
          <button type="button" onClick={() => setShowAddCard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--lx-text-muted)', padding: 4 }}>
            <i className="isax isax-close-circle" />
          </button>
        </div>
        <form>
          <div style={{ padding: '20px 28px' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Payment Method <span style={{ color: '#8B2335' }}>*</span></label>
              <select style={inputStyle}>
                <option value="">Select</option>
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Card Number <span style={{ color: '#8B2335' }}>*</span></label>
              <input type="text" style={inputStyle} placeholder="0000 0000 0000 0000" {...focusHandlers} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Expiration Date <span style={{ color: '#8B2335' }}>*</span></label>
                <input type="text" style={inputStyle} placeholder="MM/YY" {...focusHandlers} />
              </div>
              <div>
                <label style={labelStyle}>CVV <span style={{ color: '#8B2335' }}>*</span></label>
                <input type="text" style={inputStyle} placeholder="***" {...focusHandlers} />
              </div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>Name on Card <span style={{ color: '#8B2335' }}>*</span></label>
              <input type="text" style={inputStyle} placeholder="Cardholder name" {...focusHandlers} />
            </div>
          </div>
          <div style={{
            padding: '16px 28px', borderTop: '1px solid rgba(107, 29, 42, 0.06)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowAddCard(false)}>
              Cancel
            </button>
            <button type="button" className="lx-btn lx-btn-gold" onClick={() => setShowAddCard(false)}>
              Add Card
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── MODAL: Edit Card ── */}
      <GlassModal open={showEditCard} onClose={() => setShowEditCard(false)} maxWidth={480}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Edit Card</h5>
          <button type="button" onClick={() => setShowEditCard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--lx-text-muted)', padding: 4 }}>
            <i className="isax isax-close-circle" />
          </button>
        </div>
        <form>
          <div style={{ padding: '20px 28px' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Payment Method <span style={{ color: '#8B2335' }}>*</span></label>
              <select style={inputStyle} defaultValue="credit">
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Card Number <span style={{ color: '#8B2335' }}>*</span></label>
              <input type="text" style={inputStyle} defaultValue="9834 7923 4098 1568" {...focusHandlers} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Expiration Date <span style={{ color: '#8B2335' }}>*</span></label>
                <input type="text" style={inputStyle} placeholder="MM/YY" {...focusHandlers} />
              </div>
              <div>
                <label style={labelStyle}>CVV <span style={{ color: '#8B2335' }}>*</span></label>
                <input type="text" style={inputStyle} defaultValue="725" {...focusHandlers} />
              </div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>Name on Card <span style={{ color: '#8B2335' }}>*</span></label>
              <input type="text" style={inputStyle} defaultValue="Eugene Andre" {...focusHandlers} />
            </div>
          </div>
          <div style={{
            padding: '16px 28px', borderTop: '1px solid rgba(107, 29, 42, 0.06)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowEditCard(false)}>
              Cancel
            </button>
            <button type="button" className="lx-btn lx-btn-gold" onClick={() => setShowEditCard(false)}>
              Save Changes
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── MODAL: Delete Card ── */}
      <GlassModal open={showDeleteCard} onClose={() => setShowDeleteCard(false)} maxWidth={420}>
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(139, 35, 53, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
          </div>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>Delete Card?</h5>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
            Are you sure you want to delete this card? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowDeleteCard(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="lx-btn"
              style={{
                background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335',
                border: '1.5px solid rgba(139, 35, 53, 0.15)',
              }}
              onClick={() => setShowDeleteCard(false)}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </GlassModal>
    </LuxuryDashboardLayout>
  );
};

export default InstructorPlanSettings;
