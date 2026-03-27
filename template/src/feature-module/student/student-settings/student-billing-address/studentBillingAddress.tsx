import React, { useState } from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import SettingsLinks from '../settingsLinks/settingsLinks';
import SettingsModal from '../settingsModal/settingsModal';

interface Address {
  id: number;
  label: string;
  address: string;
  isDefault?: boolean;
}

const initialAddresses: Address[] = [
  { id: 1, label: 'Home', address: '16 Lake Floyd Circle, Newark, DE 19714', isDefault: true },
  { id: 2, label: 'Work', address: '33 Hart Country Lane, West Point, GA 31833' },
];

const StudentBillingAddress = () => {
  const [addresses] = useState<Address[]>(initialAddresses);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <SettingsLinks />

      <div className="lx-card">
        <div className="lx-card-header">
          <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
            Billing Addresses
          </h6>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Manage your billing addresses for invoices and payments
          </p>
        </div>
        <div className="lx-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: 'var(--lx-radius-sm)',
                  background: addr.isDefault ? 'rgba(45, 95, 63, 0.04)' : 'rgba(107, 29, 42, 0.02)',
                  border: `1px solid ${addr.isDefault ? 'rgba(45, 95, 63, 0.1)' : 'rgba(107, 29, 42, 0.05)'}`,
                  flexWrap: 'wrap', gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--lx-radius-sm)',
                    background: addr.isDefault ? 'rgba(45, 95, 63, 0.08)' : 'rgba(107, 29, 42, 0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <i className={`isax ${addr.label === 'Home' ? 'isax-home-2' : 'isax-briefcase'}`}
                      style={{ fontSize: 16, color: addr.isDefault ? '#2D5F3F' : 'var(--lx-text-muted)' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>
                        {addr.label}
                      </h6>
                      {addr.isDefault && (
                        <span className="lx-badge badge-success">Default</span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
                      {addr.address}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="lx-btn lx-btn-sm lx-btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <i className="isax isax-edit-2" style={{ fontSize: 13 }} /> Edit
                  </button>
                  <button
                    type="button"
                    className="lx-btn lx-btn-sm"
                    style={{
                      background: 'rgba(139, 35, 53, 0.06)', color: '#8B2335',
                      border: '1px solid rgba(139, 35, 53, 0.1)',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                    onClick={() => setShowDelete(true)}
                  >
                    <i className="isax isax-trash" style={{ fontSize: 13 }} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <button className="lx-btn lx-btn-gold" type="button">
              <i className="isax isax-add" style={{ marginRight: 6 }} />
              Add New Address
            </button>
          </div>
        </div>
      </div>

      <SettingsModal />

      {/* Delete Confirmation */}
      {showDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDelete(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)', padding: 32, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(139, 35, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>Delete Address</h5>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
              Are you sure you want to delete this billing address?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowDelete(false)}>Cancel</button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                onClick={() => setShowDelete(false)}
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

export default StudentBillingAddress;
