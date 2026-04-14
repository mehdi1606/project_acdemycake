import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import SettingsLinks from '../settingsLinks/settingsLinks';
import { message } from 'antd';
import profileService from '../../../../services/api/profile.service';
import { extractApiError } from '../../../../services/api/error.utils';

interface NotifItem {
  id: string;
  title: string;
  description: string;
}

const generalNotifs: NotifItem[] = [
  { id: 'subscriptions',    title: 'Subscriptions',          description: "Notify me about activity from profiles I'm subscribed to" },
  { id: 'recommendedCourses', title: 'Recommended Courses', description: 'Notify me about courses that suit me' },
  { id: 'replyToComments',  title: 'Reply to my comments',  description: 'Notify me about replies for my comments' },
  { id: 'activityComments', title: 'Activity on my comments', description: 'Notify me about activity on my comments' },
];

const emailNotifs: NotifItem[] = [
  { id: 'coursesActivity',       title: 'Courses Activity',              description: 'Send me emails about my courses activity and updates I request' },
  { id: 'promotions',            title: 'Promotions & Recommendations',  description: 'Send me emails about my courses promotions and recommendations' },
  { id: 'courseComments',        title: 'Course Comments',               description: 'Get notified about comments on your posts and replies to your comments' },
  { id: 'courseReminders',       title: 'Course Reminders',              description: 'Receive booking assistance reminders to stay updated on your scheduled sessions' },
  { id: 'systemUpdates',         title: 'System Updates',                description: 'Send me emails about updates to the academy platform' },
];

const defaultToggles: Record<string, boolean> = {
  subscriptions: true, recommendedCourses: true, replyToComments: false, activityComments: false,
  coursesActivity: true, promotions: true, courseComments: false, courseReminders: false, systemUpdates: false,
};

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    style={{
      width: 44, height: 24, borderRadius: 12, padding: 2,
      border: 'none', cursor: 'pointer', flexShrink: 0,
      background: checked ? 'var(--lx-primary)' : 'rgba(107, 29, 42, 0.12)',
      transition: 'background 0.2s ease',
      display: 'flex', alignItems: 'center',
      justifyContent: checked ? 'flex-end' : 'flex-start',
    }}
  >
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'all 0.2s ease' }} />
  </button>
);

const StudentNotification = () => {
  const [toggles, setToggles] = useState<Record<string, boolean>>(defaultToggles);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const raw = await profileService.getNotificationPreferences();
      // raw is treated as a JSON string from the backend
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setToggles((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Use defaults silently if no preferences saved yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  const toggle = (id: string) => setToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAllGroup = (items: NotifItem[]) => {
    const allOn = items.every((n) => toggles[n.id]);
    setToggles((prev) => {
      const next = { ...prev };
      items.forEach((n) => { next[n.id] = !allOn; });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.updateNotificationPreferences(toggles as any);
      message.success('Notification preferences saved');
    } catch (err) {
      message.error(extractApiError(err, 'Failed to save preferences'));
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (title: string, icon: string, items: NotifItem[]) => (
    <div className="lx-card" style={{ marginBottom: 20 }}>
      <div className="lx-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--lx-radius-sm)', background: 'rgba(107, 29, 42, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`isax ${icon}`} style={{ fontSize: 16, color: 'var(--lx-primary)' }} />
          </div>
          <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>{title}</h6>
        </div>
        <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" onClick={() => toggleAllGroup(items)}>
          Toggle all
        </button>
      </div>
      <div className="lx-card-body" style={{ padding: 0 }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', gap: 16,
              borderBottom: idx < items.length - 1 ? '1px solid rgba(107, 29, 42, 0.04)' : 'none',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 29, 42, 0.015)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h6 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>{item.title}</h6>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.4 }}>{item.description}</p>
            </div>
            <ToggleSwitch checked={toggles[item.id] ?? false} onChange={() => toggle(item.id)} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 20 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Settings</h5>
      </div>
      <SettingsLinks />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {renderSection('General Notifications', 'isax-notification', generalNotifs)}
          {renderSection('Email Notifications', 'isax-sms', emailNotifs)}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="lx-btn lx-btn-gold" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentNotification;
