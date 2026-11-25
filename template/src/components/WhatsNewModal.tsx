import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../core/redux/hooks';
import { BADGES } from '../config/badges';
import { LATEST_RELEASE, OPEN_WHATS_NEW_EVENT, PatchTag } from '../config/whatsNew';
import { OPEN_BADGE_GUIDE_EVENT } from './BadgeGuide';
import './whats-new.css';

const SEEN_PREFIX = 'sl_whats_new_seen_';

/** Pages where an announcement must never interrupt (player, quizzes, checkout, payment). */
const quietPage = (p: string) =>
  /course-watch|quiz|checkout|payment|\/cart|ebooks\/[^/]+\/read/i.test(p);

/**
 * "What's new" patch notes: shown once per release to each signed-in user, a moment
 * after the page settles and never on top of another dialog; reopenable from the menu.
 */
const WhatsNewModal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const goRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const release = LATEST_RELEASE;
  const seenKey = user ? `${SEEN_PREFIX}${user.id}_${release.id}` : '';
  const role = (user?.role || 'STUDENT') as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

  // First visit after the update → show once.
  useEffect(() => {
    if (!isAuthenticated || !user || quietPage(pathname)) return;
    let seen = false;
    try { seen = !!localStorage.getItem(seenKey); } catch { seen = true; }
    if (seen) return;
    let timer: number;
    const dialogOpen = () => !!document.querySelector('.modal.show, [role="dialog"], [aria-modal="true"]');
    const tryOpen = () => { if (dialogOpen()) timer = window.setTimeout(tryOpen, 1500); else setOpen(true); };
    timer = window.setTimeout(tryOpen, 1400);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, user, seenKey, pathname]);

  // Reopen from the profile menu.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_WHATS_NEW_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WHATS_NEW_EVENT, onOpen);
  }, []);

  const close = useCallback(() => {
    try { if (seenKey) localStorage.setItem(seenKey, '1'); } catch { /* storage blocked */ }
    setOpen(false);
  }, [seenKey]);

  // Open at the top (the header) and focus the main button without scrolling down to it.
  useEffect(() => {
    if (!open) return;
    boxRef.current?.scrollTo({ top: 0 });
    goRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || !user) return null;

  const items = release.items.filter((it) => !it.audience || it.audience.includes(role));
  const tagLabel = (tag: PatchTag) => ({
    new: t('whatsNew.tag.new', 'New'),
    changed: t('whatsNew.tag.changed', 'Changed'),
    improved: t('whatsNew.tag.improved', 'Improved'),
    admin: t('whatsNew.tag.admin', 'Admin'),
  }[tag]);
  const date = new Date(release.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="sl-wn-overlay" onClick={close}>
      <div ref={boxRef} className="sl-wn" role="dialog" aria-modal="true" aria-labelledby="sl-wn-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sl-wn__close" onClick={close} aria-label={t('common.close', 'Close')}>✕</button>

        <header className="sl-wn__head">
          <span className="sl-wn__ribbon">{t('whatsNew.patch', 'Patch')} {release.version}</span>
          <h2 id="sl-wn-title" className="sl-wn__title">{t(release.nameKey, release.name)}</h2>
          <p className="sl-wn__sub">{t('whatsNew.sub', "What's new on SARALÖWE Academy")} · {date}</p>
        </header>

        <ol className="sl-wn__list">
          {items.map((it) => (
            <li key={it.titleKey} className="sl-wn__item">
              <span className="sl-wn__icon" aria-hidden="true"><i className={`isax ${it.icon}`} /></span>
              <div className="sl-wn__body">
                <div className="sl-wn__line">
                  <span className={`sl-wn__tag sl-wn__tag--${it.tag}`}>{tagLabel(it.tag)}</span>
                  <strong>{t(it.titleKey, it.title)}</strong>
                </div>
                <p>{t(it.textKey, it.text)}</p>
                {it.showBadges && (
                  <div className="sl-wn__badges" aria-hidden="true">
                    {BADGES.slice(0, 7).map((b) => (
                      <img key={b.id} src={b.image} alt="" width={34} height={34} title={t(b.nameKey)} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <footer className="sl-wn__foot">
          {role === 'STUDENT' && (
            <button
              type="button"
              className="sl-wn__btn sl-wn__btn--ghost"
              onClick={() => { close(); window.setTimeout(() => window.dispatchEvent(new CustomEvent(OPEN_BADGE_GUIDE_EVENT)), 50); }}
            >
              {t('whatsNew.seeBadge', 'See my badge')}
            </button>
          )}
          <button ref={goRef} type="button" className="sl-wn__btn" onClick={close}>
            {t('whatsNew.letsGo', "Let's go")}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default WhatsNewModal;
