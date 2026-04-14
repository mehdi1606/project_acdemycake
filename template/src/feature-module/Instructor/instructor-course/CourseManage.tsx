import React, { useCallback, useEffect, useRef, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { instructorService } from '../../../services/api/instructor.service';
import { courseService } from '../../../services/api/course.service';
import { Course, CourseModule, CourseLesson } from '../../../services/api/types';
import { App } from 'antd';
import { all_routes } from '../../router/all_routes';
import { getFileUrl } from '../../../environment';

/* ── Shared Styles ─────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid rgba(107, 29, 42, 0.12)',
  borderRadius: 'var(--lx-radius-sm)', fontSize: 14,
  outline: 'none', background: 'rgba(255,255,255,0.6)',
  color: 'var(--lx-text)', transition: 'border-color 0.2s ease',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C3D2E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  paddingRight: 36,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--lx-text-mid)', marginBottom: 6,
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.3)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)';
  },
};

/* ── Rich Text Toolbar ────────────────────────────────── */
type RichToolbarProps = { editorRef: React.RefObject<HTMLDivElement | null> };
const RichToolbar: React.FC<RichToolbarProps> = ({ editorRef }) => {
  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val ?? undefined);
  };
  const btn = (
    icon: string, cmd: string, title: string, val?: string,
    style?: React.CSSProperties
  ) => (
    <button
      type="button" title={title} onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
      style={{
        border: 'none', background: 'transparent', cursor: 'pointer',
        padding: '4px 7px', borderRadius: 5, fontSize: 13, color: '#4b5563',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s', ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107,29,42,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon.startsWith('fa-') ? <i className={`fa-solid ${icon}`} /> : icon}
    </button>
  );
  const sep = () => (
    <span style={{ width: 1, height: 20, background: 'rgba(107,29,42,0.12)', margin: '0 4px', display: 'inline-block', verticalAlign: 'middle' }} />
  );
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
      padding: '6px 10px', background: 'rgba(107,29,42,0.02)',
      borderRadius: '8px 8px 0 0', border: '1.5px solid rgba(107,29,42,0.12)',
      borderBottom: 'none',
    }}>
      {btn('fa-bold',          'bold',          'Bold')}
      {btn('fa-italic',        'italic',        'Italic')}
      {btn('fa-underline',     'underline',     'Underline')}
      {btn('fa-strikethrough', 'strikeThrough', 'Strikethrough')}
      {sep()}
      {btn('H1', 'formatBlock', 'Heading 1', '<h1>', { fontSize: 12, fontWeight: 800 })}
      {btn('H2', 'formatBlock', 'Heading 2', '<h2>', { fontSize: 12, fontWeight: 700 })}
      {btn('H3', 'formatBlock', 'Heading 3', '<h3>', { fontSize: 12, fontWeight: 600 })}
      {btn('¶',  'formatBlock', 'Paragraph', '<p>',  { fontSize: 14 })}
      {sep()}
      {btn('fa-list-ul',      'insertUnorderedList', 'Bullet List')}
      {btn('fa-list-ol',      'insertOrderedList',   'Numbered List')}
      {sep()}
      {btn('fa-quote-left',   'formatBlock', 'Blockquote', '<blockquote>')}
      {btn('fa-code',         'formatBlock', 'Code Block', '<pre>')}
      {sep()}
      {btn('fa-align-left',   'justifyLeft',   'Align Left')}
      {btn('fa-align-center', 'justifyCenter', 'Align Center')}
      {btn('fa-align-right',  'justifyRight',  'Align Right')}
      {sep()}
      <button
        type="button" title="Insert Link"
        onMouseDown={(e) => {
          e.preventDefault();
          const url = window.prompt('Enter URL:', 'https://');
          if (url) { editorRef.current?.focus(); document.execCommand('createLink', false, url); }
        }}
        style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          padding: '4px 7px', borderRadius: 5, fontSize: 13, color: '#4b5563',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107,29,42,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <i className="fa-solid fa-link" />
      </button>
      {btn('fa-eraser', 'removeFormat', 'Clear Formatting')}
    </div>
  );
};

/* ── Glass Modal ──────────────────────────────────────── */
const GlassModal = ({
  open, onClose, title, maxWidth = 520, closable = true, children,
}: {
  open: boolean; onClose: () => void; title: string; maxWidth?: number; closable?: boolean; children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (closable && e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth,
        background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
        borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
        boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          padding: '22px 28px', borderBottom: '1px solid rgba(107, 29, 42, 0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h5 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--lx-text)' }}>{title}</h5>
          {closable && (
            <button type="button" onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
              color: 'var(--lx-text-muted)', padding: 4,
            }}>
              <i className="isax isax-close-circle" />
            </button>
          )}
        </div>
        <div style={{ padding: '20px 28px 24px' }}>{children}</div>
      </div>
    </div>
  );
};

/* ── Confirm Modal ────────────────────────────────────── */
const ConfirmModal = ({
  open, onClose, onConfirm, title, text, confirmText = 'Delete', loading = false,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; text: string; confirmText?: string; loading?: boolean;
}) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1060,
        background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 420, padding: 32, textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
        borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(107, 29, 42, 0.1)',
        boxShadow: '0 24px 48px rgba(44, 24, 16, 0.15)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
          background: 'rgba(139, 35, 53, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="isax isax-trash" style={{ fontSize: 24, color: '#8B2335' }} />
        </div>
        <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>{title}</h5>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>{text}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <button type="button" className="lx-btn lx-btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="button" className="lx-btn" disabled={loading}
            style={{
              background: 'rgba(139, 35, 53, 0.08)', color: '#8B2335',
              border: '1.5px solid rgba(139, 35, 53, 0.15)', opacity: loading ? 0.6 : 1,
            }}
            onClick={onConfirm}
          >
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Types ─────────────────────────────────────────────── */
interface ModuleWithLessons extends CourseModule {
  lessons: CourseLesson[];
  isExpanded: boolean;
}

/* ── Component ─────────────────────────────────────────── */
const CourseManage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [editingModule, setEditingModule] = useState<ModuleWithLessons | null>(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; text: string; onConfirm: () => Promise<void>;
  }>({ open: false, title: '', text: '', onConfirm: async () => {} });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form states
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonType, setLessonType] = useState<'VIDEO' | 'TEXT' | 'QUIZ'>('VIDEO');
  const [submitting, setSubmitting] = useState(false);

  // Text content editor states
  const [textModalVisible,   setTextModalVisible]   = useState(false);
  const [textLesson,         setTextLesson]         = useState<CourseLesson | null>(null);
  const [textLessonTitle,    setTextLessonTitle]    = useState('');
  const [textLoadingContent, setTextLoadingContent] = useState(false);
  const [savingContent,      setSavingContent]      = useState(false);
  const [resources,          setResources]          = useState<{ id: string; name: string; url: string; type: string; size?: number }[]>([]);
  const [uploadingResource,  setUploadingResource]  = useState(false);
  const editorRef   = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  /* ── Text Content Editor ── */
  const handleOpenTextEditor = useCallback(async (lesson: CourseLesson) => {
    setTextLesson(lesson);
    setTextLessonTitle(lesson.title);
    setResources([]);
    setTextModalVisible(true);
    setTextLoadingContent(true);
    try {
      const detail = await instructorService.getLessonDetail(lesson.id);
      const html = detail.textContent || '';
      setResources(detail.resources || []);
      setTimeout(() => {
        if (editorRef.current) editorRef.current.innerHTML = html;
      }, 80);
    } catch {
      // Open empty editor — instructor can still write and save content
      setTimeout(() => {
        if (editorRef.current) editorRef.current.innerHTML = '';
      }, 80);
    } finally {
      setTextLoadingContent(false);
    }
  }, []);

  const handleSaveTextContent = useCallback(async () => {
    if (!textLesson) return;
    const html = editorRef.current?.innerHTML ?? '';
    try {
      setSavingContent(true);
      // Backend requires all fields on PUT — send full lesson data + updated textContent
      await instructorService.updateLesson(textLesson.id, {
        title:        textLesson.title,
        description:  textLesson.description,
        contentType:  textLesson.contentType as 'VIDEO' | 'TEXT' | 'QUIZ',
        orderIndex:   textLesson.orderIndex,
        isFreePreview: textLesson.isFreePreview ?? false,
        textContent:  html,
      });
      message.success('Content saved successfully!');
      setTextModalVisible(false);
    } catch (err: any) {
      const serverMsg: string = err?.response?.data?.message ?? '';
      message.error(serverMsg || 'Failed to save content');
    } finally {
      setSavingContent(false);
    }
  }, [textLesson, message]);

  const handleResourceUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !textLesson) return;
    const allowedTypes = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'image/png', 'image/jpeg', 'image/gif',
    ];
    if (!allowedTypes.includes(file.type)) {
      message.error('Unsupported file type. Use PDF, DOC, DOCX, PPT, PPTX, TXT, or images.');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      message.error('File too large (max 50MB)');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }
    try {
      setUploadingResource(true);
      const res = await instructorService.uploadLessonResource(textLesson.id, file, file.name);
      setResources((prev) => [...prev, res]);
      message.success(`"${file.name}" uploaded successfully!`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 500 || status === 501 || status === 404) {
        message.warning('File attachment is not supported by the server yet. You can still write and save text content.');
      } else {
        message.error('Failed to upload file. Please try again.');
      }
    } finally {
      setUploadingResource(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  }, [textLesson, message]);

  const handleDeleteResource = useCallback(async (resourceId: string, name: string) => {
    if (!textLesson) return;
    try {
      await instructorService.deleteLessonResource(textLesson.id, resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      message.success(`"${name}" removed`);
    } catch {
      message.error('Failed to remove file');
    }
  }, [textLesson, message]);

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);
      const modulesData = await instructorService.getCourseModules(courseId);
      const modulesWithLessons: ModuleWithLessons[] = modulesData.map((mod: CourseModule) => ({
        ...mod, lessons: (mod as any).lessons || [], isExpanded: false,
      }));
      setModules(modulesWithLessons);
    } catch (err) {
      console.error('Error fetching course:', err);
      message.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((mod) => (mod.id === moduleId ? { ...mod, isExpanded: !mod.isExpanded } : mod))
    );
  };

  /* Module CRUD */
  const handleAddModule = () => {
    setEditingModule(null);
    setModuleTitle(''); setModuleDesc('');
    setModuleModalVisible(true);
  };

  const handleEditModule = (module: ModuleWithLessons) => {
    setEditingModule(module);
    setModuleTitle(module.title);
    setModuleDesc(module.description || '');
    setModuleModalVisible(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !moduleTitle.trim()) return;
    try {
      setSubmitting(true);
      if (editingModule) {
        await instructorService.updateModule(editingModule.id, {
          title: moduleTitle, description: moduleDesc, orderIndex: editingModule.orderIndex,
        });
        message.success('Module updated successfully');
      } else {
        await instructorService.createModule(courseId, {
          title: moduleTitle, description: moduleDesc, orderIndex: modules.length,
        });
        message.success('Module created successfully');
      }
      setModuleModalVisible(false);
      setEditingModule(null);
      fetchCourseData();
    } catch (err) {
      console.error('Error saving module:', err);
      message.error(editingModule ? 'Failed to update module' : 'Failed to create module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    setConfirmModal({
      open: true,
      title: 'Delete Module?',
      text: 'Are you sure you want to delete this module and all its lessons? This action cannot be undone.',
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await instructorService.deleteModule(moduleId);
          message.success('Module deleted');
          setConfirmModal((prev) => ({ ...prev, open: false }));
          fetchCourseData();
        } catch {
          message.error('Failed to delete module');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  /* Lesson CRUD */
  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setLessonTitle(''); setLessonDesc(''); setLessonType('VIDEO');
    setLessonModalVisible(true);
  };

  const handleEditLesson = (lesson: CourseLesson, moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDesc(lesson.description || '');
    setLessonType(lesson.contentType as 'VIDEO' | 'TEXT' | 'QUIZ');
    setLessonModalVisible(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId || !lessonTitle.trim()) return;
    try {
      setSubmitting(true);
      if (editingLesson) {
        await instructorService.updateLesson(editingLesson.id, {
          title: lessonTitle, description: lessonDesc,
          contentType: lessonType, orderIndex: editingLesson.orderIndex,
          isFreePreview: editingLesson.isFreePreview,
        });
        message.success('Lesson updated successfully');
      } else {
        const moduleData = modules.find((m) => m.id === selectedModuleId);
        await instructorService.createLesson(selectedModuleId, {
          title: lessonTitle, description: lessonDesc,
          contentType: lessonType, orderIndex: moduleData?.lessons?.length || 0,
          isFreePreview: false,
        });
        message.success('Lesson created successfully');
      }
      setLessonModalVisible(false);
      setEditingLesson(null);
      fetchCourseData();
    } catch (err) {
      console.error('Error saving lesson:', err);
      message.error(editingLesson ? 'Failed to update lesson' : 'Failed to create lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setConfirmModal({
      open: true, title: 'Delete Lesson?',
      text: 'Are you sure you want to delete this lesson?',
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await instructorService.deleteLesson(lessonId);
          message.success('Lesson deleted');
          setConfirmModal((prev) => ({ ...prev, open: false }));
          fetchCourseData();
        } catch {
          message.error('Failed to delete lesson');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  /* Video Upload */
  const handleUploadVideoClick = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setSelectedFile(null);
    setUploadProgress(0);
    setVideoModalVisible(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) { message.error('Please select a valid video file'); return; }
      if (file.size > 2 * 1024 * 1024 * 1024) { message.error('File size exceeds 2GB limit'); return; }
      setSelectedFile(file);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedLessonId || !selectedFile) { message.error('Please select a video file'); return; }
    try {
      setUploading(true);
      setUploadProgress(0);
      await instructorService.uploadVideo(selectedLessonId, selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      message.success('Video uploaded successfully! Processing will begin shortly.');
      setVideoModalVisible(false);
      setSelectedFile(null);
      fetchCourseData();
    } catch (err) {
      console.error('Error uploading video:', err);
      message.error('Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCloseVideoModal = () => {
    if (uploading) {
      setConfirmModal({
        open: true, title: 'Cancel Upload?',
        text: 'Upload is in progress. Are you sure you want to cancel?',
        onConfirm: async () => {
          setVideoModalVisible(false);
          setSelectedFile(null);
          setUploading(false);
          setUploadProgress(0);
          setConfirmModal((prev) => ({ ...prev, open: false }));
        },
      });
    } else {
      setVideoModalVisible(false);
      setSelectedFile(null);
    }
  };

  const getVideoStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      ready: { cls: 'badge-success', label: 'Ready' },
      processing: { cls: 'badge-warning', label: 'Processing' },
      uploading: { cls: 'badge-info', label: 'Uploading' },
      error: { cls: 'badge-danger', label: 'Error' },
    };
    const s = map[status] || { cls: 'badge-slate', label: 'No Video' };
    return <span className={`lx-badge ${s.cls}`} style={{ fontSize: 10 }}>{s.label}</span>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusLabel = (s: string) => {
    if (s === 'PUBLISHED') return { text: 'Published', cls: 'badge-success' };
    if (s === 'PENDING_REVIEW') return { text: 'Pending Review', cls: 'badge-warning' };
    if (s === 'DRAFT') return { text: 'Draft', cls: 'badge-slate' };
    if (s === 'REJECTED') return { text: 'Rejected', cls: 'badge-danger' };
    return { text: s, cls: 'badge-info' };
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <LuxuryDashboardLayout>
        <div className="lx-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid rgba(107, 29, 42, 0.1)',
            borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ margin: 0, fontSize: 14, color: 'var(--lx-text-muted)' }}>Loading course...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </LuxuryDashboardLayout>
    );
  }

  /* ── Not Found ── */
  if (!course) {
    return (
      <LuxuryDashboardLayout>
        <div className="lx-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(139, 35, 53, 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="isax isax-warning-2" style={{ fontSize: 28, color: '#8B2335' }} />
          </div>
          <h6 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>Course Not Found</h6>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--lx-text-muted)' }}>
            The course you are looking for does not exist or has been removed.
          </p>
          <button className="lx-btn lx-btn-gold" onClick={() => navigate(all_routes.instructorCourse)}>
            Back to Courses
          </button>
        </div>
      </LuxuryDashboardLayout>
    );
  }

  const st = statusLabel(course.status);

  return (
    <LuxuryDashboardLayout>
      {/* ── Course Header ── */}
      <div className="lx-card" style={{ marginBottom: 20 }}>
        <div className="lx-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h5 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--lx-text)' }}>
              {course.title}
            </h5>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--lx-text-muted)', lineHeight: 1.5 }}>
              {course.shortDescription}
            </p>
          </div>
          <span className={`lx-badge ${st.cls}`} style={{ fontSize: 12, flexShrink: 0 }}>
            {st.text}
          </span>
        </div>
      </div>

      {/* ── Curriculum Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h6 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
          Course Curriculum
        </h6>
        <button
          className="lx-btn lx-btn-sm lx-btn-gold"
          onClick={handleAddModule}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13 }}
        >
          <i className="isax isax-add" style={{ fontSize: 15 }} />
          Add Module
        </button>
      </div>

      {/* ── Modules ── */}
      {modules.length === 0 ? (
        <div className="lx-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(107, 29, 42, 0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="isax isax-book-1" style={{ fontSize: 28, color: 'var(--lx-text-muted)' }} />
          </div>
          <h6 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>No Modules Yet</h6>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--lx-text-muted)' }}>
            Start by adding your first module to organize your course content.
          </p>
          <button className="lx-btn lx-btn-gold" onClick={handleAddModule}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="isax isax-add" style={{ fontSize: 16 }} /> Add Module
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modules.map((module, index) => (
            <div key={module.id} className="lx-card" style={{ overflow: 'hidden', padding: 0 }}>
              {/* Module Header */}
              <div
                style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: module.isExpanded ? 'rgba(107, 29, 42, 0.02)' : 'transparent',
                  borderBottom: module.isExpanded ? '1px solid rgba(107, 29, 42, 0.06)' : 'none',
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}
                  onClick={() => toggleModule(module.id)}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: 'rgba(107, 29, 42, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                    transform: module.isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                  }}>
                    <i className="isax isax-arrow-right-3" style={{ fontSize: 13, color: 'var(--lx-primary)' }} />
                  </div>
                  <div>
                    <h6 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--lx-text)' }}>
                      Module {index + 1}: {module.title}
                    </h6>
                    <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
                      {module.lessons?.length || 0} lesson{(module.lessons?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button" className="lx-btn lx-btn-sm lx-btn-outline"
                    onClick={() => handleAddLesson(module.id)}
                    style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <i className="isax isax-add" style={{ fontSize: 13 }} /> Add Lesson
                  </button>
                  <ActionBtn icon="isax-edit-2" title="Edit" onClick={(e) => { e.stopPropagation(); handleEditModule(module); }} />
                  <ActionBtn icon="isax-trash" title="Delete" danger onClick={() => handleDeleteModule(module.id)} />
                </div>
              </div>

              {/* Lessons */}
              {module.isExpanded && (
                <div style={{ padding: '4px 0' }}>
                  {module.lessons?.length === 0 ? (
                    <p style={{
                      textAlign: 'center', padding: '28px 20px', margin: 0,
                      fontSize: 14, color: 'var(--lx-text-muted)',
                    }}>
                      No lessons yet. Click "Add Lesson" to create one.
                    </p>
                  ) : (
                    module.lessons.map((lesson, li) => (
                      <div
                        key={lesson.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 20px', margin: '0 12px',
                          borderBottom: li < module.lessons.length - 1
                            ? '1px solid rgba(107, 29, 42, 0.04)' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 29, 42, 0.015)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                            background: 'rgba(107, 29, 42, 0.04)', fontSize: 12, fontWeight: 700,
                            color: 'var(--lx-text-muted)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            {li + 1}
                          </span>
                          <div>
                            <h6 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--lx-text)' }}>
                              {lesson.title}
                            </h6>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
                                {lesson.contentType}
                              </span>
                              {lesson.contentType === 'VIDEO' && (
                                <>
                                  <span style={{ color: 'rgba(107, 29, 42, 0.15)' }}>|</span>
                                  {getVideoStatusBadge((lesson as any).videoStatus || 'pending')}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          {lesson.contentType === 'VIDEO' && (lesson as any).videoStatus !== 'ready' && (
                            <button
                              type="button" className="lx-btn lx-btn-sm lx-btn-gold"
                              onClick={() => handleUploadVideoClick(lesson.id)}
                              style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <i className="isax isax-video-add" style={{ fontSize: 13 }} /> Upload Video
                            </button>
                          )}
                          {lesson.contentType === 'TEXT' && (
                            <button
                              type="button" className="lx-btn lx-btn-sm"
                              onClick={() => handleOpenTextEditor(lesson)}
                              style={{
                                fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                                border: '1px solid rgba(59,130,246,0.2)',
                              }}
                            >
                              <i className="isax isax-document-text" style={{ fontSize: 13 }} /> Edit Content
                            </button>
                          )}
                          {lesson.contentType === 'QUIZ' && (
                            <button
                              type="button" className="lx-btn lx-btn-sm"
                              onClick={() => navigate(`${all_routes.instructorQuiz}?lessonId=${lesson.id}&courseId=${courseId}`)}
                              style={{
                                fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'rgba(197,151,62,0.10)', color: '#C5973E',
                                border: '1px solid rgba(197,151,62,0.25)',
                              }}
                            >
                              <i className="isax isax-award" style={{ fontSize: 13 }} /> Manage Quiz
                            </button>
                          )}
                          <ActionBtn icon="isax-edit-2" title="Edit" onClick={() => handleEditLesson(lesson, module.id)} />
                          <ActionBtn icon="isax-trash" title="Delete" danger onClick={() => handleDeleteLesson(lesson.id)} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── MODAL: Add/Edit Module ── */}
      <GlassModal
        open={moduleModalVisible}
        onClose={() => { setModuleModalVisible(false); setEditingModule(null); }}
        title={editingModule ? 'Edit Module' : 'Add New Module'}
      >
        <form onSubmit={handleModuleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Module Title <span style={{ color: '#8B2335' }}>*</span></label>
            <input
              type="text" style={inputStyle} placeholder="e.g., Introduction to Cake Design"
              value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)}
              required {...focusHandlers}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Description <span style={{ color: 'var(--lx-text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={textareaStyle} placeholder="Brief description of this module" rows={3}
              value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)}
              {...focusHandlers}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={() => { setModuleModalVisible(false); setEditingModule(null); }}>
              Cancel
            </button>
            <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
              {submitting ? (editingModule ? 'Updating...' : 'Creating...') : (editingModule ? 'Update Module' : 'Create Module')}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── MODAL: Add/Edit Lesson ── */}
      <GlassModal
        open={lessonModalVisible}
        onClose={() => { setLessonModalVisible(false); setEditingLesson(null); }}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
      >
        <form onSubmit={handleLessonSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Lesson Title <span style={{ color: '#8B2335' }}>*</span></label>
            <input
              type="text" style={inputStyle} placeholder="e.g., Setting Up Your Workspace"
              value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)}
              required {...focusHandlers}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description <span style={{ color: 'var(--lx-text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={textareaStyle} placeholder="Brief description of this lesson" rows={3}
              value={lessonDesc} onChange={(e) => setLessonDesc(e.target.value)}
              {...focusHandlers}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Content Type <span style={{ color: '#8B2335' }}>*</span></label>
            <select
              style={selectStyle} value={lessonType}
              onChange={(e) => setLessonType(e.target.value as 'VIDEO' | 'TEXT' | 'QUIZ')}
              disabled={!!editingLesson}
              {...focusHandlers}
            >
              <option value="VIDEO">Video Lesson</option>
              <option value="TEXT">Text / Article</option>
              <option value="QUIZ">Quiz</option>
            </select>
          </div>

          {!editingLesson && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--lx-radius-sm)',
              background: 'rgba(45, 140, 255, 0.04)', border: '1px solid rgba(45, 140, 255, 0.1)',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="isax isax-info-circle" style={{ fontSize: 16, color: '#2D8CFF', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
                After creating the lesson, you can upload the video from the lesson list.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={() => { setLessonModalVisible(false); setEditingLesson(null); }}>
              Cancel
            </button>
            <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
              {submitting ? (editingLesson ? 'Updating...' : 'Creating...') : (editingLesson ? 'Update Lesson' : 'Create Lesson')}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── MODAL: Video Upload ── */}
      <GlassModal
        open={videoModalVisible}
        onClose={handleCloseVideoModal}
        title="Upload Lesson Video"
        maxWidth={560}
        closable={!uploading}
      >
        {!uploading ? (
          <>
            {/* Drop Zone */}
            <div
              style={{
                border: '2px dashed rgba(107, 29, 42, 0.12)', borderRadius: 'var(--lx-radius-sm)',
                padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                background: 'rgba(107, 29, 42, 0.015)', transition: 'border-color 0.2s, background 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.25)';
                e.currentTarget.style.background = 'rgba(107, 29, 42, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(107, 29, 42, 0.12)';
                e.currentTarget.style.background = 'rgba(107, 29, 42, 0.015)';
              }}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" style={{ display: 'none' }} />
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
                background: 'rgba(107, 29, 42, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-video-play" style={{ fontSize: 24, color: 'var(--lx-text-muted)' }} />
              </div>
              <h6 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
                {selectedFile ? selectedFile.name : 'Click to select video file'}
              </h6>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                {selectedFile ? `Size: ${formatFileSize(selectedFile.size)}` : 'Supported: MP4, MOV, AVI, MKV (Max 2GB)'}
              </p>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div style={{
                marginTop: 16, padding: 14, borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(107, 29, 42, 0.02)', border: '1px solid rgba(107, 29, 42, 0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="isax isax-video-circle" style={{ fontSize: 22, color: 'var(--lx-primary)' }} />
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--lx-text)', display: 'block' }}>
                      {selectedFile.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                </div>
                <button
                  type="button" onClick={() => setSelectedFile(null)}
                  style={{
                    background: 'rgba(139, 35, 53, 0.06)', border: 'none', borderRadius: 6,
                    width: 30, height: 30, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#8B2335', fontSize: 14,
                  }}
                >
                  <i className="isax isax-trash" />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={handleCloseVideoModal}>
                Cancel
              </button>
              <button
                type="button" className="lx-btn lx-btn-gold" onClick={handleUploadVideo}
                disabled={!selectedFile} style={{ opacity: selectedFile ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <i className="isax isax-arrow-up-1" style={{ fontSize: 15 }} /> Upload Video
              </button>
            </div>
          </>
        ) : (
          /* Upload Progress */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid rgba(107, 29, 42, 0.1)',
              borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h6 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
              Uploading Video...
            </h6>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
              Please wait while your video is being uploaded.
            </p>

            {/* Progress Bar */}
            <div style={{
              width: '100%', height: 8, borderRadius: 4,
              background: 'rgba(107, 29, 42, 0.08)', overflow: 'hidden', marginBottom: 8,
            }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, var(--lx-primary), #C5973E)',
                width: `${uploadProgress}%`, transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lx-primary)' }}>
              {uploadProgress}%
            </span>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--lx-text-muted)' }}>
              Do not close this window until upload is complete.
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 'var(--lx-radius-sm)',
          background: 'rgba(45, 140, 255, 0.04)', border: '1px solid rgba(45, 140, 255, 0.1)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="isax isax-info-circle" style={{ fontSize: 16, color: '#2D8CFF', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
            Your video will be automatically transcoded for optimal streaming. This may take a few minutes after upload completes.
          </span>
        </div>
      </GlassModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL: Text / Article Content Editor ── */}
      <GlassModal
        open={textModalVisible}
        onClose={() => { if (!savingContent) setTextModalVisible(false); }}
        title={`✏️ Edit Content — ${textLessonTitle}`}
        maxWidth={820}
        closable={!savingContent}
      >
        {textLoadingContent ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 32, height: 32, border: '3px solid rgba(107,29,42,0.1)',
              borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--lx-text-muted)', fontSize: 14 }}>Loading content…</p>
          </div>
        ) : (
          <>
            {/* ─ Rich Text Editor ─ */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>
                <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6, color: '#6B1D2A' }} />
                Lesson Content
              </label>

              {/* Toolbar */}
              <RichToolbar editorRef={editorRef} />

              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                style={{
                  minHeight: 260, padding: '14px 16px',
                  border: '1.5px solid rgba(107,29,42,0.12)',
                  borderRadius: '0 0 8px 8px',
                  fontSize: 14, lineHeight: 1.75, color: '#374151',
                  background: '#fff', outline: 'none', overflowY: 'auto',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107,29,42,0.3)'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(107,29,42,0.12)'; }}
              />
              <p style={{ fontSize: 11, color: 'var(--lx-text-muted)', marginTop: 4, marginBottom: 0 }}>
                Tip: Select text and use the toolbar to format. Supports bold, headings, lists, code blocks & more.
              </p>
            </div>

            {/* ─ Attachments (PDF, Docs, etc.) ─ */}
            <div style={{
              marginBottom: 24, padding: 18,
              background: 'rgba(107,29,42,0.015)', borderRadius: 10,
              border: '1.5px solid rgba(107,29,42,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ ...labelStyle, margin: 0 }}>
                  <i className="fa-solid fa-paperclip" style={{ marginRight: 6, color: '#6B1D2A' }} />
                  Attachments &amp; Resources
                </label>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, cursor: uploadingResource ? 'wait' : 'pointer',
                  background: uploadingResource ? 'rgba(107,29,42,0.04)' : 'rgba(107,29,42,0.06)',
                  color: '#6B1D2A', fontWeight: 600, fontSize: 12,
                  border: '1px solid rgba(107,29,42,0.12)',
                  opacity: uploadingResource ? 0.7 : 1,
                }}>
                  <i className={`fa-solid ${uploadingResource ? 'fa-spinner fa-spin' : 'fa-plus'}`} />
                  {uploadingResource ? 'Uploading…' : 'Attach File'}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif"
                    style={{ display: 'none' }}
                    onChange={handleResourceUpload}
                    disabled={uploadingResource}
                  />
                </label>
              </div>

              <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginBottom: 12 }}>
                Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, Images — Max 50MB each
              </p>

              {/* File list */}
              {resources.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '20px 0',
                  border: '2px dashed rgba(107,29,42,0.1)', borderRadius: 8,
                  color: 'var(--lx-text-muted)',
                }}>
                  <i className="fa-solid fa-file-arrow-up" style={{ fontSize: 28, marginBottom: 8, display: 'block', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No attachments yet. Click "Attach File" to add resources.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resources.map((res) => {
                    const ext = res.name.split('.').pop()?.toLowerCase() ?? '';
                    const iconMap: Record<string, { icon: string; color: string }> = {
                      pdf:  { icon: 'fa-file-pdf',          color: '#EF4444' },
                      doc:  { icon: 'fa-file-word',         color: '#2563EB' },
                      docx: { icon: 'fa-file-word',         color: '#2563EB' },
                      ppt:  { icon: 'fa-file-powerpoint',   color: '#F97316' },
                      pptx: { icon: 'fa-file-powerpoint',   color: '#F97316' },
                      txt:  { icon: 'fa-file-lines',        color: '#6B7280' },
                      png:  { icon: 'fa-file-image',        color: '#8B5CF6' },
                      jpg:  { icon: 'fa-file-image',        color: '#8B5CF6' },
                      jpeg: { icon: 'fa-file-image',        color: '#8B5CF6' },
                      gif:  { icon: 'fa-file-image',        color: '#8B5CF6' },
                    };
                    const fi = iconMap[ext] ?? { icon: 'fa-file', color: '#6B7280' };
                    const sizeLabel = res.size
                      ? res.size > 1024 * 1024
                        ? `${(res.size / 1024 / 1024).toFixed(1)} MB`
                        : `${Math.round(res.size / 1024)} KB`
                      : '';

                    return (
                      <div key={res.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 8, background: '#fff',
                        border: '1px solid rgba(107,29,42,0.06)',
                        boxShadow: '0 1px 4px rgba(107,29,42,0.04)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <i className={`fa-solid ${fi.icon}`} style={{ fontSize: 22, color: fi.color, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <a
                              href={getFileUrl(res.url) ?? res.url}
                              target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: 13, fontWeight: 600, color: '#2C1810',
                                textDecoration: 'none', display: 'block',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}
                            >
                              {res.name}
                            </a>
                            {sizeLabel && (
                              <span style={{ fontSize: 11, color: 'var(--lx-text-muted)' }}>{sizeLabel}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a
                            href={getFileUrl(res.url) ?? res.url}
                            target="_blank" rel="noopener noreferrer"
                            title="Preview / Download"
                            style={{
                              width: 30, height: 30, borderRadius: 7,
                              background: 'rgba(59,130,246,0.06)',
                              border: '1px solid rgba(59,130,246,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#3B82F6', textDecoration: 'none', fontSize: 13,
                            }}
                          >
                            <i className="fa-solid fa-arrow-down-to-line" />
                          </a>
                          <button
                            type="button"
                            title="Remove"
                            onClick={() => handleDeleteResource(res.id, res.name)}
                            style={{
                              width: 30, height: 30, borderRadius: 7, border: 'none',
                              background: 'rgba(139,35,53,0.06)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#8B2335', fontSize: 13,
                            }}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─ Action buttons ─ */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button" className="lx-btn lx-btn-outline"
                onClick={() => setTextModalVisible(false)}
                disabled={savingContent}
              >
                Cancel
              </button>
              <button
                type="button" className="lx-btn lx-btn-gold"
                onClick={handleSaveTextContent}
                disabled={savingContent}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: savingContent ? 0.7 : 1 }}
              >
                {savingContent ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" />
                    Save Content
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </GlassModal>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        text={confirmModal.text}
        loading={confirmLoading}
      />
    </LuxuryDashboardLayout>
  );
};

/* ── Small Action Button ──────────────────────────────── */
const ActionBtn = ({
  icon, title, danger, onClick,
}: {
  icon: string; title: string; danger?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) => (
  <button
    type="button" title={title} onClick={onClick}
    style={{
      width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
      background: danger ? 'rgba(139, 35, 53, 0.05)' : 'rgba(107, 29, 42, 0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: danger ? '#8B2335' : 'var(--lx-text-muted)', fontSize: 14,
      transition: 'all 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger ? 'rgba(139, 35, 53, 0.1)' : 'rgba(107, 29, 42, 0.08)';
      if (!danger) e.currentTarget.style.color = 'var(--lx-primary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = danger ? 'rgba(139, 35, 53, 0.05)' : 'rgba(107, 29, 42, 0.04)';
      if (!danger) e.currentTarget.style.color = 'var(--lx-text-muted)';
    }}
  >
    <i className={`isax ${icon}`} />
  </button>
);

export default CourseManage;
