import React from 'react';
import { useTranslation } from 'react-i18next';
import ExperienceSwitch from './ExperienceSwitch';

/** "Experience" block for the settings pages (students, instructors and admins). */
const ExperienceSettingsCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="lx-card" style={{ marginBottom: 24 }}>
      <div className="lx-card-body">
        <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 4 }}>{t('experience.label', 'Experience')}</h5>
        <p style={{ fontSize: 13.5, color: 'var(--lx-text-muted)', margin: '0 0 14px' }}>
          {t('experience.settingsText', 'Choose how SARALÖWE is presented on this device: cinematic for large screens, or touch-first for your phone.')}
        </p>
        <ExperienceSwitch />
      </div>
    </div>
  );
};

export default ExperienceSettingsCard;
