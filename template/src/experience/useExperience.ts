import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { currentExperience, Experience, isEmbedded } from './experience';

/** The experience of this page load (it only changes with a reload). */
export function useExperience(): Experience {
  return currentExperience();
}

/**
 * The mobile presentation is used in the mobile experience, and also in the
 * desktop experience when the window itself is too narrow for the desktop one.
 */
export function useMobilePresentation(): boolean {
  const query = '(max-width: 991.98px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return currentExperience() === 'mobile' || narrow;
}

/** Inside the phone stage: keep the real address bar on the page shown in the frame. */
export function useStageAddressSync(): void {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (!isEmbedded()) return;
    try {
      window.top?.history.replaceState(null, '', `${pathname}${search}${hash}`);
      if (window.top) window.top.document.title = document.title;
    } catch { /* not same-origin: nothing to sync */ }
  }, [pathname, search, hash]);
}
