import React, { useEffect, useMemo, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { InputNumber, message, Popconfirm, Switch } from 'antd';
import { instructorService } from '../../../services/api/instructor.service';
import { quizService } from '../../../services/api/quiz.service';
import { Course, Quiz, CreateQuizRequest } from '../../../services/api/types';

type QuestionType = 'multiple_choice' | 'true_false' | 'multiple_select';

interface AnswerOption { id: string; text: string; isCorrect: boolean; }
interface Question { id: string; type: QuestionType; text: string; points: number; options: AnswerOption[]; explanation?: string; }
interface QuizFormData {
  courseId: string; title: string; description: string; passingScore: number; duration: number;
  shuffleQuestions: boolean; showCorrectAnswers: boolean; allowRetake: boolean; maxAttempts: number; questions: Question[];
}

const generateId = () => Math.random().toString(36).slice(2, 10);

const createEmptyQuestion = (): Question => ({
  id: generateId(), type: 'multiple_choice', text: '', points: 1, explanation: '',
  options: [
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false },
  ],
});

const emptyQuizForm: QuizFormData = {
  courseId: '', title: '', description: '', passingScore: 70, duration: 30,
  shuffleQuestions: false, showCorrectAnswers: true, allowRetake: true, maxAttempts: 3, questions: [],
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)', fontSize: 14, outline: 'none',
  background: 'rgba(255,255,255,0.6)', color: 'var(--lx-text)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 6,
};

const InstructorQuiz: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState<boolean>(true);
  const [showQuizBuilder, setShowQuizBuilder] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizForm, setQuizForm] = useState<QuizFormData>(emptyQuizForm);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(createEmptyQuestion());
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await instructorService.getMyCourses(0, 100);
        const list: Course[] = Array.isArray(res?.content) ? res.content : [];
        setCourses(list.filter((c: Course) => c.status !== 'ARCHIVED' && c.status !== 'REJECTED'));
        setCoursesError(null);
      } catch (e) { console.error(e); setCourses([]); setCoursesError('Failed to load courses.'); }
      finally { setLoadingCourses(false); }
    };
    const loadQuizzes = async () => {
      try { setLoadingQuizzes(true); const res = await quizService.getMyQuizzes(0, 50); setQuizzes(Array.isArray(res?.content) ? res.content : []); }
      catch (e) { console.error(e); setQuizzes([]); }
      finally { setLoadingQuizzes(false); }
    };
    loadCourses();
    loadQuizzes();
  }, []);

  const totalPoints = useMemo<number>(() => quizForm.questions.reduce<number>((sum, q) => sum + (q.points || 0), 0), [quizForm.questions]);

  const isStep1Valid = useMemo<boolean>(() => (
    !!quizForm.courseId && quizForm.title.trim().length >= 5 && quizForm.duration > 0 && quizForm.passingScore > 0 && quizForm.passingScore <= 100
  ), [quizForm.courseId, quizForm.title, quizForm.duration, quizForm.passingScore]);

  const isCurrentQuestionValid = useMemo<boolean>(() => {
    const hasText = currentQuestion.text.trim().length > 0;
    const hasOptions = currentQuestion.options.length >= 2;
    const hasCorrect = currentQuestion.options.some((o) => o.isCorrect);
    const allHaveText = currentQuestion.options.every((o) => o.text.trim().length > 0);
    if (currentQuestion.type === 'true_false') return hasText && hasCorrect && hasOptions;
    return hasText && hasOptions && hasCorrect && allHaveText;
  }, [currentQuestion]);

  const isStep2Valid = useMemo<boolean>(() => {
    if (quizForm.questions.length === 0) return isCurrentQuestionValid;
    return quizForm.questions.every((q) => {
      const hasText = q.text.trim().length > 0;
      const hasOptions = q.options.length >= 2;
      const hasCorrect = q.options.some((o) => o.isCorrect);
      const allHaveText = q.options.every((o) => o.text.trim().length > 0);
      if (q.type === 'true_false') return hasText && hasCorrect && hasOptions;
      return hasText && hasOptions && hasCorrect && allHaveText;
    });
  }, [quizForm.questions, isCurrentQuestionValid]);

  const handleFormChange = <K extends keyof QuizFormData>(field: K, value: QuizFormData[K]) => {
    setQuizForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetCurrentQuestion = () => { setCurrentQuestion(createEmptyQuestion()); setEditingQuestionId(null); };

  const handleQuestionTypeChange = (type: QuestionType) => {
    if (type === 'true_false') {
      setCurrentQuestion((prev) => ({ ...prev, type, options: [{ id: generateId(), text: 'True', isCorrect: false }, { id: generateId(), text: 'False', isCorrect: false }] }));
      return;
    }
    setCurrentQuestion((prev) => ({
      ...prev, type, options: [
        { id: generateId(), text: '', isCorrect: false }, { id: generateId(), text: '', isCorrect: false },
        { id: generateId(), text: '', isCorrect: false }, { id: generateId(), text: '', isCorrect: false },
      ],
    }));
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    setCurrentQuestion((prev) => ({ ...prev, options: prev.options.map((opt) => opt.id === optionId ? { ...opt, text } : opt) }));
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    if (currentQuestion.type === 'multiple_select') {
      setCurrentQuestion((prev) => ({ ...prev, options: prev.options.map((opt) => opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt) }));
      return;
    }
    setCurrentQuestion((prev) => ({ ...prev, options: prev.options.map((opt) => ({ ...opt, isCorrect: opt.id === optionId })) }));
  };

  const addOption = () => {
    if (currentQuestion.type === 'true_false' || currentQuestion.options.length >= 6) return;
    setCurrentQuestion((prev) => ({ ...prev, options: [...prev.options, { id: generateId(), text: '', isCorrect: false }] }));
  };

  const removeOption = (optionId: string) => {
    if (currentQuestion.type === 'true_false' || currentQuestion.options.length <= 2) return;
    setCurrentQuestion((prev) => ({ ...prev, options: prev.options.filter((opt) => opt.id !== optionId) }));
  };

  const addQuestionToQuiz = () => {
    if (!isCurrentQuestionValid) { message.error('Please complete the question and select correct answer(s).'); return; }
    if (editingQuestionId) {
      setQuizForm((prev) => ({ ...prev, questions: prev.questions.map((q) => q.id === editingQuestionId ? { ...currentQuestion, id: editingQuestionId } : q) }));
      message.success('Question updated.'); resetCurrentQuestion(); return;
    }
    setQuizForm((prev) => ({ ...prev, questions: [...prev.questions, { ...currentQuestion, id: generateId() }] }));
    message.success('Question added.'); resetCurrentQuestion();
  };

  const editQuestion = (q: Question) => { setCurrentQuestion({ ...q }); setEditingQuestionId(q.id); };
  const deleteQuestion = (id: string) => { setQuizForm((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) })); message.success('Question deleted.'); };
  const moveQuestionUp = (i: number) => { if (i <= 0) return; setQuizForm((prev) => { const c = [...prev.questions]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return { ...prev, questions: c }; }); };
  const moveQuestionDown = (i: number) => { if (i >= quizForm.questions.length - 1) return; setQuizForm((prev) => { const c = [...prev.questions]; [c[i], c[i + 1]] = [c[i + 1], c[i]]; return { ...prev, questions: c }; }); };

  const handleSubmitQuiz = async () => {
    if (!isStep1Valid || !isStep2Valid) { message.error('Please complete required fields.'); return; }
    if (quizForm.questions.length === 0 && isCurrentQuestionValid) {
      setQuizForm((prev) => ({ ...prev, questions: [...prev.questions, { ...currentQuestion, id: generateId() }] }));
    }
    setSubmitting(true);
    try {
      const apiQuestions = quizForm.questions.map((q, index) => ({
        type: q.type.toUpperCase() as 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE',
        text: q.text, points: q.points, explanation: q.explanation || undefined, orderIndex: index,
        options: q.options.map((opt, optIndex) => ({ text: opt.text, isCorrect: opt.isCorrect, orderIndex: optIndex })),
      }));
      const payload: CreateQuizRequest = {
        courseId: quizForm.courseId, title: quizForm.title.trim(),
        description: quizForm.description?.trim() || undefined, passingScore: quizForm.passingScore,
        duration: quizForm.duration, shuffleQuestions: quizForm.shuffleQuestions,
        showCorrectAnswers: quizForm.showCorrectAnswers, allowRetake: quizForm.allowRetake,
        maxAttempts: quizForm.maxAttempts, questions: apiQuestions,
      };
      const created = await quizService.createQuiz(payload);
      message.success('Quiz created successfully!');
      setQuizzes((prev) => [created, ...prev]);
      setShowQuizBuilder(false); setCurrentStep(1); setQuizForm(emptyQuizForm); resetCurrentQuestion();
    } catch (e: any) { console.error(e); message.error(e?.response?.data?.message || 'Failed to create quiz.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try { await quizService.deleteQuiz(quizId); setQuizzes((prev) => prev.filter((q) => q.id !== quizId)); message.success('Quiz deleted.'); }
    catch (e: any) { console.error(e); message.error(e?.response?.data?.message || 'Failed to delete quiz.'); }
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    setPublishingId(quiz.id);
    try {
      const updated = quiz.status === 'PUBLISHED'
        ? await quizService.unpublishQuiz(quiz.id)
        : await quizService.publishQuiz(quiz.id);
      setQuizzes((prev) => prev.map((q) => q.id === quiz.id ? { ...q, status: updated.status } : q));
      message.success(updated.status === 'PUBLISHED' ? 'Quiz published.' : 'Quiz moved to draft.');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to update quiz status.');
    } finally {
      setPublishingId(null);
    }
  };

  const stepTitle = (n: number) => ['Basic Info', 'Questions', 'Settings', 'Review'][n - 1] || '';

  // Stepper
  const Stepper = () => (
    <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
      {[1, 2, 3, 4].map((s) => (
        <div key={s} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: s <= currentStep ? 'var(--lx-primary)' : 'rgba(107, 29, 42, 0.1)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );

  return (
    <LuxuryDashboardLayout>
      {!showQuizBuilder ? (
        <>
          {/* Quiz List */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>My Quizzes</h5>
            <button className="lx-btn lx-btn-gold" onClick={() => setShowQuizBuilder(true)} disabled={!loadingCourses && courses.length === 0}>
              <i className="isax isax-add-circle" style={{ marginRight: 6 }} /> Create New Quiz
            </button>
          </div>

          {loadingQuizzes ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ marginTop: 12, color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="lx-card">
              <div className="lx-card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <span className="empty-icon" style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(107, 29, 42, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <i className="isax isax-message-question" style={{ fontSize: 24, color: 'var(--lx-text-muted)' }} />
                </span>
                <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 4 }}>No Quizzes Yet</h5>
                <p style={{ color: 'var(--lx-text-muted)', fontSize: 14, margin: 0 }}>Create your first quiz to test your students.</p>
                {!loadingCourses && courses.length === 0 && (
                  <p style={{ color: '#C5973E', marginTop: 12, fontSize: 13 }}>You need to create a course first.</p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quizzes.map((quiz: Quiz) => (
                <div key={quiz.id} style={{
                  padding: 20, borderRadius: 'var(--lx-radius)',
                  background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(107, 29, 42, 0.08)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                          <Link to={all_routes.instructorQA} style={{ color: 'var(--lx-text)', textDecoration: 'none' }}>{quiz.title}</Link>
                        </h6>
                        <span className={`lx-badge ${quiz.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>{quiz.status}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--lx-text-muted)', fontSize: 13 }}>
                        {quiz.courseName || 'Course'} · {quiz.questionCount ?? 0} questions · {quiz.duration ?? 0} min · {quiz.totalPoints ?? 0} pts
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="lx-btn lx-btn-sm"
                        disabled={publishingId === quiz.id}
                        onClick={() => handleTogglePublish(quiz)}
                        style={quiz.status === 'PUBLISHED'
                          ? { background: 'rgba(107, 29, 42, 0.08)', color: '#6B1D2A', border: '1px solid rgba(107, 29, 42, 0.18)' }
                          : { background: 'rgba(34, 139, 34, 0.08)', color: '#1a6e1a', border: '1px solid rgba(34, 139, 34, 0.2)' }
                        }
                        title={quiz.status === 'PUBLISHED' ? 'Move to Draft' : 'Publish Quiz'}
                      >
                        {publishingId === quiz.id
                          ? <i className="isax isax-refresh" style={{ animation: 'spin 1s linear infinite' }} />
                          : quiz.status === 'PUBLISHED'
                            ? <><i className="isax isax-eye-slash" style={{ marginRight: 4 }} />Unpublish</>
                            : <><i className="isax isax-send-2" style={{ marginRight: 4 }} />Publish</>
                        }
                      </button>
                      <Link to={all_routes.instructorQuizResult} className="lx-btn lx-btn-outline lx-btn-sm">
                        <i className="isax isax-chart" style={{ marginRight: 4 }} /> Results
                      </Link>
                      <Popconfirm title="Delete Quiz" description="Are you sure? This cannot be undone." okText="Yes" cancelText="Cancel" okButtonProps={{ danger: true }} onConfirm={() => handleDeleteQuiz(quiz.id)}>
                        <button className="lx-btn lx-btn-sm" style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1px solid rgba(139, 35, 53, 0.12)' }}>
                          <i className="isax isax-trash" />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Quiz Builder */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>Create New Quiz</h5>
              <small style={{ color: 'var(--lx-text-muted)' }}>Step {currentStep}/4 — {stepTitle(currentStep)}</small>
            </div>
            <button className="lx-btn lx-btn-outline" onClick={() => { setShowQuizBuilder(false); setCurrentStep(1); setQuizForm(emptyQuizForm); resetCurrentQuestion(); }}>
              <i className="isax isax-close-circle" style={{ marginRight: 4 }} /> Cancel
            </button>
          </div>

          <Stepper />

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="lx-card">
              <div className="lx-card-body">
                <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 24 }}>Quiz Basic Information</h5>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Select Course <span style={{ color: '#8B2335' }}>*</span></label>
                  {loadingCourses ? (
                    <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lx-text-muted)' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      Loading courses…
                    </div>
                  ) : coursesError ? (
                    <div style={{ padding: '8px 12px', borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139, 35, 53, 0.06)', border: '1px solid rgba(139, 35, 53, 0.12)', color: '#8B2335', fontSize: 13 }}>{coursesError}</div>
                  ) : (
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={quizForm.courseId} onChange={(e) => handleFormChange('courseId', e.target.value)}>
                      <option value="">— Select a course —</option>
                      {courses.map((course: Course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}{course.status !== 'PUBLISHED' ? ` (${String(course.status).replace('_', ' ')})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {!loadingCourses && !coursesError && courses.length === 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#C5973E' }}>You have no courses yet. Create a course first.</p>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Quiz Title <span style={{ color: '#8B2335' }}>*</span></label>
                  <input style={{ ...inputStyle, borderColor: quizForm.title && quizForm.title.length < 5 ? '#8B2335' : undefined }} value={quizForm.title} onChange={(e) => handleFormChange('title', e.target.value)} placeholder="Enter quiz title (min 5 characters)" />
                  {quizForm.title && quizForm.title.length < 5 && <small style={{ color: '#8B2335', fontSize: 12 }}>Title must be at least 5 characters.</small>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={3} value={quizForm.description} onChange={(e) => handleFormChange('description', e.target.value)} placeholder="Describe what this quiz covers..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Duration (minutes) <span style={{ color: '#8B2335' }}>*</span></label>
                    <InputNumber style={{ width: '100%' }} min={1} max={180} value={quizForm.duration} onChange={(v) => handleFormChange('duration', (v || 30) as number)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Passing Score (%) <span style={{ color: '#8B2335' }}>*</span></label>
                    <InputNumber style={{ width: '100%' }} min={1} max={100} value={quizForm.passingScore} onChange={(v) => handleFormChange('passingScore', (v || 70) as number)} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button className="lx-btn lx-btn-outline" onClick={() => setShowQuizBuilder(false)}>Cancel</button>
                  <button className="lx-btn lx-btn-gold" disabled={!isStep1Valid} onClick={() => setCurrentStep(2)}>
                    Next: Questions <i className="isax isax-arrow-right-3" style={{ marginLeft: 4 }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24 }}>
              {/* Question Editor */}
              <div className="lx-card">
                <div className="lx-card-header">
                  <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h5>
                </div>
                <div className="lx-card-body">
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Question Type</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { key: 'multiple_choice' as QuestionType, label: 'Multiple Choice' },
                        { key: 'multiple_select' as QuestionType, label: 'Multiple Select' },
                        { key: 'true_false' as QuestionType, label: 'True / False' },
                      ].map((t) => (
                        <button key={t.key} type="button" className={`lx-btn lx-btn-sm ${currentQuestion.type === t.key ? 'lx-btn-gold' : 'lx-btn-outline'}`} onClick={() => handleQuestionTypeChange(t.key)}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Question <span style={{ color: '#8B2335' }}>*</span></label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={3} value={currentQuestion.text} onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, text: e.target.value }))} placeholder="Enter your question..." />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Points</label>
                    <InputNumber style={{ width: 120 }} min={1} max={100} value={currentQuestion.points} onChange={(v) => setCurrentQuestion((prev) => ({ ...prev, points: (v || 1) as number }))} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Answer Options <span style={{ color: '#8B2335' }}>*</span></label>
                    {currentQuestion.options.map((option, idx) => (
                      <div key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, width: 24, color: 'var(--lx-text-mid)' }}>{String.fromCharCode(65 + idx)}.</span>
                        <button type="button" onClick={() => handleCorrectAnswerChange(option.id)} style={{
                          width: 20, height: 20, borderRadius: currentQuestion.type === 'multiple_select' ? 4 : '50%', flexShrink: 0, cursor: 'pointer',
                          background: option.isCorrect ? 'var(--lx-primary)' : 'transparent',
                          border: `2px solid ${option.isCorrect ? 'var(--lx-primary)' : 'rgba(107, 29, 42, 0.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12,
                        }}>
                          {option.isCorrect && '✓'}
                        </button>
                        <input style={{ ...inputStyle, flex: 1 }} value={option.text} onChange={(e) => handleOptionTextChange(option.id, e.target.value)} disabled={currentQuestion.type === 'true_false'} placeholder={`Option ${String.fromCharCode(65 + idx)}`} />
                        {currentQuestion.type !== 'true_false' && currentQuestion.options.length > 2 && (
                          <button type="button" className="lx-btn lx-btn-sm" onClick={() => removeOption(option.id)} style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1px solid rgba(139, 35, 53, 0.12)' }}>
                            <i className="isax isax-trash" />
                          </button>
                        )}
                      </div>
                    ))}
                    {currentQuestion.type !== 'true_false' && currentQuestion.options.length < 6 && (
                      <button className="lx-btn lx-btn-outline lx-btn-sm" type="button" onClick={addOption}>
                        <i className="isax isax-add" style={{ marginRight: 4 }} /> Add Option
                      </button>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Explanation <small style={{ color: 'var(--lx-text-muted)', fontWeight: 400 }}>(optional)</small></label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2} value={currentQuestion.explanation || ''} onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, explanation: e.target.value }))} placeholder="Explain the correct answer..." />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="lx-btn lx-btn-gold" disabled={!isCurrentQuestionValid} onClick={addQuestionToQuiz}>
                      {editingQuestionId ? 'Update Question' : 'Add Question'}
                    </button>
                    {editingQuestionId && <button type="button" className="lx-btn lx-btn-outline" onClick={resetCurrentQuestion}>Cancel Edit</button>}
                  </div>
                </div>
              </div>

              {/* Question List */}
              <div>
                <div className="lx-card">
                  <div className="lx-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                      Quiz Questions <span style={{ marginLeft: 8, padding: '2px 10px', borderRadius: 12, background: 'rgba(107, 29, 42, 0.08)', color: 'var(--lx-primary)', fontSize: 12, fontWeight: 600 }}>{quizForm.questions.length}</span>
                    </h5>
                    <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>Total: {totalPoints} pts</span>
                  </div>
                  <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                    {quizForm.questions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--lx-text-muted)' }}>
                        <p style={{ margin: '0 0 4px' }}>No questions added yet</p>
                        <small>Add questions from the left panel</small>
                      </div>
                    ) : (
                      quizForm.questions.map((q, index) => (
                        <div key={q.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                <span className="lx-badge badge-slate">Q{index + 1}</span>
                                <span className="lx-badge badge-info">{q.type === 'multiple_choice' ? 'MCQ' : q.type === 'multiple_select' ? 'MSQ' : 'T/F'}</span>
                                <span className="lx-badge badge-success">{q.points} pts</span>
                              </div>
                              <p style={{ margin: '0 0 2px', fontWeight: 500, fontSize: 13 }}>{q.text.length > 90 ? q.text.slice(0, 90) + '...' : q.text}</p>
                              <small style={{ color: 'var(--lx-text-muted)' }}>{q.options.filter((o) => o.isCorrect).length} correct answer(s)</small>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => moveQuestionUp(index)} disabled={index === 0}><i className="isax isax-arrow-up-2" /></button>
                              <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => moveQuestionDown(index)} disabled={index === quizForm.questions.length - 1}><i className="isax isax-arrow-down" /></button>
                              <button className="lx-btn lx-btn-outline lx-btn-sm" onClick={() => editQuestion(q)}><i className="isax isax-edit-2" /></button>
                              <button className="lx-btn lx-btn-sm" onClick={() => deleteQuestion(q.id)} style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1px solid rgba(139, 35, 53, 0.12)' }}><i className="isax isax-trash" /></button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                  <button className="lx-btn lx-btn-outline" onClick={() => setCurrentStep(1)}>
                    <i className="isax isax-arrow-left-2" style={{ marginRight: 4 }} /> Back
                  </button>
                  <button className="lx-btn lx-btn-gold" disabled={!isStep2Valid} onClick={() => {
                    if (quizForm.questions.length === 0 && isCurrentQuestionValid) {
                      setQuizForm((prev) => ({ ...prev, questions: [...prev.questions, { ...currentQuestion, id: generateId() }] }));
                      resetCurrentQuestion();
                    }
                    setCurrentStep(3);
                  }}>
                    Next: Settings <i className="isax isax-arrow-right-3" style={{ marginLeft: 4 }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className="lx-card">
              <div className="lx-card-body">
                <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 24 }}>Quiz Settings</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Shuffle Questions', desc: 'Random order for each attempt', field: 'shuffleQuestions' as const, value: quizForm.shuffleQuestions },
                    { label: 'Show Correct Answers', desc: 'After completion', field: 'showCorrectAnswers' as const, value: quizForm.showCorrectAnswers },
                    { label: 'Allow Retake', desc: 'Students can retry', field: 'allowRetake' as const, value: quizForm.allowRetake },
                  ].map((s) => (
                    <div key={s.field} style={{ padding: 20, borderRadius: 'var(--lx-radius)', background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(107, 29, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h6 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>{s.label}</h6>
                        <small style={{ color: 'var(--lx-text-muted)' }}>{s.desc}</small>
                      </div>
                      <Switch checked={s.value} onChange={(v) => handleFormChange(s.field, v)} />
                    </div>
                  ))}
                  <div style={{ padding: 20, borderRadius: 'var(--lx-radius)', background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(107, 29, 42, 0.06)' }}>
                    <h6 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>Maximum Attempts</h6>
                    <small style={{ color: 'var(--lx-text-muted)' }}>Limit attempts</small>
                    <div style={{ marginTop: 8 }}>
                      <InputNumber min={1} max={10} value={quizForm.maxAttempts} disabled={!quizForm.allowRetake} onChange={(v) => handleFormChange('maxAttempts', (v || 3) as number)} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button className="lx-btn lx-btn-outline" onClick={() => setCurrentStep(2)}>
                    <i className="isax isax-arrow-left-2" style={{ marginRight: 4 }} /> Back
                  </button>
                  <button className="lx-btn lx-btn-gold" onClick={() => setCurrentStep(4)}>
                    Next: Review <i className="isax isax-arrow-right-3" style={{ marginLeft: 4 }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="lx-card">
              <div className="lx-card-body">
                <h5 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 24 }}>Review Your Quiz</h5>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div>
                    {[
                      { label: 'Title', value: quizForm.title },
                      { label: 'Course', value: courses.find((c) => c.id === quizForm.courseId)?.title || 'Not selected' },
                      ...(quizForm.description ? [{ label: 'Description', value: quizForm.description }] : []),
                    ].map((f) => (
                      <div key={f.label} style={{ padding: 14, borderRadius: 'var(--lx-radius)', background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.04)', marginBottom: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--lx-text-muted)', margin: '0 0 4px' }}>{f.label}</p>
                        <p style={{ margin: 0, fontWeight: 500, color: 'var(--lx-text)' }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { value: quizForm.questions.length, label: 'Questions', bg: 'var(--lx-primary)' },
                      { value: totalPoints, label: 'Total Points', bg: '#2D5F3F' },
                      { value: quizForm.duration, label: 'Minutes', bg: '#C5973E' },
                      { value: `${quizForm.passingScore}%`, label: 'Pass Score', bg: '#8B6D5E' },
                    ].map((s) => (
                      <div key={s.label} style={{ padding: 16, borderRadius: 'var(--lx-radius)', background: s.bg, color: '#fff', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                        <small>{s.label}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <h6 style={{ fontSize: 14, fontWeight: 700, color: 'var(--lx-text)', marginBottom: 12 }}>Questions Preview</h6>
                <div style={{ borderRadius: 'var(--lx-radius)', border: '1px solid rgba(107, 29, 42, 0.08)', maxHeight: 320, overflowY: 'auto' }}>
                  {quizForm.questions.map((q, idx) => (
                    <div key={q.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>Q{idx + 1}. {q.text}</span>
                        <span className="lx-badge badge-success">{q.points} pts</span>
                      </div>
                      <div style={{ marginTop: 8, paddingLeft: 16 }}>
                        {q.options.map((opt, optIdx) => (
                          <div key={opt.id} style={{ fontSize: 13, color: opt.isCorrect ? '#2D5F3F' : 'var(--lx-text-muted)', fontWeight: opt.isCorrect ? 600 : 400, marginBottom: 2 }}>
                            {String.fromCharCode(65 + optIdx)}. {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button className="lx-btn lx-btn-outline" onClick={() => setCurrentStep(3)}>
                    <i className="isax isax-arrow-left-2" style={{ marginRight: 4 }} /> Back
                  </button>
                  <button className="lx-btn lx-btn-gold" onClick={handleSubmitQuiz} disabled={submitting} style={{ padding: '10px 24px' }}>
                    {submitting ? (
                      <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 8 }} />Creating...</>
                    ) : (
                      <><i className="isax isax-tick-circle" style={{ marginRight: 4 }} /> Create Quiz</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorQuiz;
