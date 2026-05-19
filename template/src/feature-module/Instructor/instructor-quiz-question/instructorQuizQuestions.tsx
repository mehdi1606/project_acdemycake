import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';

import { useTranslation } from 'react-i18next';
import { all_routes } from '../../router/all_routes';

interface Choice {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  text: string;
  type: 'multiple' | 'truefalse';
  choices: Choice[];
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    text: 'Which of the following is a principle of UX design?',
    type: 'multiple',
    choices: [
      { text: 'Minimalistic Design', isCorrect: false },
      { text: 'User-Centered Design', isCorrect: true },
      { text: 'Gradient Usage', isCorrect: false },
      { text: 'Typography Hierarchy', isCorrect: false },
    ],
  },
];

const InstructorQuizQuestions: React.FC = () => {
  const { t } = useTranslation();
  const [questions] = useState<Question[]>(sampleQuestions);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionType, setQuestionType] = useState<'multiple' | 'truefalse'>('multiple');
  const [choices, setChoices] = useState<Choice[]>([{ text: '', isCorrect: true }]);

  const addChoice = () => setChoices([...choices, { text: '', isCorrect: false }]);
  const removeChoice = (idx: number) => setChoices(choices.filter((_, i) => i !== idx));
  const toggleCorrect = (idx: number) =>
    setChoices(choices.map((c, i) => ({ ...c, isCorrect: i === idx ? !c.isCorrect : c.isCorrect })));

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid rgba(107, 29, 42, 0.12)',
    borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
    outline: 'none', background: 'rgba(255,255,255,0.6)',
    color: 'var(--lx-text)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: 'var(--lx-text-mid)', marginBottom: 6,
  };

  return (
    <LuxuryDashboardLayout>
      {/* Quiz Header Card */}
      <div style={{
        padding: '18px 24px', marginBottom: 20, borderRadius: 'var(--lx-radius)',
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(107, 29, 42, 0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--lx-radius-sm)',
              background: 'rgba(107, 29, 42, 0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <img src="assets/img/students/quiz.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
                Information About UI/UX Design Degree
              </h5>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className="isax isax-message-question" style={{ color: 'var(--lx-primary)' }} /> 25 {t('instructor.quiz.questions', 'Questions')}
                </span>
                <span style={{ fontSize: 13, color: 'var(--lx-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className="isax isax-clock" style={{ color: '#C5973E' }} /> 30 {t('instructor.quiz.minutes', 'Minutes')}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={all_routes.instructorQuizResult} className="lx-btn lx-btn-sm lx-btn-outline">
              {t('instructor.quiz.viewResults', 'View Results')}
            </Link>
            <button type="button" className="lx-btn lx-btn-sm lx-btn-gold" onClick={() => setShowAddModal(true)}>
              {t('instructor.quiz.addQuestion', 'Add Question')}
            </button>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q, qIdx) => (
          <div
            key={q.id}
            className="lx-card"
          >
            <div className="lx-card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>
                  <span style={{ color: 'var(--lx-text-muted)', marginRight: 6 }}>Q{qIdx + 1}.</span>
                  {q.text}
                </h6>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--lx-primary)', fontSize: 16, padding: 4,
                    }}
                    title="Edit"
                  >
                    <i className="isax isax-edit-2" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#8B2335', fontSize: 16, padding: 4,
                    }}
                    title="Delete"
                  >
                    <i className="isax isax-trash" />
                  </button>
                </div>
              </div>

              {/* Choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.choices.map((choice, cIdx) => (
                  <label
                    key={cIdx}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 'var(--lx-radius-sm)',
                      background: choice.isCorrect ? 'rgba(45, 95, 63, 0.06)' : 'rgba(107, 29, 42, 0.02)',
                      border: `1px solid ${choice.isCorrect ? 'rgba(45, 95, 63, 0.15)' : 'rgba(107, 29, 42, 0.05)'}`,
                      cursor: 'default',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${choice.isCorrect ? '#2D5F3F' : 'rgba(107, 29, 42, 0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {choice.isCorrect && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2D5F3F' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 14, color: choice.isCorrect ? '#2D5F3F' : 'var(--lx-text-mid)',
                      fontWeight: choice.isCorrect ? 600 : 400,
                    }}>
                      {choice.text}
                    </span>
                    {choice.isCorrect && (
                      <span className="lx-badge badge-success" style={{ marginLeft: 'auto' }}>{t('instructor.quiz.correct', 'Correct')}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 600,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>{t('instructor.quiz.addNewQuestion', 'Add New Question')}</h5>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--lx-text-muted)' }}>
                <i className="isax isax-close-circle" />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t('instructor.quiz.question', 'Question')} <span style={{ color: '#8B2335' }}>*</span></label>
                <input type="text" style={inputStyle} placeholder={t('instructor.quiz.questionPlaceholder', 'Enter question...')} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t('instructor.quiz.questionType', 'Question Type')} <span style={{ color: '#8B2335' }}>*</span></label>
                <select
                  style={inputStyle}
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as 'multiple' | 'truefalse')}
                >
                  <option value="multiple">{t('instructor.quiz.multipleChoice', 'Multiple choice')}</option>
                  <option value="truefalse">{t('instructor.quiz.trueFalse', 'True or False')}</option>
                </select>
              </div>

              <h6 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>{t('instructor.quiz.answers', 'Answers')}</h6>

              {choices.map((choice, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      Choice {idx + 1} <span style={{ color: '#8B2335' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleCorrect(idx)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        color: choice.isCorrect ? '#2D5F3F' : 'var(--lx-text-muted)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 3,
                        border: `1.5px solid ${choice.isCorrect ? '#2D5F3F' : 'rgba(107, 29, 42, 0.2)'}`,
                        background: choice.isCorrect ? '#2D5F3F' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {choice.isCorrect && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                      </div>
                      {t('instructor.quiz.correctAnswer', 'Correct Answer')}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder={`Choice ${idx + 1}`}
                      value={choice.text}
                      onChange={(e) => setChoices(choices.map((c, i) => i === idx ? { ...c, text: e.target.value } : c))}
                    />
                    {choices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(idx)}
                        style={{
                          background: 'rgba(139, 35, 53, 0.06)', border: '1px solid rgba(139, 35, 53, 0.1)',
                          borderRadius: 'var(--lx-radius-sm)', cursor: 'pointer',
                          width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#8B2335',
                        }}
                      >
                        <i className="isax isax-trash" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addChoice}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 600, color: 'var(--lx-primary)',
                }}
              >
                <i className="isax isax-add" /> {t('instructor.quiz.addChoice', 'Add Choice')}
              </button>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(107, 29, 42, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowAddModal(false)}>{t('common.cancel', 'Cancel')}</button>
              <button type="button" className="lx-btn lx-btn-gold" onClick={() => setShowAddModal(false)}>{t('instructor.quiz.addQuestion', 'Add Question')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
            borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
            boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)', padding: 32, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(139, 35, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
            </div>
            <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>{t('instructor.quiz.deleteQuestion', 'Delete Question')}</h5>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>
              {t('instructor.quiz.deleteQuestionConfirm', 'Are you sure you want to delete this question?')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={() => setShowDeleteModal(false)}>{t('common.cancel', 'Cancel')}</button>
              <button
                type="button"
                className="lx-btn"
                style={{ background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335', border: '1.5px solid rgba(139, 35, 53, 0.15)' }}
                onClick={() => setShowDeleteModal(false)}
              >
                {t('common.yesDelete', 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default InstructorQuizQuestions;
