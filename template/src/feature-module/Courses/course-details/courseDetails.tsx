import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../router/all_routes';
import { courseService } from '../../../services/api/course.service';
import {
  Course, CourseModule, CourseReview,
  PublicInstructorProfile, CreateReviewRequest,
} from '../../../services/api/types';
import { getFileUrl } from '../../../environment';
import { Spin, App, Rate, Collapse } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { addToWishlist, removeFromWishlist } from '../../../core/redux/courseSlice';
import { addToCart } from '../../../core/redux/cartSlice';

const { Panel } = Collapse;
const route = all_routes;

/* helpers */
function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}
function fmtSecDuration(secs: number) { return fmtDuration(Math.floor(secs / 60)); }
function levelLabel(level: string) {
  const map: Record<string, string> = {
    BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced', ALL_LEVELS: 'All Levels',
  };
  return map[level] ?? level;
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
function parseSocialLinks(raw?: string): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

const StarBar = ({ pct }: { pct: number }) => (
  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(197,145,44,0.12)', overflow: 'hidden' }}>
    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#C5973E,#DEBB6B)', borderRadius: 3 }} />
  </div>
);

/* ================================================ */
const CourseDetails = () => {
  const { t } = useTranslation();
  const { slug }   = useParams<{ slug: string }>();
  const navigate   = useNavigate();
  const dispatch   = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { items: cartItems }      = useAppSelector((s) => s.cart);
  const { message }               = App.useApp();

  const [course,       setCourse]       = useState<Course | null>(null);
  const [curriculum,   setCurriculum]   = useState<CourseModule[]>([]);
  const [reviews,      setReviews]      = useState<CourseReview[]>([]);
  const [instructor,   setInstructor]   = useState<PublicInstructorProfile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [enrolling,    setEnrolling]    = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [activeTab,    setActiveTab]    = useState<'overview'|'curriculum'|'instructor'|'reviews'>('overview');
  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);
  const [userReview,    setUserReview]    = useState<CourseReview | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const courseData = await courseService.getCourseBySlug(slug);
        if (cancelled) return;
        setCourse(courseData);
        const [curr, revResp] = await Promise.all([
          courseService.getCourseCurriculum(courseData.id).catch(() => [] as CourseModule[]),
          courseService.getCourseReviews(courseData.id, 0, 10).catch(() => ({
            content: [] as CourseReview[], totalPages: 0, totalElements: 0,
            size: 10, number: 0, first: true, last: true, empty: true,
          })),
        ]);
        if (cancelled) return;
        setCurriculum(curr);
        setReviews(revResp.content ?? []);
        const own = (revResp.content ?? []).find((r) => r.isOwner);
        if (own) { setUserReview(own); setReviewRating(own.rating); setReviewComment(own.comment); }
        if (courseData.instructor?.id) {
          courseService.getInstructorProfile(courseData.instructor.id)
            .then((p) => { if (!cancelled) setInstructor(p); })
            .catch(() => {});
        }
      } catch {
        if (!cancelled) message.error('Failed to load course details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleEnroll = useCallback(async () => {
    if (!isAuthenticated) { message.warning('Please login to enroll'); navigate(route.login); return; }
    if (!course) return;
    try {
      setEnrolling(true);
      await courseService.enrollInCourse(course.id);
      if (user?.role === 'ADMIN') {
        message.success('Access granted!');
        navigate(`${route.courseWatch}/${course.slug}`);
        return;
      }
      message.success('Successfully enrolled!');
      const updated = await courseService.getCourseBySlug(slug!);
      setCourse(updated);
    } catch (err: any) {
      const serverMsg: string = err?.response?.data?.message ?? '';
      if (serverMsg.toLowerCase().includes('already enrolled')) {
        message.info('You are already enrolled'); navigate(`${route.courseWatch}/${course.slug}`);
      } else if (serverMsg.toLowerCase().includes('subscription')) {
        message.warning('Active subscription required.'); navigate(route.pricingPlan);
      } else if (serverMsg.toLowerCase().includes('purchase') || serverMsg.toLowerCase().includes('masterclass')) {
        message.warning('This masterclass requires purchase.');
      } else {
        message.error('Failed to enroll. Please try again.');
      }
    } finally { setEnrolling(false); }
  }, [isAuthenticated, user, course, slug, message, navigate]);

  const handleWishlist = useCallback(async () => {
    if (!isAuthenticated) { message.warning('Please login to use wishlist'); navigate(route.login); return; }
    if (!course || wishlistBusy) return;
    try {
      setWishlistBusy(true);
      if (course.isWishlisted) {
        await dispatch(removeFromWishlist(course.id)).unwrap(); message.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(course.id)).unwrap(); message.success('Added to wishlist');
      }
      const updated = await courseService.getCourseBySlug(slug!); setCourse(updated);
    } catch { message.error('Failed to update wishlist'); }
    finally { setWishlistBusy(false); }
  }, [isAuthenticated, course, wishlistBusy, slug, dispatch, message, navigate]);

  const handleAddToCart = useCallback(() => {
    if (!course) return;
    if (cartItems.some((i) => i.id === course.id)) { message.info('Already in cart'); return; }
    dispatch(addToCart({
      id: course.id, slug: course.slug, title: course.title,
      thumbnailUrl: course.thumbnailUrl, price: course.price ?? 0,
      originalPrice: course.originalPrice, instructorName: course.instructor?.fullName,
      instructorId: course.instructor?.id, instructorAvatar: course.instructor?.avatarUrl,
      rating: course.ratingAverage, ratingCount: course.ratingCount, level: course.level,
    }));
    message.success(`"${course.title}" added to cart`);
  }, [course, cartItems, dispatch, message]);

  const handleSubmitReview = useCallback(async () => {
    if (!isAuthenticated) { navigate(route.login); return; }
    if (!course || reviewRating === 0) { message.warning('Please select a rating'); return; }
    if (!reviewComment.trim()) { message.warning('Please write a comment'); return; }
    try {
      setSubmittingRev(true);
      const req: CreateReviewRequest = { rating: reviewRating, reviewText: reviewComment.trim() };
      if (userReview) {
        await courseService.updateReview(course.id, String(userReview.id), req); message.success('Review updated!');
      } else {
        await courseService.createReview(course.id, req); message.success('Review submitted! Thank you.');
      }
      const rev2 = await courseService.getCourseReviews(course.id, 0, 10);
      setReviews(rev2.content ?? []);
      const own = (rev2.content ?? []).find((r) => r.isOwner); if (own) setUserReview(own);
    } catch { message.error('Failed to submit review'); }
    finally { setSubmittingRev(false); }
  }, [isAuthenticated, course, reviewRating, reviewComment, userReview, message, navigate]);

  /* loading */
  if (loading) return (
    <div style={{ background: '#F2EFE8', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1a0a0f 0%,#2d1018 60%,#3a1420 100%)', height: 320 }} />
      <div style={{ textAlign: 'center', paddingTop: 120 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16, color: '#9A8080', fontSize: 14 }}>{t('courses.watch.loadingCourse', 'Loading course…')}</p>
      </div>
    </div>
  );

  if (!course) return (
    <div style={{ background: '#F2EFE8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <i className="isax isax-book" style={{ fontSize: 72, color: 'rgba(107,29,42,0.15)', display: 'block', marginBottom: 20 }} />
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2C1810', marginBottom: 8 }}>{t('courses.list.noCoursesFound', 'No courses found')}</h3>
        <p style={{ color: '#9A8080', marginBottom: 24 }}>{t('courseDetails.courseNotFound', 'This course does not exist or has been removed.')}</p>
        <Link to={route.courseGrid} style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 10, fontWeight: 700,
          background: 'linear-gradient(135deg,#651C32,#8B2335)', color: '#fff', textDecoration: 'none',
        }}>{t('student.dashboard.browseCourses', 'Browse Courses')}</Link>
      </div>
    </div>
  );

  /* non-null from here — narrow once */
  const c = course;

  const hasDiscount = c.originalPrice && c.price && c.originalPrice > c.price;
  const discountPct = hasDiscount ? Math.round(((c.originalPrice! - c.price!) / c.originalPrice!) * 100) : 0;
  const isAdmin       = isAuthenticated && user?.role === 'ADMIN';
  const isInstructor  = isAuthenticated && user?.role === 'INSTRUCTOR';
  const _isStaff      = isAdmin || isInstructor;
  const hasActiveSub  = isAuthenticated && user?.subscriptionStatus === 'ACTIVE'
    && !!user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();
  const isPlan        = c.courseType === 'PLAN' || !c.courseType;
  const isMasterclass = c.courseType === 'MASTERCLASS';

  const thumb        = getFileUrl(c.thumbnailUrl) ?? 'assets/img/course/course-01.jpg';
  const instrAvatar  = getFileUrl(c.instructor?.avatarUrl ?? instructor?.avatarUrl) ?? 'assets/img/user/user-01.jpg';
  const inCart       = cartItems.some((i) => i.id === c.id);
  const totalLessons = curriculum.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
  const quizLessons  = curriculum.reduce((s, m) => s + (m.lessons?.filter((l) => l.contentType === 'QUIZ').length ?? 0), 0);
  const totalDurSec  = curriculum.reduce((s, m) => s + (m.totalDurationSeconds ?? 0), 0);
  const socialLinks  = parseSocialLinks(instructor?.socialLinks);
  const ratingDist   = [5, 4, 3, 2, 1].map((star) => {
    const pct = star === Math.round(c.ratingAverage) ? Math.min(100, Math.round(c.ratingCount * 0.6))
      : star === Math.round(c.ratingAverage) - 1 ? 30 : star === Math.round(c.ratingAverage) + 1 ? 15 : 5;
    return { star, count: Math.round(c.ratingCount * pct / 100), pct };
  });

  const TABS = ['overview', 'curriculum', 'instructor', 'reviews'] as const;

  /* ===== RENDER ===== */
  return (
    <div style={{ background: '#F2EFE8', minHeight: '100vh' }}>

      {/* HERO */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg,#0e0508 0%,#1e0a10 35%,#2d1018 65%,#3d1522 100%)',
        paddingBottom: 0,
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(197,145,62,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(107,29,42,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* Breadcrumb */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 0' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
            <Link to={route.homeone} style={{ color: 'rgba(197,145,62,0.7)', textDecoration: 'none', fontWeight: 500 }}>{t('sharedComponents.breadcrumb.home', 'Home')}</Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 9 }} />
            <Link to={route.courseGrid} style={{ color: 'rgba(197,145,62,0.7)', textDecoration: 'none', fontWeight: 500 }}>{t('nav.courses', 'Courses')}</Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 9 }} />
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>{c.title}</span>
          </nav>
        </div>

        {/* Hero grid: info left, thumbnail right */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) min(420px,40%)', gap: 40, alignItems: 'center' }}>

          {/* LEFT */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {c.category?.name && (
                <span style={{
                  background: 'linear-gradient(135deg,rgba(197,145,62,0.25),rgba(197,145,62,0.12))',
                  color: '#DEBB6B', fontSize: 11, fontWeight: 800, padding: '4px 14px',
                  borderRadius: 20, border: '1px solid rgba(197,145,62,0.25)',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  {c.category.name}
                </span>
              )}
              <span style={{
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)',
                fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {levelLabel(c.level)}
              </span>
              {!c.requiresPurchase && (
                <span style={{ background: 'rgba(16,185,129,0.18)', color: '#34D399', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.25)' }}>FREE</span>
              )}
              {c.isEnrolled && (
                <span style={{ background: 'rgba(16,185,129,0.18)', color: '#34D399', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.25)' }}>
                  <i className="fa-solid fa-check" style={{ marginRight: 4 }} />ENROLLED
                </span>
              )}
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 14,
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>{c.title}</h1>

            {c.shortDescription && (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 20, maxWidth: 520 }}>
                {c.shortDescription}
              </p>
            )}

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
              {[
                { icon: 'fa-book-open', val: `${totalLessons} ${t('common.lessons', 'lessons')}` },
                { icon: 'fa-clock', val: fmtDuration(c.durationMinutes) },
                { icon: 'fa-users', val: `${c.enrolledCount?.toLocaleString()} ${t('common.enrolled', 'Enrolled')}` },
                ...(quizLessons > 0 ? [{ icon: 'fa-circle-question', val: `${quizLessons} Quiz${quizLessons > 1 ? 'zes' : ''}` }] : []),
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <i className={`fa-solid ${s.icon}`} style={{ color: 'rgba(197,145,62,0.8)', fontSize: 13 }} />
                  <span>{s.val}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#DEBB6B', lineHeight: 1 }}>
                {c.ratingAverage?.toFixed(1)}
              </span>
              <Rate disabled value={c.ratingAverage} allowHalf style={{ fontSize: 15, color: '#C5973E' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>({c.ratingCount} reviews)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: '2px solid rgba(197,145,62,0.5)',
                boxShadow: '0 0 0 3px rgba(197,145,62,0.12)',
              }}>
                {c.instructor?.avatarUrl ? (
                  <img src={instrAvatar} alt={c.instructor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#651C32', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DEBB6B', fontWeight: 800, fontSize: 18 }}>
                    {c.instructor?.fullName?.charAt(0) ?? 'I'}
                  </div>
                )}
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>Created by</div>
                <button
                  onClick={() => setActiveTab('instructor')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#DEBB6B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  {c.instructor?.fullName}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Thumbnail */}
          <div>
            <div style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,145,62,0.15)',
              aspectRatio: '16/10',
            }}>
              <img
                src={thumb} alt={c.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg'; }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(30,10,16,0.4) 0%,transparent 60%)', pointerEvents: 'none' }} />
              {c.previewVideoUrl && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.35)',
                    transition: 'transform 0.2s',
                  }}>
                    <i className="fa-solid fa-play" style={{ fontSize: 24, color: '#651C32', marginLeft: 4 }} />
                  </div>
                </div>
              )}
              {isMasterclass && (
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'linear-gradient(135deg,#C5973E,#DEBB6B)', color: '#fff', fontWeight: 800, fontSize: 11, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.06em' }}>
                  MASTERCLASS
                </div>
              )}
            </div>
          </div>

        </div>

        <svg viewBox="0 0 1440 40" style={{ display: 'block', marginBottom: -1 }} preserveAspectRatio="none">
          <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" fill="#F2EFE8" />
        </svg>
      </div>

      {/* BODY */}
      <div style={{ background: '#F2EFE8', paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) min(360px,34%)', gap: 32, alignItems: 'start' }}>

          {/* LEFT: Tabs */}
          <div style={{ minWidth: 0, overflow: 'hidden' }}>

            {/* Tab nav */}
            <div style={{
              display: 'flex', gap: 4, marginBottom: 32,
              background: '#fff', borderRadius: 14, padding: 6,
              boxShadow: '0 2px 20px rgba(78,20,32,0.06)',
              border: '1px solid rgba(197,145,44,0.1)',
            }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
                    borderRadius: 10, transition: 'all 0.22s ease',
                    background: activeTab === tab ? 'linear-gradient(135deg,#651C32,#8B2335)' : 'transparent',
                    color: activeTab === tab ? '#fff' : '#7A6060',
                    boxShadow: activeTab === tab ? '0 4px 14px rgba(101,28,50,0.25)' : 'none',
                  }}
                >
                  {tab}
                  {tab === 'reviews' && c.ratingCount > 0 && (
                    <span style={{
                      marginLeft: 5, fontSize: 10, fontWeight: 800,
                      background: activeTab === tab ? 'rgba(255,255,255,0.25)' : 'rgba(107,29,42,0.08)',
                      color: activeTab === tab ? '#fff' : '#6B1D2A',
                      padding: '1px 6px', borderRadius: 10,
                    }}>
                      {c.ratingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                <div style={cardStyle}>
                  <SectionTitle>{t('courses.details.overview', 'Overview')}</SectionTitle>
                  <div style={{ color: '#4b5563', lineHeight: 1.8, fontSize: 15, wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: c.description || c.shortDescription || '' }} />
                </div>

                {c.whatYouWillLearn?.trim() && (
                  <div style={{ ...cardStyle, background: 'linear-gradient(135deg,rgba(197,145,62,0.04) 0%,#fff 60%)', border: '1px solid rgba(197,145,62,0.15)' }}>
                    <SectionTitle accent>{t('courses.details.whatYouLearn', "What You'll Learn")}</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '8px 16px' }}>
                      {c.whatYouWillLearn!.split('\n').filter((o) => o.trim()).map((obj, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                          }}>
                            <i className="fa-solid fa-check" style={{ color: '#10B981', fontSize: 10 }} />
                          </div>
                          <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.55 }}>{obj.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {c.requirements?.trim() && (
                  <div style={cardStyle}>
                    <SectionTitle>{t('courses.details.requirements', 'Requirements')}</SectionTitle>
                    <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                      {c.requirements!.split('\n').filter((r) => r.trim()).map((req, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, color: '#4b5563', fontSize: 14 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C5973E', flexShrink: 0, marginTop: 7 }} />
                          {req.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.targetAudience?.trim() && (
                  <div style={cardStyle}>
                    <SectionTitle>{t('courseDetails.whoFor', 'Who this course is for')}</SectionTitle>
                    <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                      {c.targetAudience!.split('\n').filter((line) => line.trim()).map((line, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, color: '#4b5563', fontSize: 14 }}>
                          <i className="fa-solid fa-user-check" style={{ color: '#651C32', fontSize: 13, marginTop: 2, flexShrink: 0 }} />
                          {line.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CURRICULUM */}
            {activeTab === 'curriculum' && (
              <div>
                <div style={{ ...cardStyle, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <SectionTitle noMargin>{t('courses.details.curriculum', 'Curriculum')}</SectionTitle>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#9A8080' }}>
                      <span><i className="fa-solid fa-layer-group" style={{ color: '#C5973E', marginRight: 4 }} />{curriculum.length} modules</span>
                      <span><i className="fa-solid fa-book-open" style={{ color: '#651C32', marginRight: 4 }} />{totalLessons} lessons</span>
                      <span><i className="fa-solid fa-clock" style={{ color: '#10B981', marginRight: 4 }} />{fmtSecDuration(totalDurSec)}</span>
                    </div>
                  </div>
                </div>

                {curriculum.length === 0 ? (
                  <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
                    <i className="isax isax-book" style={{ fontSize: 52, display: 'block', marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>{t('courseDetails.curriculumSoon', 'Curriculum will be available soon.')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {curriculum.map((mod, mi) => (
                      <div key={mod.id} style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                        <Collapse accordion expandIconPosition="end" bordered={false} style={{ background: 'transparent' }}>
                          <Panel
                            key={mod.id}
                            style={{ border: 'none' }}
                            header={
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                                <div style={{
                                  width: 34, height: 34, borderRadius: 10,
                                  background: 'linear-gradient(135deg,rgba(101,28,50,0.1),rgba(101,28,50,0.05))',
                                  border: '1px solid rgba(101,28,50,0.12)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13, fontWeight: 800, color: '#651C32', flexShrink: 0,
                                }}>
                                  {mi + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, color: '#2C1810', fontSize: 14, marginBottom: 2 }}>{mod.title}</div>
                                  <div style={{ fontSize: 12, color: '#9A8080' }}>
                                    {(mod.lessons?.length ?? 0)} lessons
                                    {mod.totalDurationSeconds ? ` · ${fmtSecDuration(mod.totalDurationSeconds)}` : ''}
                                  </div>
                                </div>
                              </div>
                            }
                          >
                            {(mod.lessons ?? []).length === 0 ? (
                              <p style={{ padding: '8px 16px 16px', color: '#9ca3af', fontSize: 13, margin: 0 }}>{t('courseDetails.noLessonsYet', 'No lessons yet')}</p>
                            ) : (mod.lessons ?? []).map((lesson, li) => {
                              const isQuiz  = lesson.contentType === 'QUIZ';
                              const isVideo = lesson.contentType === 'VIDEO';
                              const iconCls   = isQuiz ? 'fa-circle-question' : isVideo ? 'fa-circle-play' : 'fa-file-lines';
                              const iconColor = isQuiz ? '#F59E0B' : isVideo ? '#3B82F6' : '#6B7280';
                              const durMin    = Math.floor((lesson.videoDurationSeconds ?? 0) / 60);
                              return (
                                <div key={lesson.id} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '10px 20px',
                                  borderTop: li === 0 ? '1px solid rgba(197,145,44,0.08)' : 'none',
                                  borderBottom: '1px solid rgba(197,145,44,0.06)',
                                  background: li % 2 === 0 ? 'rgba(242,239,232,0.4)' : 'transparent',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                    {lesson.isCompleted ? (
                                      <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: 16, flexShrink: 0 }} />
                                    ) : (
                                      <i className={`fa-solid ${iconCls}`} style={{ color: iconColor, fontSize: 16, flexShrink: 0 }} />
                                    )}
                                    <span style={{ fontSize: 13, color: lesson.isCompleted ? '#10B981' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {lesson.title}
                                    </span>
                                    {(lesson.isPreview || lesson.isFreePreview) && (
                                      <span style={{ background: '#ECFDF5', color: '#10B981', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 10, flexShrink: 0 }}>Preview</span>
                                    )}
                                    {isQuiz && (
                                      <span style={{ background: '#FFFBEB', color: '#D97706', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 10, flexShrink: 0 }}>Quiz</span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    {isQuiz && c.isEnrolled && (
                                      <Link to={`${route.studentQuizQuestion}?lessonId=${lesson.id}`} style={{
                                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                                        background: 'rgba(245,158,11,0.1)', color: '#D97706',
                                        textDecoration: 'none', border: '1px solid rgba(245,158,11,0.2)',
                                      }}>Take Quiz</Link>
                                    )}
                                    {durMin > 0 && (
                                      <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 36, textAlign: 'right' }}>{durMin}min</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </Panel>
                        </Collapse>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INSTRUCTOR */}
            {activeTab === 'instructor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{
                  ...cardStyle,
                  background: 'linear-gradient(135deg,rgba(101,28,50,0.03) 0%,#fff 50%)',
                  border: '1px solid rgba(101,28,50,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      border: '3px solid rgba(197,145,62,0.25)',
                      boxShadow: '0 0 0 6px rgba(197,145,62,0.08)',
                    }}>
                      {(instructor?.avatarUrl || c.instructor?.avatarUrl) ? (
                        <img src={instrAvatar} alt={c.instructor?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#651C32,#8B2335)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, color: '#DEBB6B' }}>
                          {c.instructor?.fullName?.charAt(0) ?? 'I'}
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#2C1810', marginBottom: 4 }}>
                        {instructor?.fullName ?? c.instructor?.fullName}
                      </h4>
                      {c.instructor?.headline && (
                        <p style={{ color: '#9A8080', fontSize: 14, marginBottom: 16 }}>{c.instructor.headline}</p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 16 }}>
                        {[
                          { icon: 'fa-star',    color: '#F59E0B', val: (instructor?.averageRating ?? 0).toFixed(1), label: t('common.rating', 'Rating') },
                          { icon: 'fa-users',   color: '#3B82F6', val: (instructor?.totalStudents ?? 0).toLocaleString(), label: t('common.students', 'students') },
                          { icon: 'fa-book',    color: '#10B981', val: instructor?.totalCourses ?? 0, label: t('nav.courses', 'Courses') },
                          { icon: 'fa-comment', color: '#8B5CF6', val: instructor?.totalReviews ?? 0, label: t('common.reviews', 'reviews') },
                        ].map((s) => (
                          <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 13 }} />
                              <strong style={{ color: '#2C1810', fontSize: 16 }}>{s.val}</strong>
                            </div>
                            <div style={{ color: '#9A8080', fontSize: 11 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {Object.keys(socialLinks).length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {Object.entries(socialLinks).map(([platform, url]) => {
                            if (!url) return null;
                            const icons: Record<string, string>  = { facebook: 'fa-facebook', twitter: 'fa-twitter', linkedin: 'fa-linkedin', youtube: 'fa-youtube', instagram: 'fa-instagram', website: 'fa-globe' };
                            const colors: Record<string, string> = { facebook: '#1877F2', twitter: '#1DA1F2', linkedin: '#0A66C2', youtube: '#FF0000', instagram: '#E1306C', website: '#651C32' };
                            return (
                              <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: `${colors[platform] ?? '#6B7280'}12`,
                                  color: colors[platform] ?? '#6B7280',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  textDecoration: 'none', fontSize: 15,
                                  border: `1px solid ${colors[platform] ?? '#6B7280'}25`,
                                }}>
                                <i className={`fa-brands ${icons[platform] ?? 'fa-link'}`} />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {instructor?.bio && (
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(197,145,62,0.1)' }}>
                      <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.85, margin: 0 }}>{instructor.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {c.ratingCount > 0 && (
                  <div style={{ ...cardStyle, background: 'linear-gradient(135deg,rgba(197,145,62,0.04) 0%,#fff 60%)', border: '1px solid rgba(197,145,62,0.12)' }}>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', minWidth: 90 }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 60, fontWeight: 800, color: '#2C1810', lineHeight: 1 }}>
                          {c.ratingAverage.toFixed(1)}
                        </div>
                        <Rate disabled value={c.ratingAverage} allowHalf style={{ fontSize: 15, color: '#C5973E' }} />
                        <div style={{ fontSize: 12, color: '#9A8080', marginTop: 6 }}>{t('courses.details.rating', 'Rating')}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        {ratingDist.map((d) => (
                          <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#7A6060', width: 8, textAlign: 'right' }}>{d.star}</span>
                            <i className="fa-solid fa-star" style={{ fontSize: 11, color: '#C5973E' }} />
                            <StarBar pct={d.pct} />
                            <span style={{ fontSize: 11, color: '#9ca3af', width: 32, textAlign: 'right' }}>{d.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {c.isEnrolled && (
                  <div style={cardStyle}>
                    <SectionTitle>{userReview ? t('courseDetails.updateReview', 'Update Your Review') : t('courseDetails.writeReview', 'Write a Review')}</SectionTitle>
                    <div style={{ marginBottom: 14 }}>
                      <Rate value={reviewRating} onChange={setReviewRating} style={{ fontSize: 26, color: '#C5973E' }} />
                    </div>
                    <textarea
                      rows={4} value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t('courseDetails.reviewPlaceholder', 'Share your experience with this course...')}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
                        border: '1.5px solid rgba(197,145,44,0.18)', outline: 'none',
                        resize: 'vertical', background: '#FAFAF8', color: '#374151', lineHeight: 1.7,
                        fontFamily: 'inherit',
                      }}
                    />
                    <button onClick={handleSubmitReview} disabled={submittingRev || reviewRating === 0}
                      style={{
                        marginTop: 12, padding: '10px 28px', borderRadius: 10, border: 'none',
                        background: reviewRating === 0 ? 'rgba(107,29,42,0.08)' : 'linear-gradient(135deg,#651C32,#8B2335)',
                        color: reviewRating === 0 ? '#9ca3af' : '#fff',
                        fontWeight: 700, fontSize: 14, cursor: reviewRating === 0 ? 'not-allowed' : 'pointer',
                        boxShadow: reviewRating > 0 ? '0 4px 14px rgba(101,28,50,0.25)' : 'none',
                      }}>
                      {submittingRev ? <Spin size="small" /> : userReview ? t('courseDetails.updateReview', 'Update Review') : t('student.reviews.submitReview', 'Submit Review')}
                    </button>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
                    <i className="fa-regular fa-star" style={{ fontSize: 44, display: 'block', marginBottom: 14, opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>{t('courseDetails.noReviews', 'No reviews yet.')} {c.isEnrolled ? t('courseDetails.beFirstReview', 'Be the first to review!') : t('courseDetails.enrollToReview', 'Enroll to write a review.')}</p>
                  </div>
                ) : (
                  <div style={cardStyle}>
                    {reviews.map((rev, idx) => (
                      <div key={rev.id} style={{
                        display: 'flex', gap: 16, padding: '18px 0',
                        borderBottom: idx < reviews.length - 1 ? '1px solid rgba(197,145,44,0.08)' : 'none',
                      }}>
                        <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(197,145,62,0.15)' }}>
                          {rev.user?.avatarUrl ? (
                            <img src={getFileUrl(rev.user.avatarUrl) ?? rev.user.avatarUrl} alt={rev.user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(101,28,50,0.08),rgba(101,28,50,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#651C32', fontSize: 18 }}>
                              {rev.user?.fullName?.charAt(0) ?? '?'}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <strong style={{ fontSize: 14, color: '#2C1810' }}>{rev.user?.fullName}</strong>
                            {rev.isOwner && (
                              <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(101,28,50,0.08)', color: '#651C32', padding: '1px 8px', borderRadius: 10 }}>You</span>
                            )}
                            <Rate disabled value={rev.rating} style={{ fontSize: 12, color: '#C5973E' }} />
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(rev.createdAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.75 }}>{rev.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Sticky sidebar */}
          <div style={{ minWidth: 0 }}>
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{
                background: '#fff', borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 12px 60px rgba(78,20,32,0.12)',
                border: '1px solid rgba(197,145,44,0.12)',
              }}>

                {/* Price / status header */}
                <div style={{
                  padding: '24px 22px 20px',
                  borderBottom: '1px solid rgba(197,145,44,0.08)',
                  background: c.isEnrolled
                    ? 'linear-gradient(145deg,#064e3b 0%,#065f46 60%,#047857 100%)'
                    : isInstructor
                    ? 'linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 100%)'
                    : isAdmin
                    ? 'linear-gradient(145deg,#3b0a15 0%,#651C32 100%)'
                    : 'linear-gradient(145deg,rgba(197,145,62,0.06),rgba(197,145,62,0.01))',
                }}>
                  {c.isEnrolled ? (
                    <div>
                      {/* Enrolled badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(255,255,255,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 0 0 6px rgba(255,255,255,0.07)',
                        }}>
                          <i className="fa-solid fa-graduation-cap" style={{ color: '#fff', fontSize: 18 }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: 15, lineHeight: 1.2 }}>{t('courses.details.enrolled', 'You are Enrolled')}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{t('courseDetails.accessAllContent', 'Access to all course content')}</div>
                        </div>
                      </div>

                      {/* Progress */}
                      {typeof c.enrollmentProgress === 'number' && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t('courses.details.progress', 'Progress')}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{c.enrollmentProgress}%</span>
                          </div>
                          <div style={{ height: 7, borderRadius: 6, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${c.enrollmentProgress}%`, height: '100%',
                              background: c.enrollmentProgress >= 100
                                ? 'linear-gradient(90deg,#34D399,#6EE7B7)'
                                : 'linear-gradient(90deg,#A7F3D0,#34D399)',
                              borderRadius: 6,
                              transition: 'width 0.6s ease',
                            }} />
                          </div>
                          {c.enrollmentProgress >= 100 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                              <i className="fa-solid fa-check-circle" style={{ color: '#34D399', fontSize: 11 }} />
                              <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>{t('courses.details.courseCompleted', 'Course Completed!')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : isInstructor ? (
                    <div>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <i className="fa-solid fa-chalkboard-teacher" style={{ fontSize: 24, color: '#3B82F6' }} />
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#1D4ED8' }}>Instructor View</div>
                      <p style={{ fontSize: 12, color: '#9A8080', margin: '6px 0 0' }}>You can preview this course</p>
                    </div>
                  ) : isAdmin ? (
                    <div>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(101,28,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <i className="fa-solid fa-shield-halved" style={{ fontSize: 24, color: '#651C32' }} />
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#651C32' }}>Admin Access</div>
                      <p style={{ fontSize: 12, color: '#9A8080', margin: '6px 0 0' }}>Full access — no payment required</p>
                    </div>
                  ) : isPlan ? (
                    hasActiveSub ? (
                      <div>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(197,145,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                          <i className="fa-solid fa-crown" style={{ fontSize: 24, color: '#C5973E' }} />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#C5973E' }}>Included in your Plan</div>
                        <p style={{ fontSize: 12, color: '#9A8080', margin: '6px 0 0' }}>Access with your active subscription</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(107,29,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                          <i className="fa-solid fa-lock" style={{ fontSize: 24, color: '#9ca3af' }} />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>Subscription Required</div>
                        <p style={{ fontSize: 12, color: '#9A8080', margin: '6px 0 0' }}>Subscribe to access all Plan courses</p>
                      </div>
                    )
                  ) : isMasterclass ? (
                    !c.requiresPurchase ? (
                      <div>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 800, color: '#10B981' }}>Free</span>
                        <div style={{ fontSize: 12, color: '#9A8080', marginTop: 4 }}>No payment required</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
                          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 800, color: '#2C1810' }}>{c.price}</span>
                          <span style={{ fontSize: 16, fontWeight: 600, color: '#9A8080' }}>MAD</span>
                          {hasDiscount && (
                            <del style={{ fontSize: 16, color: '#c4b5b5' }}>{c.originalPrice} MAD</del>
                          )}
                        </div>
                        {hasDiscount && (
                          <span style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(220,38,38,0.15)' }}>
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                    )
                  ) : (
                    !c.requiresPurchase
                      ? <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 800, color: '#10B981' }}>Free</span>
                      : <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 800, color: '#2C1810' }}>{c.price} MAD</span>
                  )}
                </div>

                {/* CTA buttons */}
                <div style={{ padding: '16px 18px' }}>
                  {c.isEnrolled ? (
                    <Link to={`${route.courseWatch}/${c.slug}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      width: '100%', padding: '13px 16px', borderRadius: 12, fontWeight: 800, fontSize: 14,
                      background: 'linear-gradient(135deg,#047857,#059669)', color: '#fff', textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(4,120,87,0.35)', marginBottom: 10,
                      boxSizing: 'border-box',
                    }}>
                      <i className="fa-solid fa-play" style={{ fontSize: 13 }} />
                      <span>{t('courses.details.continueLearning', 'Continue Learning')}</span>
                    </Link>
                  ) : isInstructor ? (
                    /* Instructors: preview only — no enrollment */
                    <Link to={`${route.courseWatch}/${c.slug}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      width: '100%', padding: '13px 16px', borderRadius: 12, fontWeight: 800, fontSize: 14, boxSizing: 'border-box' as const,
                      background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', color: '#fff', textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(29,78,216,0.28)', marginBottom: 10,
                    }}>
                      <i className="fa-solid fa-eye" />Preview Course
                    </Link>
                  ) : isAdmin ? (
                    <button onClick={handleEnroll} disabled={enrolling} style={{
                      width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                      fontWeight: 800, fontSize: 15, cursor: enrolling ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg,#651C32,#8B2335)', color: '#fff',
                      boxShadow: '0 6px 20px rgba(101,28,50,0.28)', marginBottom: 10,
                      opacity: enrolling ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      {enrolling ? <Spin size="small" /> : <i className="fa-solid fa-shield-halved" />}
                      {enrolling ? 'Opening...' : 'Access Course'}
                    </button>
                  ) : isPlan ? (
                    hasActiveSub ? (
                      <button onClick={handleEnroll} disabled={enrolling} style={{
                        width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                        fontWeight: 800, fontSize: 15, cursor: enrolling ? 'not-allowed' : 'pointer',
                        background: 'linear-gradient(135deg,#C5912C,#A67825)', color: '#fff',
                        boxShadow: '0 6px 20px rgba(197,145,44,0.3)', marginBottom: 10,
                        opacity: enrolling ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        {enrolling ? <Spin size="small" /> : <i className="fa-solid fa-graduation-cap" />}
                        {enrolling ? 'Enrolling...' : 'Start Learning'}
                      </button>
                    ) : (
                      <React.Fragment>
                        {!isAuthenticated ? (
                          <Link to={route.login} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '13px 16px', borderRadius: 12, fontWeight: 800, fontSize: 14, boxSizing: 'border-box' as const,
                            background: 'linear-gradient(135deg,#651C32,#8B2335)', color: '#fff', textDecoration: 'none',
                            boxShadow: '0 6px 20px rgba(101,28,50,0.28)', marginBottom: 10,
                          }}>
                            <i className="fa-solid fa-right-to-bracket" />Login to Enroll
                          </Link>
                        ) : (
                          <Link to={route.pricingPlan} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '13px 16px', borderRadius: 12, fontWeight: 800, fontSize: 14, boxSizing: 'border-box' as const,
                            background: 'linear-gradient(135deg,#C5912C,#A67825)', color: '#fff', textDecoration: 'none',
                            boxShadow: '0 6px 20px rgba(197,145,44,0.3)', marginBottom: 10,
                          }}>
                            <i className="fa-solid fa-crown" />Subscribe to Access
                          </Link>
                        )}
                        <p style={{ fontSize: 11, color: '#9A8080', textAlign: 'center', margin: '0 0 10px' }}>
                          Included in the subscription plan
                        </p>
                      </React.Fragment>
                    )
                  ) : (
                    <React.Fragment>
                      {!isAuthenticated ? (
                        <Link to={route.login} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          width: '100%', padding: '13px 16px', borderRadius: 12, fontWeight: 800, fontSize: 14, boxSizing: 'border-box' as const,
                          background: 'linear-gradient(135deg,#651C32,#8B2335)', color: '#fff', textDecoration: 'none',
                          boxShadow: '0 6px 20px rgba(101,28,50,0.28)', marginBottom: 10,
                        }}>
                          <i className="fa-solid fa-right-to-bracket" />Login to Enroll
                        </Link>
                      ) : (
                        <button onClick={handleEnroll} disabled={enrolling} style={{
                          width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                          fontWeight: 800, fontSize: 15, cursor: enrolling ? 'not-allowed' : 'pointer',
                          background: 'linear-gradient(135deg,#651C32,#8B2335)', color: '#fff',
                          boxShadow: '0 6px 20px rgba(101,28,50,0.28)', marginBottom: 10,
                          opacity: enrolling ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          {enrolling ? <Spin size="small" /> : <i className="fa-solid fa-graduation-cap" />}
                          {enrolling ? t('common.loading', 'Loading...') : !c.requiresPurchase ? t('home.featured.enrolFree', 'Enrol Free') : t('courses.details.enroll', 'Enroll Now')}
                        </button>
                      )}
                      {c.requiresPurchase && isAuthenticated && (
                        <button onClick={handleAddToCart} disabled={inCart} style={{
                          width: '100%', padding: '11px 16px', borderRadius: 12, boxSizing: 'border-box' as const,
                          border: `1.5px solid ${inCart ? 'rgba(16,185,129,0.25)' : 'rgba(101,28,50,0.15)'}`,
                          fontWeight: 700, fontSize: 14, cursor: inCart ? 'default' : 'pointer',
                          background: inCart ? 'rgba(16,185,129,0.05)' : 'rgba(101,28,50,0.03)',
                          color: inCart ? '#10B981' : '#651C32', marginBottom: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          {inCart
                            ? <React.Fragment><i className="fa-solid fa-check" />{t('courseDetails.inCart', 'In Cart')}</React.Fragment>
                            : <React.Fragment><i className="isax isax-shopping-cart" />{t('courses.details.addToCart', 'Add to Cart')}</React.Fragment>}
                        </button>
                      )}
                    </React.Fragment>
                  )}

                  {/* Wishlist — not shown for instructors */}
                  {!isInstructor && (
                    <button onClick={handleWishlist} disabled={wishlistBusy} style={{
                      width: '100%', padding: '11px 16px', borderRadius: 12,
                      border: `1.5px solid ${c.isWishlisted ? 'rgba(239,68,68,0.25)' : 'rgba(197,145,44,0.15)'}`,
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      background: c.isWishlisted ? 'rgba(239,68,68,0.04)' : 'transparent',
                      color: c.isWishlisted ? '#EF4444' : '#7A6060',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxSizing: 'border-box',
                    }}>
                      <i className={`fa-${c.isWishlisted ? 'solid' : 'regular'} fa-heart`} />
                      <span>{c.isWishlisted ? t('courses.details.removeFromWishlist', 'Remove from Wishlist') : t('courses.details.addToWishlist', 'Add to Wishlist')}</span>
                    </button>
                  )}
                </div>

                {/* Course includes */}
                <div style={{ padding: '0 18px 20px' }}>
                  <div style={{ height: 1, background: 'rgba(197,145,44,0.08)', marginBottom: 20 }} />
                  <h6 style={{ fontWeight: 800, color: '#2C1810', marginBottom: 14, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t('courses.details.courseIncludes', 'This course includes')}
                  </h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { icon: 'fa-video',          color: '#3B82F6', text: `${fmtDuration(c.durationMinutes)} on-demand video` },
                      { icon: 'fa-file-lines',     color: '#6B7280', text: `${totalLessons} lessons · ${curriculum.length} modules` },
                      ...(quizLessons > 0 ? [{ icon: 'fa-circle-question', color: '#F59E0B', text: `${quizLessons} quiz${quizLessons > 1 ? 'zes' : ''}` }] : []),
                      { icon: 'fa-signal',         color: '#8B5CF6', text: levelLabel(c.level) },
                      { icon: 'fa-globe',          color: '#10B981', text: c.language ?? 'English' },
                      { icon: 'fa-infinity',       color: '#C5973E', text: t('courses.details.fullLifetimeAccess', 'Full lifetime access') },
                      { icon: 'fa-mobile-screen',  color: '#651C32', text: t('courses.details.accessOnMobile', 'Access on mobile and desktop') },
                      { icon: 'fa-certificate',    color: '#C5973E', text: t('courses.details.certificate', 'Certificate of completion') },
                    ].map((item) => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4b5563' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: 13 }} />
                        </div>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {c.tags?.trim() && (
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(197,145,44,0.08)' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#9A8080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t('courseDetails.tags', 'Tags')}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {c.tags!.split(',').filter((tag) => tag.trim()).map((tag, i) => (
                          <span key={i} style={{
                            background: 'rgba(101,28,50,0.05)', color: '#651C32',
                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                            border: '1px solid rgba(101,28,50,0.1)',
                          }}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(197,145,44,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('common.share', 'Share')}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      {[
                        { icon: 'fa-facebook', color: '#1877F2', href: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                        { icon: 'fa-twitter',  color: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(c.title)}` },
                        { icon: 'fa-linkedin', color: '#0A66C2', href: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                      ].map((s) => (
                        <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer"
                          style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: `${s.color}12`, color: s.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            textDecoration: 'none', fontSize: 15,
                            border: `1px solid ${s.color}25`,
                          }}>
                          <i className={`fa-brands ${s.icon}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

/* Sub-components */
const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 28,
  boxShadow: '0 2px 20px rgba(78,20,32,0.06)',
  border: '1px solid rgba(197,145,44,0.1)',
  overflow: 'hidden',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
};

const SectionTitle: React.FC<{ children: React.ReactNode; accent?: boolean; noMargin?: boolean }> = ({ children, accent, noMargin }) => (
  <h3 style={{
    fontFamily: "'Playfair Display',serif",
    fontSize: 18, fontWeight: 800,
    color: accent ? '#C5973E' : '#2C1810',
    marginBottom: noMargin ? 0 : 16,
    paddingBottom: noMargin ? 0 : 12,
    borderBottom: noMargin ? 'none' : '1px solid rgba(197,145,44,0.1)',
  }}>
    {children}
  </h3>
);

export default CourseDetails;
