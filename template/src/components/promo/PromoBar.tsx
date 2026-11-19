import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../feature-module/router/all_routes';
import { usePromo } from './usePromo';
import './promo.css';

/** Pages where the bar must not get in the way (sign-in, checkout, payment result). */
const hidden = (p: string) =>
  /^\/(login|register|forgot-password|reset-password|verify-email)/.test(p) ||
  /checkout|payment|cart/.test(p) ||
  p.startsWith(all_routes.pricingPlan);

/** Sticky bottom bar on public pages: price, countdown and a pulsing button to checkout. */
const PromoBar: React.FC = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { promo, phase, left } = usePromo();
  const [small, setSmall] = useState(false);
  // On the home page the big offer hero is already on screen: show the bar once people scroll past it.
  const onHome = pathname === '/' || pathname === all_routes.homeone;
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    if (!onHome) return;
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onHome]);
  if (!promo || hidden(pathname) || (onHome && !pastHero)) return null;
  const xmas = promo.theme === 'christmas';
  const to = `${all_routes.pricingPlan}?offer=${encodeURIComponent(promo.id)}`;

  if (small) {
    return (
      <Link to={to} className={`sl-promobar-pill sl-promobar-pill--${promo.theme}`}>
        <span aria-hidden="true">{xmas ? '🎄' : '⚡'}</span> {promo.price} DH · {left.h}:{left.m}:{left.s}
      </Link>
    );
  }

  return (
    <div className={`sl-promobar sl-promobar--${promo.theme}`} role="region" aria-label={t('promo.barAria', 'Limited-time offer')}>
      <span className="sl-promobar__tag">{xmas ? t('promo.xmas.tag', 'Christmas') : t('promo.bf.tag', 'Black Friday')}</span>
      <span className="sl-promobar__text">
        {phase === 'upcoming'
          ? <>{t('promo.barSoon', 'Starts at midnight:')} <b>{promo.price} DH</b> <s>{promo.was} DH</s></>
          : <>{t('promo.barText', 'Premium for 1 year:')} <b>{promo.price} DH</b> <s>{promo.was} DH</s></>}
      </span>
      <span className="sl-promobar__clock" role="timer">
        <span aria-hidden="true">⏱</span> {left.h}:{left.m}:{left.s}
      </span>
      <Link to={to} className="sl-promobar__cta">{phase === 'upcoming' ? t('promo.barSoonCta', 'See it') : t('promo.barCta', 'I want it')}</Link>
      <button type="button" className="sl-promobar__close" onClick={() => setSmall(true)} aria-label={t('promo.minimise', 'Make smaller')}>
        ✕
      </button>
    </div>
  );
};

export default PromoBar;
