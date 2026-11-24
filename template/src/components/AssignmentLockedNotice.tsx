import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AssignmentRequirement } from '../services/api/types';
import { all_routes } from '../feature-module/router/all_routes';

/**
 * Shown while an assignment is locked: the student must first finish every course it belongs
 * to — all lessons and every published quiz. Lists what is still missing, per course.
 */
const AssignmentLockedNotice: React.FC<{ missing: AssignmentRequirement[]; compact?: boolean }> = ({ missing, compact }) => {
  const { t, i18n } = useTranslation();
  const ar = (i18n.language || '').startsWith('ar');

  return (
    <div style={{
      padding: compact ? '10px 14px' : '14px 18px', borderRadius: 10,
      background: 'rgba(107,29,42,0.05)', border: '1px solid rgba(107,29,42,0.14)',
      fontSize: 13, color: '#5b2433',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
        <i className="fa-solid fa-lock" />
        {t('assignmentLock.title', 'Finish these courses to unlock this assignment')}
      </div>
      <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.8 }}>
        {missing.map(m => {
          const title = (ar && m.courseTitleAr) ? m.courseTitleAr : m.courseTitle;
          const parts: string[] = [];
          if (m.noAccess) parts.push(t('assignmentLock.noAccess', 'you need access to this course'));
          if (m.lessonsLeft > 0) parts.push(t('assignmentLock.lessonsLeft', '{{count}} lesson(s) left', { count: m.lessonsLeft }));
          if (m.quizzesLeft > 0) parts.push(t('assignmentLock.quizzesLeft', '{{count}} quiz(zes) to pass', { count: m.quizzesLeft }));
          return (
            <li key={m.courseId}>
              {m.courseSlug && !m.noAccess ? (
                <Link to={`${all_routes.courseWatch}/${m.courseSlug}`} style={{ fontWeight: 700, color: '#651C32' }} dir="auto">{title}</Link>
              ) : m.courseSlug ? (
                <Link to={`${all_routes.courseDetails}/${m.courseSlug}`} style={{ fontWeight: 700, color: '#651C32' }} dir="auto">{title}</Link>
              ) : (
                <strong dir="auto">{title}</strong>
              )}
              {' — '}{parts.join(' · ')}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AssignmentLockedNotice;
