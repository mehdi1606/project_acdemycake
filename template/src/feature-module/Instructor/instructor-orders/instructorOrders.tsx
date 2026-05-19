import React from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { useTranslation } from 'react-i18next';

const InstructorOrders = () => {
  const { t } = useTranslation();
  return (
    <LuxuryDashboardLayout>
      <div style={{ padding: 32 }}>
        <h2>{t('student.orders.title', 'Orders')}</h2>
        <p>{t('common.comingSoon', 'This feature is coming soon.')}</p>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default InstructorOrders;
