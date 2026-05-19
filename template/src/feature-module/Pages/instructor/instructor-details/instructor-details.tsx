import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import { all_routes } from '../../../router/all_routes';
import { courseService } from '../../../../services/api/course.service';
import { PublicInstructorProfile, Course } from '../../../../services/api/types';
import { Spin, Rate } from 'antd';
import { getFileUrl } from '../../../../environment';
import CourseCard from '../../../../components/CourseCard';

const InstructorDetails = () => {
  const { t } = useTranslation()
  const { instructorId } = useParams<{ instructorId: string }>();
  const route = all_routes;

  const [instructor, setInstructor] = useState<PublicInstructorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesPage, setCoursesPage] = useState(0);
  const [totalCoursePages, setTotalCoursePages] = useState(0);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [profileData, coursesData] = await Promise.all([
          courseService.getInstructorProfile(instructorId),
          courseService.getInstructorCourses(instructorId, 0, 6),
        ]);
        setInstructor(profileData);
        setCourses(coursesData.content ?? []);
        setTotalCoursePages(coursesData.totalPages ?? 0);
      } catch (err) {
        console.error('Error loading instructor:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [instructorId]);

  const handleLoadMoreCourses = async () => {
    if (!instructorId || loadingCourses) return;
    try {
      setLoadingCourses(true);
      const next = coursesPage + 1;
      const data = await courseService.getInstructorCourses(instructorId, next, 6);
      setCourses(prev => [...prev, ...(data.content ?? [])]);
      setCoursesPage(next);
    } catch (err) {
      console.error('Error loading more courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const parseSocial = (raw?: string): Record<string, string> => {
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  };

  const avatarUrl = getFileUrl(instructor?.avatarUrl) ?? 'assets/img/user/user-61.jpg';
  const social = parseSocial(instructor?.socialLinks);
  const bioText = instructor?.bio ?? '';

  if (loading) {
    return (
      <>
        <Breadcrumb title="Instructor Details" />
        <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  if (!instructor) {
    return (
      <>
        <Breadcrumb title="Instructor Not Found" />
        <div className="container py-5 text-center">
          <i className="isax isax-user fs-1 text-muted mb-3 d-block" />
          <h3>Instructor Not Found</h3>
          <p className="text-muted">This instructor profile could not be loaded.</p>
          <Link to={route.courseGrid} className="btn btn-primary">Browse Courses</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title="Instructor Details" />

      <div className="instructor-detail-content">
        <div className="container">
          <div className="row">

            {/* ── Left: main content ─────────────────────────────────────────── */}
            <div className="col-lg-8">

              {/* Header card */}
              <div className="card bg-light mb-4">
                <div className="card-body instructor-details">
                  <div className="instructor-img">
                    <img
                      src={avatarUrl}
                      alt={instructor.fullName}
                      className="img-fluid rounded-circle"
                      style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'assets/img/user/user-61.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-fill">
                    <div className="pb-3 border-bottom mb-3">
                      <h5 className="fw-bold mb-1">{instructor.fullName}</h5>
                      <div className="d-flex align-items-center mb-2">
                        <Rate disabled defaultValue={instructor.averageRating} allowHalf className="fs-14 me-2" />
                        <span className="fs-14">
                          {instructor.averageRating.toFixed(1)} ({instructor.totalReviews} reviews)
                        </span>
                      </div>
                      {instructor.bio && (
                        <p className="mb-0 text-muted">
                          {instructor.bio.length > 200
                            ? instructor.bio.slice(0, 200) + '…'
                            : instructor.bio}
                        </p>
                      )}
                    </div>

                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      {/* Stats */}
                      <div className="d-flex align-items-center counts-details gap-4">
                        <span className="d-flex align-items-center gap-2">
                          <i className="isax isax-book-saved5 fs-16 text-secondary" />
                          <strong>{instructor.totalCourses}</strong>
                          <span className="fs-14 text-muted">Courses</span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <i className="isax isax-profile-2user5 fs-16 text-secondary" />
                          <strong>{instructor.totalStudents.toLocaleString()}</strong>
                          <span className="fs-14 text-muted">Students</span>
                        </span>
                      </div>

                      {/* Social icons */}
                      <div className="d-flex align-items-center gap-2">
                        {social.facebook && (
                          <a href={social.facebook} target="_blank" rel="noreferrer"
                            className="rounded-circle d-inline-flex align-items-center justify-content-center">
                            <i className="fa-brands fa-facebook-f" />
                          </a>
                        )}
                        {social.instagram && (
                          <a href={social.instagram} target="_blank" rel="noreferrer"
                            className="rounded-circle d-inline-flex align-items-center justify-content-center">
                            <i className="fa-brands fa-instagram" />
                          </a>
                        )}
                        {social.twitter && (
                          <a href={social.twitter} target="_blank" rel="noreferrer"
                            className="rounded-circle d-inline-flex align-items-center justify-content-center">
                            <i className="fa-brands fa-x-twitter" />
                          </a>
                        )}
                        {social.youtube && (
                          <a href={social.youtube} target="_blank" rel="noreferrer"
                            className="rounded-circle d-inline-flex align-items-center justify-content-center">
                            <i className="fa-brands fa-youtube" />
                          </a>
                        )}
                        {social.linkedin && (
                          <a href={social.linkedin} target="_blank" rel="noreferrer"
                            className="rounded-circle d-inline-flex align-items-center justify-content-center">
                            <i className="fa-brands fa-linkedin-in" />
                          </a>
                        )}
                        {social.website && (
                          <a href={social.website} target="_blank" rel="noreferrer"
                            className="rounded-circle d-inline-flex align-items-center justify-content-center">
                            <i className="fa-solid fa-globe" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* About */}
              {bioText && (
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="mb-3">About Me</h5>
                    <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {expanded ? bioText : bioText.length > 400 ? bioText.slice(0, 400) + '…' : bioText}
                    </p>
                    {bioText.length > 400 && (
                      <button
                        className="btn btn-link p-0 read-more-btn"
                        onClick={() => setExpanded(e => !e)}
                      >
                        {expanded ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Courses */}
              <div className="card border-0 mb-4">
                <div className="card-body p-0">
                  <h5 className="mb-4">
                    Courses
                    {instructor.totalCourses > 0 && (
                      <span className="badge bg-primary ms-2 fs-13">{instructor.totalCourses}</span>
                    )}
                  </h5>

                  {courses.length === 0 ? (
                    <p className="text-muted">No published courses yet.</p>
                  ) : (
                    <>
                      <div className="row">
                        {courses.map(course => (
                          <div key={course.id} className="col-md-6 mb-4">
                            <CourseCard course={course} layout="grid" />
                          </div>
                        ))}
                      </div>
                      {coursesPage + 1 < totalCoursePages && (
                        <div className="text-center mt-2">
                          <button
                            className="btn btn-outline-primary"
                            onClick={handleLoadMoreCourses}
                            disabled={loadingCourses}
                          >
                            {loadingCourses ? <Spin size="small" /> : 'Load More Courses'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: sidebar ─────────────────────────────────────────────── */}
            <div className="col-lg-4">
              <div className="card sticky-top" style={{ top: '100px' }}>
                <div className="card-body">
                  <h5 className="mb-4">Instructor Stats</h5>

                  <div className="d-flex align-items-center mb-3">
                    <span className="contact-icon rounded-circle d-flex align-items-center justify-content-center me-3">
                      <i className="isax isax-book" />
                    </span>
                    <div>
                      <h6 className="mb-0">{instructor.totalCourses} Courses</h6>
                      <p className="mb-0 text-muted fs-13">Published courses</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <span className="contact-icon rounded-circle d-flex align-items-center justify-content-center me-3">
                      <i className="isax isax-profile-2user" />
                    </span>
                    <div>
                      <h6 className="mb-0">{instructor.totalStudents.toLocaleString()} Students</h6>
                      <p className="mb-0 text-muted fs-13">Enrolled across all courses</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <span className="contact-icon rounded-circle d-flex align-items-center justify-content-center me-3">
                      <i className="fa-solid fa-star" />
                    </span>
                    <div>
                      <h6 className="mb-0">{instructor.averageRating.toFixed(1)} Avg Rating</h6>
                      <p className="mb-0 text-muted fs-13">{instructor.totalReviews} total reviews</p>
                    </div>
                  </div>

                  {Object.keys(social).length > 0 && (
                    <>
                      <hr />
                      <h6 className="mb-3">Follow on</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {social.facebook && (
                          <a href={social.facebook} target="_blank" rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                            <i className="fa-brands fa-facebook-f" /> Facebook
                          </a>
                        )}
                        {social.twitter && (
                          <a href={social.twitter} target="_blank" rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                            <i className="fa-brands fa-x-twitter" /> Twitter
                          </a>
                        )}
                        {social.linkedin && (
                          <a href={social.linkedin} target="_blank" rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                            <i className="fa-brands fa-linkedin-in" /> LinkedIn
                          </a>
                        )}
                        {social.instagram && (
                          <a href={social.instagram} target="_blank" rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                            <i className="fa-brands fa-instagram" /> Instagram
                          </a>
                        )}
                        {social.youtube && (
                          <a href={social.youtube} target="_blank" rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                            <i className="fa-brands fa-youtube" /> YouTube
                          </a>
                        )}
                        {social.website && (
                          <a href={social.website} target="_blank" rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                            <i className="fa-solid fa-globe" /> Website
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default InstructorDetails;
