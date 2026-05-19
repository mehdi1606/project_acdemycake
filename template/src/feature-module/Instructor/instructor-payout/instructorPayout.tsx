import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { useTranslation } from 'react-i18next';
import { instructorService } from '../../../services/api/instructor.service';
import { InstructorDashboard as InstructorDashboardType } from '../../../services/api/types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)',
  fontSize: 14,
  outline: 'none',
  background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)',
};

const InstructorPayout = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<InstructorDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'bank'>('paypal');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await instructorService.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load payout data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <LuxuryDashboardLayout>
      {/* Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 24,
        borderRadius: 'var(--lx-radius-sm)', background: 'rgba(197, 151, 62, 0.08)',
        border: '1px solid rgba(197, 151, 62, 0.15)',
      }}>
        <i className="isax isax-information" style={{ color: '#C5973E', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--lx-text-mid)', flex: 1 }}>
          Set up your payout method to receive earnings directly to your account.
        </span>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Top Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, marginBottom: 32 }}>
            {/* Earnings Card */}
            <div style={{
              padding: 24, borderRadius: 'var(--lx-radius-lg)',
              background: 'linear-gradient(135deg, var(--lx-primary) 0%, #4E1420 100%)',
              color: '#fff', display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-wallet-money" style={{ fontSize: 24 }} />
              </div>
              <div style={{ flex: 1 }}>
                <h6 style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.8 }}>Pending Payout Balance</h6>
                <h4 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>
                  ${dashboardData?.pendingPayout?.toFixed(2) ?? '0.00'}
                </h4>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                  Total Earnings: ${dashboardData?.totalEarnings?.toFixed(2) ?? '0.00'}
                </p>
              </div>
              <button className="lx-btn" onClick={() => setShowWithdraw(true)} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                Withdraw
              </button>
            </div>

            {/* Payment Method */}
            <div>
              <h6 style={{ fontSize: 14, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 12 }}>Select Payment Gateway for Payout</h6>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'paypal' as const, label: 'PayPal', icon: 'isax-card' },
                  { key: 'bank' as const, label: 'Bank Transfer', icon: 'isax-bank' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key)}
                    style={{
                      padding: '14px 16px', borderRadius: 'var(--lx-radius)',
                      background: paymentMethod === m.key ? 'rgba(107, 29, 42, 0.06)' : 'rgba(255,255,255,0.6)',
                      border: paymentMethod === m.key ? '2px solid var(--lx-primary)' : '1.5px solid rgba(107, 29, 42, 0.1)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: paymentMethod === m.key ? '5px solid var(--lx-primary)' : '2px solid rgba(107, 29, 42, 0.2)',
                      flexShrink: 0,
                    }} />
                    <i className={`isax ${m.icon}`} style={{ fontSize: 18, color: 'var(--lx-text-mid)' }} />
                    <span style={{ fontWeight: 500, color: 'var(--lx-text)' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h5 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>Recent Payouts</h5>
          </div>

          <div className="lx-card">
            <div className="lx-card-body" style={{ padding: 0 }}>
              <div className="lx-empty-state">
                <span className="empty-icon"><i className="isax isax-card" style={{ fontSize: 28 }} /></span>
                <p>No recent payouts found.</p>
              </div>
            </div>
          </div>

          {/* Withdraw Modal */}
          {showWithdraw && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowWithdraw(false); }}
            >
              <div style={{ width: '100%', maxWidth: 460, background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)', borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)', boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Withdrawal Request</h5>
                  <button onClick={() => setShowWithdraw(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                    <i className="isax isax-close-circle" />
                  </button>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16, borderRadius: 'var(--lx-radius)', background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)', marginBottom: 20 }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--lx-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Withdrawal Balance</p>
                      <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
                        ${dashboardData?.pendingPayout?.toFixed(2) ?? '0.00'}
                      </h6>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--lx-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected</p>
                      <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{paymentMethod === 'paypal' ? 'PayPal' : 'Bank Transfer'}</h6>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                      Amount <span style={{ color: '#8B2335' }}>*</span>
                    </label>
                    <input type="text" style={inputStyle} defaultValue="$ " />
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--lx-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="isax isax-info-circle" style={{ fontSize: 14 }} /> Minimum withdraw amount is $50
                    </p>
                  </div>
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowWithdraw(false)}>Cancel</button>
                  <button type="button" className="lx-btn lx-btn-gold">Submit</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorPayout;
