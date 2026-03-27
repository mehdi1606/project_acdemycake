import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { quizService } from '../../../services/api/quiz.service';
import { Quiz } from '../../../services/api/types';

const PAGE_SIZE = 10;

const StudentQuiz = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await quizService.getMyAvailableQuizzes(p, PAGE_SIZE);
      setQuizzes(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes(page);
  }, [loadQuizzes, page]);

  const formatDuration = (minutes: number) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <LuxuryDashboardLayout>
      {/* Header */}
      <div className="lx-section-header" style={{ marginBottom: 24 }}>
        <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>
          My Quizzes
          {totalElements > 0 && (
            <span style={{
              marginLeft: 10, padding: '2px 10px', borderRadius: 12,
              background: 'rgba(107, 29, 42, 0.08)', color: 'var(--lx-primary)',
              fontSize: 12, fontWeight: 600,
            }}>
              {totalElements}
            </span>
          )}
        </h5>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 20,
          borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139, 35, 53, 0.06)',
          border: '1px solid rgba(139, 35, 53, 0.12)', color: '#8B2335', fontSize: 14,
        }}>
          <i className="isax isax-warning-2" />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            className="lx-btn lx-btn-sm lx-btn-outline"
            onClick={() => loadQuizzes(page)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--lx-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="lx-card">
          <div className="lx-empty-state">
            <span className="empty-icon" style={{ background: 'rgba(107, 29, 42, 0.06)' }}>
              <i className="isax isax-note-2" style={{ fontSize: 28, color: 'var(--lx-primary)' }} />
            </span>
            <h6 style={{ fontWeight: 600, color: 'var(--lx-text)' }}>No quizzes available</h6>
            <p>Enroll in courses that have published quizzes to see them here.</p>
            <Link to={all_routes.courseGrid} className="lx-btn lx-btn-gold">
              Browse Courses
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: 'var(--lx-radius)',
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(107, 29, 42, 0.06)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.75)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(44, 24, 16, 0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    <Link to={`${all_routes.studentQuizQuestion}?quizId=${quiz.id}`} style={{ color: 'var(--lx-text)' }}>
                      {quiz.title}
                    </Link>
                  </h6>
                  <span className="lx-badge badge-success">{quiz.status}</span>
                </div>

                {quiz.courseName && (
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--lx-text-muted)' }}>
                    <i className="isax isax-book-1" style={{ marginRight: 4 }} />
                    {quiz.courseName}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                    <i className="isax isax-message-question" style={{ marginRight: 4, color: 'var(--lx-primary)' }} />
                    {quiz.questionCount ?? 0} Question{quiz.questionCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                    <i className="isax isax-clock" style={{ marginRight: 4, color: '#C5973E' }} />
                    {formatDuration(quiz.duration)}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                    <i className="isax isax-medal-star" style={{ marginRight: 4, color: '#2D5F3F' }} />
                    Pass: {quiz.passingScore}%
                  </span>
                  {quiz.allowRetake && (
                    <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                      <i className="isax isax-repeat" style={{ marginRight: 4 }} />
                      Max {quiz.maxAttempts} attempt{quiz.maxAttempts !== 1 ? 's' : ''}
                    </span>
                  )}
                  {quiz.totalPoints > 0 && (
                    <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                      <i className="isax isax-star" style={{ marginRight: 4, color: '#C5973E' }} />
                      {quiz.totalPoints} pts
                    </span>
                  )}
                </div>
              </div>

              <Link
                to={`${all_routes.studentQuizQuestion}?quizId=${quiz.id}`}
                className="lx-btn lx-btn-gold lx-btn-sm"
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Take Quiz
                <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
            Page {page + 1} of {totalPages}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="lx-btn lx-btn-sm lx-btn-outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ opacity: page === 0 ? 0.4 : 1 }}
            >
              <i className="fas fa-angle-left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`lx-btn lx-btn-sm ${page === i ? 'lx-btn-gold' : 'lx-btn-outline'}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              className="lx-btn lx-btn-sm lx-btn-outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ opacity: page === totalPages - 1 ? 0.4 : 1 }}
            >
              <i className="fas fa-angle-right" />
            </button>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentQuiz;
