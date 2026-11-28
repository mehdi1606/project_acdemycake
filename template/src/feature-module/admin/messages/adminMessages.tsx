/**
 * Admin: every member conversation (read-only), newest first, searchable by name or
 * email. Includes messages that one side deleted, so abuse can always be checked.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import AvatarImage from '../../../components/AvatarImage';
import MemberLink from '../../../components/MemberLink';
import { getFileUrl } from '../../../environment';
import { extractApiError } from '../../../services/api/error.utils';
import adminMessageService, { AdminConversation, AdminMessage, AdminPerson } from '../../../services/api/adminMessage.service';
import './adminMessages.css';

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

const Person: React.FC<{ p: AdminPerson; size?: number }> = ({ p, size = 34 }) => (
  <MemberLink id={p.id} name={p.name} className="amx-person">
    <AvatarImage src={p.avatarUrl ? getFileUrl(p.avatarUrl) ?? null : null} name={p.name} size={size} />
    <span>{p.name}</span>
  </MemberLink>
);

const AdminMessages: React.FC = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AdminConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<AdminConversation | null>(null);
  const [msgs, setMsgs] = useState<AdminMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const debounce = useRef<number | undefined>(undefined);
  const SIZE = 30;

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const r = await adminMessageService.conversations(q, p, SIZE);
      setRows(r.content);
      setTotal(r.totalElements);
      setErr('');
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(query, page); }, [load, query, page]);

  const onSearch = (v: string) => {
    setSearch(v);
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => { setPage(0); setQuery(v.trim()); }, 350);
  };

  const openConv = async (c: AdminConversation) => {
    setOpen(c);
    setMsgs([]);
    setMsgsLoading(true);
    try {
      const r = await adminMessageService.conversation(c.userA.id, c.userB.id);
      setMsgs([...r.content].reverse());
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      setMsgsLoading(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / SIZE));

  return (
    <LuxuryDashboardLayout>
      <div className="amx">
        <div className="amx__head">
          <div>
            <h1>{t('adminMessages.title', 'Member messages')}</h1>
            <p>{t('adminMessages.sub', 'Every conversation between members, newest first. Read-only; messages that someone deleted are still shown here.')}</p>
          </div>
          <label className="amx__search">
            <i className="isax isax-search-normal-1" aria-hidden="true" />
            <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={t('adminMessages.search', 'Search by name or email')} />
          </label>
        </div>

        {err && <p className="amx__err" role="alert">{err}</p>}

        <div className="amx__body">
          <div className="lx-card amx__list">
            {loading ? (
              <p className="amx__muted">{t('common.loading', 'Loading…')}</p>
            ) : rows.length === 0 ? (
              <LxEmptyState icon="isax-messages-3" title={t('adminMessages.empty', 'No conversations yet.')} text="" />
            ) : (
              rows.map((c) => {
                const key = `${c.userA.id}-${c.userB.id}`;
                const on = open && open.userA.id === c.userA.id && open.userB.id === c.userB.id;
                return (
                  <button key={key} type="button" className={`amx-row${on ? ' is-on' : ''}`} onClick={() => openConv(c)}>
                    <span className="amx-row__pair">
                      <strong>{c.userA.name}</strong>
                      <i className="isax isax-arrow-swap-horizontal" aria-hidden="true" />
                      <strong>{c.userB.name}</strong>
                    </span>
                    <span className="amx-row__last">{c.lastMessage}</span>
                    <span className="amx-row__meta">{fmt(c.lastMessageAt)} · {t('adminMessages.count', { count: c.messages, defaultValue: '{{count}} messages' })}</span>
                  </button>
                );
              })
            )}
            {pages > 1 && (
              <div className="amx__pager">
                <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
                <span>{page + 1} / {pages}</span>
                <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>›</button>
              </div>
            )}
          </div>

          <div className="lx-card amx__thread">
            {!open ? (
              <LxEmptyState icon="isax-message-text" title={t('adminMessages.pick', 'Choose a conversation')} text="" />
            ) : (
              <>
                <div className="amx__threadHead">
                  <Person p={open.userA} />
                  <i className="isax isax-arrow-swap-horizontal" aria-hidden="true" />
                  <Person p={open.userB} />
                </div>
                <div className="amx__msgs">
                  {msgsLoading ? <p className="amx__muted">{t('common.loading', 'Loading…')}</p> : msgs.map((m) => {
                    const fromA = m.senderId === open.userA.id;
                    return (
                      <div key={m.id} className={`amx-msg${fromA ? '' : ' is-b'}`}>
                        <div className="amx-msg__bubble">
                          <span className="amx-msg__who">{m.senderName}</span>
                          {m.content}
                          {m.attachmentUrl && <a href={getFileUrl(m.attachmentUrl) ?? m.attachmentUrl} target="_blank" rel="noopener noreferrer" className="amx-msg__file"><i className="isax isax-paperclip-2" /> {t('adminMessages.attachment', 'Attachment')}</a>}
                        </div>
                        <small>{fmt(m.createdAt)}</small>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default AdminMessages;
