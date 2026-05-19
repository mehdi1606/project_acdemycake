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

/* ── Toggle Switch ── */
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    style={{
      width: 44, height: 24, borderRadius: 12, padding: 2,
      border: 'none', cursor: 'pointer', flexShrink: 0,
      background: checked ? 'var(--lx-primary)' : 'rgba(107, 29, 42, 0.12)',
      transition: 'background 0.2s ease',
      display: 'flex', alignItems: 'center',
      justifyContent: checked ? 'flex-end' : 'flex-start',
    }}
  >
    <div style={{
      width: 20, height: 20, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'all 0.2s ease',
    }} />
  </button>
);

/* ── Integration Data ── */
interface Integration {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

const integrations: Integration[] = [
  {
    key: 'zoom',
    name: 'Zoom Meeting',
    description: 'A virtual platform for real-time video, audio, and screen-sharing collaboration.',
    icon: 'fa-brands fa-video', // isax fallback
    color: '#2D8CFF',
    bgColor: 'rgba(45, 140, 255, 0.08)',
  },
  {
    key: 'google',
    name: 'Google Meet',
    description: 'A video conferencing platform for seamless virtual meetings, collaboration, and screen sharing.',
    icon: 'fa-brands fa-google',
    color: '#34A853',
    bgColor: 'rgba(52, 168, 83, 0.08)',
  },
];

const InstructorIntegrations = () => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    zoom: true,
    google: true,
  });

  const toggle = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <InstructorSettingsLink />

      <div className="lx-card">
        <div className="lx-card-header">
          <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
            Integrations
          </h6>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Connect third-party meeting platforms to your courses
          </p>
        </div>

        <div className="lx-card-body">
          <form>
            {integrations.map((intg, idx) => {
              const isOn = enabled[intg.key];
              return (
                <React.Fragment key={intg.key}>
                  {/* Divider between integrations */}
                  {idx > 0 && (
                    <div style={{
                      height: 1, background: 'rgba(107, 29, 42, 0.06)',
                      margin: '28px 0',
                    }} />
                  )}

                  {/* Integration Header Row */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: 16, borderRadius: 'var(--lx-radius-sm)',
                      border: isOn
                        ? '1.5px solid rgba(45, 95, 63, 0.15)'
                        : '1.5px solid rgba(107, 29, 42, 0.08)',
                      background: isOn
                        ? 'rgba(45, 95, 63, 0.02)'
                        : 'rgba(255, 255, 255, 0.3)',
                      marginBottom: 20, transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: intg.bgColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={intg.icon} style={{ fontSize: 20, color: intg.color }} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <h6 style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
                        {intg.name}
                      </h6>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.4 }}>
                        {intg.description}
                      </p>
                    </div>

                    {/* Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isOn && (
                        <span className="lx-badge badge-success" style={{ fontSize: 11 }}>Active</span>
                      )}
                      <ToggleSwitch checked={isOn} onChange={() => toggle(intg.key)} />
                    </div>
                  </div>

                  {/* Fields (visible only when enabled) */}
                  {isOn && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 16,
                      opacity: 1, transition: 'opacity 0.2s ease',
                    }}>
                      <div>
                        <label style={labelStyle}>Client ID <span style={{ color: '#8B2335' }}>*</span></label>
                        <input type="text" style={inputStyle} placeholder="Enter client ID" {...focusHandlers} />
                      </div>
                      <div>
                        <label style={labelStyle}>Client Secret Key <span style={{ color: '#8B2335' }}>*</span></label>
                        <input type="text" style={inputStyle} placeholder="Enter secret key" {...focusHandlers} />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Save Button */}
            <div style={{ marginTop: 28 }}>
              <button className="lx-btn lx-btn-gold" type="submit">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default InstructorIntegrations;
