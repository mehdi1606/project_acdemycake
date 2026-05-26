/**
 * PaymentBadges — SARALÖWE Academy
 * Displays the 3 accepted payment logos:
 *   • Chaabi Payment (CMI)
 *   • Mastercard SecureCode
 *   • Verified by Visa
 *
 * Fully bilingual EN / AR — label translates automatically.
 * RTL-aware: logo row and label adapt to dir="rtl" on <html>.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentBadgesProps {
  /** 'dark' = footer; 'light' = cards & modals */
  variant?: 'dark' | 'light';
  /** Override label — pass empty string "" to hide it */
  label?: string;
  /** Extra wrapper style */
  style?: React.CSSProperties;
}

const LOGOS = [
  { src: '/assets/img/payment/LogoChaabiPayment.png',    alt: 'Chaabi Payment',        height: 28 },
  { src: '/assets/img/payment/secure_code_logo.png',     alt: 'Mastercard SecureCode', height: 32 },
  { src: '/assets/img/payment/tn_verified_by_visa.png',  alt: 'Verified by Visa',      height: 28 },
];

const PaymentBadges: React.FC<PaymentBadgesProps> = ({
  variant = 'light',
  label,
  style,
}) => {
  const { t, i18n } = useTranslation();
  const isDark = variant === 'dark';
  const isAr   = i18n.language?.startsWith('ar');

  // label === "" → hide; label === undefined → use i18n key
  const showLabel  = label !== '';
  const resolvedLabel = label || t('payment.securePaymentAccepted', 'Secure payment accepted');

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      {/* Translated label */}
      {showLabel && (
        <span
          style={{
            fontFamily: 'var(--sl-font-body, sans-serif)',
            fontSize: '0.6rem',
            fontWeight: 600,
            letterSpacing: isAr ? '0.04em' : '0.16em',   // Arabic: reduce tracking
            textTransform: 'uppercase',
            color: isDark ? 'rgba(245,218,223,0.38)' : 'rgba(100,70,60,0.55)',
            textAlign: 'center',
          }}
        >
          {resolvedLabel}
        </span>
      )}

      {/* Logo row — always LTR so logos stay in same visual order */}
      <div
        dir="ltr"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {LOGOS.map((logo) => (
          <div
            key={logo.alt}
            style={{
              background: 'transparent',
              borderRadius: 6,
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.alt}
              style={{
                height: logo.height,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                filter: 'none',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentBadges;
