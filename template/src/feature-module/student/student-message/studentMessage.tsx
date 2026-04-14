import React from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import ChatPage from '../../common/ChatPage';
import { useSearchParams } from 'react-router-dom';

const StudentMessage: React.FC = () => {
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
