import { useEffect, useState } from 'react';
import { challengeService, ChallengePhase, ChallengeView } from '../../services/api/challenge.service';

/**
 * The challenge advertised across the platform, loaded once and shared.
 * The phase is worked out from the server's dates and the server clock
 * (corrected for the visitor's clock skew), so it flips at the right second
 * even on a page left open, whatever time the visitor's device shows.
 */
let cache: ChallengeView | null | undefined;
let skewMs = 0;
let inflight: Promise<void> | null = null;
let loadedAt = 0;
const listeners = new Set<() => void>();

function load(force = false): Promise<void> {
  if (inflight) return inflight;
  if (!force && cache !== undefined && Date.now() - loadedAt < 5 * 60_000) return Promise.resolve();
  inflight = challengeService.current()
    .then((c) => {
      cache = c ?? null;
      if (c) skewMs = Date.parse(c.serverNow) - Date.now();
      loadedAt = Date.now();
      listeners.forEach((l) => l());
    })
    .catch(() => { if (cache === undefined) cache = null; })
    .finally(() => { inflight = null; });
  return inflight;
}

export const refreshChallenge = () => load(true);
export const serverNow = () => Date.now() + skewMs;

export function phaseAt(c: ChallengeView, now = serverNow()): ChallengePhase {
  if (c.phase === 'CLOSED') return 'CLOSED';
  const t = (s: string) => Date.parse(s);
  if (now < t(c.submissionsOpenAt)) return 'UPCOMING';
  if (now <= t(c.submissionsCloseAt)) return 'SUBMISSIONS';
  if (now < t(c.votingOpenAt)) return 'BETWEEN';
  if (now <= t(c.votingCloseAt)) return 'VOTING';
  if (now < t(c.resultsAt)) return 'TALLYING';
  return 'RESULTS';
}

/** The next date that matters in this phase, for the countdown. */
export function nextMilestone(c: ChallengeView, phase: ChallengePhase): string | null {
  switch (phase) {
    case 'UPCOMING': return c.submissionsOpenAt;
    case 'SUBMISSIONS': return c.submissionsCloseAt;
    case 'BETWEEN': return c.votingOpenAt;
    case 'VOTING': return c.votingCloseAt;
    case 'TALLYING': return c.resultsAt;
    default: return null;
  }
}

export interface Left { d: number; h: string; m: string; s: string; done: boolean }
const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

export function timeLeft(target: string | null, now = serverNow()): Left {
  const total = target ? Math.max(0, Math.floor((Date.parse(target) - now) / 1000)) : 0;
  return {
    d: Math.floor(total / 86400),
    h: pad(Math.floor((total % 86400) / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
    done: total <= 0,
  };
}

/**
 * Day label in Morocco local time. Morocco is on UTC+0 this winter and the
 * deadlines are stored as +00, so UTC gives the exact Moroccan date.
 */
export function moroccoDate(iso: string, lang: string, withYear = false): string {
  const l = lang?.startsWith('ar') ? 'ar-MA' : lang?.startsWith('fr') ? 'fr-FR' : 'en-GB';
  return new Intl.DateTimeFormat(l, { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
    .format(new Date(iso));
}

/**
 * The current challenge and its live phase. `tick` (ms) re-renders for countdowns;
 * leave it at the default for banners that only need the phase.
 */
export function useChallenge(tick = 15_000): { challenge: ChallengeView | null; phase: ChallengePhase | null; left: Left } {
  const [, bump] = useState(0);
  useEffect(() => {
    const on = () => bump((n) => n + 1);
    listeners.add(on);
    load();
    const id = window.setInterval(on, tick);
    return () => { listeners.delete(on); window.clearInterval(id); };
  }, [tick]);
  const c = cache ?? null;
  const now = serverNow();
  if (!c || now >= Date.parse(c.bannerUntil)) return { challenge: null, phase: null, left: timeLeft(null) };
  const phase = phaseAt(c, now);
  return { challenge: c, phase, left: timeLeft(nextMilestone(c, phase), now) };
}
