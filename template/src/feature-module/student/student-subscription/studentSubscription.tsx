import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import subscriptionService from '../../../services/api/subscription.service';
import { Subscription, SubscriptionPlan } from '../../../services/api/types';
import { extractApiError } from '../../../services/api/error.utils';
import { all_routes } from '../../router/all_routes';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusBadge: Record<string, string> = {
  ACTIVE: 'badge-success',
  CANCELLED: 'badge-warning',
  EXPIRED: 'badge-danger',
  PENDING: 'badge-info',
};

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open, title, message, confirmLabel, confirmClass = 'btn-danger', loading, onConfirm, onClose,
}) => {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(44,24,16,.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 440, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(32px)', borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107,29,42,.1)', boxShadow: '0 24px 48px rgba(44,24,16,.15)', padding: 32 }}>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="text-muted fs-14 mb-4">{message}</p>
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className={`btn btn-sm ${confirmClass}`} onClick={onConfirm} disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── component ────────────────────────────────────────────────────────────────

const StudentSubscription: React.FC = () => {
  const { t } = useTranslation();
  const _navigate = useNavigate();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cancelModal, setCancelModal] = useState(false);
  const [reactivateModal, setReactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [sub, pl] = await Promise.all([
          subscriptionService.getMySubscription(),
          subscriptionService.getPlans(),
        ]);
        setSubscription(sub);
        setPlans(pl);
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCancel = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      await subscriptionService.cancelSubscription();
      const updated = await subscriptionService.getMySubscription();
      setSubscription(updated);
      setCancelModal(false);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await subscriptionService.reactivateSubscription();
      setSubscription(updated);
      setReactivateModal(false);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const res = await subscriptionService.subscribe(planId);
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  if (loading) {
    return (
      <LuxuryDashboardLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="spinner-border" style={{ color: 'var(--lx-primary)' }} />
        </div>
      </LuxuryDashboardLayout>
    );
  }

  return (
    <LuxuryDashboardLayout>
      <div className="container-fluid py-4" style={{ maxWidth: 860 }}>
        <h5 className="fw-bold mb-1">Subscription</h5>
        <p className="text-muted fs-14 mb-4">Manage your current plan and billing.</p>

        {error && <div className="alert alert-danger py-2 mb-4">{error}</div>}
        {actionError && <div className="alert alert-danger py-2 mb-4">{actionError}</div>}

        {/* Current plan card */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
              <div>
                <h6 className="fw-bold mb-1">Current Plan</h6>
                {subscription ? (
                  <>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="fs-18 fw-bold" style={{ color: 'var(--lx-gold)' }}>
                        {subscription.planType?.toUpperCase() ?? 'YEARLY'}
                      </span>
                      <span className={`badge ${statusBadge[subscription.status] ?? 'badge-secondary'} rounded-pill`}>
                        {subscription.status}
                      </span>
                    </div>
                    <p className="text-muted fs-14 mb-1">
                      <i className="isax isax-calendar me-1" />
                      Started: {fmt(subscription.currentPeriodStart)}
                    </p>
                    <p className="text-muted fs-14 mb-0">
                      <i className="isax isax-calendar-2 me-1" />
                      {subscription.status === 'CANCELLED' ? 'Access until' : 'Renews on'}:{' '}
                      <strong>{fmt(subscription.currentPeriodEnd)}</strong>
                    </p>
                  </>
                ) : (
                  <p className="text-muted fs-14 mb-0">No active subscription.</p>
                )}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {subscription?.status === 'ACTIVE' && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setCancelModal(true)}
                  >
                    Cancel Plan
                  </button>
                )}
                {subscription?.status === 'CANCELLED' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setReactivateModal(true)}
                  >
                    Reactivate
                  </button>
                )}
                {!subscription && (
                  <Link to={all_routes.pricingPlan} className="btn btn-primary btn-sm">
                    View Plans
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Available plans (shown when no active subscription) */}
        {(!subscription || subscription.status !== 'ACTIVE') && plans.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Available Plans</h6>
            <div className="row g-3">
              {plans.map((plan) => (
                <div key={plan.planId} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderTop: '3px solid var(--lx-gold)' }}>
                    <div className="card-body p-4">
                      <h6 className="fw-bold mb-1">{plan.name}</h6>
                      <div className="fs-22 fw-bold mb-1" style={{ color: 'var(--lx-gold)' }}>
                        {plan.currency} {plan.price}
                        <span className="fs-13 fw-normal text-muted ms-1">/ year</span>
                      </div>
                      {plan.description && (
                        <p className="text-muted fs-13 mb-3">{plan.description}</p>
                      )}
                      <button
                        className="btn btn-primary w-100 btn-sm"
                        onClick={() => handleSubscribe(plan.planId)}
                      >
                        Subscribe
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirm */}
      <ConfirmModal
        open={cancelModal}
        title="Cancel Subscription?"
        message="Your access will remain active until the end of the current billing period. You can reactivate at any time."
        confirmLabel="Yes, Cancel"
        confirmClass="btn-danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onClose={() => setCancelModal(false)}
      />

      {/* Reactivate Confirm */}
      <ConfirmModal
        open={reactivateModal}
        title="Reactivate Subscription?"
        message="Your subscription will be reactivated and you will retain access beyond the current billing period."
        confirmLabel="Yes, Reactivate"
        confirmClass="btn-primary"
        loading={actionLoading}
        onConfirm={handleReactivate}
        onClose={() => setReactivateModal(false)}
      />
    </LuxuryDashboardLayout>
  );
};

export default StudentSubscription;
