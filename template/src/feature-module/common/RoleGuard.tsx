import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../core/redux/hooks';
import { all_routes } from '../router/all_routes';
import { UserRole } from '../../services/api/types';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to={all_routes.login} state={{ from: location }} replace />;
    }

    if (user && !allowedRoles.includes(user.role)) {
        if (user.role === 'ADMIN') return <Navigate to={all_routes.adminDashboard} replace />;
        if (user.role === 'INSTRUCTOR') return <Navigate to={all_routes.instructorDashboard} replace />;
        return <Navigate to={all_routes.studentDashboard} replace />;
    }

    return <>{children}</>;
};

export default RoleGuard;
