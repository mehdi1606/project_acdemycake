/**
 * Admin — Coupon Management
 * Generate, list, deactivate and delete coupon codes for the Annual plan.
 */
import React, { useCallback, useEffect, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import api from '../../../services/api/axios.config';
import { extractApiError } from '../../../services/api/error.utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CouponRow {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  description: string | null;
  createdAt: string;
}

interface CreateForm {
  code: string;
  discountPercent: string;
  maxUses: string;
  expiresAt: string;
  description: string;
}

const EMPTY_FORM: CreateForm = {
  code: '',
  discountPercent: '20',
  maxUses: '1',
  expiresAt: '',
  description: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SRL-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#9B7B50',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #E8D9C8', fontSize: 14, outline: 'none',
  color: '#4A3728', background: '#FDFAF6', boxSizing: 'border-box',
};

// ── Component ─────────────────────────────────────────────────────────────────
const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/coupons', { params: { page: 0, size: 50 } });
      const data = res.data;
      setCoupons(data.content || []);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const flash = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(null), 3500); }
    else { setError(msg); setTimeout(() => setError(null), 4000); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = form.code.trim().toUpperCase();
    if (!code) { setFormError('Coupon code is required'); return; }
    if (!form.discountPercent || Number(form.discountPercent) < 1 || Number(form.discountPercent) > 100) {
      setFormError('Discount must be between 1% and 100%'); return;
    }

    setCreating(true);
    try {
      await api.post('/admin/coupons', {
        code,
        discountPercent: Number(form.discountPercent),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        description: form.description.trim() || null,
      });
      flash(`Coupon "${code}" created successfully`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadCoupons();
    } catch (e) {
      setFormError(extractApiError(e));
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (coupon: CouponRow) => {
    if (!window.confirm(`Deactivate coupon "${coupon.code}"? Students will no longer be able to use it.`)) return;
    setActionId(coupon.id);
    try {
      await api.patch(`/admin/coupons/${coupon.id}/deactivate`);
      flash(`Coupon "${coupon.code}" deactivated`);
      loadCoupons();
    } catch (e) {
      flash(extractApiError(e), 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (coupon: CouponRow) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    setActionId(coupon.id);
    try {
      await api.delete(`/admin/coupons/${coupon.id}`);
      flash(`Coupon "${coupon.code}" deleted`);
      loadCoupons();
    } catch (e) {
      flash(extractApiError(e), 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <LuxuryDashboardLayout>
      <div style={{ padding: '32px 0', maxWidth: 1100, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#9B7B50', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
              Admin Panel
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2C1810', fontFamily: '"Playfair Display", serif', margin: 0 }}>
              Coupon Management
            </h1>
            <p style={{ fontSize: 14, color: '#9B7B50', margin: '6px 0 0' }}>
              Generate discount codes redeemable once per user on the Annual plan.
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setFormError(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
              color: '#4E1420', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(197,145,44,0.35)',
            }}
          >
            <i className="isax isax-add-circle" />
            New Coupon
          </button>
        </div>

        {/* Flash messages */}
        {success && (
          <div style={{
            background: 'rgba(26,127,75,0.08)', border: '1.5px solid rgba(26,127,75,0.2)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 20,
            color: '#1A7F4B', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600,
          }}>
            <i className="isax isax-tick-circle" style={{ fontSize: 18 }} />
            {success}
          </div>
        )}
        {error && (
          <div style={{
            background: 'rgba(232,84,84,0.08)', border: '1.5px solid rgba(232,84,84,0.2)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 20,
            color: '#E85454', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600,
          }}>
            <i className="isax isax-close-circle" style={{ fontSize: 18 }} />
            {error}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1.5px solid rgba(197,145,44,0.15)',
            boxShadow: '0 8px 32px rgba(78,20,32,0.08)',
            padding: '28px 32px', marginBottom: 28,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2C1810', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="isax isax-discount-shape" style={{ color: '#C5912C' }} />
              Create New Coupon
            </h3>

            {formError && (
              <div style={{
                background: 'rgba(232,84,84,0.08)', border: '1.5px solid rgba(232,84,84,0.2)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                color: '#E85454', fontSize: 13, fontWeight: 600,
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Code */}
                <div>
                  <label style={labelStyle}>Coupon Code *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={form.code}
                      onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
                      placeholder="e.g. SRL-ABCD1234"
                      style={inputStyle}
                      maxLength={50}
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, code: generateCode() }))}
                      style={{
                        padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E8D9C8',
                        background: '#FAF5ED', color: '#9B7B50', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                      }}
                    >
                      Auto-generate
                    </button>
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label style={labelStyle}>Discount Percentage *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min={1} max={100} step={1}
                      value={form.discountPercent}
                      onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                      style={{ ...inputStyle, paddingRight: 36 }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9B7B50', fontWeight: 700 }}>%</span>
                  </div>
                </div>

                {/* Max uses */}
                <div>
                  <label style={labelStyle}>Max Uses (blank = unlimited)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="e.g. 1"
                    style={inputStyle}
                  />
                </div>

                {/* Expires */}
                <div>
                  <label style={labelStyle}>Expiry Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Description / Note (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Promo for Instagram campaign"
                  style={inputStyle}
                  maxLength={255}
                />
              </div>

              {/* Preview */}
              {form.code && form.discountPercent && (
                <div style={{
                  background: 'linear-gradient(135deg, #FAF5ED 0%, #FDF8F0 100%)',
                  border: '1.5px solid rgba(197,145,44,0.2)',
                  borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <i className="isax isax-discount-shape" style={{ fontSize: 20, color: '#C5912C' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4E1420' }}>{form.code}</div>
                    <div style={{ fontSize: 12, color: '#9B7B50' }}>
                      {form.discountPercent}% off Annual plan (3,900 MAD → {Math.round(3900 * (1 - Number(form.discountPercent) / 100)).toLocaleString()} MAD)
                      {form.maxUses ? ` · Max ${form.maxUses} use${Number(form.maxUses) > 1 ? 's' : ''}` : ' · Unlimited'}
                      {form.expiresAt ? ` · Expires ${new Date(form.expiresAt).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
                  style={{
                    padding: '12px 22px', borderRadius: 10, border: '1.5px solid #E8D9C8',
                    background: '#fff', color: '#6B4A2A', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
                    color: '#fff', fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {creating ? 'Creating…' : <><i className="isax isax-tick-circle" /> Create Coupon</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1.5px solid rgba(197,145,44,0.1)',
          boxShadow: '0 4px 24px rgba(78,20,32,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(197,145,44,0.1)',
            display: 'flex', alignItems: 'center', gap: 10,
            fontWeight: 700, color: '#2C1810',
          }}>
            <i className="isax isax-discount-shape" style={{ color: '#C5912C' }} />
            All Coupons
            <span style={{
              background: 'rgba(197,145,44,0.1)', color: '#C5912C',
              borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
            }}>
              {coupons.length}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9B7B50' }}>
              Loading coupons…
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <i className="isax isax-discount-shape" style={{ fontSize: 40, color: 'rgba(197,145,44,0.3)', display: 'block', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, color: '#9B7B50' }}>No coupons yet</div>
              <div style={{ fontSize: 13, color: '#B5967A', marginTop: 4 }}>
                Click "New Coupon" to create your first discount code.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(197,145,44,0.04)' }}>
                    {['Code', 'Discount', 'Usage', 'Status', 'Expires', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontWeight: 700, color: '#9B7B50',
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                        borderBottom: '1px solid rgba(197,145,44,0.1)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon, i) => (
                    <tr
                      key={coupon.id}
                      style={{
                        borderBottom: i < coupons.length - 1 ? '1px solid rgba(197,145,44,0.07)' : 'none',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{
                          fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
                          color: coupon.isActive ? '#4E1420' : '#9B7B50',
                          letterSpacing: '0.05em',
                        }}>
                          {coupon.code}
                        </div>
                        {coupon.description && (
                          <div style={{ fontSize: 11, color: '#B5967A', marginTop: 2 }}>
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: 'rgba(197,145,44,0.12)', color: '#C5912C',
                          borderRadius: 8, padding: '4px 10px', fontWeight: 700, fontSize: 13,
                        }}>
                          {coupon.discountPercent}% OFF
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#2C1810' }}>
                          {coupon.usedCount}{coupon.maxUses != null ? ` / ${coupon.maxUses}` : ' / ∞'}
                        </div>
                        {coupon.maxUses != null && (
                          <div style={{ height: 4, borderRadius: 2, marginTop: 4, width: 64, background: 'rgba(197,145,44,0.15)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%`,
                              background: coupon.usedCount >= coupon.maxUses ? '#E85454' : '#C5912C',
                              borderRadius: 2,
                            }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: coupon.isActive ? 'rgba(26,127,75,0.1)' : 'rgba(232,84,84,0.1)',
                          color: coupon.isActive ? '#1A7F4B' : '#E85454',
                        }}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: coupon.expiresAt && new Date(coupon.expiresAt) < new Date() ? '#E85454' : '#9B7B50' }}>
                        {fmt(coupon.expiresAt)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#9B7B50' }}>
                        {fmt(coupon.createdAt)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {coupon.isActive && (
                            <button
                              onClick={() => handleDeactivate(coupon)}
                              disabled={!!actionId}
                              title="Deactivate"
                              style={{
                                padding: '6px 12px', borderRadius: 8, border: 'none',
                                background: 'rgba(197,145,44,0.1)', color: '#C5912C',
                                cursor: actionId ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600,
                                opacity: actionId ? 0.6 : 1,
                              }}
                            >
                              <i className="isax isax-pause-circle" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(coupon)}
                            disabled={!!actionId}
                            title="Delete"
                            style={{
                              padding: '6px 12px', borderRadius: 8, border: 'none',
                              background: 'rgba(232,84,84,0.1)', color: '#E85454',
                              cursor: actionId ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600,
                              opacity: actionId ? 0.6 : 1,
                            }}
                          >
                            <i className="isax isax-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info box */}
        <div style={{
          marginTop: 20,
          background: 'rgba(197,145,44,0.06)', border: '1.5px solid rgba(197,145,44,0.15)',
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <i className="isax isax-info-circle" style={{ fontSize: 18, color: '#C5912C', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: '#9B7B50', lineHeight: 1.6 }}>
            <strong style={{ color: '#6B4A2A' }}>How coupons work:</strong> Each coupon can be applied only once per user,
            exclusively on the <strong style={{ color: '#6B4A2A' }}>Annual plan (3,900 MAD)</strong>.
            Share codes with students and they'll enter the code in the Annual checkout screen to receive the discount.
          </div>
        </div>

      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminCoupons;
