import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../core/redux/hooks';
import { UserRole } from '../services/api/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User doesn't have required role - redirect to appropriate dashboard
    if (user.role === 'INSTRUCTOR') {
      return <Navigate to="/instructor/instructor-dashboard" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/admin/admin-dashboard" replace />;
    } else {
      return <Navigate to="/student/student-dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

// Higher-order component version for class components
export const withProtectedRoute = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) => {
  return function WithProtectedRouteComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};
