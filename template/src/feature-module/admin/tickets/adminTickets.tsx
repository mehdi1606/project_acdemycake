import React, { useState, useEffect, useRef, useCallback } from 'react';
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
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
          {pages.map(i => (
            <button key={i} className={`lx-btn lx-btn-sm ${i === page ? 'lx-btn-gold' : 'lx-btn-outline'}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    );
  };

  return (
    <LuxuryDashboardLayout>
      <div className="lx-section-header" style={{ marginBottom: 24 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>Support Tickets</h5>
      </div>

      {/* ── Stats cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total', value: stats?.total ?? 0, color: 'slate', icon: 'isax-ticket' },
          { label: 'Open', value: stats?.open ?? 0, color: 'sage', icon: 'isax-folder-open' },
          { label: 'In Progress', value: stats?.inProgress ?? 0, color: 'gold', icon: 'isax-clock' },
          { label: 'Closed', value: stats?.closed ?? 0, color: 'amber', icon: 'isax-tick-circle' },
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
            {s === '' ? 'All' : STATUS_LABELS[s as TicketStatus]}
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
              <p>No tickets found.</p>
            </div>
          ) : (
            <table className="lx-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ color: 'var(--lx-primary)', fontWeight: 600 }}>{t.ticketNumber}</span>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>{t.studentName}</p>
                      <small style={{ color: 'var(--lx-text-muted)', fontSize: 12 }}>{t.studentEmail}</small>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={t.subject}>
                        {t.subject}
                      </span>
                    </td>
                    <td><span className="lx-badge badge-slate">{CATEGORY_LABELS[t.category]}</span></td>
                    <td>{priorityBadge(t.priority)}</td>
                    <td>{statusBadge(t.status)}</td>
                    <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(t.createdAt)}</td>
                    <td>
                      <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openTicket(t)}>
                        <i className="isax isax-eye" style={{ marginRight: 4 }} /> View
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
      {activeTicket && (
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
              <span style={{ color: 'var(--lx-text-muted)', fontSize: 13, fontWeight: 600, marginRight: 4 }}>Change status:</span>
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
                          <span><strong>You (Admin)</strong> · <i className="isax isax-shield-tick" style={{ color: 'var(--lx-primary)' }} /></span>
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
                  placeholder="Type your reply to the student…"
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
                    <><i className="isax isax-send-2" style={{ marginRight: 4 }} />Send</>
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
                  Ticket closed.
                  {activeTicket.closedAt && <span> Resolved on {formatDate(activeTicket.closedAt)}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default AdminTickets;
