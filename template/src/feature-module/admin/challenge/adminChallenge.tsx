/**
 * Admin: review challenge entries (approve, ask for changes, reject, disqualify),
 * follow the live scores, and inspect each cake's voters to spot fake accounts.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { extractApiError } from '../../../services/api/error.utils';
import { AdminEntry, AdminVote, challengeService, EntryStatus } from '../../../services/api/challenge.service';
import './adminChallenge.css';

const SLUG = 'new-year-cake-2027';
type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'OUT';

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const AdminChallenge: React.FC = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AdminEntry[]>([]);
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [votesFor, setVotesFor] = useState<AdminEntry | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await challengeService.adminEntries(SLUG);
      setRows(list);
      setErr('');
      // First visit: open on "To review", or on "All" when nothing is waiting.
      setFilter((f) => (f === 'PENDING' && !list.some((r) => r.status === 'PENDING') ? 'ALL' : f));
    }
    catch (e) { setErr(extractApiError(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    ALL: rows.length,
    PENDING: rows.filter((r) => r.status === 'PENDING').length,
    APPROVED: rows.filter((r) => r.status === 'APPROVED').length,
    CHANGES_REQUESTED: rows.filter((r) => r.status === 'CHANGES_REQUESTED').length,
    OUT: rows.filter((r) => r.status === 'REJECTED' || r.status === 'DISQUALIFIED').length,
  }), [rows]);

  const shown = rows.filter((r) =>
    filter === 'ALL' ? true : filter === 'OUT' ? (r.status === 'REJECTED' || r.status === 'DISQUALIFIED') : r.status === filter);

  const setStatus = async (r: AdminEntry, status: EntryStatus) => {
    const note = (notes[r.id] ?? '').trim();
    if ((status === 'CHANGES_REQUESTED' || status === 'REJECTED' || status === 'DISQUALIFIED') && !note) {
      setErr(t('challengeAdmin.noteNeeded', 'Write a short note for the student first (it is sent to them).'));
      return;
    }
    setBusy(r.id); setErr('');
    try {
      const updated = await challengeService.setStatus(SLUG, r.id, status, note || undefined);
      setRows((list) => list.map((x) => (x.id === r.id ? updated : x)));
      setNotes((n) => ({ ...n, [r.id]: '' }));
    } catch (e) { setErr(extractApiError(e)); } finally { setBusy(null); }
  };

  const statusLabel: Record<string, string> = {
    PENDING: t('challengeAdmin.st.pending', 'To review'),
    APPROVED: t('challengeAdmin.st.approved', 'Approved'),
    CHANGES_REQUESTED: t('challengeAdmin.st.changes', 'Changes asked'),
    REJECTED: t('challengeAdmin.st.rejected', 'Rejected'),
    DISQUALIFIED: t('challengeAdmin.st.disqualified', 'Disqualified'),
  };

  return (
    <LuxuryDashboardLayout>
      <div className="cha">
        <div className="cha__head">
          <div>
            <h1>{t('challengeAdmin.title', 'New Year Cake Challenge')}</h1>
            <p>{t('challengeAdmin.sub', 'Approve cakes before they appear in the gallery, follow the live scores, and check who voted.')}</p>
          </div>
          <button type="button" className="cha-btn cha-btn--line" onClick={load}>{t('challengeAdmin.refresh', 'Refresh')}</button>
        </div>

        <div className="cha__tabs" role="tablist">
          {(['PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'OUT', 'ALL'] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
              {f === 'ALL' ? t('challengeAdmin.all', 'All') : f === 'OUT' ? t('challengeAdmin.out', 'Rejected / disqualified') : statusLabel[f]}
              <span>{counts[f]}</span>
            </button>
          ))}
        </div>

        {err && <p className="cha__err" role="alert">{err}</p>}
        {loading ? <p className="cha__empty">{t('common.loading', 'Loading…')}</p> : shown.length === 0 ? (
          <p className="cha__empty">{t('challengeAdmin.empty', 'Nothing here.')}</p>
        ) : (
          <div className="cha__list">
            {shown.map((r) => (
              <article key={r.id} className="cha-row">
                <div className="cha-row__photos">
                  {r.photos.map((p, i) => (
                    <button key={p} type="button" onClick={() => setPhoto(p)} aria-label={`${i + 1}`}><img src={p} alt="" /></button>
                  ))}
                </div>
                <div className="cha-row__main">
                  <div className="cha-row__top">
                    <h3>{r.title}</h3>
                    <span className={`cha-pill cha-pill--${r.status.toLowerCase()}`}>{statusLabel[r.status]}</span>
                  </div>
                  <p className="cha-row__who">{r.userName} · <a href={`mailto:${r.userEmail}`}>{r.userEmail}</a> · {t('challengeAdmin.member', { date: fmt(r.userCreatedAt), defaultValue: 'member since {{date}}' })}</p>
                  {r.description && <p className="cha-row__desc">{r.description}</p>}
                  <p className="cha-row__meta">
                    {r.certified ? '✓' : '✗'} {t('challengeAdmin.certified', 'certified own work')} · {r.publicationConsent ? '✓' : '✗'} {t('challengeAdmin.consent', 'publication accepted')} · {t('challengeAdmin.updated', { date: fmt(r.updatedAt || r.createdAt), defaultValue: 'updated {{date}}' })}
                  </p>
                  {r.adminNote && <p className="cha-row__note">{t('challengeAdmin.lastNote', 'Last note to the student:')} {r.adminNote}</p>}
                  <textarea
                    placeholder={t('challengeAdmin.notePh', 'Note to the student (needed to ask for changes, reject or disqualify)')}
                    value={notes[r.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} rows={2} />
                  <div className="cha-row__actions">
                    <button type="button" className="cha-btn cha-btn--ok" disabled={busy === r.id || r.status === 'APPROVED'} onClick={() => setStatus(r, 'APPROVED')}>{t('challengeAdmin.approve', 'Approve')}</button>
                    <button type="button" className="cha-btn cha-btn--line" disabled={busy === r.id} onClick={() => setStatus(r, 'CHANGES_REQUESTED')}>{t('challengeAdmin.askChanges', 'Ask for changes / more photos')}</button>
                    <button type="button" className="cha-btn cha-btn--warn" disabled={busy === r.id} onClick={() => setStatus(r, 'REJECTED')}>{t('challengeAdmin.reject', 'Reject')}</button>
                    <button type="button" className="cha-btn cha-btn--bad" disabled={busy === r.id} onClick={() => setStatus(r, 'DISQUALIFIED')}>{t('challengeAdmin.disqualify', 'Disqualify')}</button>
                  </div>
                </div>
                <aside className="cha-row__score">
                  {r.status === 'APPROVED' && <span className="cha-rank">#{r.rank}</span>}
                  <b>{r.points}</b>
                  <small>{t('challengeAdmin.pointsFrom', { count: r.voters, defaultValue: 'points from {{count}} accounts' })}</small>
                  {r.flaggedVotes > 0 && <span className="cha-flag" title={t('challengeAdmin.flagHelp', 'Votes from accounts created after the challenge started')}>⚑ {t('challengeAdmin.newAccounts', { count: r.flaggedVotes, defaultValue: '{{count}} new accounts' })}</span>}
                  <button type="button" className="cha-btn cha-btn--line" onClick={() => setVotesFor(r)}>{t('challengeAdmin.seeVotes', 'See votes')}</button>
                </aside>
              </article>
            ))}
          </div>
        )}
      </div>

      {votesFor && <VotesDrawer entry={votesFor} onClose={() => { setVotesFor(null); load(); }} />}
      {photo && (
        <div className="cha-photo" role="dialog" aria-modal="true" onClick={() => setPhoto(null)}>
          <img src={photo} alt="" />
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

const VotesDrawer: React.FC<{ entry: AdminEntry; onClose: () => void }> = ({ entry, onClose }) => {
  const { t } = useTranslation();
  const [votes, setVotes] = useState<AdminVote[] | null>(null);
  const [err, setErr] = useState('');
  const [why, setWhy] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    try { setVotes(await challengeService.adminVotes(SLUG, entry.id)); } catch (e) { setErr(extractApiError(e)); }
  }, [entry.id]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (v: AdminVote) => {
    const reason = v.voided ? undefined : (why[v.id] ?? '').trim();
    if (!v.voided && !reason) { setErr(t('challengeAdmin.voidWhy', 'Write why this vote is removed first.')); return; }
    setErr('');
    try { await challengeService.voidVote(v.id, !v.voided, reason); load(); } catch (e) { setErr(extractApiError(e)); }
  };

  return (
    <div className="cha-drawer" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="cha-drawer__box" onClick={(e) => e.stopPropagation()}>
        <div className="cha-drawer__head">
          <h2>{t('challengeAdmin.votesFor', { title: entry.title, defaultValue: 'Votes for “{{title}}”' })}</h2>
          <button type="button" onClick={onClose} aria-label="✕">✕</button>
        </div>
        <p className="cha-drawer__help">{t('challengeAdmin.votesHelp', '⚑ marks accounts created after the challenge opened. Many votes from the same network address can also be a sign of fake accounts. Removed votes no longer count.')}</p>
        {err && <p className="cha__err">{err}</p>}
        {!votes ? <p>{t('common.loading', 'Loading…')}</p> : votes.length === 0 ? <p>{t('challengeAdmin.noVotes', 'No votes yet.')}</p> : (
          <table className="cha-votes">
            <thead><tr>
              <th>{t('challengeAdmin.voter', 'Voter')}</th><th>{t('challengeAdmin.role', 'Role')}</th><th>{t('challengeAdmin.pts', 'Pts')}</th>
              <th>{t('challengeAdmin.account', 'Account created')}</th><th>{t('challengeAdmin.ip', 'Network')}</th><th>{t('challengeAdmin.when', 'Voted')}</th><th />
            </tr></thead>
            <tbody>
              {votes.map((v) => (
                <tr key={v.id} className={v.voided ? 'is-void' : ''}>
                  <td>{v.newAccount && <span className="cha-flag">⚑</span>} {v.voterName}<br /><small>{v.voterEmail}</small></td>
                  <td>{v.voterRole}</td>
                  <td>{v.points}</td>
                  <td>{fmt(v.accountCreatedAt)}</td>
                  <td>{v.ipAddress ?? '—'}{v.sameIpVotes > 1 && <small className="cha-same"> ×{v.sameIpVotes}</small>}</td>
                  <td>{fmt(v.createdAt)}</td>
                  <td>
                    {!v.voided && (
                      <input className="cha-why-input" placeholder={t('challengeAdmin.voidReasonPh', 'Reason')}
                        value={why[v.id] ?? ''} onChange={(e) => setWhy((w) => ({ ...w, [v.id]: e.target.value }))} />
                    )}
                    <button type="button" className={`cha-btn ${v.voided ? 'cha-btn--line' : 'cha-btn--bad'}`} onClick={() => toggle(v)}>
                      {v.voided ? t('challengeAdmin.restore', 'Restore') : t('challengeAdmin.void', 'Remove')}
                    </button>
                    {v.voided && v.voidedReason && <small className="cha-why">{v.voidedReason}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminChallenge;
