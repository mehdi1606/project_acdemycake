import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  Ticket,
  TicketMessage,
  TicketStats,
  TicketStatus,
  ticketService,
  ContactMessage,
  ContactStats,
  contactService,
} from '../../../services/api/ticket.service';

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const statusBadge = (status: TicketStatus) => {
  const map: Record<TicketStatus, string> = {
    OPEN: 'badge-info',
    IN_PROGRESS: 'badge-warning',
    CLOSED: 'badge-success',
  };
  return <span className={`lx-badge ${map[status]}`}>{STATUS_LABELS[status]}</span>;
};

const priorityBadge = (priority: string) => {
  const map: Record<string, string> = {
    HIGH: 'badge-danger',
    MEDIUM: 'badge-warning',
    LOW: 'badge-success',
  };
  return (
    <span className={`lx-badge ${map[priority] ?? 'badge-slate'}`}>
      {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] ?? priority}
    </span>
  );
};

const PAGE_SIZE = 10;

// ─── Contact messages panel (inner component for clean separation) ─────────────
const ContactMessagesPanel: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages]       = useState<ContactMessage[]>([]);
  const [stats, setStats]             = useState<ContactStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [unreadOnly, setUnreadOnly]   = useState(false);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([
        contactService.getAll(page, PAGE_SIZE, unreadOnly || undefined),
        contactService.getStats(),
      ]);
      setMessages(data.content ?? []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setStats(s);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, unreadOnly]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await contactService.markRead(id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev);
  };

  const deleteMsg = async (id: string) => {
    setDeleting(id);
    try {
      await contactService.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      setStats(prev => prev ? { ...prev, total: prev.total - 1 } : prev);
    } finally { setDeleting(null); }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',  value: stats?.total  ?? 0, icon: 'isax-message-text', color: 'slate' },
          { label: 'Unread', value: stats?.unread ?? 0, icon: 'isax-sms-notification', color: 'gold'  },
        ].map(s => (
          <div className="lx-stat-card" key={s.label} style={{ flex: '0 0 auto', minWidth: 140 }}>
            <span className={`stat-icon ${s.color}`}>
              <i className={`isax ${s.icon}`} style={{ fontSize: 20 }} />
            </span>
            <div>
              <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', margin: 0 }}>{s.label}</p>
              <h4 style={{ fontSize: 22, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>{s.value}</h4>
            </div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button
            className={`lx-btn lx-btn-sm ${unreadOnly ? 'lx-btn-gold' : 'lx-btn-outline'}`}
            onClick={() => { setUnreadOnly(v => !v); setPage(0); }}
          >
            <i className="isax isax-sms-notification" style={{ marginRight: 4 }} />
            {t('admin.contact.unreadOnly', 'Unread only')}
            {stats && stats.unread > 0 && (
              <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, background: '#8B2335', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                {stats.unread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="lx-card">
        <div className="lx-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="lx-empty-state">
              <span className="empty-icon"><i className="isax isax-message-text" style={{ fontSize: 28 }} /></span>
              <p>{t('admin.contact.noMessages', 'No contact messages yet.')}</p>
            </div>
          ) : (
            <div>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    borderBottom: '1px solid rgba(107,29,42,0.07)',
                    background: msg.isRead ? 'transparent' : 'rgba(197,145,44,0.04)',
                  }}
                >
                  {/* Summary row */}
                  <div
                    style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}
                    onClick={() => {
                      setExpanded(prev => prev === msg.id ? null : msg.id);
                      if (!msg.isRead) markRead(msg.id);
                    }}
                  >
                    {/* Unread dot */}
                    <div style={{ marginTop: 6, flexShrink: 0 }}>
                      {!msg.isRead
                        ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lx-primary)' }} />
                        : <div style={{ width: 8, height: 8 }} />
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: msg.isRead ? 500 : 700, fontSize: 14, color: 'var(--lx-text)' }}>{msg.name}</span>
                          <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>{msg.email}</span>
                          {msg.phone && <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{msg.phone}</span>}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--lx-text-muted)', flexShrink: 0 }}>{formatDate(msg.createdAt)}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: 13, color: 'var(--lx-text)' }}>{msg.subject}</p>
                      {expanded !== msg.id && (
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--lx-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 480 }}>
                          {msg.message}
                        </p>
                      )}
                    </div>

                    <i
                      className={`isax isax-arrow-${expanded === msg.id ? 'up' : 'down'}-2`}
                      style={{ flexShrink: 0, color: 'var(--lx-text-muted)', fontSize: 16, marginTop: 2 }}
                    />
                  </div>

                  {/* Expanded body */}
                  {expanded === msg.id && (
                    <div style={{ padding: '0 20px 20px 42px' }}>
                      <div style={{
                        padding: '16px 18px',
                        background: 'rgba(107,29,42,0.03)',
                        borderRadius: 10,
                        border: '1px solid rgba(107,29,42,0.07)',
                        fontSize: 14, lineHeight: 1.7, color: 'var(--lx-text)',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        marginBottom: 14,
                      }}>
                        {msg.message}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          className="lx-btn lx-btn-gold lx-btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          <i className="isax isax-send-2" style={{ marginRight: 4 }} />
                          {t('admin.contact.replyEmail', 'Reply via Email')}
                        </a>
                        <button
                          type="button"
                          className="lx-btn lx-btn-outline lx-btn-sm"
                          style={{ color: '#c0392b', borderColor: 'rgba(192,57,43,0.3)' }}
                          disabled={deleting === msg.id}
                          onClick={() => deleteMsg(msg.id)}
                        >
                          <i className="isax isax-trash" style={{ marginRight: 4 }} />
                          {deleting === msg.id ? '…' : t('common.delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Page {page + 1} of {totalPages} ({totalElements} messages)
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i).map(i => (
              <button key={i} className={`lx-btn lx-btn-sm ${i === page ? 'lx-btn-gold' : 'lx-btn-outline'}`} onClick={() => setPage(i)}>{i + 1}</button>
            ))}
            <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)',
  fontSize: 14,
  outline: 'none',
  background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)',
  resize: 'none',
};

// ─── component ────────────────────────────────────────────────────────────────

const AdminTickets = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tickets' | 'contact'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ticketService.getAllTickets(page, PAGE_SIZE, filterStatus || undefined);
      setTickets(data.content ?? []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await ticketService.getAdminStats();
      setStats(data);
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  const openTicket = async (ticket: Ticket) => {
    setDetailLoading(true);
    setActiveTicket(ticket);
    setReplyText('');
    try {
      const detail = await ticketService.getAdminTicket(ticket.id);
      setActiveTicket(detail);
    } catch {
      // keep summary
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !activeTicket || replying) return;
    setReplying(true);
    try {
      const updated = await ticketService.adminReply(activeTicket.id, replyText.trim());
      setActiveTicket(updated);
      setReplyText('');
      loadTickets();
      loadStats();
    } catch {
      // ignore
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!activeTicket || changingStatus) return;
    setChangingStatus(true);
    try {
      const updated = await ticketService.updateStatus(activeTicket.id, newStatus);
      setActiveTicket(updated);
      loadTickets();
      loadStats();
    } catch {
      // ignore
    } finally {
      setChangingStatus(false);
    }
  };

  const handleFilterChange = (status: TicketStatus | '') => {
    setFilterStatus(status);
    setPage(0);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
          Page {page + 1} of {totalPages} ({totalElements} tickets)
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('common.previous', 'Previous')}</button>
          {pages.map(i => (
            <button key={i} className={`lx-btn lx-btn-sm ${i === page ? 'lx-btn-gold' : 'lx-btn-outline'}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{t('common.next', 'Next')}</button>
        </div>
      </div>
    );
  };

  return (
    <LuxuryDashboardLayout>
      {/* ── Page header + tab switcher ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
          {activeTab === 'tickets'
            ? t('admin.tickets.title', 'Support Tickets')
            : t('admin.contact.title', 'Contact Messages')}
        </h5>
        <div style={{ display: 'flex', background: 'rgba(107,29,42,0.05)', borderRadius: 10, padding: 4, gap: 4 }}>
          {([
            { key: 'tickets', label: t('admin.tickets.title', 'Support Tickets'), icon: 'isax-ticket' },
            { key: 'contact', label: t('admin.contact.title', 'Contact Messages'), icon: 'isax-message-text' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.18s',
                background: activeTab === tab.key ? 'var(--lx-primary)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--lx-text-muted)',
              }}
            >
              <i className={`isax ${tab.icon}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contact Messages Tab ─── */}
      {activeTab === 'contact' && <ContactMessagesPanel />}

      {/* ── Support Tickets Tab ─── */}
      {activeTab === 'tickets' && <>

      {/* ── Stats cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: t('common.total', 'Total'), value: stats?.total ?? 0, color: 'slate', icon: 'isax-ticket' },
          { label: t('admin.tickets.open', 'Open'), value: stats?.open ?? 0, color: 'sage', icon: 'isax-folder-open' },
          { label: t('admin.tickets.inProgress', 'In Progress'), value: stats?.inProgress ?? 0, color: 'gold', icon: 'isax-clock' },
          { label: t('admin.tickets.closed', 'Closed'), value: stats?.closed ?? 0, color: 'amber', icon: 'isax-tick-circle' },
        ].map((s) => (
          <div className="lx-stat-card" key={s.label}>
            <span className={`stat-icon ${s.color}`}>
              <i className={`isax ${s.icon}`} style={{ fontSize: 20 }} />
            </span>
            <div>
              <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', margin: 0 }}>{s.label}</p>
              <h4 style={{ fontSize: 22, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
                {statsLoading ? (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                ) : s.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ─── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`lx-btn lx-btn-sm ${filterStatus === s ? 'lx-btn-gold' : 'lx-btn-outline'}`}
            onClick={() => handleFilterChange(s as TicketStatus | '')}
          >
            {s === '' ? t('admin.tickets.all', 'All') : STATUS_LABELS[s as TicketStatus]}
            {s === 'OPEN' && stats && stats.open > 0 && (
              <span style={{
                marginLeft: 6, padding: '1px 7px', borderRadius: 10,
                background: '#8B2335', color: '#fff', fontSize: 11, fontWeight: 600,
              }}>{stats.open}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ─── */}
      <div className="lx-card">
        <div className="lx-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          ) : error ? (
            <div style={{ padding: '12px 16px', margin: 16, borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139, 35, 53, 0.06)', border: '1px solid rgba(139, 35, 53, 0.12)', color: '#8B2335', fontSize: 14 }}>
              {error}
            </div>
          ) : tickets.length === 0 ? (
            <div className="lx-empty-state">
              <span className="empty-icon"><i className="isax isax-ticket" style={{ fontSize: 28 }} /></span>
              <p>{t('admin.tickets.noTickets', 'No tickets found.')}</p>
            </div>
          ) : (
            <table className="lx-table">
              <thead>
                <tr>
                  <th>{t('admin.tickets.ticketNumber', 'Ticket')}</th>
                  <th>{t('admin.tickets.student', 'Student')}</th>
                  <th>{t('admin.tickets.subject', 'Subject')}</th>
                  <th>{t('admin.tickets.category', 'Category')}</th>
                  <th>{t('admin.tickets.priority', 'Priority')}</th>
                  <th>{t('admin.tickets.status', 'Status')}</th>
                  <th>{t('admin.tickets.date', 'Date')}</th>
                  <th>{t('common.actions', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <span style={{ color: 'var(--lx-primary)', fontWeight: 600 }}>{ticket.ticketNumber}</span>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>{ticket.studentName}</p>
                      <small style={{ color: 'var(--lx-text-muted)', fontSize: 12 }}>{ticket.studentEmail}</small>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={ticket.subject}>
                        {ticket.subject}
                      </span>
                    </td>
                    <td><span className="lx-badge badge-slate">{CATEGORY_LABELS[ticket.category]}</span></td>
                    <td>{priorityBadge(ticket.priority)}</td>
                    <td>{statusBadge(ticket.status)}</td>
                    <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(ticket.createdAt)}</td>
                    <td>
                      <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openTicket(ticket)}>
                        <i className="isax isax-eye" style={{ marginRight: 4 }} /> {t('common.view', 'View')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {renderPagination()}

      {/* ─── Ticket Detail Modal ─── */}
      {activeTicket && activeTab === 'tickets' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTicket(null); }}
        >
          <div style={{
            width: '100%', maxWidth: 720,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
            display: 'flex', flexDirection: 'column', maxHeight: '85vh',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{activeTicket.ticketNumber}</h5>
                    {statusBadge(activeTicket.status)}
                    {priorityBadge(activeTicket.priority)}
                  </div>
                  <p style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--lx-text)' }}>{activeTicket.subject}</p>
                  <small style={{ color: 'var(--lx-text-muted)' }}>
                    <i className="isax isax-user" style={{ marginRight: 4 }} />
                    {activeTicket.studentName} ({activeTicket.studentEmail})
                    {' · '}{CATEGORY_LABELS[activeTicket.category]}
                    {' · '}Opened {formatDate(activeTicket.createdAt)}
                  </small>
                </div>
                <button onClick={() => setActiveTicket(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)', padding: 4 }}>
                  <i className="isax isax-close-circle" />
                </button>
              </div>
            </div>

            {/* Status change toolbar */}
            <div style={{
              padding: '10px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)',
              background: 'rgba(107, 29, 42, 0.02)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--lx-text-muted)', fontSize: 13, fontWeight: 600, marginRight: 4 }}>{t('admin.tickets.changeStatus', 'Change status:')}</span>
              {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as TicketStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`lx-btn lx-btn-sm ${activeTicket.status === s ? 'lx-btn-gold' : 'lx-btn-outline'}`}
                  disabled={activeTicket.status === s || changingStatus}
                  onClick={() => handleStatusChange(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Messages thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxHeight: '48vh' }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : !activeTicket.messages?.length ? (
                <p style={{ textAlign: 'center', color: 'var(--lx-text-muted)', padding: '24px 0' }}>No messages yet.</p>
              ) : (
                activeTicket.messages.map((msg: TicketMessage) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex', marginBottom: 16,
                      flexDirection: msg.isAdminReply ? 'row-reverse' : 'row',
                    }}
                  >
                    <div style={{
                      maxWidth: '78%', display: 'flex', flexDirection: 'column',
                      alignItems: msg.isAdminReply ? 'flex-end' : 'flex-start',
                    }}>
                      <small style={{ color: 'var(--lx-text-muted)', marginBottom: 4, fontSize: 12 }}>
                        {msg.isAdminReply ? (
                          <span><strong>{t('admin.tickets.youAdmin', 'You (Admin)')}</strong> · <i className="isax isax-shield-tick" style={{ color: 'var(--lx-primary)' }} /></span>
                        ) : (
                          <strong>{activeTicket.studentName}</strong>
                        )}
                        {' · '}{formatDateTime(msg.createdAt)}
                      </small>
                      <div style={{
                        padding: '10px 16px', borderRadius: 12, wordBreak: 'break-word', fontSize: 14, lineHeight: 1.5,
                        ...(msg.isAdminReply
                          ? { background: 'var(--lx-primary)', color: '#fff' }
                          : { background: 'rgba(107, 29, 42, 0.04)', border: '1px solid rgba(107, 29, 42, 0.06)', color: 'var(--lx-text)' }
                        ),
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply area */}
            {activeTicket.status !== 'CLOSED' ? (
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', gap: 12 }}>
                <textarea
                  style={inputStyle}
                  rows={2}
                  placeholder={t('admin.tickets.replyPlaceholder', 'Type your reply to the student…')}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                  }}
                  disabled={replying}
                />
                <button
                  type="button"
                  className="lx-btn lx-btn-gold"
                  onClick={handleReply}
                  disabled={!replyText.trim() || replying}
                  style={{ flexShrink: 0, alignSelf: 'flex-end' }}
                >
                  {replying ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  ) : (
                    <><i className="isax isax-send-2" style={{ marginRight: 4 }} />{t('messages.send', 'Send')}</>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)' }}>
                <div style={{
                  padding: '10px 16px', borderRadius: 'var(--lx-radius-sm)',
                  background: 'rgba(45, 95, 63, 0.06)', border: '1px solid rgba(45, 95, 63, 0.12)',
                  color: '#2D5F3F', fontSize: 14, textAlign: 'center',
                }}>
                  <i className="isax isax-tick-circle" style={{ marginRight: 6 }} />
                  {t('admin.tickets.ticketClosed', 'Ticket closed.')}
                  {activeTicket.closedAt && <span> Resolved on {formatDate(activeTicket.closedAt)}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close the tickets tab fragment */}
      </>}

    </LuxuryDashboardLayout>
  );
};

export default AdminTickets;
