import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { useAppSelector } from '../../../core/redux/hooks'

const ProfileCard = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="instructor-profile">
    <div className="instructor-profile-bg">
      <ImageWithBasePath
        src="assets/img/bg/card-bg-01.png"
        className="instructor-profile-bg-1"
        alt=""
      />
    </div>
    <div className="row align-items-center row-gap-3">
      <div className="col-md-6">
        <div className="d-flex align-items-center">
          <span className="avatar flex-shrink-0 avatar-xxl avatar-rounded me-3 border border-white border-3 position-relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#6B1D2A',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
              >
                {user?.fullName ? getInitials(user.fullName) : 'IN'}
              </span>
            )}
            {user?.isEmailVerified && (
              <span className="verify-tick">
                <i className="isax isax-verify5" />
              </span>
            )}
          </span>
          <div>
            <h5 className="mb-1 text-white d-inline-flex align-items-center">
              {user?.fullName || 'Instructor'}
              <Link
                to={all_routes.instructorProfile}
                className="link-light fs-16 ms-2"
              >
                <i className="isax isax-edit-2" />
              </Link>
            </h5>
            <p className="text-light">Instructor</p>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="d-flex align-items-center flex-wrap gap-3 justify-content-md-end">
          <Link to={all_routes.addNewCourse} className="btn btn-white rounded-pill">
            Add New Course
          </Link>
          <Link
            to={all_routes.studentDashboard}
            className="btn btn-secondary rounded-pill"
          >
            Student Dashboard
          </Link>
        </div>
      </div>
    </div>
  </div>
  )
}

export default ProfileCard