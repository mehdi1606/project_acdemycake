import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import ReactCountryFlag from 'react-country-flag';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { logout } from '../core/redux/authSlice';
import { all_routes } from '../feature-module/router/all_routes';

import { getFileUrl } from '../environment';
import { notificationService } from '../services/api/notification.service';
import { Notification } from '../services/api/types';
import BadgeAvatar from './BadgeAvatar';
import BadgeGuide from './BadgeGuide';
import { getBadgeForUser, progressOf } from '../config/badges';

interface LuxuryTopbarProps {
  onSidebarToggle: () => void;
}

/* ── helpers ── */
function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const isAr = lang === 'ar';
  if (mins < 1) return isAr ? 'الآن' : 'Just now';
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return isAr ? `منذ ${hrs} س` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return isAr ? `منذ ${days} ي` : `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(isAr ? 'ar' : undefined);
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
  const { t } = useTranslation()
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [guideOpen,      setGuideOpen]      = useState(false);
  /** Search is a round icon that opens into a field (hover on computers, tap on touch screens). */
  const [searchOpen,     setSearchOpen]     = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRef      = useRef<HTMLFormElement>(null);
  const searchHoverRef = useRef(false);
  /** Public-site navigation (Home, Masterclasses, Ebooks, Academy) so users can leave the dashboard easily. */
  const [academyOpen,    setAcademyOpen]    = useState(false);
  const [siteMenuOpen,   setSiteMenuOpen]   = useState(false);
  const siteNavRef     = useRef<HTMLDivElement>(null);
  const siteMenuRef    = useRef<HTMLDivElement>(null);

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
  const { stats }    = useAppSelector((s) => s.student);
  const userBadge    = getBadgeForUser(user?.role || 'STUDENT', progressOf(stats, user));

  /* ── public-site links shown in the dashboard top bar ── */
  const siteLinks = [
    { label: t('nav.home'),             to: all_routes.homeone,     icon: 'isax-home-2' },
    { label: t('nav.masterclasses'),    to: all_routes.masterclass, icon: 'isax-video-play' },
    { label: t('nav.ebooks', 'Ebooks'), to: all_routes.ebooks,      icon: 'isax-book-1' },
  ];
  const academyLinks = [
    { label: t('nav.courses'),   to: all_routes.courseList, icon: 'isax-book' },
    { label: t('nav.community'), to: all_routes.blogGrid,   icon: 'isax-people' },
  ];

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
      if (siteNavRef.current && !siteNavRef.current.contains(e.target as Node)) {
        setAcademyOpen(false);
      }
      if (siteMenuRef.current && !siteMenuRef.current.contains(e.target as Node)) {
        setSiteMenuOpen(false);
      }
      // Tapping/clicking elsewhere folds the search back into its icon (unless something is typed).
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        if (!searchInputRef.current?.value) setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotifOpen(false);
        setSearchOpen(false);
        setAcademyOpen(false);
        setSiteMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  /* ── fold the search and site menus on navigation ── */
  useEffect(() => {
    setSearchOpen(false);
    setAcademyOpen(false);
    setSiteMenuOpen(false);
  }, [location.pathname]);

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

  const _handleMarkAsRead = async (notif: Notification) => {
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
    if (user?.role === 'ADMIN')      return t('common.admin', 'Admin');
    if (user?.role === 'INSTRUCTOR') return t('common.instructor', 'Instructor');
    return t('common.student', 'Student');
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    // Reload so all dynamic DB content is re-fetched in the new language
    // (the backend localises responses by the Accept-Language header).
    // …but never wipe text the user has typed and not saved yet.
    let hasUnsavedInput = false;
    try {
      const skip = ['hidden', 'checkbox', 'radio', 'submit', 'button', 'file', 'range', 'color', 'search'];
      hasUnsavedInput = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.luxury-main input, .luxury-main textarea'),
      ).some((el) => {
        if (el instanceof HTMLInputElement && skip.includes(el.type)) return false;
        return el.value.trim() !== '' && el.value !== el.defaultValue;
      });
    } catch { hasUnsavedInput = false; }
    i18n.changeLanguage(next).then(() => { if (!hasUnsavedInput) window.location.reload(); });
  };

  const roleColor = getRoleColor();

  return (
    <>
    {/* Badge Guide – opened only on request (topbar badge button / sidebar "Badges") */}
    {user && (
      <BadgeGuide
        userId={user.id}
        currentBadge={userBadge}
        completedCourses={stats?.completedCourses ?? 0}
        progress={progressOf(stats, user)}
        forceOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    )}
    <header className="luxury-topbar">
      {/* ── Left: sidebar toggle + logo ── */}
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onSidebarToggle}
          title={t('nav.toggleSidebar', 'Toggle sidebar')}
          aria-label={t('nav.toggleSidebar', 'Toggle sidebar')}
        >
          <i className="isax isax-menu" aria-hidden="true" />
        </button>

        <Link to={all_routes.homeone} className="topbar-logo">
          <img
            src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
            alt="SARALÖWE Academy"
            className="topbar-logo-img"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="topbar-logo-text">SARALÖWE</span>
        </Link>
      </div>

      {/* ── Center: the public site's main links (same as the home page header) ── */}
      <nav className="topbar-sitenav" ref={siteNavRef} aria-label={t('topbar.siteNav', 'Site navigation')}>
        {siteLinks.map((l) => (
          <Link key={l.to} to={l.to} className="topbar-sitenav__link">
            <i className={`isax ${l.icon}`} aria-hidden="true" />
            <span>{l.label}</span>
          </Link>
        ))}
        <div className="topbar-sitenav__group">
          <button
            type="button"
            className={`topbar-sitenav__link${academyOpen ? ' is-open' : ''}`}
            aria-expanded={academyOpen}
            aria-haspopup="menu"
            onClick={() => setAcademyOpen((o) => !o)}
          >
            <i className="isax isax-teacher" aria-hidden="true" />
            <span>{t('nav.academy')}</span>
            <i className="isax isax-arrow-down-1 topbar-sitenav__caret" aria-hidden="true" />
          </button>
          {academyOpen && (
            <div className="topbar-sitenav__menu" role="menu">
              {academyLinks.map((l) => (
                <Link key={l.to} to={l.to} role="menuitem" onClick={() => setAcademyOpen(false)}>
                  <i className={`isax ${l.icon}`} aria-hidden="true" />
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── Right: actions + profile ── */}
      <div className="topbar-right">

        {/* ── Site menu (tablets & phones, where the centre links don't fit) ── */}
        <div className="topbar-sitemenu" ref={siteMenuRef}>
          <button
            type="button"
            className="topbar-action-btn"
            aria-label={t('topbar.siteMenu', 'Go to the website')}
            title={t('topbar.siteMenu', 'Go to the website')}
            aria-expanded={siteMenuOpen}
            aria-haspopup="menu"
            onClick={() => setSiteMenuOpen((o) => !o)}
          >
            {/* House icon (roof band + house outline) — opens the website links */}
            <svg className="topbar-home-icon" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"
              fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="miter">
              <polygon points="3.4,9.6 12,3.9 20.6,9.6 20.6,12 12,6.3 3.4,12" />
              <polygon points="5.6,12.9 12,8.6 18.4,12.9 18.4,19.6 5.6,19.6" />
            </svg>
          </button>
          {siteMenuOpen && (
            <div className="topbar-sitenav__menu topbar-sitemenu__panel" role="menu">
              {[...siteLinks, ...academyLinks].map((l) => (
                <Link key={l.to} to={l.to} role="menuitem" onClick={() => setSiteMenuOpen(false)}>
                  <i className={`isax ${l.icon}`} aria-hidden="true" />
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Search: a round icon that opens into a field (hover on computers, tap on phones) ── */}
        <form
          ref={searchRef}
          role="search"
          className={`topbar-search${searchOpen ? ' open' : ''}${searchFocused ? ' focused' : ''}`}
          onMouseEnter={() => {
            searchHoverRef.current = true;
            if (window.matchMedia('(hover: hover)').matches) {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 60);
            }
          }}
          onMouseLeave={() => {
            searchHoverRef.current = false;
            if (window.matchMedia('(hover: hover)').matches && !searchQuery) {
              searchInputRef.current?.blur();
              setSearchOpen(false);
            }
          }}
          onSubmit={(e) => {
            e.preventDefault();
            const q = searchQuery.trim();
            setSearchOpen(false);
            navigate(q ? `${all_routes.courseList}?search=${encodeURIComponent(q)}` : all_routes.courseList);
          }}
        >
          <button
            type="button"
            className="topbar-search__btn"
            aria-label={t('common.search', 'Search')}
            title={t('common.search', 'Search')}
            aria-expanded={searchOpen}
            onClick={() => {
              if (searchOpen && searchQuery.trim()) { searchRef.current?.requestSubmit(); return; }
              setSearchOpen((o) => {
                const next = !o || searchHoverRef.current;
                if (next) setTimeout(() => searchInputRef.current?.focus(), 30);
                return next;
              });
            }}
          >
            <i className="isax isax-search-normal-1" aria-hidden="true" />
          </button>
          <input
            ref={searchInputRef}
            type="text"
            tabIndex={searchOpen ? 0 : -1}
            aria-label={t('common.search', 'Search')}
            placeholder={t('topbar.searchPlaceholder', 'Search courses, quizzes, students…')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { setSearchFocused(true); setSearchOpen(true); }}
            onBlur={() => {
              setSearchFocused(false);
              if (!searchQuery && !searchHoverRef.current) setSearchOpen(false);
            }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); (e.target as HTMLInputElement).blur(); } }}
            enterKeyHint="search"
          />
        </form>

        {/* ── Language switcher ── */}
        <button
          type="button"
          className="topbar-action-btn"
          onClick={toggleLanguage}
          aria-label={i18n.language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          title={i18n.language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}
        >
          <ReactCountryFlag
            countryCode={i18n.language === 'ar' ? 'SA' : 'GB'}
            svg
            style={{ width: 24, height: 16, borderRadius: 3, objectFit: 'cover', boxShadow: '0 1px 4px rgba(0,0,0,0.22)', display: 'block' }}
          />
        </button>

        {/* ── Notification bell ── */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className="topbar-action-btn"
            title={t('notifications.title', 'Notifications')}
            aria-label={unreadCount > 0
              ? `${t('notifications.title', 'Notifications')} (${unreadCount} ${t('notifications.new', 'new')})`
              : t('notifications.title', 'Notifications')}
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((o) => !o)}
            style={{ position: 'relative' }}
          >
            <i className="isax isax-notification" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)',
              ...(i18n.dir() === 'rtl' ? { left: 0 } : { right: 0 }),
              width: 380, maxHeight: 520,
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(107, 29, 42, 0.14)',
              border: '1px solid rgba(107, 29, 42, 0.08)',
              zIndex: 9999,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              direction: i18n.dir() === 'rtl' ? 'rtl' : 'ltr',
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
                    {t('notifications.title', 'Notifications')}
                  </h6>
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#6B1D2A', color: '#fff',
                      fontSize: 11, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 10,
                    }}>
                      {unreadCount} {t('notifications.new', 'new')}
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
                    {markingAll ? t('notifications.marking', 'Marking…') : t('notifications.markAllRead', 'Mark All as Read')}
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
                      {t('notifications.noNotifications', 'No notifications yet')}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const color = notifColor(notif.type);
                    return (
                      <div
                        key={notif.id}
                        className="notif-item"
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
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(107, 29, 42, 0.025)';
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
                            {timeAgo(notif.createdAt, i18n.language)}
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
                        {/* Visibility handled in _luxury-dashboard.scss: hover/focus on mouse
                            devices, always visible on touch (hover: none). */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotif(e, notif.id)}
                          style={{
                            position: 'absolute', top: 4,
                            ...(i18n.dir() === 'rtl' ? { left: 4 } : { right: 4 }),
                          }}
                          className="notif-delete-btn"
                          title={t('common.dismiss', 'Dismiss')}
                          aria-label={t('common.dismiss', 'Dismiss')}
                        >
                          <i className="isax isax-close-circle" aria-hidden="true" />
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
                    {t('common.refresh', 'Refresh')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Badge guide trigger icon ── */}
        {user && (
          <button
            type="button"
            className="topbar-badge-btn"
            onClick={() => setGuideOpen(true)}
            title={t('badgeGuide.openHint', 'My badge — see what each badge means')}
            aria-label={t('badgeGuide.openHint', 'My badge — see what each badge means')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              const ring = e.currentTarget.firstElementChild as HTMLElement | null;
              if (ring) { ring.style.transform = 'scale(1.1)'; ring.style.boxShadow = `0 0 16px ${userBadge.color}66`; }
            }}
            onMouseLeave={e => {
              const ring = e.currentTarget.firstElementChild as HTMLElement | null;
              if (ring) { ring.style.transform = 'scale(1)'; ring.style.boxShadow = `0 0 10px ${userBadge.color}33`; }
            }}
          >
            <span
              aria-hidden="true"
              style={{
                background: `radial-gradient(circle, ${userBadge.color}1f 0%, transparent 72%)`,
                border: `1.5px solid ${userBadge.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: `0 0 10px ${userBadge.color}33`,
              }}
            >
              <img
                src={userBadge.image}
                alt=""
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                style={{
                  width: 42,
                  height: 42,
                  objectFit: 'contain',
                  filter: `drop-shadow(0 1px 5px ${userBadge.color}99)`,
                }}
              />
            </span>
            <span className="topbar-badge-label">{t('badgeGuide.myBadge', 'My badge')}</span>
          </button>
        )}

        {/* Premium badge / upgrade button (students only) */}
        {user?.role === 'STUDENT' && (
          user?.subscriptionStatus === 'ACTIVE' ? (
            <span className="premium-badge">
              <i className="isax isax-crown-1" />
              {t('nav.premium', 'Premium')}
            </span>
          ) : (
            <Link
              to={all_routes.pricingPlan}
              className="upgrade-btn"
              aria-label={t('nav.getPremium', 'Get Premium')}
              title={t('nav.getPremium', 'Get Premium')}
            >
              <i className="isax isax-crown-1" aria-hidden="true" />
              <span className="upgrade-label-full">{t('nav.getPremium', 'Get Premium')}</span>
              <span className="upgrade-label-short" aria-hidden="true">{t('nav.upgrade', 'Upgrade')}</span>
            </Link>
          )
        )}

        {/* Profile dropdown */}
        <div className="topbar-profile" ref={dropdownRef}>
          <button
            className="profile-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {/* Avatar with badge ring */}
            <BadgeAvatar
              avatarUrl={user?.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null}
              name={user?.fullName}
              badge={userBadge}
              size="sm"
              roleColor={roleColor}
              className="topbar-avatar"
            />

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
                <BadgeAvatar
                  avatarUrl={user?.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null}
                  name={user?.fullName}
                  badge={userBadge}
                  size="md"
                  roleColor={roleColor}
                  className="dropdown-avatar"
                />
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
                  {t('nav.dashboard', 'Dashboard')}
                </Link>
                <Link
                  to={getProfileRoute()}
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="isax isax-user" />
                  {user?.role === 'ADMIN' ? t('nav.adminProfile', 'Admin Profile') : t('nav.myProfile', 'My Profile')}
                </Link>
                <Link
                  to={getSettingsRoute()}
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="isax isax-setting-2" />
                  {t('nav.settings', 'Settings')}
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
                      {t('nav.manageUsers', 'Manage Users')}
                    </Link>
                    <Link
                      to={all_routes.adminCourses}
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="isax isax-book" />
                      {t('nav.manageCourses', 'Manage Courses')}
                    </Link>
                  </>
                )}
              </div>

              <div className="dropdown-divider" />

              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <i className="isax isax-logout" />
                {t('nav.logout', 'Sign Out')}
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
    </>
  );
};

export default LuxuryTopbar;
