import React from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import SettingsLinks from '../settingsLinks/settingsLinks';

interface LinkedAccount {
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  connected: boolean;
}

const accounts: LinkedAccount[] = [
  {
    name: 'Facebook', icon: 'fa-brands fa-facebook-f', iconColor: '#1877F2', iconBg: 'rgba(24, 119, 242, 0.08)',
    description: 'Facebook is a social platform for connecting, sharing, and building communities globally.',
    connected: true,
  },
  {
    name: 'Google', icon: 'fa-brands fa-google', iconColor: '#EA4335', iconBg: 'rgba(234, 67, 53, 0.08)',
    description: 'Google is widely used for search, maps, email, and other services.',
    connected: false,
  },
  {
    name: 'Github', icon: 'fa-brands fa-github', iconColor: '#24292F', iconBg: 'rgba(36, 41, 47, 0.06)',
    description: 'GitHub is a version control and collaboration platform for hosting, managing, and sharing code.',
    connected: false,
  },
  {
    name: 'Twitter', icon: 'fa-brands fa-x-twitter', iconColor: '#1DA1F2', iconBg: 'rgba(29, 161, 242, 0.08)',
    description: 'Twitter is a platform for sharing news, updates, and global conversations.',
    connected: false,
  },
];

const StudentLinkedAccounts = () => {
  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <SettingsLinks />

      <div className="lx-card">
        <div className="lx-card-header">
          <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
            Linked Accounts
          </h6>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Connect third-party accounts for quick sign-in
          </p>
        </div>
        <div className="lx-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map((acct) => (
              <div
                key={acct.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 18px', borderRadius: 'var(--lx-radius-sm)',
                  background: acct.connected ? 'rgba(107, 29, 42, 0.02)' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${acct.connected ? 'rgba(107, 29, 42, 0.08)' : 'rgba(107, 29, 42, 0.04)'}`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(44, 24, 16, 0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = acct.connected ? 'rgba(107, 29, 42, 0.02)' : 'rgba(255,255,255,0.4)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--lx-radius-sm)', flexShrink: 0,
                  background: acct.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={acct.icon} style={{ fontSize: 18, color: acct.iconColor }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>{acct.name}</h6>
                    {acct.connected && (
                      <span className="lx-badge badge-success">Connected</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.4 }}>
                    {acct.description}
                  </p>
                </div>

                {/* Action */}
                <button
                  type="button"
                  className={`lx-btn lx-btn-sm ${acct.connected ? '' : 'lx-btn-outline'}`}
                  style={acct.connected ? {
                    background: 'rgba(139, 35, 53, 0.06)', color: '#8B2335',
                    border: '1px solid rgba(139, 35, 53, 0.1)', flexShrink: 0,
                  } : { flexShrink: 0 }}
                >
                  {acct.connected ? 'Remove' : 'Link Account'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentLinkedAccounts;
