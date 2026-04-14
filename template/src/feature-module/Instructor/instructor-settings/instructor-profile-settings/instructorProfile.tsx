import React, { useState, useRef } from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import InstructorSettingsLink from '../settings-link/instructorSettingsLink';
import { DatePicker, App } from 'antd';
import { useAppSelector, useAppDispatch } from '../../../../core/redux/hooks';
import { getFileUrl } from '../../../../environment';
import { profileService } from '../../../../services/api/profile.service';
import { setUser } from '../../../../core/redux/authSlice';

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

const SectionTitle = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ marginBottom: 20 }}>
    <h6 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{title}</h6>
    <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>{sub}</p>
  </div>
);

const FormField = ({ label, children, required = true }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div>
    <label style={labelStyle}>
      {label} {required && <span style={{ color: '#8B2335' }}>*</span>}
    </label>
    {children}
  </div>
);

const InstructorProfileSettings = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { message } = App.useApp();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const avatarUrl = await profileService.uploadAvatar(file);
      if (user) dispatch(setUser({ ...user, avatarUrl }));
      message.success('Profile photo updated!');
    } catch {
      message.error('Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const glassInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
    />
  );

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <InstructorSettingsLink />

      <form>
        {/* Profile Card */}
        <div className="lx-card" style={{ marginBottom: 20 }}>
          <div className="lx-card-body">
            {/* Avatar Section */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', marginBottom: 28, borderRadius: 'var(--lx-radius-sm)',
              background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(107, 29, 42, 0.06)', overflow: 'hidden',
                border: '2px solid rgba(107, 29, 42, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user?.avatarUrl ? (
                  <img
                    src={getFileUrl(user.avatarUrl) ?? user.avatarUrl}
                    alt={user.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#6B1D2A' }}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'I'}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h6 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
                  {user?.fullName || 'Instructor'}
                </h6>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
                  PNG or JPG no bigger than 800px width and height
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    padding: '6px 14px', borderRadius: 'var(--lx-radius-sm)', fontSize: 13, fontWeight: 500,
                    background: 'rgba(107, 29, 42, 0.05)', color: 'var(--lx-text-mid)',
                    border: '1px solid rgba(107, 29, 42, 0.08)',
                    opacity: uploading ? 0.6 : 1,
                  }}>
                    <i className={`isax ${uploading ? 'isax-refresh' : 'isax-gallery-export'}`} style={{ fontSize: 14 }} />
                    {uploading ? 'Uploading…' : 'Upload Photo'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <SectionTitle title="Personal Details" sub="Edit your personal information" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              <FormField label="First Name">
                {glassInput({ type: 'text', defaultValue: 'Eugene', placeholder: 'First name' })}
              </FormField>
              <FormField label="Last Name">
                {glassInput({ type: 'text', defaultValue: 'Andre', placeholder: 'Last name' })}
              </FormField>
              <FormField label="User Name">
                {glassInput({ type: 'text', defaultValue: 'instructordemo', placeholder: 'Username' })}
              </FormField>
              <FormField label="Phone Number">
                {glassInput({ type: 'tel', defaultValue: '90154-91036', placeholder: 'Phone' })}
              </FormField>
            </div>
            <FormField label="Bio">
              <textarea
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' as const }}
                defaultValue="I am a web developer with a vast array of knowledge in many different front end and back end languages, responsive frameworks, databases, and best code practices."
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)'; }}
              />
            </FormField>

            {/* Educational Details */}
            <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid rgba(107, 29, 42, 0.06)' }}>
              <SectionTitle title="Educational Details" sub="Edit your educational information" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 12 }}>
                <FormField label="Degree">
                  {glassInput({ type: 'text', placeholder: 'e.g. Bachelor of Science' })}
                </FormField>
                <FormField label="University">
                  {glassInput({ type: 'text', placeholder: 'University name' })}
                </FormField>
                <FormField label="From Date">
                  <DatePicker style={{ ...inputStyle, cursor: 'pointer' }} placeholder="dd/mm/yyyy" />
                </FormField>
                <FormField label="To Date">
                  <DatePicker style={{ ...inputStyle, cursor: 'pointer' }} placeholder="dd/mm/yyyy" />
                </FormField>
              </div>
              <button
                type="button"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 600, color: 'var(--lx-primary)',
                }}
              >
                <i className="isax isax-add" /> Add New
              </button>
            </div>

            {/* Experience */}
            <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid rgba(107, 29, 42, 0.06)' }}>
              <SectionTitle title="Experience" sub="Edit your experience" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 12 }}>
                <FormField label="Company">
                  {glassInput({ type: 'text', placeholder: 'Company name' })}
                </FormField>
                <FormField label="Position">
                  {glassInput({ type: 'text', placeholder: 'Your role' })}
                </FormField>
                <FormField label="From Date">
                  <DatePicker style={{ ...inputStyle, cursor: 'pointer' }} placeholder="dd/mm/yyyy" />
                </FormField>
                <FormField label="To Date">
                  <DatePicker style={{ ...inputStyle, cursor: 'pointer' }} placeholder="dd/mm/yyyy" />
                </FormField>
              </div>
              <button
                type="button"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 600, color: 'var(--lx-primary)',
                }}
              >
                <i className="isax isax-add" /> Add New
              </button>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(107, 29, 42, 0.06)' }}>
              <button className="lx-btn lx-btn-gold" type="submit">
                Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="lx-card">
          <div className="lx-card-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--lx-radius-sm)', flexShrink: 0,
                background: 'rgba(139, 35, 53, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-warning-2" style={{ fontSize: 20, color: '#8B2335' }} />
              </div>
              <div>
                <h6 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
                  Delete Account
                </h6>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 500, color: 'var(--lx-text-mid)' }}>
                  Are you sure you want to delete your account?
                </p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.5 }}>
                  Permanently removes your account and all associated data from the platform. This action cannot be undone.
                </p>
                <button
                  type="button"
                  className="lx-btn lx-btn-sm"
                  style={{
                    background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335',
                    border: '1.5px solid rgba(139, 35, 53, 0.15)',
                  }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)', padding: 32, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(139, 35, 53, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-warning-2" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>Delete Account?</h5>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
              This will permanently delete your account and all data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                onClick={() => setShowDeleteModal(false)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorProfileSettings;
