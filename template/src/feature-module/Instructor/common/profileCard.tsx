import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { useAppSelector } from '../../../core/redux/hooks'
import { getFileUrl } from '../../../environment'
import BadgeAvatar from '../../../components/BadgeAvatar'
import { getBadgeFromRole } from '../../../config/badges'

const ProfileCard = () => {
  const { t } = useTranslation()
  const { user } = useAppSelector((state) => state.auth);

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
          <div className="flex-shrink-0 me-3">
            <BadgeAvatar
              avatarUrl={user?.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : undefined}
              name={user?.fullName || 'IN'}
              badge={getBadgeFromRole('INSTRUCTOR')}
              size="lg"
            />
          </div>
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