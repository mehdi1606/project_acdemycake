import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { logout } from '../core/redux/authSlice';
import { all_routes } from '../feature-module/router/all_routes';
import ImageWithBasePath from '../core/common/imageWithBasePath';
import { getFileUrl } from '../environment';
import { notificationService } from '../services/api/notification.service';
import { Notification } from '../services/api/types';

interface LuxuryTopbarProps {
  onSidebarToggle: () => void;
}

/* ── helpers ── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function notifIcon(type: string): string {
  switch (type) {
    case 'COURSE_ENROLLED':    return 'isax-book-1';
    case 'COURSE_COMPLETED':   return 'isax-medal';
    case 'CERTIFICATE_ISSUED': return 'isax-award';
    case 'NEW_MESSAGE':        return 'isax-messages-3';
    case 'NEW_REVIEW':         return 'isax-star';
    case 'SUBSCRIPTION_EXPIRING':
    case 'SUBSCRIPTION_RENEWED': return 'isax-crown-1';
    case 'PAYMENT_RECEIVED':   return 'isax-card';
    case 'ANNOUNCEMENT':       return 'isax-volume-high';
    default:                   return 'isax-notification';
  }
}

function notifColor(type: string): string {
  switch (type) {
    case 'NEW_MESSAGE':        return '#3B82F6';
    case 'COURSE_ENROLLED':
    case 'COURSE_COMPLETED':   return '#10B981';
    case 'CERTIFICATE_ISSUED': return '#C5973E';
    case 'PAYMENT_RECEIVED':   return '#8B5CF6';
    case 'NEW_REVIEW':         return '#F59E0B';
    case 'SUBSCRIPTION_EXPIRING': return '#EF4444';
    case 'SUBSCRIPTION_RENEWED':  return '#10B981';
    default:                   return '#6B1D2A';
  }
}

const LuxuryTopbar: React.FC<LuxuryTopbarProps> = ({ onSidebarToggle }) => {
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');

  /* notifications state */
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [notifLoading,   setNotifLoading]   = useState(false);
  const [markingAll,     setMarkingAll]     = useState(false);

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const notifRef     = useRef<HTMLDivElement>(null);
  const dispatch     = useAppDispatch();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useAppSelector((s) => s.auth);

  /* ── fetch unread count silently (poll every 60s) ── */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  /* ── fetch notification list when panel opens ── */
  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const result = await notificationService.getNotifications(0, 15);
      setNotifications(result.content ?? []);
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── close on route change ── */
  useEffect(() => {
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

  const handleMarkAsRead = async (notif: Notification) => {
    if (notif.isRead) return;
    try {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  /* ── Navigate to the relevant page when a notification is clicked ── */
  const getNotifRoute = (notif: Notification): string | null => {
    const role = user?.role;

    // If backend provided a linkUrl like "/messages?userId=xxx",
    // remap it to the correct role-based frontend route
    if (notif.linkUrl) {
      let rawPath = notif.linkUrl;
      // Strip absolute origin if present (e.g. "http://localhost:8080/messages?userId=xxx")
      try {
        const url = new URL(notif.linkUrl);
        rawPath = url.pathname + url.search;
      } catch {
        // already relative
      }

      // Remap generic "/messages?userId=xxx" to role-specific route + correct param name
      if (rawPath.startsWith('/messages')) {
        const qsRaw = rawPath.includes('?') ? rawPath.substring(rawPath.indexOf('?') + 1) : '';
        const params = new URLSearchParams(qsRaw);
        const senderId = params.get('userId') ?? '';

        if (role === 'INSTRUCTOR') {
          // Instructor chat page uses ?studentId= & ?studentName=
          const qs = senderId ? `?studentId=${senderId}` : '';
          return `${all_routes.instructorMessage}${qs}`;
        }
        // Student chat page uses ?userId= & ?userName=
        const qs = senderId ? `?userId=${senderId}` : '';
        return `${all_routes.studentMessage}${qs}`;
      }

      return rawPath;
    }

    // Fallback routes based on notification type
    switch (notif.type) {
      case 'NEW_MESSAGE':
        if (role === 'INSTRUCTOR') return all_routes.instructorMessage;
        return all_routes.studentMessage;
      case 'COURSE_ENROLLED':
      case 'COURSE_COMPLETED':
        return all_routes.studentCourses;
      case 'CERTIFICATE_ISSUED':
        return all_routes.studentCertificates;
      case 'PAYMENT_RECEIVED':
        return all_routes.studentOrderHistory;
      case 'NEW_REVIEW':
        if (role === 'INSTRUCTOR') return all_routes.instructorDashboard;
        return null;
      case 'ANNOUNCEMENT':
        return null;
      default:
        return null;
    }
  };

  const handleNotifClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }

    // Navigate
    const route = getNotifRoute(notif);
    if (route) {
      setNotifOpen(false);
      navigate(route);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  /* ── role helpers ── */
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

        {/* ── Notification bell ── */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="topbar-action-btn"
            title="Notifications"
            onClick={() => setNotifOpen((o) => !o)}
            style={{ position: 'relative' }}
          >
            <i className="isax isax-notification" />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 380, maxHeight: 520,
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(107, 29, 42, 0.14)',
              border: '1px solid rgba(107, 29, 42, 0.08)',
              zIndex: 9999,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Panel header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px 12px',
                borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h6 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
                    Notifications
                  </h6>
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#6B1D2A', color: '#fff',
                      fontSize: 11, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 10,
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, color: '#6B1D2A',
                      padding: '4px 8px', borderRadius: 6,
                    }}
                  >
                    {markingAll ? 'Marking…' : 'Mark all read'}
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifLoading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      border: '3px solid #6B1D2A', borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite', margin: '0 auto',
                    }} />
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'rgba(107, 29, 42, 0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}>
                      <i className="isax isax-notification-bing" style={{ fontSize: 24, color: 'rgba(107, 29, 42, 0.35)' }} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const color = notifColor(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '12px 18px',
                          background: notif.isRead ? 'transparent' : 'rgba(107, 29, 42, 0.025)',
                          borderBottom: '1px solid rgba(107, 29, 42, 0.04)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(107, 29, 42, 0.04)';
                          const btn = e.currentTarget.querySelector('.notif-delete-btn') as HTMLElement;
                          if (btn) btn.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(107, 29, 42, 0.025)';
                          const btn = e.currentTarget.querySelector('.notif-delete-btn') as HTMLElement;
                          if (btn) btn.style.opacity = '0';
                        }}
                      >
                        {/* Icon */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: `${color}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={`isax ${notifIcon(notif.type)}`} style={{ fontSize: 18, color }} />
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: '0 0 2px',
                            fontSize: 13, fontWeight: notif.isRead ? 500 : 700,
                            color: '#1a1a2e',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {notif.title}
                          </p>
                          <p style={{
                            margin: '0 0 4px', fontSize: 12,
                            color: '#6b7280', lineHeight: 1.4,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {notif.message}
                          </p>
                          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>

                        {/* Unread dot */}
                        {!notif.isRead && (
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#6B1D2A', flexShrink: 0, marginTop: 4,
                          }} />
                        )}

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteNotif(e, notif.id)}
                          style={{
                            position: 'absolute', top: 10, right: 12,
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 3, borderRadius: 4,
                            opacity: 0, transition: 'opacity 0.15s',
                            color: '#9ca3af', fontSize: 14,
                          }}
                          className="notif-delete-btn"
                          title="Dismiss"
                        >
                          <i className="isax isax-close-circle" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Panel footer */}
              {notifications.length > 0 && (
                <div style={{
                  padding: '10px 18px',
                  borderTop: '1px solid rgba(107, 29, 42, 0.06)',
                  textAlign: 'center', flexShrink: 0,
                }}>
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      fetchNotifications();
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, color: '#6B1D2A',
                    }}
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Premium badge / upgrade button (students only) */}
        {user?.role === 'STUDENT' && (
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
                <img src={getFileUrl(user.avatarUrl) ?? user.avatarUrl} alt={user.fullName} />
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
                    <img src={getFileUrl(user.avatarUrl) ?? user.avatarUrl} alt={user.fullName} />
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
