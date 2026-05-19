import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { studentSidebarData } from '../../../core/common/data/json/student-sidebar';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch } from '../../../core/redux/hooks';
import { logout } from '../../../core/redux/authSlice';
import { useTranslation } from 'react-i18next';

const StudentSidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

  return (
    <div className="col-lg-3">
      <div className="settings-sidebar theiaStickySidebar">
        <div>
          <h6 className="mb-3">{t('common.mainMenu', 'Main Menu')}</h6>
          <ul className="mb-3 pb-1">
            {studentSidebarData.map((menu: any, index: any) => (
              <li key={index}>
                <Link
                  to={menu.route}
                  className={`d-inline-flex align-items-center ${
                    location.pathname === menu.route || location.pathname === menu.subRoute ? 'active' : ''
                  }`}
                >
                  <><i className={`${menu.icon} me-2`} />{t(menu.i18nKey, menu.title)}</>
                </Link>
              </li>
            ))}
          </ul>
          <hr />
          <h6 className="mb-3">{t('student.settings.title', 'Account Settings')}</h6>
          <ul>
            <li>
              <Link
                to={all_routes.studentSettings}
                className={`d-inline-flex align-items-center ${
                  location.pathname.includes('settings') ? 'active' : ''
                }`}
              >
                <i className="isax isax-setting-25 me-2" />
                {t('student.sidebar.settings', 'Settings')}
              </Link>
            </li>
            <li>
              <span
                onClick={handleLogout}
                className="d-inline-flex align-items-center"
                style={{ cursor: 'pointer' }}
              >
                <i className="isax isax-logout5 me-2" />
                {t('student.sidebar.logout', 'Logout')}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentSidebar;
