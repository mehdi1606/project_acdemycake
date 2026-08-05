import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin, message } from 'antd';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';
import adminService from '../../../services/api/admin.service';
import AvatarImage from '../../../components/AvatarImage';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)',
  fontSize: 14,
  background: 'rgba(107, 29, 42, 0.03)',
  color: 'var(--lx-text)',
  cursor: 'not-allowed',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--lx-text-mid)',
  marginBottom: 6,
};

// Editable variant (the shared inputStyle is for read-only fields).
const editableInputStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'text',
  background: '#fff',
};

const AdminSettings = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);

  // ── Dynamic subscription pricing (annual plan) ────────────────────────────
  const [yearlyPrice,  setYearlyPrice]  = useState<string>('');
  const [currency,     setCurrency]     = useState<string>('MAD');
  const [pricingLoading, setPricingLoading] = useState<boolean>(true);
  const [pricingSaving,  setPricingSaving]  = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    adminService.getPricingSettings()
      .then((p) => {
        if (!active) return;
        setYearlyPrice(String(p.yearlyPrice ?? ''));
        setCurrency(p.currency || 'MAD');
      })
      .catch(() => { /* leave fields empty on failure */ })
      .finally(() => { if (active) setPricingLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSavePricing = async () => {
    const y = parseFloat(yearlyPrice);
    if (!(y > 0)) {
      message.warning(t('admin.settings.pricingInvalid', 'Please enter a valid price greater than 0.'));
      return;
    }
    setPricingSaving(true);
    try {
      const updated = await adminService.updatePricingSettings(y);
      setYearlyPrice(String(updated.yearlyPrice));
      message.success(t('admin.settings.pricingSaved', 'Subscription pricing updated.'));
    } catch (err: any) {
      message.error(err?.response?.data?.message || t('admin.settings.pricingError', 'Failed to update pricing.'));
    } finally {
      setPricingSaving(false);
    }
  };

  return (
    <LuxuryDashboardLayout>
      {/* Account Settings Card */}
      <div className="lx-card" style={{ marginBottom: 24 }}>
        <div className="lx-card-header">
          <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{t('admin.settings.title', 'Account Settings')}</h5>
        </div>
        <div className="lx-card-body">
          {/* Profile Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28,
            padding: 20, borderRadius: 'var(--lx-radius)',
            background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              border: '3px solid rgba(107, 29, 42, 0.1)',
            }}>
              <AvatarImage
                src={user?.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null}
                name={user?.fullName || 'Admin'}
              />
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--lx-text)' }}>
                {user?.fullName || 'Administrator'}
              </h5>
              <p style={{ margin: '0 0 6px', color: 'var(--lx-text-muted)', fontSize: 14 }}>{user?.email}</p>
              <span className="lx-badge badge-warning">
                <i className="isax isax-shield-tick" style={{ marginRight: 4 }} />
                {t('admin.settings.administrator', 'Administrator')}
              </span>
            </div>
          </div>

          {/* Info Notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 24,
            borderRadius: 'var(--lx-radius-sm)', background: 'rgba(197, 151, 62, 0.08)',
            border: '1px solid rgba(197, 151, 62, 0.15)',
          }}>
            <i className="isax isax-info-circle" style={{ color: '#C5973E', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
              {t('admin.settings.securityNotice', 'Admin account settings are managed through the database for security reasons.')}
            </span>
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>{t('admin.users.name', 'Full Name')}</label>
              <input type="text" style={inputStyle} value={user?.fullName || ''} disabled />
            </div>
            <div>
              <label style={labelStyle}>{t('admin.users.email', 'Email')}</label>
              <input type="email" style={inputStyle} value={user?.email || ''} disabled />
            </div>
            <div>
              <label style={labelStyle}>{t('admin.users.role', 'Role')}</label>
              <input type="text" style={inputStyle} value={t('admin.settings.administrator', 'Administrator')} disabled />
            </div>
            <div>
              <label style={labelStyle}>{t('admin.settings.accountCreated', 'Account Created')}</label>
              <input type="text" style={inputStyle} value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Pricing Card (dynamic) */}
      <div className="lx-card" style={{ marginBottom: 24 }}>
        <div className="lx-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
            {t('admin.settings.subscriptionPricing', 'Subscription Pricing')}
          </h5>
          <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
            <i className="isax isax-flash-1 me-1" />
            {t('admin.settings.pricingHint', 'Applies instantly to new payments')}
          </span>
        </div>
        <div className="lx-card-body">
          {pricingLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
          ) : (
            <>
              <div style={{ marginBottom: 16, maxWidth: 360 }}>
                <label style={labelStyle}>{t('admin.settings.yearlyPrice', 'Annual Price')} ({currency})</label>
                <input
                  type="number" min={0} step="0.01"
                  style={editableInputStyle}
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                />
              </div>
              <button
                className="lx-btn lx-btn-gold"
                onClick={handleSavePricing}
                disabled={pricingSaving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {pricingSaving ? <Spin size="small" /> : <i className="isax isax-save-2" />}
                {t('admin.settings.savePricing', 'Save Pricing')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="lx-card">
        <div className="lx-card-header">
          <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{t('admin.settings.quickLinks', 'Quick Links')}</h5>
        </div>
        <div className="lx-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { to: all_routes.adminDashboard, icon: 'isax-category', color: '#6B1D2A', label: t('admin.sidebar.dashboard', 'Dashboard'), desc: t('admin.settings.viewPlatformOverview', 'View platform overview') },
              { to: all_routes.adminUsers, icon: 'isax-people', color: '#2D5F3F', label: t('admin.sidebar.userManagement', 'User Management'), desc: t('admin.settings.managePlatformUsers', 'Manage platform users') },
              { to: all_routes.adminCourses, icon: 'isax-book', color: '#C5973E', label: t('admin.sidebar.courseManagement', 'Course Management'), desc: t('admin.settings.manageAllCourses', 'Manage all courses') },
              { to: all_routes.adminTransactions, icon: 'isax-card', color: '#8B6D5E', label: t('admin.transactions.title', 'Transactions'), desc: t('admin.settings.viewPaymentHistory', 'View payment history') },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                  borderRadius: 'var(--lx-radius)',
                  background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(107, 29, 42, 0.06)',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                <i className={`isax ${item.icon}`} style={{ fontSize: 24, color: item.color }} />
                <div>
                  <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>{item.label}</h6>
                  <small style={{ color: 'var(--lx-text-muted)' }}>{item.desc}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminSettings;
