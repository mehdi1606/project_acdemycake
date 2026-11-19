import { useEffect, useState } from 'react';
import { getActivePromo, loadServerPromo, onPromoChange, Promo, PromoPhase, serverNow } from '../../config/promo';

export interface Countdown { h: string; m: string; s: string; done: boolean }

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

/** Re-render when the server offer has loaded / changed. */
function useServerPromo() {
  const [, bump] = useState(0);
  useEffect(() => {
    loadServerPromo();
    return onPromoChange(() => bump((n) => n + 1));
  }, []);
}

/**
 * The offer to show plus a ticking countdown (server clock):
 * phase "upcoming" counts down to the start, "live" counts down to the end.
 */
export function usePromo(): { promo: Promo | null; phase: PromoPhase | null; left: Countdown } {
  useServerPromo();
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const id = window.setInterval(() => setNow(serverNow()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const active = getActivePromo(now);
  const target = active ? Date.parse(active.phase === 'live' ? active.promo.endsAt : active.promo.startsAt) : 0;
  const total = active ? Math.max(0, Math.floor((target - now) / 1000)) : 0;
  return {
    promo: active?.promo ?? null,
    phase: active?.phase ?? null,
    left: { h: pad(Math.floor(total / 3600)), m: pad(Math.floor((total % 3600) / 60)), s: pad(total % 60), done: total <= 0 },
  };
}

/** Just "which offer is shown, and in which phase" — re-checked every 15 s (no per-second re-render for big pages). */
export function useActivePromo(): { promo: Promo; phase: PromoPhase } | null {
  useServerPromo();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 15000);
    return () => window.clearInterval(id);
  }, []);
  return getActivePromo();
}
