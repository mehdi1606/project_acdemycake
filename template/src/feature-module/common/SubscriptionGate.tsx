/**
 * SubscriptionGate
 * Shown in place of course content when the visitor is not logged in.
 * Renders blurred ghost cards behind a centred lock panel.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../router/all_routes';

interface Props {
  /** "masterclass" | "course" — controls the copy */
  type?: 'masterclass' | 'course';
  /** How many ghost cards to show (default 6) */
  ghostCount?: number;
  /** Pass true when the user is already logged in (just missing a subscription) */
  isAuthenticated?: boolean;
}

const GhostCard: React.FC = () => (
  <div className="sl-gate__ghost-card">
    <div className="sl-gate__ghost-thumb" />
    <div className="sl-gate__ghost-body">
      <div className="sl-gate__ghost-line" style={{ width: '40%', height: 10 }} />
      <div className="sl-gate__ghost-line" style={{ width: '85%', height: 16, marginTop: 8 }} />
      <div className="sl-gate__ghost-line" style={{ width: '60%', height: 11, marginTop: 6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <div className="sl-gate__ghost-line" style={{ width: 52, height: 18 }} />
        <div className="sl-gate__ghost-line" style={{ width: 96, height: 34, borderRadius: 6 }} />
      </div>
    </div>
  </div>
);

const SubscriptionGate: React.FC<Props> = ({ type = 'course', ghostCount = 6, isAuthenticated = false }) => {
  const route = all_routes;

  const isMasterclass = type === 'masterclass';

  return (
    <div className="sl-gate">
      {/* Blurred ghost cards grid */}
      <div className="sl-gate__ghost-grid">
        {Array.from({ length: ghostCount }).map((_, i) => (
          <GhostCard key={i} />
        ))}
      </div>

      {/* Lock overlay */}
      <div className="sl-gate__overlay">
        <div className="sl-gate__panel">
          {/* Gold lock icon */}
          <div className="sl-gate__icon-wrap">
            <i className="isax isax-lock sl-gate__icon" />
          </div>

          <div className="sl-gate__script">
            {isAuthenticated
              ? 'Upgrade Required'
              : (isMasterclass ? 'Exclusive Access' : 'Members Only')}
          </div>

          <h3 className="sl-gate__title">
            {isAuthenticated
              ? 'A Subscription Is Required'
              : (isMasterclass
                  ? 'Subscribe to View Masterclasses'
                  : 'A Subscription Is Required')}
          </h3>

          <p className="sl-gate__desc">
            {isAuthenticated
              ? 'Full access to our course catalogue is reserved for SARALÖWE Academy subscribers. Choose a plan to unlock all programmes.'
              : (isMasterclass
                  ? 'Our masterclasses are exclusive to SARALÖWE Academy subscribers. Choose a plan to unlock all programmes or purchase individual masterclasses.'
                  : 'Full access to our course catalogue is available to SARALÖWE Academy subscribers. Choose a plan that suits your learning pace.')}
          </p>

          {/* Stats strip */}
          <div className="sl-gate__stats">
            <div className="sl-gate__stat">
              <span className="sl-gate__stat-num">120+</span>
              <span className="sl-gate__stat-lbl">Courses</span>
            </div>
            <div className="sl-gate__stat-divider" />
            <div className="sl-gate__stat">
              <span className="sl-gate__stat-num">50K+</span>
              <span className="sl-gate__stat-lbl">Students</span>
            </div>
            <div className="sl-gate__stat-divider" />
            <div className="sl-gate__stat">
              <span className="sl-gate__stat-num">98%</span>
              <span className="sl-gate__stat-lbl">Satisfaction</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="sl-gate__actions">
            <Link to={route.pricingPlan} className="sl-gate__btn sl-gate__btn--gold">
              View Plans <i className="isax isax-arrow-right-3 ms-2" />
            </Link>
            {/* Only show Sign In when the visitor is NOT logged in */}
            {!isAuthenticated && (
              <Link to={route.login} className="sl-gate__btn sl-gate__btn--ghost">
                Sign In
              </Link>
            )}
          </div>

          {/* Only show "Already subscribed? Log in" when visitor is a guest */}
          {!isAuthenticated && (
            <p className="sl-gate__footnote">
              Already subscribed?{' '}
              <Link to={route.login} className="sl-gate__footnote-link">
                Log in to continue
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
