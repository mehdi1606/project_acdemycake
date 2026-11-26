import React, { useCallback, useEffect, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { instructorService, InstructorStudentInfo } from '../../../services/api/instructor.service';
import { getFileUrl } from '../../../environment';
import BadgeAvatar from '../../../components/BadgeAvatar';
import { getBadgeFromRole } from '../../../config/badges';
import { useTranslation } from 'react-i18next';

const StudentGrid: React.FC = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState<InstructorStudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const pageSize = 9; // 3 per row × 3 rows

  const fetchStudents = useCallback(async (page: number, searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await instructorService.getMyStudents(
        page,
        pageSize,
        searchTerm || undefined
      );

      setStudents(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setCurrentPage(data?.page ?? page);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError(t('instructor.students.loadError', "We couldn't load your students. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStudents(0, '');
  }, [fetchStudents]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setCurrentPage(0);
      fetchStudents(0, searchInput);
    }
  };

  const handleSearchClick = () => {
    setSearch(searchInput);
    setCurrentPage(0);
    fetchStudents(0, searchInput);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStudents(page, search);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <LuxuryDashboardLayout>
      <div className="page-title d-flex align-items-center justify-content-between">
        <h5 className="fw-bold">
          {t('instructor.students.title', 'Students')}
          {!loading && (
            <span className="text-muted fs-14 fw-normal ms-2">({totalElements})</span>
          )}
        </h5>
        <div className="d-flex align-items-center list-icons">
          <Link to={all_routes.studentsList} className="me-2">
            <i className="isax isax-task" />
          </Link>
          <Link to={all_routes.studentsGrid} className="active">
            <i className="isax isax-element-3" />
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="row justify-content-end mb-3">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="isax isax-search-normal-14" />
            </span>
            <input
              type="text"
              className="form-control form-control-md"
              placeholder={t('instructor.students.searchPlaceholder', 'Search by name or email...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchInput && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setCurrentPage(0);
                  fetchStudents(0, '');
                }}
              >
                <i className="isax isax-close-circle" />
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={handleSearchClick}>
              {t('common.search', 'Search')}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="isax isax-warning-2 me-2" />
          {error}
          <button type="button" className="btn btn-sm btn-outline-danger ms-auto" onClick={() => fetchStudents(currentPage, search)}>
            {t('common.tryAgain', 'Try Again')}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
          </div>
          <p className="mt-2 text-muted">{t('instructor.students.loading', 'Loading students...')}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="lx-card">
          <LxEmptyState
            icon="isax-people"
            title={search ? t('emptyStates.studentsSearchTitle', 'No matching students') : t('emptyStates.studentsTitle', 'No students yet')}
            text={search ? t('instructor.students.noSearchResults', 'No students found matching "{{search}}"', { search }) : t('instructor.students.noStudents', 'No students enrolled in your courses yet.')}
          >
            {!search && (
              <Link to={all_routes.instructorCourse} className="lx-btn lx-btn-outline lx-btn-sm">
                {t('instructor.students.checkCourses', 'Check that your courses are published')}
              </Link>
            )}
          </LxEmptyState>
        </div>
      ) : (
        <>
          <div className="row">
            {students.map((student) => (
              <div key={student.id} className="col-xl-4 col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    {/* Avatar */}
                    <div className="mb-3 d-flex justify-content-center">
                      <BadgeAvatar
                        avatarUrl={getFileUrl(student.avatarUrl) ?? undefined}
                        name={student.fullName}
                        badge={getBadgeFromRole('STUDENT')}
                        size="md"
                      />
                    </div>

                    {/* Name & actions */}
                    <div className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3">
                      <div className="overflow-hidden">
                        <h5 className="mb-1 fw-bold text-truncate">
                          <Link to={`${all_routes.studentsDetails}?studentId=${student.id}`}>
                            {student.fullName}
                          </Link>
                        </h5>
                        <span className="text-muted fs-13 text-truncate d-block">{student.email}</span>
                      </div>

                      <Link
                        to={`${all_routes.instructorMessage}?studentId=${student.id}&studentName=${encodeURIComponent(
                          student.fullName
                        )}`}
                        className="avatar avatar-md avatar-rounded border flex-shrink-0 ms-2"
                        title={t('instructor.studentDetail.sendMessageLower', 'Send message')}
                      >
                        <i className="isax isax-messages text-gray-9 fs-14" />
                      </Link>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between fs-13 mb-1">
                        <span className="text-muted">{t('instructor.students.avgProgress', 'Avg. Progress')}</span>
                        <span className="fw-medium">
                          {(student.averageProgress ?? 0).toFixed(0)}%
                        </span>
                      </div>
                      <div className="progress progress-xs" role="progressbar" style={{ height: 6 }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${Math.min(student.averageProgress ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Enrolled since & courses */}
                    <div className="d-flex align-items-center justify-content-between fs-13">
                      <span className="d-inline-flex align-items-center text-muted">
                        <i className="isax isax-calendar-add5 text-primary me-1" />
                        {formatDate(student.firstEnrolledAt)}
                      </span>
                      <span className="d-inline-flex align-items-center text-muted">
                        <i className="isax isax-teacher5 text-secondary me-1" />
                        {student.enrolledCoursesCount}{' '}
                        {student.enrolledCoursesCount === 1 ? 'Course' : 'Courses'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="row align-items-center mt-3">
              <div className="col-md-4">
                <p className="pagination-text text-muted fs-14">
                  {t('common.pageOf', 'Page {{page}} of {{total}}', { page: currentPage + 1, total: totalPages })} &nbsp;·&nbsp; {t('instructor.students.count', '{{n}} students', { n: totalElements })}
                </p>
              </div>
              <div className="col-md-8">
                <ul className="pagination lms-page justify-content-center justify-content-md-end mt-2 mt-md-0 mb-0">
                  <li className={`page-item prev ${currentPage === 0 ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      <i className="fas fa-angle-left" />
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
                      <button type="button" className="page-link" onClick={() => handlePageChange(i)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item next ${currentPage === totalPages - 1 ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                    >
                      <i className="fas fa-angle-right" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentGrid;