import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import courseService from '../../../services/api/course.service';
import quizService from '../../../services/api/quiz.service';
import { Course, CourseLesson, CourseModule, LessonDetail, Quiz, QuizAttempt } from '../../../services/api/types';
import { all_routes } from '../../router/all_routes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDuration = (seconds?: number) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const flatLessons = (mods: CourseModule[]): CourseLesson[] =>
  mods.flatMap(m => m.lessons ?? []);

// ─── Component ────────────────────────────────────────────────────────────────

const CourseWatch = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const routes = all_routes;

  // ── State ──────────────────────────────────────────────────────────────────
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [openModuleIds, setOpenModuleIds] = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources'>('overview');
  const [lessonQuiz, setLessonQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [enrollmentCompleted, setEnrollmentCompleted] = useState(false);

  // ── Inline quiz overlay state ──────────────────────────────────────────────
  type QuizPhase = 'loading' | 'error' | 'quiz' | 'result' | 'violation';
  type QuizAnswer = { questionId: string; selectedOptionIds: string[] };
  type QuizFeedback = { correct: boolean; correctOptionIds: string[]; explanation?: string };
  type InlineQuizResult = { score: number; totalPoints: number; percentage: number; passed: boolean; violated: boolean };
  type InlineQuizQuestion = {
    id: string; type: string; text: string; points: number; orderIndex: number;
    options: { id: string; text: string; isCorrect: boolean | null; orderIndex: number }[];
  };
  type InlineQuizData = {
    id: string; title: string; description: string; passingScore: number;
    duration: number; shuffleQuestions: boolean; totalPoints: number;
    questions: InlineQuizQuestion[];
  };
  const [quizOverlayOpen, setQuizOverlayOpen] = useState(false);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('loading');
  const [quizErrorMsg, setQuizErrorMsg] = useState('');
  const [activeQuizData, setActiveQuizData] = useState<InlineQuizData | null>(null);
  const [inlineAttemptId, setInlineAttemptId] = useState<string | null>(null);
  const [inlineEndsAt, setInlineEndsAt] = useState<Date | null>(null);
  const [inlineCurrentIdx, setInlineCurrentIdx] = useState(0);
  const [inlineSelectedIds, setInlineSelectedIds] = useState<string[]>([]);
  const [inlineFeedback, setInlineFeedback] = useState<QuizFeedback | null>(null);
  const [inlineAnswers, setInlineAnswers] = useState<QuizAnswer[]>([]);
  const [inlineResult, setInlineResult] = useState<InlineQuizResult | null>(null);
  const [inlineTimeLeft, setInlineTimeLeft] = useState(0);
  const [inlineIsChecking, setInlineIsChecking] = useState(false);

  // Refs so anti-cheat callbacks always see fresh values
  const inlineAttemptIdRef = useRef<string | null>(null);
  const inlineAnswersRef = useRef<QuizAnswer[]>([]);
  const quizPhaseRef = useRef<QuizPhase>('loading');

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load course + curriculum ───────────────────────────────────────────────
  useEffect(() => {
    if (!courseSlug) return;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const courseData = await courseService.getCourseBySlug(courseSlug);
        setCourse(courseData);

        const mods = await courseService.getCourseCurriculum(courseData.id);
        setModules(mods);

        // Open all modules by default
        setOpenModuleIds(new Set(mods.map(m => m.id)));

        // Build set of already-completed lesson IDs — prefer server data for accuracy
        const done = new Set<string>();
        try {
          const serverIds = await courseService.getMyProgress(courseData.id);
          serverIds.forEach(id => done.add(id));
        } catch {
          // Fallback: use per-lesson isCompleted flags from curriculum
          mods.forEach(m => (m.lessons ?? []).forEach(l => { if (l.isCompleted) done.add(l.id); }));
        }
        setCompletedIds(done);
        const total = mods.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
        setEnrollmentCompleted(done.size > 0 && done.size === total);

        // Auto-select: first incomplete lesson, or first lesson overall
        const all = flatLessons(mods);
        const firstIncomplete = all.find(l => !done.has(l.id));
        const toSelect = firstIncomplete ?? all[0] ?? null;
        if (toSelect) doSelectLesson(toSelect);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load course. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug]);

  // ── Load lesson details when selection changes ─────────────────────────────
  const doSelectLesson = useCallback(async (lesson: CourseLesson) => {
    setSelectedLesson(lesson);
    setLessonDetail(null);
    setVideoUrl(null);
    setLessonLoading(true);
    setActiveTab('overview');
    setLessonQuiz(null);
    setQuizAttempts([]);

    // Fetch linked quiz + attempt history for QUIZ lessons
    if (lesson.contentType === 'QUIZ') {
      setQuizLoading(true);
      quizService.getStudentQuizByLessonId(lesson.id)
        .then(async (q) => {
          setLessonQuiz(q);
          if (q?.id) {
            // Load attempt history in the background (non-blocking)
            quizService.getMyQuizAttempts(q.id)
              .then(attempts => setQuizAttempts(attempts))
              .catch(() => setQuizAttempts([]));
          }
        })
        .catch(() => setLessonQuiz(null))
        .finally(() => setQuizLoading(false));
    }

    try {
      const detail = await courseService.getLessonDetail(lesson.id);
      setLessonDetail(detail);

      if (detail.contentType === 'VIDEO') {
        if (detail.videoUrl) {
          setVideoUrl(detail.videoUrl);
        } else if (detail.muxPlaybackId) {
          try {
            const { videoUrl: url } = await courseService.getLessonVideoUrl(lesson.id);
            setVideoUrl(url);
          } catch {
            setVideoUrl(null); // will use iframe fallback from muxPlaybackId
          }
        }
      }
    } catch {
      setLessonDetail(null);
    } finally {
      setLessonLoading(false);
    }
  }, []);

  // ── Refresh progress (called after quiz completes, or tab regains focus) ─────
  const refreshProgress = useCallback(async () => {
    if (!course?.id) return;
    try {
      const [mods, serverIds] = await Promise.all([
        courseService.getCourseCurriculum(course.id),
        courseService.getMyProgress(course.id).catch(() => [] as string[]),
      ]);
      setModules(mods);
      const done = new Set<string>(serverIds);
      // Fallback: merge curriculum flags if server returned nothing
      if (done.size === 0) {
        mods.forEach(m => (m.lessons ?? []).forEach(l => { if (l.isCompleted) done.add(l.id); }));
      }
      setCompletedIds(done);
      const total = mods.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
      setEnrollmentCompleted(done.size > 0 && done.size === total);
      // If on a QUIZ lesson, refresh attempt history too
      if (selectedLesson?.contentType === 'QUIZ' && lessonQuiz?.id) {
        quizService.getMyQuizAttempts(lessonQuiz.id)
          .then(attempts => setQuizAttempts(attempts))
          .catch(() => {});
      }
    } catch { /* ignore */ }
  }, [course?.id, selectedLesson, lessonQuiz?.id]);

  // Refresh when the browser tab comes back into focus — but NOT if the inline quiz overlay is open
  // (the overlay has its own anti-cheat that handles visibility changes)
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && !quizOverlayOpen) refreshProgress();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshProgress, quizOverlayOpen]);

  // ── Sync inline quiz refs (prevent stale closure in anti-cheat) ──────────
  useEffect(() => { inlineAttemptIdRef.current = inlineAttemptId; }, [inlineAttemptId]);
  useEffect(() => { inlineAnswersRef.current = inlineAnswers; }, [inlineAnswers]);
  useEffect(() => { quizPhaseRef.current = quizPhase; }, [quizPhase]);

  // ── Inline quiz timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!quizOverlayOpen || quizPhase !== 'quiz' || !inlineEndsAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((inlineEndsAt.getTime() - Date.now()) / 1000));
      setInlineTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        // Time up → auto-submit
        const aId = inlineAttemptIdRef.current;
        const acc = inlineAnswersRef.current;
        if (aId) {
          quizService.submitAttempt(aId, acc, false)
            .then((res: any) => { setInlineResult(res); setQuizPhase('result'); })
            .catch(() => setQuizPhase('result'));
        } else {
          setQuizPhase('result');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [quizOverlayOpen, quizPhase, inlineEndsAt]);

  // ── Inline quiz anti-cheat (tab-switch detection) ──────────────────────────
  useEffect(() => {
    if (!quizOverlayOpen || quizPhase !== 'quiz') return;
    const blockEvent = (e: Event) => e.preventDefault();
    const onVisibility = async () => {
      if (!document.hidden || quizPhaseRef.current !== 'quiz') return;
      const aId = inlineAttemptIdRef.current;
      const acc = inlineAnswersRef.current;
      try {
        if (aId) {
          const res = await quizService.submitAttempt(aId, acc, true) as any;
          setInlineResult(res);
        }
      } catch { /* ignore */ } finally {
        setQuizPhase('violation');
      }
    };
    document.addEventListener('copy', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('paste', blockEvent);
    document.addEventListener('contextmenu', blockEvent);
    document.addEventListener('selectstart', blockEvent);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('copy', blockEvent);
      document.removeEventListener('cut', blockEvent);
      document.removeEventListener('paste', blockEvent);
      document.removeEventListener('contextmenu', blockEvent);
      document.removeEventListener('selectstart', blockEvent);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [quizOverlayOpen, quizPhase]);

  // ── Open inline quiz ────────────────────────────────────────────────────────
  const openInlineQuiz = useCallback(async (quizId: string) => {
    setQuizOverlayOpen(true);
    setQuizPhase('loading');
    setQuizErrorMsg('');
    setActiveQuizData(null);
    setInlineAttemptId(null);
    setInlineEndsAt(null);
    setInlineCurrentIdx(0);
    setInlineSelectedIds([]);
    setInlineFeedback(null);
    setInlineAnswers([]);
    setInlineResult(null);
    setInlineTimeLeft(0);
    try {
      const quizData = await quizService.getQuizForStudent(quizId) as any;
      const questions = quizData.shuffleQuestions
        ? [...(quizData.questions ?? [])].sort(() => Math.random() - 0.5)
        : (quizData.questions ?? []);
      setActiveQuizData({ ...quizData, questions });
      const attempt = await quizService.startQuizAttempt(quizId);
      setInlineAttemptId(attempt.attemptId);
      const endsAtDate = new Date(attempt.endsAt);
      setInlineEndsAt(endsAtDate);
      setInlineTimeLeft(Math.max(0, Math.round((endsAtDate.getTime() - Date.now()) / 1000)));
      setQuizPhase('quiz');
    } catch (err: any) {
      setQuizErrorMsg(err?.response?.data?.message ?? 'Failed to load quiz. Please try again.');
      setQuizPhase('error');
    }
  }, []);

  // ── Show last result inline (for Review button) ─────────────────────────────
  const openQuizReview = useCallback((lastAttempt: QuizAttempt) => {
    setQuizOverlayOpen(true);
    setActiveQuizData(null);
    setInlineResult({
      score: lastAttempt.score ?? 0,
      totalPoints: lastAttempt.totalPoints ?? 0,
      percentage: lastAttempt.percentage ?? 0,
      passed: lastAttempt.passed ?? false,
      violated: lastAttempt.violated ?? false,
    });
    setQuizPhase('result');
  }, []);

  // ── Close inline quiz overlay ───────────────────────────────────────────────
  const closeQuizOverlay = useCallback(async () => {
    // If quiz is still in progress, auto-submit before closing
    if (quizPhaseRef.current === 'quiz') {
      const aId = inlineAttemptIdRef.current;
      const acc = inlineAnswersRef.current;
      if (aId) {
        try { await quizService.submitAttempt(aId, acc, false); } catch { /* ignore */ }
      }
    }
    setQuizOverlayOpen(false);
    setQuizPhase('loading');
    // Refresh progress + attempt history after quiz
    refreshProgress();
    if (lessonQuiz?.id) {
      quizService.getMyQuizAttempts(lessonQuiz.id)
        .then(attempts => setQuizAttempts(attempts))
        .catch(() => {});
    }
  }, [refreshProgress, lessonQuiz?.id]);

  // ── Inline quiz interaction ─────────────────────────────────────────────────
  const toggleInlineOption = (optionId: string) => {
    if (inlineFeedback) return;
    const isMultiple = activeQuizData?.questions[inlineCurrentIdx]?.type?.includes('MULTIPLE');
    if (isMultiple) {
      setInlineSelectedIds(prev =>
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      setInlineSelectedIds([optionId]);
    }
  };

  const handleInlineCheck = async () => {
    const aId = inlineAttemptIdRef.current;
    const question = activeQuizData?.questions[inlineCurrentIdx];
    if (!aId || !question || inlineSelectedIds.length === 0) return;
    setInlineIsChecking(true);
    try {
      const fb = await quizService.checkAnswer(aId, question.id, inlineSelectedIds) as QuizFeedback;
      setInlineFeedback(fb);
    } catch { /* ignore */ } finally {
      setInlineIsChecking(false);
    }
  };

  const handleInlineRetry = () => {
    setInlineSelectedIds([]);
    setInlineFeedback(null);
  };

  const handleInlineNext = () => {
    const question = activeQuizData?.questions[inlineCurrentIdx];
    if (!question || !inlineFeedback?.correct) return;
    setInlineAnswers(prev => [...prev, { questionId: question.id, selectedOptionIds: inlineSelectedIds }]);
    setInlineSelectedIds([]);
    setInlineFeedback(null);
    setInlineCurrentIdx(prev => prev + 1);
  };

  const handleInlineFinalSubmit = async () => {
    const aId = inlineAttemptIdRef.current;
    const question = activeQuizData?.questions[inlineCurrentIdx];
    if (!aId || !question || !inlineFeedback?.correct) return;
    const finalAnswers = [...inlineAnswers, { questionId: question.id, selectedOptionIds: inlineSelectedIds }];
    try {
      const res = await quizService.submitAttempt(aId, finalAnswers, false) as any;
      setInlineResult(res);
    } catch { /* ignore */ } finally {
      setQuizPhase('result');
    }
  };

  const getInlineOptionStyle = (optionId: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      marginBottom: 10, borderRadius: 10, border: '2px solid', cursor: 'pointer',
      transition: 'all 0.15s', userSelect: 'none',
    };
    if (!inlineFeedback) {
      return inlineSelectedIds.includes(optionId)
        ? { ...base, borderColor: 'var(--lx-primary)', background: 'rgba(107,29,42,0.07)' }
        : { ...base, borderColor: 'rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)' };
    }
    const isSelected = inlineSelectedIds.includes(optionId);
    const isCorrect = inlineFeedback.correctOptionIds.includes(optionId);
    if (isCorrect) return { ...base, borderColor: '#2D5F3F', background: 'rgba(45,95,63,0.09)', cursor: 'default' };
    if (isSelected && !isCorrect) return { ...base, borderColor: '#8B2335', background: 'rgba(139,35,53,0.07)', cursor: 'default' };
    return { ...base, borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.4)', opacity: 0.55, cursor: 'default' };
  };

  const formatQuizTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Progress tracking via video element ────────────────────────────────────
  const stopProgressTracking = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!lessonDetail?.id || lessonDetail.contentType !== 'VIDEO') return;
    const lessonId = lessonDetail.id;

    stopProgressTracking();
    progressTimerRef.current = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.paused) return;
      courseService.updateLessonProgress(lessonId, Math.floor(vid.currentTime)).catch(() => {});
    }, 30_000);

    return stopProgressTracking;
  }, [lessonDetail, stopProgressTracking]);

  // Auto-complete when video ends
  const handleVideoEnded = useCallback(async () => {
    if (!lessonDetail) return;
    try {
      await courseService.completeLessonProgress(lessonDetail.id);
      setCompletedIds(prev => new Set(Array.from(prev).concat(lessonDetail.id)));
    } catch { /* ignore */ }
  }, [lessonDetail]);

  // ── Manual "Mark as Complete" ──────────────────────────────────────────────
  const handleMarkComplete = async () => {
    if (!selectedLesson || markingComplete) return;
    setMarkingComplete(true);
    try {
      await courseService.completeLessonProgress(selectedLesson.id);
      const newDone = new Set(Array.from(completedIds).concat(selectedLesson.id));
      setCompletedIds(newDone);
      const total = flatLessons(modules).length;
      if (newDone.size === total) setEnrollmentCompleted(true);

      // Auto-advance to next lesson
      const all = flatLessons(modules);
      const idx = all.findIndex(l => l.id === selectedLesson.id);
      if (idx !== -1 && idx + 1 < all.length) doSelectLesson(all[idx + 1]);
    } catch { /* ignore */ } finally {
      setMarkingComplete(false);
    }
  };

  // ── Prev / Next navigation ─────────────────────────────────────────────────
  const goTo = (offset: 1 | -1) => {
    if (!selectedLesson) return;
    const all = flatLessons(modules);
    const idx = all.findIndex(l => l.id === selectedLesson.id);
    const next = all[idx + offset];
    if (next) doSelectLesson(next);
  };

  // ── Toggle accordion module ────────────────────────────────────────────────
  const toggleModule = (moduleId: string) =>
    setOpenModuleIds(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });

  // ── Derived values ─────────────────────────────────────────────────────────
  const allLessons = flatLessons(modules);
  const totalLessons = allLessons.length;
  const doneLessons = completedIds.size;
  const progressPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const isLessonDone = selectedLesson ? completedIds.has(selectedLesson.id) : false;
  const lessonIdx = allLessons.findIndex(l => l.id === selectedLesson?.id);
  const hasPrev = lessonIdx > 0;
  const hasNext = lessonIdx !== -1 && lessonIdx + 1 < allLessons.length;

  const lessonIcon = (l: CourseLesson, locked: boolean) => {
    if (locked) return 'isax-lock text-muted';
    if (completedIds.has(l.id)) return 'isax-tick-circle text-success';
    if (l.contentType === 'TEXT') return 'isax-document-text text-muted';
    if (l.contentType === 'QUIZ') return 'isax-award text-warning';
    return l.id === selectedLesson?.id ? 'isax-play-circle text-primary' : 'isax-play-circle5 text-muted';
  };

  // A lesson is locked when the previous lesson (across all modules, flattened) is not yet completed
  const isLessonLocked = (lesson: CourseLesson): boolean => {
    const all = flatLessons(modules);
    const idx = all.findIndex(l => l.id === lesson.id);
    if (idx <= 0) return false; // first lesson always accessible
    return !completedIds.has(all[idx - 1].id);
  };

  // Quiz-specific derived values (computed from attempt history)
  const quizHasPassed = quizAttempts.some(a => a.passed);
  const quizBestPct = quizHasPassed
    ? Math.round(Math.max(...quizAttempts.filter(a => a.passed).map(a => a.percentage ?? 0)))
    : 0;
  const quizAttemptsLeft = lessonQuiz
    ? (lessonQuiz.allowRetake
        ? Math.max(0, (lessonQuiz.maxAttempts ?? 3) - quizAttempts.length)
        : quizAttempts.length === 0 ? 1 : 0)
    : 0;
  const canStartQuiz = !quizHasPassed && quizAttemptsLeft > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / Error states
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Breadcrumb title="Course Watch" />
        <div className="content pt-0">
          <div
            className="container-fluid d-flex align-items-center justify-content-center"
            style={{ minHeight: 400 }}
          >
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status" />
              <p className="text-muted">Loading course…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumb title="Course Watch" />
        <div className="content pt-0">
          <div
            className="container-fluid d-flex align-items-center justify-content-center"
            style={{ minHeight: 400 }}
          >
            <div className="text-center">
              <i className="isax isax-close-circle fs-1 text-danger mb-3 d-block" />
              <h5 className="text-danger mb-2">Unable to Load Course</h5>
              <p className="text-muted mb-4">{error}</p>
              <Link to={routes.studentCourses} className="btn btn-primary">
                Back to My Courses
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Breadcrumb title={course?.title ?? 'Course Watch'} />
      <div className="content pt-0">
        <div className="container-fluid">
          <div className="course-watch-section">
            <div className="row g-0">

              {/* ── Left sidebar ─────────────────────────────────────────── */}
              <div
                className="col-lg-4 border-end"
                style={{ maxHeight: '90vh', overflowY: 'auto', position: 'sticky', top: 0 }}
              >
                <div className="progress-overview-section p-3">

                  <div className="mb-3">
                    <Link
                      to={routes.studentCourses}
                      className="back-to-course d-inline-flex align-items-center text-muted small"
                    >
                      <i className="isax isax-arrow-left me-1" />
                      Back to My Courses
                    </Link>
                  </div>

                  <h6 className="fw-semibold mb-3">{course?.title}</h6>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small text-muted">{progressPct}% complete</span>
                      <span className="small text-muted">{doneLessons}/{totalLessons}</span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${progressPct}%`, transition: 'width 0.4s' }}
                      />
                    </div>
                  </div>

                  {/* Course Completion Banner */}
                  {enrollmentCompleted && (
                    <div style={{
                      marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(45,95,63,0.08)', border: '1px solid rgba(45,95,63,0.20)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <i className="isax isax-medal-star" style={{ color: '#2D5F3F', fontSize: 20, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#2D5F3F' }}>Course Completed! 🎉</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#2D5F3F', opacity: 0.8 }}>Your certificate has been generated</p>
                      </div>
                    </div>
                  )}

                  {/* Module accordion */}
                  <div className="accordions-items-seperate">
                    {modules.map((mod, modIdx) => {
                      const isOpen = openModuleIds.has(mod.id);
                      const modDone = (mod.lessons ?? []).filter(l => completedIds.has(l.id)).length;
                      const modTotal = (mod.lessons ?? []).length;

                      return (
                        <div className="accordion-item mb-2" key={mod.id}>
                          <div className="accordion-header">
                            <div
                              className={`accordion-button${isOpen ? '' : ' collapsed'} py-3 px-3`}
                              role="button"
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleModule(mod.id)}
                            >
                              <div className="flex-grow-1">
                                <span className="d-block small text-muted mb-1">
                                  Section {modIdx + 1} · {modDone}/{modTotal} done
                                </span>
                                <h6 className="mb-0 fs-14">{mod.title}</h6>
                              </div>
                              <i
                                className={`isax ms-2 flex-shrink-0 ${
                                  isOpen ? 'isax-arrow-up-2' : 'isax-arrow-down-2'
                                }`}
                              />
                            </div>
                          </div>

                          {isOpen && (
                            <div className="accordion-body px-3 pb-2 pt-0">
                              {(mod.lessons ?? []).map(lesson => {
                                const isActive = lesson.id === selectedLesson?.id;
                                const locked = isLessonLocked(lesson);
                                return (
                                  <div
                                    key={lesson.id}
                                    role="button"
                                    className={`d-flex align-items-center gap-2 py-2 px-2 mb-1 rounded-2 ${
                                      isActive ? 'bg-primary bg-opacity-10' : ''
                                    }`}
                                    style={{
                                      cursor: locked ? 'not-allowed' : 'pointer',
                                      opacity: locked ? 0.55 : 1,
                                    }}
                                    title={locked ? 'Complete the previous lesson to unlock' : lesson.title}
                                    onClick={() => { if (!locked) doSelectLesson(lesson); }}
                                  >
                                    <i className={`isax flex-shrink-0 fs-18 ${lessonIcon(lesson, locked)}`} />
                                    <div className="flex-grow-1 overflow-hidden">
                                      <p className={`mb-0 small text-truncate ${isActive ? 'fw-semibold text-primary' : locked ? 'text-muted' : ''}`}>
                                        {lesson.title}
                                      </p>
                                      {locked && (
                                        <span style={{ fontSize: 10, color: '#aaa' }}>Complete previous lesson first</span>
                                      )}
                                    </div>
                                    {!locked && fmtDuration(lesson.videoDurationSeconds) && (
                                      <span className="text-muted small flex-shrink-0">
                                        {fmtDuration(lesson.videoDurationSeconds)}
                                      </span>
                                    )}
                                    {locked && (
                                      <i className="isax isax-lock-1 text-muted flex-shrink-0" style={{ fontSize: 12 }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Right content area ──────────────────────────────────── */}
              <div className="col-lg-8">
                <div className="course-watch-content p-3 p-lg-4">

                  {lessonLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status" />
                      <p className="text-muted mt-2 small">Loading lesson…</p>
                    </div>
                  ) : selectedLesson ? (
                    <>
                      {/* ── Video / Text / Quiz ──────────────────────────── */}
                      <div className="mb-3">

                        {/* VIDEO */}
                        {selectedLesson.contentType === 'VIDEO' && (
                          <div
                            className="position-relative bg-black rounded-3 overflow-hidden w-100"
                            style={{ aspectRatio: '16/9' }}
                          >
                            {lessonDetail?.muxPlaybackId ? (
                              <iframe
                                title={selectedLesson.title}
                                src={`https://player.mux.com/player.html?playback_id=${lessonDetail.muxPlaybackId}&metadata-video-title=${encodeURIComponent(selectedLesson.title)}`}
                                className="w-100 h-100 border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                style={{ position: 'absolute', inset: 0 }}
                              />
                            ) : videoUrl ? (
                              <video
                                ref={videoRef}
                                src={videoUrl}
                                controls
                                className="w-100 h-100"
                                style={{ position: 'absolute', inset: 0, objectFit: 'contain' }}
                                onEnded={handleVideoEnded}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center w-100 h-100 text-white">
                                <div className="text-center py-5">
                                  <i className="isax isax-video-slash fs-1 opacity-40 d-block mb-2" />
                                  <span className="opacity-50 small">Video not available</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TEXT */}
                        {selectedLesson.contentType === 'TEXT' && (
                          <div className="bg-light rounded-3 p-4">
                            {lessonDetail?.textContent ? (
                              <div
                                className="lesson-text-content"
                                dangerouslySetInnerHTML={{ __html: lessonDetail.textContent }}
                              />
                            ) : (
                              <p className="text-muted mb-0">No content available.</p>
                            )}
                          </div>
                        )}

                        {/* QUIZ */}
                        {selectedLesson.contentType === 'QUIZ' && (
                          <div style={{
                            padding: '32px 28px', textAlign: 'center',
                            background: quizHasPassed
                              ? 'linear-gradient(135deg, rgba(45,95,63,0.06) 0%, rgba(45,95,63,0.02) 100%)'
                              : 'linear-gradient(135deg, rgba(197,151,62,0.05) 0%, rgba(107,29,42,0.04) 100%)',
                            borderRadius: 'var(--lx-radius)', border: `1px solid ${quizHasPassed ? 'rgba(45,95,63,0.18)' : 'rgba(197,151,62,0.15)'}`,
                          }}>
                            {/* Icon */}
                            <div style={{
                              width: 72, height: 72, borderRadius: '50%',
                              background: quizHasPassed ? 'rgba(45,95,63,0.12)' : 'rgba(197,151,62,0.12)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto 14px',
                            }}>
                              <i className={`isax ${quizHasPassed ? 'isax-medal-star' : 'isax-award'}`}
                                style={{ fontSize: 34, color: quizHasPassed ? '#2D5F3F' : '#C5973E' }} />
                            </div>

                            <h6 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 6, fontSize: 16 }}>
                              {selectedLesson.title}
                            </h6>

                            {quizLoading ? (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #C5973E', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                <p style={{ color: 'var(--lx-text-muted)', fontSize: 13, margin: 0 }}>Loading quiz...</p>
                              </div>
                            ) : lessonQuiz ? (
                              <>
                                {/* Quiz stats */}
                                <p style={{ color: 'var(--lx-text-muted)', fontSize: 13, marginBottom: 8 }}>
                                  <i className="isax isax-message-question" style={{ marginRight: 4, color: 'var(--lx-primary)' }} />
                                  {lessonQuiz.questionCount ?? 0} questions
                                  <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                                  <i className="isax isax-clock" style={{ marginRight: 4, color: '#C5973E' }} />
                                  {lessonQuiz.duration ?? 0} min
                                  <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                                  Pass at {lessonQuiz.passingScore ?? 70}%
                                </p>

                                {/* Already passed — celebration */}
                                {quizHasPassed && (
                                  <div style={{
                                    margin: '12px auto 16px', padding: '12px 20px', borderRadius: 8,
                                    background: 'rgba(45,95,63,0.10)', border: '1px solid rgba(45,95,63,0.18)',
                                    display: 'inline-block',
                                  }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#2D5F3F' }}>
                                      <i className="isax isax-tick-circle" style={{ marginRight: 6 }} />
                                      Quiz Passed! 🎉
                                    </p>
                                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#2D5F3F', opacity: 0.8 }}>
                                      Best score: {quizBestPct}%
                                    </p>
                                  </div>
                                )}

                                {/* Attempt history */}
                                {quizAttempts.length > 0 && (
                                  <div style={{ margin: '0 auto 16px', maxWidth: 320, textAlign: 'left' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--lx-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      Attempt History ({quizAttempts.length} / {lessonQuiz.allowRetake ? lessonQuiz.maxAttempts ?? '∞' : 1})
                                    </p>
                                    {quizAttempts.slice(0, 4).map((attempt, idx) => (
                                      <div key={attempt.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '6px 10px', borderRadius: 6, marginBottom: 4,
                                        background: attempt.passed ? 'rgba(45,95,63,0.07)' : 'rgba(139,35,53,0.07)',
                                        border: `1px solid ${attempt.passed ? 'rgba(45,95,63,0.12)' : 'rgba(139,35,53,0.12)'}`,
                                      }}>
                                        <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
                                          Attempt {quizAttempts.length - idx}
                                          {attempt.submittedAt && (
                                            <span style={{ marginLeft: 6, opacity: 0.6 }}>
                                              · {new Date(attempt.submittedAt).toLocaleDateString()}
                                            </span>
                                          )}
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: attempt.passed ? '#2D5F3F' : '#8B2335' }}>
                                          {attempt.percentage != null ? Math.round(attempt.percentage) : attempt.score ?? 0}%
                                          <i className={`isax ms-1 ${attempt.passed ? 'isax-tick-circle' : 'isax-close-circle'}`} style={{ fontSize: 13 }} />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Action button */}
                                {lessonQuiz.status === 'PUBLISHED' ? (
                                  canStartQuiz ? (
                                    <button
                                      type="button"
                                      className="lx-btn lx-btn-gold"
                                      style={{ fontSize: 14, padding: '10px 28px', gap: 8 }}
                                      onClick={() => openInlineQuiz(lessonQuiz.id)}
                                    >
                                      <i className="isax isax-play-circle" style={{ fontSize: 18 }} />
                                      {quizAttempts.length === 0 ? 'Start Quiz' : 'Retake Quiz'}
                                    </button>
                                  ) : quizHasPassed ? (
                                    <button
                                      type="button"
                                      className="lx-btn lx-btn-outline lx-btn-sm"
                                      onClick={() => quizAttempts[0] && openQuizReview(quizAttempts[0])}
                                    >
                                      <i className="isax isax-eye" />
                                      Review Quiz
                                    </button>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B2335', fontSize: 13, justifyContent: 'center' }}>
                                      <i className="isax isax-close-circle" />
                                      No more attempts available
                                    </div>
                                  )
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C5973E', fontSize: 13, justifyContent: 'center' }}>
                                    <i className="isax isax-info-circle" />
                                    Quiz not yet published by instructor
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <p style={{ color: 'var(--lx-text-muted)', fontSize: 13, marginBottom: 6, marginTop: 4 }}>
                                  The instructor hasn&apos;t linked a quiz to this lesson yet.
                                </p>
                                <p style={{ color: 'var(--lx-text-muted)', fontSize: 12, marginBottom: 20, opacity: 0.7 }}>
                                  Check back soon or browse available quizzes below.
                                </p>
                                <Link to={routes.studentQuiz} className="lx-btn lx-btn-outline lx-btn-sm">
                                  <i className="isax isax-document-text" />
                                  Browse All Quizzes
                                </Link>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Lesson header + controls ─────────────────────── */}
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
                        <div>
                          <h5 className="mb-1">{selectedLesson.title}</h5>
                          <span className="text-muted small">
                            Lesson {lessonIdx + 1} of {totalLessons}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">
                          <button
                            type="button"
                            className="btn btn-light btn-sm d-inline-flex align-items-center gap-1"
                            onClick={() => goTo(-1)}
                            disabled={!hasPrev}
                          >
                            <i className="isax isax-arrow-left-2" /> Prev
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm d-inline-flex align-items-center gap-1"
                            onClick={() => goTo(1)}
                            disabled={!hasNext}
                          >
                            Next <i className="isax isax-arrow-right-3" />
                          </button>
                          {!isLessonDone && selectedLesson.contentType !== 'QUIZ' && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
                              onClick={handleMarkComplete}
                              disabled={markingComplete}
                            >
                              {markingComplete
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="isax isax-tick-circle" />}
                              Mark Complete
                            </button>
                          )}
                          {isLessonDone && (
                            <span className="badge bg-success px-3 py-2 d-inline-flex align-items-center gap-1">
                              <i className="isax isax-tick-circle" /> Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── Tabs ─────────────────────────────────────────── */}
                      <ul
                        className="nav-tabs mb-4 nav-justified border-0 nav-style-1 d-sm-flex d-block"
                        role="tablist"
                      >
                        <li className="nav-item">
                          <button
                            type="button"
                            className={`btn nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                          >
                            Overview
                          </button>
                        </li>
                        <li className="nav-item">
                          <button
                            type="button"
                            className={`btn nav-link ${activeTab === 'resources' ? 'active' : ''}`}
                            onClick={() => setActiveTab('resources')}
                          >
                            Resources
                            {(lessonDetail?.resources?.length ?? 0) > 0 && (
                              <span
                                className="badge bg-primary ms-1 rounded-pill"
                                style={{ fontSize: 10 }}
                              >
                                {lessonDetail!.resources.length}
                              </span>
                            )}
                          </button>
                        </li>
                      </ul>

                      <div className="tab-content">

                        {/* Overview */}
                        {activeTab === 'overview' && (
                          <div>
                            {lessonDetail?.description && (
                              <div className="mb-4">
                                <h6 className="fs-18 fw-semibold mb-2">About this lesson</h6>
                                <p className="text-muted">{lessonDetail.description}</p>
                              </div>
                            )}

                            {course?.shortDescription && (
                              <div className="mb-4">
                                <h6 className="fs-18 fw-semibold mb-1">About this course</h6>
                                <p className="text-muted">{course.shortDescription}</p>
                              </div>
                            )}

                            {course?.whatYouWillLearn && (
                              <div className="mb-4">
                                <h6 className="fs-18 fw-semibold mb-2">What You&apos;ll Learn</h6>
                                <ul className="list-unstyled ms-2">
                                  {course.whatYouWillLearn
                                    .split('\n')
                                    .filter(Boolean)
                                    .map((item, i) => (
                                      <li key={i} className="mb-2 d-flex align-items-start gap-2">
                                        <i className="isax isax-tick-circle text-success flex-shrink-0 mt-1" />
                                        <span className="text-muted">{item.replace(/^[-•*]\s*/, '')}</span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}

                            {course?.requirements && (
                              <div className="mb-0">
                                <h6 className="fs-18 fw-semibold mb-2">Requirements</h6>
                                <ul className="list-unstyled ms-2">
                                  {course.requirements
                                    .split('\n')
                                    .filter(Boolean)
                                    .map((item, i) => (
                                      <li key={i} className="mb-2 d-flex align-items-start gap-2">
                                        <i className="isax isax-info-circle text-primary flex-shrink-0 mt-1" />
                                        <span className="text-muted">{item.replace(/^[-•*]\s*/, '')}</span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Resources */}
                        {activeTab === 'resources' && (
                          <div>
                            {(lessonDetail?.resources?.length ?? 0) === 0 ? (
                              <div className="text-center py-4 text-muted">
                                <i className="isax isax-document fs-1 opacity-25 d-block mb-2" />
                                <p className="small">No resources for this lesson</p>
                              </div>
                            ) : (
                              <div className="list-group list-group-flush">
                                {lessonDetail!.resources.map(res => (
                                  <a
                                    key={res.id}
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="list-group-item list-group-item-action d-flex align-items-center gap-3 px-0 py-3"
                                  >
                                    <div
                                      className="d-flex align-items-center justify-content-center rounded-2 bg-primary bg-opacity-10 flex-shrink-0"
                                      style={{ width: 40, height: 40 }}
                                    >
                                      <i className="isax isax-document-download text-primary" />
                                    </div>
                                    <div className="flex-grow-1">
                                      <p className="mb-0 fw-medium small">{res.name}</p>
                                      <span className="text-muted" style={{ fontSize: 11 }}>
                                        {res.type.toUpperCase()}
                                      </span>
                                    </div>
                                    <i className="isax isax-export-2 text-muted" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    </>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="isax isax-play-circle fs-1 opacity-25 d-block mb-2" />
                      <p>Select a lesson from the sidebar to start learning</p>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Inline Quiz Overlay ────────────────────────────────────────────── */}
      {quizOverlayOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,10,20,0.82)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '24px 16px',
        }}>
          <div style={{
            width: '100%', maxWidth: 720, background: 'var(--lx-card-bg, #fff)',
            borderRadius: 'var(--lx-radius, 12px)', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            border: '1px solid rgba(197,151,62,0.15)',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Close button — only show when not in active quiz phase */}
            {quizPhase !== 'quiz' && (
              <button
                type="button"
                onClick={closeQuizOverlay}
                style={{
                  position: 'absolute', top: 14, right: 14, zIndex: 2,
                  background: 'rgba(107,29,42,0.08)', border: '1px solid rgba(107,29,42,0.15)',
                  borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lx-primary)',
                }}
                title="Close"
              >
                <i className="isax isax-close-circle" style={{ fontSize: 18 }} />
              </button>
            )}

            <div style={{ padding: '28px 32px' }}>

              {/* Loading */}
              {quizPhase === 'loading' && (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    border: '4px solid rgba(197,151,62,0.2)', borderTopColor: '#C5973E',
                    animation: 'spin 0.9s linear infinite', margin: '0 auto 16px',
                  }} />
                  <p style={{ color: 'var(--lx-text-muted)', fontSize: 15 }}>Preparing your quiz…</p>
                </div>
              )}

              {/* Error */}
              {quizPhase === 'error' && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <i className="isax isax-close-circle" style={{ fontSize: 52, color: '#8B2335', display: 'block', marginBottom: 16 }} />
                  <h5 style={{ color: '#8B2335', marginBottom: 8 }}>Unable to Load Quiz</h5>
                  <p style={{ color: 'var(--lx-text-muted)', marginBottom: 24, fontSize: 14 }}>{quizErrorMsg}</p>
                  <button type="button" onClick={closeQuizOverlay} className="lx-btn lx-btn-outline">Close</button>
                </div>
              )}

              {/* Violation */}
              {quizPhase === 'violation' && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(197,151,62,0.12)', border: '3px solid rgba(197,151,62,0.3)',
                  }}>
                    <i className="isax isax-warning-2" style={{ fontSize: 40, color: '#C5973E' }} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#8B2335', marginBottom: 12 }}>Quiz Terminated</h3>
                  <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, marginBottom: 6 }}>
                    You switched tabs during the quiz. Your attempt has been submitted with a{' '}
                    <strong style={{ color: '#8B2335' }}>score of 0</strong>.
                  </p>
                  <p style={{ color: 'var(--lx-text-muted)', fontSize: 12, marginBottom: 28 }}>
                    This action is logged and cannot be reversed.
                  </p>
                  <button type="button" onClick={closeQuizOverlay} className="lx-btn lx-btn-outline">Back to Course</button>
                </div>
              )}

              {/* Result */}
              {quizPhase === 'result' && inlineResult && (
                <div style={{ maxWidth: 560, margin: '0 auto' }}>
                  {/* Hero */}
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                      width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: inlineResult.passed ? 'rgba(45,95,63,0.12)' : 'rgba(139,35,53,0.10)',
                      border: `3px solid ${inlineResult.passed ? 'rgba(45,95,63,0.3)' : 'rgba(139,35,53,0.25)'}`,
                    }}>
                      <i
                        className={`isax ${inlineResult.passed ? 'isax-tick-circle' : 'isax-close-circle'}`}
                        style={{ fontSize: 44, color: inlineResult.passed ? '#2D5F3F' : '#8B2335' }}
                      />
                    </div>
                    <h3 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: inlineResult.passed ? '#2D5F3F' : '#8B2335' }}>
                      {inlineResult.passed ? '🎉 You Passed!' : 'Not Passed'}
                    </h3>
                    <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, margin: 0 }}>
                      {inlineResult.passed
                        ? "Congratulations! You've successfully completed this quiz."
                        : `You need ${activeQuizData?.passingScore ?? 70}% to pass. Keep practicing!`}
                    </p>
                  </div>
                  {/* Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Points Earned', value: inlineResult.score, icon: 'isax-star', color: inlineResult.passed ? '#2D5F3F' : '#8B2335' },
                      { label: 'Total Points', value: inlineResult.totalPoints, icon: 'isax-chart', color: '#C5973E' },
                      { label: 'Your Score', value: `${typeof inlineResult.percentage === 'number' ? Math.round(inlineResult.percentage * 10) / 10 : 0}%`, icon: 'isax-percentage-square', color: inlineResult.passed ? '#2D5F3F' : '#8B2335' },
                    ].map(card => (
                      <div key={card.label} style={{
                        padding: '16px 12px', borderRadius: 10, textAlign: 'center',
                        background: `${card.color}12`, border: `1px solid ${card.color}22`,
                      }}>
                        <i className={`isax ${card.icon}`} style={{ fontSize: 22, color: card.color, display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1.1, marginBottom: 4 }}>{card.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--lx-text-muted)', fontWeight: 500 }}>{card.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(107,29,42,0.04)', border: '1px solid rgba(107,29,42,0.07)', marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Score</span>
                      <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
                        Passing: <strong style={{ color: inlineResult.passed ? '#2D5F3F' : '#8B2335' }}>{activeQuizData?.passingScore ?? 70}%</strong>
                      </span>
                    </div>
                    <div style={{ height: 12, borderRadius: 6, background: 'rgba(107,29,42,0.06)', position: 'relative', overflow: 'visible' }}>
                      <div style={{ position: 'absolute', left: `${activeQuizData?.passingScore ?? 70}%`, top: -4, bottom: -4, width: 2, background: 'rgba(107,29,42,0.3)', borderRadius: 2, zIndex: 2 }} />
                      <div style={{
                        height: '100%', borderRadius: 6, position: 'relative', zIndex: 1,
                        width: `${Math.min(typeof inlineResult.percentage === 'number' ? Math.round(inlineResult.percentage * 10) / 10 : 0, 100)}%`,
                        background: inlineResult.passed ? 'linear-gradient(90deg,#2D5F3F,#4CAF50)' : 'linear-gradient(90deg,#8B2335,#C5973E)',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button type="button" onClick={closeQuizOverlay} className="lx-btn lx-btn-outline">
                      <i className="isax isax-arrow-left" /> Back to Course
                    </button>
                  </div>
                </div>
              )}

              {/* Active Quiz */}
              {quizPhase === 'quiz' && activeQuizData && (() => {
                const currentQuestion = activeQuizData.questions[inlineCurrentIdx];
                if (!currentQuestion) return null;
                const totalQ = activeQuizData.questions.length;
                const progressPct2 = Math.round((inlineCurrentIdx / totalQ) * 100);
                const timeWarning = inlineTimeLeft < 60 && inlineTimeLeft > 0;
                const isMultiple = currentQuestion.type?.toUpperCase().includes('MULTIPLE');
                const isLast = inlineCurrentIdx === totalQ - 1;
                return (
                  <>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <h5 style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{activeQuizData.title}</h5>
                        <span style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>Question {inlineCurrentIdx + 1} of {totalQ}</span>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                        borderRadius: 8, border: `1px solid ${timeWarning ? '#8B2335' : 'rgba(0,0,0,0.1)'}`,
                        background: timeWarning ? 'rgba(139,35,53,0.07)' : 'rgba(0,0,0,0.03)',
                        fontWeight: 700, fontSize: 15, color: timeWarning ? '#8B2335' : 'var(--lx-text)',
                      }}>
                        <i className={`isax isax-timer${timeWarning ? ' text-danger' : ''}`} />
                        {formatQuizTime(inlineTimeLeft)}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.07)', marginBottom: 20 }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${progressPct2}%`, background: 'var(--lx-primary)', transition: 'width 0.3s' }} />
                    </div>
                    {/* Question card */}
                    <div style={{ background: 'rgba(107,29,42,0.03)', borderRadius: 10, padding: '20px 22px', border: '1px solid rgba(107,29,42,0.07)', marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                        <h6 style={{ margin: 0, lineHeight: 1.5, fontWeight: 600, fontSize: 15 }}>{currentQuestion.text}</h6>
                        <span style={{
                          flexShrink: 0, padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                          background: 'rgba(107,29,42,0.08)', color: 'var(--lx-primary)',
                        }}>
                          {currentQuestion.points} {currentQuestion.points === 1 ? 'pt' : 'pts'}
                        </span>
                      </div>
                      {isMultiple && (
                        <p style={{ color: 'var(--lx-text-muted)', fontSize: 12, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="isax isax-info-circle" /> Select all that apply
                        </p>
                      )}
                      {/* Options */}
                      {currentQuestion.options
                        .slice()
                        .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                        .map((option: any) => (
                          <div
                            key={option.id}
                            style={getInlineOptionStyle(option.id)}
                            onClick={() => toggleInlineOption(option.id)}
                          >
                            {/* Radio/Checkbox indicator */}
                            <div style={{
                              width: 20, height: 20, borderRadius: isMultiple ? 5 : '50%',
                              border: `2px solid ${
                                inlineFeedback
                                  ? inlineFeedback.correctOptionIds.includes(option.id) ? '#2D5F3F'
                                    : inlineSelectedIds.includes(option.id) ? '#8B2335' : 'rgba(0,0,0,0.2)'
                                  : inlineSelectedIds.includes(option.id) ? 'var(--lx-primary)' : 'rgba(0,0,0,0.2)'
                              }`,
                              background: inlineSelectedIds.includes(option.id)
                                ? (inlineFeedback
                                  ? (inlineFeedback.correctOptionIds.includes(option.id) ? '#2D5F3F' : '#8B2335')
                                  : 'var(--lx-primary)')
                                : 'transparent',
                              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {inlineSelectedIds.includes(option.id) && (
                                <i className="isax isax-tick" style={{ fontSize: 11, color: '#fff' }} />
                              )}
                            </div>
                            <span style={{ fontSize: 14 }}>{option.text}</span>
                            {inlineFeedback && inlineFeedback.correctOptionIds.includes(option.id) && (
                              <i className="isax isax-tick-circle ms-auto" style={{ fontSize: 16, color: '#2D5F3F', flexShrink: 0 }} />
                            )}
                            {inlineFeedback && inlineSelectedIds.includes(option.id) && !inlineFeedback.correctOptionIds.includes(option.id) && (
                              <i className="isax isax-close-circle ms-auto" style={{ fontSize: 16, color: '#8B2335', flexShrink: 0 }} />
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Feedback */}
                    {inlineFeedback && (
                      <div style={{
                        padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                        background: inlineFeedback.correct ? 'rgba(45,95,63,0.08)' : 'rgba(139,35,53,0.07)',
                        border: `1px solid ${inlineFeedback.correct ? 'rgba(45,95,63,0.2)' : 'rgba(139,35,53,0.2)'}`,
                      }}>
                        <p style={{ margin: 0, fontWeight: 700, color: inlineFeedback.correct ? '#2D5F3F' : '#8B2335', fontSize: 14 }}>
                          <i className={`isax ${inlineFeedback.correct ? 'isax-tick-circle' : 'isax-close-circle'} me-2`} />
                          {inlineFeedback.correct ? 'Correct!' : 'Incorrect — try again'}
                        </p>
                        {inlineFeedback.explanation && (
                          <p style={{ margin: '6px 0 0', color: 'var(--lx-text-muted)', fontSize: 13 }}>{inlineFeedback.explanation}</p>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      {!inlineFeedback ? (
                        <button
                          type="button"
                          className="lx-btn lx-btn-gold"
                          disabled={inlineSelectedIds.length === 0 || inlineIsChecking}
                          onClick={handleInlineCheck}
                          style={{ fontSize: 14, padding: '10px 24px', gap: 8 }}
                        >
                          {inlineIsChecking
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="isax isax-tick-circle" />}
                          Check Answer
                        </button>
                      ) : inlineFeedback.correct ? (
                        isLast ? (
                          <button
                            type="button"
                            className="lx-btn lx-btn-gold"
                            onClick={handleInlineFinalSubmit}
                            style={{ fontSize: 14, padding: '10px 24px', gap: 8 }}
                          >
                            <i className="isax isax-send-2" /> Submit Quiz
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="lx-btn lx-btn-gold"
                            onClick={handleInlineNext}
                            style={{ fontSize: 14, padding: '10px 24px', gap: 8 }}
                          >
                            Next <i className="isax isax-arrow-right-3" />
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          className="lx-btn lx-btn-outline"
                          onClick={handleInlineRetry}
                          style={{ fontSize: 14, padding: '10px 24px', gap: 8 }}
                        >
                          <i className="isax isax-refresh" /> Try Again
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}

            </div>{/* /padding */}
          </div>{/* /card */}
        </div>
      )}{/* /overlay */}

    </>
  );
};

export default CourseWatch;
