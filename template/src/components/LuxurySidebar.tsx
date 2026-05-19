import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../core/redux/hooks';
import { logout } from '../core/redux/authSlice';
import { all_routes } from '../feature-module/router/all_routes';
import { getFileUrl } from '../environment';

interface SidebarItem {
  title: string;
  icon: string;
  route: string;
  subRoute?: string;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

/* ─── Component ──────────────────────────────────────────── */
interface LuxurySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const LuxurySidebar: React.FC<LuxurySidebarProps> = ({ collapsed, onToggle }) => {
  const { t } = useTranslation()
  const location  = useLocation();
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const { user }  = useAppSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

  /* ─── Student navigation ── */
  const studentNav: SidebarGroup[] = [
    {
      label: t('sidebar.learning', 'Learning'),
      items: [
        { title: t('sidebar.dashboard', 'Dashboard'),    icon: 'isax isax-category',     route: all_routes.studentDashboard },
        { title: t('sidebar.myCourses', 'My Courses'),   icon: 'isax isax-book',          route: all_routes.studentCourses },
        { title: t('sidebar.myProfile', 'My Profile'),   icon: 'isax isax-user',          route: all_routes.studentProfile },
        { title: t('sidebar.certificates', 'Certificates'), icon: 'isax isax-medal',     route: all_routes.studentCertificates },
        { title: t('sidebar.wishlist', 'Wishlist'),      icon: 'isax isax-heart',         route: all_routes.studentWishlist },
        { title: t('sidebar.reviews', 'Reviews'),        icon: 'isax isax-star',          route: all_routes.studentReviews },
      ],
    },
    {
      label: t('sidebar.account', 'Account'),
      items: [
        { title: t('sidebar.messages', 'Messages'),      icon: 'isax isax-messages-3',    route: all_routes.studentMessage },
        { title: t('sidebar.orderHistory', 'Order History'), icon: 'isax isax-shopping-cart', route: all_routes.studentOrderHistory },
        { title: t('sidebar.support', 'Support'),        icon: 'isax isax-ticket',        route: all_routes.studentTickets },
        { title: t('sidebar.settings', 'Settings'),      icon: 'isax isax-setting-2',     route: all_routes.studentSettings },
      ],
    },
  ];

  /* ─── Instructor navigation ── */
  const instructorNav: SidebarGroup[] = [
    {
      label: t('sidebar.teaching', 'Teaching'),
      items: [
        { title: t('sidebar.dashboard', 'Dashboard'),        icon: 'isax isax-category',      route: all_routes.instructorDashboard },
        { title: t('sidebar.myCourses', 'My Courses'),       icon: 'isax isax-book',           route: all_routes.instructorCourse },
        { title: t('sidebar.createCourse', 'Create Course'), icon: 'isax isax-add-circle',     route: all_routes.addNewCourse },
        { title: t('sidebar.announcements', 'Announcements'),icon: 'isax isax-volume-high',   route: all_routes.instructorAnnouncements },
        { title: t('sidebar.assignments', 'Assignments'),    icon: 'isax isax-clipboard-text', route: all_routes.instructorAssignment },
      ],
    },
    {
      label: t('sidebar.students', 'Students'),
      items: [
        { title: t('sidebar.myProfile', 'My Profile'),         icon: 'isax isax-user',          route: all_routes.instructorProfile },
        { title: t('sidebar.studentProgress', 'Student Progress'), icon: 'isax isax-profile-2user', route: all_routes.studentsList },
        { title: t('sidebar.quizManagement', 'Quiz Management'), icon: 'isax isax-award',       route: all_routes.instructorQuiz, subRoute: all_routes.instructorQA },
        { title: t('sidebar.quizResults', 'Quiz Results'),     icon: 'isax isax-medal-star',    route: all_routes.instructorQuizResult },
        { title: t('sidebar.certificates', 'Certificates'),    icon: 'isax isax-medal',         route: all_routes.instructorCertificate },
      ],
    },
    {
      label: t('sidebar.finance', 'Finance'),
      items: [
        { title: t('sidebar.earnings', 'Earnings'),    icon: 'isax isax-wallet',        route: all_routes.instructorEarning },
        { title: t('sidebar.statements', 'Statements'),icon: 'isax isax-document-text', route: all_routes.instructorStatements },
      ],
    },
    {
      label: t('sidebar.account', 'Account'),
      items: [
        { title: t('sidebar.messages', 'Messages'), icon: 'isax isax-messages-3', route: all_routes.instructorMessage },
        { title: t('sidebar.settings', 'Settings'), icon: 'isax isax-setting-2',  route: all_routes.instructorsettings },
      ],
    },
  ];

  /* ─── Admin navigation ── */
  const adminNav: SidebarGroup[] = [
    {
      label: t('sidebar.overview', 'Overview'),
      items: [
        { title: t('sidebar.dashboard', 'Dashboard'), icon: 'isax isax-category', route: all_routes.adminDashboard },
      ],
    },
    {
      label: t('sidebar.management', 'Management'),
      items: [
        { title: t('sidebar.manageUsers', 'Manage Users'),        icon: 'isax isax-people',    route: all_routes.adminUsers },
        { title: t('sidebar.manageCourses', 'Manage Courses'),    icon: 'isax isax-book',      route: all_routes.adminCourses },
        { title: t('sidebar.pendingApprovals', 'Pending Approvals'), icon: 'isax isax-clock', route: all_routes.adminPendingCourses },
        { title: t('sidebar.categories', 'Categories'),           icon: 'isax isax-folder-2',  route: all_routes.adminCategories },
      ],
    },
    {
      label: t('sidebar.financeReports', 'Finance & Reports'),
      items: [
        { title: t('sidebar.transactions', 'Transactions'), icon: 'isax isax-card',    route: all_routes.adminTransactions },
        { title: t('sidebar.analytics', 'Analytics'),       icon: 'isax isax-chart-2', route: all_routes.adminAnalytics },
      ],
    },
    {
      label: t('sidebar.account', 'Account'),
      items: [
        { title: t('sidebar.supportTickets', 'Support Tickets'), icon: 'isax isax-ticket',          route: all_routes.adminTickets },
        { title: t('sidebar.coupons', 'Coupons'),                icon: 'isax isax-discount-shape',   route: all_routes.adminCoupons },
        { title: t('sidebar.siteSettings', 'Site Settings'),     icon: 'isax isax-setting-2',        route: all_routes.adminSettings },
      ],
    },
  ];

  const getNavGroups = (): SidebarGroup[] => {
    if (user?.role === 'INSTRUCTOR') return instructorNav;
    if (user?.role === 'ADMIN')      return adminNav;
    return studentNav;
  };

  const isActive = (item: SidebarItem): boolean => {
    if (location.pathname === item.route) return true;
    if (item.subRoute && location.pathname === item.subRoute) return true;
    // Avoid marking "Dashboard" active for sub-pages
    const dashRoutes = [
      all_routes.studentDashboard,
      all_routes.instructorDashboard,
      all_routes.adminDashboard,
    ];
    if (!dashRoutes.includes(item.route) && location.pathname.startsWith(item.route)) return true;
    return false;
  };

  const getRoleColor = () => {
    if (user?.role === 'ADMIN')      return '#6B1D2A';
    if (user?.role === 'INSTRUCTOR') return '#2D5F3F';
    return '#C5973E';
  };

  const getRoleLabel = () => {
    if (user?.role === 'ADMIN')      return t('common.admin', 'Administrator');
    if (user?.role === 'INSTRUCTOR') return t('common.instructor', 'Instructor');
    return t('common.student', 'Student');
  };

  const roleColor = getRoleColor();

  return (
    <aside className={`luxury-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Desktop collapse toggle */}
      <button className="sidebar-toggle-btn" onClick={onToggle} title={collapsed ? t('sidebar.expand', 'Expand') : t('sidebar.collapse', 'Collapse')}>
        <i className={`isax isax-arrow-${collapsed ? 'right' : 'left'}-1`} />
      </button>

      {/* ── User profile area ── */}
      <div className="sidebar-profile">
        <div
          className="sidebar-avatar"
          style={{
            background: `linear-gradient(135deg, ${roleColor}28 0%, ${roleColor}12 100%)`,
            border: `2px solid ${roleColor}38`,
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

        {!collapsed && (
          <div className="sidebar-user-info">
            <h6>{user?.fullName || 'User'}</h6>
            <span
              className="role-badge"
              style={{ background: `${roleColor}18`, color: roleColor }}
            >
              {getRoleLabel()}
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation groups ── */}
      <nav className="sidebar-nav">
        {getNavGroups().map((group, gi) => (
          <div key={gi} className="sidebar-group">
            {!collapsed && <p className="sidebar-group-label">{group.label}</p>}
            <ul>
              {group.items.map((item, ii) => (
                <li key={ii}>
                  <Link
                    to={item.route}
                    className={`sidebar-link${isActive(item) ? ' active' : ''}`}
                    title={collapsed ? item.title : undefined}
                  >
                    <i className={item.icon} />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer: logout ── */}
      <div className="sidebar-footer">
        <button
          className="sidebar-link logout-link"
          onClick={handleLogout}
          title={collapsed ? t('nav.logout', 'Logout') : undefined}
          style={{ background: 'none', cursor: 'pointer' }}
        >
          <i className="isax isax-logout" />
          {!collapsed && <span>{t('nav.logout', 'Logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default LuxurySidebar;
