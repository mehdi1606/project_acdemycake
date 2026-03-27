import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../core/redux/hooks';
import { all_routes } from '../router/all_routes';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * Guards student dashboard routes — requires only authentication (login).
 *
 * Free accounts have full access to the dashboard, courses, community, etc.
 * Premium subscription unlocks additional perks (see pricing page).
 *
 * - Unauthenticated users → redirected to /login
 * - Authenticated (any plan) → allowed through
 */
const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={all_routes.login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
