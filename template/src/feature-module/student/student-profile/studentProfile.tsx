import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import { useTranslation } from "react-i18next";

import LuxuryDashboardLayout from "../../../components/LuxuryDashboardLayout";
import { all_routes } from "../../router/all_routes";
import { useAppSelector } from "../../../core/redux/hooks";
import profileService from "../../../services/api/profile.service";
import { User } from "../../../services/api/types";

const StudentProfile = () => {
  const { t } = useTranslation();
  const route = all_routes;
  const { user: reduxUser } = useAppSelector((state) => state.auth);
  const [user, setUser] = useState<User | null>(reduxUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const freshUser = await profileService.getProfile();
        setUser(freshUser);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (reduxUser) {
          setUser(reduxUser);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reduxUser]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const parseSocialLinks = (socialLinksJson?: string) => {
    if (!socialLinksJson) return {};
    try {
      return JSON.parse(socialLinksJson);
    } catch {
      return {};
    }
  };

  const socialLinks = parseSocialLinks(user?.socialLinks);

  if (loading) {
    return (
      <LuxuryDashboardLayout>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: 400 }}
        >
          <Spin size="large" />
        </div>
      </LuxuryDashboardLayout>
    );
  }

  return (
    <LuxuryDashboardLayout>
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>{t('student.profile.title', 'My Profile')}</h5>
        <Link to={route.studentSettings} className="lx-btn lx-btn-outline lx-btn-sm">
          <i className="isax isax-edit-2" />
          {t('student.profile.editProfile', 'Edit Profile')}
        </Link>
      </div>

      {/* Profile Card */}
      <div className="lx-card">
        <div className="lx-card-body">
          {/* Basic Information */}
          <h6 style={{ fontWeight: 700, color: 'var(--lx-text)', fontSize: 16, marginBottom: 20 }}>
            {t('student.profile.basicInfo', 'Basic Information')}
          </h6>

          <div className="row g-4">
            {/* Full Name */}
            <div className="col-md-6">
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--lx-radius)',
                  background: 'rgba(107, 29, 42, 0.02)',
                  border: '1px solid rgba(107, 29, 42, 0.04)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('student.profile.fullName', 'Full Name')}
                </p>
                <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>
                  {user?.fullName || t('student.profile.notSet', 'Not set')}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="col-md-6">
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--lx-radius)',
                  background: 'rgba(107, 29, 42, 0.02)',
                  border: '1px solid rgba(107, 29, 42, 0.04)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('student.profile.email', 'Email')}
                </p>
                <span className="d-inline-flex align-items-center gap-2" style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>
                  {user?.email || t('student.profile.notSet', 'Not set')}
                  {user?.isEmailVerified ? (
                    <span className="lx-badge badge-success" style={{ fontSize: 11 }}>{t('student.profile.verified', 'Verified')}</span>
                  ) : (
                    <span className="lx-badge badge-warning" style={{ fontSize: 11 }}>{t('student.profile.notVerified', 'Not Verified')}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="col-md-6">
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--lx-radius)',
                  background: 'rgba(107, 29, 42, 0.02)',
                  border: '1px solid rgba(107, 29, 42, 0.04)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('student.profile.phone', 'Phone Number')}
                </p>
                <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>
                  {user?.phone || t('student.profile.notSet', 'Not set')}
                </span>
              </div>
            </div>

            {/* Registration Date */}
            <div className="col-md-6">
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--lx-radius)',
                  background: 'rgba(107, 29, 42, 0.02)',
                  border: '1px solid rgba(107, 29, 42, 0.04)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('student.profile.registrationDate', 'Registration Date')}
                </p>
                <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>
                  {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="col-md-6">
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--lx-radius)',
                  background: 'rgba(107, 29, 42, 0.02)',
                  border: '1px solid rgba(107, 29, 42, 0.04)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('student.subscription.status', 'Subscription Status')}
                </p>
                <span
                  className={`lx-badge ${user?.subscriptionStatus === 'ACTIVE' ? 'badge-success' : 'badge-slate'}`}
                >
                  {user?.subscriptionStatus || 'None'}
                </span>
              </div>
            </div>

            {/* Subscription Expires */}
            {user?.subscriptionEndDate && (
              <div className="col-md-6">
                <div
                  style={{
                    padding: 16,
                    borderRadius: 'var(--lx-radius)',
                    background: 'rgba(107, 29, 42, 0.02)',
                    border: '1px solid rgba(107, 29, 42, 0.04)',
                  }}
                >
                  <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('student.subscription.validUntil', 'Subscription Expires')}
                  </p>
                  <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>
                    {formatDate(user.subscriptionEndDate)}
                  </span>
                </div>
              </div>
            )}

            {/* Bio */}
            <div className="col-12">
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--lx-radius)',
                  background: 'rgba(107, 29, 42, 0.02)',
                  border: '1px solid rgba(107, 29, 42, 0.04)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('student.profile.bio', 'Bio')}
                </p>
                <span style={{ fontSize: 14, color: user?.bio ? 'var(--lx-text)' : 'var(--lx-text-muted)', fontWeight: 400, lineHeight: 1.7 }}>
                  {user?.bio || t('student.profile.noBio', 'No bio set. Add a bio to tell others about yourself.')}
                </span>
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          {(socialLinks.website ||
            socialLinks.linkedin ||
            socialLinks.twitter ||
            socialLinks.facebook) && (
            <>
              <div style={{ borderTop: '1px solid rgba(107, 29, 42, 0.06)', margin: '28px 0 20px' }} />
              <h6 style={{ fontWeight: 700, color: 'var(--lx-text)', fontSize: 16, marginBottom: 20 }}>
                {t('student.settings.socialLinks', 'Social Links')}
              </h6>
              <div className="row g-4">
                {socialLinks.website && (
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 'var(--lx-radius)',
                        background: 'rgba(107, 29, 42, 0.02)',
                        border: '1px solid rgba(107, 29, 42, 0.04)',
                      }}
                    >
                      <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="isax isax-global" style={{ fontSize: 14 }} />
                        Website
                      </p>
                      <a
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--lx-primary)', fontSize: 14, textDecoration: 'none' }}
                      >
                        {socialLinks.website}
                      </a>
                    </div>
                  </div>
                )}
                {socialLinks.linkedin && (
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 'var(--lx-radius)',
                        background: 'rgba(107, 29, 42, 0.02)',
                        border: '1px solid rgba(107, 29, 42, 0.04)',
                      }}
                    >
                      <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="isax isax-link" style={{ fontSize: 14 }} />
                        LinkedIn
                      </p>
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--lx-primary)', fontSize: 14, textDecoration: 'none' }}
                      >
                        {socialLinks.linkedin}
                      </a>
                    </div>
                  </div>
                )}
                {socialLinks.twitter && (
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 'var(--lx-radius)',
                        background: 'rgba(107, 29, 42, 0.02)',
                        border: '1px solid rgba(107, 29, 42, 0.04)',
                      }}
                    >
                      <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="isax isax-message-text" style={{ fontSize: 14 }} />
                        Twitter
                      </p>
                      <a
                        href={socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--lx-primary)', fontSize: 14, textDecoration: 'none' }}
                      >
                        {socialLinks.twitter}
                      </a>
                    </div>
                  </div>
                )}
                {socialLinks.facebook && (
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 'var(--lx-radius)',
                        background: 'rgba(107, 29, 42, 0.02)',
                        border: '1px solid rgba(107, 29, 42, 0.04)',
                      }}
                    >
                      <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="isax isax-people" style={{ fontSize: 14 }} />
                        Facebook
                      </p>
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--lx-primary)', fontSize: 14, textDecoration: 'none' }}
                      >
                        {socialLinks.facebook}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentProfile;
