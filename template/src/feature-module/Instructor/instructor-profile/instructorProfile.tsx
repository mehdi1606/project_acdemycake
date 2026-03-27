import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../../core/redux/hooks'
import { all_routes } from '../../router/all_routes'

const InstructorProfile = () => {
  const { user } = useAppSelector((state) => state.auth);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSocialLinks = () => {
    if (!user?.socialLinks) return null;
    try {
      return JSON.parse(user.socialLinks);
    } catch {
      return null;
    }
  };

  const socialLinks = getSocialLinks();

  const getNameParts = (fullName: string | undefined) => {
    if (!fullName) return { firstName: 'N/A', lastName: 'N/A' };
    const parts = fullName.split(' ');
    return {
      firstName: parts[0] || 'N/A',
      lastName: parts.slice(1).join(' ') || 'N/A'
    };
  };

  const nameParts = getNameParts(user?.fullName);

  // ── Field card helper ────────────────────────────────────────────────────
  const FieldCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div
      style={{
        padding: 16,
        borderRadius: 'var(--lx-radius)',
        background: 'rgba(107, 29, 42, 0.02)',
        border: '1px solid rgba(107, 29, 42, 0.04)',
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      {children}
    </div>
  );

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>My Profile</h5>
        <Link to={all_routes.instructorsettings} className="lx-btn lx-btn-outline lx-btn-sm">
          <i className="isax isax-edit-2" />
          Edit Profile
        </Link>
      </div>

      {/* Basic Information Card */}
      <div className="lx-card mb-4">
        <div className="lx-card-body">
          <h6 style={{ fontWeight: 700, color: 'var(--lx-text)', fontSize: 16, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
            Basic Information
          </h6>
          <div className="row g-4">
            <div className="col-md-4">
              <FieldCard label="First Name">
                <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>{nameParts.firstName}</span>
              </FieldCard>
            </div>
            <div className="col-md-4">
              <FieldCard label="Last Name">
                <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>{nameParts.lastName}</span>
              </FieldCard>
            </div>
            <div className="col-md-4">
              <FieldCard label="Registration Date">
                <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>{formatDate(user?.createdAt)}</span>
              </FieldCard>
            </div>
            <div className="col-md-4">
              <FieldCard label="Role">
                <span className="lx-badge badge-success">{user?.role || 'INSTRUCTOR'}</span>
              </FieldCard>
            </div>
            <div className="col-md-4">
              <FieldCard label="Phone Number">
                <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>{user?.phone || 'Not provided'}</span>
              </FieldCard>
            </div>
            <div className="col-md-4">
              <FieldCard label="Email">
                <span className="d-inline-flex align-items-center gap-2" style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>
                  {user?.email || 'N/A'}
                  {user?.isEmailVerified && (
                    <i className="isax isax-verify5" style={{ color: 'var(--lx-green)', fontSize: 16 }} title="Verified" />
                  )}
                </span>
              </FieldCard>
            </div>
            <div className="col-md-4">
              <FieldCard label="Account Status">
                <span className={`lx-badge ${user?.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
                  {user?.isEmailVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </FieldCard>
            </div>
            <div className="col-md-4">
              <FieldCard label="Subscription Status">
                <span
                  className={`lx-badge ${
                    user?.subscriptionStatus === 'ACTIVE' ? 'badge-success' :
                    user?.subscriptionStatus === 'EXPIRED' ? 'badge-danger' :
                    user?.subscriptionStatus === 'PENDING' ? 'badge-warning' : 'badge-slate'
                  }`}
                >
                  {user?.subscriptionStatus || 'NONE'}
                </span>
              </FieldCard>
            </div>
            {user?.subscriptionEndDate && (
              <div className="col-md-4">
                <FieldCard label="Subscription Ends">
                  <span style={{ fontSize: 14, color: 'var(--lx-text)', fontWeight: 500 }}>{formatDate(user.subscriptionEndDate)}</span>
                </FieldCard>
              </div>
            )}
            <div className="col-12">
              <FieldCard label="Bio">
                <span style={{ fontSize: 14, color: user?.bio ? 'var(--lx-text)' : 'var(--lx-text-muted)', fontWeight: 400, lineHeight: 1.7 }}>
                  {user?.bio || 'No bio provided. Click the edit button to add your bio.'}
                </span>
              </FieldCard>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links Card */}
      {socialLinks && (
        <div className="lx-card mb-4">
          <div className="lx-card-body">
            <h6 style={{ fontWeight: 700, color: 'var(--lx-text)', fontSize: 16, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
              Social Links
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {[
                { key: 'website', icon: 'isax isax-global', label: 'Website' },
                { key: 'linkedin', icon: 'isax isax-link', label: 'LinkedIn' },
                { key: 'twitter', icon: 'isax isax-message-text', label: 'Twitter' },
                { key: 'youtube', icon: 'isax isax-video-play', label: 'YouTube' },
                { key: 'instagram', icon: 'isax isax-camera', label: 'Instagram' },
              ]
                .filter((s) => socialLinks[s.key])
                .map((s) => (
                  <a
                    key={s.key}
                    href={socialLinks[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lx-btn lx-btn-outline lx-btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <i className={s.icon} />
                    {s.label}
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Info Card */}
      <div className="lx-card">
        <div className="lx-card-body">
          <h6 style={{ fontWeight: 700, color: 'var(--lx-text)', fontSize: 16, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
            Account Information
          </h6>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--lx-radius)',
                    background: 'rgba(107, 29, 42, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className="isax isax-user" style={{ fontSize: 20, color: 'var(--lx-primary)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>User ID</p>
                  <p style={{ color: 'var(--lx-text-mid)', marginBottom: 0, fontSize: 12, fontFamily: 'monospace' }}>{user?.id || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--lx-radius)',
                    background: 'rgba(107, 29, 42, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className="isax isax-calendar" style={{ fontSize: 20, color: 'var(--lx-primary)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member Since</p>
                  <p style={{ color: 'var(--lx-text-mid)', marginBottom: 0, fontSize: 14 }}>{formatDate(user?.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <Link to={all_routes.instructorsettings} className="lx-btn lx-btn-gold" style={{ textDecoration: 'none' }}>
              <i className="isax isax-edit-2" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </LuxuryDashboardLayout>
  );
}

export default InstructorProfile
