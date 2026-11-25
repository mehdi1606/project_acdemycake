/**
 * Seasonal theme switch. Christmas runs from 20 November to 7 January (same
 * window as the winter edition of the home intro). `?xmas=on|off` forces it
 * for the current browser tab, handy for checking the look out of season.
 */
const KEY = 'sl_xmas_override';

export function isChristmasSeason(d: Date = new Date()): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('xmas');
    if (q === 'on' || q === 'off') sessionStorage.setItem(KEY, q);
    const o = sessionStorage.getItem(KEY);
    if (o === 'on') return true;
    if (o === 'off') return false;
  } catch { /* storage blocked: fall back to the date */ }
  const m = d.getMonth(), day = d.getDate();
  return (m === 10 && day >= 20) || m === 11 || (m === 0 && day <= 7);
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
