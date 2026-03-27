import React from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import ChatPage from '../../common/ChatPage';

const Sidebar = () => (
  <div style={{ padding: 16 }}>
    <h6 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>Contacts</h6>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {['Instructor 1', 'Instructor 2', 'Support Team'].map((name) => (
        <div
          key={name}
          style={{
            padding: '10px 14px', borderRadius: 'var(--lx-radius-sm)',
            background: 'rgba(107, 29, 42, 0.03)', border: '1px solid rgba(107, 29, 42, 0.05)',
            fontSize: 13, color: 'var(--lx-text-mid)', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 29, 42, 0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(107, 29, 42, 0.03)'; }}
        >
          {name}
        </div>
      ))}
    </div>
  </div>
);

const StudentMessage: React.FC = () => {
  return (
    <LuxuryDashboardLayout>
      <ChatPage sidebar={<Sidebar />} profileCard={null} />
    </LuxuryDashboardLayout>
  );
};

export default StudentMessage;
