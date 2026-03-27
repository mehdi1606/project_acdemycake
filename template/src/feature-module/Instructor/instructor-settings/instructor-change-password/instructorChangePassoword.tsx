import React, { useState, useEffect } from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import InstructorSettingsLink from '../settings-link/instructorSettingsLink';
import { Link } from 'react-router-dom';

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
  poor: { color: '#8B2335', label: 'Weak — Must contain at least 8 characters', width: '25%' },
  weak: { color: '#C5973E', label: 'Average — Must contain at least 1 number', width: '50%' },
  strong: { color: '#4A7DAA', label: 'Almost — Must contain a special symbol', width: '75%' },
  heavy: { color: '#2D5F3F', label: 'Strong — You have a secure password!', width: '100%' },
};

const InstructorChangePassoword = () => {
  const [currentPwVisible, setCurrentPwVisible] = useState(false);
  const [newPwVisible, setNewPwVisible] = useState(false);
  const [confirmPwVisible, setConfirmPwVisible] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState<StrengthLevel>('');

  const calcStrength = (v: string): StrengthLevel => {
    if (!v) return '';
    if (v.length < 8) return 'poor';
    if (!hasNumber(v)) return 'weak';
    if (!hasSpecial(v)) return 'strong';
    return 'heavy';
  };

  useEffect(() => {
    setStrength(calcStrength(password));
  }, [password]);

  const meta = strength ? strengthMeta[strength] : null;

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <InstructorSettingsLink />

      <div className="lx-card">
        <div className="lx-card-body">
          {/* ── Change Password ── */}
          <div style={{ paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
            <div style={{ maxWidth: 520 }}>
              <h6 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
                Change Password
              </h6>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
                Can't remember your current password?{' '}
                <Link to="#" style={{ color: 'var(--lx-primary)', textDecoration: 'underline', fontWeight: 500 }}>
                  Reset your password via email
                </Link>
              </p>

              <form>
                {/* Current Password */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    Current Password <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={currentPwVisible ? 'text' : 'password'}
                      style={inputStyle}
                      placeholder="Enter current password"
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
                    New Password <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={newPwVisible ? 'text' : 'password'}
                      style={inputStyle}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
                    />
                    <button type="button" style={eyeStyle} onClick={() => setNewPwVisible(!newPwVisible)}>
                      <i className={`isax ${newPwVisible ? 'isax-eye' : 'isax-eye-slash'}`} />
                    </button>
                  </div>

                  {/* Strength Bar */}
                  {password && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        height: 4, borderRadius: 2, background: 'rgba(107, 29, 42, 0.06)',
                        overflow: 'hidden', marginBottom: 6,
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: meta?.width || '0%',
                          background: meta?.color || 'transparent',
                          transition: 'all 0.3s ease',
                        }} />
                      </div>
                      {meta && (
                        <span style={{ fontSize: 12, color: meta.color, fontWeight: 500 }}>
                          {meta.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    Confirm Password <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={confirmPwVisible ? 'text' : 'password'}
                      style={inputStyle}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
                    />
                    <button type="button" style={eyeStyle} onClick={() => setConfirmPwVisible(!confirmPwVisible)}>
                      <i className={`isax ${confirmPwVisible ? 'isax-eye' : 'isax-eye-slash'}`} />
                    </button>
                  </div>
                  {confirmPassword && password && confirmPassword !== password && (
                    <span style={{ fontSize: 12, color: '#8B2335', marginTop: 6, display: 'block' }}>
                      Passwords do not match
                    </span>
                  )}
                </div>

                <button className="lx-btn lx-btn-gold" type="submit">
                  Change Password
                </button>
              </form>
            </div>
          </div>

          {/* ── Change Email ── */}
          <div style={{ maxWidth: 520 }}>
            <h6 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
              Change Email
            </h6>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
              Your current email address is{' '}
              <span style={{ fontWeight: 600, color: 'var(--lx-text)' }}>richard@example.com</span>
            </p>

            <form>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  New Email Address <span style={{ color: '#8B2335' }}>*</span>
                </label>
                <input
                  type="email"
                  style={{ ...inputStyle, paddingRight: 14 }}
                  placeholder="Enter new email address"
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
                />
              </div>

              <button className="lx-btn lx-btn-gold" type="submit">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default InstructorChangePassoword;
