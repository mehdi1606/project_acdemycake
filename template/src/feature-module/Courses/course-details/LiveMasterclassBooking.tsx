/**
 * Booking panel for a LIVE masterclass (course details sidebar).
 *
 * Two ways to book:
 *  A. WhatsApp — opens a pre-filled conversation with the academy. This never
 *     takes a seat; the instructor confirms it directly with the student.
 *  B. Card (CMI) — the backend holds a seat while the payment is in progress and
 *     only confirms the booking after CMI's verified server-to-server callback.
 *     If the session fills up meanwhile, the card is not charged.
 *
 * Seat numbers come from the server (seatsRemaining / seatsTaken). Nothing here
 * changes availability; the browser only displays it.
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { App, Spin } from 'antd';
import { Course } from '../../../services/api/types';
import { paymentService } from '../../../services/api/payment.service';
import { all_routes } from '../../router/all_routes';

const WA = '#1da851';
const BURG = 'linear-gradient(135deg,#651C32,#8B2335)';

export const PENDING_MASTERCLASS_KEY = 'sl_pending_masterclass';

/* ── formatting helpers (shared with the details page) ─────────────────────── */

/** "2026-12-05" → localised long date. Parsed as a local date (no UTC shift). */
export function formatSessionDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** "14:30:00" → "14:30". */
export const formatSessionTime = (t?: string | null) => (t ? t.slice(0, 5) : null);

export function formatSessionTimeRange(c: Pick<Course, 'sessionStartTime' | 'sessionEndTime'>): string | null {
  const s = formatSessionTime(c.sessionStartTime);
  const e = formatSessionTime(c.sessionEndTime);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

/** True once the session day is over (local time). */
export function isSessionPast(iso?: string | null): boolean {
  if (!iso) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const end = new Date(y, m - 1, d, 23, 59, 59);
  return end.getTime() < Date.now();
}

/** Seat figures for display. `remaining` is null when there is no seat limit. */
export function liveSeatInfo(c: Course) {
  const capacity = c.maxStudents && c.maxStudents > 0 ? c.maxStudents : null;
  const remaining = capacity === null
    ? null
    : (typeof c.seatsRemaining === 'number' ? c.seatsRemaining : capacity);
  const taken = typeof c.seatsTaken === 'number' ? c.seatsTaken : null;
  return { capacity, remaining, taken, isFull: remaining !== null && remaining <= 0 };
}

/* ── component ─────────────────────────────────────────────────────────────── */

interface Props {
  course: Course;
  isAuthenticated: boolean;
  user?: { fullName?: string; email?: string; role?: string; id?: string } | null;
  isInstructor: boolean;
  isAdmin: boolean;
  /** Reloads the course from the server (fresh availability). */
  onRefresh: () => void;
  onWishlist?: () => void;
  wishlistBusy?: boolean;
}

const row = (icon: string, label: string, value: React.ReactNode, key: string) => (
  <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(29,168,81,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <i className={icon} style={{ color: WA, fontSize: 14 }} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8080', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1810', wordBreak: 'break-word' }}>{value}</div>
    </div>
  </div>
);

const LiveMasterclassBooking: React.FC<Props> = ({
  course: c, isAuthenticated, user, isInstructor, isAdmin, onRefresh, onWishlist, wishlistBusy,
}) => {
  const { t, i18n } = useTranslation();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [paying, setPaying] = useState(false);

  // Keep availability fresh while the page is open (other people may be booking).
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') onRefresh();
    }, 30000);
    return () => window.clearInterval(id);
  }, [onRefresh]);

  const price = Number(c.price ?? 0);
  const currency = c.currency || 'MAD';
  const cardEnabled = price > 0;
  const { capacity, remaining, taken, isFull } = liveSeatInfo(c);
  const past = isSessionPast(c.sessionDate);
  const dateLabel = formatSessionDate(c.sessionDate, i18n.language || 'fr');
  const timeLabel = formatSessionTimeRange(c);
  const isOwner = isInstructor && !!user?.id && c.instructor?.id === user.id;
  const isStaff = isInstructor || isAdmin;
  const booked = !isStaff && !!c.isEnrolled;
  const fewLeft = remaining !== null && capacity !== null && remaining > 0 && remaining <= Math.max(3, Math.ceil(capacity * 0.2));

  /* WhatsApp link with a pre-filled message */
  const waNumber = (c.reservationWhatsapp || '').replace(/[^0-9]/g, '');
  const waLines = [
    t('liveBooking.wa.intro', 'Hello, I would like to reserve a place for the masterclass "{{title}}".', { title: c.title }),
    dateLabel && t('liveBooking.wa.date', 'Date: {{date}}', { date: dateLabel }),
    timeLabel && t('liveBooking.wa.time', 'Time: {{time}}', { time: timeLabel }),
    c.sessionLocation && t('liveBooking.wa.location', 'Location: {{location}}', { location: c.sessionLocation }),
    price > 0 && t('liveBooking.wa.price', 'Price: {{price}} {{currency}}', { price, currency }),
    c.instructor?.fullName && t('liveBooking.wa.instructor', 'Instructor: {{name}}', { name: c.instructor.fullName }),
    isAuthenticated && user?.fullName && t('liveBooking.wa.name', 'My name: {{name}}', { name: user.fullName }),
    isAuthenticated && user?.email && t('liveBooking.wa.email', 'My email: {{email}}', { email: user.email }),
    typeof window !== 'undefined' ? window.location.href : '',
  ].filter(Boolean).join('\n');
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waLines)}` : null;

  /* Card payment through the existing CMI checkout */
  const startPayment = async () => {
    setPaying(true);
    try {
      const resp = await paymentService.initiateCmiCourse(c.id);
      const pending = JSON.stringify({ slug: c.slug, title: c.title, date: dateLabel, time: timeLabel, location: c.sessionLocation });
      try {
        sessionStorage.setItem('sl_pending_txn_id', resp.transactionId);
        sessionStorage.setItem('sl_pending_plan_id', 'masterclass');
        sessionStorage.setItem(PENDING_MASTERCLASS_KEY, pending);
        sessionStorage.removeItem('sl_checkout_queue');
        localStorage.setItem('sl_pending_txn_id_fb', resp.transactionId);
        localStorage.setItem('sl_pending_plan_id_fb', 'masterclass');
        localStorage.setItem(`${PENDING_MASTERCLASS_KEY}_fb`, pending);
      } catch { /* storage unavailable — the callback page still works from the URL */ }
      paymentService.submitCmiForm(resp.gatewayUrl, resp.formParams);
      // The browser now navigates to CMI; keep the loading state.
    } catch (err: any) {
      setPaying(false);
      const status = err?.response?.status;
      const serverMsg: string = err?.response?.data?.message || '';
      if (status === 409) {
        message.warning(serverMsg || t('liveBooking.full', 'This masterclass is full.'));
        onRefresh();
      } else if (status === 401) {
        navigate(all_routes.login, { state: { from: location.pathname } });
      } else {
        message.error(serverMsg || t('liveBooking.payError', 'Could not start the payment. Please try again.'));
        if (status === 400) onRefresh();
      }
    }
  };

  const confirmPayment = () => {
    if (!isAuthenticated) {
      message.info(t('liveBooking.loginFirst', 'Please log in to pay online.'));
      navigate(all_routes.login, { state: { from: location.pathname } });
      return;
    }
    modal.confirm({
      title: t('liveBooking.confirmTitle', 'Pay {{price}} {{currency}} by card?', { price, currency }),
      content: (
        <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
          <div><strong>{c.title}</strong></div>
          {dateLabel && <div>{dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}</div>}
          {c.sessionLocation && <div>{c.sessionLocation}</div>}
          <div style={{ marginTop: 8 }}>
            {t('liveBooking.confirmBody', 'You will be redirected to the secure CMI payment page. Your place is held for 30 minutes and confirmed once the payment is verified.')}
          </div>
        </div>
      ),
      okText: t('liveBooking.confirmOk', 'Continue to payment'),
      okButtonProps: { style: { background: '#651C32', borderColor: '#651C32' } },
      icon: <i className="fa-solid fa-lock" style={{ color: '#651C32', fontSize: 18, marginInlineEnd: 12, marginTop: 3 }} />,
      cancelText: t('common.cancel', 'Cancel'),
      onOk: startPayment,
    });
  };

  /* ── header: price + availability ─────────────────────────────────────── */
  const pct = capacity && remaining !== null ? Math.min(100, Math.round(((capacity - remaining) / capacity) * 100)) : 0;
  const statusChip = past
    ? { text: t('liveBooking.status.past', 'Session over'), bg: 'rgba(107,114,128,0.12)', fg: '#4b5563' }
    : isFull
      ? { text: t('liveBooking.status.full', 'Fully booked'), bg: 'rgba(220,38,38,0.1)', fg: '#DC2626' }
      : fewLeft
        ? { text: t('liveBooking.status.few', 'Few places left'), bg: 'rgba(245,158,11,0.12)', fg: '#B45309' }
        : { text: t('liveBooking.status.open', 'Booking open'), bg: 'rgba(29,168,81,0.1)', fg: '#146C35' };

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
    padding: '14px 18px', borderRadius: 12, boxSizing: 'border-box', fontWeight: 800, fontSize: 15,
    textDecoration: 'none', border: 'none',
  };

  return (
    <div id="sl-live-booking">
      {/* Price / availability header */}
      <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid rgba(197,145,44,0.08)', background: 'linear-gradient(145deg,rgba(29,168,81,0.06),rgba(29,168,81,0.01))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: WA }}>
            <i className="isax isax-video me-1" /> {t('liveBooking.badge', 'Live masterclass')}
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: statusChip.bg, color: statusChip.fg }}>
            {statusChip.text}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {price > 0 ? (
            <>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 800, color: '#2C1810' }}>{price.toLocaleString(i18n.language)}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#9A8080' }}>{currency}</span>
              <span style={{ fontSize: 12, color: '#9A8080' }}>/ {t('liveBooking.perParticipant', 'participant')}</span>
            </>
          ) : (
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: '#2C1810' }}>
              {t('liveBooking.onRequest', 'Reservation on WhatsApp')}
            </span>
          )}
        </div>

        {capacity !== null && remaining !== null && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              <span style={{ color: isFull ? '#DC2626' : '#2C1810' }}>
                {isFull
                  ? t('liveBooking.noPlaces', 'No places left')
                  : t('liveBooking.placesLeft', '{{count}} of {{capacity}} places left', { count: remaining, capacity })}
              </span>
              <span style={{ color: '#9A8080' }}>{t('liveBooking.capacity', 'Capacity {{capacity}}', { capacity })}</span>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: 'rgba(29,168,81,0.12)', overflow: 'hidden' }}
                 role="progressbar" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={capacity - remaining}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, transition: 'width .5s ease',
                background: isFull ? '#DC2626' : fewLeft ? 'linear-gradient(90deg,#F59E0B,#D97706)' : `linear-gradient(90deg,#34D399,${WA})` }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '18px 18px 16px' }}>
        {/* Session details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          {dateLabel && row('isax isax-calendar-1', t('liveBooking.date', 'Date'), <span style={{ textTransform: 'capitalize' }}>{dateLabel}</span>, 'date')}
          {timeLabel && row('isax isax-clock', t('liveBooking.time', 'Time'), timeLabel, 'time')}
          {c.sessionLocation && row('isax isax-location', t('liveBooking.location', 'Location'), (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.sessionLocation)}`}
               target="_blank" rel="noopener noreferrer" style={{ color: '#2C1810', textDecoration: 'underline dotted' }}>
              {c.sessionLocation}
            </a>
          ), 'loc')}
          {c.instructor?.fullName && row('isax isax-teacher', t('liveBooking.instructor', 'Instructor'), c.instructor.fullName, 'instr')}
          {!dateLabel && !timeLabel && !c.sessionLocation && (
            <p style={{ fontSize: 12.5, color: '#7A6060', margin: 0 }}>
              {t('courseDetails.liveSessionNote', 'Live bespoke session — the date is agreed with you directly')}
            </p>
          )}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        {isStaff ? (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', fontSize: 13, color: '#1D4ED8' }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              {isAdmin ? t('liveBooking.adminView', 'Admin view') : t('liveBooking.instructorView', 'Instructor view')}
            </div>
            {taken !== null && (
              <div style={{ marginBottom: 8 }}>{t('liveBooking.paidCount', '{{count}} confirmed paid participant(s)', { count: taken })}</div>
            )}
            {(isOwner || isAdmin) && (
              <Link to={`${all_routes.instructorMasterclassReservations}?course=${c.id}`}
                    style={{ ...btnBase, background: BURG, color: '#fff', fontSize: 14, padding: '11px 14px' }}>
                <i className="isax isax-people" /> {t('liveBooking.manage', 'View reservations')}
              </Link>
            )}
          </div>
        ) : booked ? (
          <div style={{ padding: '16px', borderRadius: 14, background: 'linear-gradient(145deg,#064e3b,#047857)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 22, color: '#6EE7B7' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{t('liveBooking.booked', 'Your place is confirmed')}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t('liveBooking.bookedSub', 'Payment received — see you at the session!')}</div>
              </div>
            </div>
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                 style={{ ...btnBase, marginTop: 12, padding: '10px 14px', fontSize: 13, background: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                <i className="fa-brands fa-whatsapp" /> {t('liveBooking.contact', 'Contact the academy')}
              </a>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Option B — card */}
            {cardEnabled && (
              <div style={{ border: '1.5px solid rgba(101,28,50,0.14)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#651C32', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  <i className="fa-regular fa-credit-card me-1" /> {t('liveBooking.optionCard', 'Pay online by card')}
                </div>
                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={paying || isFull || past}
                  style={{
                    ...btnBase, background: (isFull || past) ? '#d1d5db' : BURG, color: '#fff',
                    cursor: (paying || isFull || past) ? 'not-allowed' : 'pointer', opacity: paying ? 0.8 : 1,
                    boxShadow: (isFull || past) ? 'none' : '0 6px 20px rgba(101,28,50,0.28)',
                  }}
                >
                  {paying ? <Spin size="small" /> : <i className="fa-solid fa-lock" />}
                  {paying
                    ? t('liveBooking.redirecting', 'Redirecting to secure payment…')
                    : past ? t('liveBooking.status.past', 'Session over')
                    : isFull ? t('liveBooking.status.full', 'Fully booked')
                    : t('liveBooking.payNow', 'Book now · {{price}} {{currency}}', { price, currency })}
                </button>
                <p style={{ fontSize: 11, color: '#9A8080', margin: '8px 0 0', lineHeight: 1.5 }}>
                  <i className="fa-solid fa-shield-halved me-1" style={{ color: '#10B981' }} />
                  {t('liveBooking.cardNote', 'Secure payment by CMI. Your place is confirmed only after the payment is verified. If the session fills up first, your card is not charged.')}
                </p>
              </div>
            )}

            {/* Option A — WhatsApp */}
            <div style={{ border: '1.5px solid rgba(29,168,81,0.25)', borderRadius: 14, padding: 14, background: 'rgba(29,168,81,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#146C35', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                <i className="fa-brands fa-whatsapp me-1" /> {t('liveBooking.optionWa', 'Reserve through WhatsApp')}
              </div>
              {waHref ? (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                   style={{ ...btnBase, background: 'linear-gradient(135deg,#25D366,#1da851)', color: '#fff', boxShadow: '0 6px 20px rgba(37,211,102,0.28)' }}>
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: 19 }} />
                  {t('courseDetails.reservePlace', 'Reserve my place')}
                </a>
              ) : (
                <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(197,145,44,0.07)', fontSize: 12.5, color: '#7A6060', textAlign: 'center' }}>
                  {t('courseDetails.reserveUnavailable', 'Reservations are not open yet — please contact the academy.')}
                </div>
              )}
              <p style={{ fontSize: 11, color: '#9A8080', margin: '8px 0 0', lineHeight: 1.5 }}>
                {t('liveBooking.waNote', 'Chat with the academy to ask questions or arrange your booking. A WhatsApp request does not reserve a place until it is confirmed.')}
              </p>
            </div>
          </div>
        )}

        {onWishlist && !isInstructor && (
          <button onClick={onWishlist} disabled={wishlistBusy} style={{
            width: '100%', padding: '11px 16px', borderRadius: 12, marginTop: 12,
            border: `1.5px solid ${c.isWishlisted ? 'rgba(239,68,68,0.25)' : 'rgba(197,145,44,0.15)'}`,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            background: c.isWishlisted ? 'rgba(239,68,68,0.04)' : 'transparent',
            color: c.isWishlisted ? '#EF4444' : '#7A6060',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box',
          }}>
            <i className={`fa-${c.isWishlisted ? 'solid' : 'regular'} fa-heart`} />
            <span>{c.isWishlisted ? t('courses.details.removeFromWishlist', 'Remove from Wishlist') : t('courses.details.addToWishlist', 'Add to Wishlist')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveMasterclassBooking;
