import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../feature-module/router/all_routes';
import { promoDiscountPercent, Promo, PromoTheme } from '../../config/promo';
import { usePromo, Countdown } from './usePromo';
import './promo.css';
import './takeover.css';

const LOGO = '/assets/img/Logos/Logo Saralowe Academy-12.svg';
const offerLink = (p: Promo) => `${all_routes.pricingPlan}?offer=${encodeURIComponent(p.id)}`;

/* ── Falling snow (canvas) — light, pauses when the tab is hidden ─────────── */
export const SnowLayer: React.FC<{ fixed?: boolean }> = ({ fixed = false }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const count = Math.round(Math.min(160, (w * h) / 9000));
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: 0.8 + Math.random() * 2.6,
      vy: 0.4 + Math.random() * 1.1, vx: -0.3 + Math.random() * 0.6, ph: Math.random() * Math.PI * 2,
      a: 0.45 + Math.random() * 0.5,
    }));
    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy; f.x += f.vx + Math.sin(t / 1600 + f.ph) * 0.35;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        if (f.x > w + 4) f.x = -4; else if (f.x < -4) f.x = w + 4;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.a})`; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(tick); };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  return <canvas ref={ref} className={fixed ? 'sl-snow sl-snow--fixed' : 'sl-snow'} aria-hidden="true" />;
};

/* ── Christmas string lights ──────────────────────────────────────────────── */
export const StringLights: React.FC = () => {
  const bulbs = Array.from({ length: 22 });
  return (
    <div className="sl-lights" aria-hidden="true">
      <svg className="sl-lights__wire" viewBox="0 0 1000 40" preserveAspectRatio="none">
        <path d="M0,6 Q25,30 50,6 T100,6 T150,6 T200,6 T250,6 T300,6 T350,6 T400,6 T450,6 T500,6 T550,6 T600,6 T650,6 T700,6 T750,6 T800,6 T850,6 T900,6 T950,6 T1000,6" />
      </svg>
      <div className="sl-lights__row">
        {bulbs.map((_, i) => <span key={i} className={`sl-lights__bulb sl-lights__bulb--${i % 3}`} style={{ animationDelay: `${(i % 5) * 0.35}s` }} />)}
      </div>
    </div>
  );
};

/* ── Black Friday tape ───────────────────────────────────────────────────── */
export const PromoTape: React.FC<{ theme: PromoTheme; off: number; tilt?: number }> = ({ theme, off, tilt = -2 }) => {
  const { t } = useTranslation();
  const word = theme === 'christmas' ? t('promo.xmas.tape', 'MERRY CHRISTMAS') : 'BLACK FRIDAY';
  const items = Array.from({ length: 10 });
  return (
    <div className={`sl-tape sl-tape--${theme}`} style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
      <div className="sl-tape__track">
        {[0, 1].map((k) => (
          <div className="sl-tape__group" key={k}>
            {items.map((_, i) => (
              <span key={i}>{word} <b>−{off}%</b> <i>✦</i></span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Timer: React.FC<{ left: Countdown }> = ({ left }) => {
  const { t } = useTranslation();
  return (
    <div className="sl-tk__timer" role="timer" aria-label={t('promo.endsIn', 'Offer ends in')}>
      {[{ v: left.h, l: t('promo.hours', 'hours') }, { v: left.m, l: t('promo.minutes', 'min') }, { v: left.s, l: t('promo.seconds', 'sec') }].map((b, i) => (
        <React.Fragment key={b.l}>
          {i > 0 && <span className="sl-tk__colon" aria-hidden="true">:</span>}
          <span className="sl-tk__unit"><b>{b.v}</b><small>{b.l}</small></span>
        </React.Fragment>
      ))}
    </div>
  );
};

/** Full-screen themed home hero shown while an offer runs (replaces the normal hero). */
const PromoTakeover: React.FC = () => {
  const { t } = useTranslation();
  const { promo, phase, left } = usePromo();
  if (!promo) return null;
  const xmas = promo.theme === 'christmas';
  const off = promoDiscountPercent(promo);
  const soon = phase === 'upcoming';

  return (
    <section className={`sl-tk sl-tk--${promo.theme}`} aria-labelledby="sl-tk-title">
      {xmas ? (<><StringLights />
        <div className="sl-tk__ornaments" aria-hidden="true">
          <span className="sl-orn sl-orn--1" /><span className="sl-orn sl-orn--2" /><span className="sl-orn sl-orn--3" /><span className="sl-orn sl-orn--4" />
        </div></>
      ) : (<><div className="sl-tk__rays" aria-hidden="true" /><div className="sl-tk__sparks" aria-hidden="true" /></>)}

      <div className="sl-tk__inner">
        <img className="sl-tk__logo" src={LOGO} alt="SARALÖWE Academy" width={120} height={120} />
        <span className="sl-tk__eyebrow">
          {soon
            ? t('promo.soonEyebrow', 'Starts at midnight · 24 hours only')
            : xmas ? t('promo.xmas.eyebrow', 'Christmas gift · 24 hours only') : t('promo.bf.eyebrow', 'Black Friday · 24 hours only')}
        </span>
        <h1 id="sl-tk-title" className="sl-tk__title">
          {xmas ? <>{t('promo.xmas.big1', 'Merry')} <em>{t('promo.xmas.big2', 'Christmas')}</em></> : <>BLACK<br />FRIDAY</>}
        </h1>
        <p className="sl-tk__lead">
          {xmas
            ? t('promo.xmas.lead', 'Our gift to you: one full year of Premium, every course and every certificate.')
            : t('promo.bf.lead', 'The biggest offer of the year: one full year of Premium, every course and every certificate.')}
        </p>

        <div className="sl-tk__price">
          <span className="sl-tk__now">{promo.price.toLocaleString()}<small>DH</small></span>
          <span className="sl-tk__was">{promo.was.toLocaleString()} DH</span>
          {soon && <span className="sl-tk__from">{t('promo.fromMidnight', 'from 00:00')}</span>}
          <span className="sl-tk__seal">−{off}%</span>
        </div>

        <Link to={offerLink(promo)} className="sl-tk__cta">
          <span className="sl-tk__cta-main">
            {soon ? t('promo.soonCta', '{{price}} DH at midnight', { price: promo.price }) : t('promo.bigCta', 'Get the offer: {{price}} DH', { price: promo.price })}
          </span>
          <span className="sl-tk__cta-sub">
            {soon ? t('promo.soonCtaSub', 'See the offer · normal price until midnight') : t('promo.bigCtaSub', 'Premium 1 year · secure card payment')}
          </span>
          <span className="sl-tk__cta-arrow" aria-hidden="true">→</span>
        </Link>

        <div className="sl-tk__ends">
          <span>{soon ? t('promo.startsIn', 'Starts in') : t('promo.endsIn', 'Offer ends in')}</span>
          <Timer left={left} />
        </div>

        <ul className="sl-tk__trust">
          <li>✓ {t('promo.trust1', 'All courses included')}</li>
          <li>✓ {t('promo.trust2', 'Certificates')}</li>
          <li>✓ {t('promo.trust3', '1 full year of access')}</li>
        </ul>
      </div>
      {xmas && <div className="sl-tk__drift" aria-hidden="true" />}
    </section>
  );
};

export default PromoTakeover;
