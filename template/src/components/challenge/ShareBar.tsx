/**
 * Share a cake (or the challenge): WhatsApp first (where most votes come from),
 * then Facebook, X, Telegram, copy the link, and the phone's own share sheet.
 * The links point at a small preview page, so WhatsApp and Facebook show the
 * cake's photo and name.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './share-bar.css';

interface Props {
  url: string;
  /** The message that goes with the link. */
  text: string;
  /** Larger, labelled buttons (for the cake page). */
  big?: boolean;
  dark?: boolean;
}

const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer,width=640,height=560');

const ShareBar: React.FC<Props> = ({ url, text, big, dark }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = `${text} ${url}`;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const items = [
    { key: 'wa', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', onClick: () => open(`https://wa.me/?text=${enc(`${text} ${url}`)}`) },
    { key: 'fb', label: 'Facebook', icon: 'fa-brands fa-facebook-f', onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`) },
    { key: 'x', label: 'X', icon: 'fa-brands fa-x-twitter', onClick: () => open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`) },
    { key: 'tg', label: 'Telegram', icon: 'fa-brands fa-telegram', onClick: () => open(`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`) },
  ];

  return (
    <div className={`shb${big ? ' shb--big' : ''}${dark ? ' shb--dark' : ''}`}>
      {items.map((it) => (
        <button key={it.key} type="button" className={`shb__btn shb__btn--${it.key}`} onClick={it.onClick} aria-label={t('challenge.share.on', { site: it.label, defaultValue: 'Share on {{site}}' })}>
          <i className={it.icon} aria-hidden="true" />
          {big && <span>{it.label}</span>}
        </button>
      ))}
      <button type="button" className="shb__btn shb__btn--copy" onClick={copy}>
        <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'}`} aria-hidden="true" />
        <span>{copied ? t('challenge.share.copied', 'Link copied') : t('challenge.share.copy', 'Copy link')}</span>
      </button>
      {canNative && (
        <button type="button" className="shb__btn shb__btn--more" onClick={() => navigator.share({ title: 'SARALÖWE', text, url }).catch(() => {})}>
          <i className="fa-solid fa-share-nodes" aria-hidden="true" />
          <span>{t('challenge.share.more', 'More')}</span>
        </button>
      )}
    </div>
  );
};

export default ShareBar;
