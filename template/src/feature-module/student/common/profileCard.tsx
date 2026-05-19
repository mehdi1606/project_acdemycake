import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAppSelector } from '../../../core/redux/hooks';
import { getFileUrl } from '../../../environment';

const ProfileCard = () => {
  const { t } = useTranslation()
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="profile-card overflow-hidden bg-blue-gradient2 mb-5 p-5">
      <div className="profile-card-bg">
        <ImageWithBasePath
          src="assets/img/bg/card-bg-01.png"
          className="profile-card-bg-1"
          alt=""
        />
      </div>
      <div className="row align-items-center row-gap-3">
        <div className="col-lg-6">
          <div className="d-flex align-items-center">
            <span className="avatar avatar-xxl avatar-rounded me-3 border border-white border-2 position-relative">
              {user?.avatarUrl ? (
                <img src={getFileUrl(user.avatarUrl) ?? user.avatarUrl} alt={user.fullName} className="rounded-circle" />
              ) : (
                <ImageWithBasePath src="assets/img/user/user-02.jpg" alt="" />
              )}
              {user?.isEmailVerified && (
                <span className="verify-tick">
                  <i className="isax isax-verify5" />
                </span>
              )}
            </span>
            <div>
              <h5 className="mb-1 text-white d-inline-flex align-items-center">
                <Link to={all_routes.studentProfile} className="text-white">
                  {user?.fullName || "Student"}
                </Link>
                <Link
                  to={all_routes.studentSettings}
                  className="link-light fs-16 ms-2"
                >
                  <i className="isax isax-edit-2" />
                </Link>
              </h5>
              <p className="text-light">{user?.role === "STUDENT" ? "Student" : user?.role || "Student"}</p>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="d-flex align-items-center justify-content-lg-end flex-wrap gap-2">
            {user?.subscriptionStatus === "ACTIVE" ? (
              <span
                className="rounded-pill px-3 py-2 d-inline-flex align-items-center"
                style={{
                  background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 50%, #C5973E 100%)',
                  color: '#1a1a2e',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '0 2px 10px rgba(197, 151, 62, 0.45)',
                  letterSpacing: '0.3px',
                }}
              >
                <i className="isax isax-crown-1 me-1" style={{ fontSize: '15px' }} />
                Premium Member
              </span>
            ) : (
              <Link
                to={all_routes.pricingPlan}
                className="btn btn-white rounded-pill"
              >
                <i className="isax isax-crown me-1" />
                Get Premium
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
