/**
 * SARALÖWE Academy — Pricing Plans
 * Two subscription tiers: Monthly · Annual
 * Annual plan supports coupon codes (admin-generated, single-use per user).
 */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { useTranslation } from "react-i18next";
import { subscriptionService } from "../../../services/api/subscription.service";
import { Subscription } from "../../../services/api/types";
import { useAppSelector } from "../../../core/redux/hooks";
import { Spin, Modal } from "antd";

// ── Plan shape ────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  period: string;
  periodLabel: string;
  price: number;
  savings: string | null;
  badge: string | null;
  recommended: boolean;
  features: string[];
  premiumExtras: string[];
  couponEligible: boolean;
}

// ── Floating particle ─────────────────────────────────────────────────────────
const Dot: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div className="sl-cl-hero__particle" style={style} />
);

// ── Plan card ─────────────────────────────────────────────────────────────────
interface PlanCardProps {
  plan: Plan;
  isSubscribed: boolean;
  currentPlanId: string | null;
  subscribing: string | null;
  onSubscribe: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isSubscribed, currentPlanId, subscribing, onSubscribe }) => {
  const { t } = useTranslation();
  const isActive = currentPlanId === plan.id;
  const isBusy = subscribing === plan.id;
  const isAnnual = plan.id === 'yearly';

  return (
    <div style={{
      position: 'relative',
      background: isAnnual
        ? 'linear-gradient(160deg, #1a0810 0%, #2E0D1A 50%, #4E1420 100%)'
        : '#fff',
      borderRadius: 24,
      border: isAnnual ? 'none' : '1.5px solid rgba(101,28,50,0.1)',
      padding: '2.25rem 2rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isAnnual
        ? '0 24px 60px rgba(78,20,32,0.35), 0 0 0 1px rgba(197,145,44,0.25)'
        : '0 4px 24px rgba(101,28,50,0.07)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      overflow: 'visible',
    }}>

      {/* Best Value badge */}
      {isAnnual && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
          color: '#4E1420', borderRadius: 20, padding: '5px 14px',
          fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 20, alignSelf: 'flex-start',
        }}>
          <i className="isax isax-crown" style={{ fontSize: 13 }} />
          {t('pricing.bestValue', 'Best Value')}
        </div>
      )}

      {/* Plan name + icon row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: isAnnual ? 'rgba(197,145,44,0.15)' : 'rgba(101,28,50,0.06)',
          border: isAnnual ? '1.5px solid rgba(197,145,44,0.3)' : '1.5px solid rgba(101,28,50,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`isax ${isAnnual ? 'isax-crown' : 'isax-calendar-1'}`}
            style={{ fontSize: 24, color: isAnnual ? '#C5912C' : '#651C32' }} />
        </div>
        <div>
          <h3 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.5rem', fontWeight: 800,
            color: isAnnual ? '#fff' : '#2C1810',
            margin: 0, lineHeight: 1,
          }}>
            {isAnnual ? t('pricing.annual', 'Annual') : t('pricing.monthly', 'Monthly')}
          </h3>
          <div style={{ fontSize: 12, color: isAnnual ? 'rgba(255,255,255,0.45)' : '#9A8080', marginTop: 3 }}>
            {isAnnual ? t('pricing.annualSubtitle', 'Best for dedicated learners') : t('pricing.monthlySubtitle', 'Flexible month-to-month')}
          </div>
        </div>
      </div>

      {/* Price block */}
      <div style={{
        background: isAnnual ? 'rgba(255,255,255,0.06)' : 'rgba(101,28,50,0.03)',
        border: isAnnual ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(101,28,50,0.07)',
        borderRadius: 16, padding: '20px 20px 16px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: isAnnual ? 'rgba(255,255,255,0.5)' : '#9A8080', alignSelf: 'flex-start', paddingTop: 10 }}>MAD</span>
          <span style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '3.2rem', fontWeight: 900, lineHeight: 1,
            color: isAnnual ? '#DEBB6B' : '#651C32',
          }}>
            {plan.price.toLocaleString()}
          </span>
          <span style={{ fontSize: 13, color: isAnnual ? 'rgba(255,255,255,0.4)' : '#9A8080', alignSelf: 'flex-end', paddingBottom: 6 }}>
            {plan.periodLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          {isAnnual ? (
            <>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t('pricing.approxPerMonth', '≈ 325 MAD/month')}</span>
              <span style={{
                background: 'rgba(26,127,75,0.2)', color: '#4FD68E',
                borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
              }}>
                {t('pricing.save780', 'Save 780 MAD')}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: '#9A8080' }}>{t('pricing.billedMonthly', 'Billed monthly')}</span>
          )}
        </div>
        {isAnnual && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="isax isax-discount-shape" style={{ fontSize: 13, color: '#C5912C' }} />
            <span style={{ fontSize: 12, color: '#C5912C', fontWeight: 600 }}>{t('pricing.couponEligible', 'Coupon code eligible')}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: isAnnual ? 'rgba(255,255,255,0.07)' : 'rgba(101,28,50,0.08)', marginBottom: 20 }} />

      {/* Features */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <i className="isax isax-tick-circle" style={{
              fontSize: 16, flexShrink: 0, marginTop: 1,
              color: isAnnual ? 'rgba(79,214,142,0.85)' : '#2D6B47',
            }} />
            <span style={{ fontSize: 13.5, color: isAnnual ? 'rgba(255,255,255,0.75)' : '#3C2828', lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
        {plan.premiumExtras.filter(f => f !== t('pricing.feature.couponEligible', 'Coupon code eligible')).map((f, i) => (
          <div key={`g${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <i className="isax isax-crown" style={{
              fontSize: 16, flexShrink: 0, marginTop: 1,
              color: isAnnual ? '#DEBB6B' : '#C5912C',
            }} />
            <span style={{
              fontSize: 13.5, lineHeight: 1.4, fontWeight: 600,
              color: isAnnual ? '#DEBB6B' : '#651C32',
            }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div>
        {isActive && isSubscribed ? (
          <button style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none',
            background: 'rgba(45,107,71,0.15)', color: '#2D6B47',
            fontWeight: 700, fontSize: 14, cursor: 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }} disabled>
            <i className="isax isax-tick-circle" />
            {t('pricing.currentPlan', 'Current Plan')}
          </button>
        ) : isSubscribed ? (
          <button
            onClick={() => onSubscribe(plan.id)}
            disabled={!!subscribing}
            style={{
              width: '100%', height: 52, borderRadius: 14, border: isAnnual ? 'none' : '1.5px solid rgba(101,28,50,0.2)',
              background: isAnnual
                ? 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 50%, #C5912C 100%)'
                : 'transparent',
              color: isAnnual ? '#4E1420' : '#651C32',
              fontWeight: 700, fontSize: 14, cursor: !!subscribing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: !!subscribing ? 0.65 : 1,
            }}
          >
            {t('pricing.switchTo', 'Switch to {{plan}}', { plan: isAnnual ? t('pricing.annual', 'Annual') : t('pricing.monthly', 'Monthly') })}
          </button>
        ) : (
          <button
            onClick={() => onSubscribe(plan.id)}
            disabled={!!subscribing}
            style={{
              width: '100%', height: 54, borderRadius: 14, border: 'none',
              background: isAnnual
                ? 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 50%, #C5912C 100%)'
                : 'linear-gradient(135deg, #651C32 0%, #7A2240 100%)',
              color: isAnnual ? '#4E1420' : '#F2EFE8',
              fontWeight: 800, fontSize: 15, cursor: !!subscribing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: !!subscribing ? 0.65 : 1,
              letterSpacing: '0.04em',
              boxShadow: isAnnual
                ? '0 6px 24px rgba(197,145,44,0.5)'
                : '0 4px 16px rgba(101,28,50,0.3)',
              transition: 'all 0.25s ease',
            }}
          >
            {isBusy ? (
              <><Spin size="small" style={{ marginInlineEnd: 6 }} />{t('pricing.processing', 'Processing…')}</>
            ) : (
              <>{t('pricing.subscribe', 'Subscribe')} <i className="isax isax-arrow-right-3" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Coupon validate response ───────────────────────────────────────────────────
interface CouponValidation {
  valid: boolean;
  discountPercent?: number;
  discountAmount?: number;
  finalPrice?: number;
  message?: string;
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
interface ConfirmModalProps {
  plan: Plan;
  user: { fullName?: string; email?: string } | null;
  subscribing: boolean;
  onConfirm: (couponCode: string | null) => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ plan, user, subscribing, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const planLabel = plan.id === "monthly" ? t('pricing.monthly', 'Monthly') : t('pricing.annual', 'Annual');
  const allFeatures = [...plan.features, ...plan.premiumExtras.filter(f => f !== t('pricing.feature.couponEligible', 'Coupon code eligible'))];

  const [couponInput, setCouponInput] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const isAnnual = plan.id === 'yearly';
  const displayPrice = couponValidation?.valid && couponValidation.finalPrice != null
    ? couponValidation.finalPrice
    : plan.price;

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponValidation(null);
    try {
      const result = await subscriptionService.validateCoupon(couponInput.trim().toUpperCase());
      setCouponValidation(result);
      if (result.valid) {
        setAppliedCoupon(couponInput.trim().toUpperCase());
      } else {
        setAppliedCoupon(null);
      }
    } catch {
      setCouponValidation({ valid: false, message: t('pricing.modal.couponValidateFailed', 'Failed to validate coupon. Please try again.') });
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponInput('');
    setCouponValidation(null);
    setAppliedCoupon(null);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20,
          maxWidth: 520, width: '100%',
          boxShadow: '0 24px 80px rgba(78,20,32,0.22)',
          overflow: 'hidden',
          animation: 'fadeInDown 0.25s ease',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
          padding: '28px 32px 24px',
          position: 'relative',
        }}>
          <button
            onClick={onCancel}
            style={{
              position: 'absolute', top: 16, insetInlineEnd: 16,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}
          >
            <i className="isax isax-close-circle" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(197,145,44,0.18)',
              border: '1.5px solid rgba(197,145,44,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`isax ${plan.id === 'yearly' ? 'isax-crown' : 'isax-calendar-1'}`}
                style={{ fontSize: 24, color: '#C5912C' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
                {t('pricing.modal.orderSummary', 'Order Summary')}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: '"Playfair Display", serif' }}>
                {planLabel} {t('pricing.plan', 'Plan')}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px' }}>

          {/* Price row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FAF5ED 0%, #FDF8F0 100%)',
            border: '1.5px solid rgba(197,145,44,0.2)',
            borderRadius: 14, padding: '18px 22px', marginBottom: 22,
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#9B7B50', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                {t('pricing.modal.totalToPay', 'Total to Pay')}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#9B7B50' }}>MAD</span>
                {couponValidation?.valid && couponValidation.finalPrice != null ? (
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#9B7B50', textDecoration: 'line-through', lineHeight: 1 }}>
                      {plan.price.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#1A7F4B', fontFamily: '"Playfair Display", serif', lineHeight: 1 }}>
                      {couponValidation.finalPrice.toLocaleString()}
                    </span>
                  </span>
                ) : (
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#4E1420', fontFamily: '"Playfair Display", serif', lineHeight: 1 }}>
                    {plan.price.toLocaleString()}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#B89060', marginTop: 2 }}>
                {plan.id === 'monthly'
                  ? t('pricing.billedMonthly', 'Billed monthly')
                  : t('pricing.billedAnnually', 'Billed annually · ≈ 325 MAD/month')}
              </div>
            </div>
            {plan.savings && !couponValidation?.valid && (
              <div style={{
                background: '#1A7F4B', color: '#fff',
                borderRadius: 20, padding: '6px 14px',
                fontSize: 12, fontWeight: 700,
              }}>
                {plan.savings}
              </div>
            )}
            {couponValidation?.valid && couponValidation.discountPercent && (
              <div style={{
                background: '#1A7F4B', color: '#fff',
                borderRadius: 20, padding: '6px 14px',
                fontSize: 12, fontWeight: 700,
              }}>
                -{couponValidation.discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Coupon input — Annual only */}
          {isAnnual && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9B7B50', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                <i className="isax isax-discount-shape me-1" />
                {t('pricing.modal.haveCoupon', 'Have a coupon code?')}
              </div>

              {appliedCoupon ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(26,127,75,0.08)', border: '1.5px solid rgba(26,127,75,0.25)',
                  borderRadius: 12, padding: '12px 16px',
                }}>
                  <i className="isax isax-tick-circle" style={{ color: '#1A7F4B', fontSize: 18 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A7F4B' }}>{appliedCoupon}</div>
                    <div style={{ fontSize: 12, color: '#5A9A72' }}>{couponValidation?.message}</div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9B7B50', fontSize: 13, padding: 4,
                    }}
                  >
                    {t('pricing.modal.remove', 'Remove')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponValidation(null);
                    }}
                    placeholder={t('pricing.modal.couponPlaceholder', 'Enter coupon code')}
                    style={{
                      flex: 1, padding: '11px 14px', borderRadius: 10,
                      border: couponValidation && !couponValidation.valid
                        ? '1.5px solid #E85454'
                        : '1.5px solid #E8D9C8',
                      fontSize: 14, outline: 'none', letterSpacing: '0.05em',
                      fontWeight: 600, color: '#4A3728',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') handleValidateCoupon(); }}
                    disabled={subscribing}
                  />
                  <button
                    onClick={handleValidateCoupon}
                    disabled={!couponInput.trim() || validatingCoupon || subscribing}
                    style={{
                      padding: '11px 18px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
                      color: '#4E1420', fontWeight: 700, fontSize: 13,
                      cursor: (!couponInput.trim() || validatingCoupon) ? 'not-allowed' : 'pointer',
                      opacity: (!couponInput.trim() || validatingCoupon) ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {validatingCoupon ? <Spin size="small" /> : t('pricing.modal.apply', 'Apply')}
                  </button>
                </div>
              )}

              {couponValidation && !couponValidation.valid && (
                <div style={{ fontSize: 12, color: '#E85454', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="isax isax-close-circle" />
                  {couponValidation.message}
                </div>
              )}
            </div>
          )}

          {/* What's included */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9B7B50', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              {t('pricing.modal.whatsIncluded', "What's included")}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
              {allFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <i className="isax isax-tick-circle"
                    style={{ fontSize: 15, color: '#1A7F4B', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#4A3728', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          {user && (
            <div style={{
              background: '#F8F4F4', borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
              border: '1px solid rgba(107,29,42,0.07)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#6B1D2A', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, flexShrink: 0,
              }}>
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1810' }}>{user.fullName}</div>
                <div style={{ fontSize: 12, color: '#9B7B50' }}>{user.email}</div>
              </div>
              <div style={{ marginInlineStart: 'auto', fontSize: 11, color: '#1A7F4B', fontWeight: 600 }}>
                <i className="isax isax-verify" style={{ marginInlineEnd: 4 }} />
                {t('pricing.modal.verified', 'Verified')}
              </div>
            </div>
          )}

          {/* Secure notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: '#9B7B50', marginBottom: 22,
          }}>
            <i className="isax isax-shield-tick" style={{ fontSize: 16, color: '#1A7F4B' }} />
            {t('pricing.modal.securePayment', 'Secure payment powered by PayZone · Cancel anytime')}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onCancel}
              disabled={subscribing}
              style={{
                flex: 1, padding: '14px', borderRadius: 12,
                border: '1.5px solid #E8D9C8', background: '#fff',
                color: '#6B4A2A', fontWeight: 600, fontSize: 15,
                cursor: subscribing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={() => onConfirm(appliedCoupon)}
              disabled={subscribing}
              style={{
                flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                background: plan.recommended
                  ? 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 50%, #C5912C 100%)'
                  : 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
                color: plan.recommended ? '#4E1420' : '#fff',
                fontWeight: 700, fontSize: 15, cursor: subscribing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: subscribing ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: plan.recommended
                  ? '0 4px 16px rgba(197,145,44,0.4)'
                  : '0 4px 16px rgba(78,20,32,0.3)',
              }}
            >
              {subscribing ? (
                <><Spin size="small" style={{ marginInlineEnd: 4 }} /> {t('pricing.processing', 'Processing…')}</>
              ) : (
                <><i className="isax isax-lock-1" style={{ fontSize: 16 }} /> {t('pricing.modal.confirmPay', 'Confirm & Pay')} MAD {displayPrice.toLocaleString()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PricePlanning: React.FC = () => {
  const { t } = useTranslation();
  const route = all_routes;
  const navigate = useNavigate();

  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);

  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  // ── Plans (inside component so t() works) ──────────────────────────────────
  const PLANS: Plan[] = [
    {
      id: "monthly",
      period: "monthly",
      periodLabel: t('pricing.perMonth', '/ month'),
      price: 390,
      savings: null,
      badge: null,
      recommended: false,
      couponEligible: false,
      features: [
        t('pricing.feature.allCourses', 'Access to all courses'),
        t('pricing.feature.studentDashboard', 'Student dashboard'),
        t('pricing.feature.certificates', 'Course completion certificates'),
        t('pricing.feature.communityAccess', 'Community forum access'),
        t('pricing.feature.messaging', 'Messaging with instructors'),
        t('pricing.feature.progressTracking', 'Progress tracking'),
      ],
      premiumExtras: [
        t('pricing.feature.individualMasterclass', 'Individual masterclass purchase'),
        t('pricing.feature.standardSupport', 'Standard support'),
      ],
    },
    {
      id: "yearly",
      period: "yearly",
      periodLabel: t('pricing.perYear', '/ year'),
      price: 3900,
      savings: t('pricing.save780', 'Save 780 MAD'),
      badge: t('pricing.bestValue', 'Best Value'),
      recommended: true,
      couponEligible: true,
      features: [
        t('pricing.feature.allCourses', 'Access to all courses'),
        t('pricing.feature.studentDashboard', 'Student dashboard'),
        t('pricing.feature.certificates', 'Course completion certificates'),
        t('pricing.feature.communityAccess', 'Community forum access'),
        t('pricing.feature.messaging', 'Messaging with instructors'),
        t('pricing.feature.progressTracking', 'Progress tracking'),
      ],
      premiumExtras: [
        t('pricing.feature.allMasterclasses', 'All masterclass access included'),
        t('pricing.feature.prioritySupport', 'Priority & dedicated support'),
        t('pricing.feature.earlyAccess', 'Early access to new courses'),
        t('pricing.feature.annualBadge', 'Exclusive annual member badge'),
        t('pricing.feature.couponEligible', 'Coupon code eligible'),
      ],
    },
  ];

  // ── FAQs (inside component so t() works) ──────────────────────────────────
  const FAQS = [
    { q: t('pricing.faq.q1', 'What is the difference between Courses and Masterclasses?'), a: t('pricing.faq.a1', 'Courses are part of our standard curriculum available to all subscribers. Masterclasses are exclusive premium sessions led by world-renowned pastry chefs — available to purchase individually on Monthly, or fully included in the Annual plan.') },
    { q: t('pricing.faq.q2', 'Can I switch plans later?'), a: t('pricing.faq.a2', 'Yes. You can upgrade or change your plan at any time. Your new plan takes effect immediately and remaining credit is applied.') },
    { q: t('pricing.faq.q3', 'Is there a free trial?'), a: t('pricing.faq.a3', 'We do not offer a free tier, but you can browse the course catalog and instructor profiles without a subscription before committing.') },
    { q: t('pricing.faq.q4', 'What payment methods are accepted?'), a: t('pricing.faq.a4', 'We accept all major credit and debit cards via our secure payment gateway.') },
    { q: t('pricing.faq.q5', 'Can I cancel my subscription?'), a: t('pricing.faq.a5', 'Yes. You can cancel anytime. Access continues until the end of the current billing period.') },
    { q: t('pricing.faq.q6', 'How do I use a coupon code?'), a: t('pricing.faq.a6', "Coupon codes are only applicable to the Annual plan. When you click Subscribe on the Annual plan, you'll see an optional coupon field in the confirmation screen. Enter your code there to apply the discount before paying.") },
  ];

  // ── Why cards (inside component so t() works) ─────────────────────────────
  const WHY_CARDS = [
    { icon: "isax-video-play",   color: "gold",   title: t('pricing.why.card1.title', 'All Course Videos'),    desc: t('pricing.why.card1.desc', 'Stream every lesson in HD with lifetime progress tracking.') },
    { icon: "isax-award",        color: "burg",   title: t('pricing.why.card2.title', 'Certificates'),         desc: t('pricing.why.card2.desc', 'Earn a SARALÖWE Academy certificate on every completed course.') },
    { icon: "isax-people",       color: "forest", title: t('pricing.why.card3.title', 'Community Access'),     desc: t('pricing.why.card3.desc', 'Join our private community of cake artists worldwide.') },
    { icon: "isax-message-text", color: "gold",   title: t('pricing.why.card4.title', 'Instructor Messaging'), desc: t('pricing.why.card4.desc', 'Ask questions directly to your instructors inside the platform.') },
    { icon: "isax-chart-2",      color: "burg",   title: t('pricing.why.card5.title', 'Progress Dashboard'),   desc: t('pricing.why.card5.desc', 'Track your learning journey with a beautiful student dashboard.') },
    { icon: "isax-crown",        color: "gold",   title: t('pricing.why.card6.title', 'Masterclasses*'),       desc: t('pricing.why.card6.desc', 'Annual plan includes all masterclasses. Monthly plan: buy individually.') },
  ];

  const isSubscribed =
    currentSubscription?.status === "ACTIVE" ||
    user?.subscriptionStatus === "ACTIVE";

  const currentPlanId = currentSubscription?.planType ?? null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
          const sub = await subscriptionService.getMySubscription();
          setCurrentSubscription(sub);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      Modal.confirm({
        title: t('pricing.loginRequired.title', 'Login Required'),
        content: t('pricing.loginRequired.content', 'Please log in to start your subscription.'),
        okText: t('pricing.loginRequired.okText', 'Login'),
        cancelText: t('common.cancel', 'Cancel'),
        onOk: () => navigate(route.login),
      });
      return;
    }
    const plan = PLANS.find(p => p.id === planId);
    if (plan) setConfirmPlan(plan);
  };

  const handleConfirmPayment = async (couponCode: string | null) => {
    if (!confirmPlan) return;
    const planId = confirmPlan.id;
    try {
      setSubscribing(planId);
      const response = await subscriptionService.subscribe(planId, couponCode || undefined);
      if (response.paymentUrl) {
        sessionStorage.setItem('sl_pending_txn_id', String(response.transactionId));
        sessionStorage.setItem('sl_pending_plan_id', planId);
        window.location.href = response.paymentUrl;
      } else {
        const sub = await subscriptionService.getMySubscription();
        setCurrentSubscription(sub);
        setConfirmPlan(null);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setConfirmPlan(null);
      Modal.error({
        title: t('pricing.error.title', 'Subscription Failed'),
        content: axiosErr.response?.data?.message || t('pricing.error.content', 'Failed to process subscription. Please try again.'),
      });
    } finally {
      setSubscribing(null);
    }
  };

  const dots = [
    { top: "12%", left: "8%",  w: 5, delay: "0s",   dur: "9s"  },
    { top: "24%", left: "88%", w: 7, delay: "1.5s",  dur: "11s" },
    { top: "62%", left: "4%",  w: 4, delay: "3s",    dur: "8s"  },
    { top: "78%", left: "92%", w: 6, delay: "0.8s",  dur: "10s" },
    { top: "40%", left: "50%", w: 3, delay: "2s",    dur: "7s"  },
    { top: "88%", left: "30%", w: 5, delay: "4s",    dur: "12s" },
    { top: "18%", left: "60%", w: 4, delay: "1s",    dur: "9s"  },
  ];

  if (loading) {
    return (
      <div className="sl-pricing-loading">
        <Spin size="large" />
        <p>{t('pricing.loadingPlans', 'Loading plans…')}</p>
      </div>
    );
  }

  return (
    <div className="sl-pricing-page">

      {/* ══ HERO ══ */}
      <section className="sl-cl-hero sl-cl-hero--pricing">
        {dots.map((d, i) => (
          <Dot key={i} style={{ top: d.top, left: d.left, width: d.w, height: d.w, animationDelay: d.delay, animationDuration: d.dur }} />
        ))}
        <div className="sl-cl-hero__inner container">
          <div className="sl-cl-hero__breadcrumb">
            <Link to={route.homeone}>{t('nav.home', 'Home')}</Link>
            <span className="sl-cl-hero__breadcrumb-sep">✦</span>
            <span>{t('pricing.hero.breadcrumb', 'Subscription Plans')}</span>
          </div>
          <div className="sl-cl-hero__script">{t('pricing.hero.script', 'Unlock Your Full Potential')}</div>
          <h1 className="sl-cl-hero__title">{t('pricing.hero.title', 'Choose Your Plan')}</h1>
          <p className="sl-cl-hero__desc">
            {t('pricing.hero.desc', 'Every plan gives you unlimited access to courses, your student dashboard, certificates and the community. The Annual plan also unlocks all Masterclasses.')}
          </p>

          {isSubscribed && (
            <div className="sl-pricing__active-banner">
              <i className="isax isax-crown" />
              <span>
                {t('pricing.activeSubscription', 'You are subscribed')} —&nbsp;
                {currentSubscription?.currentPeriodEnd
                  ? `${t('pricing.accessUntil', 'access until')} ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`
                  : user?.subscriptionEndDate
                  ? `${t('pricing.accessUntil', 'access until')} ${new Date(user.subscriptionEndDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`
                  : t('pricing.currentlyActive', 'currently active')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ══ PLAN CARDS ══ */}
      <section className="sl-pricing__section">
        <div className="container">
          <div className="sl-pricing__grid" style={{ maxWidth: 820, margin: '0 auto' }}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSubscribed={!!isSubscribed}
                currentPlanId={currentPlanId}
                subscribing={subscribing}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>

          {!isAuthenticated && (
            <p className="sl-pricing__login-nudge">
              {t('pricing.loginNudge', 'Already have an account?')}{" "}
              <Link to={route.login} className="sl-pricing__login-link">{t('pricing.signIn', 'Sign in')}</Link>
              {" "}{t('pricing.toSubscribe', 'to subscribe instantly.')}
            </p>
          )}
        </div>
      </section>

      {/* ══ MASTERCLASS INFO ══ */}
      <section className="sl-pricing__info-section">
        <div className="container">
          <div className="sl-pricing__info-banner">
            <div className="sl-pricing__info-icon">
              <i className="isax isax-teacher" />
            </div>
            <div>
              <h4 className="sl-pricing__info-title">{t('pricing.masterclass.title', 'About Masterclasses')}</h4>
              <p className="sl-pricing__info-desc">
                {t('pricing.masterclass.desc1', 'Masterclasses are exclusive live or recorded sessions led by world-renowned pastry chefs. They are')}{" "}
                <strong>{t('pricing.masterclass.includedInAnnual', 'fully included in the Annual plan')}</strong>{" "}
                {t('pricing.masterclass.desc2', 'and can also be purchased')}{" "}
                <strong>{t('pricing.masterclass.individually', 'individually')}</strong>{" "}
                {t('pricing.masterclass.desc3', 'on the Monthly plan.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHY SUBSCRIBE ══ */}
      <section className="sl-pricing__why-section">
        <div className="container">
          <div className="sl-pricing__why-header">
            <div className="sl-pricing__why-script">{t('pricing.why.script', 'Everything Included')}</div>
            <h2 className="sl-pricing__why-title">{t('pricing.why.title', 'What You Get With Every Plan')}</h2>
          </div>
          <div className="sl-pricing__why-grid">
            {WHY_CARDS.map((item, i) => (
              <div key={i} className={`sl-pricing__why-card sl-pricing__why-card--${item.color}`}>
                <div className="sl-pricing__why-card-icon">
                  <i className={`isax ${item.icon}`} />
                </div>
                <h5 className="sl-pricing__why-card-title">{item.title}</h5>
                <p className="sl-pricing__why-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="sl-pricing__faq-section">
        <div className="container">
          <div className="sl-pricing__faq-header">
            <div className="sl-pricing__why-script">{t('pricing.faq.script', 'Got Questions?')}</div>
            <h2 className="sl-pricing__why-title">{t('pricing.faq.title', 'Frequently Asked')}</h2>
          </div>
          <div className="sl-pricing__faq-list">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`sl-pricing__faq-item${openFaq === i ? " sl-pricing__faq-item--open" : ""}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="sl-pricing__faq-question">
                  <span>{faq.q}</span>
                  <i className={`isax isax-arrow-down-1 sl-pricing__faq-arrow${openFaq === i ? " sl-pricing__faq-arrow--open" : ""}`} />
                </div>
                {openFaq === i && (
                  <div className="sl-pricing__faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ══ */}
      {!isAuthenticated && (
        <section className="sl-pricing__cta-section">
          <div className="container">
            <div className="sl-pricing__cta-box">
              <div className="sl-pricing__cta-script">{t('pricing.cta.script', 'Ready to Begin?')}</div>
              <h2 className="sl-pricing__cta-title">{t('pricing.cta.title', 'Start Your Artisan Journey Today')}</h2>
              <p className="sl-pricing__cta-desc">
                {t('pricing.cta.desc', 'Create your account and choose the plan that fits your learning pace.')}
              </p>
              <div className="sl-pricing__cta-actions">
                <Link to={route.register} className="sl-pricing__cta-btn sl-pricing__cta-btn--primary">
                  {t('pricing.cta.createAccount', 'Create Account')} <i className="isax isax-arrow-right-3 ms-2" />
                </Link>
                <Link to={route.courseList} className="sl-pricing__cta-btn sl-pricing__cta-btn--ghost">
                  {t('pricing.cta.browseCourses', 'Browse Courses')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ CONFIRMATION MODAL ══ */}
      {confirmPlan && (
        <ConfirmModal
          plan={confirmPlan}
          user={user ?? null}
          subscribing={!!subscribing}
          onConfirm={handleConfirmPayment}
          onCancel={() => { if (!subscribing) setConfirmPlan(null); }}
        />
      )}

    </div>
  );
};

export default PricePlanning;
