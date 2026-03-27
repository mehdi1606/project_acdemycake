import React, { useEffect, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Select } from 'antd';
import { quizService } from '../../../services/api/quiz.service';
import { Quiz, QuizAttempt } from '../../../services/api/types';

const InstructorQuizResult: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await quizService.getMyQuizzes(0, 100);
        setQuizzes(response.content || []);
      } catch {
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!selectedQuizId) return;
    const quiz = quizzes.find((q) => q.id === selectedQuizId) || null;
    setSelectedQuiz(quiz);

    const fetchAttempts = async () => {
      setLoadingAttempts(true);
      try {
        const response = await quizService.getQuizAttempts(selectedQuizId, 0, 50);
        setAttempts(response.content || []);
        setTotalAttempts(response.totalElements || 0);
      } catch {
        setAttempts([]);
        setTotalAttempts(0);
      } finally {
        setLoadingAttempts(false);
      }
    };
    fetchAttempts();
  }, [selectedQuizId, quizzes]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
    : 0;
  const passCount = attempts.filter((a) => a.passed).length;
  const passRate = attempts.length > 0 ? Math.round((passCount / attempts.length) * 100) : 0;

  const statCards = [
    { label: 'Total Attempts', value: totalAttempts, icon: 'isax-people', color: 'var(--lx-primary)', bg: 'rgba(107, 29, 42, 0.06)' },
    { label: 'Average Score', value: `${avgScore}%`, icon: 'isax-chart', color: '#C5973E', bg: 'rgba(197, 151, 62, 0.08)' },
    { label: 'Pass Rate', value: `${passRate}%`, icon: 'isax-tick-circle', color: '#2D5F3F', bg: 'rgba(45, 95, 63, 0.08)' },
  ];

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div className="lx-section-header" style={{ marginBottom: 24 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>Quiz Results</h5>
      </div>

      {/* Quiz Selector */}
      <div className="lx-card" style={{ marginBottom: 20 }}>
        <div className="lx-card-body">
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--lx-text-mid)', marginBottom: 8 }}>
            Select Quiz <span style={{ color: '#8B2335' }}>*</span>
          </label>
          {loadingQuizzes ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lx-text-muted)', fontSize: 14 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              Loading quizzes...
            </div>
          ) : (
            <Select
              showSearch
              allowClear
              style={{ width: '100%' }}
              placeholder="Search and select a quiz to view results..."
              value={selectedQuizId ?? undefined}
              onChange={(value) => {
                setSelectedQuizId(value ?? null);
                if (!value) { setSelectedQuiz(null); setAttempts([]); setTotalAttempts(0); }
              }}
              filterOption={(input, option) =>
                ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
              }
              options={quizzes.map((q) => ({ label: q.title, value: q.id }))}
              optionFilterProp="label"
              notFoundContent="No quizzes found"
            />
          )}
          {quizzes.length === 0 && !loadingQuizzes && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#C5973E', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="isax isax-info-circle" /> You have no quizzes yet. Create a quiz first.
            </p>
          )}
        </div>
      </div>

      {/* Selected Quiz Info */}
      {selectedQuiz && (
        <>
          <div style={{
            padding: '18px 24px', marginBottom: 20, borderRadius: 'var(--lx-radius)',
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(107, 29, 42, 0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(107, 29, 42, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-message-question" style={{ fontSize: 24, color: 'var(--lx-primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{selectedQuiz.title}</h5>
                  <span className={`lx-badge ${selectedQuiz.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedQuiz.status}
                  </span>
                </div>
                {selectedQuiz.description && (
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--lx-text-muted)' }}>{selectedQuiz.description}</p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="isax isax-message-question" style={{ color: 'var(--lx-primary)' }} /> {selectedQuiz.questionCount} Questions
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="isax isax-clock" style={{ color: '#C5973E' }} /> {selectedQuiz.duration} Minutes
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="isax isax-star" style={{ color: '#C5973E' }} /> {selectedQuiz.totalPoints} Points
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="isax isax-chart" style={{ color: '#2D5F3F' }} /> Pass: {selectedQuiz.passingScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {!loadingAttempts && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              {statCards.map((card) => (
                <div key={card.label} className="lx-stat-card" style={{ background: card.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--lx-text-muted)', fontWeight: 500 }}>{card.label}</p>
                      <h4 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</h4>
                    </div>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--lx-radius-sm)',
                      background: `${card.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`isax ${card.icon}`} style={{ fontSize: 22, color: card.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attempts Table */}
          <div className="lx-card">
            <div className="lx-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>Student Attempts</h6>
              {!loadingAttempts && (
                <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>{attempts.length} records</span>
              )}
            </div>
            <div className="lx-card-body" style={{ padding: 0 }}>
              {loadingAttempts ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--lx-text-muted)' }}>Loading results...</p>
                </div>
              ) : attempts.length === 0 ? (
                <div className="lx-empty-state">
                  <span className="empty-icon" style={{ background: 'rgba(107, 29, 42, 0.06)' }}>
                    <i className="isax isax-message-question" style={{ fontSize: 28, color: 'var(--lx-primary)' }} />
                  </span>
                  <h6 style={{ fontWeight: 600, color: 'var(--lx-text)' }}>No attempts yet</h6>
                  <p>No students have attempted this quiz yet.</p>
                </div>
              ) : (
                <table className="lx-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Status</th>
                      <th>Attempt</th>
                      <th>Time Spent</th>
                      <th>Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt, index) => (
                      <tr key={attempt.id}>
                        <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{index + 1}</td>
                        <td>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>Student #{attempt.studentId}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {attempt.score} / {attempt.totalPoints}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              flex: 1, minWidth: 60, height: 6, borderRadius: 3,
                              background: 'rgba(107, 29, 42, 0.06)', overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%', borderRadius: 3,
                                width: `${attempt.percentage}%`,
                                background: attempt.percentage >= selectedQuiz.passingScore ? '#2D5F3F' : '#8B2335',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, minWidth: 36 }}>{attempt.percentage}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`lx-badge ${attempt.passed ? 'badge-success' : 'badge-danger'}`}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td>
                          <span className="lx-badge badge-slate">#{attempt.attemptNumber}</span>
                        </td>
                        <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>{formatTime(attempt.timeSpent)}</td>
                        <td style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>
                          {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Placeholder */}
      {!selectedQuiz && !loadingQuizzes && quizzes.length > 0 && (
        <div className="lx-card">
          <div className="lx-empty-state">
            <span className="empty-icon" style={{ background: 'rgba(107, 29, 42, 0.06)' }}>
              <i className="isax isax-message-question" style={{ fontSize: 28, color: 'var(--lx-primary)' }} />
            </span>
            <h6 style={{ fontWeight: 600, color: 'var(--lx-text)' }}>Select a quiz above to view its results</h6>
            <p>Choose from your {quizzes.length} available quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorQuizResult;
