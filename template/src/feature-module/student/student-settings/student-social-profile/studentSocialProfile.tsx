import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import SettingsLinks from '../settingsLinks/settingsLinks';
import { message } from 'antd';
import { useAppSelector, useAppDispatch } from '../../../../core/redux/hooks';
import { setUser } from '../../../../core/redux/authSlice';
import profileService from '../../../../services/api/profile.service';
import { extractApiError } from '../../../../services/api/error.utils';

const socialFields = [
  { key: 'twitter',   label: 'Twitter',   placeholder: 'https://www.twitter.com/yourprofile',   icon: 'fa-brands fa-x-twitter',    color: '#651C32' },
  { key: 'facebook',  label: 'Facebook',  placeholder: 'https://www.facebook.com/yourprofile',  icon: 'fa-brands fa-facebook-f',   color: '#651C32' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourprofile', icon: 'fa-brands fa-instagram',    color: '#651C32' },
  { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://www.linkedin.com/in/yourprofile', icon: 'fa-brands fa-linkedin-in', color: '#651C32' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'https://www.youtube.com/@yourchannel',  icon: 'fa-brands fa-youtube',      color: '#651C32' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px 10px 42px',
  border: '1.5px solid rgba(101, 28, 50, 0.12)',
  borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
  outline: 'none', background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)', transition: 'border-color 0.2s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--lx-text-mid)', marginBottom: 6,
};

const StudentSocialProfile = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [saving, setSaving] = useState(false);

  const [links, setLinks] = useState<Record<string, string>>({
    twitter: '', facebook: '', instagram: '', linkedin: '', youtube: '',
  });

  // Parse user.socialLinks JSON on mount / user change
  useEffect(() => {
    if (user?.socialLinks) {
      try {
        const parsed = JSON.parse(user.socialLinks);
        setLinks((prev) => ({ ...prev, ...parsed }));
      } catch {
        // socialLinks not valid JSON — ignore
      }
    }
  }, [user?.socialLinks]);

  const handleChange = (key: string, value: string) => {
    setLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await profileService.updateProfile({
        socialLinks: JSON.stringify(links),
      });
      dispatch(setUser(updatedUser));
      message.success(t('student.socialProfile.saved', 'Social profiles saved'));
    } catch (err) {
      message.error(extractApiError(err, t('student.socialProfile.saveError', "Your social links couldn't be saved. Check each link starts with https:// and try again.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{t('student.settings.title', 'Settings')}</h5>
      </div>
      <SettingsLinks />

      <div className="lx-card">
        <div className="lx-card-header">
          <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
            {t('student.settingsTabs.socialProfiles', 'Social Profiles')}
          </h6>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
            {t('student.socialProfile.desc', 'Connect your social media accounts for profile visibility')}
          </p>
        </div>
        <div className="lx-card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {socialFields.map((field) => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 22, height: 22, borderRadius: 6,
                      background: `${field.color}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={field.icon} style={{ fontSize: 12, color: field.color }} />
                    </div>
                    <input
                      type="url"
                      style={inputStyle}
                      placeholder={field.placeholder}
                      value={links[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(101, 28, 50, 0.3)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(101, 28, 50, 0.12)'; }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(101, 28, 50, 0.06)' }}>
              <button className="lx-btn lx-btn-gold" type="submit" disabled={saving}>
                {saving ? t('student.settings.saving', 'Saving...') : t('student.socialProfile.save', 'Save Social Profile')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentSocialProfile;
