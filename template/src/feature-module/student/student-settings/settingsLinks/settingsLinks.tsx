import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { all_routes } from "../../../router/all_routes";

const SettingsLinks = () => {
  const { t } = useTranslation();
  const route = all_routes;
  const location = useLocation();
  return (
    <>
      <ul className="settings-nav d-flex align-items-center flex-wrap border bg-light-900 rounded">
        <li>
          <Link to={route.studentSettings} className={`${location.pathname === route.studentSettings ? 'active' : ''}`}>
            {t('student.settingsTabs.editProfile', 'Edit Profile')}
          </Link>
        </li>
        <li>
          <Link to={route.studentChangePassword} className={`${location.pathname === route.studentChangePassword ? 'active' : ''}`}>{t('student.settingsTabs.security', 'Security')}</Link>
        </li>
        <li>
          <Link to={route.studentSocialProfile} className={`${location.pathname === route.studentSocialProfile ? 'active' : ''}`}>{t('student.settingsTabs.socialProfiles', 'Social Profiles')}</Link>
        </li>
        <li>
          <Link to={route.studentLinkedAccounts} className={`${location.pathname === route.studentLinkedAccounts ? 'active' : ''}`}>{t('student.settingsTabs.linkedAccounts', 'Linked Accounts')}</Link>
        </li>
        <li>
          <Link to={route.studentNotification} className={`${location.pathname === route.studentNotification ? 'active' : ''}`}>{t('student.settingsTabs.notifications', 'Notifications')}</Link>
        </li>
      </ul>
    </>
  );
};

export default SettingsLinks;
