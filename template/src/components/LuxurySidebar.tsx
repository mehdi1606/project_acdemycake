import React from 'react';
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

/* ─── Student navigation ─────────────────────────────────── */
const studentNav: SidebarGroup[] = [
  {
    label: 'Learning',
    items: [
      { title: 'Dashboard',      icon: 'isax isax-category',        route: all_routes.studentDashboard },
      { title: 'My Courses',     icon: 'isax isax-book',             route: all_routes.studentCourses },
      { title: 'My Profile',     icon: 'isax isax-user',             route: all_routes.studentProfile },
      { title: 'Certificates',   icon: 'isax isax-medal',            route: all_routes.studentCertificates },
      { title: 'Quiz Attempts',  icon: 'isax isax-award',            route: all_routes.studentQuiz, subRoute: all_routes.studentQuizQuestion },
      { title: 'Wishlist',       icon: 'isax isax-heart',            route: all_routes.studentWishlist },
      { title: 'Reviews',        icon: 'isax isax-star',             route: all_routes.studentReviews },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Messages',       icon: 'isax isax-messages-3',       route: all_routes.studentMessage },
      { title: 'Order History',  icon: 'isax isax-shopping-cart',    route: all_routes.studentOrderHistory },
      { title: 'Referrals',      icon: 'isax isax-tag-user',         route: all_routes.studentReferral },
      { title: 'Support',        icon: 'isax isax-ticket',           route: all_routes.studentTickets },
      { title: 'Settings',       icon: 'isax isax-setting-2',        route: all_routes.studentSettings },
    ],
  },
];

/* ─── Instructor navigation ──────────────────────────────── */
const instructorNav: SidebarGroup[] = [
  {
    label: 'Teaching',
    items: [
      { title: 'Dashboard',         icon: 'isax isax-category',          route: all_routes.instructorDashboard },
      { title: 'My Courses',        icon: 'isax isax-book',               route: all_routes.instructorCourse },
      { title: 'Create Course',     icon: 'isax isax-add-circle',         route: all_routes.addNewCourse },
      { title: 'Announcements',     icon: 'isax isax-volume-high',        route: all_routes.instructorAnnouncements },
      { title: 'Assignments',       icon: 'isax isax-clipboard-text',     route: all_routes.instructorAssignment },
    ],
  },
  {
    label: 'Students',
    items: [
      { title: 'My Profile',        icon: 'isax isax-user',               route: all_routes.instructorProfile },
      { title: 'Student Progress',  icon: 'isax isax-profile-2user',      route: all_routes.studentsList },
      { title: 'Quiz Management',   icon: 'isax isax-award',              route: all_routes.instructorQuiz, subRoute: all_routes.instructorQA },
      { title: 'Quiz Results',      icon: 'isax isax-medal-star',         route: all_routes.instructorQuizResult },
      { title: 'Certificates',      icon: 'isax isax-medal',              route: all_routes.instructorCertificate },
    ],
  },
  {
    label: 'Finance',
    items: [
      { title: 'Earnings',          icon: 'isax isax-wallet',             route: all_routes.instructorEarning },
      { title: 'Statements',        icon: 'isax isax-document-text',      route: all_routes.instructorStatements },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Messages',          icon: 'isax isax-messages-3',         route: all_routes.instructorMessage },
      { title: 'Settings',          icon: 'isax isax-setting-2',          route: all_routes.instructorsettings },
    ],
  },
];

/* ─── Admin navigation ───────────────────────────────────── */
const adminNav: SidebarGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard',         icon: 'isax isax-category',           route: all_routes.adminDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { title: 'Manage Users',      icon: 'isax isax-people',             route: all_routes.adminUsers },
      { title: 'Manage Courses',    icon: 'isax isax-book',               route: all_routes.adminCourses },
      { title: 'Pending Approvals', icon: 'isax isax-clock',              route: all_routes.adminPendingCourses },
      { title: 'Categories',        icon: 'isax isax-folder-2',           route: all_routes.adminCategories },
    ],
  },
  {
    label: 'Finance & Reports',
    items: [
      { title: 'Transactions',      icon: 'isax isax-card',               route: all_routes.adminTransactions },
      { title: 'Analytics',         icon: 'isax isax-chart-2',            route: all_routes.adminAnalytics },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Support Tickets',   icon: 'isax isax-ticket',             route: all_routes.adminTickets },
      { title: 'Site Settings',     icon: 'isax isax-setting-2',          route: all_routes.adminSettings },
    ],
  },
];

/* ─── Component ──────────────────────────────────────────── */
interface LuxurySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const LuxurySidebar: React.FC<LuxurySidebarProps> = ({ collapsed, onToggle }) => {
  const location  = useLocation();
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const { user }  = useAppSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

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
    if (user?.role === 'ADMIN')      return 'Administrator';
    if (user?.role === 'INSTRUCTOR') return 'Instructor';
    return 'Student';
  };

  const roleColor = getRoleColor();

  return (
    <aside className={`luxury-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Desktop collapse toggle */}
      <button className="sidebar-toggle-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
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
          title={collapsed ? 'Logout' : undefined}
          style={{ background: 'none', cursor: 'pointer' }}
        >
          <i className="isax isax-logout" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default LuxurySidebar;
