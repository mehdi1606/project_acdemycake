/**
 * Limited-time offers (Black Friday, Christmas…) — driven by the SERVER.
 *
 * The backend (app_settings: promo.*) decides the offer price, its window and its theme,
 * and charges the offer price only inside that window. This module just reads it from
 * GET /subscriptions/plans (with the server clock) so every visitor sees the same
 * countdown, whatever their device time:
 *   - "upcoming": the themed home page counts down to the START (normal price still applies)
 *   - "live":     it counts down to the END and shows the offer price
 *   - after the end nothing is shown and the normal price is back.
 *
 * Preview a theme before launch: add `?promo=blackfriday` or `?promo=christmas` to any
 * public URL (`?promo=off` stops it). Preview is visual only — it never changes the price.
 */
import subscriptionService from '../services/api/subscription.service';

export type PromoTheme = 'blackfriday' | 'christmas';
export type PromoPhase = 'upcoming' | 'live';

export interface Promo {
  id: string;
  theme: PromoTheme;
  startsAt: string;
  endsAt: string;
  /** Offer price and the usual price, in MAD. */
  price: number;
  was: number;
  plan: 'yearly';
  /** true = preview from ?promo=… (display only) */
  preview?: boolean;
}

/** Show the themed "starts in" page this long before an offer begins. */
const TEASER_MS = 48 * 3600 * 1000;

let serverPromo: Promo | null = null;
let clockOffset = 0; // server time − device time (ms)
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Fetch the offer from the server once (and refresh every 5 minutes). */
export function loadServerPromo(): Promise<void> {
  if (loading) return loading;
  loading = subscriptionService.getPlans().then((plans) => {
    const y = plans.find((p) => p.planId === 'yearly');
    if (y?.serverTime) {
      const t = Date.parse(y.serverTime);
      if (Number.isFinite(t)) clockOffset = t - Date.now();
    }
    serverPromo = y && y.promoId && y.promoStartsAt && y.promoEndsAt && y.promoPrice
      ? {
          id: y.promoId,
          theme: y.promoTheme === 'christmas' ? 'christmas' : 'blackfriday',
          startsAt: y.promoStartsAt,
          endsAt: y.promoEndsAt,
          price: Number(y.promoPrice),
          was: Number(y.regularPrice ?? y.price),
          plan: 'yearly',
        }
      : null;
  }).catch(() => { /* offline / API down → no offer shown */ })
    .finally(() => {
      loaded = true;
      listeners.forEach((fn) => fn());
      window.setTimeout(() => { loading = null; }, 5 * 60 * 1000);
    });
  return loading;
}

export const onPromoChange = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const promoLoaded = () => loaded;

/** Current time on the server's clock. */
export const serverNow = () => Date.now() + clockOffset;

const PREVIEW_KEY = 'sl_promo_preview';

/** `?promo=blackfriday|christmas` → visual preview of that theme, live for 24 h (this tab only). */
function previewPromo(): Promo | null {
  try {
    const q = new URLSearchParams(window.location.search).get('promo');
    if (q === 'off') { sessionStorage.removeItem(PREVIEW_KEY); return null; }
    let raw = sessionStorage.getItem(PREVIEW_KEY);
    if ((q === 'blackfriday' || q === 'christmas') && (!raw || JSON.parse(raw).theme !== q)) {
      raw = JSON.stringify({ theme: q, startedAt: Date.now() });
      sessionStorage.setItem(PREVIEW_KEY, raw);
    }
    if (!raw) return null;
    const { theme, startedAt } = JSON.parse(raw) as { theme: PromoTheme; startedAt: number };
    const base = serverPromo ?? { id: 'preview', price: 899, was: 1899 };
    return {
      id: `preview-${theme}`, theme, plan: 'yearly', preview: true,
      price: base.price, was: base.was,
      startsAt: new Date(startedAt).toISOString(),
      endsAt: new Date(startedAt + 24 * 3600 * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

/** The offer to show right now (teaser or live), with its phase; null when none. */
export function getActivePromo(now: number = serverNow()): { promo: Promo; phase: PromoPhase } | null {
  const preview = previewPromo();
  if (preview) return { promo: preview, phase: 'live' };
  const p = serverPromo;
  if (!p) return null;
  const start = Date.parse(p.startsAt), end = Date.parse(p.endsAt);
  if (now >= end) return null;
  if (now >= start) return { promo: p, phase: 'live' };
  if (start - now <= TEASER_MS) return { promo: p, phase: 'upcoming' };
  return null;
}

export const promoDiscountPercent = (p: Promo) => Math.round((1 - p.price / p.was) * 100);
