/**
 * The threshold: "How would you like to experience SARALÖWE?"
 * Shown once per browser, before the app. The device is detected and the
 * matching experience recommended; either can be chosen. The choice stays in
 * this browser (localStorage) and can be changed later in the settings.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Experience, recommendedExperience } from './experience';
import './experience.css';

const Desktop: React.FC = () => (
  <svg viewBox="0 0 220 150" className="exc__art" aria-hidden="true">
    <path className="exc__ln" pathLength="1" d="M18 14 H202 Q208 14 208 20 V106 Q208 112 202 112 H18 Q12 112 12 106 V20 Q12 14 18 14 Z" />
    <path className="exc__ln" pathLength="1" d="M24 26 H196 V100 H24 Z" />
    <path className="exc__ln" pathLength="1" d="M92 112 L86 134 H134 L128 112" />
    <path className="exc__ln" pathLength="1" d="M66 138 H154" />
    <path className="exc__ln exc__ln--soft" pathLength="1" d="M64 86 C64 74 110 74 110 86 V70 C110 60 64 60 64 70 Z M56 88 H118" />
    <path className="exc__ln exc__ln--soft" pathLength="1" d="M128 48 H180 M128 60 H168 M128 72 H176" />
  </svg>
);

const Mobile: React.FC = () => (
  <svg viewBox="0 0 120 150" className="exc__art" aria-hidden="true">
    <path className="exc__ln" pathLength="1" d="M36 8 H84 Q96 8 96 20 V130 Q96 142 84 142 H36 Q24 142 24 130 V20 Q24 8 36 8 Z" />
    <path className="exc__ln" pathLength="1" d="M52 16 H68" />
    <path className="exc__ln exc__ln--soft" pathLength="1" d="M44 66 C44 56 76 56 76 66 V54 C76 46 44 46 44 54 Z M38 68 H82" />
    <path className="exc__ln exc__ln--soft" pathLength="1" d="M38 88 H82 M38 98 H70 M38 108 H76" />
    <path className="exc__ln" pathLength="1" d="M34 126 H86" />
  </svg>
);

const ExperienceChooser: React.FC<{ onChoose: (mode: Experience) => void }> = ({ onChoose }) => {
  const { t, i18n } = useTranslation();
  const rec = recommendedExperience();
  const [leaving, setLeaving] = useState<Experience | null>(null);
  const first = useRef<HTMLButtonElement>(null);
  const ar = (i18n.language || 'en').startsWith('ar');

  useEffect(() => {
    document.documentElement.setAttribute('dir', ar ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', ar ? 'ar' : 'en');
  }, [ar]);
  useEffect(() => { first.current?.focus({ preventScroll: true }); }, []);

  const choose = (mode: Experience) => {
    if (leaving) return;
    setLeaving(mode);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => onChoose(mode), reduce ? 0 : 900);
  };

  const options: { mode: Experience; art: React.ReactNode; title: string; line: string }[] = [
    { mode: 'desktop', art: <Desktop />, title: t('experience.desktop', 'Desktop experience'), line: t('experience.desktopLine', 'Immersive and cinematic, composed for large screens.') },
    { mode: 'mobile', art: <Mobile />, title: t('experience.mobile', 'Mobile experience'), line: t('experience.mobileLine', 'Refined and touch-first, composed for your phone.') },
  ];
  // the recommended one comes first in reading order
  if (rec === 'mobile') options.reverse();

  return (
    <div className={`exc${leaving ? ` exc--leaving exc--to-${leaving}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="exc-q">
      <div className="exc__sky" aria-hidden="true"><span /><span /></div>
      <div className="exc__lang">
        <button type="button" className={!ar ? 'is-on' : ''} onClick={() => i18n.changeLanguage('en')} lang="en">EN</button>
        <span aria-hidden="true">·</span>
        <button type="button" className={ar ? 'is-on' : ''} onClick={() => i18n.changeLanguage('ar')} lang="ar">العربية</button>
      </div>

      <header className="exc__head">
        <img className="exc__crest" src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`} alt="SARALÖWE Academy" />
        <p className="exc__kicker">{t('experience.welcome', 'Welcome to the atelier')}</p>
        <h1 id="exc-q" className="exc__q">{t('experience.question', 'How would you like to experience SARALÖWE?')}</h1>
      </header>

      <div className="exc__choices">
        {options.map((o, i) => (
          <button
            key={o.mode}
            ref={i === 0 ? first : undefined}
            type="button"
            className={`exc__choice${o.mode === rec ? ' is-rec' : ''}${leaving === o.mode ? ' is-chosen' : ''}`}
            onClick={() => choose(o.mode)}
            style={{ ['--i' as string]: i } as React.CSSProperties}
          >
            {o.mode === rec && <span className="exc__rec">{t('experience.recommended', 'Recommended for this device')}</span>}
            {o.art}
            <span className="exc__title">{o.title}</span>
            <span className="exc__line">{o.line}</span>
            <span className="exc__enter">{t('experience.enter', 'Enter')} <span aria-hidden="true">{ar ? '←' : '→'}</span></span>
          </button>
        ))}
      </div>

      <p className="exc__note">{t('experience.note', 'Saved on this device only. You can change it at any time in your settings.')}</p>
      <div className="exc__curtain" aria-hidden="true" />
    </div>
  );
};

export default ExperienceChooser;
