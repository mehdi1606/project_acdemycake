import React from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { useTranslation } from 'react-i18next';

const InstructorReviews = () => {
  const { t } = useTranslation();
  return (
    <LuxuryDashboardLayout>
      <div style={{ padding: 32 }}>
        <h2>{t('instructor.sidebar.reviews', 'Reviews')}</h2>
        <p>{t('common.comingSoon', 'This feature is coming soon.')}</p>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default InstructorReviews;
