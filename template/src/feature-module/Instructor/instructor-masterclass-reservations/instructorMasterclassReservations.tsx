/**
 * Instructor › Live masterclass reservations
 *
 * Lists the instructor's LIVE masterclasses and, for the selected one, every
 * participant whose card payment was verified by CMI (confirmed seats), with
 * capacity / remaining places / revenue totals. Data comes from
 * GET /instructor/masterclasses/{id}/participants, which checks ownership
 * server-side. No card data is stored or shown.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import instructorService from '../../../services/api/instructor.service';
import { Course, MasterclassParticipants } from '../../../services/api/types';
import { all_routes } from '../../router/all_routes';
import {
  formatSessionDate,
  formatSessionTimeRange,
  isSessionPast,
} from '../../Courses/course-details/LiveMasterclassBooking';

const money = (v: number | null | undefined, currency = 'MAD') =>
  `${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const Spinner = () => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5">
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
  </div>
);

const InstructorMasterclassReservations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('course') || '';

  const [masterclasses, setMasterclasses] = useState<Course[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [data, setData] = useState<MasterclassParticipants | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // ── Manual participant (WhatsApp booking paid outside the platform) ───────
  const emptyForm = { fullName: '', phone: '', email: '', amountPaid: '', note: '' };
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const setField = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || saving) return;
    if (form.fullName.trim().length < 2) {
      setFormError(t('mcRes.add.nameRequired', 'Please enter the participant\'s full name.'));
      return;
    }
    const amount = form.amountPaid.trim() === '' ? undefined : Number(form.amountPaid.replace(',', '.'));
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      setFormError(t('mcRes.add.amountInvalid', 'Please enter a valid amount.'));
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const updated = await instructorService.addMasterclassParticipant(selectedId, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        amountPaid: amount,
        note: form.note.trim() || undefined,
      });
      setData(updated);
      setForm(emptyForm);
      setShowAdd(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || t('mcRes.add.error', 'Could not add the participant.'));
    } finally {
      setSaving(false);
    }
  };

  const removeManual = async (bookingId: string, name: string) => {
    if (!selectedId) return;
    if (!window.confirm(t('mcRes.remove.confirm', 'Remove {{name}} from this masterclass? Their place will be freed.', { name }))) return;
    try {
      setRemovingId(bookingId);
      setData(await instructorService.removeMasterclassParticipant(selectedId, bookingId));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('mcRes.remove.error', 'Could not remove the participant.'));
    } finally {
      setRemovingId(null);
    }
  };

  // ── Load my LIVE masterclasses ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setListLoading(true);
        const all: Course[] = [];
        // Instructors rarely have more than a few pages; stop after 5 to stay bounded.
        for (let page = 0; page < 5; page++) {
          const resp = await instructorService.getMyCourses(page, 50);
          all.push(...(resp.content ?? []));
          if (resp.last || !resp.content?.length) break;
        }
        if (cancelled) return;
        const live = all
          .filter((c) => c.courseType === 'MASTERCLASS' && c.masterclassFormat === 'LIVE')
          .sort((a, b) => (b.sessionDate || '').localeCompare(a.sessionDate || ''));
        setMasterclasses(live);
        if (!selectedId && live.length) setParams({ course: live[0].id }, { replace: true });
      } catch (e: any) {
        if (!cancelled) setListError(e?.response?.data?.message || t('mcRes.listError', 'Could not load your masterclasses.'));
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load participants of the selected masterclass ─────────────────────────
  const loadParticipants = useCallback(async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      setData(await instructorService.getMasterclassParticipants(id));
    } catch (e: any) {
      setData(null);
      setError(e?.response?.data?.message || t('mcRes.loadError', 'Could not load reservations.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadParticipants(selectedId); }, [selectedId, loadParticipants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data?.participants ?? [];
    if (!q) return rows;
    return rows.filter((p) =>
      [p.fullName, p.email, p.phone].some((v) => (v || '').toLowerCase().includes(q)));
  }, [data, search]);

  const exportCsv = () => {
    if (!data) return;
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Full name', 'Email', 'Phone', 'Masterclass', 'Amount', 'Currency', 'Payment', 'Booking status', 'Note', 'Reserved at'];
    const lines = data.participants.map((p) => [
      p.fullName, p.email, p.phone, data.title, p.amount, p.currency,
      p.source === 'MANUAL' ? 'WhatsApp / manual' : p.paymentStatus, p.bookingStatus, p.note, p.reservedAt,
    ].map(esc).join(','));
    const blob = new Blob(['﻿' + [header.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations-${data.slug || data.courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currency = data?.currency || 'MAD';
  const capacity = data?.capacity ?? null;
  const fillPct = capacity ? Math.min(100, Math.round(((data?.confirmedParticipants ?? 0) / capacity) * 100)) : 0;

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
            {t('mcRes.title', 'Masterclass reservations')}
          </h5>
          <p style={{ fontSize: 13, color: 'var(--lx-text-muted)', margin: '4px 0 0' }}>
            {t('mcRes.subtitle2', 'Participants who paid by card, plus the ones you added after a WhatsApp booking.')}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {masterclasses.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ minWidth: 240, maxWidth: '100%' }}
              value={selectedId}
              onChange={(e) => setParams({ course: e.target.value })}
              aria-label={t('mcRes.select', 'Select a masterclass')}
            >
              {masterclasses.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}{m.sessionDate ? ` — ${m.sessionDate}` : ''}
                </option>
              ))}
            </select>
          )}
          <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => loadParticipants(selectedId)} disabled={!selectedId || loading}>
            <i className="isax isax-refresh" /> {t('common.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {listLoading ? <Spinner /> : listError ? (
        <div className="lx-card"><div className="lx-card-body" style={{ color: '#8B2335' }}>{listError}</div></div>
      ) : masterclasses.length === 0 ? (
        <div className="lx-card">
          <div className="lx-card-body">
            <div className="lx-empty-state">
              <div className="empty-icon"><i className="isax isax-video" /></div>
              <h6>{t('mcRes.none', 'No live masterclass yet.')}</h6>
              <p>{t('mcRes.noneHint', 'Create a masterclass, choose the "Live" format, and set its date, capacity and price.')}</p>
              <Link to={all_routes.addNewCourse} className="lx-btn lx-btn-gold lx-btn-sm mt-2">
                <i className="isax isax-add" /> {t('mcRes.create', 'Create a masterclass')}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Session summary */}
          {data && (
            <div className="lx-card mb-4">
              <div className="lx-card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div style={{ minWidth: 0 }}>
                  <h6 style={{ margin: 0, fontWeight: 700 }}>{data.title}</h6>
                  <div className="d-flex flex-wrap gap-3 mt-2" style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
                    {data.sessionDate && (
                      <span style={{ textTransform: 'capitalize' }}>
                        <i className="isax isax-calendar-1 me-1" />{formatSessionDate(data.sessionDate, i18n.language || 'fr')}
                      </span>
                    )}
                    {formatSessionTimeRange(data) && <span><i className="isax isax-clock me-1" />{formatSessionTimeRange(data)}</span>}
                    {data.sessionLocation && <span><i className="isax isax-location me-1" />{data.sessionLocation}</span>}
                    <span><i className="isax isax-money me-1" />{money(data.price, currency)} / {t('liveBooking.perParticipant', 'participant')}</span>
                  </div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  {isSessionPast(data.sessionDate) && <span className="lx-badge badge-secondary">{t('liveBooking.status.past', 'Session over')}</span>}
                  {data.remainingPlaces === 0 && <span className="lx-badge badge-danger">{t('liveBooking.status.full', 'Fully booked')}</span>}
                  <Link to={`${all_routes.courseDetails}/${data.slug}`} className="lx-btn lx-btn-outline lx-btn-sm">
                    <i className="isax isax-eye" /> {t('mcRes.viewPage', 'View page')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="row g-4 mb-4">
            {[
              { label: t('mcRes.stat.participants', 'Confirmed participants'), value: data ? String(data.confirmedParticipants) : '—', sub: t('mcRes.stat.participantsSub2', 'Card + WhatsApp'), icon: 'isax isax-people', color: 'sage' },
              { label: t('mcRes.stat.capacity', 'Maximum capacity'), value: capacity !== null ? String(capacity) : t('mcRes.unlimited', 'Unlimited'), sub: capacity ? t('mcRes.stat.filled', '{{pct}}% filled', { pct: fillPct }) : '', icon: 'isax isax-element-4', color: 'slate' },
              { label: t('mcRes.stat.remaining', 'Remaining places'), value: data?.remainingPlaces != null ? String(data.remainingPlaces) : '—', sub: t('mcRes.stat.remainingSub', 'Still bookable'), icon: 'isax isax-ticket', color: 'amber' },
              { label: t('mcRes.stat.revenue', 'Total revenue'), value: data ? money(data.totalRevenue, currency) : '—', sub: data?.manualRevenue ? t('mcRes.stat.revenueManual', 'Card payments · + {{amount}} paid on WhatsApp', { amount: money(data.manualRevenue, currency) }) : t('mcRes.stat.revenueSub', 'Confirmed payments only'), icon: 'isax isax-dollar-circle', color: 'gold' },
            ].map((s) => (
              <div key={s.label} className="col-xxl-3 col-lg-6 col-md-6">
                <div className="lx-stat-card">
                  <div className={`stat-icon ${s.color}`}><i className={s.icon} /></div>
                  <div className="stat-info">
                    <p className="stat-label">{s.label}</p>
                    {loading ? (
                      <div style={{ height: 24, width: 80, borderRadius: 6, background: 'rgba(107, 29, 42, 0.06)' }} />
                    ) : (
                      <h3 className="stat-value" style={{ fontSize: 18 }}>{s.value}</h3>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--lx-text-muted)', margin: 0 }}>{s.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Participants table */}
          <div className="lx-card">
            <div className="lx-card-header d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <h6 style={{ margin: 0 }}>{t('mcRes.participants', 'Participants')}</h6>
              <div className="d-flex gap-2 flex-wrap">
                <input
                  type="search"
                  className="form-control form-control-sm"
                  style={{ minWidth: 200 }}
                  placeholder={t('mcRes.search', 'Search name, email, phone')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={exportCsv} disabled={!data?.participants.length}>
                  <i className="isax isax-document-download" /> CSV
                </button>
                <button
                  className="lx-btn lx-btn-gold lx-btn-sm"
                  onClick={() => { setShowAdd((v) => !v); setFormError(''); }}
                  disabled={!data || isSessionPast(data.sessionDate)}
                >
                  <i className="isax isax-user-add" /> {t('mcRes.add.button', 'Add participant')}
                </button>
              </div>
            </div>
            <div className="lx-card-body">
              {showAdd && data && (
                <form onSubmit={submitManual} style={{ padding: 16, borderRadius: 'var(--lx-radius-sm)', border: '1px solid rgba(37,211,102,0.25)', background: 'rgba(37,211,102,0.04)', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    <i className="fa-brands fa-whatsapp me-2" style={{ color: '#25D366' }} />
                    {t('mcRes.add.title', 'Add a participant booked on WhatsApp')}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', margin: '0 0 12px' }}>
                    {t('mcRes.add.hint', 'Use this once the participant has paid you directly (cash, bank transfer...). They take one place. If the e-mail matches an account, they will see their place as confirmed on the site.')}
                  </p>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: 12 }}>{t('mcRes.add.name', 'Full name')} *</label>
                      <input className="form-control form-control-sm" value={form.fullName} onChange={setField('fullName')} maxLength={150} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: 12 }}>{t('mcRes.add.phone', 'Phone (WhatsApp)')}</label>
                      <input className="form-control form-control-sm" type="tel" value={form.phone} onChange={setField('phone')} maxLength={30} placeholder="+212 6..." />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: 12 }}>{t('mcRes.add.email', 'E-mail (optional)')}</label>
                      <input className="form-control form-control-sm" type="email" value={form.email} onChange={setField('email')} maxLength={255} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: 12 }}>{t('mcRes.add.amount', 'Amount paid ({{currency}})', { currency })}</label>
                      <input className="form-control form-control-sm" inputMode="decimal" value={form.amountPaid} onChange={setField('amountPaid')} placeholder={String(data.price ?? '')} />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label" style={{ fontSize: 12 }}>{t('mcRes.add.note', 'Note (optional)')}</label>
                      <input className="form-control form-control-sm" value={form.note} onChange={setField('note')} maxLength={500} placeholder={t('mcRes.add.notePh', 'e.g. paid by bank transfer on 12/11')} />
                    </div>
                  </div>
                  {formError && <div style={{ color: '#8B2335', fontSize: 13, marginTop: 10 }}><i className="isax isax-warning-2 me-1" />{formError}</div>}
                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <button type="button" className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => { setShowAdd(false); setForm(emptyForm); setFormError(''); }} disabled={saving}>
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button type="submit" className="lx-btn lx-btn-gold lx-btn-sm" disabled={saving}>
                      {saving ? t('mcRes.add.saving', 'Adding...') : t('mcRes.add.submit', 'Add participant')}
                    </button>
                  </div>
                </form>
              )}
              {error && (
                <div style={{ padding: '12px 16px', borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139,35,53,0.06)', border: '1px solid rgba(139,35,53,0.12)', color: '#8B2335', fontSize: 14, marginBottom: 16 }}>
                  <i className="isax isax-warning-2 me-2" />{error}
                </div>
              )}
              {loading ? <Spinner /> : !data || data.participants.length === 0 ? (
                <div className="lx-empty-state">
                  <div className="empty-icon"><i className="isax isax-people" /></div>
                  <h6>{t('mcRes.empty', 'No confirmed participants yet.')}</h6>
                  <p>{t('mcRes.emptyHint2', 'Card payments appear here once verified. For WhatsApp bookings, use "Add participant" after you receive the payment.')}</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="lx-table">
                    <thead>
                      <tr>
                        <th>{t('mcRes.col.name', 'Participant')}</th>
                        <th>{t('mcRes.col.phone', 'Phone')}</th>
                        <th style={{ textAlign: 'right' }}>{t('mcRes.col.amount', 'Amount')}</th>
                        <th>{t('mcRes.col.payment', 'Payment')}</th>
                        <th>{t('mcRes.col.booking', 'Booking')}</th>
                        <th>{t('mcRes.col.date', 'Reserved on')}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p) => (
                        <tr key={p.reservationId}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.fullName || '—'}</div>
                            {p.email && <a href={`mailto:${p.email}`} style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{p.email}</a>}
                            {p.note && <div style={{ fontSize: 11, color: 'var(--lx-text-muted)', fontStyle: 'italic' }}>{p.note}</div>}
                          </td>
                          <td style={{ fontSize: 13 }}>
                            {p.phone ? <a href={`tel:${p.phone}`}>{p.phone}</a> : <span style={{ color: 'var(--lx-text-muted)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.amount != null ? money(p.amount, p.currency) : '—'}</td>
                          <td>
                            {p.source === 'MANUAL' ? (
                              <span className="lx-badge" style={{ background: 'rgba(37,211,102,0.12)', color: '#128C7E' }}>
                                <i className="fa-brands fa-whatsapp me-1" />{t('mcRes.manual', 'WhatsApp')}
                              </span>
                            ) : (
                              <span className={`lx-badge ${p.paymentStatus === 'COMPLETED' ? 'badge-success' : 'badge-secondary'}`}>
                                {p.paymentStatus === 'COMPLETED' ? t('mcRes.paidCard', 'Paid by card') : t('mcRes.refunded', 'Refunded')}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`lx-badge ${p.bookingStatus === 'CONFIRMED' ? 'badge-info' : 'badge-danger'}`}>
                              {p.bookingStatus === 'CONFIRMED' ? t('mcRes.confirmed', 'Confirmed') : t('mcRes.cancelled', 'Cancelled')}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>{fmtDateTime(p.reservedAt)}</td>
                          <td style={{ textAlign: 'right' }}>
                            {p.source === 'MANUAL' && p.bookingStatus === 'CONFIRMED' && (
                              <button
                                className="lx-btn lx-btn-outline lx-btn-sm"
                                title={t('mcRes.remove.button', 'Remove')}
                                onClick={() => removeManual(p.reservationId, p.fullName)}
                                disabled={removingId === p.reservationId}
                              >
                                <i className="isax isax-trash" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorMasterclassReservations;
