/**
 * Admin: the two announcement emails. Preview, send yourself a test, then
 * launch: the server sends in the background (about 380 a day, Gmail's limit),
 * never twice to the same person, skipping members who turned announcements off.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { extractApiError } from '../../../services/api/error.utils';
import { CampaignStatus, challengeService } from '../../../services/api/challenge.service';

const KEYS: { key: string; titleKey: string; title: string }[] = [
  { key: 'platform-update-2026-11', titleKey: 'campaigns.update', title: 'The winter update (all members)' },
  { key: 'challenge-open-2027', titleKey: 'campaigns.challenge', title: 'The challenge is open (all members)' },
];

const CampaignPanel: React.FC = () => {
  const { t } = useTranslation();
  const [st, setSt] = useState<Record<string, CampaignStatus>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    const out: Record<string, CampaignStatus> = {};
    for (const k of KEYS) {
      try { out[k.key] = await challengeService.campaignStatus(k.key); } catch { /* ignore */ }
    }
    setSt(out);
  }, []);
  useEffect(() => { load(); const id = window.setInterval(load, 20000); return () => window.clearInterval(id); }, [load]);

  const say = (key: string, text: string) => setMsg((m) => ({ ...m, [key]: text }));

  const showPreview = async (key: string) => {
    try { setPreview(await challengeService.campaignPreview(key)); } catch (e) { say(key, extractApiError(e)); }
  };
  const test = async (key: string) => {
    say(key, t('campaigns.sending', 'Sending…'));
    try { const to = await challengeService.campaignTest(key); say(key, t('campaigns.testSent', { to, defaultValue: 'Test sent to {{to}}' })); }
    catch (e) { say(key, extractApiError(e)); }
  };
  const launch = async (key: string) => {
    setConfirm(null);
    try { const s = await challengeService.campaignLaunch(key); setSt((x) => ({ ...x, [key]: s })); say(key, t('campaigns.launched', 'Launched: sending in the background.')); }
    catch (e) { say(key, extractApiError(e)); }
  };

  return (
    <section className="cmp">
      <div className="cmp__head">
        <h2>{t('campaigns.title', 'Announcement emails')}</h2>
        <p>{t('campaigns.sub', 'Bilingual luxury emails to every verified member. Sent in the background, about 380 a day (Gmail’s limit), never twice to the same person.')}</p>
      </div>
      <div className="cmp__list">
        {KEYS.map((k) => {
          const s = st[k.key];
          const done = s ? s.sent + s.failed + s.skipped : 0;
          const pct = s && s.audience ? Math.min(100, Math.round((done / s.audience) * 100)) : 0;
          return (
            <article key={k.key} className="cmp__item">
              <div className="cmp__row">
                <div>
                  <h3>{t(k.titleKey, k.title)}</h3>
                  <p className="cmp__meta">
                    {s ? t(`campaigns.status.${s.status}`, s.status) : '…'}
                    {s && <> · {t('campaigns.progress', { sent: s.sent, audience: s.audience, defaultValue: '{{sent}} sent of {{audience}}' })}{s.failed > 0 && ` · ${s.failed} ✗`}{s.skipped > 0 && ` · ${t('campaigns.skipped', { n: s.skipped, defaultValue: '{{n}} opted out' })}`}</>}
                  </p>
                </div>
                <div className="cmp__actions">
                  <button type="button" className="cha-btn cha-btn--line" onClick={() => showPreview(k.key)}>{t('campaigns.preview', 'Preview')}</button>
                  <button type="button" className="cha-btn cha-btn--line" onClick={() => test(k.key)}>{t('campaigns.test', 'Send me a test')}</button>
                  {s?.status === 'IDLE' && (confirm === k.key ? (
                    <>
                      <button type="button" className="cha-btn cha-btn--ok" onClick={() => launch(k.key)}>{t('campaigns.confirm', { n: s.audience, defaultValue: 'Yes, send to {{n}} members' })}</button>
                      <button type="button" className="cha-btn cha-btn--line" onClick={() => setConfirm(null)}>{t('campaigns.cancel', 'Cancel')}</button>
                    </>
                  ) : (
                    <button type="button" className="cha-btn cha-btn--ok" onClick={() => setConfirm(k.key)}>{t('campaigns.launch', 'Send to everyone')}</button>
                  ))}
                </div>
              </div>
              {s && s.status !== 'IDLE' && <div className="cmp__bar"><span style={{ width: `${pct}%` }} /></div>}
              {msg[k.key] && <p className="cmp__msg">{msg[k.key]}</p>}
            </article>
          );
        })}
      </div>
      {preview && (
        <div className="cha-drawer" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
          <div className="cha-drawer__box cmp__preview" onClick={(e) => e.stopPropagation()}>
            <div className="cha-drawer__head">
              <h2>{t('campaigns.preview', 'Preview')}</h2>
              <button type="button" onClick={() => setPreview(null)} aria-label="✕">✕</button>
            </div>
            <iframe title="preview" srcDoc={preview} sandbox="" />
          </div>
        </div>
      )}
    </section>
  );
};

export default CampaignPanel;
