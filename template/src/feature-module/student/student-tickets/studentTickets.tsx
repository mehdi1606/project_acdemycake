import React, { useState, useEffect, useCallback, useRef } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Spin } from 'antd';
import {
  CATEGORY_LABELS,
  CreateTicketPayload,
  PRIORITY_LABELS,
  STATUS_LABELS,
  Ticket,
  TicketMessage,
  TicketStats,
  TicketStatus,
  ticketService,
} from '../../../services/api/ticket.service';

// ─── Helpers ────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusBadge = (status: TicketStatus) => {
  const map: Record<TicketStatus, string> = {
    OPEN: 'badge-info',
    IN_PROGRESS: 'badge-warning',
    CLOSED: 'badge-success',
  };
  return <span className={`lx-badge ${map[status]}`}>{STATUS_LABELS[status]}</span>;
};

const priorityBadge = (priority: keyof typeof PRIORITY_LABELS) => {
  const map: Record<keyof typeof PRIORITY_LABELS, string> = {
    HIGH: 'badge-danger',
    MEDIUM: 'badge-warning',
    LOW: 'badge-success',
  };
  return <span className={`lx-badge ${map[priority]}`}>{PRIORITY_LABELS[priority]}</span>;
};

const PAGE_SIZE = 10;

// ─── Component ─────────────────────────────────────────
const StudentTickets: React.FC = () => {
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
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateTicketPayload>({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL_INQUIRY',
  });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ticketService.getMyTickets(page, PAGE_SIZE, filterStatus || undefined);
      setTickets(data.content ?? []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await ticketService.getMyStats();
      setStats(data);
    } catch { /* silent */ } finally {
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
      const detail = await ticketService.getMyTicket(ticket.id);
      setActiveTicket(detail);
    } catch { /* keep summary */ } finally {
      setDetailLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !activeTicket || replying) return;
    setReplying(true);
    try {
      const updated = await ticketService.replyToTicket(activeTicket.id, replyText.trim());
      setActiveTicket(updated);
      setReplyText('');
      loadTickets();
    } catch { /* ignore */ } finally {
      setReplying(false);
    }
  };

  const handleClose = async () => {
    if (!activeTicket || closing) return;
    setClosing(true);
    try {
      await ticketService.closeTicket(activeTicket.id);
      setActiveTicket((t) => t ? { ...t, status: 'CLOSED' } : t);
      loadTickets();
      loadStats();
    } catch { /* ignore */ } finally {
      setClosing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim() || creating) return;
    setCreating(true);
    try {
      await ticketService.createTicket(form);
      setShowCreateModal(false);
      setForm({ subject: '', description: '', priority: 'MEDIUM', category: 'GENERAL_INQUIRY' });
      loadTickets();
      loadStats();
    } catch {
      setError('Failed to create ticket.');
    } finally {
      setCreating(false);
    }
  };

  const handleFilterChange = (status: TicketStatus | '') => {
    setFilterStatus(status);
    setPage(0);
  };

  // ── Render Pagination ──────────────────────────────────
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: 0 }}>
          Page {page + 1} of {totalPages} ({totalElements} tickets)
        </p>
        <div className="d-flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`lx-btn lx-btn-sm ${page === i ? 'lx-btn-gold' : 'lx-btn-outline'}`}
              onClick={() => setPage(i)}
              style={{ minWidth: 36, justifyContent: 'center' }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Glass form input style ─────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid rgba(107, 29, 42, 0.12)',
    borderRadius: 'var(--lx-radius-sm)',
    fontSize: 14,
    outline: 'none',
    background: 'rgba(255,255,255,0.6)',
    color: 'var(--lx-text)',
  };

  return (
    <LuxuryDashboardLayout>

      {/* Stats */}
      <div className="row g-4 mb-4">
        {[
          { label: 'Total Tickets', value: stats?.total ?? 0, icon: 'isax isax-ticket', color: 'gold' },
          { label: 'Open',          value: stats?.open ?? 0,  icon: 'isax isax-folder-open', color: 'slate' },
          { label: 'In Progress',   value: stats?.inProgress ?? 0, icon: 'isax isax-clock', color: 'amber' },
          { label: 'Closed',        value: stats?.closed ?? 0, icon: 'isax isax-tick-circle', color: 'sage' },
        ].map((s) => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className="lx-stat-card">
              <div className={`stat-icon ${s.color}`}>
                <i className={s.icon} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{s.label}</p>
                <h3 className="stat-value">{statsLoading ? <Spin size="small" /> : s.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          {(['', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`lx-btn lx-btn-sm ${filterStatus === s ? '' : 'lx-btn-outline'}`}
              style={filterStatus === s ? { background: 'var(--lx-primary)', color: '#fff', border: '1.5px solid var(--lx-primary)' } : {}}
              onClick={() => handleFilterChange(s as TicketStatus | '')}
            >
              {s === '' ? 'All' : STATUS_LABELS[s as TicketStatus]}
            </button>
          ))}
        </div>
        <button type="button" className="lx-btn lx-btn-gold" onClick={() => setShowCreateModal(true)}>
          <i className="isax isax-add-circle" />
          New Ticket
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--lx-radius-sm)',
            background: 'rgba(139, 35, 53, 0.06)',
            border: '1px solid rgba(139, 35, 53, 0.12)',
            color: '#8B2335',
            fontSize: 14,
          }}
        >
          <i className="isax isax-warning-2" style={{ marginRight: 8 }} />{error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-ticket" /></div>
              <h6>No tickets found.</h6>
              <p>Need help? Open a support ticket and we'll get back to you.</p>
              <button className="lx-btn lx-btn-gold" onClick={() => setShowCreateModal(true)}>
                <i className="isax isax-add-circle" />
                Open your first ticket
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="lx-card">
          <div className="lx-card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td><span style={{ color: 'var(--lx-primary)', fontWeight: 600, fontSize: 13 }}>{t.ticketNumber}</span></td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(t.createdAt)}</td>
                      <td style={{ maxWidth: 200 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--lx-text)', fontSize: 13 }} title={t.subject}>
                          {t.subject}
                        </span>
                      </td>
                      <td><span className="lx-badge badge-slate">{CATEGORY_LABELS[t.category]}</span></td>
                      <td>{priorityBadge(t.priority)}</td>
                      <td>{statusBadge(t.status)}</td>
                      <td>
                        <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openTicket(t)}>
                          <i className="isax isax-eye" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 20px 16px' }}>
              {renderPagination()}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Ticket Modal ── */}
      {showCreateModal && (
        <>
          <div
            onClick={() => setShowCreateModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1040 }}
          />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
            <div
              style={{
                width: '100%',
                maxWidth: 600,
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderRadius: 'var(--lx-radius-lg)',
                border: '1px solid rgba(107, 29, 42, 0.1)',
                boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0, fontSize: 16 }}>Open New Support Ticket</h5>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--lx-text-muted)', fontSize: 20 }}>
                  <i className="isax isax-close-circle" />
                </button>
              </div>
              <form onSubmit={handleCreate}>
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
                      Subject <span style={{ color: '#8B2335' }}>*</span>
                    </label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="Brief description of your issue"
                      value={form.subject}
                      onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="row g-3" style={{ marginBottom: 16 }}>
                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
                        Category <span style={{ color: '#8B2335' }}>*</span>
                      </label>
                      <select
                        style={inputStyle}
                        value={form.category}
                        onChange={(e) => setForm(f => ({ ...f, category: e.target.value as any }))}
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
                        Priority <span style={{ color: '#8B2335' }}>*</span>
                      </label>
                      <select
                        style={inputStyle}
                        value={form.priority}
                        onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as any }))}
                      >
                        {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text)', marginBottom: 6 }}>
                      Description <span style={{ color: '#8B2335' }}>*</span>
                    </label>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                      rows={5}
                      placeholder="Describe your issue in detail…"
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="lx-btn lx-btn-gold" disabled={creating}>
                    {creating ? (
                      <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />Submitting…</>
                    ) : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── Ticket Detail / Reply Modal ── */}
      {activeTicket && (
        <>
          <div
            onClick={() => setActiveTicket(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1040 }}
          />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
            <div
              style={{
                width: '100%',
                maxWidth: 650,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderRadius: 'var(--lx-radius-lg)',
                border: '1px solid rgba(107, 29, 42, 0.1)',
                boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)', flexShrink: 0 }}>
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0, fontSize: 15 }}>
                      {activeTicket.ticketNumber} — {activeTicket.subject}
                    </h5>
                    <div className="d-flex gap-2 mt-2">
                      {statusBadge(activeTicket.status)}
                      {priorityBadge(activeTicket.priority)}
                      <span className="lx-badge badge-slate">{CATEGORY_LABELS[activeTicket.category]}</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--lx-text-muted)', fontSize: 20 }}>
                    <i className="isax isax-close-circle" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                {detailLoading ? (
                  <div className="d-flex justify-content-center py-4"><Spin /></div>
                ) : !activeTicket.messages || activeTicket.messages.length === 0 ? (
                  <p style={{ color: 'var(--lx-text-muted)', textAlign: 'center', padding: '16px 0' }}>No messages yet.</p>
                ) : (
                  activeTicket.messages.map((msg: TicketMessage) => (
                    <div key={msg.id} className={`d-flex mb-3 ${msg.isAdminReply ? '' : 'flex-row-reverse'}`}>
                      <div className={`d-flex flex-column ${msg.isAdminReply ? 'align-items-start' : 'align-items-end'}`} style={{ maxWidth: '78%' }}>
                        <small style={{ color: 'var(--lx-text-muted)', marginBottom: 4, fontSize: 12 }}>
                          {msg.isAdminReply ? (
                            <><i className="isax isax-shield-tick" style={{ color: 'var(--lx-primary)', marginRight: 4 }} />Support Team</>
                          ) : <strong>You</strong>}
                          {' · '}{formatDateTime(msg.createdAt)}
                        </small>
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--lx-radius)',
                            wordBreak: 'break-word',
                            fontSize: 14,
                            lineHeight: 1.6,
                            ...(msg.isAdminReply
                              ? { background: 'rgba(107, 29, 42, 0.04)', border: '1px solid rgba(107, 29, 42, 0.06)', color: 'var(--lx-text)' }
                              : { background: 'var(--lx-primary)', color: '#fff' }),
                          }}
                        >
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
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.06)', flexShrink: 0 }}>
                  <div className="d-flex gap-2">
                    <textarea
                      style={{ ...inputStyle, resize: 'none', flex: 1 } as React.CSSProperties}
                      rows={2}
                      placeholder="Type your reply… (Enter to send)"
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
                      disabled={replying || !replyText.trim()}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      {replying ? <Spin size="small" /> : <i className="isax isax-send-sqaure-2" />}
                    </button>
                  </div>
                  <div className="d-flex justify-content-end" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="lx-btn lx-btn-sm"
                      style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                      onClick={handleClose}
                      disabled={closing}
                    >
                      {closing ? <><Spin size="small" /> Closing...</> : 'Close Ticket'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.06)', flexShrink: 0 }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--lx-radius-sm)',
                      background: 'rgba(107, 29, 42, 0.04)',
                      border: '1px solid rgba(107, 29, 42, 0.06)',
                      color: 'var(--lx-text-muted)',
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    This ticket is closed. Replies are disabled.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </LuxuryDashboardLayout>
  );
};

export default StudentTickets;
