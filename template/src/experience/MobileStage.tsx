/**
 * Mobile chosen on a computer: a computer browser can't be told to lay a page
 * out at phone width, so the app runs inside a phone-sized frame. Inside it,
 * every phone composition applies for real (its own width, its own media
 * queries). The address bar follows the page shown in the frame.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { switchExperience } from './experience';
import './experience.css';

const MobileStage: React.FC = () => {
  const { t } = useTranslation();
  const src = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return (
    <div className="exs">
      <div className="exs__side">
        <img className="exs__crest" src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`} alt="SARALÖWE Academy" />
        <p className="exs__kicker">{t('experience.mobile', 'Mobile experience')}</p>
        <h1 className="exs__title">{t('experience.stageTitle', 'The atelier, in your hand')}</h1>
      </div>
      <div className="exs__device">
        <iframe src={src} title="SARALÖWE Academy" />
      </div>
      <div className="exs__side exs__side--right">
        <p className="exs__text">{t('experience.stageText', 'You chose the mobile experience on this computer. It is shown here at phone size.')}</p>
        <button type="button" className="exs__btn" onClick={() => switchExperience('desktop')}>
          {t('experience.switchToDesktop', 'Switch to desktop')}
        </button>
      </div>
    </div>
  );
};

export default MobileStage;
