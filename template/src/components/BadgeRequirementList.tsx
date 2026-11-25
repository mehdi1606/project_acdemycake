import React from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeDefinition, BadgeProgress, BadgeCheck, badgeChecks, badgeProgressPercent } from '../config/badges';

/** One requirement written out for a person ("Earn 2 certificates", "Quiz average 75% or more"…). */
export const useCheckLabel = () => {
  const { t } = useTranslation();
  return (c: BadgeCheck) => {
    const n = c.need;
    switch (c.kind) {
      case 'emailVerified':     return t('badges.req.emailVerified', 'Verify your email address');
      case 'enrolledCourses':   return t('badges.req.enrolledCourses', 'Join your first course', { count: n });
      case 'completedLessons':  return t('badges.req.completedLessons', 'Finish your first lesson', { count: n });
      case 'certificates':      return t('badges.req.certificates', 'Earn {{count}} certificates (every lesson, every quiz, assignment 70%+)', { count: n });
      case 'quizAvg':           return t('badges.req.quizAvg', 'Quiz average {{n}}% or more', { n });
      case 'activeWeeks':       return t('badges.req.activeWeeks', 'Learn in {{count}} different weeks', { count: n });
      case 'bestAssignment':    return t('badges.req.bestAssignment', 'Get {{n}}% or more on one assignment', { n });
      case 'avgAssignment':     return t('badges.req.avgAssignment', 'Assignment average {{n}}% or more', { n });
      case 'shareOrReview':     return t('badges.req.shareOrReview', '{{count}} community posts or course reviews', { count: n });
      case 'contributions':     return t('badges.req.contributions', '{{count}} community posts or answers', { count: n });
      case 'masterclasses':     return t('badges.req.masterclasses', 'Join {{count}} masterclasses', { count: n });
      case 'liveMasterclasses': return t('badges.req.liveMasterclasses', 'Including 1 live masterclass in the atelier', { count: n });
      case 'days':              return t('badges.req.days', 'Member for {{count}} days', { count: n });
      case 'chefApproval':      return t('badges.req.chefApproval', 'Your signature showpiece approved by Chef Sara');
      default:                  return '';
    }
  };
};

/** Short one-line summary of a level's requirements, for the badge guide slides. */
export const useRequirementSummary = () => {
  const { t } = useTranslation();
  return (badge: BadgeDefinition) => {
    const r = badge.req;
    if (!r) return '';
    if (badge.id === 1) return t('badges.req.summaryApprentice', 'Verify your email · join a course · finish a lesson');
    const parts: string[] = [];
    if (r.certificates) parts.push(t('badges.req.certificatesShort', '{{count}} certificates', { count: r.certificates }));
    if (r.quizAvg) parts.push(t('badges.req.quizShort', 'quizzes {{n}}%', { n: r.quizAvg }));
    if (r.bestAssignment) parts.push(t('badges.req.bestAssignmentShort', 'one assignment {{n}}%', { n: r.bestAssignment }));
    if (r.avgAssignment) parts.push(t('badges.req.avgAssignmentShort', 'assignments {{n}}%', { n: r.avgAssignment }));
    if (r.activeWeeks) parts.push(t('badges.req.activeWeeksShort', '{{count}} active weeks', { count: r.activeWeeks }));
    if (r.shareOrReview) parts.push(t('badges.req.shareShort', '{{count}} posts or reviews', { count: r.shareOrReview }));
    if (r.contributions) parts.push(t('badges.req.contributionsShort', '{{count}} contributions', { count: r.contributions }));
    if (r.masterclasses) parts.push(t('badges.req.masterclassesShort', '{{count}} masterclasses', { count: r.masterclasses }));
    if (r.days) parts.push(r.days % 365 === 0
      ? t('badges.req.yearsShort', '{{count}} years', { count: r.days / 365 })
      : t('badges.req.monthsShort', '{{count}} months', { count: Math.round(r.days / 30) }));
    if (r.chefApproval) parts.push(t('badges.req.chefShort', "chef's approval"));
    return parts.join(' · ');
  };
};

interface Props {
  /** The level the student is working towards */
  next: BadgeDefinition;
  /** Their current level (for the bar's starting colour) */
  current: BadgeDefinition;
  progress: BadgeProgress;
}

/** Checklist of everything the next level needs, with the student's numbers (dark panels). */
const BadgeRequirementList: React.FC<Props> = ({ next, current, progress }) => {
  const { t } = useTranslation();
  const label = useCheckLabel();
  const checks = badgeChecks(next, progress);
  const pct = badgeProgressPercent(next, progress);

  const have = (c: BadgeCheck) => {
    if (c.kind === 'emailVerified' || c.kind === 'chefApproval') {
      return t('badges.req.notYet', 'not yet');
    }
    if (c.kind === 'quizAvg') {
      return (progress.quizzesTaken ?? 0) > 0
        ? t('badges.req.yours', 'yours: {{n}}%', { n: c.have })
        : t('badges.req.noQuizYet', 'no quiz yet');
    }
    if (c.kind === 'bestAssignment' || c.kind === 'avgAssignment') {
      return (progress.gradedAssignments ?? 0) > 0
        ? t('badges.req.yours', 'yours: {{n}}%', { n: c.have })
        : t('badges.req.noMarkYet', 'no mark yet');
    }
    return `${Math.min(c.have, c.need)}/${c.need}`;
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '14px 16px', textAlign: 'start',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
          {next.id === current.id ? t('badges.req.toEarn', 'To earn') : t('badges.popup.nextLevel', 'Next Level')}
        </span>
        <span style={{ color: next.color, fontSize: 12, fontWeight: 700 }}>
          {t(next.nameKey)}{next.mottoKey ? ` · ${t(next.mottoKey)}` : ''}
        </span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 100, height: 6, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          height: '100%', borderRadius: 100, width: `${pct}%`, transition: 'width 1s ease',
          background: `linear-gradient(90deg, ${current.color}, ${next.color})`,
        }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, margin: '0 0 8px' }}>
        {t('badges.req.allNeeded', 'You need all of these:')}
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 7 }}>
        {checks.map((c) => (
          <li key={c.kind} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: c.met ? '#fff' : 'rgba(255,255,255,0.75)' }}>
            <span aria-hidden="true" style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
              background: c.met ? '#1f9d6a' : 'transparent', color: '#fff',
              border: c.met ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
            }}>{c.met ? '✓' : ''}</span>
            <span style={{ flex: 1 }}>{label(c)}</span>
            <span style={{ fontSize: 11.5, color: c.met ? '#6ee7b7' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
              {c.met ? t('badges.req.done', 'done') : have(c)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BadgeRequirementList;
