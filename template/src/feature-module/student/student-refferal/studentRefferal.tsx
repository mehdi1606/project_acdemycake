import React, { useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { useAppSelector } from '../../../core/redux/hooks';

const StudentRefferal: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const statCards = [
    { label: 'Net Earnings', value: '$0', sub: 'Earning this month', icon: 'isax-dollar-circle', color: '#2D5F3F', bg: 'rgba(45, 95, 63, 0.08)' },
    { label: 'Balance', value: '$0', sub: 'In the Wallet', icon: 'isax-wallet-2', color: 'var(--lx-primary)', bg: 'rgba(107, 29, 42, 0.06)' },
    { label: 'No of Referrals', value: '0', sub: 'In this month', icon: 'isax-people', color: '#C5973E', bg: 'rgba(197, 151, 62, 0.08)' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid rgba(107, 29, 42, 0.12)',
    borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
    outline: 'none', background: 'rgba(255,255,255,0.6)',
    color: 'var(--lx-text)',
  };

  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div className="lx-section-header" style={{ marginBottom: 24 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Referrals</h5>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            className="lx-stat-card"
            style={{ background: card.bg }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--lx-radius-sm)',
                background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`isax ${card.icon}`} style={{ fontSize: 22, color: card.color }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--lx-text-muted)', fontWeight: 500 }}>{card.label}</p>
                <h4 style={{ margin: '2px 0', fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--lx-text-muted)' }}>{card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Link & Withdraw */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Referral Link */}
        <div className="lx-card">
          <div className="lx-card-body">
            <h5 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>Your Referral Link</h5>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
              You can earn easily money by copying and sharing
            </p>
            <input
              type="text"
              style={{ ...inputStyle, marginBottom: 14, background: 'rgba(107, 29, 42, 0.03)' }}
              defaultValue={`https://SARALOWEcourse.com/refer/?refid=${referralCode}`}
              readOnly
            />
            <button
              className="lx-btn lx-btn-gold lx-btn-sm"
              onClick={() => navigator.clipboard.writeText(`https://SARALOWEcourse.com/refer/?refid=${referralCode}`)}
            >
              Copy link
            </button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="lx-card">
          <div className="lx-card-body">
            <h5 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>Withdraw Money</h5>
            <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 13, color: 'var(--lx-text-mid)', lineHeight: 1.8 }}>
              <li>Withdraw securely to your bank account.</li>
              <li>Commission is $25 per transaction under $10,000</li>
            </ul>
            <button
              className="lx-btn lx-btn-gold lx-btn-sm"
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw Money
            </button>
          </div>
        </div>
      </div>

      {/* Referral Table */}
      <div className="lx-card">
        <div className="lx-card-header">
          <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>Referral History</h6>
        </div>
        <div className="lx-card-body" style={{ padding: 0 }}>
          <div className="lx-empty-state">
            <span className="empty-icon"><i className="isax isax-people" style={{ fontSize: 28 }} /></span>
            <p>No referrals found yet.</p>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowWithdrawModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 460,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Withdrawal Request</h5>
              <button onClick={() => setShowWithdrawModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {/* Balance Info */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
                padding: '14px 16px', borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(107, 29, 42, 0.03)', border: '1px solid rgba(107, 29, 42, 0.06)',
              }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--lx-text-muted)' }}>Withdrawal Balance</p>
                  <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>$0</h6>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--lx-text-muted)' }}>Selected</p>
                  <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>PayPal</h6>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                  Amount <span style={{ color: '#8B2335' }}>*</span>
                </label>
                <input type="number" style={inputStyle} placeholder="$" />
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--lx-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="isax isax-info-circle" /> Minimum withdraw amount is $50
                </p>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
              <button type="button" className="lx-btn lx-btn-gold" onClick={() => setShowWithdrawModal(false)}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentRefferal;
