import React, { useState, useEffect, useCallback } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { assignmentService } from '../../../services/api/assignment.service';
import { Assignment, Submission, SubmitAssignmentRequest } from '../../../services/api/types';
import { extractApiError } from '../../../services/api/error.utils';

const PAGE_SIZE = 10;

type ActiveTab = 'list' | 'submit' | 'result';

const statusColor: Record<string, string> = {
  PUBLISHED: '#16a34a',
  CLOSED: '#6b7280',
  DRAFT: '#d97706',
};

const gradeColor = (grade: number, total: number) => {
  const pct = total > 0 ? (grade / total) * 100 : 0;
  if (pct >= 70) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
};

const StudentAssignment = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submit flow
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await assignmentService.getStudentAssignments(p, PAGE_SIZE);
      setAssignments(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      setError(extractApiError(e, 'Failed to load assignments'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const openAssignment = async (a: Assignment) => {
    setSelected(a);
    setSubmitError(null);
    setContent('');
    setFileUrl('');
    setSubmission(null);
    setLoadingSubmission(true);
    setActiveTab('submit');
    try {
      const sub = await assignmentService.getMySubmission(a.id);
      setSubmission(sub);
      setActiveTab('result');
    } catch {
      // no submission yet — stay on submit tab
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !content.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const body: SubmitAssignmentRequest = { content: content.trim() };
    if (fileUrl.trim()) body.fileUrl = fileUrl.trim();
    try {
      const sub = await assignmentService.submitAssignment(selected.id, body);
      setSubmission(sub);
      setActiveTab('result');
    } catch (e) {
      setSubmitError(extractApiError(e, 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => { setActiveTab('list'); setSelected(null); };

  const isPastDue = (a: Assignment) =>
    a.dueDate ? new Date() > new Date(a.dueDate) : false;

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  // ── Assignment List ────────────────────────────────────────────────────────
  if (activeTab === 'list') {
    return (
      <LuxuryDashboardLayout>
        <div className="lx-section-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--lx-text)' }}>
            My Assignments
            {totalElements > 0 && (
              <span style={{ marginLeft: 10, padding: '2px 10px', borderRadius: 12, background: 'rgba(107,29,42,0.08)', color: 'var(--lx-primary)', fontSize: 12, fontWeight: 600 }}>
                {totalElements}
              </span>
            )}
          </h5>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--lx-radius-sm)', background: 'rgba(139,35,53,0.06)', border: '1px solid rgba(139,35,53,0.12)', color: '#8B2335', fontSize: 14 }}>
            <i className="isax isax-warning-2" />
            <span style={{ flex: 1 }}>{error}</span>
            <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" onClick={() => load(page)}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--lx-text-light)', fontSize: 14 }}>
            <i className="isax isax-refresh" style={{ fontSize: 24, display: 'block', marginBottom: 12 }} />
            Loading assignments…
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--lx-text-light)', fontSize: 14 }}>
            <i className="isax isax-document" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.4 }} />
            No assignments yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assignments.map((a) => {
              const past = isPastDue(a);
              return (
                <div key={a.id} style={{ background: 'var(--lx-card)', border: '1px solid var(--lx-border)', borderRadius: 'var(--lx-radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--lx-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: `${statusColor[a.status]}18`, color: statusColor[a.status] }}>{a.status}</span>
                    </div>
                    {a.courseTitle && <div style={{ fontSize: 12, color: 'var(--lx-text-light)', marginBottom: 4 }}>{a.courseTitle}</div>}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: past ? '#dc2626' : 'var(--lx-text-light)' }}>
                      <span><i className="isax isax-calendar-1" style={{ marginRight: 4 }} />Due: {fmt(a.dueDate)}</span>
                      <span><i className="isax isax-medal-star" style={{ marginRight: 4 }} />Marks: {a.totalMark}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="lx-btn lx-btn-sm lx-btn-primary"
                    onClick={() => openAssignment(a)}
                    disabled={a.status !== 'PUBLISHED'}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ lineHeight: '32px', fontSize: 13, color: 'var(--lx-text-light)' }}>Page {page + 1} of {totalPages}</span>
            <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </LuxuryDashboardLayout>
    );
  }

  // ── Submit / Result ────────────────────────────────────────────────────────
  return (
    <LuxuryDashboardLayout>
      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <button type="button" className="lx-btn lx-btn-sm lx-btn-outline" onClick={back} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="isax isax-arrow-left-2" />Back to assignments
        </button>
      </div>

      {selected && (
        <div style={{ background: 'var(--lx-card)', border: '1px solid var(--lx-border)', borderRadius: 'var(--lx-radius)', padding: '20px 24px', marginBottom: 24 }}>
          <h5 style={{ margin: '0 0 8px', fontWeight: 700 }}>{selected.title}</h5>
          {selected.courseTitle && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--lx-text-light)' }}>{selected.courseTitle}</p>}
          {selected.description && <p style={{ margin: '0 0 8px', fontSize: 14 }}>{selected.description}</p>}
          {selected.instructions && (
            <div style={{ background: 'var(--lx-bg)', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginTop: 12 }}>
              <strong>Instructions:</strong>
              <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{selected.instructions}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 13, color: 'var(--lx-text-light)' }}>
            <span><i className="isax isax-calendar-1" style={{ marginRight: 4 }} />Due: {fmt(selected.dueDate)}</span>
            <span><i className="isax isax-medal-star" style={{ marginRight: 4 }} />Total marks: {selected.totalMark}</span>
          </div>
        </div>
      )}

      {loadingSubmission ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--lx-text-light)', fontSize: 14 }}>Checking submission…</div>
      ) : activeTab === 'result' && submission ? (
        // ── Show Result ──
        <div style={{ background: 'var(--lx-card)', border: '1px solid var(--lx-border)', borderRadius: 'var(--lx-radius)', padding: '20px 24px' }}>
          <h6 style={{ fontWeight: 700, marginBottom: 16 }}>Your Submission</h6>

          {submission.grade !== undefined && submission.grade !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px 18px', borderRadius: 10, background: 'var(--lx-bg)' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: gradeColor(submission.grade, submission.totalMark) }}>
                {submission.grade}/{submission.totalMark}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: gradeColor(submission.grade, submission.totalMark) }}>
                  {Math.round((submission.grade / submission.totalMark) * 100)}%
                </div>
                {submission.gradedByName && <div style={{ fontSize: 12, color: 'var(--lx-text-light)' }}>Graded by {submission.gradedByName}</div>}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(217,119,6,0.08)', color: '#d97706', fontSize: 13, fontWeight: 600 }}>
              <i className="isax isax-clock" style={{ marginRight: 6 }} />Awaiting grading
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lx-text-light)', marginBottom: 4 }}>Your Answer</div>
            <div style={{ background: 'var(--lx-bg)', borderRadius: 8, padding: '12px 16px', fontSize: 14, whiteSpace: 'pre-wrap' }}>{submission.content}</div>
          </div>

          {submission.fileUrl && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lx-text-light)', marginBottom: 4 }}>Attached File</div>
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--lx-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <i className="isax isax-paperclip-2" />View attachment
              </a>
            </div>
          )}

          {submission.feedback && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lx-text-light)', marginBottom: 4 }}>Instructor Feedback</div>
              <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 8, padding: '12px 16px', fontSize: 14, whiteSpace: 'pre-wrap' }}>{submission.feedback}</div>
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--lx-text-light)' }}>
            Submitted: {fmt(submission.submittedAt)}
          </div>
        </div>
      ) : (
        // ── Submit Form ──
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--lx-card)', border: '1px solid var(--lx-border)', borderRadius: 'var(--lx-radius)', padding: '20px 24px' }}>
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>Submit Your Work</h6>

            {submitError && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)', color: '#dc2626', fontSize: 13 }}>
                {submitError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Your Answer <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                required
                rows={8}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your answer here…"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--lx-border)', background: 'var(--lx-bg)', fontSize: 14, resize: 'vertical', outline: 'none', color: 'var(--lx-text)' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>File URL (optional)</label>
              <input
                type="url"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--lx-border)', background: 'var(--lx-bg)', fontSize: 14, outline: 'none', color: 'var(--lx-text)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="lx-btn lx-btn-primary" disabled={submitting || !content.trim()}>
                {submitting ? 'Submitting…' : 'Submit Assignment'}
              </button>
              <button type="button" className="lx-btn lx-btn-outline" onClick={back}>Cancel</button>
            </div>
          </div>
        </form>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentAssignment;
