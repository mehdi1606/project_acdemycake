import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link, useSearchParams } from "react-router-dom";
import { App } from "antd";



import { all_routes } from "../../router/all_routes";
import quizService from "../../../services/api/quiz.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean | null;
  orderIndex: number;
}

interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  points: number;
  orderIndex: number;
  options: QuizOption[];
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  duration: number;
  shuffleQuestions: boolean;
  questions: QuizQuestion[];
  totalPoints: number;
}

interface Answer {
  questionId: string;
  selectedOptionIds: string[];
}

interface Feedback {
  correct: boolean;
  correctOptionIds: string[];
  explanation?: string;
}

interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  violated: boolean;
}

/** "intro" = the pre-quiz warning; the attempt (and its timer) only starts after it. */
type Phase = "loading" | "error" | "intro" | "quiz" | "result" | "violation";

// ─── Component ────────────────────────────────────────────────────────────────

const StudentQuizQuestion = () => {
  const { t } = useTranslation()
  const { modal } = App.useApp();
  const route = all_routes;
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quizId") ?? "";

  // ── Core state ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);

  // ── Per-question state ────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // ── Accumulated answers ───────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Answer[]>([]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(0);

  // ── Result ────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<QuizResult | null>(null);

  // ── Pre-quiz warning ──────────────────────────────────────────────────────
  const [ack, setAck] = useState(false);
  const [starting, setStarting] = useState(false);

  // Ref so anti-cheat callbacks always see the latest values without stale closures
  const attemptIdRef = useRef<string | null>(null);
  const answersRef = useRef<Answer[]>([]);
  const phaseRef = useRef<Phase>("loading");

  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Load quiz + start attempt ─────────────────────────────────────────────
  useEffect(() => {
    if (!quizId) {
      setPhase("error");
      setErrorMsg(t('quizPage.noQuizId', 'This quiz link is incomplete. Please open the quiz again from your course.'));
      return;
    }

    (async () => {
      try {
        const quizData = await quizService.getQuizForStudent(quizId) as unknown as QuizData;

        // Optionally shuffle questions
        const questions = quizData.shuffleQuestions
          ? [...(quizData.questions ?? [])].sort(() => Math.random() - 0.5)
          : (quizData.questions ?? []);

        setQuiz({ ...quizData, questions });
        // Show the warning first — the attempt starts when the student presses Start.
        setPhase("intro");
      } catch (err: any) {
        setPhase("error");
        setErrorMsg(err?.response?.data?.message ?? t('quiz.loadFailed', 'Could not load the quiz. Please try again.'));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // ── Start the attempt (after the warning was acknowledged) ───────────────
  const startAttempt = async () => {
    if (!quiz || !ack || starting) return;
    setStarting(true);
    try {
      const attempt = await quizService.startQuizAttempt(quizId);
      setAttemptId(attempt.attemptId);

      // Timezone-proof countdown: the server sends startedAt/endsAt as naive timestamps
      // (no zone), so new Date(endsAt) is read in the browser's TZ and can land in the
      // past when server (UTC) ≠ browser (e.g. UTC+1) → instant auto-submit. Their
      // DIFFERENCE is the true duration regardless of TZ, so anchor it to the browser clock.
      const span = new Date(attempt.endsAt).getTime() - new Date(attempt.startedAt).getTime();
      const spanMs = Number.isFinite(span) && span > 0 ? span : (quiz.duration ?? 30) * 60000;
      setEndsAt(new Date(Date.now() + spanMs));
      setTimeLeft(Math.round(spanMs / 1000));

      setPhase("quiz");
    } catch (err: any) {
      setPhase("error");
      setErrorMsg(err?.response?.data?.message ?? t('quiz.loadFailed', 'Could not load the quiz. Please try again.'));
    } finally {
      setStarting(false);
    }
  };

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "quiz" || !endsAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endsAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmit(false, true); // time up → auto-submit
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, endsAt]);

  // ── Anti-cheat setup ──────────────────────────────────────────────────────
  const handleViolation = useCallback(async () => {
    const currentPhase = phaseRef.current;
    if (currentPhase !== "quiz") return; // already submitted/violated

    const aId = attemptIdRef.current;
    const acc = answersRef.current;

    try {
      if (aId) {
        const res = await quizService.submitAttempt(aId, acc, true) as unknown as QuizResult;
        setResult(res);
      }
    } catch {
      // Even if the request fails, show violation screen
    } finally {
      setPhase("violation");
    }
  }, []);

  useEffect(() => {
    if (phase === "loading" || phase === "error" || phase === "intro") return;

    const block = (e: Event) => e.preventDefault();

    const onVisibility = () => {
      if (document.hidden) handleViolation();
    };

    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [phase, handleViolation]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const currentQuestion = quiz?.questions[currentIdx] ?? null;
  const isMultiple = currentQuestion?.type === "MULTIPLE_CHOICE" || currentQuestion?.type === "multiple_choice";
  const isLast = quiz ? currentIdx === quiz.questions.length - 1 : false;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleOption = (optionId: string) => {
    if (feedback) return; // locked after feedback shown
    if (isMultiple) {
      setSelectedIds(prev =>
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedIds([optionId]);
    }
  };

  // ── Check answer (instant feedback) ──────────────────────────────────────
  const handleCheck = async () => {
    if (!attemptId || !currentQuestion || selectedIds.length === 0) return;
    setIsChecking(true);
    try {
      const fb = await quizService.checkAnswer(attemptId, currentQuestion.id, selectedIds) as Feedback;
      setFeedback(fb);
    } catch (err: any) {
      // Silently fail – let user retry
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    setSelectedIds([]);
    setFeedback(null);
  };

  const handleNext = () => {
    if (!currentQuestion || !feedback?.correct) return;

    // Record the correct answer
    setAnswers(prev => [
      ...prev,
      { questionId: currentQuestion.id, selectedOptionIds: selectedIds },
    ]);

    setSelectedIds([]);
    setFeedback(null);
    setCurrentIdx(prev => prev + 1);
  };

  // ── Submit quiz ───────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (isLast: boolean, _autoSubmit = false) => {
    const aId = attemptIdRef.current;
    if (!aId) return;

    // On the last question: record it first if answered correctly
    const currentAnswers = answersRef.current;

    try {
      const res = await quizService.submitAttempt(aId, currentAnswers, false) as unknown as QuizResult;
      setResult(res);
      setPhase("result");
    } catch {
      setPhase("result");
    }
  }, []);

  const handleFinalSubmit = async () => {
    if (!attemptId || !currentQuestion || !feedback?.correct) return;

    // Record last answer
    const finalAnswers = [
      ...answers,
      { questionId: currentQuestion.id, selectedOptionIds: selectedIds },
    ];

    try {
      const res = await quizService.submitAttempt(attemptId, finalAnswers, false) as unknown as QuizResult;
      setResult(res);
      setPhase("result");
    } catch {
      setPhase("result");
    }
  };

  // ── Option styling ────────────────────────────────────────────────────────
  const getOptionClass = (optionId: string) => {
    const base = "quiz-option d-flex align-items-center gap-3 p-3 mb-2 rounded-3 border cursor-pointer";

    if (!feedback) {
      return `${base} ${selectedIds.includes(optionId) ? "border-primary bg-primary bg-opacity-10" : "border-light bg-light"}`;
    }

    const isSelected = selectedIds.includes(optionId);
    const isCorrect = feedback.correctOptionIds.includes(optionId);

    if (isCorrect) return `${base} border-success bg-success bg-opacity-10`;
    if (isSelected && !isCorrect) return `${base} border-danger bg-danger bg-opacity-10`;
    return `${base} border-light bg-light opacity-60`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const renderLoading = () => (
    <div className="text-center py-5">
      <div className="spinner-border text-primary mb-3" role="status" />
      <p className="text-muted">{t('quiz.preparing', 'Preparing your quiz…')}</p>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-5">
      <div className="mb-3">
        <i className="isax isax-close-circle fs-1 text-danger" />
      </div>
      <h5 className="text-danger mb-2">{t('quiz.unableToLoad', 'Unable to Load Quiz')}</h5>
      <p className="text-muted mb-4">{errorMsg}</p>
      <Link to={route.studentQuiz} className="btn btn-primary">
        {t('quizPage.backToQuizzes', 'Back to Quizzes')}
      </Link>
    </div>
  );

  const renderViolation = () => (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '32px 0' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(197, 145, 44,0.12)', border: '3px solid rgba(197, 145, 44,0.3)',
      }}>
        <i className="isax isax-warning-2" style={{ fontSize: 40, color: '#C5912C' }} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: '#651C32', marginBottom: 12 }}>{t('quiz.terminated', 'Quiz Terminated')}</h3>
      <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, marginBottom: 6 }}>
        {t('quizPage.violationBody', 'You left the quiz page (switched tab, app or window, or locked your screen), so your attempt was submitted automatically with a score of 0.')}
      </p>
      <p style={{ color: 'var(--lx-text-muted)', fontSize: 12, marginBottom: 28 }}>
        {t('quiz.actionLogged', 'This action is logged and cannot be reversed.')}
      </p>
      <Link
        to={route.studentQuiz}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 'var(--lx-radius)',
          background: 'var(--lx-primary)', color: '#fff',
          textDecoration: 'none', fontSize: 14, fontWeight: 600,
        }}
      >
        <i className="isax isax-arrow-left" />
        {t('quizPage.backToQuizzes', 'Back to Quizzes')}
      </Link>
    </div>
  );

  const renderResult = () => {
    if (!result || !quiz) return null;
    const passed = result.passed;
    const pct = typeof result.percentage === 'number' ? Math.round(result.percentage * 10) / 10 : 0;
    const score = result.score ?? 0;
    const totalPts = result.totalPoints ?? 0;

    const statCards = [
      {
        label: t('quiz.pointsEarned', 'Points Earned'),
        value: score,
        icon: 'isax-star',
        color: passed ? '#855A0E' : '#651C32',
        bg: passed ? 'rgba(197, 145, 44,0.07)' : 'rgba(101, 28, 50,0.07)',
      },
      {
        label: t('quiz.totalPoints', 'Total Points'),
        value: totalPts,
        icon: 'isax-chart',
        color: '#C5912C',
        bg: 'rgba(197, 145, 44,0.08)',
      },
      {
        label: t('quiz.yourScore', 'Your Score'),
        value: `${pct}%`,
        icon: 'isax-percentage-square',
        color: passed ? '#855A0E' : '#651C32',
        bg: passed ? 'rgba(197, 145, 44,0.07)' : 'rgba(101, 28, 50,0.07)',
      },
    ];

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 0' }}>
        {/* ── Status hero ─── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: passed ? 'rgba(197, 145, 44,0.12)' : 'rgba(101, 28, 50,0.10)',
            border: `3px solid ${passed ? 'rgba(197, 145, 44,0.3)' : 'rgba(101, 28, 50,0.25)'}`,
          }}>
            <i
              className={`isax ${passed ? 'isax-tick-circle' : 'isax-close-circle'}`}
              style={{ fontSize: 44, color: passed ? '#855A0E' : '#651C32' }}
            />
          </div>
          <h3 style={{
            fontSize: 26, fontWeight: 800, margin: '0 0 8px',
            color: passed ? '#855A0E' : '#651C32',
          }}>
            {passed ? t('quiz.youPassed', '🎉 You Passed!') : t('quiz.notPassed', 'Not Passed')}
          </h3>
          <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, margin: 0 }}>
            {passed
              ? t('quiz.congrats', "Congratulations! You've completed this quiz.")
              : t('quizPage.needToPassRetry', 'You need {{n}}% to pass. Keep practising and try again!', { n: quiz.passingScore })}
          </p>
        </div>

        {/* ── Stat cards ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              padding: '18px 14px',
              borderRadius: 'var(--lx-radius)',
              background: card.bg,
              border: `1px solid ${card.color}22`,
              textAlign: 'center',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--lx-radius-sm)',
                background: `${card.color}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <i className={`isax ${card.icon}`} style={{ fontSize: 20, color: card.color }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1.1, marginBottom: 4 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--lx-text-muted)', fontWeight: 500 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Progress bar ─── */}
        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--lx-radius)',
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(101, 28, 50,0.07)',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lx-text)' }}>{t('quiz.yourScore', 'Your Score')}</span>
            <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
              {t('quizPage.passingThreshold', 'Passing threshold:')} <strong style={{ color: passed ? '#855A0E' : '#651C32' }}>{quiz.passingScore}%</strong>
            </span>
          </div>
          {/* Track */}
          <div style={{ height: 14, borderRadius: 7, background: 'rgba(101, 28, 50,0.06)', position: 'relative', overflow: 'visible' }}>
            {/* Passing threshold marker */}
            <div style={{
              position: 'absolute',
              left: `${quiz.passingScore}%`,
              top: -4, bottom: -4,
              width: 2,
              background: 'rgba(101, 28, 50,0.3)',
              borderRadius: 2,
              zIndex: 2,
            }} />
            {/* Score fill */}
            <div style={{
              height: '100%', borderRadius: 7,
              width: `${Math.min(pct, 100)}%`,
              background: passed
                ? 'linear-gradient(90deg,#855A0E,#D9AE52)'
                : 'linear-gradient(90deg,#651C32,#C5912C)',
              transition: 'width 0.6s ease',
              position: 'relative', zIndex: 1,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>0%</span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: passed ? '#855A0E' : '#651C32',
            }}>
              {pct}%
            </span>
            <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>100%</span>
          </div>
        </div>

        {/* ── Actions ─── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link
            to={route.studentQuiz}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 'var(--lx-radius)',
              background: 'rgba(101, 28, 50,0.07)', color: 'var(--lx-primary)',
              border: '1px solid rgba(101, 28, 50,0.18)',
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}
          >
            <i className="isax isax-arrow-left" />
            {t('quizPage.backToQuizzes', 'Back to Quizzes')}
          </Link>
          {!passed && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 'var(--lx-radius)',
                background: 'var(--lx-primary)', color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <i className="isax isax-refresh" />
              {t('quizPage.tryAgain', 'Try Again')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (!quiz || !currentQuestion) return null;
    const totalQ = quiz.questions.length;
    const progress = Math.round(((currentIdx) / totalQ) * 100);
    const timeWarning = timeLeft < 60 && timeLeft > 0;

    return (
      <>
        {/* ── Persistent reminder: leaving the page auto-submits ───────── */}
        <div role="note" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 14, borderRadius: 10, background: 'rgba(197, 145, 44,0.12)', border: '1px solid rgba(197, 145, 44,0.35)', color: '#855A0E', fontSize: 13, fontWeight: 700 }}>
          <i className="isax isax-warning-2" style={{ color: '#C5912C' }} aria-hidden="true" />
          {t('quizWarn.banner', 'Stay on this page until you submit')}
        </div>

        {/* ── Quiz header ───────────────────────────────────────────────── */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h5 className="mb-0">{quiz.title}</h5>
            <span className="text-muted small">
              {t('quizPage.questionOf', 'Question {{n}} of {{total}}', { n: currentIdx + 1, total: totalQ })}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 border fw-semibold ${timeWarning ? "bg-danger bg-opacity-10 border-danger text-danger" : "bg-light border-light text-dark"}`}
            >
              <i className={`isax isax-timer${timeWarning ? " text-danger" : ""}`} />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <button
              type="button"
              onClick={confirmExit}
              aria-label={t('quizWarn.exitAria', 'Exit quiz')}
              title={t('quizWarn.exitAria', 'Exit quiz')}
              style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(101, 28, 50,0.15)', background: 'rgba(101, 28, 50,0.05)', color: '#651C32', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="isax isax-close-circle" style={{ fontSize: 20 }} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Progress ──────────────────────────────────────────────────── */}
        <div className="mb-4">
          <div className="progress" style={{ height: 6 }}>
            <div
              className="progress-bar bg-primary"
              style={{ width: `${progress}%`, transition: "width 0.3s" }}
            />
          </div>
        </div>

        {/* ── Question card ─────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            {/* Points badge */}
            <div className="d-flex align-items-start justify-content-between mb-3 gap-2">
              <h6 className="mb-0 lh-base">{currentQuestion.text}</h6>
              <span className="badge bg-primary-subtle text-primary flex-shrink-0">
                {t('quiz.points', '{{n}} pts', { n: currentQuestion.points })}
              </span>
            </div>

            {isMultiple && (
              <p className="text-muted small mb-3">
                <i className="isax isax-info-circle me-1" />
                {t('quiz.selectAll', 'Select all that apply')}
              </p>
            )}

            {/* Options */}
            <div>
              {currentQuestion.options
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map(option => (
                  <div
                    key={option.id}
                    className={getOptionClass(option.id)}
                    onClick={() => toggleOption(option.id)}
                    style={{ cursor: feedback ? "default" : "pointer", userSelect: "none" }}
                  >
                    {/* Checkbox / Radio indicator */}
                    <div
                      className={`d-flex align-items-center justify-content-center rounded ${isMultiple ? "rounded-2" : "rounded-circle"
                        } border flex-shrink-0`}
                      style={{
                        width: 22, height: 22, borderWidth: 2,
                        borderColor: selectedIds.includes(option.id) ? "var(--bs-primary)" : "#ccc",
                        backgroundColor: selectedIds.includes(option.id) ? "var(--bs-primary)" : "transparent"
                      }}
                    >
                      {selectedIds.includes(option.id) && (
                        <i className="isax isax-tick text-white" style={{ fontSize: 12 }} />
                      )}
                    </div>
                    <span className="flex-grow-1">{option.text}</span>
                    {/* Feedback icons */}
                    {feedback && feedback.correctOptionIds.includes(option.id) && (
                      <i className="isax isax-tick-circle text-success ms-auto flex-shrink-0" />
                    )}
                    {feedback && selectedIds.includes(option.id) && !feedback.correctOptionIds.includes(option.id) && (
                      <i className="isax isax-close-circle text-danger ms-auto flex-shrink-0" />
                    )}
                  </div>
                ))}
            </div>

            {/* ── Feedback banner ───────────────────────────────────────── */}
            {feedback && (
              <div
                className={`mt-3 p-3 rounded-3 d-flex align-items-start gap-2 ${feedback.correct
                    ? "bg-success bg-opacity-10 border border-success"
                    : "bg-danger bg-opacity-10 border border-danger"
                  }`}
              >
                <i
                  className={`isax flex-shrink-0 mt-1 ${feedback.correct ? "isax-tick-circle text-success" : "isax-close-circle text-danger"
                    }`}
                />
                <div>
                  <p className={`fw-semibold mb-1 ${feedback.correct ? "text-success" : "text-danger"}`}>
                    {feedback.correct ? t('quizPage.correct', 'Correct!') : t('quizPage.incorrect', 'Incorrect — try again!')}
                  </p>
                  {feedback.explanation && (
                    <p className="text-muted small mb-0">{feedback.explanation}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <div className="d-flex justify-content-end gap-2">
          {/* No feedback yet → show Check Answer */}
          {!feedback && (
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleCheck}
              disabled={selectedIds.length === 0 || isChecking}
            >
              {isChecking && <span className="spinner-border spinner-border-sm" />}
              {t('quizPage.checkAnswer', 'Check Answer')}
            </button>
          )}

          {/* Wrong answer → Retry */}
          {feedback && !feedback.correct && (
            <button
              type="button"
              className="btn btn-outline-danger d-flex align-items-center gap-2"
              onClick={handleRetry}
            >
              <i className="isax isax-refresh" />
              {t('quizPage.tryAgain', 'Try Again')}
            </button>
          )}

          {/* Correct + not last → Next Question */}
          {feedback && feedback.correct && !isLast && (
            <button
              type="button"
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={handleNext}
            >
              {t('quizPage.nextQuestion', 'Next Question')}
              <i className="isax isax-arrow-right-3" />
            </button>
          )}

          {/* Correct + last → Submit Quiz */}
          {feedback && feedback.correct && isLast && (
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleFinalSubmit}
            >
              <i className="isax isax-send-2" />
              {t('quiz.submitQuiz', 'Submit Quiz')}
            </button>
          )}
        </div>
        {!feedback && selectedIds.length === 0 && (
          <p style={{ textAlign: 'end', fontSize: 13, color: '#855A0E', fontWeight: 600, margin: '8px 0 0' }}>
            {t('quizPage.pickToCheck', 'Choose an answer to check it')}
          </p>
        )}
      </>
    );
  };

  // ── Exit (= submit) with confirmation ─────────────────────────────────────
  const confirmExit = () => {
    modal.confirm({
      title: t('quizWarn.exitTitle', 'Exit and submit your quiz?'),
      content: t('quizWarn.exitBody', "Exiting submits your quiz now with the answers you have given so far. Unanswered questions score 0 and you can't retake it."),
      okText: t('quizWarn.submitExit', 'Submit and exit'),
      cancelText: t('quizWarn.keepGoing', 'Keep answering'),
      okButtonProps: { style: { background: '#651C32', borderColor: '#651C32' } },
      onOk: () => handleSubmit(false),
    });
  };

  const renderIntro = () => {
    if (!quiz) return null;
    const minutes = quiz.duration ?? 0;
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 0' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(197, 145, 44,0.12)', border: '3px solid rgba(197, 145, 44,0.3)' }}>
          <i className="isax isax-warning-2" style={{ fontSize: 34, color: '#C5912C' }} aria-hidden="true" />
        </div>
        <h3 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#651C32', margin: '0 0 6px' }}>
          {t('quizWarn.title', 'Before you start')}
        </h3>
        <p style={{ textAlign: 'center', color: 'var(--lx-text-muted)', fontSize: 14, margin: '0 0 16px' }}>
          {quiz.title} · {t('quiz.questions', '{{n}} questions', { n: quiz.questions.length })}
          {minutes > 0 && <> · {t('quiz.minutes', '{{n}} min', { n: minutes })}</>}
        </p>
        <p style={{ fontSize: 15, color: 'var(--lx-text)', lineHeight: 1.65, margin: '0 0 16px' }}>
          {minutes > 0
            ? t('quizWarn.body', "Stay on this page until you submit. If you leave this page, switch apps, take a call or lock your screen, your quiz is submitted automatically and can't be retaken. Make sure you have {{minutes}} minutes and turn on Do Not Disturb.", { minutes })
            : t('quizWarn.bodyNoTime', "Stay on this page until you submit. If you leave this page, switch apps, take a call or lock your screen, your quiz is submitted automatically and can't be retaken. Make sure you have enough time and turn on Do Not Disturb.")}
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(101,28,50,0.04)', border: '1px solid rgba(101,28,50,0.12)', cursor: 'pointer', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#651C32', flexShrink: 0 }} />
          {t('quizWarn.ack', 'I understand')}
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={startAttempt}
            disabled={!ack || starting}
            style={{ flex: '1 1 200px', minHeight: 48, borderRadius: 12, border: 'none', cursor: ack && !starting ? 'pointer' : 'not-allowed', background: ack ? 'linear-gradient(135deg,#C5912C,#855A0E)' : 'rgba(0,0,0,0.08)', color: ack ? '#fff' : '#7C6A73', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {starting ? <span className="spinner-border spinner-border-sm" /> : <i className="isax isax-play" aria-hidden="true" />}
            {t('quiz.startQuiz', 'Start Quiz')}
          </button>
          <Link to={route.studentQuiz} style={{ flex: '1 1 140px', minHeight: 48, borderRadius: 12, border: '1px solid rgba(101, 28, 50,0.18)', color: '#651C32', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t('quizWarn.notNow', 'Not now')}
          </Link>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <LuxuryDashboardLayout>
      <div style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(18px)',
        borderRadius: 'var(--lx-radius)',
        border: '1px solid rgba(101, 28, 50,0.08)',
        padding: 28,
        boxShadow: '0 4px 24px rgba(101, 28, 50,0.06)',
      }}>
        {phase === "loading" && renderLoading()}
        {phase === "error" && renderError()}
        {phase === "intro" && renderIntro()}
        {phase === "violation" && renderViolation()}
        {phase === "result" && renderResult()}
        {phase === "quiz" && renderQuiz()}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentQuizQuestion;
