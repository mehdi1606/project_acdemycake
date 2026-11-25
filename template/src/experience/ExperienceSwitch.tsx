/**
 * Desktop / Mobile switch for settings and menus. The choice is kept in this
 * browser only, so each device keeps its own experience.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { currentExperience, Experience, resetExperience, switchExperience } from './experience';
import './experience-switch.css';

const ExperienceSwitch: React.FC<{ compact?: boolean; tabIndex?: number }> = ({ compact, tabIndex }) => {
  const { t } = useTranslation();
  const now = currentExperience();
  const opts: { mode: Experience; label: string; icon: string }[] = [
    { mode: 'desktop', label: t('experience.desktopShort', 'Desktop'), icon: 'isax-monitor' },
    { mode: 'mobile', label: t('experience.mobileShort', 'Mobile'), icon: 'isax-mobile' },
  ];
  return (
    <div className={`exw${compact ? ' exw--compact' : ''}`}>
      <div className="exw__seg" role="radiogroup" aria-label={t('experience.label', 'Experience')}>
        {opts.map((o) => (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={now === o.mode}
            className={now === o.mode ? 'is-on' : ''}
            onClick={() => { if (now !== o.mode) switchExperience(o.mode); }}
            tabIndex={tabIndex}
          >
            <i className={`isax ${o.icon}`} aria-hidden="true" /> {o.label}
          </button>
        ))}
      </div>
      {!compact && <p className="exw__hint">{t('experience.hint', 'Saved on this device only: your phone and your computer can each keep their own experience.')}</p>}
      <button type="button" className="exw__reset" onClick={resetExperience} tabIndex={tabIndex}>
        {t('experience.showChoice', 'Show the welcome choice again')}
      </button>
    </div>
  );
};

export default ExperienceSwitch;
