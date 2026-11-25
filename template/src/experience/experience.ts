/**
 * SARALÖWE experiences: "desktop" (cinematic, wide compositions) and "mobile"
 * (touch-first). One app, one backend, one account: the choice is stored in
 * this browser only (localStorage), so the same account can use Desktop on a
 * computer and Mobile on a phone at the same time.
 *
 * The decision is first taken by the boot script in public/index.html, before
 * anything paints. The helpers here read what it decided and apply a new choice
 * without a reload (same rules as the boot script, keep the two in sync).
 */
export type Experience = 'desktop' | 'mobile';

export const EXPERIENCE_KEY = 'sl_experience';
const html = () => document.documentElement;

export function storedExperience(): Experience | null {
  try {
    const v = localStorage.getItem(EXPERIENCE_KEY);
    return v === 'desktop' || v === 'mobile' ? v : null;
  } catch {
    return null;
  }
}

/** What this device should use, worked out at boot (touch screens under 820 px on their short side → mobile). */
export function recommendedExperience(): Experience {
  return html().getAttribute('data-exp-rec') === 'mobile' ? 'mobile' : 'desktop';
}

/** The experience in use on this page. */
export function currentExperience(): Experience {
  return html().classList.contains('exp-mobile') ? 'mobile' : 'desktop';
}

/** True while the entrance screen should be shown (no choice yet in this browser). */
export const needsChoice = () => html().classList.contains('exp-choose');
/** Mobile chosen on a computer: the app is shown inside a phone-sized stage. */
export const isStage = () => html().classList.contains('exp-stage');
/** This page is the app running inside that stage. */
export const isEmbedded = () => html().classList.contains('exp-embedded');

const isTouch = () =>
  !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 1;

/** Save a choice and apply it to this page (classes and viewport), without reloading. */
export function applyExperience(mode: Experience): void {
  try { localStorage.setItem(EXPERIENCE_KEY, mode); } catch { /* private mode: applies for this visit only */ }
  const el = html();
  el.classList.remove('exp-choose', 'exp-desktop', 'exp-mobile', 'exp-stage');
  el.classList.add(`exp-${mode}`);
  const s = window.screen || { width: 1280, height: 800 };
  const shortSide = Math.min(s.width, s.height);
  const vp = document.querySelector('meta[name=viewport]');
  if (vp) {
    vp.setAttribute('content', mode === 'desktop' && isTouch() && shortSide < 1024 ? 'width=1280' : 'width=device-width, initial-scale=1');
  }
  if (mode === 'mobile' && !isTouch() && window.innerWidth > 820) el.classList.add('exp-stage');
}

/** Switch experience from settings or a menu: the whole window starts again in the new one. */
export function switchExperience(mode: Experience): void {
  try { localStorage.setItem(EXPERIENCE_KEY, mode); } catch { /* ignore */ }
  const top = isEmbedded() ? window.top : window;
  (top || window).location.reload();
}

/** Forget the choice: the entrance screen is shown again. */
export function resetExperience(): void {
  try { localStorage.removeItem(EXPERIENCE_KEY); } catch { /* ignore */ }
  const top = isEmbedded() ? window.top : window;
  (top || window).location.reload();
}
