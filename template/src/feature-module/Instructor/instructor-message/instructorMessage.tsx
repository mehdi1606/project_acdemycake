import React from 'react';
import { useSearchParams } from 'react-router-dom';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import ChatPage from '../../common/ChatPage';

const InstructorMessage = () => {
  const [searchParams] = useSearchParams();
  const initialParticipantId   = searchParams.get('studentId')   ?? undefined;
  const initialParticipantName = searchParams.get('studentName') ?? undefined;

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

export default InstructorMessage;
