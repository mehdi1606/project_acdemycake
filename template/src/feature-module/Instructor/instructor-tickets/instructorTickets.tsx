import React, { useState, useEffect, useRef, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { useTranslation } from 'react-i18next';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  Ticket,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStats,
  TicketStatus,
  ticketService,
} from '../../../services/api/ticket.service';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const map: Record<TicketStatus, string> = {
    OPEN: 'badge-info',
    IN_PROGRESS: 'badge-warning',
    CLOSED: 'badge-success',
  };
  return <span className={`lx-badge ${map[status]}`}>{STATUS_LABELS[status]}</span>;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
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
};

const InstructorTickets = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Active ticket detail
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create ticket modal
  const [showCreate, setShowCreate] = useState(false);
  const [createSubject, setCreateSubject] = useState('');
  const [createCategory, setCreateCategory] = useState<TicketCategory | ''>('');
  const [createPriority, setCreatePriority] = useState<TicketPriority | ''>('');

  const [createMessage, setCreateMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ticketService.getMyTickets(page, PAGE_SIZE, filterStatus || undefined);
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
      const data = await ticketService.getMyStats();
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
      const detail = await ticketService.getMyTicket(ticket.id);
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
      const updated = await ticketService.replyToTicket(activeTicket.id, replyText.trim());
      setActiveTicket(updated);
      setReplyText('');
      loadTickets();
    } catch {
      // ignore
    } finally {
      setReplying(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSubject.trim() || !createMessage.trim() || !createCategory || !createPriority) return;
    setCreating(true);
    try {
      await ticketService.createTicket({
        subject: createSubject.trim(),
        category: createCategory as TicketCategory,
        priority: createPriority as TicketPriority,
        description: createMessage.trim(),
      });
      setShowCreate(false);
      setCreateSubject('');
      setCreateCategory('');
      setCreatePriority('');
      setCreateMessage('');
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
          Page {page + 1} of {totalPages} ({totalElements} tickets)
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    );
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>Support Tickets</h5>
        <button className="lx-btn lx-btn-gold" onClick={() => setShowCreate(true)}>
          <i className="isax isax-add-circle" style={{ marginRight: 6 }} /> New Ticket
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`lx-btn lx-btn-sm ${filterStatus === s ? 'lx-btn-gold' : 'lx-btn-outline'}`}
            onClick={() => handleFilterChange(s as TicketStatus | '')}
          >
            {s === '' ? 'All' : STATUS_LABELS[s as TicketStatus]}
          </button>
        ))}
      </div>

      {/* Table */}
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
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><span style={{ color: 'var(--lx-primary)', fontWeight: 600 }}>{ticket.ticketNumber}</span></td>
                    <td style={{ maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={ticket.subject}>
                        {ticket.subject}
                      </span>
                    </td>
                    <td><span className="lx-badge badge-slate">{CATEGORY_LABELS[ticket.category]}</span></td>
                    <td><PriorityBadge priority={ticket.priority} /></td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(ticket.createdAt)}</td>
                    <td>
                      <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openTicket(ticket)}>
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

      {/* ─── Create Ticket Modal ─── */}
      {showCreate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 560,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Create New Ticket</h5>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                    Subject <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <input type="text" style={inputStyle} placeholder="Brief description of the issue" value={createSubject} onChange={e => setCreateSubject(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                      Category <span style={{ color: '#8B2335' }}>*</span>
                    </label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={createCategory} onChange={e => setCreateCategory(e.target.value as TicketCategory | '')} required>
                      <option value="">Select category</option>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                      Priority <span style={{ color: '#8B2335' }}>*</span>
                    </label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={createPriority} onChange={e => setCreatePriority(e.target.value as TicketPriority | '')} required>
                      <option value="">Select priority</option>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                    Message <span style={{ color: '#8B2335' }}>*</span>
                  </label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={4} placeholder="Describe your issue in detail..." value={createMessage} onChange={e => setCreateMessage(e.target.value)} required />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="lx-btn lx-btn-gold" disabled={creating || !createSubject.trim() || !createMessage.trim() || !createCategory || !createPriority}>
                  {creating ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  ) : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            width: '100%', maxWidth: 680,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
            display: 'flex', flexDirection: 'column', maxHeight: '85vh',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{activeTicket.ticketNumber}</h5>
                    <StatusBadge status={activeTicket.status} />
                    <PriorityBadge priority={activeTicket.priority} />
                  </div>
                  <p style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--lx-text)' }}>{activeTicket.subject}</p>
                  <small style={{ color: 'var(--lx-text-muted)' }}>
                    {CATEGORY_LABELS[activeTicket.category]} · Opened {formatDate(activeTicket.createdAt)}
                  </small>
                </div>
                <button onClick={() => setActiveTicket(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)', padding: 4 }}>
                  <i className="isax isax-close-circle" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxHeight: '48vh' }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : !activeTicket.messages?.length ? (
                <p style={{ textAlign: 'center', color: 'var(--lx-text-muted)', padding: '24px 0' }}>No messages yet.</p>
              ) : (
                activeTicket.messages.map((msg: TicketMessage) => (
                  <div key={msg.id} style={{ display: 'flex', marginBottom: 16, flexDirection: msg.isAdminReply ? 'row' : 'row-reverse' }}>
                    <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: msg.isAdminReply ? 'flex-start' : 'flex-end' }}>
                      <small style={{ color: 'var(--lx-text-muted)', marginBottom: 4, fontSize: 12 }}>
                        {msg.isAdminReply ? <strong>Support Team</strong> : <strong>You</strong>}
                        {' · '}{formatDateTime(msg.createdAt)}
                      </small>
                      <div style={{
                        padding: '10px 16px', borderRadius: 12, wordBreak: 'break-word', fontSize: 14, lineHeight: 1.5,
                        ...(msg.isAdminReply
                          ? { background: 'rgba(107, 29, 42, 0.04)', border: '1px solid rgba(107, 29, 42, 0.06)', color: 'var(--lx-text)' }
                          : { background: 'var(--lx-primary)', color: '#fff' }
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

            {/* Reply */}
            {activeTicket.status !== 'CLOSED' ? (
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', gap: 12 }}>
                <textarea
                  style={{ ...inputStyle, resize: 'none' as const }}
                  rows={2}
                  placeholder="Type your reply…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  disabled={replying}
                />
                <button type="button" className="lx-btn lx-btn-gold" onClick={handleReply} disabled={!replyText.trim() || replying} style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
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

export default InstructorTickets;
