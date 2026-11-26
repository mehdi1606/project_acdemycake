import React, { useState, useEffect, useRef, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
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
  const { t } = useTranslation();
  const map: Record<TicketStatus, string> = {
    OPEN: 'badge-info',
    IN_PROGRESS: 'badge-warning',
    CLOSED: 'badge-success',
  };
  return <span className={`lx-badge ${map[status]}`}>{t(`enums.ticketStatus.${status}`, STATUS_LABELS[status] ?? status)}</span>;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    HIGH: 'badge-danger',
    MEDIUM: 'badge-warning',
    LOW: 'badge-success',
  };
  return (
    <span className={`lx-badge ${map[priority] ?? 'badge-slate'}`}>
      {t(`enums.ticketPriority.${priority}`, PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] ?? priority)}
    </span>
  );
};

const PAGE_SIZE = 10;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid rgba(101, 28, 50, 0.12)',
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
      setError(t('student.tickets.loadError', "We couldn't load your tickets. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, t]);

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
      message.error(t('student.tickets.replyError', "Your reply couldn't be sent. Please try again."));
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
      message.error(t('student.tickets.createError', "Your ticket couldn't be created. Please try again, or write to us from the Contact page."));
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
          {t('common.pageOf', 'Page {{page}} of {{total}}', { page: page + 1, total: totalPages })} ({t('student.tickets.count', '{{count}} tickets', { count: totalElements })})
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('common.previous', 'Previous')}</button>
          <button className="lx-btn lx-btn-outline lx-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{t('common.next', 'Next')}</button>
        </div>
      </div>
    );
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>{t('student.tickets.title', 'Support Tickets')}</h5>
        <button className="lx-btn lx-btn-gold" onClick={() => setShowCreate(true)}>
          <i className="isax isax-add-circle" style={{ marginInlineEnd: 6 }} /> {t('student.tickets.newTicket', 'New Ticket')}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: t('common.total', 'Total'), value: stats?.total ?? 0, color: 'slate', icon: 'isax-ticket' },
          { label: t('student.tickets.open', 'Open'), value: stats?.open ?? 0, color: 'sage', icon: 'isax-folder-open' },
          { label: t('student.tickets.inProgress', 'In Progress'), value: stats?.inProgress ?? 0, color: 'gold', icon: 'isax-clock' },
          { label: t('student.tickets.closed', 'Closed'), value: stats?.closed ?? 0, color: 'amber', icon: 'isax-tick-circle' },
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
            {s === '' ? t('common.all', 'All') : t(`enums.ticketStatus.${s}`, STATUS_LABELS[s as TicketStatus])}
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
            <div style={{ padding: '12px 16px', margin: 16, borderRadius: 'var(--lx-radius-sm)', background: 'rgba(101, 28, 50, 0.06)', border: '1px solid rgba(101, 28, 50, 0.12)', color: '#651C32', fontSize: 14 }}>
              {error}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" onClick={() => loadTickets()}>{t('common.tryAgain', 'Try Again')}</button>
                <Link to={all_routes.contactUs} className="lx-btn lx-btn-sm lx-btn-outline">{t('common.contactUs', 'Contact us')}</Link>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="lx-empty-state">
              <span className="empty-icon"><i className="isax isax-ticket" style={{ fontSize: 28 }} /></span>
              <h6>{t('student.tickets.noTickets', 'No tickets found.')}</h6>
              <p>{t('student.tickets.noTicketsDesc', 'Need help? Open a support ticket and we\'ll get back to you.')}</p>
              <button type="button" className="lx-btn lx-btn-gold lx-btn-sm" onClick={() => setShowCreate(true)}>
                <i className="isax isax-add-circle" /> {t('student.tickets.openFirstTicket', 'Open your first ticket')}
              </button>
            </div>
          ) : (
            <div className="lx-table-scroll">
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>{t('instructor.ticketsPage.ticket', 'Ticket')}</th>
                    <th>{t('student.tickets.subject', 'Subject')}</th>
                    <th>{t('common.category', 'Category')}</th>
                    <th>{t('student.tickets.priority', 'Priority')}</th>
                    <th>{t('common.status', 'Status')}</th>
                    <th>{t('common.date', 'Date')}</th>
                    <th>{t('common.actions', 'Actions')}</th>
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
                      <td><span className="lx-badge badge-slate">{t(`enums.ticketCategory.${ticket.category}`, CATEGORY_LABELS[ticket.category] ?? ticket.category)}</span></td>
                      <td><PriorityBadge priority={ticket.priority} /></td>
                      <td><StatusBadge status={ticket.status} /></td>
                      <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatDate(ticket.createdAt)}</td>
                      <td>
                        <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => openTicket(ticket)}>
                          <i className="isax isax-eye" style={{ marginInlineEnd: 4 }} /> {t('common.view', 'View')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {renderPagination()}

      {/* ─── Create Ticket Modal ─── */}
      {showCreate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(43, 15, 30, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 560,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(101, 28, 50, 0.1)',
            boxShadow: '0 24px 48px rgba(43, 15, 30, 0.15)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(101, 28, 50, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{t('instructor.ticketsPage.createTitle', 'Create New Ticket')}</h5>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                    {t('student.tickets.subject', 'Subject')} <span style={{ color: '#651C32' }}>*</span>
                  </label>
                  <input type="text" style={inputStyle} placeholder={t('instructor.ticketsPage.subjectPlaceholder', 'Brief description of the issue')} value={createSubject} onChange={e => setCreateSubject(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                      {t('common.category', 'Category')} <span style={{ color: '#651C32' }}>*</span>
                    </label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={createCategory} onChange={e => setCreateCategory(e.target.value as TicketCategory | '')} required>
                      <option value="">{t('instructor.ticketsPage.selectCategory', 'Select category')}</option>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{t(`enums.ticketCategory.${k}`, v)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                      {t('student.tickets.priority', 'Priority')} <span style={{ color: '#651C32' }}>*</span>
                    </label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={createPriority} onChange={e => setCreatePriority(e.target.value as TicketPriority | '')} required>
                      <option value="">{t('instructor.ticketsPage.selectPriority', 'Select priority')}</option>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{t(`enums.ticketPriority.${k}`, v)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6 }}>
                    {t('student.tickets.message', 'Message')} <span style={{ color: '#651C32' }}>*</span>
                  </label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={4} placeholder={t('student.tickets.descPlaceholder', 'Describe your issue in detail…')} value={createMessage} onChange={e => setCreateMessage(e.target.value)} required />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(101, 28, 50, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowCreate(false)}>{t('common.cancel', 'Cancel')}</button>
                <button type="submit" className="lx-btn lx-btn-gold" disabled={creating || !createSubject.trim() || !createMessage.trim() || !createCategory || !createPriority}>
                  {creating ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  ) : t('student.tickets.submit', 'Submit Ticket')}
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
            background: 'rgba(43, 15, 30, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTicket(null); }}
        >
          <div style={{
            width: '100%', maxWidth: 680,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(101, 28, 50, 0.1)',
            boxShadow: '0 24px 48px rgba(43, 15, 30, 0.15)',
            display: 'flex', flexDirection: 'column', maxHeight: '85vh',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(101, 28, 50, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{activeTicket.ticketNumber}</h5>
                    <StatusBadge status={activeTicket.status} />
                    <PriorityBadge priority={activeTicket.priority} />
                  </div>
                  <p style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--lx-text)' }}>{activeTicket.subject}</p>
                  <small style={{ color: 'var(--lx-text-muted)' }}>
                    {t(`enums.ticketCategory.${activeTicket.category}`, CATEGORY_LABELS[activeTicket.category] ?? activeTicket.category)} · {t('instructor.ticketsPage.openedOn', 'Opened {{date}}', { date: formatDate(activeTicket.createdAt) })}
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
                <LxEmptyState compact icon="isax-messages-2" title={t('student.tickets.noMessages', 'No messages yet.')} text={t('emptyStates.ticketThreadText', 'Replies on this ticket will appear here.')} />
              ) : (
                activeTicket.messages.map((msg: TicketMessage) => (
                  <div key={msg.id} style={{ display: 'flex', marginBottom: 16, flexDirection: msg.isAdminReply ? 'row' : 'row-reverse' }}>
                    <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: msg.isAdminReply ? 'flex-start' : 'flex-end' }}>
                      <small style={{ color: 'var(--lx-text-muted)', marginBottom: 4, fontSize: 12 }}>
                        {msg.isAdminReply ? <strong>{t('student.tickets.supportTeam', 'Support Team')}</strong> : <strong>{t('instructor.ticketsPage.you', 'You')}</strong>}
                        {' · '}{formatDateTime(msg.createdAt)}
                      </small>
                      <div style={{
                        padding: '10px 16px', borderRadius: 12, wordBreak: 'break-word', fontSize: 14, lineHeight: 1.5,
                        ...(msg.isAdminReply
                          ? { background: 'rgba(101, 28, 50, 0.04)', border: '1px solid rgba(101, 28, 50, 0.06)', color: 'var(--lx-text)' }
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
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(101, 28, 50, 0.08)', display: 'flex', gap: 12 }}>
                <textarea
                  style={{ ...inputStyle, resize: 'none' as const }}
                  rows={2}
                  placeholder={t('student.tickets.replyPlaceholder', 'Type your reply… (Enter to send)')}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  disabled={replying}
                />
                <button type="button" className="lx-btn lx-btn-gold" onClick={handleReply} disabled={!replyText.trim() || replying} style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
                  {replying ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  ) : (
                    <><i className="isax isax-send-2" style={{ marginInlineEnd: 4 }} />{t('instructor.ticketsPage.send', 'Send')}</>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(101, 28, 50, 0.08)' }}>
                <div style={{
                  padding: '10px 16px', borderRadius: 'var(--lx-radius-sm)',
                  background: 'rgba(197, 145, 44, 0.06)', border: '1px solid rgba(197, 145, 44, 0.12)',
                  color: '#855A0E', fontSize: 14, textAlign: 'center',
                }}>
                  <i className="isax isax-tick-circle" style={{ marginInlineEnd: 6 }} />
                  {t('instructor.ticketsPage.closed', 'Ticket closed.')}
                  {activeTicket.closedAt && <span> {t('instructor.ticketsPage.resolvedOn', 'Resolved on {{date}}', { date: formatDate(activeTicket.closedAt) })}</span>}
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
