import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import { courseService } from '../../../../services/api/course.service';
import { PublicInstructorProfile, Course } from '../../../../services/api/types';
import { Rate } from 'antd';
import { getFileUrl } from '../../../../environment';
import CourseCard from '../../../../components/CourseCard';
import BadgeAvatar from '../../../../components/BadgeAvatar';
import { getBadgeFromRole } from '../../../../config/badges';

// Same palette as the ebook and masterclass pages.
const GOLD = '#C5912C';
const BURG = '#651C32';
const DARK = '#2B0F1E';
const IVORY = '#F2EFE8';
const SERIF = "'Playfair Display', Georgia, serif";

const SOCIALS: { key: string; icon: string; label: string }[] = [
  { key: 'instagram', icon: 'fa-brands fa-instagram', label: 'Instagram' },
  { key: 'facebook', icon: 'fa-brands fa-facebook-f', label: 'Facebook' },
  { key: 'youtube', icon: 'fa-brands fa-youtube', label: 'YouTube' },
  { key: 'twitter', icon: 'fa-brands fa-x-twitter', label: 'X' },
  { key: 'linkedin', icon: 'fa-brands fa-linkedin-in', label: 'LinkedIn' },
  { key: 'website', icon: 'fa-solid fa-globe', label: 'Website' },
];

/** Only http(s) links are rendered — a profile field must never become a javascript: URL. */
const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : undefined);

const Spinner = () => (
  <div style={{ background: IVORY, minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      border: '3px solid rgba(197,145,44,0.25)', borderTopColor: GOLD,
      animation: 'spin 0.9s linear infinite',
    }} />
  </div>
);

const InstructorDetails = () => {
  const { t } = useTranslation();
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
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [profileData, coursesData] = await Promise.all([
          courseService.getInstructorProfile(instructorId),
          courseService.getInstructorCourses(instructorId, 0, 6),
        ]);
        if (cancelled) return;
        setInstructor(profileData);
        setCourses(coursesData.content ?? []);
        setTotalCoursePages(coursesData.totalPages ?? 0);
        setCoursesPage(0);
      } catch (err) {
        console.error('Error loading instructor:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
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
    try { return JSON.parse(raw) || {}; } catch { return {}; }
  };

  if (loading) return <Spinner />;

  if (!instructor) {
    return (
      <div style={{ background: IVORY, minHeight: '70vh', padding: '130px 16px 60px', textAlign: 'center' }}>
        <i className="isax isax-user" style={{ fontSize: 54, color: GOLD, display: 'block', marginBottom: 12 }} />
        <h3 style={{ fontFamily: SERIF, color: BURG, fontWeight: 800 }}>
          {t('instructorPage.notFound', 'Instructor not found')}
        </h3>
        <p style={{ color: 'rgba(101,28,50,0.65)' }}>
          {t('instructorPage.notFoundHint', 'This instructor profile could not be loaded.')}
        </p>
        <Link to={route.courseGrid} style={{ color: GOLD, fontWeight: 700 }}>
          {t('instructorPage.browseCourses', 'Browse courses')}
        </Link>
      </div>
    );
  }

  const avatarUrl = getFileUrl(instructor.avatarUrl) ?? `${process.env.PUBLIC_URL}/assets/img/user/user-61.jpg`;
  const social = parseSocial(instructor.socialLinks);
  const links = SOCIALS.map(s => ({ ...s, url: safeUrl(social[s.key]) })).filter(s => s.url);
  const bioText = instructor.bio ?? '';
  const rating = Number(instructor.averageRating ?? 0);
  const totalReviews = instructor.totalReviews ?? 0;
  const totalStudents = instructor.totalStudents ?? 0;
  const totalCourses = instructor.totalCourses ?? 0;

  const stats = [
    { icon: 'isax-book', value: totalCourses, label: t('instructorPage.courses', 'Courses') },
    { icon: 'isax-profile-2user', value: totalStudents.toLocaleString(), label: t('instructorPage.students', 'Students') },
    { icon: 'isax-star-1', value: rating.toFixed(1), label: t('instructorPage.reviews', '{{n}} reviews', { n: totalReviews }) },
  ];

  return (
    <div style={{ background: IVORY, minHeight: '100vh' }}>
      <style>{`
        .ip-social { transition: transform .2s ease, background .2s ease }
        .ip-social:hover { transform: translateY(-2px); background: ${GOLD} !important; color: ${DARK} !important }
        .ip-hero .ant-rate-star:not(.ant-rate-star-full) .ant-rate-star-second { color: rgba(242,239,232,.25) }
      `}</style>

      {/* ── Hero ── */}
      <section className="ip-hero" style={{
        background: `linear-gradient(160deg, #4A0E1F 0%, ${BURG} 50%, ${DARK} 100%)`,
        padding: '100px 0 56px', color: IVORY,
      }}>
        <div className="container" style={{ maxWidth: 1140 }}>
          <Link to={route.courseGrid} style={{ color: GOLD, fontWeight: 600, fontSize: '0.9rem' }}>
            ← {t('instructorPage.browseCourses', 'Browse courses')}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginTop: 18 }}>
            <div style={{
              flex: '0 0 auto', padding: 5, borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD}, #E0C56E)`, boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            }}>
              <BadgeAvatar avatarUrl={avatarUrl} name={instructor.fullName} badge={getBadgeFromRole('INSTRUCTOR')} size="lg" />
            </div>

            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <p style={{ color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                {t('instructorPage.eyebrow', 'Saralöwe instructor')}
              </p>
              <h1 style={{
                fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', lineHeight: 1.15, marginBottom: 8,
                background: `linear-gradient(90deg, ${IVORY}, ${GOLD})`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>
                {instructor.fullName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <Rate disabled value={rating} allowHalf style={{ fontSize: 15, color: GOLD }} />
                <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                  {rating.toFixed(1)} · {t('instructorPage.reviews', '{{n}} reviews', { n: totalReviews })}
                </span>
              </div>
              {links.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {links.map(s => (
                    <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}
                      className="ip-social"
                      style={{
                        width: 38, height: 38, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(242,239,232,0.1)', border: '1px solid rgba(197,145,44,0.45)', color: GOLD,
                      }}>
                      <i className={s.icon} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="row g-3" style={{ marginTop: 30 }}>
            {stats.map(s => (
              <div className="col-4" key={s.label}>
                <div style={{
                  background: 'rgba(242,239,232,0.07)', border: '1px solid rgba(197,145,44,0.3)',
                  borderRadius: 16, padding: '16px 10px', textAlign: 'center', height: '100%',
                }}>
                  <i className={`isax ${s.icon}`} style={{ color: GOLD, fontSize: 22 }} />
                  <div style={{ fontFamily: SERIF, fontSize: 'clamp(1.2rem, 3vw, 1.7rem)', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.75 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {bioText && (
        <section style={{ padding: '52px 0 8px' }}>
          <div className="container" style={{ maxWidth: 1140 }}>
            <div style={{
              background: '#fff', borderRadius: 20, padding: 'clamp(20px, 4vw, 34px)',
              border: '1px solid rgba(197,145,44,0.22)', boxShadow: '0 12px 34px rgba(101,28,50,0.06)',
            }}>
              <p style={{ color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                {t('instructorPage.about', 'About')}
              </p>
              <h2 style={{ fontFamily: SERIF, fontWeight: 800, color: BURG, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', marginBottom: 14 }}>
                {t('instructorPage.meet', 'Meet {{name}}', { name: instructor.fullName })}
              </h2>
              <p style={{ lineHeight: 1.85, whiteSpace: 'pre-wrap', color: 'rgba(43,15,30,0.82)', marginBottom: 0 }}>
                {expanded || bioText.length <= 500 ? bioText : bioText.slice(0, 500) + '…'}
              </p>
              {bioText.length > 500 && (
                <button type="button" onClick={() => setExpanded(e => !e)}
                  style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, color: GOLD, fontWeight: 700, cursor: 'pointer' }}>
                  {expanded ? t('instructorPage.showLess', 'Show less') : t('instructorPage.readMore', 'Read more')}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Courses ── */}
      <section style={{ padding: '44px 0 70px' }}>
        <div className="container" style={{ maxWidth: 1140 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 800, color: BURG, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', margin: 0 }}>
              {t('instructorPage.coursesBy', 'Courses & masterclasses')}
            </h2>
            {totalCourses > 0 && (
              <span style={{ background: GOLD, color: DARK, fontWeight: 800, fontSize: '0.8rem', padding: '3px 11px', borderRadius: 999 }}>
                {totalCourses}
              </span>
            )}
          </div>

          {courses.length === 0 ? (
            <p style={{ color: 'rgba(101,28,50,0.65)' }}>{t('instructorPage.noCourses', 'No published courses yet.')}</p>
          ) : (
            <>
              <div className="row">
                {courses.map(course => (
                  <div key={course.id} className="col-md-6 col-lg-4 mb-4">
                    <CourseCard course={course} layout="grid" />
                  </div>
                ))}
              </div>
              {coursesPage + 1 < totalCoursePages && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button type="button" onClick={handleLoadMoreCourses} disabled={loadingCourses}
                    style={{
                      padding: '12px 30px', borderRadius: 999, border: `2px solid ${GOLD}`, background: 'transparent',
                      color: BURG, fontWeight: 800, cursor: loadingCourses ? 'wait' : 'pointer',
                    }}>
                    {loadingCourses ? t('common.loading', 'Loading…') : t('instructorPage.loadMore', 'Load more')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default InstructorDetails;
