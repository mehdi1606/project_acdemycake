import React from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeDefinition, BadgeProgress, BadgeCheck, badgeChecks, badgeProgressPercent } from '../config/badges';

/** One requirement written out for a person ("Finish 2 courses", "Quiz average 60% or more"…). */
export const useCheckLabel = () => {
  const { t } = useTranslation();
  return (c: BadgeCheck) => {
    switch (c.kind) {
      case 'courses': return t('badges.req.courses', 'Finish {{count}} courses', { count: c.need });
      case 'quizAvg': return t('badges.req.quizAvg', 'Quiz average {{n}}% or more', { n: c.need });
      case 'days': return t('badges.req.days', 'Member for {{count}} days', { count: c.need });
      case 'masterclasses': return t('badges.req.masterclasses', 'Book {{count}} masterclass', { count: c.need });
      default: return '';
    }
  };
};

/** Short one-line summary of a level's requirements, e.g. "2 courses · 60% quizzes · 14 days". */
export const useRequirementSummary = () => {
  const { t } = useTranslation();
  return (badge: BadgeDefinition) => {
    const r = badge.req;
    if (!r || (!r.courses && !r.quizAvg && !r.days)) return t('badgeGuide.badge.startBadge', 'Starting badge — welcome!');
    const parts: string[] = [];
    if (r.courses) parts.push(t('badges.req.coursesShort', '{{count}} courses', { count: r.courses }));
    if (r.masterclasses) parts.push(t('badges.req.masterclassesShort', '{{count}} masterclass', { count: r.masterclasses }));
    if (r.quizAvg) parts.push(t('badges.req.quizShort', '{{n}}% quiz average', { n: r.quizAvg }));
    if (r.days) parts.push(t('badges.req.daysShort', '{{count}} days', { count: r.days }));
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

/** Checklist of everything the next gemstone needs, with the student's numbers (dark panels). */
const BadgeRequirementList: React.FC<Props> = ({ next, current, progress }) => {
  const { t } = useTranslation();
  const label = useCheckLabel();
  const checks = badgeChecks(next, progress);
  const pct = badgeProgressPercent(next, progress);

  const have = (c: BadgeCheck) => {
    if (c.kind === 'quizAvg') {
      return (progress.quizzesTaken ?? 0) > 0
        ? t('badges.req.yourAvg', 'yours: {{n}}%', { n: c.have })
        : t('badges.req.noQuizYet', 'no quiz yet');
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
          {t('badges.popup.nextLevel', 'Next Level')}
        </span>
        <span style={{ color: next.color, fontSize: 12, fontWeight: 700 }}>
          {t(next.nameKey)} · {t(next.gemKey)}
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
