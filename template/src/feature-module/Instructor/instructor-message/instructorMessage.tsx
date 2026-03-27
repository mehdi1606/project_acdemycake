import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { useSearchParams } from 'react-router-dom';



import ChatPage from '../../common/ChatPage';

const InstructorMessage = () => {
  const [searchParams] = useSearchParams();
  const initialParticipantId = searchParams.get('studentId') ?? undefined;
  const initialParticipantName = searchParams.get('studentName') ?? undefined;

  return (
    <>
      <div className="content">
        <div className="container">
          <ChatPage
            sidebar={<div />}
            profileCard={null}
            initialParticipantId={initialParticipantId}
            initialParticipantName={initialParticipantName}
          />
        </div>
      </div>
    </>
  );
};

export default InstructorMessage;
