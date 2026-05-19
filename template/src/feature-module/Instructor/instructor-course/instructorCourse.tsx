import React, { useEffect, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../router/all_routes';
import Table from '../../../core/common/dataTable/index';
import { instructorService } from '../../../services/api/instructor.service';
import { Course } from '../../../services/api/types';
import { getFileUrl } from '../../../environment';
import { message } from 'antd';

/* ── Types ─────────────────────────────────────────────── */
interface CourseStats {
  active: number;
  pending: number;
  draft: number;
  free: number;
  paid: number;
}

interface StatCardDef {
  label: string;
  key: keyof CourseStats;
  icon: string;
  color: string;
  bg: string;
}

const statCards: StatCardDef[] = [
  { label: 'Active Courses', key: 'active', icon: 'isax-play-circle', color: '#2D5F3F', bg: 'rgba(45, 95, 63, 0.06)' },
  { label: 'Pending Review', key: 'pending', icon: 'isax-clock', color: '#C5973E', bg: 'rgba(197, 151, 62, 0.06)' },
  { label: 'Draft Courses', key: 'draft', icon: 'isax-document-text', color: '#5C3D2E', bg: 'rgba(92, 61, 46, 0.06)' },
  { label: 'Free Courses', key: 'free', icon: 'isax-gift', color: '#2D8CFF', bg: 'rgba(45, 140, 255, 0.06)' },
  { label: 'Paid Courses', key: 'paid', icon: 'isax-wallet-money', color: '#6B1D2A', bg: 'rgba(107, 29, 42, 0.06)' },
];
// Note: statCards labels are replaced dynamically via t() in the component render

/* ── Component ─────────────────────────────────────────── */
const InstructorCourse = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CourseStats>({ active: 0, pending: 0, draft: 0, free: 0, paid: 0 });
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await instructorService.getMyCourses(0, 100);
      const list: Course[] = Array.isArray(response?.content) ? response.content : [];
      setCourses(list);

      const s: CourseStats = { active: 0, pending: 0, draft: 0, free: 0, paid: 0 };
      list.forEach((course) => {
        if (course.status === 'PUBLISHED') s.active++;
        else if (course.status === 'PENDING_REVIEW') s.pending++;
        else if (course.status === 'DRAFT') s.draft++;
        if (!course.requiresPurchase) s.free++; else s.paid++;
      });
      setStats(s);
    } catch (err) {
      console.error('Error fetching courses:', err);
      message.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDeleteClick = (courseId: string) => {
    setSelectedCourseId(courseId);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourseId) return;
    try {
      setDeleting(true);
      await instructorService.deleteCourse(selectedCourseId);
      message.success('Course deleted successfully');
      setDeleteModal(false);
      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      message.error('Failed to delete course');
    } finally {
      setDeleting(false);
      setSelectedCourseId(null);
    }
  };

  const getThumbnailUrl = (course: Course) =>
    getFileUrl(course.thumbnailUrl) ?? 'assets/img/course/course-01.jpg';

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      PUBLISHED: { cls: 'badge-success', label: 'Published' },
      PENDING_REVIEW: { cls: 'badge-warning', label: 'Pending' },
      DRAFT: { cls: 'badge-slate', label: 'Draft' },
      REJECTED: { cls: 'badge-danger', label: 'Rejected' },
    };
    const b = map[status] || { cls: 'badge-info', label: status };
    return <span className={`lx-badge ${b.cls}`}>{b.label}</span>;
  };

  const formatDuration = (minutes: number) => {
    const m = minutes || 0;
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00 Hours`;
  };

  const data = courses.map((course) => ({
    key: course.id,
    id: course.id,
    CourseName: course.title,
    Img: course.thumbnailUrl,
    Lessons: course.lessonsCount || 0,
    Duration: course.durationMinutes || 0,
    Students: course.enrolledCount || 0,
    Price: !course.requiresPurchase ? 'Free' : `$${course.price || 0}`,
    Ratings: Number(course.ratingAverage ?? 0).toFixed(1),
    Status: course.status,
    slug: course.slug,
  }));

  const columns = [
    {
      title: t('instructor.courses.courseTitle', 'Course Name'),
      dataIndex: 'CourseName',
      render: (text: string, record: any) => {
        const courseObj = courses.find((c) => c.id === record.id);
        const imgUrl = courseObj ? getThumbnailUrl(courseObj) : 'assets/img/course/course-01.jpg';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to={`${all_routes.courseDetails}/${record.slug}`}>
              <img
                src={imgUrl}
                alt={text}
                style={{
                  width: 50, height: 50,
                  borderRadius: 'var(--lx-radius-sm)',
                  objectFit: 'cover', flexShrink: 0,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg';
                }}
              />
            </Link>
            <div>
              <Link
                to={`${all_routes.courseDetails}/${record.slug}`}
                style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--lx-text)', textDecoration: 'none' }}
              >
                {text}
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontSize: 12, color: 'var(--lx-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <i className="isax isax-video-circle" style={{ fontSize: 13 }} />
                  {record.Lessons} Lessons
                </span>
                <span style={{ color: 'rgba(107, 29, 42, 0.15)' }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <i className="isax isax-clock" style={{ fontSize: 13 }} />
                  {formatDuration(record.Duration)}
                </span>
              </div>
            </div>
          </div>
        );
      },
      sorter: (a: any, b: any) => a.CourseName.localeCompare(b.CourseName),
    },
    {
      title: t('instructor.courses.students', 'Students'),
      dataIndex: 'Students',
      sorter: (a: any, b: any) => a.Students - b.Students,
    },
    {
      title: t('instructor.courses.coursePrice', 'Price'),
      dataIndex: 'Price',
      render: (text: string) => (
        <span style={{
          fontWeight: 700, fontSize: 14,
          color: text === 'Free' ? '#2D5F3F' : 'var(--lx-text)',
        }}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => {
        const priceA = a.Price === 'Free' ? 0 : parseFloat(String(a.Price).replace('$', ''));
        const priceB = b.Price === 'Free' ? 0 : parseFloat(String(b.Price).replace('$', ''));
        return priceA - priceB;
      },
    },
    {
      title: t('instructor.courses.rating', 'Ratings'),
      dataIndex: 'Ratings',
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="isax isax-star-1" style={{ color: '#C5973E', fontSize: 14 }} />
          <span style={{ fontWeight: 600 }}>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => parseFloat(a.Ratings) - parseFloat(b.Ratings),
    },
    {
      title: t('common.status', 'Status'),
      dataIndex: 'Status',
      render: (text: string) => getStatusBadge(text),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: t('common.actions', 'Action'),
      dataIndex: '',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { to: `${all_routes.instructorCourseManage}/${record.id}`, icon: 'isax-setting-2', title: 'Manage' },
            { to: `${all_routes.addNewCourse}?edit=${record.id}`, icon: 'isax-edit-2', title: 'Edit' },
          ].map((a) => (
            <Link
              key={a.title}
              to={a.to}
              title={a.title}
              style={{
                width: 30, height: 30, borderRadius: 6, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(107, 29, 42, 0.04)', color: 'var(--lx-text-muted)',
                fontSize: 14, textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(107, 29, 42, 0.08)';
                e.currentTarget.style.color = 'var(--lx-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(107, 29, 42, 0.04)';
                e.currentTarget.style.color = 'var(--lx-text-muted)';
              }}
            >
              <i className={`isax ${a.icon}`} />
            </Link>
          ))}
          <button
            type="button"
            onClick={() => handleDeleteClick(record.id)}
            title="Delete"
            style={{
              width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(139, 35, 53, 0.05)', color: '#8B2335',
              fontSize: 14, transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139, 35, 53, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139, 35, 53, 0.05)'; }}
          >
            <i className="isax isax-trash" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <LuxuryDashboardLayout>
      {/* ── Stats Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        {statCards.map((sc) => (
          <div
            key={sc.key}
            style={{
              padding: 18, borderRadius: 'var(--lx-radius-sm)',
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(107, 29, 42, 0.06)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: sc.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`isax ${sc.icon}`} style={{ fontSize: 20, color: sc.color }} />
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--lx-text-muted)', display: 'block', marginBottom: 2 }}>
                {sc.label}
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--lx-text)' }}>
                {stats[sc.key]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="lx-card">
        <div className="lx-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{t('instructor.courses.title', 'My Courses')}</h6>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              to={all_routes.addNewCourse}
              className="lx-btn lx-btn-gold lx-btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13 }}
            >
              <i className="isax isax-add-circle" style={{ fontSize: 14 }} />
              {t('instructor.courses.addNew', 'Add New Course')}
            </Link>
            <div style={{
              display: 'flex', gap: 4, padding: 3, borderRadius: 8,
              background: 'rgba(107, 29, 42, 0.04)', border: '1px solid rgba(107, 29, 42, 0.06)',
            }}>
              <span
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--lx-primary)', color: '#fff', fontSize: 16,
                }}
              >
                <i className="isax isax-task" />
              </span>
              <Link
                to={all_routes.instructorCourseGrid}
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', color: 'var(--lx-text-muted)', fontSize: 16,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <i className="isax isax-element-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="lx-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid rgba(107, 29, 42, 0.1)',
                borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
              }} />
              <p style={{ margin: 0, fontSize: 14, color: 'var(--lx-text-muted)' }}>{t('common.loading', 'Loading...')}</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : courses.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(107, 29, 42, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-book-1" style={{ fontSize: 28, color: 'var(--lx-text-muted)' }} />
              </div>
              <h6 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{t('instructor.courses.noCourses', 'No courses yet')}</h6>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--lx-text-muted)' }}>
                {t('instructor.courses.createFirst', 'Create your first course')}!
              </p>
              <Link
                to={all_routes.addNewCourse}
                className="lx-btn lx-btn-gold"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <i className="isax isax-add-circle" style={{ fontSize: 16 }} />
                {t('instructor.courses.addNew', 'Add New Course')}
              </Link>
            </div>
          ) : (
            <div className="lx-table">
              <Table dataSource={data} columns={columns} Search={true} />
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Modal ── */}
      {deleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 420, padding: 32, textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(139, 35, 53, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>{t('instructor.courses.deleteCourse', 'Delete Course?')}</h5>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
              {t('instructor.courses.deleteConfirm', 'Are you sure you want to delete this course? This action cannot be undone.')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setDeleteModal(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button" className="lx-btn" disabled={deleting}
                style={{
                  background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335',
                  border: '1.5px solid rgba(139, 35, 53, 0.15)',
                  opacity: deleting ? 0.6 : 1,
                }}
                onClick={handleDeleteConfirm}
              >
                {deleting ? t('common.loading', 'Loading...') : t('common.yes', 'Yes') + ', ' + t('common.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorCourse;
