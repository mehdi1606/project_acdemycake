import React, { useState, useEffect, useCallback } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link, useParams, useNavigate } from 'react-router-dom';
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

/* ─── helpers ─── */
function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}

function fmtSecDuration(secs: number) {
  return fmtDuration(Math.floor(secs / 60));
}

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

/* ─── star bar ─── */
const StarBar = ({ count, total, pct }: { count: number; total: number; pct: number }) => (
  <div className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 13 }}>
    <div style={{
      flex: 1, height: 8, borderRadius: 4,
      background: 'rgba(107,29,42,0.08)', overflow: 'hidden',
    }}>
      <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: 4 }} />
    </div>
    <span style={{ width: 30, textAlign: 'right', color: '#6b7280' }}>{pct}%</span>
    <span style={{ width: 28, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>({count})</span>
  </div>
);

/* ════════════════════════════════════════════ */
const CourseDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const { items: cartItems }       = useAppSelector((s) => s.cart);
  const { message }                = App.useApp();

  /* ─── state ─── */
  const [course,       setCourse]       = useState<Course | null>(null);
  const [curriculum,   setCurriculum]   = useState<CourseModule[]>([]);
  const [reviews,      setReviews]      = useState<CourseReview[]>([]);
  const [instructor,   setInstructor]   = useState<PublicInstructorProfile | null>(null);

  const [loading,      setLoading]      = useState(true);
  const [enrolling,    setEnrolling]    = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [activeTab,    setActiveTab]    = useState<'overview'|'curriculum'|'instructor'|'reviews'>('overview');

  /* review form */
  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);
  const [userReview,    setUserReview]    = useState<CourseReview | null>(null);

  /* ─── load data ─── */
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        // Step 1: fetch course by slug
        const courseData = await courseService.getCourseBySlug(slug);
        if (cancelled) return;
        setCourse(courseData);

        // Step 2: fetch curriculum + reviews in parallel
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

        // Detect own review
        const own = (revResp.content ?? []).find((r) => r.isOwner);
        if (own) {
          setUserReview(own);
          setReviewRating(own.rating);
          setReviewComment(own.comment);
        }

        // Step 3: instructor profile (non-blocking)
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

  /* ─── enroll ─── */
  const handleEnroll = useCallback(async () => {
    if (!isAuthenticated) {
      message.warning('Please login to enroll in this course');
      navigate(route.login);
      return;
    }
    if (!course) return;
    try {
      setEnrolling(true);
      await courseService.enrollInCourse(course.id);
      message.success('🎉 Successfully enrolled!');
      const updated = await courseService.getCourseBySlug(slug!);
      setCourse(updated);
    } catch (err: any) {
      const serverMsg: string = err?.response?.data?.message ?? '';
      if (serverMsg.toLowerCase().includes('already enrolled')) {
        message.info('You are already enrolled');
        navigate(`${route.courseWatch}/${course.slug}`);
      } else {
        message.error('Failed to enroll. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  }, [isAuthenticated, course, slug, message, navigate]);

  /* ─── wishlist ─── */
  const handleWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      message.warning('Please login to use wishlist');
      navigate(route.login);
      return;
    }
    if (!course || wishlistBusy) return;
    try {
      setWishlistBusy(true);
      if (course.isWishlisted) {
        await dispatch(removeFromWishlist(course.id)).unwrap();
        message.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(course.id)).unwrap();
        message.success('Added to wishlist ♡');
      }
      const updated = await courseService.getCourseBySlug(slug!);
      setCourse(updated);
    } catch {
      message.error('Failed to update wishlist');
    } finally {
      setWishlistBusy(false);
    }
  }, [isAuthenticated, course, wishlistBusy, slug, dispatch, message, navigate]);

  /* ─── add to cart ─── */
  const handleAddToCart = useCallback(() => {
    if (!course) return;
    if (cartItems.some((i) => i.id === course.id)) {
      message.info('Already in cart');
      return;
    }
    dispatch(addToCart({
      id: course.id, slug: course.slug, title: course.title,
      thumbnailUrl: course.thumbnailUrl,
      price: course.price ?? 0,
      originalPrice: course.originalPrice,
      instructorName: course.instructor?.fullName,
      instructorId: course.instructor?.id,
      instructorAvatar: course.instructor?.avatarUrl,
      rating: course.ratingAverage,
      ratingCount: course.ratingCount,
      level: course.level,
    }));
    message.success(`"${course.title}" added to cart`);
  }, [course, cartItems, dispatch, message]);

  /* ─── submit review ─── */
  const handleSubmitReview = useCallback(async () => {
    if (!isAuthenticated) { navigate(route.login); return; }
    if (!course || reviewRating === 0) { message.warning('Please select a rating'); return; }
    if (!reviewComment.trim()) { message.warning('Please write a comment'); return; }
    try {
      setSubmittingRev(true);
      const req: CreateReviewRequest = { rating: reviewRating, comment: reviewComment.trim() };
      if (userReview) {
        await courseService.updateReview(course.id, String(userReview.id), req);
        message.success('Review updated!');
      } else {
        await courseService.createReview(course.id, req);
        message.success('Review submitted! Thank you.');
      }
      const rev2 = await courseService.getCourseReviews(course.id, 0, 10);
      setReviews(rev2.content ?? []);
      const own = (rev2.content ?? []).find((r) => r.isOwner);
      if (own) setUserReview(own);
    } catch {
      message.error('Failed to submit review');
    } finally {
      setSubmittingRev(false);
    }
  }, [isAuthenticated, course, reviewRating, reviewComment, userReview, message, navigate]);

  /* ─── derived ─── */
  const thumb        = getFileUrl(course?.thumbnailUrl) ?? 'assets/img/course/course-01.jpg';
  const instrAvatar  = getFileUrl(course?.instructor?.avatarUrl ?? instructor?.avatarUrl) ?? 'assets/img/user/user-01.jpg';
  const inCart       = cartItems.some((i) => i.id === course?.id);

  const totalLessons = curriculum.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
  const quizLessons  = curriculum.reduce((s, m) => s + (m.lessons?.filter((l) => l.contentType === 'QUIZ').length ?? 0), 0);
  const totalDurSec  = curriculum.reduce((s, m) => s + (m.totalDurationSeconds ?? 0), 0);

  const socialLinks  = parseSocialLinks(instructor?.socialLinks);

  /* rating distribution (approximate) */
  const ratingDist = course
    ? [5, 4, 3, 2, 1].map((star) => {
        const pct = star === Math.round(course.ratingAverage)
          ? Math.min(100, Math.round((course.ratingCount * 0.6)))
          : star === Math.round(course.ratingAverage) - 1
          ? 30 : star === Math.round(course.ratingAverage) + 1 ? 15 : 5;
        return { star, count: Math.round(course.ratingCount * pct / 100), pct };
      })
    : [];

  /* ─── loading / not found ─── */
  if (loading) return (
    <>
      <Breadcrumb title="Course Detail" />
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    </>
  );

  if (!course) return (
    <>
      <Breadcrumb title="Course Not Found" />
      <div className="container py-5 text-center">
        <i className="isax isax-book" style={{ fontSize: 64, color: 'rgba(107,29,42,0.2)', display: 'block', marginBottom: 16 }} />
        <h3>Course Not Found</h3>
        <p className="text-muted">This course doesn't exist or has been removed.</p>
        <Link to={route.courseGrid} className="btn btn-primary mt-2">Browse Courses</Link>
      </div>
    </>
  );

  const hasDiscount    = course.originalPrice && course.price && course.originalPrice > course.price;
  const discountPct    = hasDiscount ? Math.round(((course.originalPrice! - course.price!) / course.originalPrice!) * 100) : 0;

  /* ════════════ RENDER ════════════ */
  return (
    <>
      <Breadcrumb title="Course Detail" />

      {/* ── Hero Banner ── */}
      <div style={{ background: 'linear-gradient(135deg,#1a0a0f 0%,#2d1018 60%,#3a1420 100%)', padding: '40px 0 32px' }}>
        <div className="container">
          <div className="row align-items-center g-4">
            {/* Thumbnail */}
            <div className="col-lg-5">
              <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                <img src={thumb} alt={course.title} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/course/course-01.jpg'; }} />
                {course.previewVideoUrl && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}>
                      <i className="fa-solid fa-play" style={{ fontSize: 22, color: '#6B1D2A', marginLeft: 4 }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="col-lg-7">
              {/* Category + Level */}
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                {course.category?.name && (
                  <span style={{ background: 'rgba(197,151,62,0.2)', color: '#C5973E', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                    {course.category.name}
                  </span>
                )}
                <span style={{ background: 'rgba(255,255,255,0.1)', color: '#e5d3b3', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20 }}>
                  {levelLabel(course.level)}
                </span>
                {!course.requiresPurchase && (
                  <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                    FREE
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 12 }}>{course.title}</h1>
              <p style={{ color: '#c4a882', fontSize: 15, marginBottom: 16 }}>{course.shortDescription}</p>

              {/* Stats row */}
              <div className="d-flex align-items-center gap-4 flex-wrap mb-3" style={{ color: '#d4bfa0', fontSize: 13 }}>
                <span><img src="./assets/img/icons/book.svg" alt="" style={{ width: 16, marginRight: 6, opacity: 0.8 }} />{totalLessons}+ Lessons</span>
                <span><img src="./assets/img/icons/timer-start.svg" alt="" style={{ width: 16, marginRight: 6, opacity: 0.8 }} />{fmtDuration(course.durationMinutes)}</span>
                <span><img src="./assets/img/icons/people.svg" alt="" style={{ width: 16, marginRight: 6, opacity: 0.8 }} />{course.enrolledCount?.toLocaleString()} enrolled</span>
                {quizLessons > 0 && <span><i className="fa-solid fa-question-circle" style={{ marginRight: 6, color: '#F59E0B' }} />{quizLessons} Quiz{quizLessons > 1 ? 'zes' : ''}</span>}
              </div>

              {/* Rating */}
              <div className="d-flex align-items-center gap-2 mb-3">
                <Rate disabled value={course.ratingAverage} allowHalf style={{ fontSize: 16, color: '#F59E0B' }} />
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 15 }}>{course.ratingAverage?.toFixed(1)}</span>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>({course.ratingCount} reviews)</span>
              </div>

              {/* Instructor row */}
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(197,151,62,0.4)' }}>
                  {course.instructor?.avatarUrl ? (
                    <img src={instrAvatar} alt={course.instructor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#6B1D2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                      {course.instructor?.fullName?.charAt(0) ?? 'I'}
                    </div>
                  )}
                </div>
                <div>
                  <span style={{ color: '#d4bfa0', fontSize: 12 }}>Created by </span>
                  <button
                    onClick={() => setActiveTab('instructor')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#C5973E', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {course.instructor?.fullName}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <section style={{ padding: '40px 0' }}>
        <div className="container">
          <div className="row g-4">

            {/* LEFT: tabs */}
            <div className="col-lg-8">

              {/* Tab nav */}
              <div style={{
                display: 'flex', gap: 0, borderBottom: '2px solid rgba(107,29,42,0.1)', marginBottom: 28,
              }}>
                {(['overview','curriculum','instructor','reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none', border: 'none', padding: '10px 20px',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      color: activeTab === tab ? '#6B1D2A' : '#6b7280',
                      borderBottom: activeTab === tab ? '2px solid #6B1D2A' : '2px solid transparent',
                      marginBottom: -2, textTransform: 'capitalize',
                      transition: 'color 0.2s',
                    }}
                  >
                    {tab}
                    {tab === 'reviews' && course.ratingCount > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(107,29,42,0.08)', padding: '1px 7px', borderRadius: 10, color: '#6B1D2A' }}>
                        {course.ratingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ─── Overview tab ─── */}
              {activeTab === 'overview' && (
                <div>
                  {/* Description */}
                  <div style={{ marginBottom: 32 }}>
                    <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#2C1810' }}>Course Overview</h4>
                    <div style={{ color: '#4b5563', lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: course.description || course.shortDescription }} />
                  </div>

                  {/* What you'll learn */}
                  {course.whatYouWillLearn?.trim() && (
                    <div style={{
                      background: 'rgba(107,29,42,0.02)', border: '1px solid rgba(107,29,42,0.08)',
                      borderRadius: 12, padding: 24, marginBottom: 24,
                    }}>
                      <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#2C1810' }}>What you'll learn</h4>
                      <div className="row g-2">
                        {course.whatYouWillLearn.split('\n').filter(o => o.trim()).map((obj, i) => (
                          <div key={i} className="col-md-6">
                            <div className="d-flex align-items-start gap-2">
                              <i className="fa-solid fa-check-circle" style={{ color: '#10B981', marginTop: 3, flexShrink: 0 }} />
                              <span style={{ fontSize: 14, color: '#374151' }}>{obj.trim()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {course.requirements?.trim() && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#2C1810' }}>Requirements</h4>
                      <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                        {course.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                          <li key={i} className="d-flex align-items-start gap-2 mb-2" style={{ color: '#4b5563', fontSize: 14 }}>
                            <i className="fa-solid fa-circle" style={{ fontSize: 6, color: '#6B1D2A', marginTop: 7, flexShrink: 0 }} />
                            {req.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Target audience */}
                  {course.targetAudience?.trim() && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#2C1810' }}>Who this course is for</h4>
                      <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                        {course.targetAudience.split('\n').filter(t => t.trim()).map((t, i) => (
                          <li key={i} className="d-flex align-items-start gap-2 mb-2" style={{ color: '#4b5563', fontSize: 14 }}>
                            <i className="fa-solid fa-user-check" style={{ color: '#3B82F6', marginTop: 2, flexShrink: 0 }} />
                            {t.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Curriculum tab ─── */}
              {activeTab === 'curriculum' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 style={{ fontSize: 20, fontWeight: 700, color: '#2C1810', margin: 0 }}>Course Curriculum</h4>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                      {curriculum.length} modules • {totalLessons} lessons • {fmtSecDuration(totalDurSec)}
                    </span>
                  </div>

                  {curriculum.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                      <i className="isax isax-book" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
                      <p>Curriculum will be available soon.</p>
                    </div>
                  ) : (
                    <Collapse accordion expandIconPosition="end" style={{ borderRadius: 10 }}>
                      {curriculum.map((mod, mi) => (
                        <Panel
                          key={mod.id}
                          header={
                            <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                              <div className="d-flex align-items-center gap-2">
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: 'rgba(107,29,42,0.08)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 700, color: '#6B1D2A', flexShrink: 0,
                                }}>
                                  {mi + 1}
                                </div>
                                <span style={{ fontWeight: 600, color: '#2C1810', fontSize: 14 }}>{mod.title}</span>
                              </div>
                              <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                {(mod.lessons?.length ?? 0)} lessons
                                {mod.totalDurationSeconds ? ` • ${fmtSecDuration(mod.totalDurationSeconds)}` : ''}
                              </span>
                            </div>
                          }
                        >
                          {(mod.lessons ?? []).length === 0 ? (
                            <p style={{ padding: '8px 16px', color: '#9ca3af', fontSize: 13 }}>No lessons yet</p>
                          ) : (mod.lessons ?? []).map((lesson, li) => {
                            const isQuiz    = lesson.contentType === 'QUIZ';
                            const isVideo   = lesson.contentType === 'VIDEO';
                            const iconCls   = isQuiz ? 'fa-question-circle' : isVideo ? 'fa-play-circle' : 'fa-file-alt';
                            const iconColor = isQuiz ? '#F59E0B' : isVideo ? '#3B82F6' : '#6B7280';
                            const durMin    = Math.floor((lesson.videoDurationSeconds ?? 0) / 60);

                            return (
                              <div key={lesson.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 16px', borderBottom: '1px solid rgba(107,29,42,0.04)',
                                transition: 'background 0.15s',
                              }}>
                                <div className="d-flex align-items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                                  {/* completion check */}
                                  {lesson.isCompleted ? (
                                    <i className="fa-solid fa-check-circle" style={{ color: '#10B981', fontSize: 16, flexShrink: 0 }} />
                                  ) : (
                                    <i className={`fa-solid ${iconCls}`} style={{ color: iconColor, fontSize: 16, flexShrink: 0 }} />
                                  )}
                                  <span style={{ fontSize: 13, color: lesson.isCompleted ? '#10B981' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {lesson.title}
                                  </span>
                                  {(lesson.isPreview || lesson.isFreePreview) && (
                                    <span style={{ background: '#ECFDF5', color: '#10B981', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, flexShrink: 0 }}>
                                      Preview
                                    </span>
                                  )}
                                  {isQuiz && (
                                    <span style={{ background: '#FFFBEB', color: '#F59E0B', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, flexShrink: 0 }}>
                                      Quiz
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
                                  {isQuiz && course.isEnrolled && (
                                    <Link
                                      to={`${route.studentQuizQuestion}?lessonId=${lesson.id}`}
                                      style={{
                                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                                        background: 'rgba(245,158,11,0.1)', color: '#D97706',
                                        textDecoration: 'none', border: '1px solid rgba(245,158,11,0.2)',
                                      }}
                                    >
                                      Take Quiz
                                    </Link>
                                  )}
                                  {durMin > 0 && (
                                    <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 36, textAlign: 'right' }}>
                                      {durMin}min
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </Panel>
                      ))}
                    </Collapse>
                  )}
                </div>
              )}

              {/* ─── Instructor tab ─── */}
              {activeTab === 'instructor' && (
                <div>
                  <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#2C1810' }}>About the Instructor</h4>

                  {/* Profile card */}
                  <div style={{
                    background: 'rgba(107,29,42,0.02)', border: '1px solid rgba(107,29,42,0.08)',
                    borderRadius: 16, padding: 28, marginBottom: 24,
                  }}>
                    <div className="d-flex align-items-start gap-4 flex-wrap">
                      {/* Avatar */}
                      <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '3px solid rgba(107,29,42,0.12)' }}>
                        {(instructor?.avatarUrl || course.instructor?.avatarUrl) ? (
                          <img src={instrAvatar} alt={course.instructor?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#6B1D2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: '#fff' }}>
                            {course.instructor?.fullName?.charAt(0) ?? 'I'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <h5 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#2C1810' }}>
                          {instructor?.fullName ?? course.instructor?.fullName}
                        </h5>
                        {course.instructor?.headline && (
                          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>{course.instructor.headline}</p>
                        )}

                        {/* Stats */}
                        <div className="d-flex flex-wrap gap-4 mb-12" style={{ marginBottom: 16 }}>
                          {[
                            { icon: 'fa-star', color: '#F59E0B', val: (instructor?.averageRating ?? course.instructor?.averageRating ?? 0).toFixed(1), label: 'Rating' },
                            { icon: 'fa-users', color: '#3B82F6', val: (instructor?.totalStudents ?? course.instructor?.totalStudents ?? 0).toLocaleString(), label: 'Students' },
                            { icon: 'fa-book', color: '#10B981', val: instructor?.totalCourses ?? 0, label: 'Courses' },
                            { icon: 'fa-comment', color: '#8B5CF6', val: instructor?.totalReviews ?? course.ratingCount ?? 0, label: 'Reviews' },
                          ].map((s) => (
                            <div key={s.label} className="d-flex align-items-center gap-1" style={{ fontSize: 14 }}>
                              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 14 }} />
                              <strong style={{ color: '#2C1810' }}>{s.val}</strong>
                              <span style={{ color: '#9ca3af' }}>{s.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Social links */}
                        {Object.keys(socialLinks).length > 0 && (
                          <div className="d-flex gap-2 flex-wrap">
                            {Object.entries(socialLinks).map(([platform, url]) => {
                              if (!url) return null;
                              const icons: Record<string, string> = {
                                facebook: 'fa-facebook', twitter: 'fa-twitter', linkedin: 'fa-linkedin',
                                youtube: 'fa-youtube', instagram: 'fa-instagram', website: 'fa-globe',
                              };
                              const colors: Record<string, string> = {
                                facebook: '#1877F2', twitter: '#1DA1F2', linkedin: '#0A66C2',
                                youtube: '#FF0000', instagram: '#E1306C', website: '#6B1D2A',
                              };
                              return (
                                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: `${colors[platform] ?? '#6B7280'}15`,
                                    color: colors[platform] ?? '#6B7280',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    textDecoration: 'none', fontSize: 14,
                                    border: `1px solid ${colors[platform] ?? '#6B7280'}30`,
                                  }}
                                >
                                  <i className={`fa-brands ${icons[platform] ?? 'fa-link'}`} />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {(instructor?.bio) && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(107,29,42,0.06)' }}>
                        <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.8, margin: 0 }}>{instructor.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Reviews tab ─── */}
              {activeTab === 'reviews' && (
                <div>
                  <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#2C1810' }}>Student Reviews</h4>

                  {/* Rating summary */}
                  {course.ratingCount > 0 && (
                    <div style={{
                      display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28,
                      background: 'rgba(107,29,42,0.02)', border: '1px solid rgba(107,29,42,0.08)',
                      borderRadius: 12, padding: 24, flexWrap: 'wrap',
                    }}>
                      <div style={{ textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontSize: 52, fontWeight: 800, color: '#2C1810', lineHeight: 1 }}>{course.ratingAverage.toFixed(1)}</div>
                        <Rate disabled value={course.ratingAverage} allowHalf style={{ fontSize: 14, color: '#F59E0B' }} />
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Course Rating</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        {ratingDist.map((d) => (
                          <div key={d.star} className="d-flex align-items-center gap-2" style={{ marginBottom: 4 }}>
                            <span style={{ width: 10, textAlign: 'right', fontSize: 12, color: '#6b7280' }}>{d.star}</span>
                            <i className="fa-solid fa-star" style={{ fontSize: 11, color: '#F59E0B' }} />
                            <StarBar count={d.count} total={course.ratingCount} pct={d.pct} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Write review (enrolled only) */}
                  {course.isEnrolled && (
                    <div style={{
                      background: 'rgba(107,29,42,0.02)', border: '1px solid rgba(107,29,42,0.08)',
                      borderRadius: 12, padding: 20, marginBottom: 28,
                    }}>
                      <h6 style={{ fontWeight: 700, marginBottom: 12, color: '#2C1810' }}>
                        {userReview ? 'Update Your Review' : 'Write a Review'}
                      </h6>
                      <div className="mb-2">
                        <Rate value={reviewRating} onChange={setReviewRating} style={{ fontSize: 24, color: '#F59E0B' }} />
                      </div>
                      <textarea
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this course..."
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
                          border: '1.5px solid rgba(107,29,42,0.12)', outline: 'none',
                          resize: 'vertical', background: '#fff', color: '#374151',
                        }}
                      />
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingRev || reviewRating === 0}
                        style={{
                          marginTop: 10, padding: '8px 24px', borderRadius: 8, border: 'none',
                          background: reviewRating === 0 ? '#e5e7eb' : '#6B1D2A',
                          color: reviewRating === 0 ? '#9ca3af' : '#fff',
                          fontWeight: 700, fontSize: 14, cursor: reviewRating === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {submittingRev ? <Spin size="small" /> : userReview ? 'Update Review' : 'Submit Review'}
                      </button>
                    </div>
                  )}

                  {/* Review list */}
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                      <i className="fa-regular fa-star" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
                      <p>No reviews yet. {course.isEnrolled ? 'Be the first to review!' : 'Enroll to write a review.'}</p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} style={{
                        display: 'flex', gap: 14, padding: '16px 0',
                        borderBottom: '1px solid rgba(107,29,42,0.06)',
                      }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(107,29,42,0.08)' }}>
                          {rev.user?.avatarUrl ? (
                            <img src={getFileUrl(rev.user.avatarUrl) ?? rev.user.avatarUrl} alt={rev.user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6B1D2A', fontSize: 18 }}>
                              {rev.user?.fullName?.charAt(0) ?? '?'}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <strong style={{ fontSize: 14, color: '#2C1810' }}>{rev.user?.fullName}</strong>
                            {rev.isOwner && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(107,29,42,0.08)', color: '#6B1D2A', padding: '1px 7px', borderRadius: 10 }}>You</span>}
                            <Rate disabled value={rev.rating} style={{ fontSize: 12, color: '#F59E0B' }} />
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(rev.createdAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>{rev.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: sticky sidebar */}
            <div className="col-lg-4">
              <div style={{ position: 'sticky', top: 100 }}>
                <div style={{
                  border: '1px solid rgba(107,29,42,0.1)', borderRadius: 16,
                  overflow: 'hidden', boxShadow: '0 8px 40px rgba(107,29,42,0.1)',
                  background: '#fff',
                }}>
                  {/* Price header */}
                  <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid rgba(107,29,42,0.06)', textAlign: 'center' }}>
                    {course.isEnrolled ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                          <i className="fa-solid fa-check-circle" style={{ color: '#10B981', fontSize: 20 }} />
                          <span style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>You're Enrolled</span>
                        </div>
                        {typeof course.enrollmentProgress === 'number' && (
                          <div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(107,29,42,0.08)', marginBottom: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${course.enrollmentProgress}%`, height: '100%', background: '#10B981', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{course.enrollmentProgress}% complete</span>
                          </div>
                        )}
                      </div>
                    ) : !course.requiresPurchase ? (
                      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#10B981', margin: 0 }}>Free</h2>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
                          <span style={{ fontSize: 32, fontWeight: 800, color: '#2C1810' }}>${course.price}</span>
                          {hasDiscount && (
                            <del style={{ fontSize: 18, color: '#9ca3af' }}>${course.originalPrice}</del>
                          )}
                        </div>
                        {hasDiscount && (
                          <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 13, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA buttons */}
                  <div style={{ padding: '20px 24px 0' }}>
                    {course.isEnrolled ? (
                      <Link
                        to={`${route.courseWatch}/${course.slug}`}
                        style={{
                          display: 'block', width: '100%', textAlign: 'center',
                          padding: '13px 20px', borderRadius: 10, fontWeight: 700, fontSize: 15,
                          background: 'linear-gradient(135deg,#6B1D2A,#8B2335)',
                          color: '#fff', textDecoration: 'none', marginBottom: 10,
                          boxShadow: '0 4px 16px rgba(107,29,42,0.3)',
                        }}
                      >
                        <i className="fa-solid fa-play me-2" />
                        Continue Learning
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={handleEnroll}
                          disabled={enrolling}
                          style={{
                            width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
                            fontWeight: 700, fontSize: 15, cursor: enrolling ? 'not-allowed' : 'pointer',
                            background: 'linear-gradient(135deg,#6B1D2A,#8B2335)',
                            color: '#fff', marginBottom: 10,
                            boxShadow: '0 4px 16px rgba(107,29,42,0.25)',
                            opacity: enrolling ? 0.7 : 1,
                          }}
                        >
                          {enrolling ? <Spin size="small" style={{ marginRight: 8 }} /> : <i className="fa-solid fa-graduation-cap me-2" />}
                          {enrolling ? 'Enrolling…' : !isAuthenticated ? 'Login to Enroll' : !course.requiresPurchase ? 'Enroll Free' : 'Enroll Now'}
                        </button>

                        {/* Add to cart (paid only) */}
                        {course.requiresPurchase && (
                          <button
                            onClick={handleAddToCart}
                            disabled={inCart}
                            style={{
                              width: '100%', padding: '11px 20px', borderRadius: 10,
                              border: '2px solid rgba(107,29,42,0.2)',
                              fontWeight: 600, fontSize: 14, cursor: inCart ? 'default' : 'pointer',
                              background: inCart ? 'rgba(16,185,129,0.06)' : '#fff',
                              color: inCart ? '#10B981' : '#6B1D2A',
                              marginBottom: 10,
                            }}
                          >
                            {inCart ? (
                              <><i className="fa-solid fa-check me-2" />In Cart</>
                            ) : (
                              <><i className="isax isax-shopping-cart me-2" />Add to Cart</>
                            )}
                          </button>
                        )}
                      </>
                    )}

                    {/* Wishlist */}
                    <button
                      onClick={handleWishlist}
                      disabled={wishlistBusy}
                      style={{
                        width: '100%', padding: '10px 20px', borderRadius: 10,
                        border: `2px solid ${course.isWishlisted ? 'rgba(239,68,68,0.3)' : 'rgba(107,29,42,0.12)'}`,
                        fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        background: course.isWishlisted ? 'rgba(239,68,68,0.04)' : 'transparent',
                        color: course.isWishlisted ? '#EF4444' : '#6b7280',
                        marginBottom: 20,
                      }}
                    >
                      <i className={`fa-${course.isWishlisted ? 'solid' : 'regular'} fa-heart me-2`} />
                      {course.isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                    </button>
                  </div>

                  {/* Course includes */}
                  <div style={{ padding: '0 24px 24px' }}>
                    <h6 style={{ fontWeight: 700, color: '#2C1810', marginBottom: 14, fontSize: 15 }}>This course includes:</h6>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {[
                        { icon: 'fa-video', color: '#3B82F6', text: `${fmtDuration(course.durationMinutes)} on-demand video` },
                        { icon: 'fa-file-alt', color: '#6B7280', text: `${totalLessons} lessons in ${curriculum.length} modules` },
                        ...(quizLessons > 0 ? [{ icon: 'fa-question-circle', color: '#F59E0B', text: `${quizLessons} quiz${quizLessons > 1 ? 'zes' : ''}` }] : []),
                        { icon: 'fa-signal', color: '#8B5CF6', text: levelLabel(course.level) },
                        { icon: 'fa-globe', color: '#10B981', text: course.language ?? 'English' },
                        { icon: 'fa-infinity', color: '#C5973E', text: 'Full lifetime access' },
                        { icon: 'fa-mobile-alt', color: '#6B1D2A', text: 'Access on mobile & desktop' },
                        { icon: 'fa-certificate', color: '#C5973E', text: 'Certificate of completion' },
                      ].map((item) => (
                        <li key={item.text} className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 13, color: '#4b5563' }}>
                          <i className={`fa-solid ${item.icon}`} style={{ color: item.color, width: 16, textAlign: 'center', flexShrink: 0 }} />
                          {item.text}
                        </li>
                      ))}
                    </ul>

                    {/* Tags */}
                    {course.tags?.trim() && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(107,29,42,0.06)' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Tags</span>
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {course.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                            <span key={i} style={{
                              background: 'rgba(107,29,42,0.05)', color: '#6B1D2A',
                              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                              border: '1px solid rgba(107,29,42,0.08)',
                            }}>
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Share */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(107,29,42,0.06)', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>Share this course</span>
                      <div className="d-flex justify-content-center gap-2 mt-2">
                        {[
                          { icon: 'fa-facebook', color: '#1877F2', href: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                          { icon: 'fa-twitter', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(course.title)}` },
                          { icon: 'fa-linkedin', color: '#0A66C2', href: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                        ].map((s) => (
                          <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer"
                            style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: `${s.color}15`, color: s.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              textDecoration: 'none', fontSize: 14,
                              border: `1px solid ${s.color}30`,
                            }}
                          >
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
      </section>
    </>
  );
};

export default CourseDetails;
