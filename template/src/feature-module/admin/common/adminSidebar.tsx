import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { logout } from '../../../core/redux/authSlice';
import { getFileUrl } from '../../../environment';

const adminSidebarData = [
  {
    title: 'Dashboard',
    icon: 'isax isax-category',
    route: all_routes.adminDashboard,
  },
  {
    title: 'User Management',
    icon: 'isax isax-people',
    route: all_routes.adminUsers,
  },
  {
    title: 'Course Management',
    icon: 'isax isax-book',
    route: all_routes.adminCourses,
  },
  {
    title: 'Pending Approvals',
    icon: 'isax isax-clock',
    route: all_routes.adminPendingCourses,
  },
  {
    title: 'Categories',
    icon: 'isax isax-folder-2',
    route: all_routes.adminCategories,
  },
  {
    title: 'Transactions',
    icon: 'isax isax-card',
    route: all_routes.adminTransactions,
  },
  {
    title: 'Support Tickets',
    icon: 'isax isax-ticket',
    route: all_routes.adminTickets,
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

  return (
    <div className="col-lg-3">
      <div className="settings-sidebar theiaStickySidebar">
        <div>
          {/* Admin Profile Header */}
          <div
            className="admin-profile-header mb-4 p-3 rounded"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
              color: '#fff'
            }}
          >
            <div className="d-flex align-items-center">
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#6B1D2A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={getFileUrl(user.avatarUrl) ?? user.avatarUrl}
                    alt={user.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  user?.fullName?.charAt(0).toUpperCase() || 'A'
                )}
              </div>
              <div className="ms-3">
                <h6 className="mb-0 text-white">{user?.fullName || 'Admin'}</h6>
                <small className="text-white-50">Administrator</small>
              </div>
            </div>
          </div>

          <h6 className="mb-3 text-uppercase" style={{ fontSize: '12px', letterSpacing: '1px', color: '#888' }}>
            Admin Panel
          </h6>
          <ul className="mb-3 pb-1">
            {adminSidebarData.map((menu, index) => (
              <li key={index}>
                <Link
                  to={menu.route}
                  className={`d-inline-flex align-items-center ${
                    location.pathname === menu.route ? 'active' : ''
                  }`}
                >
                  <i className={`${menu.icon} me-2`} />
                  {menu.title}
                </Link>
              </li>
            ))}
          </ul>
          <hr />
          <h6 className="mb-3 text-uppercase" style={{ fontSize: '12px', letterSpacing: '1px', color: '#888' }}>
            Account
          </h6>
          <ul>
            <li>
              <Link
                to={all_routes.adminSettings}
                className={`d-inline-flex align-items-center ${
                  location.pathname.includes('settings') ? 'active' : ''
                }`}
              >
                <i className="isax isax-setting-2 me-2" />
                Settings
              </Link>
            </li>
            <li>
              <span
                onClick={handleLogout}
                className="d-inline-flex align-items-center text-danger"
                style={{ cursor: 'pointer' }}
              >
                <i className="isax isax-logout me-2" />
                Logout
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
