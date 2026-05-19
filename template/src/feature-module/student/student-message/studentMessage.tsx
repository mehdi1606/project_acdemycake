import React from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import ChatPage from '../../common/ChatPage';
import { useSearchParams } from 'react-router-dom';

const StudentMessage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams();
  const initialParticipantId   = searchParams.get('userId')   ?? undefined;
  const initialParticipantName = searchParams.get('userName') ?? undefined;

  return (
    <LuxuryDashboardLayout>
      <ChatPage
        sidebar={null}
        profileCard={null}
        initialParticipantId={initialParticipantId}
        initialParticipantName={initialParticipantName}
      />
    </LuxuryDashboardLayout>
  );
};

export default StudentMessage;
