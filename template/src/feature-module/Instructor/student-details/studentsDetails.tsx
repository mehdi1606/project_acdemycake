import React, { useState, useEffect } from 'react'
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout'
import { useSearchParams, Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'
import {
  instructorService,
  InstructorStudentDetail,
  StudentCourseEnrollment,
} from '../../../services/api/instructor.service'

const StudentsDetails = () => {
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId')

  const [student, setStudent] = useState<InstructorStudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) {
      setError('No student ID provided.')
      setLoading(false)
      return
    }

    instructorService
      .getStudentDetail(studentId)
      .then((data) => {
        setStudent(data)
      })
      .catch((err) => {
        console.error('Failed to load student detail:', err)
        setError('Failed to load student profile.')
      })
      .finally(() => setLoading(false))
  }, [studentId])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <LuxuryDashboardLayout>
      <div className="content instructor-detail-content">
        <div className="container">
          <Link to={all_routes.studentsList} className="d-flex align-items-center mb-3">
            <i className="isax isax-arrow-left me-1 fw-bold" />
            Back to List
          </Link>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading student profile...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="alert alert-danger">
              <i className="isax isax-warning-2 me-2" />
              {error}
            </div>
          )}

          {/* Content */}
          {!loading && !error && student && (
            <div className="row">
              {/* Left column */}
              <div className="col-lg-8">
                {/* Profile card */}
                <div className="instructor-details-item1 mb-4">
                  <div className="instructor-details">
                    {/* Avatar */}
                    <div className="instructor-img">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.fullName}
                          className="img-fluid rounded-3"
                          style={{ width: 120, height: 120, objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
                          style={{ width: 120, height: 120, fontSize: 40 }}
                        >
                          {getInitials(student.fullName)}
                        </div>
                      )}
                    </div>

                    <div className="flex-fill">
                      <div className="pb-3 border-bottom mb-3">
                        <h6 className="fs-18 fw-bold mb-1">{student.fullName}</h6>
                        <p className="text-muted mb-1">
                          <i className="isax isax-sms me-1" />
                          {student.email}
                        </p>
                        <p className="mb-0 text-muted fs-14">
                          Joined on: {formatDate(student.joinedAt)}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="d-flex align-items-center flex-wrap gap-4">
                        <div className="d-flex align-items-center">
                          <i className="isax isax-book5 text-primary me-1" />
                          <span className="fw-medium">{student.enrolledCoursesCount}</span>
                          <span className="text-muted ms-1">
                            Course{student.enrolledCoursesCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="isax isax-chart-2 text-success me-1" />
                          <span className="fw-medium">{(student.averageProgress ?? 0).toFixed(0)}%</span>
                          <span className="text-muted ms-1">Avg. Progress</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="isax isax-calendar-add5 text-secondary me-1" />
                          <span className="text-muted fs-14">
                            First enrolled: {formatDate(student.firstEnrolledAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enrolled courses */}
                <div className="enrolled-courses-card mb-4">
                  <div className="enrolled-courses-body">
                    <div className="page-title mb-3">
                      <h6 className="mb-0 fs-18 fw-bold">
                        Enrolled Courses
                        <span className="text-muted fs-14 fw-normal ms-2">
                          ({student.enrolledCourses.length})
                        </span>
                      </h6>
                    </div>

                    {student.enrolledCourses.length === 0 ? (
                      <p className="text-muted">No courses enrolled yet.</p>
                    ) : (
                      <div className="row g-3">
                        {student.enrolledCourses.map((course: StudentCourseEnrollment) => (
                          <div key={course.id} className="col-md-6">
                            <div className="card border h-100">
                              {course.courseThumbnail && (
                                <img
                                  src={course.courseThumbnail}
                                  alt={course.courseTitle}
                                  className="card-img-top"
                                  style={{ height: 120, objectFit: 'cover' }}
                                />
                              )}
                              <div className="card-body p-3">
                                <h6 className="fw-bold fs-14 mb-2">{course.courseTitle}</h6>
                                <p className="text-muted fs-13 mb-2">
                                  <i className="isax isax-teacher me-1" />
                                  {course.instructorName}
                                </p>

                                {/* Progress */}
                                <div className="mb-2">
                                  <div className="d-flex justify-content-between fs-13 mb-1">
                                    <span className="text-muted">Progress</span>
                                    <span className="fw-medium">
                                      {(course.progressPercentage ?? 0).toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="progress" role="progressbar" style={{ height: 6 }}>
                                    <div
                                      className={`progress-bar ${course.isCompleted ? 'bg-success' : 'bg-primary'}`}
                                      style={{
                                        width: `${Math.min(course.progressPercentage ?? 0, 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-between fs-13">
                                  <span className="text-muted">
                                    Enrolled: {formatDate(course.enrolledAt)}
                                  </span>
                                  {course.isCompleted && (
                                    <span className="badge bg-success-subtle text-success">
                                      <i className="isax isax-tick-circle me-1" />
                                      Completed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="col-lg-4">
                <div className="contact-card border-0 mb-4">
                  <div className="contact-details-body">
                    <h5 className="mb-3 fw-bold">Contact Details</h5>
                    <div className="d-flex align-items-center mb-4">
                      <span className="contact-icon flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center me-3">
                        <i className="fa-regular fa-envelope" />
                      </span>
                      <div>
                        <h6 className="mb-0">Email</h6>
                        <p className="fs-14 mb-0">{student.email}</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-4">
                      <span className="contact-icon flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center me-3">
                        <i className="isax isax-calendar-add5" />
                      </span>
                      <div>
                        <h6 className="mb-0">Member Since</h6>
                        <p className="fs-14 mb-0">{formatDate(student.joinedAt)}</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="contact-icon flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center me-3">
                        <i className="isax isax-clock" />
                      </span>
                      <div>
                        <h6 className="mb-0">Last Active</h6>
                        <p className="fs-14 mb-0">{formatDate(student.lastAccessedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick action */}
                <div className="card border">
                  <div className="card-body text-center">
                    <h6 className="fw-bold mb-3">Quick Actions</h6>
                    <Link
                      to={`${all_routes.instructorMessage}?studentId=${student.id}&studentName=${encodeURIComponent(
                        student.fullName
                      )}`}
                      className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    >
                      <i className="isax isax-messages" />
                      Send Message
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LuxuryDashboardLayout>
  )
}

export default StudentsDetails