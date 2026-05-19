import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppSelector } from '../../../core/redux/hooks';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getFileUrl } from '../../../environment';

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

const AdminSettings = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);

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
              {user?.avatarUrl ? (
                <img src={getFileUrl(user.avatarUrl) ?? user.avatarUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageWithBasePath src="assets/img/user/user-01.jpg" alt="" className="img-fluid" />
              )}
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
