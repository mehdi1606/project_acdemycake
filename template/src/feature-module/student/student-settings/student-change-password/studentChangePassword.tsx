import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import SettingsLinks from '../settingsLinks/settingsLinks';
import { message } from 'antd';
import { useAppSelector } from '../../../../core/redux/hooks';
import profileService from '../../../../services/api/profile.service';
import { extractApiError } from '../../../../services/api/error.utils';

const hasNumber = (v: string) => /[0-9]/.test(v);
const hasSpecial = (v: string) => /[!#@$%^&*)(+=._-]/.test(v);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 42px 11px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
  outline: 'none', background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)', transition: 'border-color 0.2s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--lx-text-mid)', marginBottom: 6,
};

const eyeStyle: React.CSSProperties = {
  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
  cursor: 'pointer', background: 'none', border: 'none', padding: 0,
  color: 'var(--lx-text-muted)', fontSize: 16,
};

type StrengthLevel = '' | 'poor' | 'weak' | 'strong' | 'heavy';

const strengthMeta: Record<string, { color: string; label: string; width: string }> = {
  poor:  { color: '#8B2335', label: 'Weak — at least 8 characters required', width: '25%' },
  weak:  { color: '#C5973E', label: 'Average — add a number', width: '50%' },
  strong:{ color: '#4A7DAA', label: 'Almost — add a special symbol', width: '75%' },
  heavy: { color: '#2D5F3F', label: 'Strong password!', width: '100%' },
};

const calcStrength = (v: string): StrengthLevel => {
  if (!v) return '';
  if (v.length < 8) return 'poor';
  if (!hasNumber(v)) return 'weak';
  if (!hasSpecial(v)) return 'strong';
  return 'heavy';
};

const StudentChangePassword = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((s) => s.auth);

  const [currentPwVisible, setCurrentPwVisible] = useState(false);
  const [newPwVisible, setNewPwVisible] = useState(false);
  const [confirmPwVisible, setConfirmPwVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const strength = calcStrength(newPassword);
  const meta = strength ? strengthMeta[strength] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) { message.error('Please enter your current password'); return; }
    if (strength !== 'heavy' && newPassword.length > 0) {
      if (newPassword.length < 8) { message.error('New password must be at least 8 characters'); return; }
    }
    if (newPassword !== confirmPassword) { message.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { message.error('New password must be at least 8 characters'); return; }

    setSaving(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword, confirmPassword });
      message.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      message.error(extractApiError(err, 'Failed to change password'));
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
        <div className="lx-card-body">
          {/* Change Password */}
          <div style={{ paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
            <div style={{ maxWidth: 520 }}>
              <h6 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
                {t('student.changePassword.title', 'Change Password')}
              </h6>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
                {t('student.changePassword.desc', 'Update your password to keep your account secure.')}
              </p>

              <form onSubmit={handleSubmit}>
                {/* Current Password */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    {t('student.changePassword.currentPassword', 'Current Password')} <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={currentPwVisible ? 'text' : 'password'}
                      style={inputStyle}
                      placeholder={t('student.changePassword.enterCurrentPassword', 'Enter current password')}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
                    />
                    <button type="button" style={eyeStyle} onClick={() => setCurrentPwVisible(!currentPwVisible)}>
                      <i className={`isax ${currentPwVisible ? 'isax-eye' : 'isax-eye-slash'}`} />
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    {t('student.changePassword.newPassword', 'New Password')} <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={newPwVisible ? 'text' : 'password'}
                      style={inputStyle}
                      placeholder={t('student.changePassword.enterNewPassword', 'Enter new password')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
                    />
                    <button type="button" style={eyeStyle} onClick={() => setNewPwVisible(!newPwVisible)}>
                      <i className={`isax ${newPwVisible ? 'isax-eye' : 'isax-eye-slash'}`} />
                    </button>
                  </div>
                  {newPassword && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(107, 29, 42, 0.06)', overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', borderRadius: 2, width: meta?.width || '0%', background: meta?.color || 'transparent', transition: 'all 0.3s ease' }} />
                      </div>
                      {meta && <span style={{ fontSize: 12, color: meta.color, fontWeight: 500 }}>{meta.label}</span>}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    {t('student.changePassword.confirmPassword', 'Confirm Password')} <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={confirmPwVisible ? 'text' : 'password'}
                      style={inputStyle}
                      placeholder={t('student.changePassword.confirmNewPassword', 'Confirm new password')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
                    />
                    <button type="button" style={eyeStyle} onClick={() => setConfirmPwVisible(!confirmPwVisible)}>
                      <i className={`isax ${confirmPwVisible ? 'isax-eye' : 'isax-eye-slash'}`} />
                    </button>
                  </div>
                  {confirmPassword && newPassword && confirmPassword !== newPassword && (
                    <span style={{ fontSize: 12, color: '#8B2335', marginTop: 6, display: 'block' }}>
                      {t('student.changePassword.passwordsNoMatch', 'Passwords do not match')}
                    </span>
                  )}
                </div>

                <button className="lx-btn lx-btn-gold" type="submit" disabled={saving}>
                  {saving ? t('student.settings.saving', 'Saving...') : t('student.changePassword.update', 'Change Password')}
                </button>
              </form>
            </div>
          </div>

          {/* Email (read-only, informational) */}
          <div style={{ maxWidth: 520 }}>
            <h6 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
              {t('student.changePassword.yourEmail', 'Your Email')}
            </h6>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
              {t('student.changePassword.currentEmailIs', 'Your current email address is')}{' '}
              <span style={{ fontWeight: 600, color: 'var(--lx-text)' }}>{user?.email ?? '—'}</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--lx-text-muted)', padding: '10px 14px', background: 'rgba(107, 29, 42, 0.03)', borderRadius: 'var(--lx-radius-sm)', border: '1px solid rgba(107, 29, 42, 0.05)' }}>
              <i className="isax isax-info-circle me-2" />
              {t('student.changePassword.emailChangeNote', 'Email changes are not supported at this time. Contact support if you need to update your email.')}
            </p>
          </div>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentChangePassword;
