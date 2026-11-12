import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Breadcrumb from "../../../../core/common/Breadcrumb/breadcrumb";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import { all_routes } from "../../../router/all_routes";
import { courseService } from "../../../../services/api/course.service";
import { FeaturedInstructor } from "../../../../services/api/types";
import { getFileUrl } from "../../../../environment";

const AVATAR_FALLBACK = `${process.env.PUBLIC_URL}/assets/img/user/user-61.jpg`;

/**
 * Public instructor directory. Previously a static template page with fake
 * instructors; it now lists the real instructors from /courses/featured-instructors.
 */
const InstructorGrid = () => {
  const { t } = useTranslation();
  const route = all_routes;

  const [instructors, setInstructors] = useState<FeaturedInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    courseService
      .getFeaturedInstructors(48)
      .then((data) => { if (!cancelled) setInstructors(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Breadcrumb title={t('instructorGrid.title', 'Instructors')} />
      <section className="course-content">
        <div className="container">
          {loading ? (
            <div className="text-center py-5"><Spin size="large" /></div>
          ) : error ? (
            <p className="text-center py-5">{t('instructorGrid.error', 'Could not load instructors. Please try again later.')}</p>
          ) : instructors.length === 0 ? (
            <p className="text-center py-5">{t('instructorGrid.empty', 'No instructors yet.')}</p>
          ) : (
            <div className="row course-list-cover">
              {instructors.map((ins) => (
                <div className="col-xl-3 col-lg-4 col-md-6 d-flex" key={ins.id}>
                  <div className="instructor-item instructor-item-six flex-fill">
                    <div className="instructors-img">
                      <Link to={`${route.instructorDetails}/${ins.id}`}>
                        <img
                          className="img-fluid"
                          src={getFileUrl(ins.avatarUrl) ?? AVATAR_FALLBACK}
                          alt={ins.fullName}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }}
                        />
                      </Link>
                    </div>
                    <div className="instructor-content">
                      <div>
                        {ins.averageRating > 0 && (
                          <p className="rating mb-2">
                            <i className="fas fa-star me-1" />
                            {ins.averageRating.toFixed(1)}
                          </p>
                        )}
                        <h3 className="title mb-2">
                          <Link to={`${route.instructorDetails}/${ins.id}`}>{ins.fullName}</Link>
                        </h3>
                      </div>
                      <div className="d-flex justify-content-between align-items-center instructor-bottom">
                        <span className="d-flex align-items-center">
                          <i className="isax isax-book-saved5 fs-16 text-secondary me-2" />
                          {t('instructorGrid.courses', '{{count}} courses', { count: ins.totalCourses ?? 0 })}
                        </span>
                        <span className="d-flex align-items-center">
                          <i className="isax isax-profile-2user5 fs-16 text-primary me-2" />
                          {t('instructorGrid.students', '{{count}} students', { count: ins.totalStudents ?? 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default InstructorGrid;
