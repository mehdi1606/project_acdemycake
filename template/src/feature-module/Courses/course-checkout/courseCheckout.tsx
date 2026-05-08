import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppSelector, useAppDispatch } from '../../../core/redux/hooks';
import { clearCart } from '../../../core/redux/cartSlice';
import { App } from 'antd';
import { getFileUrl } from '../../../environment';

/* ── Design tokens ── */
const GOLD   = '#C5973E';
const GOLD_L = '#DEBB6B';
const BURG   = '#651C32';
const BURG_D = '#8B2335';
const IVORY  = '#F7F4EE';
const DARK   = '#1A1614';

type PaymentTab = 'card' | 'paypal' | 'bank';

const CourseCheckout = () => {
  const route    = all_routes;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { items } = useAppSelector((s) => s.cart);

  const subtotal   = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const savedTotal = items.reduce((s, i) => s + ((i.originalPrice ?? i.price) - i.price), 0);
  const tax        = parseFloat((subtotal * 0.2).toFixed(2));
  const total      = parseFloat((subtotal + tax).toFixed(2));

  const [payTab, setPayTab]         = useState<PaymentTab>('card');
  const [processing, setProcessing] = useState(false);

  /* Billing form state */
  const [form, setForm] = useState({
    firstName:   user?.fullName?.split(' ')[0] ?? '',
    lastName:    user?.fullName?.split(' ').slice(1).join(' ') ?? '',
    email:       user?.email ?? '',
    phone:       '',
    address1:    '',
    address2:    '',
    city:        '',
    country:     'Morocco',
    saveInfo:    false,
    cardNumber:  '',
    cardName:    '',
    expiry:      '',
    cvv:         '',
    paypalEmail: '',
    bankName:    '',
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  /* ── Helpers ── */
  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val: string) => {
    const v = val.replace(/\D/g, '').slice(0, 4);
    return v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      message.warning('Please login to complete your purchase');
      return;
    }
    if (items.length === 0) {
      message.error('Your cart is empty');
      return;
    }
    setProcessing(true);
    /* Simulate payment processing */
    await new Promise(r => setTimeout(r, 2200));
    setProcessing(false);
    dispatch(clearCart());
    message.success('Payment successful! You are now enrolled in your courses.');
    navigate(route.studentDashboard || '/');
  };

  /* ── Input style helper ── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid #e8e0d8',
    borderRadius: 10, fontSize: 14, color: DARK,
    background: '#faf8f5', outline: 'none',
    transition: 'border-color .2s',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#555', marginBottom: 6,
  };
  const fieldStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  const tabBtn = (tab: PaymentTab, label: string, icon: string) => (
    <button
      type="button"
      onClick={() => setPayTab(tab)}
      style={{
        flex: 1, padding: '12px 8px',
        background: payTab === tab
          ? `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`
          : '#fff',
        border: payTab === tab ? 'none' : '1.5px solid #e8e0d8',
        borderRadius: 10, cursor: 'pointer',
        color: payTab === tab ? '#fff' : '#555',
        fontWeight: 700, fontSize: 13,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4,
        transition: 'all .2s',
        boxShadow: payTab === tab ? `0 4px 12px ${GOLD}44` : 'none',
      }}
    >
      <i className={`isax ${icon}`} style={{ fontSize: 20 }} />
      {label}
    </button>
  );

  return (
    <div style={{ background: IVORY, minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, ${BURG} 60%, ${BURG_D} 100%)`,
        position: 'relative', overflow: 'hidden',
        paddingTop: 80, paddingBottom: 0,
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50,
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Link to="/" style={{ color: `${GOLD_L}99`, fontSize: 13, textDecoration: 'none' }}>Home</Link>
            <span style={{ color: `${GOLD_L}55`, fontSize: 13 }}>/</span>
            <Link to={route.courseCart} style={{ color: `${GOLD_L}99`, fontSize: 13, textDecoration: 'none' }}>Cart</Link>
            <span style={{ color: `${GOLD_L}55`, fontSize: 13 }}>/</span>
            <span style={{ color: GOLD_L, fontSize: 13, fontWeight: 600 }}>Checkout</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${GOLD}55`,
            }}>
              <i className="isax isax-lock" style={{ fontSize: 22, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#fff', fontSize: 32, fontWeight: 700,
                margin: 0, letterSpacing: '-0.5px',
              }}>
                Secure Checkout
              </h1>
              <p style={{ color: `${GOLD_L}cc`, margin: 0, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="isax isax-shield-tick" style={{ fontSize: 14 }} />
                SSL Encrypted — Your payment is 100% secure
              </p>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 60, marginBottom: -1 }}>
          <path d="M0,0 C360,60 1080,0 1440,60 L1440,60 L0,60 Z" fill={IVORY} />
        </svg>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>

        {items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `${GOLD}15`, border: `2px dashed ${GOLD}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <i className="isax isax-shopping-cart" style={{ fontSize: 36, color: `${GOLD}88` }} />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: DARK, marginBottom: 12 }}>
              Nothing to checkout
            </h3>
            <p style={{ color: '#888', marginBottom: 28 }}>Your cart is empty. Add some courses first.</p>
            <Link
              to={route.courseGrid}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                color: '#fff', textDecoration: 'none',
                padding: '13px 32px', borderRadius: 50,
                fontWeight: 700, fontSize: 15,
              }}
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

              {/* ── Left Column ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Step 1: Billing */}
                <div style={{
                  background: '#fff', borderRadius: 20,
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  border: '1px solid #f0ebe6', overflow: 'hidden',
                }}>
                  {/* Section header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '20px 28px',
                    borderBottom: '1px solid #f0ebe6',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>1</div>
                    <div>
                      <h4 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", color: DARK, fontSize: 18 }}>
                        Billing Information
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#999' }}>Your personal and billing details</p>
                    </div>
                  </div>

                  <div style={{ padding: '24px 28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>First Name <span style={{ color: BURG }}>*</span></label>
                        <input
                          required
                          type="text"
                          value={form.firstName}
                          onChange={set('firstName')}
                          placeholder="Mohammed"
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = GOLD; }}
                          onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                        />
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Last Name <span style={{ color: BURG }}>*</span></label>
                        <input
                          required
                          type="text"
                          value={form.lastName}
                          onChange={set('lastName')}
                          placeholder="Alami"
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = GOLD; }}
                          onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Email Address <span style={{ color: BURG }}>*</span></label>
                        <input
                          required
                          type="email"
                          value={form.email}
                          onChange={set('email')}
                          placeholder="you@example.com"
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = GOLD; }}
                          onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                        />
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Phone (Optional)</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={set('phone')}
                          placeholder="+212 6XX XXX XXX"
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = GOLD; }}
                          onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                        />
                      </div>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Address Line 1 <span style={{ color: BURG }}>*</span></label>
                      <input
                        required
                        type="text"
                        value={form.address1}
                        onChange={set('address1')}
                        placeholder="Street address, P.O. box"
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = GOLD; }}
                        onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                      />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={form.address2}
                        onChange={set('address2')}
                        placeholder="Apartment, suite, unit, etc."
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = GOLD; }}
                        onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>City <span style={{ color: BURG }}>*</span></label>
                        <input
                          required
                          type="text"
                          value={form.city}
                          onChange={set('city')}
                          placeholder="Casablanca"
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = GOLD; }}
                          onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                        />
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Country <span style={{ color: BURG }}>*</span></label>
                        <select
                          required
                          value={form.country}
                          onChange={set('country')}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          onFocus={e => { e.target.style.borderColor = GOLD; }}
                          onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                        >
                          <option value="Morocco">Morocco</option>
                          <option value="Algeria">Algeria</option>
                          <option value="Tunisia">Tunisia</option>
                          <option value="Egypt">Egypt</option>
                          <option value="France">France</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
                      <input
                        type="checkbox"
                        checked={form.saveInfo}
                        onChange={set('saveInfo')}
                        style={{ width: 16, height: 16, accentColor: GOLD }}
                      />
                      <span style={{ fontSize: 13, color: '#666' }}>Save this information for next time</span>
                    </label>
                  </div>
                </div>

                {/* Step 2: Payment */}
                <div style={{
                  background: '#fff', borderRadius: 20,
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  border: '1px solid #f0ebe6', overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '20px 28px', borderBottom: '1px solid #f0ebe6',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>2</div>
                    <div>
                      <h4 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", color: DARK, fontSize: 18 }}>
                        Payment Method
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#999' }}>Choose your preferred payment</p>
                    </div>
                    {/* Security badges */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="isax isax-shield-tick" style={{ color: '#4caf50', fontSize: 18 }} />
                      <span style={{ fontSize: 11, color: '#4caf50', fontWeight: 600 }}>Secured</span>
                    </div>
                  </div>

                  <div style={{ padding: '24px 28px' }}>
                    {/* Tab selector */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                      {tabBtn('card', 'Credit Card', 'isax-card')}
                      {tabBtn('paypal', 'PayPal', 'isax-wallet-3')}
                      {tabBtn('bank', 'Bank Transfer', 'isax-bank')}
                    </div>

                    {/* Card form */}
                    {payTab === 'card' && (
                      <div>
                        <div style={fieldStyle}>
                          <label style={labelStyle}>Card Number <span style={{ color: BURG }}>*</span></label>
                          <div style={{ position: 'relative' }}>
                            <input
                              required
                              type="text"
                              value={form.cardNumber}
                              onChange={e => setForm(p => ({ ...p, cardNumber: formatCard(e.target.value) }))}
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                              style={{ ...inputStyle, paddingRight: 48 }}
                              onFocus={e => { e.target.style.borderColor = GOLD; }}
                              onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                            />
                            <i className="isax isax-card" style={{
                              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                              fontSize: 20, color: '#ccc',
                            }} />
                          </div>
                        </div>
                        <div style={fieldStyle}>
                          <label style={labelStyle}>Name on Card <span style={{ color: BURG }}>*</span></label>
                          <input
                            required
                            type="text"
                            value={form.cardName}
                            onChange={set('cardName')}
                            placeholder="MOHAMMED ALAMI"
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = GOLD; }}
                            onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div style={fieldStyle}>
                            <label style={labelStyle}>Expiry Date <span style={{ color: BURG }}>*</span></label>
                            <input
                              required
                              type="text"
                              value={form.expiry}
                              onChange={e => setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                              placeholder="MM/YY"
                              maxLength={5}
                              style={inputStyle}
                              onFocus={e => { e.target.style.borderColor = GOLD; }}
                              onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                            />
                          </div>
                          <div style={fieldStyle}>
                            <label style={labelStyle}>CVV <span style={{ color: BURG }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                              <input
                                required
                                type="password"
                                value={form.cvv}
                                onChange={e => setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                placeholder="•••"
                                maxLength={4}
                                style={{ ...inputStyle, paddingRight: 44 }}
                                onFocus={e => { e.target.style.borderColor = GOLD; }}
                                onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                              />
                              <i className="isax isax-info-circle" style={{
                                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                fontSize: 16, color: '#ccc', cursor: 'pointer',
                              }} title="3 or 4 digit security code on the back of your card" />
                            </div>
                          </div>
                        </div>
                        {/* Accepted cards */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 12, color: '#999' }}>We accept:</span>
                          {['isax-visa', 'isax-mastercardcard', 'isax-card'].map((ic, idx) => (
                            <div key={idx} style={{
                              width: 40, height: 26, borderRadius: 6,
                              background: '#f5f5f5', border: '1px solid #e8e0d8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <i className={`isax ${ic}`} style={{ fontSize: 14, color: '#888' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PayPal form */}
                    {payTab === 'paypal' && (
                      <div>
                        <div style={{
                          background: '#f0f5ff', border: '1.5px solid #ccd9f5',
                          borderRadius: 12, padding: '20px 24px',
                          textAlign: 'center', marginBottom: 20,
                        }}>
                          <div style={{ fontSize: 36, color: '#003087', marginBottom: 8 }}>PayPal</div>
                          <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                            You will be redirected to PayPal to complete your payment securely.
                          </p>
                        </div>
                        <div style={fieldStyle}>
                          <label style={labelStyle}>PayPal Email <span style={{ color: BURG }}>*</span></label>
                          <input
                            required
                            type="email"
                            value={form.paypalEmail}
                            onChange={set('paypalEmail')}
                            placeholder="your@paypal.com"
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = GOLD; }}
                            onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Bank Transfer form */}
                    {payTab === 'bank' && (
                      <div>
                        <div style={{
                          background: `${GOLD}08`, border: `1.5px solid ${GOLD}30`,
                          borderRadius: 12, padding: '20px 24px', marginBottom: 20,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <i className="isax isax-info-circle" style={{ color: GOLD, fontSize: 20 }} />
                            <strong style={{ color: DARK, fontSize: 14 }}>Bank Transfer Instructions</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.7 }}>
                            Please transfer the total amount to the following account and include your order
                            number as the reference. Your enrollment will be activated within 24 hours.
                          </p>
                          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              ['Bank', 'Attijariwafa Bank'],
                              ['Account Name', 'Academy Platform SARL'],
                              ['IBAN', 'MA64 0011 0000 0000 0000 0000 000'],
                              ['SWIFT', 'BCMAMAMC'],
                            ].map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                                <span style={{ color: '#999', minWidth: 100 }}>{k}:</span>
                                <strong style={{ color: DARK }}>{v}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={fieldStyle}>
                          <label style={labelStyle}>Your Bank Name (Optional)</label>
                          <input
                            type="text"
                            value={form.bankName}
                            onChange={set('bankName')}
                            placeholder="e.g. CIH Bank"
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = GOLD; }}
                            onBlur={e => { e.target.style.borderColor = '#e8e0d8'; }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Right Column: Order Summary ── */}
              <div style={{ position: 'sticky', top: 100 }}>
                <div style={{
                  background: '#fff', borderRadius: 20,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  border: '1px solid #f0ebe6',
                  overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div style={{
                    background: `linear-gradient(135deg, ${DARK} 0%, ${BURG} 100%)`,
                    padding: '22px 28px',
                  }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      color: '#fff', margin: 0, fontSize: 20, fontWeight: 700,
                    }}>Order Summary</h3>
                    <p style={{ color: `${GOLD_L}99`, margin: '4px 0 0', fontSize: 12 }}>
                      {items.length} course{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    {/* Course list */}
                    <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
                      {items.map((item) => {
                        const thumb = getFileUrl(item.thumbnailUrl) ?? item.thumbnailUrl;
                        return (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 0',
                            borderBottom: '1px dashed #f0ebe6',
                          }}>
                            <div style={{ flexShrink: 0, width: 52, height: 40, borderRadius: 8, overflow: 'hidden', background: `${GOLD}15` }}>
                              {thumb ? (
                                <img src={thumb} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="isax isax-book-1" style={{ fontSize: 18, color: GOLD }} />
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 12, color: DARK, fontWeight: 600, lineHeight: 1.4,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.title}
                              </p>
                              {item.instructorName && (
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999' }}>{item.instructorName}</p>
                              )}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {item.price === 0 ? 'Free' : `${item.price.toFixed(2)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Price breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#666', fontSize: 13 }}>Subtotal</span>
                        <span style={{ color: DARK, fontWeight: 600, fontSize: 13 }}>{subtotal.toFixed(2)} MAD</span>
                      </div>
                      {savedTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#4caf50', fontSize: 13 }}>Discount</span>
                          <span style={{ color: '#4caf50', fontWeight: 600, fontSize: 13 }}>-{savedTotal.toFixed(2)} MAD</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#666', fontSize: 13 }}>TVA (20%)</span>
                        <span style={{ color: DARK, fontWeight: 600, fontSize: 13 }}>{tax.toFixed(2)} MAD</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: '#f0ebe6', margin: '12px 0 16px' }} />

                    {/* Total */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 20,
                    }}>
                      <span style={{ fontWeight: 700, color: DARK, fontSize: 16 }}>Total</span>
                      <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 800, color: GOLD, fontSize: 22,
                      }}>
                        {total.toFixed(2)} MAD
                      </span>
                    </div>

                    {/* Guarantee */}
                    <div style={{
                      background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                      borderRadius: 10, padding: '12px 14px',
                      marginBottom: 20,
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <i className="isax isax-shield-tick" style={{ color: GOLD, fontSize: 20, flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                        <strong style={{ color: DARK }}>30-day money-back guarantee.</strong>{' '}
                        If you are not satisfied, get a full refund within 30 days.
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={processing}
                      style={{
                        width: '100%', padding: '15px',
                        background: processing
                          ? '#ccc'
                          : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                        color: '#fff', border: 'none',
                        borderRadius: 50, cursor: processing ? 'not-allowed' : 'pointer',
                        fontSize: 16, fontWeight: 700,
                        boxShadow: processing ? 'none' : `0 6px 20px ${GOLD}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all .2s',
                        letterSpacing: 0.5,
                      }}
                    >
                      {processing ? (
                        <>
                          <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <i className="isax isax-lock" />
                          Complete Purchase — {total.toFixed(2)} MAD
                        </>
                      )}
                    </button>

                    {/* Terms note */}
                    <p style={{ margin: '14px 0 0', fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
                      By completing your purchase, you agree to our{' '}
                      <Link to="/terms" style={{ color: GOLD }}>Terms of Service</Link>{' '}
                      and{' '}
                      <Link to="/privacy" style={{ color: GOLD }}>Privacy Policy</Link>.
                    </p>
                  </div>
                </div>

                {/* Back to cart */}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Link
                    to={route.courseCart}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: BURG, textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    <i className="isax isax-arrow-left-2" />
                    Back to Cart
                  </Link>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CourseCheckout;
