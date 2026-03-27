import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import courseService from '../../../services/api/course.service';
import { Course, CourseLesson, CourseModule, LessonDetail } from '../../../services/api/types';
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

        // Build set of already-completed lesson IDs
        const done = new Set<string>();
        mods.forEach(m => (m.lessons ?? []).forEach(l => { if (l.isCompleted) done.add(l.id); }));
        setCompletedIds(done);

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
      setCompletedIds(prev => new Set(Array.from(prev).concat(selectedLesson.id)));

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

  const lessonIcon = (l: CourseLesson) => {
    if (completedIds.has(l.id)) return 'isax-tick-circle text-success';
    if (l.contentType === 'TEXT') return 'isax-document-text text-muted';
    if (l.contentType === 'QUIZ') return 'isax-award text-warning';
    return l.id === selectedLesson?.id ? 'isax-play-circle text-primary' : 'isax-play-circle5 text-muted';
  };

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
                                return (
                                  <div
                                    key={lesson.id}
                                    role="button"
                                    className={`d-flex align-items-center gap-2 py-2 px-2 mb-1 rounded-2 ${
                                      isActive
                                        ? 'bg-primary bg-opacity-10'
                                        : ''
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => doSelectLesson(lesson)}
                                  >
                                    <i className={`isax flex-shrink-0 fs-18 ${lessonIcon(lesson)}`} />
                                    <div className="flex-grow-1 overflow-hidden">
                                      <p
                                        className={`mb-0 small text-truncate ${
                                          isActive ? 'fw-semibold text-primary' : ''
                                        }`}
                                      >
                                        {lesson.title}
                                      </p>
                                    </div>
                                    {fmtDuration(lesson.videoDurationSeconds) && (
                                      <span className="text-muted small flex-shrink-0">
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
                          <div
                            className="d-flex flex-column align-items-center justify-content-center bg-light rounded-3 py-5"
                            style={{ minHeight: 240 }}
                          >
                            <i className="isax isax-award fs-1 text-warning mb-3 d-block" />
                            <h6 className="mb-2">{selectedLesson.title}</h6>
                            <p className="text-muted small mb-4">Complete this quiz to continue</p>
                            <Link
                              to={routes.studentQuiz}
                              className="btn btn-primary d-inline-flex align-items-center gap-2"
                            >
                              <i className="isax isax-play-circle" />
                              Go to Quizzes
                            </Link>
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
    </>
  );
};

export default CourseWatch;
