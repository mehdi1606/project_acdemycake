import React, { useEffect, useState } from 'react';
import { formatMAD } from '../../../core/common/formatMoney';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import { all_routes } from '../../router/all_routes';
import { instructorManageHref } from '../../router/courseLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { instructorService } from '../../../services/api/instructor.service';
import { Course } from '../../../services/api/types';
import { getFileUrl } from '../../../environment';
import { message } from 'antd';

/* ── Types & Data ──────────────────────────────────────── */
interface CourseStats {
  active: number;
  pending: number;
  draft: number;
  free: number;
  paid: number;
}

const statDefs: {
  labelKey: string; labelFallback: string; key: keyof CourseStats; icon: string; color: string; bg: string; borderColor: string;
}[] = [
  { labelKey: 'common.active',   labelFallback: 'Active',  key: 'active',  icon: 'isax-play-circle',   color: '#855A0E', bg: 'rgba(197, 145, 44, 0.06)',   borderColor: 'rgba(197, 145, 44, 0.12)' },
  { labelKey: 'common.pending',  labelFallback: 'Pending', key: 'pending', icon: 'isax-clock',         color: '#C5912C', bg: 'rgba(197, 145, 44, 0.06)', borderColor: 'rgba(197, 145, 44, 0.12)' },
  { labelKey: 'common.draft',    labelFallback: 'Draft',   key: 'draft',   icon: 'isax-document-text', color: '#66525D', bg: 'rgba(43, 15, 30, 0.06)',   borderColor: 'rgba(43, 15, 30, 0.10)' },
  { labelKey: 'common.free',     labelFallback: 'Free',    key: 'free',    icon: 'isax-gift',          color: '#651C32', bg: 'rgba(101, 28, 50, 0.05)', borderColor: 'rgba(101, 28, 50, 0.10)' },
  { labelKey: 'common.paid',     labelFallback: 'Paid',    key: 'paid',    icon: 'isax-wallet-money',  color: '#651C32', bg: 'rgba(101, 28, 50, 0.05)',  borderColor: 'rgba(101, 28, 50, 0.10)' },
];

const tabs = [
  { key: 'all',       labelKey: 'common.all',       labelFallback: 'All' },
  { key: 'published', labelKey: 'common.published',  labelFallback: 'Published' },
  { key: 'pending',   labelKey: 'common.pending',    labelFallback: 'Pending' },
  { key: 'draft',     labelKey: 'common.draft',      labelFallback: 'Draft' },
];

/* ── Component ─────────────────────────────────────────── */
const InstructorCourseGrid = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CourseStats>({ active: 0, pending: 0, draft: 0, free: 0, paid: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await instructorService.getMyCourses(0, 100);
      const list: Course[] = Array.isArray(response?.content) ? response.content : [];
      setCourses(list);
      const s: CourseStats = { active: 0, pending: 0, draft: 0, free: 0, paid: 0 };
      list.forEach((c) => {
        if (c.status === 'PUBLISHED') s.active++;
        else if (c.status === 'PENDING_REVIEW') s.pending++;
        else if (c.status === 'DRAFT') s.draft++;
        if (!c.requiresPurchase) s.free++; else s.paid++;
      });
      setStats(s);
    } catch (err) {
      console.error('Error fetching courses:', err);
      message.error(t('instructor.coursesPage.loadError', 'We couldn\'t load your courses. Refresh the page to try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDeleteClick = (courseId: string) => { setSelectedCourseId(courseId); setDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    if (!selectedCourseId) return;
    try {
      setDeleting(true);
      await instructorService.deleteCourse(selectedCourseId);
      message.success(t('instructor.coursesPage.deleted', 'Course deleted successfully'));
      setDeleteModal(false);
      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      message.error(t('instructor.coursesPage.deleteError', 'The course couldn\'t be deleted. Please try again.'));
    } finally { setDeleting(false); setSelectedCourseId(null); }
  };

  const getThumbnailUrl = (course: Course) =>
    getFileUrl(course.thumbnailUrl) ?? `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`;

  const formatDuration = (minutes: number) => {
    const h = Math.floor((minutes || 0) / 60);
    const m = (minutes || 0) % 60;
    if (h === 0) return `${m}min`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const getTabCount = (key: string) => {
    if (key === 'all') return courses.length;
    if (key === 'published') return stats.active;
    if (key === 'pending') return stats.pending;
    if (key === 'draft') return stats.draft;
    return 0;
  };

  const filteredCourses = courses.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'published') return c.status === 'PUBLISHED';
    if (activeTab === 'pending') return c.status === 'PENDING_REVIEW';
    if (activeTab === 'draft') return c.status === 'DRAFT';
    return true;
  });

  const statusMap: Record<string, { text: string; cls: string }> = {
    PUBLISHED: { text: t('enums.courseStatus.PUBLISHED', 'Published'), cls: 'badge-success' },
    PENDING_REVIEW: { text: t('enums.courseStatus.PENDING_REVIEW', 'Pending Review'), cls: 'badge-warning' },
    DRAFT: { text: t('enums.courseStatus.DRAFT', 'Draft'), cls: 'badge-slate' },
    REJECTED: { text: t('enums.courseStatus.REJECTED', 'Rejected'), cls: 'badge-danger' },
  };

  return (
    <LuxuryDashboardLayout>
      {/* ═══ PAGE HEADER SECTION ═══ */}
      <div style={{ marginBottom: 28 }}>
        {/* Title Row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 22,
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--lx-text)', letterSpacing: -0.3 }}>
              {t('instructor.courses.title', 'My Courses')}
            </h4>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--lx-text-muted)' }}>
              {t('instructor.courses.manageSubtitle', 'Manage and track all your courses in one place')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to={all_routes.addNewCourse}
              className="lx-btn lx-btn-gold"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5,
                padding: '10px 20px', fontWeight: 600,
              }}
            >
              <i className="isax isax-add" style={{ fontSize: 17 }} />
              {t('instructor.courses.addNew', 'Add New Course')}
            </Link>
            {/* View Toggle */}
            <div style={{
              display: 'flex', gap: 2, padding: 3, borderRadius: 10,
              background: 'rgba(253, 249, 246, 0.65)', backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(101, 28, 50, 0.08)',
            }}>
              <Link
                to={all_routes.instructorCourse}
                title={t('instructor.coursesPage.listView', 'List View')}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', color: 'var(--lx-text-muted)', fontSize: 17,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <i className="isax isax-row-horizontal" />
              </Link>
              <span
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--lx-primary)', color: '#fff', fontSize: 17,
                  boxShadow: '0 2px 8px rgba(101, 28, 50, 0.2)',
                }}
              >
                <i className="isax isax-element-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12,
        }}>
          {statDefs.map((sc) => (
            <div
              key={sc.key}
              style={{
                padding: '16px 18px', borderRadius: 14,
                background: 'rgba(253, 249, 246, 0.65)', backdropFilter: 'blur(12px)',
                border: `1.5px solid ${sc.borderColor}`,
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(43, 15, 30, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: sc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`isax ${sc.icon}`} style={{ fontSize: 19, color: sc.color }} />
              </div>
              <div>
                <span style={{
                  fontSize: 24, fontWeight: 800, color: 'var(--lx-text)',
                  lineHeight: 1, display: 'block',
                }}>
                  {stats[sc.key]}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--lx-text-muted)', marginTop: 2, display: 'block' }}>
                  {t(sc.labelKey, sc.labelFallback)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ FILTER TABS ═══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div className="lx-seg" role="group">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = getTabCount(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={isActive}
                className={`lx-seg-btn${isActive ? ' is-active' : ''}`}
              >
                {t(tab.labelKey, tab.labelFallback)}
                <span className="lx-seg-count">{count}</span>
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', fontWeight: 500 }}>
          {t('instructor.courses.showing', 'Showing')} <strong style={{ color: 'var(--lx-text)', fontWeight: 700 }}>{filteredCourses.length}</strong> {filteredCourses.length !== 1 ? t('instructor.courses.coursesPlural', 'courses') : t('instructor.courses.courseSingular', 'course')}
        </span>
      </div>

      {/* ═══ COURSE GRID ═══ */}
      {loading ? (
        <div style={{
          padding: 80, textAlign: 'center', borderRadius: 16,
          background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(101, 28, 50, 0.05)',
        }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(101, 28, 50, 0.08)',
            borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 18px',
          }} />
          <p style={{ margin: 0, fontSize: 15, color: 'var(--lx-text-muted)', fontWeight: 500 }}>
            {t('common.loading', 'Loading...')}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="lx-card">
          <LxEmptyState
            icon="isax-book-1"
            title={activeTab === 'all' ? t('instructor.courses.noCourses', 'No courses yet') : t('instructor.courses.noFilteredCourses', 'No {{tab}} courses', { tab: activeTab })}
            text={activeTab === 'all'
              ? t('instructor.courses.noCoursesSubtitle', 'Create your first course and start sharing your knowledge with students.')
              : t('instructor.courses.noFilteredCoursesSubtitle', "You don't have any {{tab}} courses at the moment.", { tab: activeTab })}
          >
            {activeTab === 'all' && (
              <Link to={all_routes.addNewCourse} className="lx-btn lx-btn-gold">
                <i className="isax isax-add" /> {t('instructor.courses.createFirst', 'Create your first course')}
              </Link>
            )}
          </LxEmptyState>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {filteredCourses.map((course) => {
            const st = statusMap[course.status] || { text: course.status, cls: 'badge-info' };
            const isHovered = hoveredCard === course.id;
            const rating = Number(course.ratingAverage ?? 0).toFixed(1);

            return (
              <div
                key={course.id}
                style={{
                  borderRadius: 16, overflow: 'hidden',
                  background: 'rgba(253, 249, 246, 0.6)', backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(101, 28, 50, 0.06)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                  transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? '0 20px 40px rgba(43, 15, 30, 0.1), 0 0 0 1px rgba(101, 28, 50, 0.08)'
                    : '0 2px 8px rgba(43, 15, 30, 0.03)',
                }}
                onMouseEnter={() => setHoveredCard(course.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* ── Image Section ── */}
                <div style={{ position: 'relative', overflow: 'hidden', height: 195 }}>
                  <Link to={`${all_routes.courseDetails}/${course.slug}`}>
                    <img
                      src={getThumbnailUrl(course)}
                      alt={course.title}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        transition: 'transform 0.5s ease',
                        transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/course/course-01.jpg`; }}
                    />
                  </Link>

                  {/* Bottom Gradient Overlay */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />

                  {/* Status Badge — top left */}
                  <span
                    className={`lx-badge ${st.cls}`}
                    style={{
                      position: 'absolute', top: 14, left: 14, fontSize: 12,
                      backdropFilter: 'blur(6px)', letterSpacing: 0.2,
                    }}
                  >
                    {st.text}
                  </span>

                  {/* Price Badge — top right */}
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    padding: '5px 14px', borderRadius: 20,
                    background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    fontSize: 14, fontWeight: 800, letterSpacing: -0.3,
                    color: !course.requiresPurchase ? '#855A0E' : 'var(--lx-primary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    {!course.requiresPurchase ? 'Free' : (
                      <>
                        {formatMAD(course.price, course.currency)}
                        {course.originalPrice && course.originalPrice > (course.price || 0) && (
                          <del style={{ fontSize: 12, marginLeft: 5, color: 'var(--lx-text-soft)', fontWeight: 400 }}>
                            {formatMAD(course.originalPrice, course.currency)}
                          </del>
                        )}
                      </>
                    )}
                  </div>

                  {/* Bottom-left: Enrolled count */}
                  <div style={{
                    position: 'absolute', bottom: 12, left: 14,
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 600, color: '#fff',
                  }}>
                    <i className="isax isax-people" style={{ fontSize: 14 }} />
                    {course.enrolledCount || 0} students
                  </div>

                  {/* Bottom-right: Rating */}
                  {Number(rating) > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 12, right: 14,
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      <i className="isax isax-star-1" style={{ fontSize: 12, color: '#E2B866' }} />
                      {rating}
                    </div>
                  )}

                  {/* Hover Overlay — View button */}
                  <Link
                    to={`${all_routes.courseDetails}/${course.slug}`}
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(43, 15, 30, 0.25)',
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      transform: isHovered ? 'scale(1)' : 'scale(0.7)',
                      transition: 'transform 0.3s ease',
                    }}>
                      <i className="isax isax-eye" style={{ fontSize: 20, color: 'var(--lx-primary)' }} />
                    </div>
                  </Link>
                </div>

                {/* ── Card Body ── */}
                <div style={{ padding: '18px 20px 20px' }}>
                  {/* Title */}
                  <h6 style={{
                    margin: '0 0 14px', fontSize: 15.5, fontWeight: 700, color: 'var(--lx-text)',
                    lineHeight: 1.45, minHeight: 45,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    <Link
                      to={`${all_routes.courseDetails}/${course.slug}`}
                      style={{
                        color: 'inherit', textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lx-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}
                    >
                      {course.title}
                    </Link>
                  </h6>

                  {/* Meta Row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    paddingBottom: 14, marginBottom: 14,
                    borderBottom: '1px solid rgba(101, 28, 50, 0.06)',
                  }}>
                    {[
                      { icon: 'isax-video-circle', text: `${course.lessonsCount || 0} Lessons` },
                      { icon: 'isax-clock',        text: formatDuration(course.durationMinutes || 0) },
                    ].map((m) => (
                      <span key={m.icon} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12.5, color: 'var(--lx-text-muted)', fontWeight: 500,
                      }}>
                        <i className={`isax ${m.icon}`} style={{ fontSize: 14, color: 'var(--lx-text-soft)' }} />
                        {m.text}
                      </span>
                    ))}
                  </div>

                  {/* Action Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Left: Manage CTA */}
                    <Link
                      to={instructorManageHref(course)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 16px', borderRadius: 8,
                        background: 'rgba(101, 28, 50, 0.04)', color: 'var(--lx-primary)',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        border: '1px solid rgba(101, 28, 50, 0.08)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--lx-primary)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = 'var(--lx-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(101, 28, 50, 0.04)';
                        e.currentTarget.style.color = 'var(--lx-primary)';
                        e.currentTarget.style.borderColor = 'rgba(101, 28, 50, 0.08)';
                      }}
                    >
                      <i className="isax isax-setting-2" style={{ fontSize: 14 }} />
                      {t('instructor.courses.manage', 'Manage')}
                    </Link>

                    {/* Right: Icon Actions */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link
                        to={`${all_routes.addNewCourse}?edit=${course.id}`}
                        title={t('instructor.coursesPage.editCourse', 'Edit Course')}
                        style={{
                          width: 34, height: 34, borderRadius: 8, textDecoration: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(101, 28, 50, 0.03)', color: 'var(--lx-text-muted)',
                          fontSize: 15, transition: 'all 0.2s ease',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(101, 28, 50, 0.06)';
                          e.currentTarget.style.color = 'var(--lx-primary)';
                          e.currentTarget.style.borderColor = 'rgba(101, 28, 50, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(101, 28, 50, 0.03)';
                          e.currentTarget.style.color = 'var(--lx-text-muted)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <i className="isax isax-edit-2" />
                      </Link>
                      <button
                        type="button"
                        title={t('instructor.coursesPage.deleteCourse', 'Delete Course')}
                        onClick={() => handleDeleteClick(course.id)}
                        style={{
                          width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(101, 28, 50, 0.03)', color: 'var(--lx-text-soft)',
                          fontSize: 15, transition: 'all 0.2s ease',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(101, 28, 50, 0.08)';
                          e.currentTarget.style.color = '#651C32';
                          e.currentTarget.style.borderColor = 'rgba(101, 28, 50, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(101, 28, 50, 0.03)';
                          e.currentTarget.style.color = 'var(--lx-text-soft)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <i className="isax isax-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ DELETE MODAL ═══ */}
      {deleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(43, 15, 30, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 420, padding: 36, textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 20, border: '1px solid rgba(101, 28, 50, 0.1)',
            boxShadow: '0 24px 48px rgba(43, 15, 30, 0.15)',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: '0 auto 18px',
              background: 'rgba(101, 28, 50, 0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-trash" style={{ fontSize: 26, color: '#651C32' }} />
            </div>
            <h5 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>
              {t('instructor.courses.deleteCourse', 'Delete this course?')}
            </h5>
            <p style={{ margin: '0 0 26px', fontSize: 14, color: 'var(--lx-text-mid)', lineHeight: 1.5 }}>
              {t('instructor.courses.deleteConfirm', 'This will permanently remove the course and all its content. This action cannot be undone.')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button
                type="button" className="lx-btn lx-btn-outline"
                style={{ padding: '9px 22px' }}
                onClick={() => setDeleteModal(false)}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button" className="lx-btn"
                style={{
                  padding: '9px 22px',
                  background: 'linear-gradient(135deg, #651C32 0%, #651C32 100%)',
                  color: '#fff', border: 'none',
                  opacity: deleting ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(101, 28, 50, 0.2)',
                }}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? t('common.deleting', 'Deleting...') : t('common.yesDelete', 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorCourseGrid;
