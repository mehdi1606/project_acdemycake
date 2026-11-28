/**
 * CouponField — "Have a coupon?" box for a course, masterclass or ebook checkout.
 * The server checks the code against this exact purchase and returns the new price;
 * the same code is then sent with the order (card or PayPal), where it is checked again.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api/axios.config';
import './coupon-field.css';

/** 799 → "799", 639.2 → "639.20". */
export const fmtPrice = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

export interface AppliedCoupon {
  code: string;
  finalPrice: number;
  discountPercent?: number;
}

interface Props {
  target: 'COURSE' | 'EBOOK';
  itemId: string;
  applied: AppliedCoupon | null;
  onChange: (c: AppliedCoupon | null) => void;
  disabled?: boolean;
  tone?: 'light' | 'dark';
}

const CouponField: React.FC<Props> = ({ target, itemId, applied, onChange, disabled, tone = 'light' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const check = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true); setErr('');
    try {
      const r = await api.get('/coupons/validate', { params: { code: c, target, itemId } });
      const d = r.data as { valid: boolean; finalPrice?: number; discountPercent?: number; message?: string };
      if (d.valid && d.finalPrice != null) {
        if (d.finalPrice <= 0) {
          setErr(t('coupon.fullPrice', 'This coupon covers the full price. Please contact support to get access.'));
          onChange(null);
        } else {
          onChange({ code: c, finalPrice: Number(d.finalPrice), discountPercent: d.discountPercent });
        }
      } else {
        setErr(d.message || t('coupon.invalid', 'This coupon is not valid.'));
        onChange(null);
      }
    } catch {
      setErr(t('coupon.checkFailed', "We couldn't check this coupon. Please try again."));
      onChange(null);
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <div className={`cpf cpf--${tone} cpf--ok`}>
        <i className="isax isax-ticket-discount" aria-hidden="true" />
        <span className="cpf__applied">
          <b>{applied.code}</b>
          {applied.discountPercent ? ` · −${Number(applied.discountPercent)}%` : ''}
        </span>
        <button type="button" className="cpf__link" disabled={disabled} onClick={() => { onChange(null); setCode(''); }}>
          {t('coupon.remove', 'Remove')}
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className={`cpf__toggle cpf__toggle--${tone}`} onClick={() => setOpen(true)} disabled={disabled}>
        <i className="isax isax-ticket-discount" aria-hidden="true" /> {t('coupon.have', 'Have a coupon code?')}
      </button>
    );
  }

  return (
    <div className={`cpf cpf--${tone}`}>
      <div className="cpf__row">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } }}
          placeholder={t('coupon.placeholder', 'Coupon code')}
          aria-label={t('coupon.placeholder', 'Coupon code')}
          disabled={disabled || busy}
          maxLength={50}
        />
        <button type="button" onClick={check} disabled={disabled || busy || !code.trim()}>
          {busy ? t('common.loading', 'Loading…') : t('coupon.apply', 'Apply')}
        </button>
      </div>
      {err && <p className="cpf__err" role="alert">{err}</p>}
    </div>
  );
};

export default CouponField;
