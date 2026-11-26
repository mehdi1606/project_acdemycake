import React, { useCallback, useEffect, useRef, useState } from 'react';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import { useTranslation } from 'react-i18next';
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
  border: '1.5px solid rgba(101, 28, 50, 0.12)',
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
    e.currentTarget.style.borderColor = 'rgba(101, 28, 50, 0.3)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(101, 28, 50, 0.12)';
  },
};

/* ── Rich Text Toolbar ────────────────────────────────── */
type RichToolbarProps = { editorRef: React.RefObject<HTMLDivElement | null> };
const RichToolbar: React.FC<RichToolbarProps> = ({ editorRef }) => {
  const { t } = useTranslation();
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
        padding: '4px 7px', borderRadius: 5, fontSize: 13, color: '#66525D',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s', ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(101, 28, 50,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon.startsWith('fa-') ? <i className={`fa-solid ${icon}`} /> : icon}
    </button>
  );
  const sep = () => (
    <span style={{ width: 1, height: 20, background: 'rgba(101, 28, 50,0.12)', margin: '0 4px', display: 'inline-block', verticalAlign: 'middle' }} />
  );
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
      padding: '6px 10px', background: 'rgba(101,28,50,0.04)',
      borderRadius: '8px 8px 0 0', border: '1.5px solid rgba(101,28,50,0.12)',
      borderBottom: 'none',
    }}>
      {btn('fa-bold',          'bold',          t('instructor.courseManage.tbBold', 'Bold'))}
      {btn('fa-italic',        'italic',        t('instructor.courseManage.tbItalic', 'Italic'))}
      {btn('fa-underline',     'underline',     t('instructor.courseManage.tbUnderline', 'Underline'))}
      {btn('fa-strikethrough', 'strikeThrough', t('instructor.courseManage.tbStrike', 'Strikethrough'))}
      {sep()}
      {btn('H1', 'formatBlock', t('instructor.courseManage.tbH1', 'Heading 1'), '<h1>', { fontSize: 12, fontWeight: 800 })}
      {btn('H2', 'formatBlock', t('instructor.courseManage.tbH2', 'Heading 2'), '<h2>', { fontSize: 12, fontWeight: 700 })}
      {btn('H3', 'formatBlock', t('instructor.courseManage.tbH3', 'Heading 3'), '<h3>', { fontSize: 12, fontWeight: 600 })}
      {btn('¶',  'formatBlock', t('instructor.courseManage.tbParagraph', 'Paragraph'), '<p>',  { fontSize: 14 })}
      {sep()}
      {btn('fa-list-ul',      'insertUnorderedList', t('instructor.courseManage.tbBullets', 'Bullet List'))}
      {btn('fa-list-ol',      'insertOrderedList',   t('instructor.courseManage.tbNumbered', 'Numbered List'))}
      {sep()}
      {btn('fa-quote-left',   'formatBlock', t('instructor.courseManage.tbQuote', 'Blockquote'), '<blockquote>')}
      {btn('fa-code',         'formatBlock', t('instructor.courseManage.tbCode', 'Code Block'), '<pre>')}
      {sep()}
      {btn('fa-align-left',   'justifyLeft',   t('instructor.courseManage.tbAlignLeft', 'Align Left'))}
      {btn('fa-align-center', 'justifyCenter', t('instructor.courseManage.tbAlignCenter', 'Align Center'))}
      {btn('fa-align-right',  'justifyRight',  t('instructor.courseManage.tbAlignRight', 'Align Right'))}
      {sep()}
      <button
        type="button" title={t('instructor.courseManage.tbLink', 'Insert Link')}
        onMouseDown={(e) => {
          e.preventDefault();
          const url = window.prompt(t('instructor.courseManage.enterUrl', 'Enter URL:'), 'https://');
          if (url) { editorRef.current?.focus(); document.execCommand('createLink', false, url); }
        }}
        style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          padding: '4px 7px', borderRadius: 5, fontSize: 13, color: '#66525D',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(101, 28, 50,0.08)'; }}
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
        background: 'rgba(43, 15, 30, 0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (closable && e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth,
        background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
        borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(101, 28, 50, 0.1)',
        boxShadow: '0 24px 48px rgba(43, 15, 30, 0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          padding: '22px 28px', borderBottom: '1px solid rgba(101, 28, 50, 0.06)',
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
  open, onClose, onConfirm, title, text, confirmText, loading = false,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; text: string; confirmText?: string; loading?: boolean;
}) => {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1060,
        background: 'rgba(43, 15, 30, 0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 420, padding: 32, textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(32px)',
        borderRadius: 'var(--lx-radius-lg)', border: '1px solid rgba(101, 28, 50, 0.1)',
        boxShadow: '0 24px 48px rgba(43, 15, 30, 0.15)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
          background: 'rgba(101, 28, 50, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="isax isax-trash" style={{ fontSize: 24, color: '#651C32' }} />
        </div>
        <h5 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--lx-text)' }}>{title}</h5>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--lx-text-mid)' }}>{text}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <button type="button" className="lx-btn lx-btn-outline" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
          <button
            type="button" className="lx-btn" disabled={loading}
            style={{
              background: 'rgba(101, 28, 50, 0.08)', color: '#651C32',
              border: '1.5px solid rgba(101, 28, 50, 0.15)', opacity: loading ? 0.6 : 1,
            }}
            onClick={onConfirm}
          >
            {loading ? t('common.deleting', 'Deleting...') : (confirmText ?? t('common.delete', 'Delete'))}
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
  const { t } = useTranslation();
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
    open: boolean; title: string; text: string; confirmText?: string; onConfirm: () => Promise<void>;
  }>({ open: false, title: '', text: '', onConfirm: async () => {} });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form states
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleTitleAr, setModuleTitleAr] = useState('');
  const [moduleDescAr, setModuleDescAr] = useState('');
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
  const [resources,          setResources]          = useState<{ id: number; name: string; url: string; type: string; size?: number }[]>([]);
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
      message.success(t('instructor.courseManage.contentSaved', 'Content saved successfully!'));
      setTextModalVisible(false);
    } catch (err: any) {
      const serverMsg: string = err?.response?.data?.message ?? '';
      message.error(serverMsg || t('instructor.courseManage.contentSaveError', 'Your content couldn\'t be saved. Please try again.'));
    } finally {
      setSavingContent(false);
    }
  }, [textLesson, message, t]);

  /* Upload a PDF that will be DISPLAYED inline as the lesson content (embedded viewer, no download) */
  const handleContentPdfUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !textLesson) return;
    if (file.type !== 'application/pdf') {
      message.error(t('instructor.courseManage.onlyPdf', 'Only PDF files can be displayed as content. Choose a .pdf file.'));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      message.error(t('instructor.courseManage.fileTooLarge50', 'File too large (max 50MB). Please choose a smaller file.'));
      return;
    }
    try {
      setUploadingResource(true);
      const res = await instructorService.uploadLessonResource(textLesson.id, file, file.name);
      // Insert an embed marker into the editor — rendered as an inline PDF viewer for students
      const marker = `<div class="sl-pdf-embed" data-pdf-url="${res.url}" contenteditable="false" style="display:flex;align-items:center;gap:10px;padding:14px 18px;margin:10px 0;background:#FBF7F0;border:1.5px solid #E5D5B8;border-radius:10px;font-weight:600;color:#651C32;">📄 ${file.name} — displayed as lesson content</div><p><br/></p>`;
      if (editorRef.current) {
        editorRef.current.innerHTML += marker;
      }
      message.success(t('instructor.courseManage.pdfWillDisplay', '"{{name}}" will be displayed as lesson content. Click "Save Content" to confirm.', { name: file.name }));
    } catch {
      message.error(t('instructor.courseManage.pdfUploadError', 'The PDF couldn\'t be uploaded. Please try again.'));
    } finally {
      setUploadingResource(false);
    }
  }, [textLesson, message, t]);

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
      message.error(t('instructor.courseManage.unsupportedType', 'Unsupported file type. Use PDF, DOC, DOCX, PPT, PPTX, TXT, or images.'));
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      message.error(t('instructor.courseManage.fileTooLarge50', 'File too large (max 50MB). Please choose a smaller file.'));
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }
    try {
      setUploadingResource(true);
      const res = await instructorService.uploadLessonResource(textLesson.id, file, file.name);
      setResources((prev) => [...prev, res]);
      message.success(t('instructor.courseManage.fileUploaded', '"{{name}}" uploaded successfully!', { name: file.name }));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 500 || status === 501 || status === 404) {
        message.warning(t('instructor.courseManage.attachUnsupported', 'File attachment is not supported by the server yet. You can still write and save text content.'));
      } else {
        message.error(t('instructor.courseManage.fileUploadError', 'The file couldn\'t be uploaded. Please try again.'));
      }
    } finally {
      setUploadingResource(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  }, [textLesson, message, t]);

  const handleDeleteResource = useCallback(async (resourceId: number, name: string) => {
    if (!textLesson) return;
    try {
      await instructorService.deleteLessonResource(textLesson.id, resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      message.success(t('instructor.courseManage.fileRemoved', '"{{name}}" removed', { name }));
    } catch {
      message.error(t('instructor.courseManage.fileRemoveError', 'The file couldn\'t be removed. Please try again.'));
    }
  }, [textLesson, message, t]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      message.error(t('instructor.courseManage.loadError', 'We couldn\'t load this course. Refresh the page to try again.'));
    } finally {
      setLoading(false);
    }
  }, [courseId, t]);

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
    setModuleTitleAr(''); setModuleDescAr('');
    setModuleModalVisible(true);
  };

  const handleEditModule = (module: ModuleWithLessons) => {
    setEditingModule(module);
    setModuleTitle((module as any).titleEn || module.title);
    setModuleDesc((module as any).descriptionEn || module.description || '');
    setModuleTitleAr((module as any).titleAr || '');
    setModuleDescAr((module as any).descriptionAr || '');
    setModuleModalVisible(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !moduleTitle.trim()) return;
    try {
      setSubmitting(true);
      if (editingModule) {
        await instructorService.updateModule(editingModule.id, {
          title: moduleTitle, description: moduleDesc,
          titleEn: moduleTitle, titleAr: moduleTitleAr,
          descriptionEn: moduleDesc, descriptionAr: moduleDescAr,
          orderIndex: editingModule.orderIndex,
        });
        message.success(t('instructor.courseManage.moduleUpdated', 'Module updated successfully'));
      } else {
        await instructorService.createModule(courseId, {
          title: moduleTitle, description: moduleDesc,
          titleEn: moduleTitle, titleAr: moduleTitleAr,
          descriptionEn: moduleDesc, descriptionAr: moduleDescAr,
          orderIndex: modules.length,
        });
        message.success(t('instructor.courseManage.moduleCreated', 'Module created successfully'));
      }
      setModuleModalVisible(false);
      setEditingModule(null);
      fetchCourseData();
    } catch (err) {
      console.error('Error saving module:', err);
      message.error(editingModule ? t('instructor.courseManage.moduleUpdateError', 'The module couldn\'t be updated. Please try again.') : t('instructor.courseManage.moduleCreateError', 'The module couldn\'t be created. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    setConfirmModal({
      open: true,
      title: t('instructor.courseManage.deleteModuleTitle', 'Delete Module?'),
      text: t('instructor.courseManage.deleteModuleText', 'Are you sure you want to delete this module and all its lessons? This action cannot be undone.'),
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await instructorService.deleteModule(moduleId);
          message.success(t('instructor.courseManage.moduleDeleted', 'Module deleted'));
          setConfirmModal((prev) => ({ ...prev, open: false }));
          fetchCourseData();
        } catch {
          message.error(t('instructor.courseManage.moduleDeleteError', 'The module couldn\'t be deleted. Please try again.'));
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
        message.success(t('instructor.courseManage.lessonUpdated', 'Lesson updated successfully'));
      } else {
        const moduleData = modules.find((m) => m.id === selectedModuleId);
        await instructorService.createLesson(selectedModuleId, {
          title: lessonTitle, description: lessonDesc,
          contentType: lessonType, orderIndex: moduleData?.lessons?.length || 0,
          isFreePreview: false,
        });
        message.success(t('instructor.courseManage.lessonCreated', 'Lesson created successfully'));
      }
      setLessonModalVisible(false);
      setEditingLesson(null);
      fetchCourseData();
    } catch (err) {
      console.error('Error saving lesson:', err);
      message.error(editingLesson ? t('instructor.courseManage.lessonUpdateError', 'The lesson couldn\'t be updated. Please try again.') : t('instructor.courseManage.lessonCreateError', 'The lesson couldn\'t be created. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setConfirmModal({
      open: true, title: t('instructor.courseManage.deleteLessonTitle', 'Delete Lesson?'),
      text: t('instructor.courseManage.deleteLessonText', 'Are you sure you want to delete this lesson? This cannot be undone.'),
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await instructorService.deleteLesson(lessonId);
          message.success(t('instructor.courseManage.lessonDeleted', 'Lesson deleted'));
          setConfirmModal((prev) => ({ ...prev, open: false }));
          fetchCourseData();
        } catch {
          message.error(t('instructor.courseManage.lessonDeleteError', 'The lesson couldn\'t be deleted. Please try again.'));
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
      if (!file.type.startsWith('video/')) { message.error(t('instructor.courseManage.invalidVideo', 'Please choose a video file (MP4, MOV, AVI or MKV).')); return; }
      if (file.size > 4 * 1024 * 1024 * 1024) { message.error(t('instructor.courseManage.videoTooLarge', 'This video is larger than 4 GB. Please compress it or choose a smaller file.')); return; }
      setSelectedFile(file);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedLessonId || !selectedFile) { message.error(t('instructor.courseManage.selectVideo', 'Please choose a video file first.')); return; }
    try {
      setUploading(true);
      setUploadProgress(0);
      await instructorService.uploadVideo(selectedLessonId, selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      message.success(t('instructor.courseManage.videoUploaded', 'Video uploaded successfully! It is ready to stream immediately.'));
      setVideoModalVisible(false);
      setSelectedFile(null);
      fetchCourseData();
    } catch (err) {
      console.error('Error uploading video:', err);
      message.error(t('instructor.courseManage.videoUploadError', 'The video couldn\'t be uploaded. Check your connection and try again.'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCloseVideoModal = () => {
    if (uploading) {
      setConfirmModal({
        open: true, title: t('instructor.courseManage.cancelUploadTitle', 'Cancel Upload?'),
        text: t('instructor.courseManage.cancelUploadText', 'Upload is in progress. Are you sure you want to cancel?'),
        confirmText: t('instructor.courseManage.cancelUploadConfirm', 'Yes, cancel upload'),
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
      ready: { cls: 'badge-success', label: t('instructor.courseManage.videoReady', 'Ready') },
      processing: { cls: 'badge-warning', label: t('instructor.courseManage.videoProcessing', 'Processing') },
      uploading: { cls: 'badge-info', label: t('instructor.courseManage.videoUploading', 'Uploading') },
      error: { cls: 'badge-danger', label: t('instructor.courseManage.videoError', 'Error') },
    };
    const s = map[status] || { cls: 'badge-slate', label: t('instructor.courseManage.noVideo', 'No Video') };
    return <span className={`lx-badge ${s.cls}`} style={{ fontSize: 12 }}>{s.label}</span>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusLabel = (s: string) => {
    if (s === 'PUBLISHED') return { text: t('enums.courseStatus.PUBLISHED', 'Published'), cls: 'badge-success' };
    if (s === 'PENDING_REVIEW') return { text: t('enums.courseStatus.PENDING_REVIEW', 'Pending Review'), cls: 'badge-warning' };
    if (s === 'DRAFT') return { text: t('enums.courseStatus.DRAFT', 'Draft'), cls: 'badge-slate' };
    if (s === 'REJECTED') return { text: t('enums.courseStatus.REJECTED', 'Rejected'), cls: 'badge-danger' };
    return { text: s, cls: 'badge-info' };
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <LuxuryDashboardLayout>
        <div className="lx-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid rgba(101, 28, 50, 0.1)',
            borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ margin: 0, fontSize: 14, color: 'var(--lx-text-muted)' }}>{t('instructor.courseManage.loadingCourse', 'Loading course...')}</p>
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
            background: 'rgba(101, 28, 50, 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="isax isax-warning-2" style={{ fontSize: 28, color: '#651C32' }} />
          </div>
          <h6 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>{t('instructor.courseManage.notFoundTitle', 'Course Not Found')}</h6>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--lx-text-muted)' }}>
            {t('instructor.courseManage.notFoundText', 'The course you are looking for does not exist or has been removed.')}
          </p>
          <button className="lx-btn lx-btn-gold" onClick={() => navigate(all_routes.instructorCourse)}>
            {t('instructor.courseManage.backToCourses', 'Back to Courses')}
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
              {(course as any).titleEn || course.title}
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
          {t('instructor.courseManage.curriculum', 'Course Curriculum')}
        </h6>
        <button
          className="lx-btn lx-btn-sm lx-btn-gold"
          onClick={handleAddModule}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13 }}
        >
          <i className="isax isax-add" style={{ fontSize: 15 }} />
          {t('instructor.courseManage.addModule', 'Add Module')}
        </button>
      </div>

      {/* ── Modules ── */}
      {modules.length === 0 ? (
        <div className="lx-card">
          <LxEmptyState
            icon="isax-book-1"
            title={t('instructor.courseManage.noModulesTitle', 'No Modules Yet')}
            text={t('instructor.courseManage.noModulesText', 'Start by adding your first module to organize your course content.')}
          >
            <button type="button" className="lx-btn lx-btn-gold" onClick={handleAddModule}>
              <i className="isax isax-add" /> {t('emptyStates.addModule', 'Add Module')}
            </button>
          </LxEmptyState>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modules.map((module, index) => (
            <div key={module.id} className="lx-card" style={{ overflow: 'hidden', padding: 0 }}>
              {/* Module Header */}
              <div
                style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: module.isExpanded ? 'rgba(101,28,50,0.03)' : 'transparent',
                  borderBottom: module.isExpanded ? '1px solid rgba(101,28,50,0.07)' : 'none',
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}
                  onClick={() => toggleModule(module.id)}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: 'rgba(101, 28, 50, 0.06)',
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
                      {t('instructor.courseManage.lessonCount', '{{n}} lessons', { n: module.lessons?.length || 0 })}
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
                  <ActionBtn icon="isax-edit-2" title={t('common.edit', 'Edit')} onClick={(e) => { e.stopPropagation(); handleEditModule(module); }} />
                  <ActionBtn icon="isax-trash" title={t('common.delete', 'Delete')} danger onClick={() => handleDeleteModule(module.id)} />
                </div>
              </div>

              {/* Lessons */}
              {module.isExpanded && (
                <div style={{ padding: '4px 0' }}>
                  {module.lessons?.length === 0 ? (
                    <LxEmptyState
                      compact
                      icon="isax-video-play"
                      title={t('emptyStates.lessonsTitle', 'No lessons in this module')}
                      text={t('instructor.courseManage.noLessons', 'No lessons yet. Click "Add Lesson" to create one.')}
                    />
                  ) : (
                    module.lessons.map((lesson, li) => (
                      <div
                        key={lesson.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 20px', margin: '0 12px',
                          borderBottom: li < module.lessons.length - 1
                            ? '1px solid rgba(101, 28, 50, 0.04)' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(101, 28, 50, 0.015)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                            background: 'rgba(101, 28, 50, 0.04)', fontSize: 12, fontWeight: 700,
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
                                  <span style={{ color: 'rgba(101, 28, 50, 0.15)' }}>|</span>
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
                              style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <i className="isax isax-video-add" style={{ fontSize: 13 }} /> Upload Video
                            </button>
                          )}
                          {lesson.contentType === 'TEXT' && (
                            <button
                              type="button" className="lx-btn lx-btn-sm"
                              onClick={() => handleOpenTextEditor(lesson)}
                              style={{
                                fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'rgba(101, 28, 50,0.08)', color: '#651C32',
                                border: '1px solid rgba(101, 28, 50,0.2)',
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
                                fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'rgba(197, 145, 44,0.10)', color: '#C5912C',
                                border: '1px solid rgba(197, 145, 44,0.25)',
                              }}
                            >
                              <i className="isax isax-award" style={{ fontSize: 13 }} /> Manage Quiz
                            </button>
                          )}
                          <ActionBtn icon="isax-edit-2" title={t('common.edit', 'Edit')} onClick={() => handleEditLesson(lesson, module.id)} />
                          <ActionBtn icon="isax-trash" title={t('common.delete', 'Delete')} danger onClick={() => handleDeleteLesson(lesson.id)} />
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
        title={editingModule ? t('instructor.courseManage.editModule', 'Edit Module') : t('instructor.courseManage.addNewModule', 'Add New Module')}
        maxWidth={720}
      >
        <form onSubmit={handleModuleSubmit}>
          {/* Module Title — EN / AR side by side */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('instructor.courseManage.moduleTitleEn', 'Module Title (English)')} <span style={{ color: '#651C32' }}>*</span></label>
              <input
                type="text" style={inputStyle} placeholder={t('instructor.courseManage.moduleTitlePh', 'e.g., Introduction to Cake Design')}
                value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)}
                required {...focusHandlers}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>عنوان الوحدة (عربي)</label>
              <input
                type="text" style={{ ...inputStyle, direction: 'rtl', textAlign: 'right' }}
                placeholder="مثال: مقدمة في تصميم الكيك"
                value={moduleTitleAr} onChange={(e) => setModuleTitleAr(e.target.value)}
                {...focusHandlers}
              />
            </div>
          </div>
          {/* Description — EN / AR side by side */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('instructor.courseManage.descriptionEn', 'Description (English)')} <span style={{ color: 'var(--lx-text-muted)', fontWeight: 400 }}>({t('common.optional', 'Optional')})</span></label>
              <textarea
                style={textareaStyle} placeholder={t('instructor.courseManage.moduleDescPh', 'Brief description of this module')} rows={3}
                value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)}
                {...focusHandlers}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>الوصف (عربي) <span style={{ color: 'var(--lx-text-muted)', fontWeight: 400 }}>(اختياري)</span></label>
              <textarea
                style={{ ...textareaStyle, direction: 'rtl', textAlign: 'right' }}
                placeholder="وصف مختصر لهذه الوحدة" rows={3}
                value={moduleDescAr} onChange={(e) => setModuleDescAr(e.target.value)}
                {...focusHandlers}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={() => { setModuleModalVisible(false); setEditingModule(null); }}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
              {submitting ? (editingModule ? t('instructor.courseManage.updating', 'Updating...') : t('instructor.courseManage.creating', 'Creating...')) : (editingModule ? t('instructor.courseManage.updateModule', 'Update Module') : t('instructor.courseManage.createModule', 'Create Module'))}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── MODAL: Add/Edit Lesson ── */}
      <GlassModal
        open={lessonModalVisible}
        onClose={() => { setLessonModalVisible(false); setEditingLesson(null); }}
        title={editingLesson ? t('instructor.courseManage.editLesson', 'Edit Lesson') : t('instructor.courseManage.addNewLesson', 'Add New Lesson')}
      >
        <form onSubmit={handleLessonSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('instructor.courseManage.lessonTitle', 'Lesson Title')} <span style={{ color: '#651C32' }}>*</span></label>
            <input
              type="text" style={inputStyle} placeholder={t('instructor.courseManage.lessonTitlePh', 'e.g., Setting Up Your Workspace')}
              value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)}
              required {...focusHandlers}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('common.description', 'Description')} <span style={{ color: 'var(--lx-text-muted)', fontWeight: 400 }}>({t('common.optional', 'Optional')})</span></label>
            <textarea
              style={textareaStyle} placeholder={t('instructor.courseManage.lessonDescPh', 'Brief description of this lesson')} rows={3}
              value={lessonDesc} onChange={(e) => setLessonDesc(e.target.value)}
              {...focusHandlers}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('instructor.courseManage.contentType', 'Content Type')} <span style={{ color: '#651C32' }}>*</span></label>
            <select
              style={selectStyle} value={lessonType}
              onChange={(e) => setLessonType(e.target.value as 'VIDEO' | 'TEXT' | 'QUIZ')}
              disabled={!!editingLesson}
              {...focusHandlers}
            >
              <option value="VIDEO">{t('instructor.courseManage.typeVideo', 'Video Lesson')}</option>
              <option value="TEXT">{t('instructor.courseManage.typeText', 'Text / Article')}</option>
              <option value="QUIZ">{t('instructor.courseManage.typeQuiz', 'Quiz')}</option>
            </select>
          </div>

          {!editingLesson && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--lx-radius-sm)',
              background: 'rgba(101, 28, 50, 0.04)', border: '1px solid rgba(101, 28, 50, 0.1)',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="isax isax-info-circle" style={{ fontSize: 16, color: '#651C32', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
                {t('instructor.courseManage.videoAfterCreate', 'After creating the lesson, you can upload the video from the lesson list.')}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="lx-btn lx-btn-outline" onClick={() => { setLessonModalVisible(false); setEditingLesson(null); }}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="submit" className="lx-btn lx-btn-gold" disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
              {submitting ? (editingLesson ? t('instructor.courseManage.updating', 'Updating...') : t('instructor.courseManage.creating', 'Creating...')) : (editingLesson ? t('instructor.courseManage.updateLesson', 'Update Lesson') : t('instructor.courseManage.createLesson', 'Create Lesson'))}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* ── MODAL: Video Upload ── */}
      <GlassModal
        open={videoModalVisible}
        onClose={handleCloseVideoModal}
        title={t('instructor.courseManage.uploadVideoTitle', 'Upload Lesson Video')}
        maxWidth={560}
        closable={!uploading}
      >
        {!uploading ? (
          <>
            {/* Drop Zone */}
            <div
              style={{
                border: '2px dashed rgba(101, 28, 50, 0.12)', borderRadius: 'var(--lx-radius-sm)',
                padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                background: 'rgba(101,28,50,0.015)', transition: 'border-color 0.2s, background 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(101,28,50,0.25)';
                e.currentTarget.style.background = 'rgba(101,28,50,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(101,28,50,0.12)';
                e.currentTarget.style.background = 'rgba(101,28,50,0.015)';
              }}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" style={{ display: 'none' }} />
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
                background: 'rgba(101, 28, 50, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="isax isax-video-play" style={{ fontSize: 24, color: 'var(--lx-text-muted)' }} />
              </div>
              <h6 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--lx-text)' }}>
                {selectedFile ? selectedFile.name : t('instructor.courseManage.clickSelectVideo', 'Click to select video file')}
              </h6>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--lx-text-muted)' }}>
                {selectedFile ? t('instructor.courseManage.fileSize', 'Size: {{size}}', { size: formatFileSize(selectedFile.size) }) : t('instructor.courseManage.supportedVideo', 'Supported: MP4, MOV, AVI, MKV (Max 2GB)')}
              </p>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div style={{
                marginTop: 16, padding: 14, borderRadius: 'var(--lx-radius-sm)',
                background: 'rgba(101,28,50,0.02)', border: '1px solid rgba(101,28,50,0.06)',
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
                    background: 'rgba(101, 28, 50, 0.06)', border: 'none', borderRadius: 6,
                    width: 30, height: 30, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#651C32', fontSize: 14,
                  }}
                >
                  <i className="isax isax-trash" />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="lx-btn lx-btn-outline" onClick={handleCloseVideoModal}>
                {t('common.cancel', 'Cancel')}
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
              width: 36, height: 36, border: '3px solid rgba(101, 28, 50, 0.1)',
              borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h6 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--lx-text)' }}>
              {t('instructor.courseManage.uploadingVideo', 'Uploading Video...')}
            </h6>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--lx-text-muted)' }}>
              {t('instructor.courseManage.pleaseWaitUpload', 'Please wait while your video is being uploaded.')}
            </p>

            {/* Progress Bar */}
            <div style={{
              width: '100%', height: 8, borderRadius: 4,
              background: 'rgba(101, 28, 50, 0.08)', overflow: 'hidden', marginBottom: 8,
            }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, var(--lx-primary), #C5912C)',
                width: `${uploadProgress}%`, transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lx-primary)' }}>
              {uploadProgress}%
            </span>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--lx-text-muted)' }}>
              {t('instructor.courseManage.doNotClose', 'Do not close this window until upload is complete.')}
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 'var(--lx-radius-sm)',
          background: 'rgba(101, 28, 50, 0.04)', border: '1px solid rgba(101, 28, 50, 0.1)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="isax isax-info-circle" style={{ fontSize: 16, color: '#651C32', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--lx-text-mid)' }}>
            Your video is stored directly on the server and is ready to stream as soon as the upload completes — no processing delay.
          </span>
        </div>
      </GlassModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL: Text / Article Content Editor ── */}
      <GlassModal
        open={textModalVisible}
        onClose={() => { if (!savingContent) setTextModalVisible(false); }}
        title={`✏️ ${t('instructor.courseManage.editContent', 'Edit Content — {{title}}', { title: textLessonTitle })}`}
        maxWidth={820}
        closable={!savingContent}
      >
        {textLoadingContent ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 32, height: 32, border: '3px solid rgba(101, 28, 50,0.1)',
              borderTopColor: 'var(--lx-primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--lx-text-muted)', fontSize: 14 }}>{t('instructor.courseManage.loadingContent', 'Loading content…')}</p>
          </div>
        ) : (
          <>
            {/* ─ Rich Text Editor ─ */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <label style={{ ...labelStyle, margin: 0 }}>
                  <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6, color: '#651C32' }} />
                  {t('instructor.courseManage.lessonContent', 'Lesson Content')}
                </label>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, cursor: uploadingResource ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, rgba(197, 145, 44,0.12), rgba(197, 145, 44,0.06))',
                  color: '#855A0E', fontWeight: 700, fontSize: 12,
                  border: '1px solid rgba(197, 145, 44,0.3)',
                  opacity: uploadingResource ? 0.7 : 1,
                }}>
                  <i className={`fa-solid ${uploadingResource ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`} />
                  {uploadingResource ? t('instructor.courseManage.uploading', 'Uploading…') : t('instructor.courseManage.displayPdf', 'Display PDF as content')}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleContentPdfUpload}
                    disabled={uploadingResource}
                  />
                </label>
              </div>

              {/* Toolbar */}
              <RichToolbar editorRef={editorRef} />

              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                style={{
                  minHeight: 260, padding: '14px 16px',
                  border: '1.5px solid rgba(101, 28, 50,0.12)',
                  borderRadius: '0 0 8px 8px',
                  fontSize: 14, lineHeight: 1.75, color: 'var(--lx-text)',
                  background: '#fff', outline: 'none', overflowY: 'auto',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(101,28,50,0.30)'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(101,28,50,0.12)'; }}
              />
              <p style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginTop: 4, marginBottom: 0 }}>
                Tip: Select text and use the toolbar to format. Supports bold, headings, lists, code blocks & more.
              </p>
            </div>

            {/* ─ Attachments (PDF, Docs, etc.) ─ */}
            <div style={{
              marginBottom: 24, padding: 18,
              background: 'rgba(101, 28, 50,0.015)', borderRadius: 10,
              border: '1.5px solid rgba(101, 28, 50,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ ...labelStyle, margin: 0 }}>
                  <i className="fa-solid fa-paperclip" style={{ marginRight: 6, color: '#651C32' }} />
                  Attachments &amp; Resources
                </label>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, cursor: uploadingResource ? 'wait' : 'pointer',
                  background: uploadingResource ? 'rgba(101, 28, 50,0.04)' : 'rgba(101, 28, 50,0.06)',
                  color: '#651C32', fontWeight: 600, fontSize: 12,
                  border: '1px solid rgba(101, 28, 50,0.12)',
                  opacity: uploadingResource ? 0.7 : 1,
                }}>
                  <i className={`fa-solid ${uploadingResource ? 'fa-spinner fa-spin' : 'fa-plus'}`} />
                  {uploadingResource ? t('instructor.courseManage.uploading', 'Uploading…') : t('instructor.courseManage.attachFile', 'Attach File')}
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
                <LxEmptyState
                  compact
                  icon="isax-document-upload"
                  title={t('emptyStates.attachmentsTitle', 'No files attached')}
                  text={t('instructor.courseManage.noAttachments', 'No attachments yet. Click "Attach File" to add resources.')}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resources.map((res) => {
                    const ext = res.name.split('.').pop()?.toLowerCase() ?? '';
                    const iconMap: Record<string, { icon: string; color: string }> = {
                      pdf:  { icon: 'fa-file-pdf',          color: '#651C32' },
                      doc:  { icon: 'fa-file-word',         color: '#651C32' },
                      docx: { icon: 'fa-file-word',         color: '#651C32' },
                      ppt:  { icon: 'fa-file-powerpoint',   color: '#651C32' },
                      pptx: { icon: 'fa-file-powerpoint',   color: '#651C32' },
                      txt:  { icon: 'fa-file-lines',        color: '#66525D' },
                      png:  { icon: 'fa-file-image',        color: '#651C32' },
                      jpg:  { icon: 'fa-file-image',        color: '#651C32' },
                      jpeg: { icon: 'fa-file-image',        color: '#651C32' },
                      gif:  { icon: 'fa-file-image',        color: '#651C32' },
                    };
                    const fi = iconMap[ext] ?? { icon: 'fa-file', color: '#66525D' };
                    const sizeLabel = res.size
                      ? res.size > 1024 * 1024
                        ? `${(res.size / 1024 / 1024).toFixed(1)} MB`
                        : `${Math.round(res.size / 1024)} KB`
                      : '';

                    return (
                      <div key={res.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 8, background: '#fff',
                        border: '1px solid rgba(101,28,50,0.06)',
                        boxShadow: '0 1px 4px rgba(101,28,50,0.05)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <i className={`fa-solid ${fi.icon}`} style={{ fontSize: 22, color: fi.color, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <a
                              href={getFileUrl(res.url) ?? res.url}
                              target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: 13, fontWeight: 600, color: '#2B0F1E',
                                textDecoration: 'none', display: 'block',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}
                            >
                              {res.name}
                            </a>
                            {sizeLabel && (
                              <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>{sizeLabel}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a
                            href={getFileUrl(res.url) ?? res.url}
                            target="_blank" rel="noopener noreferrer"
                            title={t('instructor.courseManage.previewDownload', 'Preview / Download')}
                            style={{
                              width: 30, height: 30, borderRadius: 7,
                              background: 'rgba(101, 28, 50,0.06)',
                              border: '1px solid rgba(101, 28, 50,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#651C32', textDecoration: 'none', fontSize: 13,
                            }}
                          >
                            <i className="fa-solid fa-arrow-down-to-line" />
                          </a>
                          <button
                            type="button"
                            title={t('common.remove', 'Remove')}
                            onClick={() => handleDeleteResource(res.id, res.name)}
                            style={{
                              width: 30, height: 30, borderRadius: 7, border: 'none',
                              background: 'rgba(101, 28, 50,0.06)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#651C32', fontSize: 13,
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
                {t('common.cancel', 'Cancel')}
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
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" />
                    {t('instructor.courseManage.saveContent', 'Save Content')}
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
        confirmText={confirmModal.confirmText}
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
      background: danger ? 'rgba(101, 28, 50, 0.05)' : 'rgba(101, 28, 50, 0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: danger ? '#651C32' : 'var(--lx-text-muted)', fontSize: 14,
      transition: 'all 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger ? 'rgba(101, 28, 50, 0.1)' : 'rgba(101, 28, 50, 0.08)';
      if (!danger) e.currentTarget.style.color = 'var(--lx-primary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = danger ? 'rgba(101, 28, 50, 0.05)' : 'rgba(101, 28, 50, 0.04)';
      if (!danger) e.currentTarget.style.color = 'var(--lx-text-muted)';
    }}
  >
    <i className={`isax ${icon}`} />
  </button>
);

export default CourseManage;
