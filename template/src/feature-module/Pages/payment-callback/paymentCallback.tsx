/**
 * PaymentCallbackPage
 *
 * Landing page after CMI Chaabi redirects the browser back (ok-url / fail-url).
 *
 * Flow:
 *  1. Read transactionId from sessionStorage (set before form-submit to CMI)
 *  2. Poll GET /payments/transaction/{id} every 3 s until status ≠ PENDING
 *  3. On SUCCESS:
 *     a. Refresh Redux user so subscriptionStatus / enrollments are up to date
 *     b. If sessionStorage has sl_checkout_queue (multi-course cart), redirect
 *        back to checkout so the next course can be paid
 *  4. Show SUCCESS / FAILED / TIMEOUT states with SARALÖWE brand styling
 */
import React, { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../../../services/api/payment.service';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch } from '../../../core/redux/hooks';
import { fetchCurrentUser } from '../../../core/redux/authSlice';
import { removeFromCart } from '../../../core/redux/cartSlice';
import { PENDING_MASTERCLASS_KEY } from '../../Courses/course-details/LiveMasterclassBooking';

type Stage = 'polling' | 'success' | 'failed' | 'timeout';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS        = 40; // 40 × 3 s = 2 minutes

// ── tiny branded particle ────────────────────────────────────────────────────
const Particle: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div className="sl-pcb__particle" style={style} />
);

const particles = [
  { top: '10%', left: '6%',  w: 5, delay: '0s',   dur: '9s'  },
  { top: '20%', left: '90%', w: 7, delay: '1.5s',  dur: '11s' },
  { top: '70%', left: '4%',  w: 4, delay: '3s',    dur: '8s'  },
  { top: '80%', left: '88%', w: 6, delay: '0.8s',  dur: '10s' },
  { top: '45%', left: '50%', w: 3, delay: '2s',    dur: '7s'  },
];

// ── main component ────────────────────────────────────────────────────────────
const PaymentCallbackPage: React.FC = () => {
  const { t } = useTranslation()
  const route     = all_routes;
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  const [stage, setStage]     = useState<Stage>('polling');
  const [message, setMessage] = useState('');
  const [orderInfo, setOrderInfo] = useState<{ orderId?: string; amount?: string; currency?: string; type?: string }>({});
  const pollCount             = useRef(0);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve transactionId. The backend now redirects here with ?txn=…&oid=…&result=…
  // so the page no longer depends on sessionStorage (that dependency caused the
  // "No payment reference found" screen). Priority:
  //   URL ?txn  →  sessionStorage  →  localStorage fallback  →  legacy query params
  const transactionId =
    params.get('txn')                            ||
    sessionStorage.getItem('sl_pending_txn_id')  ||
    localStorage.getItem('sl_pending_txn_id_fb') ||
    params.get('transactionId')                  ||
    params.get('orderId');

  // Outcome hint + order reference straight from the CMI return URL.
  const resultHint     = (params.get('result') || '').toLowerCase(); // success | failed | pending
  const orderRefFromUrl = params.get('oid') || '';

  // Read once on mount: cleanup() clears storage before the result screen renders.
  const [planId] = useState(() =>
    sessionStorage.getItem('sl_pending_plan_id') ||
    localStorage.getItem('sl_pending_plan_id_fb') ||
    'your');

  // LIVE masterclass booking started from the details page (title, slug, schedule).
  const [pendingMasterclass] = useState<{ slug?: string; title?: string; date?: string; time?: string; location?: string } | null>(() => {
    if (planId !== 'masterclass') return null;
    try {
      const raw = sessionStorage.getItem(PENDING_MASTERCLASS_KEY) || localStorage.getItem(`${PENDING_MASTERCLASS_KEY}_fb`);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const masterclassHref = pendingMasterclass?.slug ? `${route.courseDetails}/${pendingMasterclass.slug}` : route.courseList;
  const [pendingCourseId] = useState(() => sessionStorage.getItem('sl_pending_course_id'));
  const [pendingEbookSlug] = useState(() => sessionStorage.getItem('sl_pending_ebook_slug'));

  /** What was bought: the server's transaction type wins over browser-stored hints. */
  const purchaseKind = (): 'masterclass' | 'course' | 'ebook' | 'subscription' => {
    const type = orderInfo.type;
    if (pendingMasterclass && (!type || type === 'COURSE_PURCHASE')) return 'masterclass';
    if (type === 'COURSE_PURCHASE') return 'course';
    if (type === 'EBOOK_PURCHASE') return 'ebook';
    if (type === 'SUBSCRIPTION') return 'subscription';
    if (planId === 'course') return 'course';
    if (planId === 'ebook') return 'ebook';
    return 'subscription';
  };

  /** Backend refusal reasons are prefixed (FULL: / DUPLICATE:) — show only the sentence. */
  const cleanReason = (msg?: string) => {
    const s = (msg || '').replace(/^(FULL|DUPLICATE):\s*/, '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const planLabel: Record<string, string> = {
    yearly:    t('paymentCallback.planAnnual', 'Annual'),
    trimester: t('paymentCallback.planTrimester', 'Trimester'),
    monthly:   t('paymentCallback.planMonthly', 'Monthly'), // kept for backward-compat with old subscriptions
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    sessionStorage.removeItem('sl_pending_txn_id');
    sessionStorage.removeItem('sl_pending_plan_id');
    // Also clear the localStorage fallback
    localStorage.removeItem('sl_pending_txn_id_fb');
    localStorage.removeItem('sl_pending_plan_id_fb');
    // planId / pendingMasterclass were read at render time, so screens keep their copy.
    sessionStorage.removeItem(PENDING_MASTERCLASS_KEY);
    localStorage.removeItem(`${PENDING_MASTERCLASS_KEY}_fb`);
    sessionStorage.removeItem('sl_pending_course_id');
    sessionStorage.removeItem('sl_pending_ebook_slug');
  };

  useEffect(() => {
    // Seed the order reference from the URL so it shows even before any fetch.
    if (orderRefFromUrl) {
      setOrderInfo((prev) => ({ ...prev, orderId: orderRefFromUrl }));
    }

    // ── FAILED: CMI redirected to failUrl (result=failed). The payment failed for
    // this attempt, so show the FAILED status + order details immediately instead of
    // sitting on the "Confirming your payment…" spinner. No polling — nothing to await.
    if (resultHint === 'failed') {
      setStage('failed');
      setMessage(t('paymentCallback.msgFailedNoCharge', 'Your payment was not completed. No charge has been made to your card.'));
      if (transactionId) {
        // One-shot fetch purely to enrich the order summary (amount / item / reason).
        paymentService.getTransactionStatus(transactionId)
          .then((txn) => {
            setOrderInfo({
              orderId:  txn.orderId || orderRefFromUrl || undefined,
              amount:   txn.amount || undefined,
              currency: txn.currency || undefined,
              type:     txn.transactionType || undefined,
            });
            if (txn.errorMessage) setMessage(cleanReason(txn.errorMessage));
          })
          .catch(() => { /* keep the generic failure message */ });
      }
      return;
    }

    if (!transactionId) {
      // No transaction id to poll. Use the result hint from the CMI return URL so we
      // still show a meaningful success/failure screen instead of a dead-end.
      if (resultHint === 'failed') {
        setStage('failed');
        setMessage(t('paymentCallback.msgFailedNoCharge', 'Your payment was not completed. No charge has been made to your card.'));
      } else if (resultHint === 'success') {
        setStage('timeout');
        setMessage(t('paymentCallback.msgReceivedPending', 'Your payment was received. Your access will activate automatically once the provider confirms it.'));
      } else {
        setStage('timeout');
        setMessage(t('paymentCallback.msgNoReference', 'No payment reference found. If you just completed a payment, please check your student dashboard.'));
      }
      return;
    }

    const poll = async () => {
      pollCount.current += 1;

      try {
        const txn = await paymentService.getTransactionStatus(transactionId);

        // Capture order details for display (order ref, amount, type).
        setOrderInfo({
          orderId:  txn.orderId || orderRefFromUrl || undefined,
          amount:   txn.amount || undefined,
          currency: txn.currency || undefined,
          type:     txn.transactionType || undefined,
        });

        if (txn.status === 'COMPLETED') {
          // Refresh Redux user so subscriptionStatus / enrollments are up to date
          dispatch(fetchCurrentUser());
          // The paid course leaves the cart (otherwise checkout would try to buy it again).
          if (txn.transactionType === 'COURSE_PURCHASE' && pendingCourseId) {
            dispatch(removeFromCart(pendingCourseId));
          }
          // Check if there are more courses in the cart queue (multi-course checkout)
          const checkoutQueue = sessionStorage.getItem('sl_checkout_queue');
          cleanup();
          if (checkoutQueue) {
            // More courses to pay — redirect back to checkout
            sessionStorage.removeItem('sl_checkout_queue');
            // Small delay so the user sees the redirect rather than instant jump
            setTimeout(() => navigate(route.courseCheckout || '/courses/checkout'), 1500);
          }
          setStage('success');
        } else if (txn.status === 'FAILED' || txn.status === 'CANCELLED') {
          cleanup();
          setStage('failed');
          setMessage(cleanReason(txn.errorMessage) || t('paymentCallback.msgNotCompleted', 'Payment was not completed. No charge has been made.'));
        } else if (pollCount.current >= MAX_POLLS) {
          cleanup();
          setStage('timeout');
          setMessage(pendingMasterclass
            ? t('paymentCallback.msgWaitingPlace2', 'We\'re still waiting for confirmation from the payment provider. Your place will be confirmed automatically once the payment is verified.')
            : t('paymentCallback.msgWaitingAccess', 'We\'re still waiting for confirmation from the payment provider. Your access will be activated automatically once the payment is confirmed.'));
        }
        // else status === 'PENDING' → keep polling
      } catch {
        // Network blip — keep polling until timeout
        if (pollCount.current >= MAX_POLLS) {
          cleanup();
          setStage('timeout');
          setMessage(t('paymentCallback.msgUnreachable', 'Unable to reach the server. Please check your dashboard in a few minutes.'));
        }
      }
    };

    // Run once immediately, then every POLL_INTERVAL_MS
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  // ── render helpers ──────────────────────────────────────────────────────────
  const typeLabel: Record<string, string> = {
    SUBSCRIPTION:    t('paymentCallback.typeSubscription', 'Subscription'),
    COURSE_PURCHASE: t('paymentCallback.typeCoursePurchase', 'Course purchase'),
    EBOOK_PURCHASE:  t('paymentCallback.typeEbook', 'Ebook'),
  };
  const kind = purchaseKind();
  const ebookHref = pendingEbookSlug ? `${route.ebooks}/${pendingEbookSlug}` : route.ebooks;
  /** Where "Try again" / "Back" should lead for this kind of purchase. */
  const retryHref = kind === 'masterclass' ? masterclassHref
    : kind === 'course' ? route.courseCart
    : kind === 'ebook' ? ebookHref
    : route.pricingPlan;

  const renderOrderSummary = () => {
    if (!orderInfo.orderId && !orderInfo.amount) return null;
    return (
      <div className="sl-pcb__order">
        <div className="sl-pcb__order-title">{t('paymentCallback.orderDetails', 'Order details')}</div>
        {orderInfo.orderId && (
          <div className="sl-pcb__order-row">
            <span>{t('paymentCallback.reference', 'Reference')}</span>
            <strong>{orderInfo.orderId}</strong>
          </div>
        )}
        {orderInfo.type && (
          <div className="sl-pcb__order-row">
            <span>{t('paymentCallback.item', 'Item')}</span>
            <strong>{pendingMasterclass && orderInfo.type === 'COURSE_PURCHASE' ? t('paymentCallback.masterclassBooking', 'Masterclass booking') : (typeLabel[orderInfo.type] ?? orderInfo.type)}</strong>
          </div>
        )}
        {orderInfo.amount && (
          <div className="sl-pcb__order-row">
            <span>{t('paymentCallback.amountLabel', 'Amount')}</span>
            <strong>{orderInfo.amount} {orderInfo.currency || 'MAD'}</strong>
          </div>
        )}
      </div>
    );
  };

  const renderPolling = () => (
    <div className="sl-pcb__card">
      <div className="sl-pcb__spinner-wrap">
        <div className="sl-pcb__spinner" />
      </div>
      <h2 className="sl-pcb__title">{t('paymentCallback.confirmingTitle', 'Confirming Your Payment…')}</h2>
      <p className="sl-pcb__desc">
        {t('paymentCallback.confirmingDesc', 'Please keep this page open. We\'re waiting for confirmation from the payment provider. This usually takes a few seconds.')}
      </p>
      <div className="sl-pcb__steps">
        <div className="sl-pcb__step sl-pcb__step--done">
          <i className="isax isax-tick-circle" /> {t('paymentCallback.stepSubmitted', 'Payment submitted')}
        </div>
        <div className="sl-pcb__step sl-pcb__step--active">
          <i className="isax isax-refresh-2 sl-pcb__spin-icon" /> {t('paymentCallback.stepAwaiting', 'Awaiting confirmation')}
        </div>
        <div className="sl-pcb__step">
          {kind === 'masterclass' ? <><i className="isax isax-ticket" /> {t('paymentCallback.stepPlace', 'Place confirmation')}</>
            : kind === 'course' ? <><i className="isax isax-book" /> {t('paymentCallback.stepCourse', 'Course access')}</>
            : kind === 'ebook' ? <><i className="isax isax-book-1" /> {t('paymentCallback.stepEbook', 'Ebook access')}</>
            : <><i className="isax isax-crown" /> {t('paymentCallback.stepSubscription', 'Subscription activation')}</>}
        </div>
      </div>
    </div>
  );

  const renderMasterclassSuccess = () => (
    <div className="sl-pcb__card sl-pcb__card--success">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--gold">
        <i className="isax isax-ticket-star sl-pcb__icon" />
      </div>
      <div className="sl-pcb__script">{t('paymentCallback.mcScript', 'Your place is')}</div>
      <h2 className="sl-pcb__title">{t('paymentCallback.mcTitle', 'Confirmed')}</h2>
      <p className="sl-pcb__desc">
        <Trans
          i18nKey="paymentCallback.mcDesc"
          defaults="Payment verified — you are registered for <0>{{title}}</0>. A confirmation has been sent to your email."
          values={{ title: pendingMasterclass?.title || t('paymentCallback.theMasterclass', 'the masterclass') }}
          components={[<strong key="0" />]}
        />
      </p>
      {(pendingMasterclass?.date || pendingMasterclass?.time || pendingMasterclass?.location) && (
        <div className="sl-pcb__checklist">
          {[pendingMasterclass?.date, pendingMasterclass?.time, pendingMasterclass?.location]
            .filter(Boolean)
            .map((item, i) => (
              <div key={i} className="sl-pcb__check-row">
                <i className="isax isax-tick-circle sl-pcb__check-icon" />
                <span style={{ textTransform: i === 0 ? 'capitalize' : undefined }}>{item}</span>
              </div>
            ))}
        </div>
      )}
      {renderOrderSummary()}
      <div className="sl-pcb__actions">
        <Link to={masterclassHref} className="sl-pcb__btn sl-pcb__btn--gold">
          {t('paymentCallback.viewMasterclass', 'View masterclass')} <i className="isax isax-arrow-right-3 ms-2" />
        </Link>
        <Link to={route.studentDashboard} className="sl-pcb__btn sl-pcb__btn--ghost">
          {t('paymentCallback.myDashboard', 'My Dashboard')}
        </Link>
      </div>
    </div>
  );

  const renderSimpleSuccess = (icon: string, script: string, title: string, desc: React.ReactNode,
                               primary: { to: string; label: string }) => (
    <div className="sl-pcb__card sl-pcb__card--success">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--gold">
        <i className={`isax ${icon} sl-pcb__icon`} />
      </div>
      <div className="sl-pcb__script">{script}</div>
      <h2 className="sl-pcb__title">{title}</h2>
      <p className="sl-pcb__desc">{desc}</p>
      {renderOrderSummary()}
      <div className="sl-pcb__actions">
        <Link to={primary.to} className="sl-pcb__btn sl-pcb__btn--gold">
          {primary.label} <i className="isax isax-arrow-right-3 ms-2" />
        </Link>
        <Link to={route.studentDashboard} className="sl-pcb__btn sl-pcb__btn--ghost">
          {t('paymentCallback.myDashboard', 'My Dashboard')}
        </Link>
      </div>
    </div>
  );

  const renderSuccess = () =>
    kind === 'masterclass' ? renderMasterclassSuccess()
    : kind === 'course' ? renderSimpleSuccess('isax-book', t('paymentCallback.paymentConfirmed', 'Payment confirmed'), t('paymentCallback.courseUnlocked', 'Course Unlocked'),
        t('paymentCallback.courseUnlockedDesc', 'Your course is now in your library. You can start learning right away.'),
        { to: route.studentCourses, label: t('paymentCallback.goToMyCourses', 'Go to my courses') })
    : kind === 'ebook' ? renderSimpleSuccess('isax-book-1', t('paymentCallback.paymentConfirmed', 'Payment confirmed'), t('paymentCallback.ebookReady', 'Ebook Ready'),
        t('paymentCallback.ebookReadyDesc', 'Your ebook has been added to your library. You can read or download it now.'),
        { to: route.studentEbooks, label: t('paymentCallback.openMyEbooks', 'Open my ebooks') })
    : (
    <div className="sl-pcb__card sl-pcb__card--success">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--gold">
        <i className="isax isax-crown sl-pcb__icon" />
      </div>
      <div className="sl-pcb__script">{t('paymentCallback.welcomeTo', 'Welcome to')}</div>
      <h2 className="sl-pcb__title">{t('paymentCallback.brandName', 'SARALÖWE Academy')}</h2>
      <p className="sl-pcb__desc">
        <Trans
          i18nKey="paymentCallback.subActive"
          defaults="Your <0>{{plan}}</0> subscription is now active."
          values={{ plan: planLabel[planId] ?? planId }}
          components={[<strong key="0" />]}
        />{' '}
        {planId === 'yearly'
          ? t('paymentCallback.fullAccessYearly', 'You have full access to all courses, Masterclasses, and the community.')
          : t('paymentCallback.fullAccess', 'You have full access to all courses and the community.')}
      </p>

      <div className="sl-pcb__checklist">
        {[
          t('paymentCallback.checkVideos', 'All course videos unlocked'),
          t('paymentCallback.checkDashboard', 'Student dashboard ready'),
          t('paymentCallback.checkCertificate', 'Certificate programme enabled'),
          planId === 'yearly' ? t('paymentCallback.checkAllMasterclasses', 'All Masterclasses included') : t('paymentCallback.checkIndividualMasterclass', 'Individual masterclass purchase available'),
        ].map((item, i) => (
          <div key={i} className="sl-pcb__check-row">
            <i className="isax isax-tick-circle sl-pcb__check-icon" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {renderOrderSummary()}

      <div className="sl-pcb__actions">
        <Link to={route.courseList} className="sl-pcb__btn sl-pcb__btn--gold">
          {t('paymentCallback.startLearning', 'Start Learning')} <i className="isax isax-arrow-right-3 ms-2" />
        </Link>
        <Link to={route.studentDashboard} className="sl-pcb__btn sl-pcb__btn--ghost">
          {t('paymentCallback.myDashboard', 'My Dashboard')}
        </Link>
      </div>
    </div>
  );

  const renderFailed = () => (
    <div className="sl-pcb__card sl-pcb__card--failed">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--burg">
        <i className="isax isax-close-circle sl-pcb__icon" />
      </div>
      <h2 className="sl-pcb__title">{pendingMasterclass ? t('paymentCallback.bookingNotConfirmed', 'Booking Not Confirmed') : t('paymentCallback.paymentNotCompleted', 'Payment Not Completed')}</h2>
      <p className="sl-pcb__desc">{message}</p>
      {renderOrderSummary()}
      <div className="sl-pcb__actions">
        <Link to={retryHref} className="sl-pcb__btn sl-pcb__btn--primary">
          {t('paymentCallback.tryAgainBtn', 'Try Again')} <i className="isax isax-arrow-right-3 ms-2" />
        </Link>
        <Link to={route.homeone} className="sl-pcb__btn sl-pcb__btn--ghost">
          {t('paymentCallback.backToHomeBtn', 'Back to Home')}
        </Link>
      </div>
    </div>
  );

  const renderTimeout = () => (
    <div className="sl-pcb__card sl-pcb__card--timeout">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--gold">
        <i className="isax isax-clock sl-pcb__icon" />
      </div>
      <h2 className="sl-pcb__title">{t('paymentCallback.paymentPending', 'Payment Pending')}</h2>
      <p className="sl-pcb__desc">{message}</p>
      {renderOrderSummary()}
      <div className="sl-pcb__actions">
        {kind === 'subscription' ? (
          <Link to={route.studentSubscription} className="sl-pcb__btn sl-pcb__btn--gold">
            {t('paymentCallback.checkMySubscription', 'Check My Subscription')}
          </Link>
        ) : (
          <Link to={retryHref} className="sl-pcb__btn sl-pcb__btn--gold">
            {t('paymentCallback.back', 'Back')}
          </Link>
        )}
        <Link to={route.studentDashboard} className="sl-pcb__btn sl-pcb__btn--ghost">
          {t('paymentCallback.myDashboard', 'My Dashboard')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="sl-pcb">
      {/* Particles */}
      {particles.map((p, i) => (
        <Particle
          key={i}
          style={{ top: p.top, left: p.left, width: p.w, height: p.w, animationDelay: p.delay, animationDuration: p.dur }}
        />
      ))}

      {/* Centered logo */}
      <div className="sl-pcb__logo-wrap">
        <img
          src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
          alt="SARALÖWE"
          className="sl-pcb__logo-img"
        />
        <span className="sl-pcb__logo-text">SARALÖWE</span>
      </div>

      {/* Main card */}
      <div className="sl-pcb__center">
        {stage === 'polling'  && renderPolling()}
        {stage === 'success'  && renderSuccess()}
        {stage === 'failed'   && renderFailed()}
        {stage === 'timeout'  && renderTimeout()}
      </div>

      {/* Footer note */}
      <p className="sl-pcb__footer-note">
        {t('paymentCallback.needHelp', 'Need help?')}{' '}
        <Link to={route.contactUs} className="sl-pcb__footer-link">{t('paymentCallback.contactSupportLink', 'Contact support')}</Link>
      </p>
    </div>
  );
};

export default PaymentCallbackPage;
