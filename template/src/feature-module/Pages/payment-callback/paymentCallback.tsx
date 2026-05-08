/**
 * PaymentCallbackPage
 *
 * Landing page after the payment gateway redirects the user back.
 * PayZone's return-url is configured as: http://localhost:3000/payment/callback
 *
 * Flow:
 *  1. Read transactionId from sessionStorage (set by pricePlanning before redirect)
 *  2. Poll GET /payments/transaction/{id} every 3 s until status ≠ PENDING
 *  3. Show SUCCESS / FAILED / TIMEOUT states with SARALÖWE brand styling
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentService } from '../../../services/api/payment.service';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch } from '../../../core/redux/hooks';
import { fetchCurrentUser } from '../../../core/redux/authSlice';

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
  const route     = all_routes;
  const dispatch  = useAppDispatch();
  const [params]  = useSearchParams();

  const [stage, setStage]     = useState<Stage>('polling');
  const [message, setMessage] = useState('');
  const pollCount             = useRef(0);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve transactionId: sessionStorage (primary) → URL query param (fallback)
  const transactionId =
    sessionStorage.getItem('sl_pending_txn_id') ||
    params.get('transactionId')                 ||
    params.get('orderId');

  const planId = sessionStorage.getItem('sl_pending_plan_id') || 'your';

  const planLabel: Record<string, string> = {
    monthly:   'Monthly',
    trimester: 'Trimester',
    yearly:    'Annual',
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    sessionStorage.removeItem('sl_pending_txn_id');
    sessionStorage.removeItem('sl_pending_plan_id');
  };

  useEffect(() => {
    if (!transactionId) {
      // No transaction to poll — likely a direct visit; show a neutral state
      setStage('timeout');
      setMessage('No payment reference found. If you just completed a payment, please check your student dashboard.');
      return;
    }

    const poll = async () => {
      pollCount.current += 1;

      try {
        const txn = await paymentService.getTransactionStatus(transactionId);

        if (txn.status === 'COMPLETED') {
          cleanup();
          // Refresh Redux user so subscriptionStatus is up to date
          dispatch(fetchCurrentUser());
          setStage('success');
        } else if (txn.status === 'FAILED' || txn.status === 'CANCELLED') {
          cleanup();
          setStage('failed');
          setMessage(txn.errorMessage || 'Payment was not completed. No charge has been made.');
        } else if (pollCount.current >= MAX_POLLS) {
          cleanup();
          setStage('timeout');
          setMessage("We're still waiting for confirmation from the payment provider. Your subscription will activate automatically once confirmed.");
        }
        // else status === 'PENDING' → keep polling
      } catch {
        // Network blip — keep polling until timeout
        if (pollCount.current >= MAX_POLLS) {
          cleanup();
          setStage('timeout');
          setMessage('Unable to reach the server. Please check your dashboard in a few minutes.');
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
  const renderPolling = () => (
    <div className="sl-pcb__card">
      <div className="sl-pcb__spinner-wrap">
        <div className="sl-pcb__spinner" />
      </div>
      <h2 className="sl-pcb__title">Confirming Your Payment…</h2>
      <p className="sl-pcb__desc">
        Please keep this page open. We're waiting for confirmation from the payment provider.
        This usually takes a few seconds.
      </p>
      <div className="sl-pcb__steps">
        <div className="sl-pcb__step sl-pcb__step--done">
          <i className="isax isax-tick-circle" /> Payment submitted
        </div>
        <div className="sl-pcb__step sl-pcb__step--active">
          <i className="isax isax-refresh-2 sl-pcb__spin-icon" /> Awaiting confirmation
        </div>
        <div className="sl-pcb__step">
          <i className="isax isax-crown" /> Subscription activation
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="sl-pcb__card sl-pcb__card--success">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--gold">
        <i className="isax isax-crown sl-pcb__icon" />
      </div>
      <div className="sl-pcb__script">Welcome to</div>
      <h2 className="sl-pcb__title">SARALÖWE Academy</h2>
      <p className="sl-pcb__desc">
        Your <strong>{planLabel[planId] ?? planId}</strong> subscription is now active.
        You have full access to all courses{planId === 'yearly' ? ', Masterclasses,' : ''} and the community.
      </p>

      <div className="sl-pcb__checklist">
        {[
          'All course videos unlocked',
          'Student dashboard ready',
          'Certificate programme enabled',
          planId === 'yearly' ? 'All Masterclasses included' : 'Individual masterclass purchase available',
        ].map((item, i) => (
          <div key={i} className="sl-pcb__check-row">
            <i className="isax isax-tick-circle sl-pcb__check-icon" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="sl-pcb__actions">
        <Link to={route.courseList} className="sl-pcb__btn sl-pcb__btn--gold">
          Start Learning <i className="isax isax-arrow-right-3 ms-2" />
        </Link>
        <Link to={route.studentDashboard} className="sl-pcb__btn sl-pcb__btn--ghost">
          My Dashboard
        </Link>
      </div>
    </div>
  );

  const renderFailed = () => (
    <div className="sl-pcb__card sl-pcb__card--failed">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--burg">
        <i className="isax isax-close-circle sl-pcb__icon" />
      </div>
      <h2 className="sl-pcb__title">Payment Not Completed</h2>
      <p className="sl-pcb__desc">{message}</p>
      <div className="sl-pcb__actions">
        <Link to={route.pricingPlan} className="sl-pcb__btn sl-pcb__btn--primary">
          Try Again <i className="isax isax-arrow-right-3 ms-2" />
        </Link>
        <Link to={route.homeone} className="sl-pcb__btn sl-pcb__btn--ghost">
          Back to Home
        </Link>
      </div>
    </div>
  );

  const renderTimeout = () => (
    <div className="sl-pcb__card sl-pcb__card--timeout">
      <div className="sl-pcb__icon-wrap sl-pcb__icon-wrap--gold">
        <i className="isax isax-clock sl-pcb__icon" />
      </div>
      <h2 className="sl-pcb__title">Payment Pending</h2>
      <p className="sl-pcb__desc">{message}</p>
      <div className="sl-pcb__actions">
        <Link to={route.studentSubscription} className="sl-pcb__btn sl-pcb__btn--gold">
          Check My Subscription
        </Link>
        <Link to={route.pricingPlan} className="sl-pcb__btn sl-pcb__btn--ghost">
          Back to Plans
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
        Need help?{' '}
        <Link to={route.contactUs} className="sl-pcb__footer-link">Contact support</Link>
      </p>
    </div>
  );
};

export default PaymentCallbackPage;
