import React, { useState, useEffect, useRef, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link, useSearchParams } from "react-router-dom";



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

type Phase = "loading" | "error" | "quiz" | "result" | "violation";

// ─── Component ────────────────────────────────────────────────────────────────

const StudentQuizQuestion = () => {
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
      setErrorMsg("No quiz ID provided.");
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

        const attempt = await quizService.startQuizAttempt(quizId);
        setAttemptId(attempt.attemptId);
        setEndsAt(new Date(attempt.endsAt));

        // Initial timer value
        const remaining = Math.max(0, Math.round((new Date(attempt.endsAt).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);

        setPhase("quiz");
      } catch (err: any) {
        setPhase("error");
        setErrorMsg(err?.response?.data?.message ?? "Failed to load quiz. Please try again.");
      }
    })();
  }, [quizId]);

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
    if (phase === "loading" || phase === "error") return;

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
  const handleSubmit = useCallback(async (isLast: boolean, autoSubmit = false) => {
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
      <p className="text-muted">Loading quiz…</p>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-5">
      <div className="mb-3">
        <i className="isax isax-close-circle fs-1 text-danger" />
      </div>
      <h5 className="text-danger mb-2">Unable to Load Quiz</h5>
      <p className="text-muted mb-4">{errorMsg}</p>
      <Link to={route.studentQuiz} className="btn btn-primary">
        Back to Quizzes
      </Link>
    </div>
  );

  const renderViolation = () => (
    <div className="text-center py-5">
      <div className="mb-3">
        <i className="isax isax-warning-2 fs-1 text-warning" />
      </div>
      <h4 className="text-danger mb-2">Quiz Terminated</h4>
      <p className="text-muted mb-1">
        You switched tabs or windows during the quiz. As per the anti-cheat policy, your attempt has been
        submitted with a <strong>score of 0</strong>.
      </p>
      <p className="text-muted mb-4 small">This action is logged and cannot be reversed.</p>
      <Link to={route.studentQuiz} className="btn btn-primary">
        Back to Quizzes
      </Link>
    </div>
  );

  const renderResult = () => {
    if (!result || !quiz) return null;
    const passed = result.passed;
    return (
      <div className="text-center py-4">
        <div className="mb-3">
          <div
            className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-3 ${passed ? "bg-success" : "bg-danger"} bg-opacity-15`}
            style={{ width: 80, height: 80 }}
          >
            <i className={`isax fs-1 ${passed ? "isax-tick-circle text-success" : "isax-close-circle text-danger"}`} />
          </div>
        </div>
        <h4 className={`mb-1 ${passed ? "text-success" : "text-danger"}`}>
          {passed ? "🎉 You Passed!" : "You Did Not Pass"}
        </h4>
        <p className="text-muted mb-4">
          {passed
            ? "Congratulations! You've successfully completed this quiz."
            : `You need ${quiz.passingScore}% to pass. Keep practising!`}
        </p>

        <div className="row justify-content-center g-3 mb-4">
          <div className="col-4">
            <div className="border rounded-3 p-3">
              <div className="fs-4 fw-bold text-primary">{result.score}</div>
              <div className="text-muted small">Points Earned</div>
            </div>
          </div>
          <div className="col-4">
            <div className="border rounded-3 p-3">
              <div className="fs-4 fw-bold text-primary">{result.totalPoints}</div>
              <div className="text-muted small">Total Points</div>
            </div>
          </div>
          <div className="col-4">
            <div className="border rounded-3 p-3">
              <div className={`fs-4 fw-bold ${passed ? "text-success" : "text-danger"}`}>
                {result.percentage}%
              </div>
              <div className="text-muted small">Score</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4 px-2">
          <div className="d-flex justify-content-between small text-muted mb-1">
            <span>Your score</span>
            <span>Passing: {quiz.passingScore}%</span>
          </div>
          <div className="progress" style={{ height: 10 }}>
            <div
              className={`progress-bar ${passed ? "bg-success" : "bg-danger"}`}
              style={{ width: `${result.percentage}%` }}
            />
          </div>
        </div>

        <Link to={route.studentQuiz} className="btn btn-primary">
          Back to Quizzes
        </Link>
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
        {/* ── Quiz header ───────────────────────────────────────────────── */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h5 className="mb-0">{quiz.title}</h5>
            <span className="text-muted small">
              Question {currentIdx + 1} of {totalQ}
            </span>
          </div>
          <div
            className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 border fw-semibold ${timeWarning ? "bg-danger bg-opacity-10 border-danger text-danger" : "bg-light border-light text-dark"}`}
          >
            <i className={`isax isax-timer${timeWarning ? " text-danger" : ""}`} />
            <span>{formatTime(timeLeft)}</span>
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
                {currentQuestion.points} {currentQuestion.points === 1 ? "pt" : "pts"}
              </span>
            </div>

            {isMultiple && (
              <p className="text-muted small mb-3">
                <i className="isax isax-info-circle me-1" />
                Select all that apply
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
                    {feedback.correct ? "Correct!" : "Incorrect — try again!"}
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
              Check Answer
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
              Try Again
            </button>
          )}

          {/* Correct + not last → Next Question */}
          {feedback && feedback.correct && !isLast && (
            <button
              type="button"
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={handleNext}
            >
              Next Question
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
              Submit Quiz
            </button>
          )}
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <LuxuryDashboardLayout>
      <div className="card border-0 shadow-sm p-4">
        {phase === "loading" && renderLoading()}
        {phase === "error" && renderError()}
        {phase === "violation" && renderViolation()}
        {phase === "result" && renderResult()}
        {phase === "quiz" && renderQuiz()}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default StudentQuizQuestion;
