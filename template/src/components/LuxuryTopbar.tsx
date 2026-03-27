import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { logout } from '../core/redux/authSlice';
import { all_routes } from '../feature-module/router/all_routes';
import ImageWithBasePath from '../core/common/imageWithBasePath';

interface LuxuryTopbarProps {
  onSidebarToggle: () => void;
}

const LuxuryTopbar: React.FC<LuxuryTopbarProps> = ({ onSidebarToggle }) => {
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user }    = useAppSelector((s) => s.auth);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Close dropdown on route change */
  useEffect(() => { setDropdownOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

  const getDashboardRoute = () => {
    if (user?.role === 'ADMIN')      return all_routes.adminDashboard;
    if (user?.role === 'INSTRUCTOR') return all_routes.instructorDashboard;
    return all_routes.studentDashboard;
  };

  const getProfileRoute = () => {
    if (user?.role === 'ADMIN')      return all_routes.adminSettings;
    if (user?.role === 'INSTRUCTOR') return all_routes.instructorProfile;
    return all_routes.studentProfile;
  };

  const getSettingsRoute = () => {
    if (user?.role === 'ADMIN')      return all_routes.adminSettings;
    if (user?.role === 'INSTRUCTOR') return all_routes.instructorsettings;
    return all_routes.studentSettings;
  };

  const getRoleColor = () => {
    if (user?.role === 'ADMIN')      return '#6B1D2A';
    if (user?.role === 'INSTRUCTOR') return '#2D5F3F';
    return '#C5973E';
  };

  const getRoleLabel = () => {
    if (user?.role === 'ADMIN')      return 'Admin';
    if (user?.role === 'INSTRUCTOR') return 'Instructor';
    return 'Student';
  };

  const roleColor = getRoleColor();

  return (
    <header className="luxury-topbar">
      {/* ── Left: sidebar toggle + logo ── */}
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onSidebarToggle} title="Toggle sidebar">
          <i className="isax isax-menu" />
        </button>

        <Link to={all_routes.homeone} className="topbar-logo">
          <ImageWithBasePath
            src="assets/img/logo-white.png"
            alt="Academy Logo"
            className="topbar-logo-img"
          />
          <span className="topbar-logo-text">Academy</span>
        </Link>
      </div>

      {/* ── Center: search bar ── */}
      <div className={`topbar-search${searchFocused ? ' focused' : ''}`}>
        <i className="isax isax-search-normal-1" />
        <input
          type="text"
          placeholder="Search courses, quizzes, students…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* ── Right: actions + profile ── */}
      <div className="topbar-right">
        {/* Notification bell */}
        <button className="topbar-action-btn" title="Notifications">
          <i className="isax isax-notification" />
          <span className="notif-badge">3</span>
        </button>

        {/* Premium badge / upgrade button (hidden for admins) */}
        {user?.role !== 'ADMIN' && (
          user?.subscriptionStatus === 'ACTIVE' ? (
            <span className="premium-badge">
              <i className="isax isax-crown-1" />
              Premium
            </span>
          ) : (
            <Link to={all_routes.pricingPlan} className="upgrade-btn">
              <i className="isax isax-crown-1" />
              Upgrade
            </Link>
          )
        )}

        {/* Profile dropdown */}
        <div className="topbar-profile" ref={dropdownRef}>
          <button
            className="profile-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {/* Avatar */}
            <div
              className="topbar-avatar"
              style={{
                background: `linear-gradient(135deg, ${roleColor}28 0%, ${roleColor}12 100%)`,
                border: `2px solid ${roleColor}40`,
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} />
              ) : (
                <span style={{ color: roleColor }}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>

            {/* Name + role */}
            <div className="profile-info">
              <span className="profile-name">{user?.fullName?.split(' ')[0] || 'User'}</span>
              <span className="profile-role" style={{ color: roleColor }}>
                {getRoleLabel()}
              </span>
            </div>

            <i className={`isax isax-arrow-down-1 profile-chevron${dropdownOpen ? ' open' : ''}`} />
          </button>

          {/* ── Dropdown menu ── */}
          {dropdownOpen && (
            <div className="profile-dropdown">
              {/* Header */}
              <div className="dropdown-header">
                <div
                  className="dropdown-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${roleColor}35 0%, ${roleColor}18 100%)`,
                    border: `2px solid ${roleColor}30`,
                  }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} />
                  ) : (
                    <span style={{ color: roleColor }}>
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="dropdown-name">{user?.fullName || 'User'}</p>
                  <p className="dropdown-email">{user?.email}</p>
                  <span
                    className="dropdown-role-badge"
                    style={{ background: `${roleColor}18`, color: roleColor }}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider" />

              {/* Navigation items */}
              <div className="dropdown-menu-items">
                <Link
                  to={getDashboardRoute()}
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="isax isax-category" />
                  Dashboard
                </Link>
                <Link
                  to={getProfileRoute()}
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="isax isax-user" />
                  {user?.role === 'ADMIN' ? 'Admin Profile' : 'My Profile'}
                </Link>
                <Link
                  to={getSettingsRoute()}
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="isax isax-setting-2" />
                  Settings
                </Link>

                {/* Admin extras */}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link
                      to={all_routes.adminUsers}
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="isax isax-people" />
                      Manage Users
                    </Link>
                    <Link
                      to={all_routes.adminCourses}
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="isax isax-book" />
                      Manage Courses
                    </Link>
                  </>
                )}
              </div>

              <div className="dropdown-divider" />

              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <i className="isax isax-logout" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default LuxuryTopbar;
