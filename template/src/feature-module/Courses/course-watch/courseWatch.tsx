import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import courseService from '../../../services/api/course.service';
import quizService from '../../../services/api/quiz.service';
import {
  Course, CourseLesson, CourseModule,
  LessonDetail, LessonResource, Quiz, QuizAttempt,
} from '../../../services/api/types';
import { all_routes } from '../../router/all_routes';
import { getFileUrl } from '../../../environment';
import { useAppSelector } from '../../../core/redux/hooks';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDuration = (seconds?: number) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};
const flatLessons = (mods: CourseModule[]): CourseLesson[] =>
  mods.flatMap(m => m.lessons ?? []);

// ─── Design tokens ────────────────────────────────────────────────────────────
const DARK_BG    = '#0e0508';
const SIDEBAR_BG = 'linear-gradient(180deg,#130710 0%,#1e0c13 55%,#2b0f1a 100%)';
const GOLD       = '#C5973E';
const GOLD_L     = '#DEBB6B';
const BURG       = '#651C32';
const BURG_D     = '#8B2335';
const IVORY      = '#F7F4EE';
const WHITE      = '#ffffff';

// ─── Panel styles (used in overview tab) ─────────────────────────────────────
const panelStyle: React.CSSProperties = {
  background: WHITE,
  borderRadius: 14,
  padding: 22,
  boxShadow: '0 2px 20px rgba(78,20,32,0.06)',
  border: '1px solid rgba(197,151,62,0.1)',
};
const panelTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display',Georgia,serif",
  fontSize: 16,
  fontWeight: 800,
  color: '#2C1810',
  marginBottom: 14,
  paddingBottom: 10,
  borderBottom: '2px solid rgba(197,151,62,0.12)',
};

// ─── Component ────────────────────────────────────────────────────────────────
const CourseWatch: React.FC = () => {
  const { t } = useTranslation()
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate       = useNavigate();
  const routes         = all_routes;
  const { user }       = useAppSelector(s => s.auth);

  // Course state
  const [course,          setCourse]          = useState<Course | null>(null);
  const [modules,         setModules]         = useState<CourseModule[]>([]);
  const [selectedLesson,  setSelectedLesson]  = useState<CourseLesson | null>(null);
  const [lessonDetail,    setLessonDetail]    = useState<LessonDetail | null>(null);
  const [videoUrl,        setVideoUrl]        = useState<string | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [lessonLoading,   setLessonLoading]   = useState(false);
  const [error,           setError]           = useState('');
  const [completedIds,    setCompletedIds]    = useState<Set<string>>(new Set());
  const [openModuleIds,   setOpenModuleIds]   = useState<Set<string>>(new Set());
  const [markingDone,     setMarkingDone]     = useState(false);
  const [activeTab,       setActiveTab]       = useState<'overview'|'resources'>('overview');
  const [courseComplete,  setCourseComplete]  = useState(false);

  // Resource viewer
  const [activeRes,       setActiveRes]       = useState<LessonResource | null>(null);
  const [pdfBlobUrl,      setPdfBlobUrl]      = useState<string | null>(null);
  const [pdfBlobLoading,  setPdfBlobLoading]  = useState(false);
  const [pdfBlobError,    setPdfBlobError]    = useState(false);

  // Quiz panel state
  const [lessonQuiz,      setLessonQuiz]      = useState<Quiz | null>(null);
  const [quizLoading,     setQuizLoading]     = useState(false);
  const [quizAttempts,    setQuizAttempts]    = useState<QuizAttempt[]>([]);

  // Inline quiz overlay
  type QuizPhase = 'loading'|'error'|'quiz'|'result'|'violation';
  type QuizAnswer = { questionId: string; selectedOptionIds: string[] };
  type QResult    = { score: number; totalPoints: number; percentage: number; passed: boolean; violated: boolean };
  type QQuestion  = { id: string; type: string; text: string; points: number; orderIndex: number;
                      options: { id: string; text: string; isCorrect: boolean|null; orderIndex: number }[] };
  type QData      = { id: string; title: string; description: string; passingScore: number;
                      duration: number; shuffleQuestions: boolean; totalPoints: number; questions: QQuestion[] };

  const [quizOpen,    setQuizOpen]    = useState(false);
  const [quizPhase,   setQuizPhase]   = useState<QuizPhase>('loading');
  const [quizErr,     setQuizErr]     = useState('');
  const [quizData,    setQuizData]    = useState<QData | null>(null);
  const [attemptId,   setAttemptId]   = useState<string | null>(null);
  const [endsAt,      setEndsAt]      = useState<Date | null>(null);
  const [qIdx,        setQIdx]        = useState(0);
  const [answers,     setAnswers]     = useState<QuizAnswer[]>([]);
  const [qResult,     setQResult]     = useState<QResult | null>(null);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [submitting,  setSubmitting]  = useState(false);

  const attemptIdRef  = useRef<string | null>(null);
  const answersRef    = useRef<QuizAnswer[]>([]);
  const quizPhaseRef  = useRef<QuizPhase>('loading');
  const videoRef      = useRef<HTMLVideoElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load course ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!courseSlug) return;
    (async () => {
      setLoading(true); setError('');
      try {
        const c = await courseService.getCourseBySlug(courseSlug);
        setCourse(c);
        const mods = await courseService.getCourseCurriculum(c.id);
        setModules(mods);
        setOpenModuleIds(new Set(mods.map(m => m.id)));
        const done = new Set<string>();
        try {
          const ids = await courseService.getMyProgress(c.id);
          ids.forEach(id => done.add(id));
        } catch {
          mods.forEach(m => (m.lessons ?? []).forEach(l => { if (l.isCompleted) done.add(l.id); }));
        }
        setCompletedIds(done);
        const total = mods.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
        setCourseComplete(done.size > 0 && done.size === total);
        const all  = flatLessons(mods);
        const pick = all.find(l => !done.has(l.id)) ?? all[0] ?? null;
        if (pick) doSelectLesson(pick);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Failed to load course.');
      } finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug]);

  // ── Select a lesson ───────────────────────────────────────────────────────
  const doSelectLesson = useCallback(async (lesson: CourseLesson) => {
    setSelectedLesson(lesson);
    setLessonDetail(null);
    setVideoUrl(null);
    setLessonLoading(true);
    setActiveTab('overview');
    setLessonQuiz(null);
    setQuizAttempts([]);
    setActiveRes(null);

    if (lesson.contentType === 'QUIZ') {
      setQuizLoading(true);
      quizService.getStudentQuizByLessonId(lesson.id)
        .then(async q => {
          setLessonQuiz(q);
          if (q?.id) quizService.getMyQuizAttempts(q.id).then(a => setQuizAttempts(a)).catch(() => {});
        })
        .catch(() => setLessonQuiz(null))
        .finally(() => setQuizLoading(false));
    }

    try {
      const detail = await courseService.getLessonDetail(lesson.id);
      setLessonDetail(detail);
      if (detail.contentType === 'VIDEO') {
        if (detail.videoUrl) setVideoUrl(detail.videoUrl);
        else if (detail.muxPlaybackId) {
          try { const { videoUrl: u } = await courseService.getLessonVideoUrl(lesson.id); setVideoUrl(u); }
          catch { setVideoUrl(null); }
        }
      }
    } catch { setLessonDetail(null); }
    finally { setLessonLoading(false); }
  }, []);

  // ── Refresh progress ──────────────────────────────────────────────────────
  const refreshProgress = useCallback(async () => {
    if (!course?.id) return;
    try {
      const [mods, ids] = await Promise.all([
        courseService.getCourseCurriculum(course.id),
        courseService.getMyProgress(course.id).catch(() => [] as string[]),
      ]);
      setModules(mods);
      const done = new Set<string>(ids);
      if (!done.size) mods.forEach(m => (m.lessons ?? []).forEach(l => { if (l.isCompleted) done.add(l.id); }));
      setCompletedIds(done);
      const total = mods.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
      setCourseComplete(done.size > 0 && done.size === total);
      if (selectedLesson?.contentType === 'QUIZ' && lessonQuiz?.id)
        quizService.getMyQuizAttempts(lessonQuiz.id).then(a => setQuizAttempts(a)).catch(() => {});
    } catch { /* ignore */ }
  }, [course?.id, selectedLesson, lessonQuiz?.id]);

  // ── PDF blob fetch (bypasses X-Frame-Options entirely) ────────────────────
  useEffect(() => {
    // Revoke previous blob URL to free memory
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
    setPdfBlobError(false);

    if (!activeRes) return;
    const ext = activeRes.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext !== 'pdf') return;

    const url = getFileUrl(activeRes.url) ?? activeRes.url;
    let cancelled = false;
    setPdfBlobLoading(true);

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed');
        return r.blob();
      })
      .then(blob => {
        if (cancelled) return;
        setPdfBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => { if (!cancelled) setPdfBlobError(true); })
      .finally(() => { if (!cancelled) setPdfBlobLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRes]);

  // Revoke blob URL on component unmount
  useEffect(() => () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); }, [pdfBlobUrl]);

  // ── Refs sync ─────────────────────────────────────────────────────────────
  useEffect(() => { attemptIdRef.current  = attemptId;  }, [attemptId]);
  useEffect(() => { answersRef.current    = answers;    }, [answers]);
  useEffect(() => { quizPhaseRef.current  = quizPhase;  }, [quizPhase]);

  useEffect(() => {
    const fn = () => { if (!document.hidden && !quizOpen) refreshProgress(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, [refreshProgress, quizOpen]);

  // ── Quiz timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quizOpen || quizPhase !== 'quiz' || !endsAt) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, Math.round((endsAt.getTime() - Date.now()) / 1000));
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(iv);
        const aid = attemptIdRef.current; const acc = answersRef.current;
        if (aid) quizService.submitAttempt(aid, acc, false).then((r: any) => { setQResult(r); setQuizPhase('result'); }).catch(() => setQuizPhase('result'));
        else setQuizPhase('result');
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [quizOpen, quizPhase, endsAt]);

  // ── Anti-cheat ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quizOpen || quizPhase !== 'quiz') return;
    const block = (e: Event) => e.preventDefault();
    const onVis = async () => {
      if (!document.hidden || quizPhaseRef.current !== 'quiz') return;
      const aid = attemptIdRef.current; const acc = answersRef.current;
      try { if (aid) { const r = await quizService.submitAttempt(aid, acc, true) as any; setQResult(r); } }
      catch { /* ignore */ } finally { setQuizPhase('violation'); }
    };
    ['copy','cut','paste','contextmenu','selectstart'].forEach(e => document.addEventListener(e, block));
    document.addEventListener('visibilitychange', onVis);
    return () => {
      ['copy','cut','paste','contextmenu','selectstart'].forEach(e => document.removeEventListener(e, block));
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [quizOpen, quizPhase]);

  // ── Open quiz ─────────────────────────────────────────────────────────────
  const openQuiz = useCallback(async (quizId: string) => {
    setQuizOpen(true); setQuizPhase('loading'); setQuizErr('');
    setQuizData(null); setAttemptId(null); setEndsAt(null);
    setQIdx(0); setAnswers([]); setQResult(null); setTimeLeft(0);
    try {
      const qd = await quizService.getQuizForStudent(quizId) as any;
      const qs = qd.shuffleQuestions ? [...(qd.questions ?? [])].sort(() => Math.random() - 0.5) : (qd.questions ?? []);
      setQuizData({ ...qd, questions: qs });
      const att = await quizService.startQuizAttempt(quizId);
      setAttemptId(att.attemptId);
      const ea = new Date(att.endsAt);
      setEndsAt(ea);
      setTimeLeft(Math.max(0, Math.round((ea.getTime() - Date.now()) / 1000)));
      setQuizPhase('quiz');
    } catch (e: any) { setQuizErr(e?.response?.data?.message ?? 'Failed to load quiz.'); setQuizPhase('error'); }
  }, []);

  const openReview = useCallback((a: QuizAttempt) => {
    setQuizOpen(true); setQuizData(null);
    setQResult({ score: a.score ?? 0, totalPoints: a.totalPoints ?? 0, percentage: a.percentage ?? 0, passed: a.passed ?? false, violated: a.violated ?? false });
    setQuizPhase('result');
  }, []);

  const closeQuiz = useCallback(async () => {
    if (quizPhaseRef.current === 'quiz') {
      const aid = attemptIdRef.current; const acc = answersRef.current;
      if (aid) { try { await quizService.submitAttempt(aid, acc, false); } catch { /* ignore */ } }
    }
    setQuizOpen(false); setQuizPhase('loading'); refreshProgress();
    if (lessonQuiz?.id) quizService.getMyQuizAttempts(lessonQuiz.id).then(a => setQuizAttempts(a)).catch(() => {});
  }, [refreshProgress, lessonQuiz?.id]);

  // ── Answer helpers ────────────────────────────────────────────────────────
  const curAnswers = (): string[] => {
    const q = quizData?.questions[qIdx]; if (!q) return [];
    return answers.find(a => a.questionId === q.id)?.selectedOptionIds ?? [];
  };
  const toggleOpt = (optId: string) => {
    const q = quizData?.questions[qIdx]; if (!q) return;
    const multi = q.type?.toUpperCase().includes('MULTIPLE');
    const cur   = curAnswers();
    const upd   = multi ? (cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId]) : [optId];
    setAnswers(prev => {
      const rest = prev.filter(a => a.questionId !== q.id);
      return upd.length ? [...rest, { questionId: q.id, selectedOptionIds: upd }] : rest;
    });
  };
  const finalSubmit = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try { const r = await quizService.submitAttempt(attemptId, answers, false) as any; setQResult(r); }
    catch { /* ignore */ } finally { setSubmitting(false); setQuizPhase('result'); }
  };
  const fmtTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ── Video progress tracking ───────────────────────────────────────────────
  const stopProgress = useCallback(() => {
    if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null; }
  }, []);
  useEffect(() => {
    if (!lessonDetail?.id || lessonDetail.contentType !== 'VIDEO') return;
    const lid = lessonDetail.id;
    stopProgress();
    progressTimer.current = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused) return;
      courseService.updateLessonProgress(lid, Math.floor(v.currentTime)).catch(() => {});
    }, 30_000);
    return stopProgress;
  }, [lessonDetail, stopProgress]);

  const onVideoEnded = useCallback(async () => {
    if (!lessonDetail) return;
    try {
      await courseService.completeLessonProgress(lessonDetail.id);
      setCompletedIds(prev => new Set(Array.from(prev).concat(lessonDetail.id)));
    } catch { /* ignore */ }
  }, [lessonDetail]);

  // ── Mark complete ─────────────────────────────────────────────────────────
  const markComplete = async () => {
    if (!selectedLesson || markingDone) return;
    setMarkingDone(true);
    try {
      await courseService.completeLessonProgress(selectedLesson.id);
      const newDone = new Set(Array.from(completedIds).concat(selectedLesson.id));
      setCompletedIds(newDone);
      const total = flatLessons(modules).length;
      if (newDone.size === total) setCourseComplete(true);
      const all = flatLessons(modules);
      const idx = all.findIndex(l => l.id === selectedLesson.id);
      if (idx !== -1 && idx + 1 < all.length) doSelectLesson(all[idx + 1]);
    } catch { /* ignore */ } finally { setMarkingDone(false); }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const goTo = (dir: 1|-1) => {
    if (!selectedLesson) return;
    const all = flatLessons(modules);
    const idx = all.findIndex(l => l.id === selectedLesson.id);
    const nxt = all[idx + dir];
    if (nxt) doSelectLesson(nxt);
  };
  const toggleModule = (id: string) =>
    setOpenModuleIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Resource viewer ───────────────────────────────────────────────────────
  const getViewer = (res: LessonResource) => {
    const url  = getFileUrl(res.url) ?? res.url;
    const ext  = res.name.split('.').pop()?.toLowerCase() ?? '';
    if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return { type: 'image',    url };
    if (ext === 'pdf')                                          return { type: 'pdf',      url };
    if (['mp4','webm','ogg','mov'].includes(ext))               return { type: 'video',    url };
    // Office docs: Google Docs viewer (read-only, no download in embed mode)
    if (['doc','docx','ppt','pptx','xls','xlsx'].includes(ext)) return { type: 'gdocs',    url: `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true` };
    return { type: 'none', url };
  };

  const getLessonIcon = (l: CourseLesson, locked: boolean, active: boolean, done: boolean) => {
    if (locked)               return { icon: 'fa-lock',          color: 'rgba(255,255,255,0.2)' };
    if (done)                 return { icon: 'fa-circle-check',  color: '#4ADE80' };
    if (active)               return { icon: 'fa-circle-play',   color: GOLD };
    if (l.contentType==='QUIZ') return { icon: 'fa-circle-question', color: '#F59E0B' };
    if (l.contentType==='TEXT') return { icon: 'fa-file-lines',      color: 'rgba(255,255,255,0.4)' };
    return { icon: 'fa-circle-play', color: 'rgba(255,255,255,0.3)' };
  };
  const isLocked = (lesson: CourseLesson) => {
    const all = flatLessons(modules);
    const idx = all.findIndex(l => l.id === lesson.id);
    return idx > 0 && !completedIds.has(all[idx - 1].id);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const allLessons    = flatLessons(modules);
  const totalLessons  = allLessons.length;
  const doneLessons   = completedIds.size;
  const pct           = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const isDone        = selectedLesson ? completedIds.has(selectedLesson.id) : false;
  const lessonIdx     = allLessons.findIndex(l => l.id === selectedLesson?.id);
  const hasPrev       = lessonIdx > 0;
  const hasNext       = lessonIdx !== -1 && lessonIdx + 1 < allLessons.length;
  const quizPassed    = quizAttempts.some(a => a.passed);
  const quizBest      = quizPassed ? Math.round(Math.max(...quizAttempts.filter(a => a.passed).map(a => a.percentage ?? 0))) : 0;
  const attLeft       = lessonQuiz ? (lessonQuiz.allowRetake ? Math.max(0,(lessonQuiz.maxAttempts??3)-quizAttempts.length) : quizAttempts.length===0?1:0) : 0;
  const canStart      = !quizPassed && attLeft > 0;

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', minHeight:'100vh', background:SIDEBAR_BG, alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:'50%', border:`4px solid rgba(197,151,62,0.15)`, borderTopColor:GOLD, animation:'spin 0.9s linear infinite' }} />
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, margin:0, fontWeight:600 }}>Loading course…</p>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', minHeight:'100vh', background:IVORY, alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', maxWidth:400, padding:32 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(139,35,53,0.08)', border:'2px solid rgba(139,35,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize:36, color:BURG_D }} />
        </div>
        <h4 style={{ fontFamily:"'Playfair Display',serif", color:'#2C1810', marginBottom:10 }}>{t('courseWatch.unableToLoad', 'Unable to Load Course')}</h4>
        <p style={{ color:'#9A8080', fontSize:14, marginBottom:24 }}>{error}</p>
        <Link to={routes.studentCourses} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:10, background:`linear-gradient(135deg,${BURG},${BURG_D})`, color:WHITE, textDecoration:'none', fontWeight:700, fontSize:14 }}>
          <i className="fa-solid fa-arrow-left" />{t('courseWatch.backToMyCourses', 'Back to My Courses')}
        </Link>
      </div>
    </div>
  );

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:IVORY, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside style={{
        width: 360, flexShrink: 0,
        background: SIDEBAR_BG,
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflowY: 'auto',
        boxShadow: '4px 0 40px rgba(0,0,0,0.35)',
        position: 'relative', zIndex: 10,
      }}>
        {/* Gold accent line */}
        <div style={{ height:3, background:`linear-gradient(90deg,${BURG},${GOLD},${BURG})`, flexShrink:0 }} />

        {/* ── Top area ── */}
        <div style={{ padding:'18px 18px 0', flexShrink:0 }}>
          {/* Brand + back */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <Link to={routes.homeone} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
              <div style={{ width:28, height:28, borderRadius:6, background:`linear-gradient(135deg,${BURG},${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fa-solid fa-crown" style={{ fontSize:12, color:WHITE }} />
              </div>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:800, color:WHITE, letterSpacing:'0.02em' }}>SARALÖWE</span>
            </Link>
            <button
              onClick={() => navigate(-1)}
              title={t('courseWatch.goBack', 'Go back')}
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.5)', transition:'all 0.2s' }}
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize:12 }} />
            </button>
          </div>

          {/* Course title */}
          <h6 style={{
            fontFamily:"'Playfair Display',serif", color:WHITE, fontWeight:800,
            fontSize:14, lineHeight:1.5, marginBottom:14,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
          }}>{course?.title}</h6>

          {/* Progress */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:800, color:GOLD, textTransform:'uppercase', letterSpacing:'0.08em' }}>{t('courseWatch.yourProgress', 'Your Progress')}</span>
              <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>{doneLessons}/{totalLessons} {t('common.lessons', 'lessons')}</span>
            </div>
            <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.07)', overflow:'hidden', position:'relative' }}>
              <div style={{
                position:'absolute', left:0, top:0, height:'100%', borderRadius:3,
                width:`${pct}%`, transition:'width 0.6s ease',
                background: pct === 100
                  ? 'linear-gradient(90deg,#22C55E,#4ADE80)'
                  : `linear-gradient(90deg,${BURG},${GOLD})`,
              }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{pct}% {t('courseWatch.complete', 'complete')}</span>
              {pct===100 && <span style={{ fontSize:10, color:'#4ADE80', fontWeight:700 }}>🎉 Done!</span>}
            </div>
          </div>

          {/* Course complete banner */}
          {courseComplete && (
            <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:10, background:'rgba(74,222,128,0.07)', border:'1px solid rgba(74,222,128,0.18)', display:'flex', alignItems:'center', gap:10 }}>
              <i className="fa-solid fa-trophy" style={{ color:GOLD, fontSize:18 }} />
              <div>
                <p style={{ margin:0, fontWeight:800, fontSize:12, color:'#4ADE80' }}>{t('courseWatch.courseComplete', 'Course Complete!')}</p>
                <p style={{ margin:0, fontSize:10, color:'rgba(74,222,128,0.65)' }}>{t('courseWatch.certificateGenerated', 'Certificate generated')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'rgba(255,255,255,0.04)', margin:'8px 18px 10px', flexShrink:0 }} />

        {/* ── Module accordion ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 10px 24px' }}>
          {modules.map((mod, mi) => {
            const isOpen  = openModuleIds.has(mod.id);
            const mDone   = (mod.lessons ?? []).filter(l => completedIds.has(l.id)).length;
            const mTotal  = (mod.lessons ?? []).length;
            const allDone = mDone === mTotal && mTotal > 0;

            return (
              <div key={mod.id} style={{ marginBottom:4 }}>
                {/* Module header */}
                <div
                  role="button"
                  onClick={() => toggleModule(mod.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'10px 12px', borderRadius:10, cursor:'pointer',
                    background: isOpen ? 'rgba(197,151,62,0.07)' : 'transparent',
                    border:`1px solid ${isOpen ? 'rgba(197,151,62,0.14)' : 'transparent'}`,
                    transition:'all 0.2s',
                  }}
                >
                  <div style={{
                    width:26, height:26, borderRadius:8, flexShrink:0,
                    background: allDone ? 'rgba(74,222,128,0.1)' : 'rgba(197,151,62,0.1)',
                    border:`1px solid ${allDone ? 'rgba(74,222,128,0.2)' : 'rgba(197,151,62,0.18)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:800,
                    color: allDone ? '#4ADE80' : GOLD,
                  }}>
                    {allDone ? <i className="fa-solid fa-check" style={{ fontSize:10 }} /> : mi+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:12, fontWeight:700, color:WHITE, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mod.title}</p>
                    <p style={{ margin:0, fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{mDone}/{mTotal} {t('common.lessons', 'lessons')}</p>
                  </div>
                  <i className={`fa-solid ${isOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{ fontSize:9, color:'rgba(255,255,255,0.25)', flexShrink:0 }} />
                </div>

                {/* Lessons */}
                {isOpen && (
                  <div style={{ paddingLeft:4, marginTop:2, display:'flex', flexDirection:'column', gap:1 }}>
                    {(mod.lessons ?? []).map(lesson => {
                      const isAct  = lesson.id === selectedLesson?.id;
                      const locked = isLocked(lesson);
                      const done   = completedIds.has(lesson.id);
                      const { icon, color } = getLessonIcon(lesson, locked, isAct, done);

                      return (
                        <div
                          key={lesson.id}
                          role="button"
                          onClick={() => { if (!locked) doSelectLesson(lesson); }}
                          title={locked ? 'Complete the previous lesson first' : lesson.title}
                          style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'8px 12px', borderRadius:8,
                            cursor: locked ? 'not-allowed' : 'pointer',
                            opacity: locked ? 0.4 : 1,
                            background: isAct ? `linear-gradient(135deg,rgba(197,151,62,0.16),rgba(197,151,62,0.06))` : 'transparent',
                            border:`1px solid ${isAct ? 'rgba(197,151,62,0.28)' : 'transparent'}`,
                            transition:'all 0.18s',
                          }}
                        >
                          <i className={`fa-solid ${icon}`} style={{ fontSize:14, color, flexShrink:0 }} />
                          <p style={{
                            flex:1, margin:0, fontSize:12,
                            fontWeight: isAct ? 700 : 500,
                            color: isAct ? GOLD_L : done ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          }}>{lesson.title}</p>
                          {!locked && fmtDuration(lesson.videoDurationSeconds) && (
                            <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)', flexShrink:0, fontWeight:700 }}>
                              {fmtDuration(lesson.videoDurationSeconds)}
                            </span>
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
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── Top bar (matches Saralöwe header style) ── */}
        <div style={{
          height:56, background:`linear-gradient(135deg,#130710 0%,#1e0c13 60%,#2b0f1a 100%)`,
          borderBottom:`1px solid rgba(197,151,62,0.1)`,
          display:'flex', alignItems:'center', padding:'0 24px',
          gap:16, flexShrink:0, boxShadow:'0 2px 20px rgba(0,0,0,0.25)',
        }}>
          {/* Course breadcrumb */}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
            <Link to={routes.homeone} style={{ color:'rgba(255,255,255,0.3)', textDecoration:'none', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, transition:'color 0.2s' }}>
              <i className="fa-solid fa-house" style={{ fontSize:11 }} />
              {t('sharedComponents.breadcrumb.home', 'Home')}
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }} />
            <Link to={routes.studentCourses} style={{ color:'rgba(255,255,255,0.3)', textDecoration:'none', fontSize:12, fontWeight:600, transition:'color 0.2s' }}>{t('nav.myCourses', 'My Courses')}</Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }} />
            <span style={{ color:GOLD, fontSize:12, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:260 }}>
              {selectedLesson?.title ?? course?.title ?? ''}
            </span>
          </div>

          {/* User pill */}
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:`linear-gradient(135deg,${BURG},${GOLD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:WHITE }}>
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{user.fullName}</span>
            </div>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {lessonLoading ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, minHeight:300 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', border:`4px solid rgba(197,151,62,0.15)`, borderTopColor:GOLD, animation:'spin 0.9s linear infinite' }} />
              <span style={{ color:'#9A8080', fontSize:14, fontWeight:600 }}>{t('courseWatch.loadingLesson', 'Loading lesson…')}</span>
            </div>
          ) : selectedLesson ? (
            <>
              {/* ── Media zone ── */}
              <div style={{ background:DARK_BG, flexShrink:0 }}>

                {/* VIDEO */}
                {selectedLesson.contentType === 'VIDEO' && (
                  <div style={{ aspectRatio:'16/9', position:'relative', background:'#000', maxHeight:'58vh' }}>
                    {lessonDetail?.muxPlaybackId ? (
                      <iframe
                        title={selectedLesson.title}
                        src={`https://player.mux.com/player.html?playback_id=${lessonDetail.muxPlaybackId}&metadata-video-title=${encodeURIComponent(selectedLesson.title)}`}
                        style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    ) : videoUrl ? (
                      <video ref={videoRef} src={videoUrl} controls
                        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }}
                        onEnded={onVideoEnded}
                      />
                    ) : (
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:'rgba(255,255,255,0.2)', gap:10 }}>
                        <i className="fa-solid fa-video-slash" style={{ fontSize:48 }} />
                        <span style={{ fontSize:13 }}>Video not available</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TEXT */}
                {selectedLesson.contentType === 'TEXT' && (
                  <div style={{ padding:'32px 48px', maxWidth:820 }}>
                    {lessonDetail?.textContent ? (
                      <div style={{ color:'rgba(255,255,255,0.82)', lineHeight:1.85, fontSize:15 }}
                        dangerouslySetInnerHTML={{ __html: lessonDetail.textContent }}
                      />
                    ) : (
                      <p style={{ color:'rgba(255,255,255,0.3)', fontSize:14 }}>No content available.</p>
                    )}
                  </div>
                )}

                {/* QUIZ */}
                {selectedLesson.contentType === 'QUIZ' && (
                  <div style={{ padding:'44px 52px', textAlign:'center', background: quizPassed ? 'linear-gradient(135deg,rgba(45,95,63,0.12),rgba(45,95,63,0.04))' : 'linear-gradient(135deg,rgba(197,151,62,0.07),rgba(101,28,50,0.07))' }}>
                    <div style={{ width:80, height:80, borderRadius:'50%', margin:'0 auto 18px', background: quizPassed ? 'rgba(74,222,128,0.1)' : 'rgba(197,151,62,0.1)', border:`2px solid ${quizPassed?'rgba(74,222,128,0.25)':'rgba(197,151,62,0.25)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className={`fa-solid ${quizPassed?'fa-trophy':'fa-circle-question'}`} style={{ fontSize:34, color:quizPassed?'#4ADE80':GOLD }} />
                    </div>
                    <h5 style={{ color:WHITE, fontWeight:800, fontSize:18, marginBottom:8 }}>{selectedLesson.title}</h5>

                    {quizLoading ? (
                      <div><div style={{ width:26, height:26, borderRadius:'50%', border:`3px solid rgba(197,151,62,0.25)`, borderTopColor:GOLD, animation:'spin 1s linear infinite', margin:'16px auto 10px' }} /></div>
                    ) : lessonQuiz ? (
                      <>
                        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, marginBottom:16 }}>
                          <i className="fa-solid fa-list-check" style={{ marginRight:5, color:GOLD }} />{lessonQuiz.questionCount??0} questions
                          <span style={{ margin:'0 8px', opacity:0.3 }}>·</span>
                          <i className="fa-solid fa-clock" style={{ marginRight:5, color:GOLD }} />{lessonQuiz.duration??0} min
                          <span style={{ margin:'0 8px', opacity:0.3 }}>·</span>
                          Pass: {lessonQuiz.passingScore??70}%
                        </p>

                        {quizPassed && (
                          <div style={{ display:'inline-block', margin:'0 auto 16px', padding:'10px 22px', borderRadius:10, background:'rgba(74,222,128,0.09)', border:'1px solid rgba(74,222,128,0.22)' }}>
                            <p style={{ margin:0, fontWeight:800, color:'#4ADE80', fontSize:15 }}><i className="fa-solid fa-circle-check" style={{ marginRight:6 }} />Quiz Passed! 🎉</p>
                            <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(74,222,128,0.65)' }}>Best score: {quizBest}%</p>
                          </div>
                        )}

                        {quizAttempts.length > 0 && (
                          <div style={{ margin:'0 auto 18px', maxWidth:300, textAlign:'left' }}>
                            <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.25)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                              History ({quizAttempts.length}/{lessonQuiz.allowRetake?lessonQuiz.maxAttempts??'∞':1})
                            </p>
                            {quizAttempts.slice(0,4).map((a, i) => (
                              <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', borderRadius:6, marginBottom:4, background:a.passed?'rgba(74,222,128,0.06)':'rgba(139,35,53,0.08)', border:`1px solid ${a.passed?'rgba(74,222,128,0.14)':'rgba(139,35,53,0.18)'}` }}>
                                <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Attempt {quizAttempts.length-i}</span>
                                <span style={{ fontSize:13, fontWeight:700, color:a.passed?'#4ADE80':'#F87171' }}>{Math.round(a.percentage??0)}% <i className={`fa-solid ${a.passed?'fa-circle-check':'fa-circle-xmark'}`} style={{ fontSize:11 }} /></span>
                              </div>
                            ))}
                          </div>
                        )}

                        {lessonQuiz.status === 'PUBLISHED' ? (
                          canStart ? (
                            <button onClick={() => openQuiz(lessonQuiz.id)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 32px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${GOLD},#A67825)`, color:WHITE, fontWeight:800, fontSize:15, boxShadow:'0 6px 20px rgba(197,151,62,0.3)' }}>
                              <i className="fa-solid fa-play" />{quizAttempts.length===0?'Start Quiz':'Retake Quiz'}
                            </button>
                          ) : quizPassed ? (
                            <button onClick={() => quizAttempts[0] && openReview(quizAttempts[0])} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.65)', cursor:'pointer', fontWeight:600, fontSize:14 }}>
                              <i className="fa-solid fa-eye" />Review Results
                            </button>
                          ) : (
                            <p style={{ color:'#F87171', fontSize:13, display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                              <i className="fa-solid fa-ban" />No more attempts available
                            </p>
                          )
                        ) : (
                          <p style={{ color:GOLD, fontSize:13, display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                            <i className="fa-solid fa-circle-info" />Quiz not yet published
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginBottom:4 }}>The instructor hasn't linked a quiz to this lesson yet.</p>
                        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:12, marginBottom:20 }}>Check back soon or browse available quizzes.</p>
                        <Link to={routes.studentQuiz} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 22px', borderRadius:10, border:`1px solid rgba(197,151,62,0.3)`, background:'rgba(197,151,62,0.07)', color:GOLD, textDecoration:'none', fontWeight:700, fontSize:14 }}>
                          <i className="fa-solid fa-list" />Browse All Quizzes
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ── Lesson info bar ── */}
              <div style={{
                background:WHITE, padding:'14px 28px', flexShrink:0,
                borderBottom:`1px solid rgba(197,151,62,0.1)`,
                display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
                boxShadow:'0 2px 12px rgba(78,20,32,0.05)',
              }}>
                <div style={{ minWidth:0 }}>
                  <h5 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:800, color:'#2C1810', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {selectedLesson.title}
                  </h5>
                  <span style={{ fontSize:12, color:'#9A8080', fontWeight:600 }}>
                    Lesson {lessonIdx+1} of {totalLessons}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <button onClick={() => goTo(-1)} disabled={!hasPrev} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:8, border:`1.5px solid rgba(197,151,62,0.2)`, background:'transparent', color:hasPrev?BURG:'#c4b5b5', fontWeight:700, fontSize:13, cursor:hasPrev?'pointer':'not-allowed', transition:'all 0.2s' }}>
                    <i className="fa-solid fa-chevron-left" style={{ fontSize:10 }} />Prev
                  </button>
                  <button onClick={() => goTo(1)} disabled={!hasNext} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:8, border:`1.5px solid rgba(197,151,62,0.2)`, background:'transparent', color:hasNext?BURG:'#c4b5b5', fontWeight:700, fontSize:13, cursor:hasNext?'pointer':'not-allowed', transition:'all 0.2s' }}>
                    Next <i className="fa-solid fa-chevron-right" style={{ fontSize:10 }} />
                  </button>
                  {!isDone && selectedLesson.contentType !== 'QUIZ' && (
                    <button onClick={markComplete} disabled={markingDone} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#2D5F3F,#22C55E)', color:WHITE, fontWeight:700, fontSize:13, boxShadow:'0 4px 12px rgba(45,95,63,0.28)', opacity:markingDone?0.7:1, transition:'all 0.2s' }}>
                      {markingDone ? <div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:WHITE, animation:'spin 0.8s linear infinite' }} /> : <i className="fa-solid fa-circle-check" />}
                      Mark Complete
                    </button>
                  )}
                  {isDone && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(74,222,128,0.09)', border:'1px solid rgba(74,222,128,0.22)', color:'#15803D', fontSize:13, fontWeight:700 }}>
                      <i className="fa-solid fa-circle-check" />Completed
                    </div>
                  )}
                </div>
              </div>

              {/* ── Tabs ── */}
              <div style={{ background:IVORY, padding:'18px 28px 0', flexShrink:0, borderBottom:`1px solid rgba(197,151,62,0.08)` }}>
                <div style={{ display:'inline-flex', gap:3, background:WHITE, borderRadius:10, padding:4, boxShadow:'0 2px 14px rgba(78,20,32,0.06)', border:`1px solid rgba(197,151,62,0.1)` }}>
                  {(['overview','resources'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      padding:'8px 22px', border:'none', borderRadius:7, cursor:'pointer',
                      fontWeight:700, fontSize:13, textTransform:'capitalize',
                      background: activeTab===tab ? `linear-gradient(135deg,${BURG},${BURG_D})` : 'transparent',
                      color: activeTab===tab ? WHITE : '#7A6060',
                      boxShadow: activeTab===tab ? '0 4px 14px rgba(101,28,50,0.25)' : 'none',
                      transition:'all 0.2s', position:'relative',
                    }}>
                      {tab}
                      {tab==='resources' && (lessonDetail?.resources?.length??0)>0 && (
                        <span style={{ position:'absolute', top:-6, right:-4, background:GOLD, color:WHITE, fontSize:9, fontWeight:800, borderRadius:20, padding:'1px 5px', lineHeight:1.4 }}>
                          {lessonDetail!.resources.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Tab content ── */}
              <div style={{ flex:1, padding:'24px 28px 40px', background:IVORY }}>

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div style={{ maxWidth:780, display:'flex', flexDirection:'column', gap:18 }}>
                    {lessonDetail?.description && (
                      <div style={panelStyle}>
                        <h6 style={panelTitle}>About this lesson</h6>
                        <p style={{ color:'#4b5563', lineHeight:1.8, margin:0, fontSize:14 }}>{lessonDetail.description}</p>
                      </div>
                    )}
                    {course?.shortDescription && (
                      <div style={panelStyle}>
                        <h6 style={panelTitle}>About this course</h6>
                        <p style={{ color:'#4b5563', lineHeight:1.8, margin:0, fontSize:14 }}>{course.shortDescription}</p>
                      </div>
                    )}
                    {course?.whatYouWillLearn && (
                      <div style={{ ...panelStyle, background:`linear-gradient(135deg,rgba(197,151,62,0.03),${WHITE})`, border:`1px solid rgba(197,151,62,0.1)` }}>
                        <h6 style={panelTitle}>What You'll Learn</h6>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'8px 16px' }}>
                          {course.whatYouWillLearn.split('\n').filter(Boolean).map((item, i) => (
                            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                              <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                                <i className="fa-solid fa-check" style={{ color:'#10B981', fontSize:9 }} />
                              </div>
                              <span style={{ color:'#374151', fontSize:13, lineHeight:1.55 }}>{item.replace(/^[-•*]\s*/,'')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {course?.requirements && (
                      <div style={panelStyle}>
                        <h6 style={panelTitle}>Requirements</h6>
                        <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
                          {course.requirements.split('\n').filter(Boolean).map((item, i) => (
                            <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, color:'#4b5563', fontSize:13 }}>
                              <div style={{ width:5, height:5, borderRadius:'50%', background:GOLD, flexShrink:0, marginTop:7 }} />
                              {item.replace(/^[-•*]\s*/,'')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!lessonDetail?.description && !course?.shortDescription && !course?.whatYouWillLearn && !course?.requirements && (
                      <div style={{ ...panelStyle, textAlign:'center', padding:'52px 24px', color:'#9A8080' }}>
                        <i className="fa-regular fa-file-lines" style={{ fontSize:44, display:'block', marginBottom:12, opacity:0.25 }} />
                        <p style={{ margin:0, fontWeight:600 }}>No overview content for this lesson.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* RESOURCES */}
                {activeTab === 'resources' && (
                  <div style={{ maxWidth:'100%' }}>
                    {(lessonDetail?.resources?.length??0) === 0 ? (
                      <div style={{ ...panelStyle, textAlign:'center', padding:'56px 24px', color:'#9A8080' }}>
                        <i className="fa-regular fa-folder-open" style={{ fontSize:52, display:'block', marginBottom:14, opacity:0.25 }} />
                        <p style={{ margin:0, fontWeight:700, fontSize:15 }}>No resources for this lesson</p>
                        <p style={{ margin:'6px 0 0', fontSize:13, opacity:0.6 }}>The instructor hasn't uploaded any files yet</p>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {lessonDetail!.resources.map((res: LessonResource) => {
                          const ext = res.name.split('.').pop()?.toLowerCase() ?? '';
                          const isSel = activeRes?.id === res.id;
                          const fileMap: Record<string, { icon: string; color: string; bg: string }> = {
                            pdf:  { icon:'fa-file-pdf',       color:'#EF4444', bg:'rgba(239,68,68,0.08)' },
                            doc:  { icon:'fa-file-word',      color:'#2563EB', bg:'rgba(37,99,235,0.08)' },
                            docx: { icon:'fa-file-word',      color:'#2563EB', bg:'rgba(37,99,235,0.08)' },
                            ppt:  { icon:'fa-file-powerpoint',color:'#F97316', bg:'rgba(249,115,22,0.08)' },
                            pptx: { icon:'fa-file-powerpoint',color:'#F97316', bg:'rgba(249,115,22,0.08)' },
                            xls:  { icon:'fa-file-excel',     color:'#16A34A', bg:'rgba(22,163,74,0.08)' },
                            xlsx: { icon:'fa-file-excel',     color:'#16A34A', bg:'rgba(22,163,74,0.08)' },
                            txt:  { icon:'fa-file-lines',     color:'#6B7280', bg:'rgba(107,114,128,0.08)' },
                            md:   { icon:'fa-file-lines',     color:'#6B7280', bg:'rgba(107,114,128,0.08)' },
                            png:  { icon:'fa-file-image',     color:'#8B5CF6', bg:'rgba(139,92,246,0.08)' },
                            jpg:  { icon:'fa-file-image',     color:'#8B5CF6', bg:'rgba(139,92,246,0.08)' },
                            jpeg: { icon:'fa-file-image',     color:'#8B5CF6', bg:'rgba(139,92,246,0.08)' },
                            gif:  { icon:'fa-file-image',     color:'#8B5CF6', bg:'rgba(139,92,246,0.08)' },
                            mp4:  { icon:'fa-file-video',     color:'#0EA5E9', bg:'rgba(14,165,233,0.08)' },
                          };
                          const fc = fileMap[ext] ?? { icon:'fa-file', color:BURG, bg:'rgba(101,28,50,0.06)' };
                          const sz = res.size ? (res.size>1024*1024?`${(res.size/1024/1024).toFixed(1)} MB`:`${Math.round(res.size/1024)} KB`) : '';
                          const _fileUrl = getFileUrl(res.url) ?? res.url;

                          return (
                            <div key={res.id}>
                              {/* File card */}
                              <div
                                onClick={() => setActiveRes(isSel ? null : res)}
                                style={{
                                  display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                                  borderRadius:12, cursor:'pointer',
                                  background: isSel ? 'rgba(101,28,50,0.04)' : WHITE,
                                  border:`1.5px solid ${isSel?'rgba(101,28,50,0.2)':'rgba(197,151,62,0.12)'}`,
                                  boxShadow: isSel ? '0 4px 20px rgba(101,28,50,0.1)' : '0 1px 6px rgba(78,20,32,0.05)',
                                  transition:'all 0.2s',
                                }}
                              >
                                <div style={{ width:50, height:50, borderRadius:12, flexShrink:0, background:fc.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <i className={`fa-solid ${fc.icon}`} style={{ fontSize:22, color:fc.color }} />
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#2C1810', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{res.name}</p>
                                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                                    <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:4, background:fc.bg, color:fc.color, textTransform:'uppercase', letterSpacing:'0.3px' }}>{ext||res.type}</span>
                                    {sz && <span style={{ fontSize:11, color:'#9A8080' }}>{sz}</span>}
                                  </div>
                                </div>
                                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                                  <button onClick={e => { e.stopPropagation(); setActiveRes(isSel?null:res); }} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${isSel?'rgba(101,28,50,0.2)':'rgba(197,151,62,0.2)'}`, background:isSel?'rgba(101,28,50,0.06)':'rgba(197,151,62,0.06)', color:isSel?BURG:GOLD, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14 }} title={isSel?'Close preview':'Preview'}>
                                    <i className={`fa-solid ${isSel?'fa-chevron-up':'fa-eye'}`} />
                                  </button>
                                </div>
                              </div>

                              {/* Inline viewer */}
                              {isSel && (() => {
                                const v = getViewer(res);
                                return (
                                  <div style={{ marginTop:12, width:'80%', marginLeft:'auto', marginRight:'auto', borderRadius:12, overflow:'hidden', border:`1.5px solid rgba(101,28,50,0.15)`, boxShadow:'0 8px 30px rgba(78,20,32,0.1)', background:WHITE }}>
                                    {/* Toolbar */}
                                    <div style={{ padding:'10px 16px', background:'rgba(101,28,50,0.03)', borderBottom:'1px solid rgba(197,151,62,0.1)', display:'flex', alignItems:'center', gap:10 }}>
                                      <i className={`fa-solid ${fc.icon}`} style={{ color:fc.color, fontSize:14 }} />
                                      <span style={{ fontWeight:700, fontSize:13, color:'#2C1810' }}>{res.name}</span>
                                      <span style={{ marginLeft:'auto', fontSize:11, color:'#9A8080', display:'flex', alignItems:'center', gap:4 }}>
                                        <i className="fa-solid fa-lock" style={{ fontSize:10, color:GOLD }} />
                                        Read only
                                      </span>
                                    </div>
                                    {/* Content */}
                                    {v.type==='image' && (
                                      <div style={{ background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', minHeight:280, padding:16 }}>
                                        <img src={v.url} alt={res.name} style={{ maxWidth:'100%', maxHeight:520, borderRadius:8, objectFit:'contain' }} />
                                      </div>
                                    )}
                                    {v.type==='pdf' && (
                                      <div style={{ width:'100%', height:780, background:'#525659', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                                        {pdfBlobLoading && (
                                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                                            <div style={{ width:44, height:44, borderRadius:'50%', border:'4px solid rgba(197,151,62,0.2)', borderTopColor:'#C5973E', animation:'spin 0.9s linear infinite' }} />
                                            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13, fontWeight:600 }}>Loading PDF…</span>
                                          </div>
                                        )}
                                        {!pdfBlobLoading && pdfBlobError && (
                                          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.5)', padding:32 }}>
                                            <i className="fa-solid fa-circle-exclamation" style={{ fontSize:40, display:'block', marginBottom:12, color:'#F87171' }} />
                                            <p style={{ margin:0, fontWeight:700, fontSize:14 }}>Unable to load PDF</p>
                                            <p style={{ margin:'6px 0 0', fontSize:12, opacity:0.6 }}>Please try again later</p>
                                          </div>
                                        )}
                                        {!pdfBlobLoading && !pdfBlobError && pdfBlobUrl && (
                                          /* Blob URL is always same-origin — X-Frame-Options never applies.
                                             #toolbar=0&navpanes=0 hides Chrome/Firefox download+print toolbar
                                             on blob: URLs (safe because blob: is same-origin). */
                                          <object
                                            data={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                            type="application/pdf"
                                            width="100%"
                                            height="100%"
                                            style={{ display:'block', border:'none', flex:1 }}
                                            aria-label={res.name}
                                          >
                                            <iframe
                                              title={res.name}
                                              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                              style={{ width:'100%', height:'100%', border:'none', display:'block' }}
                                            />
                                          </object>
                                        )}
                                      </div>
                                    )}
                                    {v.type==='gdocs' && (
                                      <iframe src={v.url} title={res.name} style={{ width:'100%', height:560, border:'none', display:'block' }} />
                                    )}
                                    {v.type==='video' && (
                                      <div style={{ background:'#000' }}>
                                        <video src={v.url} controls style={{ width:'100%', maxHeight:420, display:'block' }} />
                                      </div>
                                    )}
                                    {v.type==='none' && (
                                      <div style={{ padding:'48px 24px', textAlign:'center', color:'#9A8080' }}>
                                        <i className={`fa-solid ${fc.icon}`} style={{ fontSize:52, color:fc.color, display:'block', marginBottom:16, opacity:0.5 }} />
                                        <p style={{ fontWeight:700, fontSize:15, color:'#2C1810', marginBottom:8 }}>Preview not available for this file type</p>
                                        <p style={{ fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                                          <i className="fa-solid fa-lock" style={{ color:GOLD }} />
                                          This resource is available for reading on the platform only
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:'#9A8080', gap:12, minHeight:400 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(197,151,62,0.06)', border:`2px solid rgba(197,151,62,0.12)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="fa-solid fa-circle-play" style={{ fontSize:30, color:'rgba(197,151,62,0.4)' }} />
              </div>
              <p style={{ margin:0, fontSize:14, fontWeight:600 }}>Select a lesson to begin</p>
            </div>
          )}
        </div>
      </main>

      {/* ══════════ QUIZ OVERLAY ══════════ */}
      {quizOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(8,3,12,0.92)', backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'28px 16px' }}>
          <div style={{ width:'100%', maxWidth:720, background:WHITE, borderRadius:20, boxShadow:'0 24px 80px rgba(0,0,0,0.5)', border:`1px solid rgba(197,151,62,0.15)`, overflow:'hidden', position:'relative' }}>
            {quizPhase !== 'quiz' && (
              <button onClick={closeQuiz} style={{ position:'absolute', top:14, right:14, zIndex:2, background:'rgba(107,29,42,0.06)', border:'1px solid rgba(107,29,42,0.12)', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:BURG }}>
                <i className="fa-solid fa-xmark" style={{ fontSize:16 }} />
              </button>
            )}
            <div style={{ padding:'30px 34px' }}>

              {quizPhase === 'loading' && (
                <div style={{ textAlign:'center', padding:'56px 0' }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', border:`4px solid rgba(197,151,62,0.15)`, borderTopColor:GOLD, animation:'spin 0.9s linear infinite', margin:'0 auto 16px' }} />
                  <p style={{ color:'#9A8080', fontSize:15 }}>Preparing your quiz…</p>
                </div>
              )}

              {quizPhase === 'error' && (
                <div style={{ textAlign:'center', padding:'48px 0' }}>
                  <i className="fa-solid fa-circle-xmark" style={{ fontSize:54, color:BURG_D, display:'block', marginBottom:16 }} />
                  <h5 style={{ color:BURG_D, marginBottom:8 }}>Unable to Load Quiz</h5>
                  <p style={{ color:'#9A8080', marginBottom:28, fontSize:14 }}>{quizErr}</p>
                  <button onClick={closeQuiz} style={{ padding:'10px 28px', borderRadius:10, border:`1.5px solid rgba(101,28,50,0.2)`, background:'transparent', color:BURG, fontWeight:700, cursor:'pointer', fontSize:14 }}>Close</button>
                </div>
              )}

              {quizPhase === 'violation' && (
                <div style={{ textAlign:'center', padding:'48px 0' }}>
                  <div style={{ width:84, height:84, borderRadius:'50%', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', background:`rgba(197,151,62,0.09)`, border:`3px solid rgba(197,151,62,0.22)` }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ fontSize:40, color:GOLD }} />
                  </div>
                  <h3 style={{ fontSize:22, fontWeight:800, color:BURG_D, marginBottom:12 }}>Quiz Terminated</h3>
                  <p style={{ color:'#9A8080', fontSize:14, marginBottom:6 }}>You switched tabs. Score submitted as <strong style={{ color:BURG_D }}>0</strong>.</p>
                  <p style={{ color:'#9A8080', fontSize:12, marginBottom:28 }}>This action is logged and cannot be reversed.</p>
                  <button onClick={closeQuiz} style={{ padding:'10px 28px', borderRadius:10, border:`1.5px solid rgba(101,28,50,0.2)`, background:'transparent', color:BURG, fontWeight:700, cursor:'pointer' }}>Back to Course</button>
                </div>
              )}

              {quizPhase === 'result' && qResult && (
                <div style={{ maxWidth:540, margin:'0 auto' }}>
                  <div style={{ textAlign:'center', marginBottom:26 }}>
                    <div style={{ width:90, height:90, borderRadius:'50%', margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', background:qResult.passed?'rgba(45,95,63,0.09)':'rgba(139,35,53,0.07)', border:`3px solid ${qResult.passed?'rgba(45,95,63,0.22)':'rgba(139,35,53,0.18)'}` }}>
                      <i className={`fa-solid ${qResult.passed?'fa-circle-check':'fa-circle-xmark'}`} style={{ fontSize:46, color:qResult.passed?'#2D5F3F':BURG_D }} />
                    </div>
                    <h3 style={{ fontSize:26, fontWeight:800, margin:'0 0 8px', color:qResult.passed?'#2D5F3F':BURG_D }}>
                      {qResult.passed?'🎉 You Passed!':'Not Passed'}
                    </h3>
                    <p style={{ color:'#9A8080', fontSize:14, margin:0 }}>
                      {qResult.passed?"Congratulations! You've completed this quiz.":`You need ${quizData?.passingScore??70}% to pass.`}
                    </p>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:22 }}>
                    {[
                      { label:'Points Earned', value:qResult.score,                                         color:qResult.passed?'#2D5F3F':BURG_D },
                      { label:'Total Points',  value:qResult.totalPoints,                                   color:GOLD },
                      { label:'Your Score',    value:`${Math.round((qResult.percentage??0)*10)/10}%`,       color:qResult.passed?'#2D5F3F':BURG_D },
                    ].map(c => (
                      <div key={c.label} style={{ padding:'16px 10px', borderRadius:12, textAlign:'center', background:`${c.color}10`, border:`1px solid ${c.color}22` }}>
                        <div style={{ fontSize:28, fontWeight:800, color:c.color, lineHeight:1.1, marginBottom:4 }}>{c.value}</div>
                        <div style={{ fontSize:11, color:'#9A8080', fontWeight:600 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height:10, borderRadius:5, background:'rgba(107,29,42,0.06)', overflow:'hidden', marginBottom:22, position:'relative' }}>
                    <div style={{ position:'absolute', left:`${quizData?.passingScore??70}%`, top:0, bottom:0, width:2, background:'rgba(107,29,42,0.22)', zIndex:2 }} />
                    <div style={{ height:'100%', borderRadius:5, width:`${Math.min(Math.round((qResult.percentage??0)*10)/10,100)}%`, background:qResult.passed?'linear-gradient(90deg,#2D5F3F,#4ADE80)':`linear-gradient(90deg,${BURG_D},${GOLD})`, transition:'width 0.6s' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'center' }}>
                    <button onClick={closeQuiz} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 28px', borderRadius:10, border:`1.5px solid rgba(101,28,50,0.2)`, background:'transparent', color:BURG, fontWeight:700, cursor:'pointer', fontSize:14 }}>
                      <i className="fa-solid fa-arrow-left" />Back to Course
                    </button>
                  </div>
                </div>
              )}

              {quizPhase === 'quiz' && quizData && (() => {
                const Q         = quizData.questions[qIdx];
                if (!Q) return null;
                const totalQ    = quizData.questions.length;
                const answered  = answers.length;
                const warn      = timeLeft < 60 && timeLeft > 0;
                const isMulti   = Q.type?.toUpperCase().includes('MULTIPLE');
                const isFirst   = qIdx === 0;
                const isLast    = qIdx === totalQ - 1;
                const curAns    = curAnswers();
                const allAns    = answered === totalQ;

                return (
                  <>
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                      <div>
                        <h5 style={{ margin:0, fontWeight:800, fontSize:17, fontFamily:"'Playfair Display',serif", color:'#2C1810' }}>{quizData.title}</h5>
                        <span style={{ color:'#9A8080', fontSize:12 }}>Q {qIdx+1}/{totalQ} · <span style={{ color:answered===totalQ?'#2D5F3F':'#9A8080' }}>{answered}/{totalQ} answered</span></span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, border:`1.5px solid ${warn?BURG_D:'rgba(197,151,62,0.2)'}`, background:warn?'rgba(139,35,53,0.05)':'rgba(197,151,62,0.04)', fontWeight:800, fontSize:16, color:warn?BURG_D:'#2C1810' }}>
                        <i className="fa-solid fa-stopwatch" style={{ fontSize:14, color:warn?BURG_D:GOLD }} />
                        {fmtTime(timeLeft)}
                      </div>
                    </div>

                    {/* Question dots */}
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:16 }}>
                      {quizData.questions.map((_: any, i: number) => {
                        const isAns = answers.some(a => a.questionId === quizData.questions[i].id);
                        const isCur = i === qIdx;
                        return (
                          <button key={i} onClick={() => setQIdx(i)} style={{ width:32, height:32, borderRadius:7, border:'none', cursor:'pointer', fontSize:11, fontWeight:800, background:isCur?BURG:isAns?'rgba(45,95,63,0.1)':'rgba(0,0,0,0.05)', color:isCur?WHITE:isAns?'#2D5F3F':'#9A8080', outline:isCur?`2px solid ${BURG}`:'none', outlineOffset:2, transition:'all 0.15s' }}>{i+1}</button>
                        );
                      })}
                    </div>

                    {/* Question */}
                    <div style={{ background:'rgba(101,28,50,0.02)', borderRadius:12, padding:'18px 22px', border:'1px solid rgba(197,151,62,0.1)', marginBottom:18 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:14 }}>
                        <h6 style={{ margin:0, lineHeight:1.55, fontWeight:700, fontSize:15, color:'#2C1810' }}>{Q.text}</h6>
                        <span style={{ flexShrink:0, padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:800, background:`rgba(197,151,62,0.1)`, color:GOLD }}>{Q.points} pt{Q.points!==1?'s':''}</span>
                      </div>
                      {isMulti && <p style={{ color:'#9A8080', fontSize:12, margin:'0 0 12px', display:'flex', alignItems:'center', gap:5 }}><i className="fa-solid fa-circle-info" /> Select all that apply</p>}
                      {Q.options.slice().sort((a:any,b:any)=>a.orderIndex-b.orderIndex).map((opt:any) => {
                        const isSel = curAns.includes(opt.id);
                        return (
                          <div key={opt.id} onClick={() => toggleOpt(opt.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', marginBottom:7, borderRadius:10, border:`2px solid ${isSel?BURG:'rgba(0,0,0,0.08)'}`, background:isSel?'rgba(101,28,50,0.04)':'rgba(255,255,255,0.7)', cursor:'pointer', transition:'all 0.15s', userSelect:'none' }}>
                            <div style={{ width:20, height:20, borderRadius:isMulti?5:'50%', border:`2px solid ${isSel?BURG:'rgba(0,0,0,0.2)'}`, background:isSel?BURG:'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {isSel && <i className="fa-solid fa-check" style={{ fontSize:10, color:WHITE }} />}
                            </div>
                            <span style={{ fontSize:14, color:'#374151' }}>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Nav */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <button onClick={() => setQIdx(p => Math.max(0,p-1))} disabled={isFirst} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:10, border:`1.5px solid rgba(101,28,50,0.18)`, background:'transparent', color:isFirst?'#c4b5b5':BURG, fontWeight:700, cursor:isFirst?'not-allowed':'pointer', fontSize:14 }}>
                        <i className="fa-solid fa-arrow-left" />Prev
                      </button>
                      {!isLast ? (
                        <button onClick={() => setQIdx(p=>p+1)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 24px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${GOLD},#A67825)`, color:WHITE, fontWeight:800, cursor:'pointer', fontSize:14, boxShadow:`0 4px 14px rgba(197,151,62,0.28)` }}>
                          Next <i className="fa-solid fa-arrow-right" />
                        </button>
                      ) : (
                        <button onClick={finalSubmit} disabled={!allAns||submitting} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 28px', borderRadius:10, border:'none', background:!allAns?'rgba(0,0,0,0.08)':`linear-gradient(135deg,${GOLD},#A67825)`, color:!allAns?'#9A8080':WHITE, fontWeight:800, cursor:!allAns?'not-allowed':'pointer', fontSize:14, boxShadow:allAns?`0 4px 14px rgba(197,151,62,0.28)`:'none', opacity:submitting?0.7:1 }} title={!allAns?`Answer all (${answered}/${totalQ})`:'Submit quiz'}>
                          {submitting?<div style={{ width:13,height:13,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:WHITE,animation:'spin 0.8s linear infinite' }} />:<i className="fa-solid fa-paper-plane" />}
                          Submit Quiz
                        </button>
                      )}
                    </div>
                    {isLast && !allAns && (
                      <p style={{ textAlign:'right', fontSize:12, color:GOLD, marginTop:7, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:5 }}>
                        <i className="fa-solid fa-circle-info" />{totalQ-answered} question{totalQ-answered!==1?'s':''} unanswered
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseWatch;
