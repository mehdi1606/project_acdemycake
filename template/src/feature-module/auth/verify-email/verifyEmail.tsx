/**
 * VerifyEmailPage
 * Mounted when the user clicks the verification link in their inbox:
 *   http://localhost:3000/verify-email?token=<uuid>
 *
 * Flow:
 *  1. Read ?token= from URL on mount
 *  2. Call POST /auth/verify-email  { token }
 *  3. Show branded SUCCESS or FAILED card
 *  4. On failure, offer a resend form (email input → POST /auth/resend-verification)
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/api/auth.service';
import { all_routes } from '../../router/all_routes';

type Stage = 'verifying' | 'success' | 'failed' | 'no-token';

/* ── tiny gold particle ────────────────────────────────────────────────────── */
const Particle: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div className="sl-vem__particle" style={style} />
);

const particles = [
  { top: '8%',  left: '6%',  w: 5, delay: '0s',   dur: '9s'  },
  { top: '18%', left: '88%', w: 7, delay: '1.5s',  dur: '11s' },
  { top: '68%', left: '5%',  w: 4, delay: '3s',    dur: '8s'  },
  { top: '78%', left: '86%', w: 6, delay: '0.8s',  dur: '10s' },
  { top: '42%', left: '50%', w: 3, delay: '2s',    dur: '7s'  },
];

/* ── component ─────────────────────────────────────────────────────────────── */
const VerifyEmailPage: React.FC = () => {
  const route           = all_routes;
  const [params]        = useSearchParams();
  const token           = params.get('token');

  const [stage, setStage]         = useState<Stage>('verifying');
  const [resendEmail, setResendEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMsg, setResendMsg]   = useState('');
  const calledRef = useRef(false);         // guard StrictMode double-invoke

  useEffect(() => {
    if (!token) { setStage('no-token'); return; }
    if (calledRef.current) return;
    calledRef.current = true;

    authService.verifyEmail(token)
      .then(() => setStage('success'))
      .catch(() => setStage('failed'));
  }, [token]);

  /* ── resend handler ─────────────────────────────────────────────────────── */
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendState('sending');
    try {
      await authService.resendVerificationEmail(resendEmail.trim());
      setResendState('sent');
      setResendMsg(`A new verification link has been sent to ${resendEmail}.`);
    } catch {
      setResendState('error');
      setResendMsg('Could not send the email. Please check the address and try again.');
    }
  };

  /* ── renders ────────────────────────────────────────────────────────────── */
  const renderVerifying = () => (
    <div className="sl-vem__card">
      <div className="sl-vem__spinner-wrap">
        <div className="sl-vem__spinner" />
      </div>
      <h2 className="sl-vem__title">Verifying Your Email…</h2>
      <p className="sl-vem__desc">Just a moment — we're confirming your address.</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="sl-vem__card sl-vem__card--success">
      <div className="sl-vem__icon-wrap sl-vem__icon-wrap--gold">
        <i className="isax isax-tick-circle sl-vem__icon" />
      </div>

      <div className="sl-vem__script">Welcome to</div>
      <h2 className="sl-vem__title">SARALÖWE Academy</h2>
      <p className="sl-vem__desc">
        Your email address has been verified successfully.
        Your account is now active — sign in to start your artisan journey.
      </p>

      <div className="sl-vem__checklist">
        {['Account activated', 'Access to all courses', 'Student dashboard ready', 'Community unlocked'].map((item, i) => (
          <div key={i} className="sl-vem__check-row">
            <i className="isax isax-tick-circle sl-vem__check-icon" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <Link to={route.login} className="sl-vem__btn sl-vem__btn--gold">
        Sign In Now <i className="isax isax-arrow-right-3 ms-2" />
      </Link>
    </div>
  );

  const renderFailed = () => (
    <div className="sl-vem__card sl-vem__card--failed">
      <div className="sl-vem__icon-wrap sl-vem__icon-wrap--burg">
        <i className="isax isax-close-circle sl-vem__icon" />
      </div>
      <h2 className="sl-vem__title">Verification Failed</h2>
      <p className="sl-vem__desc">
        This link is invalid or has expired (links are valid for 24 hours).
        Request a new one below.
      </p>

      {/* Resend form */}
      <form className="sl-vem__resend-form" onSubmit={handleResend}>
        <label className="sl-vem__resend-label" htmlFor="resend-email">
          Your email address
        </label>
        <div className="sl-vem__resend-row">
          <input
            id="resend-email"
            type="email"
            className="sl-vem__resend-input"
            placeholder="you@example.com"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            disabled={resendState === 'sending' || resendState === 'sent'}
            required
          />
          <button
            type="submit"
            className="sl-vem__btn sl-vem__btn--primary"
            disabled={resendState === 'sending' || resendState === 'sent'}
          >
            {resendState === 'sending'
              ? <><span className="sl-vem__btn-spinner" /> Sending…</>
              : resendState === 'sent'
              ? <><i className="isax isax-tick-circle me-1" /> Sent</>
              : 'Resend Link'}
          </button>
        </div>

        {resendState === 'sent' && (
          <p className="sl-vem__resend-msg sl-vem__resend-msg--ok">
            <i className="isax isax-tick-circle me-1" /> {resendMsg}
          </p>
        )}
        {resendState === 'error' && (
          <p className="sl-vem__resend-msg sl-vem__resend-msg--err">
            <i className="isax isax-close-circle me-1" /> {resendMsg}
          </p>
        )}
      </form>

      <Link to={route.login} className="sl-vem__back-link">
        ← Back to Sign In
      </Link>
    </div>
  );

  const renderNoToken = () => (
    <div className="sl-vem__card sl-vem__card--failed">
      <div className="sl-vem__icon-wrap sl-vem__icon-wrap--burg">
        <i className="isax isax-link-broken sl-vem__icon" />
      </div>
      <h2 className="sl-vem__title">Invalid Link</h2>
      <p className="sl-vem__desc">
        The verification link is missing or malformed. Please use the link sent to your inbox,
        or request a new one below.
      </p>
      <Link to={route.login} className="sl-vem__btn sl-vem__btn--primary">
        Back to Sign In
      </Link>
    </div>
  );

  return (
    <div className="sl-vem">
      {particles.map((p, i) => (
        <Particle key={i} style={{ top: p.top, left: p.left, width: p.w, height: p.w, animationDelay: p.delay, animationDuration: p.dur }} />
      ))}

      {/* Logo */}
      <div className="sl-vem__logo-wrap">
        <img
          src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
          alt="SARALÖWE"
          className="sl-vem__logo-img"
        />
        <span className="sl-vem__logo-text">SARALÖWE</span>
      </div>

      {/* Card */}
      <div className="sl-vem__center">
        {stage === 'verifying' && renderVerifying()}
        {stage === 'success'   && renderSuccess()}
        {stage === 'failed'    && renderFailed()}
        {stage === 'no-token'  && renderNoToken()}
      </div>

      <p className="sl-vem__footer-note">
        Need help?{' '}
        <Link to={route.contactUs} className="sl-vem__footer-link">Contact support</Link>
      </p>
    </div>
  );
};

export default VerifyEmailPage;
