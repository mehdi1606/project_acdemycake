import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../core/redux/hooks';
import { all_routes } from '../router/all_routes';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  /**
   * When true, the route additionally requires an active SARALÖWE subscription
   * (status === 'ACTIVE').  Defaults to false — auth-only routes stay accessible
   * to all logged-in users regardless of plan.
   */
  requireSubscription?: boolean;
}

/**
 * Guards student dashboard routes.
 *
 * - Unauthenticated users → redirected to /login (with `from` state so they
 *   return after sign-in).
 * - Authenticated but unverified subscription (when requireSubscription=true)
 *   → redirected to /pricing so they can choose a plan.
 * - Authenticated (and subscribed, if required) → allowed through.
 */
const SubscriptionGuard = ({ children, requireSubscription = false }: SubscriptionGuardProps) => {
  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={all_routes.login} state={{ from: location }} replace />;
  }

  if (requireSubscription && currentUser?.subscriptionStatus !== 'ACTIVE') {
    return <Navigate to={all_routes.pricingPlan} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
