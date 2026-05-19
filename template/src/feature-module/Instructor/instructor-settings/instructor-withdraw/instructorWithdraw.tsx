import React, { useState } from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import InstructorSettingsLink from '../settings-link/instructorSettingsLink';
import { useTranslation } from 'react-i18next';

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
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)';
  },
};

type WithdrawMethod = 'bank' | 'stripe' | 'paypal';

const methods: { key: WithdrawMethod; label: string; icon: string }[] = [
  { key: 'bank', label: 'Bank Transfer', icon: 'isax-bank' },
  { key: 'stripe', label: 'Stripe', icon: 'isax-card' },
  { key: 'paypal', label: 'PayPal', icon: 'isax-wallet-2' },
];

const InstructorWithdraw = () => {
  const { t } = useTranslation();
  const [activeMethod, setActiveMethod] = useState<WithdrawMethod>('bank');

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <InstructorSettingsLink />

      <div className="lx-card">
        <div className="lx-card-header">
          <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
            Select a Withdraw Method
          </h6>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Choose how you would like to receive your earnings
          </p>
        </div>

        <div className="lx-card-body">
          {/* ── Method Tabs ── */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {methods.map((m) => {
              const isActive = activeMethod === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveMethod(m.key)}
                  style={{
                    padding: '14px 20px', borderRadius: 'var(--lx-radius-sm)',
                    border: isActive
                      ? '2px solid rgba(107, 29, 42, 0.25)'
                      : '1.5px solid rgba(107, 29, 42, 0.08)',
                    background: isActive
                      ? 'rgba(107, 29, 42, 0.04)'
                      : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                    minWidth: 170,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: isActive ? 'rgba(107, 29, 42, 0.08)' : 'rgba(107, 29, 42, 0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i
                        className={`isax ${m.icon}`}
                        style={{
                          fontSize: 16,
                          color: isActive ? 'var(--lx-primary)' : 'var(--lx-text-muted)',
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--lx-text)' : 'var(--lx-text-mid)',
                    }}>
                      {m.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--lx-text-muted)', fontWeight: 400 }}>
                    Minimum withdraw $50
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Bank Transfer Form ── */}
          {activeMethod === 'bank' && (
            <form>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16, marginBottom: 24,
              }}>
                <div>
                  <label style={labelStyle}>Account Name <span style={{ color: '#8B2335' }}>*</span></label>
                  <input type="text" style={inputStyle} placeholder="Full account name" {...focusHandlers} />
                </div>
                <div>
                  <label style={labelStyle}>Account Number <span style={{ color: '#8B2335' }}>*</span></label>
                  <input type="text" style={inputStyle} placeholder="Account number" {...focusHandlers} />
                </div>
                <div>
                  <label style={labelStyle}>Bank Name <span style={{ color: '#8B2335' }}>*</span></label>
                  <input type="text" style={inputStyle} placeholder="Bank name" {...focusHandlers} />
                </div>
                <div>
                  <label style={labelStyle}>IBAN <span style={{ color: '#8B2335' }}>*</span></label>
                  <input type="text" style={inputStyle} placeholder="International Bank Account Number" {...focusHandlers} />
                </div>
                <div>
                  <label style={labelStyle}>BIC / SWIFT <span style={{ color: '#8B2335' }}>*</span></label>
                  <input type="text" style={inputStyle} placeholder="BIC or SWIFT code" {...focusHandlers} />
                </div>
              </div>
              <button className="lx-btn lx-btn-gold" type="submit">
                Save Withdrawal Account
              </button>
            </form>
          )}

          {/* ── Stripe Form ── */}
          {activeMethod === 'stripe' && (
            <form>
              <div style={{ maxWidth: 480, marginBottom: 24 }}>
                <label style={labelStyle}>Stripe Email Address <span style={{ color: '#8B2335' }}>*</span></label>
                <input
                  type="email"
                  style={inputStyle}
                  defaultValue="test@example.com"
                  {...focusHandlers}
                />
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.4 }}>
                  We will use this email address to send the money to your Stripe account
                </p>
              </div>
              <button className="lx-btn lx-btn-gold" type="submit">
                Save Withdrawal Account
              </button>
            </form>
          )}

          {/* ── PayPal Form ── */}
          {activeMethod === 'paypal' && (
            <form>
              <div style={{ maxWidth: 480, marginBottom: 24 }}>
                <label style={labelStyle}>PayPal Email Address <span style={{ color: '#8B2335' }}>*</span></label>
                <input
                  type="email"
                  style={inputStyle}
                  defaultValue="test@example.com"
                  {...focusHandlers}
                />
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.4 }}>
                  We will use this email address to send the money to your PayPal account
                </p>
              </div>
              <button className="lx-btn lx-btn-gold" type="submit">
                Save Withdrawal Account
              </button>
            </form>
          )}
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default InstructorWithdraw;
