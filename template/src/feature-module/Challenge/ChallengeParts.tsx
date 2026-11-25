/** Pieces shared by the challenge page and each cake's own page. */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../router/all_routes';
import { EntryCard } from '../../services/api/challenge.service';

export const SLUG = 'new-year-cake-2027';

/* ── vote button ───────────────────────────────────────────────────────────── */
export const VoteButton: React.FC<{
  card: EntryCard; phase: string | null; voted: boolean; own: boolean; busy: boolean;
  isAuthenticated: boolean; emailVerified: boolean; onVote: () => void;
}> = ({ phase, voted, own, busy, isAuthenticated, emailVerified, onVote }) => {
  const { t } = useTranslation();
  const location = useLocation();
  if (phase !== 'VOTING') return null;
  if (own) return <span className="ch-vote ch-vote--own">{t('challenge.yourCake', 'Your cake')}</span>;
  if (!isAuthenticated) {
    return <Link className="ch-vote" to={all_routes.login} state={{ from: `${location.pathname}#ch-gallery` }}>{t('challenge.signInToVote', 'Sign in to vote')}</Link>;
  }
  if (!emailVerified) return <span className="ch-vote ch-vote--off" title={t('challenge.verifyToVote', 'Confirm your email to vote')}>{t('challenge.verifyShort', 'Confirm email')}</span>;
  return (
    <button type="button" className={`ch-vote${voted ? ' is-voted' : ''}`} onClick={onVote} disabled={busy} aria-pressed={voted}>
      <span aria-hidden="true">{voted ? '★' : '☆'}</span> {voted ? t('challenge.voted', 'Voted') : t('challenge.vote', 'Vote')}
    </button>
  );
};

