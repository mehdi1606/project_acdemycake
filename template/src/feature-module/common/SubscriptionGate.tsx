/**
 * SubscriptionGate
 * Shown in place of course content when the visitor is not logged in
 * or lacks an active subscription. Fully bilingual EN / AR via i18n.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { all_routes } from '../router/all_routes';

interface Props {
  /** "masterclass" | "course" — controls the copy */
  type?: 'masterclass' | 'course';
  /** How many ghost cards to show (default 6) */
  ghostCount?: number;
  /** Pass true when the user is already logged in (just missing a subscription) */
  isAuthenticated?: boolean;
}

const GhostCard: React.FC = () => (
  <div className="sl-gate__ghost-card">
    <div className="sl-gate__ghost-thumb" />
    <div className="sl-gate__ghost-body">
      <div className="sl-gate__ghost-line" style={{ width: '40%', height: 10 }} />
      <div className="sl-gate__ghost-line" style={{ width: '85%', height: 16, marginTop: 8 }} />
      <div className="sl-gate__ghost-line" style={{ width: '60%', height: 11, marginTop: 6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <div className="sl-gate__ghost-line" style={{ width: 52, height: 18 }} />
        <div className="sl-gate__ghost-line" style={{ width: 96, height: 34, borderRadius: 6 }} />
      </div>
    </div>
  </div>
);

const SubscriptionGate: React.FC<Props> = ({
  type = 'course',
  ghostCount = 6,
  isAuthenticated = false,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith('ar');
  const route = all_routes;
  const isMasterclass = type === 'masterclass';

  // ── Script line (italic eyebrow) ────────────────────────────────────────────
  const scriptLine = isAuthenticated
    ? t('sharedComponents.subscriptionGate.upgradeRequired')
    : isMasterclass
      ? t('sharedComponents.subscriptionGate.exclusiveAccess')
      : t('sharedComponents.subscriptionGate.membersOnly');

  // ── Main title ───────────────────────────────────────────────────────────────
  const title = isAuthenticated
    ? t('sharedComponents.subscriptionGate.subscriptionRequired')
    : isMasterclass
      ? t('sharedComponents.subscriptionGate.subscribeToViewMasterclasses')
      : t('sharedComponents.subscriptionGate.subscriptionRequired');

  // ── Description paragraph ────────────────────────────────────────────────────
  const desc = isAuthenticated
    ? t('sharedComponents.subscriptionGate.descAuthenticated')
    : isMasterclass
      ? t('sharedComponents.subscriptionGate.descMasterclass')
      : t('sharedComponents.subscriptionGate.descDefault');

  return (
    <div className="sl-gate" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Blurred ghost cards grid */}
      <div className="sl-gate__ghost-grid">
        {Array.from({ length: ghostCount }).map((_, i) => (
          <GhostCard key={i} />
        ))}
      </div>

      {/* Lock overlay */}
      <div className="sl-gate__overlay">
        <div className="sl-gate__panel">
          {/* Gold lock icon */}
          <div className="sl-gate__icon-wrap">
            <i className="isax isax-lock sl-gate__icon" />
          </div>

          {/* Italic eyebrow */}
          <div className="sl-gate__script">{scriptLine}</div>

          {/* Title */}
          <h3 className="sl-gate__title">{title}</h3>

          {/* Description */}
          <p className="sl-gate__desc">{desc}</p>

          {/* CTAs */}
          <div className="sl-gate__actions">
            {/* Only show Sign In when the visitor is NOT logged in */}
            {!isAuthenticated && (
              <Link to={route.login} className="sl-gate__btn sl-gate__btn--ghost">
                {t('sharedComponents.subscriptionGate.signIn')}
              </Link>
            )}
            <Link to={route.pricingPlan} className="sl-gate__btn sl-gate__btn--gold">
              {isAr ? <><i className="isax isax-arrow-left-3 me-2" />{t('sharedComponents.subscriptionGate.viewPlans')}</> : <>{t('sharedComponents.subscriptionGate.viewPlans')} <i className="isax isax-arrow-right-3 ms-2" /></>}
            </Link>
          </div>

          {/* "Already subscribed? Log in" — guests only */}
          {!isAuthenticated && (
            <p className="sl-gate__footnote">
              {t('sharedComponents.subscriptionGate.alreadySubscribed')}{' '}
              <Link to={route.login} className="sl-gate__footnote-link">
                {t('sharedComponents.subscriptionGate.logInToContinue')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
