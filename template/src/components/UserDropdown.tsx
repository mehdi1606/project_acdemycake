import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { logout } from '../core/redux/authSlice';
import { all_routes } from '../feature-module/router/all_routes';
import { getFileUrl } from '../environment';
import { message } from 'antd';

const UserDropdown: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      message.success('Logged out successfully');
      navigate('/');
    } catch {
      // Still redirect on error
      navigate('/');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <Link
          to={all_routes.login}
          className="btn btn-light d-inline-flex align-items-center me-2"
        >
          <i className="isax isax-lock-circle me-2" />
          Sign In
        </Link>
        <Link to={all_routes.register} className="btn btn-secondary me-0">
          <i className="isax isax-user-edit me-2" />
          Register
        </Link>
      </>
    );
  }

  const avatarUrl = getFileUrl(user.avatarUrl) ?? 'assets/img/user/user-01.jpg';

  const isInstructor = user.role === 'INSTRUCTOR';
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="dropdown profile-dropdown">
      <Link
        to="#"
        className="d-flex align-items-center"
        data-bs-toggle="dropdown"
      >
        <span className="avatar">
          <img
            src={avatarUrl}
            alt={user.fullName}
            className="img-fluid rounded-circle"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'assets/img/user/user-01.jpg';
            }}
          />
        </span>
      </Link>
      <div className="dropdown-menu dropdown-menu-end">
        <div className="profile-header d-flex align-items-center">
          <div className="avatar">
            <img
              src={avatarUrl}
              alt={user.fullName}
              className="img-fluid rounded-circle"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'assets/img/user/user-01.jpg';
              }}
            />
          </div>
          <div>
            <h6>{user.fullName}</h6>
            <p>{user.email}</p>
          </div>
        </div>
        <ul className="profile-body">
          {isInstructor ? (
            <>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.instructorProfile}
                >
                  <i className="isax isax-security-user me-2" />
                  My Profile
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.instructorDashboard}
                >
                  <i className="isax isax-chart me-2" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.instructorCourse}
                >
                  <i className="isax isax-teacher me-2" />
                  My Courses
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.instructorEarning}
                >
                  <i className="isax isax-dollar-circle me-2" />
                  Earnings
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.instructorMessage}
                >
                  <i className="isax isax-messages-3 me-2" />
                  Messages
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.instructorsettings}
                >
                  <i className="isax isax-setting-2 me-2" />
                  Settings
                </Link>
              </li>
            </>
          ) : isAdmin ? (
            <>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to="/admin/admin-dashboard"
                >
                  <i className="isax isax-chart me-2" />
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to="/admin/users"
                >
                  <i className="isax isax-people me-2" />
                  Manage Users
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to="/admin/courses"
                >
                  <i className="isax isax-book me-2" />
                  Manage Courses
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.studentProfile}
                >
                  <i className="isax isax-security-user me-2" />
                  My Profile
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.studentDashboard}
                >
                  <i className="isax isax-chart me-2" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.studentCourses}
                >
                  <i className="isax isax-book me-2" />
                  My Courses
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.studentWishlist}
                >
                  <i className="isax isax-heart me-2" />
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.studentMessage}
                >
                  <i className="isax isax-messages-3 me-2" />
                  Messages
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item d-inline-flex align-items-center rounded fw-medium"
                  to={all_routes.studentSettings}
                >
                  <i className="isax isax-setting-2 me-2" />
                  Settings
                </Link>
              </li>
            </>
          )}
        </ul>
        <div className="profile-footer">
          <button
            onClick={handleLogout}
            className="btn btn-secondary d-inline-flex align-items-center justify-content-center w-100"
          >
            <i className="isax isax-logout me-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDropdown;
