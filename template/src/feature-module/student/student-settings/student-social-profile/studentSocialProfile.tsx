import React from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import SettingsLinks from '../settingsLinks/settingsLinks';

const socialFields = [
  { label: 'Twitter', placeholder: 'https://www.twitter.com/', icon: 'fa-brands fa-x-twitter', color: '#1DA1F2' },
  { label: 'Facebook', placeholder: 'https://www.facebook.com/', icon: 'fa-brands fa-facebook-f', color: '#1877F2' },
  { label: 'Instagram', placeholder: 'https://www.instagram.com/', icon: 'fa-brands fa-instagram', color: '#E4405F' },
  { label: 'LinkedIn', placeholder: 'https://www.linkedin.com/', icon: 'fa-brands fa-linkedin-in', color: '#0A66C2' },
  { label: 'YouTube', placeholder: 'https://www.youtube.com/', icon: 'fa-brands fa-youtube', color: '#FF0000' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px 10px 42px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
  outline: 'none', background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)', transition: 'border-color 0.2s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--lx-text-mid)', marginBottom: 6,
};

const StudentSocialProfile = () => {
  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <SettingsLinks />

      <div className="lx-card">
        <div className="lx-card-header">
          <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
            Social Profiles
          </h6>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Connect your social media accounts for profile visibility
          </p>
        </div>
        <div className="lx-card-body">
          <form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {socialFields.map((field) => (
                <div key={field.label}>
                  <label style={labelStyle}>{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 22, height: 22, borderRadius: 6,
                      background: `${field.color}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={field.icon} style={{ fontSize: 11, color: field.color }} />
                    </div>
                    <input
                      type="url"
                      style={inputStyle}
                      placeholder={field.placeholder}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(107, 29, 42, 0.06)' }}>
              <button className="lx-btn lx-btn-gold" type="submit">
                Save Social Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentSocialProfile;
