/**
 * PaymentMethodPicker — "Card" or "PayPal", shown on every checkout.
 *
 * Renders nothing while PayPal is switched off on the server (no keys), so the
 * checkout then works exactly as before with card only.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import paymentService, { PayMethod, PayPalConfig } from '../services/api/payment.service';
import './payment-method-picker.css';

/** PayPal availability for the current page (null while loading). */
export function usePayPalConfig(): PayPalConfig | null {
  const [cfg, setCfg] = useState<PayPalConfig | null>(null);
  useEffect(() => {
    let alive = true;
    paymentService.getPayPalConfig().then((c) => { if (alive) setCfg(c); });
    return () => { alive = false; };
  }, []);
  return cfg;
}

/** The chosen method, remembered for this tab (e.g. the next course of a multi-course cart). */
export function usePayMethod(): [PayMethod, (m: PayMethod) => void] {
  const [m, setM] = useState<PayMethod>(() => {
    try { return sessionStorage.getItem('sl_pay_method') === 'paypal' ? 'paypal' : 'card'; } catch { return 'card'; }
  });
  const set = React.useCallback((next: PayMethod) => {
    setM(next);
    try { sessionStorage.setItem('sl_pay_method', next); } catch { /* storage off */ }
  }, []);
  return [m, set];
}

/** MAD price → amount PayPal will charge, e.g. "€83.24". */
export function formatPayPalAmount(mad: number, cfg: PayPalConfig, locale: string): string {
  if (!cfg.madPerUnit) return '';
  const value = Math.round((mad / cfg.madPerUnit) * 100) / 100;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: cfg.currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${cfg.currency}`;
  }
}

interface Props {
  value: PayMethod;
  onChange: (m: PayMethod) => void;
  /** Price in MAD of what this payment charges now (for the PayPal amount). */
  amountMad?: number;
  disabled?: boolean;
  /** Dark background variant (masterclass booking card). */
  tone?: 'light' | 'dark';
}

const PayPalMark: React.FC = () => (
  <span className="pmp-paypal-mark" aria-hidden="true">
    <span className="pmp-pp-a">Pay</span><span className="pmp-pp-b">Pal</span>
  </span>
);

const PaymentMethodPicker: React.FC<Props> = ({ value, onChange, amountMad, disabled, tone = 'light' }) => {
  const { t, i18n } = useTranslation();
  const cfg = usePayPalConfig();

  // PayPal switched off (or config not loaded): card only, nothing to choose.
  useEffect(() => {
    if (cfg && !cfg.enabled && value === 'paypal') onChange('card');
  }, [cfg, value, onChange]);
  if (!cfg || !cfg.enabled) return null;

  const ppAmount = amountMad && amountMad > 0 ? formatPayPalAmount(amountMad, cfg, i18n.language) : '';

  const opt = (m: PayMethod, body: React.ReactNode) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === m}
      disabled={disabled}
      className={`pmp-opt${value === m ? ' is-on' : ''}`}
      onClick={() => onChange(m)}
    >
      <span className="pmp-dot" aria-hidden="true" />
      {body}
    </button>
  );

  return (
    <div className={`pmp pmp--${tone}`}>
      <div className="pmp-label">{t('payMethod.title', 'How would you like to pay?')}</div>
      <div className="pmp-row" role="radiogroup" aria-label={t('payMethod.title', 'How would you like to pay?')}>
        {opt('card', (
          <span className="pmp-body">
            <span className="pmp-name"><i className="isax isax-card" /> {t('payMethod.card', 'Bank card')}</span>
            <span className="pmp-sub">{t('payMethod.cardSub', 'Visa, Mastercard · in MAD')}</span>
          </span>
        ))}
        {opt('paypal', (
          <span className="pmp-body">
            <span className="pmp-name"><PayPalMark /></span>
            <span className="pmp-sub">
              {ppAmount
                ? t('payMethod.paypalSubAmount', 'Pay {{amount}} with PayPal', { amount: ppAmount })
                : t('payMethod.paypalSub', 'PayPal account or card, in euros')}
            </span>
          </span>
        ))}
      </div>
      {value === 'paypal' && (
        <p className="pmp-note">
          <i className="isax isax-info-circle" />
          <span>
            {t('payMethod.paypalNote',
              'PayPal charges in {{currency}} (1 {{currency}} = {{rate}} MAD). You will be taken to PayPal to confirm, then brought back here automatically.',
              { currency: cfg.currency, rate: cfg.madPerUnit.toFixed(2) })}
          </span>
        </p>
      )}
    </div>
  );
};

export default PaymentMethodPicker;
