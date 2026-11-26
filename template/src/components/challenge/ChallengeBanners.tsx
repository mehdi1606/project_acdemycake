/**
 * The challenge, advertised across the platform (like the Black Friday offer):
 *  - ChallengeSeal: a small gold medallion with the countdown, on every page
 *  - ChallengeDashboardCard: a banner at the top of every dashboard
 *  - ChallengeHomeSection: a section on the home page
 *  - ChallengePopup: shown once per phase to each visitor
 * Each one follows the phase (entries → voting → counting → winners) by itself.
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../feature-module/router/all_routes';
import { ChallengePhase, ChallengeView } from '../../services/api/challenge.service';
import { Left, moroccoDate, useChallenge } from './useChallenge';
import { claimPopupSlot } from '../../core/common/popupGate';
import './challenge-banners.css';

/** Pages where nothing should float over the work. */
const quiet = (p: string) =>
  p.startsWith(all_routes.challenge) ||
  /^\/(login|register|forgot-password|reset-password|verify-email)/.test(p) ||
  /checkout|payment|cart|course-watch|ebooks\/.+\/read/.test(p);

function useCopy(c: ChallengeView | null, phase: ChallengePhase | null) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  if (!c || !phase) return null;
  switch (phase) {
    case 'UPCOMING':
    case 'SUBMISSIONS':
      return {
        tag: t('challenge.b.tag', 'New Year Cake Challenge'),
        title: t('challenge.b.subTitle', 'Bake the cake of the new year'),
        line: t('challenge.b.subLine', { date: moroccoDate(c.submissionsCloseAt, lang), defaultValue: 'Entries are open until {{date}}. Free, one tier, open to every student.' }),
        cta: t('challenge.b.subCta', 'Enter the challenge'),
        clock: true,
      };
    case 'BETWEEN':
    case 'VOTING':
      return {
        tag: t('challenge.b.tag', 'New Year Cake Challenge'),
        title: t('challenge.b.voteTitle', 'Voting is open'),
        line: t('challenge.b.voteLine', { date: moroccoDate(c.votingCloseAt, lang), defaultValue: 'Choose your favourite cakes until {{date}}. Every vote counts.' }),
        cta: t('challenge.b.voteCta', 'Vote now'),
        clock: true,
      };
    case 'TALLYING':
      return {
        tag: t('challenge.b.tag', 'New Year Cake Challenge'),
        title: t('challenge.b.countTitle', 'Votes are being counted'),
        line: t('challenge.b.countLine', { date: moroccoDate(c.resultsAt, lang), defaultValue: 'The winners will be announced on {{date}}.' }),
        cta: t('challenge.b.countCta', 'See the ranking'),
        clock: true,
      };
    case 'RESULTS':
      return {
        tag: t('challenge.b.tag', 'New Year Cake Challenge'),
        title: t('challenge.b.resTitle', 'The winners are announced'),
        line: t('challenge.b.resLine', 'Discover the champions of the New Year Cake Challenge 2027.'),
        cta: t('challenge.b.resCta', 'See the winners'),
        clock: false,
      };
    default:
      return null;
  }
}

const Clock: React.FC<{ left: Left; compact?: boolean }> = ({ left, compact }) => {
  const { t } = useTranslation();
  if (left.done) return null;
  return (
    <span className={`slc-clock${compact ? ' slc-clock--compact' : ''}`} role="timer">
      {left.d > 0 && <><b>{left.d}</b>{t('challenge.dShort', 'd')} </>}
      <b>{left.h}</b>:<b>{left.m}</b>:<b>{left.s}</b>
    </span>
  );
};

/* ── floating gold seal ───────────────────────────────────────────────────── */
export const ChallengeSeal: React.FC = () => {
  const { pathname } = useLocation();
  const { challenge, phase, left } = useChallenge(1000);
  const copy = useCopy(challenge, phase);
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem('slc_seal_hidden') === '1'; } catch { return false; }
  });
  const onDashboard = /^\/(student|instructor|admin)\//.test(pathname);
  if (!copy || hidden || quiet(pathname) || onDashboard) return null;
  return (
    <div className="slc-seal">
      <Link to={all_routes.challenge} className="slc-seal__link" aria-label={`${copy.tag}: ${copy.title}`}>
        <span className="slc-seal__medal" aria-hidden="true"><span>2027</span></span>
        <span className="slc-seal__text">
          <small>{copy.title}</small>
          {copy.clock ? <Clock left={left} compact /> : <b>{copy.cta}</b>}
        </span>
      </Link>
      <button type="button" className="slc-seal__x" aria-label="✕" onClick={() => {
        setHidden(true);
        try { sessionStorage.setItem('slc_seal_hidden', '1'); } catch { /* ignore */ }
      }}>✕</button>
    </div>
  );
};

/* ── dashboard banner ─────────────────────────────────────────────────────── */
export const ChallengeDashboardCard: React.FC = () => {
  const { challenge, phase, left } = useChallenge(1000);
  const copy = useCopy(challenge, phase);
  if (!copy) return null;
  return (
    <Link to={all_routes.challenge} className="slc-dash">
      <span className="slc-dash__sky" aria-hidden="true" />
      <span className="slc-dash__year" aria-hidden="true">2027</span>
      <span className="slc-dash__body">
        <span className="slc-tag">{copy.tag}</span>
        <strong>{copy.title}</strong>
        <span className="slc-dash__line">{copy.line}</span>
      </span>
      {copy.clock && <Clock left={left} />}
      <span className="slc-dash__cta">{copy.cta} <span aria-hidden="true">→</span></span>
    </Link>
  );
};

/* ── home page section ───────────────────────────────────────────────────── */
export const ChallengeHomeSection: React.FC = () => {
  const { challenge, phase, left } = useChallenge(1000);
  const copy = useCopy(challenge, phase);
  if (!copy) return null;
  return (
    <section className="slc-home">
      <div className="slc-home__media">
        <span className="slc-sparkles" aria-hidden="true" />
        <span className="slc-home__year" aria-hidden="true">2027</span>
      </div>
      <div className="slc-home__body">
        <span className="slc-tag">{copy.tag}</span>
        <h2>{copy.title}</h2>
        <p>{copy.line}</p>
        {copy.clock && <Clock left={left} />}
        <Link to={all_routes.challenge} className="slc-btn">{copy.cta}</Link>
      </div>
    </section>
  );
};

/* ── once-per-phase popup ─────────────────────────────────────────────────── */
export const ChallengePopup: React.FC = () => {
  const { pathname } = useLocation();
  const { challenge, phase, left } = useChallenge(1000);
  const copy = useCopy(challenge, phase);
  const key = challenge && phase ? `slc_popup_${challenge.slug}_${phase}` : '';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!key || quiet(pathname)) return;
    let seen = false;
    try { seen = !!localStorage.getItem(key); } catch { seen = true; }
    if (seen) return;
    // Wait politely: never on top of the "What's new" notes or another dialog.
    const id = window.setInterval(() => {
      if (document.querySelector('.sl-wn-overlay, [role="dialog"][aria-modal="true"]')) return;
      window.clearInterval(id);
      if (claimPopupSlot(key)) setShow(true);
    }, 3500);
    return () => window.clearInterval(id);
  }, [key, pathname]);

  const close = () => {
    setShow(false);
    try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const { t } = useTranslation();
  if (!show || !copy || quiet(pathname)) return null;
  return (
    <div className="slc-pop" role="dialog" aria-modal="true" aria-label={copy.tag} onClick={close}>
      <div className="slc-pop__box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="slc-pop__x" onClick={close} aria-label={t('challenge.close', 'Close')}>✕</button>
        <div className="slc-pop__media">
          <span className="slc-sparkles" aria-hidden="true" />
          <span className="slc-pop__year" aria-hidden="true">2027</span>
        </div>
        <div className="slc-pop__body">
          <span className="slc-tag">{copy.tag}</span>
          <h2>{copy.title}</h2>
          <p>{copy.line}</p>
          {copy.clock && <Clock left={left} />}
          <div className="slc-pop__actions">
            <Link to={all_routes.challenge} className="slc-btn" onClick={close}>{copy.cta}</Link>
            <button type="button" className="slc-later" onClick={close}>{t('challenge.later', 'Later')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
