import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';

import { CourseLevel, Language } from '../../../core/common/selectOption/json/selectOption';
import DefaultEditor from "react-simple-wysiwyg";
import VideoModal from '../../HomePages/home-one/section/videoModal';
import { all_routes } from '../../router/all_routes';

import { Chips, ChipsChangeEvent } from "primereact/chips";
import { message, Modal, Spin } from 'antd';
import { courseService } from '../../../services/api/course.service';
import { instructorService } from '../../../services/api/instructor.service';
import { CourseCategory as CourseCategoryType, CourseLevel as CourseLevelType } from '../../../services/api/types';
import { translateCourseContent, LangCode } from '../../../services/api/translation.service';

interface Lesson { id: string; name: string; isPreview: boolean; }
interface Topic { id: string; title: string; lessons: Lesson[]; }
interface Faq { id: string; question: string; answer: string; }

// Form data interface
interface CourseFormData {
  // Step 1 - Basic Info
  title: string;
  category: string;
  level: string;
  language: string;
  maxStudents: string;
  courseType: string;
  shortDescription: string;
  description: string;
  learningObjectives: string[];
  requirements: string[];
  isFeatured: boolean;
  // Step 2 - Media
  thumbnail: File | null;
  thumbnailPreview: string;
  videoType: string;
  videoUrl: string;
  // Step 5 - Pricing
  isFree: boolean;
  price: string;
  hasDiscount: boolean;
  discountPrice: string;
  expiryType: 'lifetime' | 'limited';
  expiryMonths: string;
}

const AddNewCourse = () => {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const route = all_routes
  const [value1, setValue1] = useState<any>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_isTranslating, setIsTranslating] = useState(false);
  const [_translationDone, setTranslationDone] = useState(false);
  const [translations, setTranslations] = useState<{
    titleEn?: string; descriptionEn?: string;
    titleAr?: string; titleFr?: string; descriptionAr?: string; descriptionFr?: string;
    shortDescriptionAr?: string;
  }>({});
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const customChip = (item: string) => {
    return (
      <div>
          <span className="tag label label-info">{item}</span>
      </div>
    );
  };
  const [currentStep, setCurrentStep] = useState(1);

  // Dynamic categories from API
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await courseService.getCategories();
        const options = categories.map((cat: CourseCategoryType) => ({
          label: cat.name,
          value: cat.id.toString()
        }));
        setCategoryOptions(options);
      } catch (error) {
        console.error('Error fetching categories:', error);
        message.warning('Could not load categories. Please try again.');
        setCategoryOptions([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Debug log for CourseLevel
  useEffect(() => {
  }, []);

  // Form data state
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    category: '',
    level: '',
    language: '',
    maxStudents: '',
    courseType: '',
    shortDescription: '',
    description: '',
    learningObjectives: [''],
    requirements: [''],
    isFeatured: false,
    thumbnail: null,
    thumbnailPreview: '',
    videoType: '',
    videoUrl: '',
    isFree: true,
    price: '',
    hasDiscount: false,
    discountPrice: '',
    expiryType: 'lifetime',
    expiryMonths: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Mark all step-1 fields as touched so errors display immediately
    setTouched(prev => ({
      ...prev,
      title: true,
      category: true,
      level: true,
      language: true,
      courseType: true,
      shortDescription: true,
      description: true,
    }));

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Course title must be at least 5 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.level) {
      newErrors.level = 'Please select a course level';
    }

    if (!formData.language) {
      newErrors.language = 'Please select a language';
    }

    if (!formData.courseType) {
      newErrors.courseType = 'Please select a course type';
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    } else if (formData.shortDescription.trim().length < 20) {
      newErrors.shortDescription = 'Short description must be at least 20 characters';
    }

    if (!formData.description.trim() || formData.description === '<br>') {
      newErrors.description = 'Course description is required';
    } else if (formData.description.replace(/<[^>]*>/g, '').trim().length < 50) {
      newErrors.description = 'Course description must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Thumbnail is optional but videoUrl is required if videoType is selected
    if (formData.videoType && !formData.videoUrl.trim()) {
      newErrors.videoUrl = 'Please provide a video URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 5 (Pricing)
  const validateStep5 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only MASTERCLASS requires a price — PLAN courses are subscription-based (no individual payment)
    if (formData.courseType === 'MASTERCLASS') {
      if (!formData.price.trim()) {
        newErrors.price = 'Please enter a course price';
      } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        newErrors.price = 'Please enter a valid price';
      }

      if (formData.hasDiscount) {
        if (!formData.discountPrice.trim()) {
          newErrors.discountPrice = 'Please enter a discount price';
        } else if (isNaN(Number(formData.discountPrice)) || Number(formData.discountPrice) <= 0) {
          newErrors.discountPrice = 'Please enter a valid discount price';
        } else if (Number(formData.discountPrice) >= Number(formData.price)) {
          newErrors.discountPrice = 'Discount price must be less than original price';
        }
      }
    }

    if (formData.expiryType === 'limited') {
      if (!formData.expiryMonths.trim()) {
        newErrors.expiryMonths = 'Please enter number of months';
      } else if (isNaN(Number(formData.expiryMonths)) || Number(formData.expiryMonths) <= 0) {
        newErrors.expiryMonths = 'Please enter a valid number of months';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if current step is valid
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        const titleValid = formData.title.trim().length >= 5;
        const categoryValid = !!formData.category;
        const levelValid = !!formData.level;
        const languageValid = !!formData.language;
        const courseTypeValid = !!formData.courseType;
        const shortDescValid = formData.shortDescription.trim().length >= 20;
        const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
        const descriptionValid = descriptionText.length >= 50;

        return titleValid && categoryValid && levelValid && languageValid && courseTypeValid && shortDescValid && descriptionValid;
      case 2:
        return true; // Media step is optional
      case 3:
        return true; // Curriculum step - modules/lessons can be added later
      case 4:
        return true; // Additional info is optional
      case 5:
        // PLAN = subscription, no price required. MASTERCLASS = must set a price.
        if (formData.courseType === 'PLAN') {
          const expiryOk = formData.expiryType === 'lifetime' ||
            (formData.expiryMonths && Number(formData.expiryMonths) > 0);
          return Boolean(expiryOk);
        }
        const priceValid = formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0;
        const discountValid = !formData.hasDiscount ||
          (formData.discountPrice && Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price));
        const expiryValid = formData.expiryType === 'lifetime' ||
          (formData.expiryMonths && Number(formData.expiryMonths) > 0);
        return Boolean(priceValid && discountValid && expiryValid);
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
      case 4:
        isValid = true;
        break;
      case 5:
        isValid = validateStep5();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      setTouched({});
    } else {
      message.error('Please fill in all required fields correctly');
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
    setTouched({});
  };

  // Handle input change
  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const [values, setValue] = React.useState('');
  const [descriptionAr, setDescriptionAr] = React.useState('');

  function onChange(e: any) {
    const newValue = e.target.value;
    setValue(newValue);
    handleInputChange('description', newValue);
    setTranslations(prev => ({ ...prev, descriptionEn: newValue }));
  };

  function onChangeDescAr(e: any) {
    const newValue = e.target.value;
    setDescriptionAr(newValue);
    setTranslations(prev => ({ ...prev, descriptionAr: newValue }));
  };
  // Curriculum state
  const [curriculum, setCurriculum] = useState<Topic[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [activeLessonTopicId, setActiveLessonTopicId] = useState<string | null>(null);
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonIsPreview, setNewLessonIsPreview] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    const newTopic: Topic = { id: `topic-${Date.now()}`, title: newTopicTitle.trim(), lessons: [] };
    setCurriculum(prev => [...prev, newTopic]);
    setExpandedTopics(prev => { const s = new Set(prev); s.add(newTopic.id); return s; });
    setNewTopicTitle('');
  };

  const handleRemoveTopic = (topicId: string) => {
    setCurriculum(prev => prev.filter(topic => topic.id !== topicId));
  };

  const handleAddLesson = () => {
    if (!newLessonName.trim() || !activeLessonTopicId) return;
    const newLesson: Lesson = { id: `lesson-${Date.now()}`, name: newLessonName.trim(), isPreview: newLessonIsPreview };
    setCurriculum(prev => prev.map(topic => topic.id === activeLessonTopicId ? { ...topic, lessons: [...topic.lessons, newLesson] } : topic));
    setNewLessonName('');
    setNewLessonIsPreview(false);
  };

  const handleRemoveLesson = (topicId: string, lessonId: string) => {
    setCurriculum(prev => prev.map(topic => topic.id === topicId ? { ...topic, lessons: topic.lessons.filter(l => l.id !== lessonId) } : topic));
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim()) return;
    const newFaq: Faq = { id: `faq-${Date.now()}`, question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() };
    setFaqs(prev => [...prev, newFaq]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleRemoveFaq = (faqId: string) => {
    setFaqs(prev => prev.filter(f => f.id !== faqId));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const s = new Set(prev);
      if (s.has(topicId)) s.delete(topicId); else s.add(topicId);
      return s;
    });
  };

  const [showModal, setShowModal] = useState(false);
  const _videoUrl = 'https://www.youtube.com/embed/1trvO6dqQUI';

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false)

  // Submit course to backend
  const handleSubmitCourse = async () => {
    // Validate all required fields
    const validationErrors: string[] = [];

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      validationErrors.push('Course title is required (min 5 characters)');
    }
    if (!formData.category) {
      validationErrors.push('Please select a category');
    }
    if (!formData.level) {
      validationErrors.push('Please select a course level');
    }
    if (!formData.language) {
      validationErrors.push('Please select a language');
    }
    if (!formData.courseType) {
      validationErrors.push('Please select a course type (Plan or Masterclass)');
    }
    if (!formData.shortDescription.trim() || formData.shortDescription.trim().length < 20) {
      validationErrors.push('Short description is required (min 20 characters)');
    }
    const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
    if (descriptionText.length < 50) {
      validationErrors.push('Description is required (min 50 characters)');
    }

    // Pricing validation (only if not free)
    if (!formData.isFree) {
      if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        validationErrors.push('Please enter a valid course price');
      }
      if (formData.hasDiscount) {
        if (!formData.discountPrice || Number(formData.discountPrice) <= 0 || Number(formData.discountPrice) >= Number(formData.price)) {
          validationErrors.push('Discount price must be greater than 0 and less than the regular price');
        }
      }
      if (formData.expiryType === 'limited' && (!formData.expiryMonths || Number(formData.expiryMonths) <= 0)) {
        validationErrors.push('Please enter a valid expiry period');
      }
    }

    if (validationErrors.length > 0) {
      message.error(validationErrors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the course data - match backend CreateCourseRequest fields
      const isMasterclass = formData.courseType === 'MASTERCLASS';
      const isPlan = formData.courseType === 'PLAN';
      const courseData = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        categoryId: formData.category,
        level: formData.level as CourseLevelType,
        language: formData.language || 'fr',
        courseType: formData.courseType,
        // PLAN = subscription access, price=0, no purchase required
        // MASTERCLASS = paid individually, use entered price
        price: isPlan ? 0 : (formData.hasDiscount ? parseFloat(formData.discountPrice) : parseFloat(formData.price || '0')),
        originalPrice: isMasterclass && formData.hasDiscount ? parseFloat(formData.price) : undefined,
        requiresPurchase: isMasterclass,
        requirements: formData.requirements.filter(r => r.trim() !== '').join('\n'),
        whatYouWillLearn: formData.learningObjectives.filter(o => o.trim() !== '').join('\n'),
        tags: Array.isArray(value1) ? value1.join(',') : (value1 || ''),
        // Translation fields — populated by "Auto-translate" button
        // titleEn/descriptionEn are only sent when the course is authored in AR or FR
        titleEn: translations.titleEn,
        descriptionEn: translations.descriptionEn,
        titleAr: translations.titleAr,
        titleFr: translations.titleFr,
        descriptionAr: translations.descriptionAr,
        descriptionFr: translations.descriptionFr,
      };


      // Create the course
      const createdCourse = await instructorService.createCourse(courseData);
      setCreatedCourseId(createdCourse.id);

      // Upload thumbnail if provided
      if (formData.thumbnail) {
        try {
          await instructorService.uploadThumbnail(createdCourse.id, formData.thumbnail);
        } catch (thumbError) {
          console.error('Thumbnail upload failed:', thumbError);
          message.warning('Course created, but thumbnail upload failed. You can add it later.');
        }
      }

      // Show success modal
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Failed to create course:', error);
      message.error(error.response?.data?.message || 'Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Auto-translate title + description (kept for potential future use) ──────
  const _handleAutoTranslate = async () => {
    const rawDesc = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!formData.title.trim() || rawDesc.length < 5) {
      message.warning('Please fill in the title and description before translating.');
      return;
    }
    const sourceLang = (formData.language?.toLowerCase() === 'arabic' ? 'ar'
      : formData.language?.toLowerCase() === 'french' ? 'fr'
      : formData.language?.toLowerCase() === 'ar' ? 'ar'
      : formData.language?.toLowerCase() === 'fr' ? 'fr'
      : 'fr') as LangCode;

    setIsTranslating(true);
    try {
      const result = await translateCourseContent(formData.title, rawDesc, sourceLang);
      setTranslations(result);
      setTranslationDone(true);
      message.success('Content translated successfully! ✓');
    } catch {
      message.error('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <LuxuryDashboardLayout>
      {/* Page title */}
      <div className="lx-section-header mb-4">
        <h5 className="section-title">{t('addCourse.pageTitle')}</h5>
      </div>

      {/* Course add */}
      <div>
        <div className="container-fluid px-0">
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="add-course-item">
                  <div className="wizard">
                    <ul className="form-wizard-steps" id="progressbar2">
                      <li className={
                        currentStep === 1
                          ? 'progress-active'
                          : currentStep > 1
                            ? 'progress-activated'
                            : ''
                      }>
                        <div className="profile-step">
                          <span className="dot-active mb-2">
                            <span className="number">01</span>
                            <span className="tickmark">
                              <i className="fa-solid fa-check" />
                            </span>
                          </span>
                          <div className="step-section">
                            <p>{t('addCourse.steps.courseInfo')}</p>
                          </div>
                        </div>
                      </li>
                      <li className={
                        currentStep === 2
                          ? 'progress-active'
                          : currentStep > 2
                            ? 'progress-activated'
                            : ''
                      }>
                        <div className="profile-step">
                          <span className="dot-active mb-2">
                            <span className="number">02</span>
                            <span className="tickmark">
                              <i className="fa-solid fa-check" />
                            </span>
                          </span>
                          <div className="step-section">
                            <p>{t('addCourse.steps.courseMedia')}</p>
                          </div>
                        </div>
                      </li>
                      <li className={
                        currentStep === 3
                          ? 'progress-active'
                          : currentStep > 3
                            ? 'progress-activated'
                            : ''
                      }>
                        <div className="profile-step">
                          <span className="dot-active mb-2">
                            <span className="number">03</span>
                            <span className="tickmark">
                              <i className="fa-solid fa-check" />
                            </span>
                          </span>
                          <div className="step-section">
                            <p>{t('addCourse.steps.curriculum')}</p>
                          </div>
                        </div>
                      </li>
                      <li className={
                        currentStep === 4
                          ? 'progress-active'
                          : currentStep > 4
                            ? 'progress-activated'
                            : ''
                      }>
                        <div className="profile-step">
                          <span className="dot-active mb-2">
                            <span className="number">04</span>
                            <span className="tickmark">
                              <i className="fa-solid fa-check" />
                            </span>
                          </span>
                          <div className="step-section">
                            <p>{t('addCourse.steps.additional')}</p>
                          </div>
                        </div>
                      </li>
                      <li className={
                        currentStep === 5
                          ? 'progress-active'
                          : currentStep > 5
                            ? 'progress-activated'
                            : ''
                      }>
                        <div className="profile-step">
                          <span className="dot-active mb-2">
                            <span className="number">05</span>
                            <span className="tickmark">
                              <i className="fa-solid fa-check" />
                            </span>
                          </span>
                          <div className="step-section">
                            <p>{t('addCourse.steps.pricing')}</p>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="initialization-form-set">
                    {currentStep === 1 && (
                      <fieldset className="form-inner wizard-form-card" id="first">
                        <div className="title">
                          <h5>{t('addCourse.step1.title')}</h5>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.courseTitle')} (English)<span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="text"
                                className={`form-control ${errors.title && touched.title ? 'is-invalid' : ''}`}
                                value={translations.titleEn || formData.title}
                                onChange={(e) => {
                                  handleInputChange('title', e.target.value);
                                  setTranslations(prev => ({ ...prev, titleEn: e.target.value }));
                                }}
                                placeholder="Course title in English"
                              />
                              {errors.title && touched.title && (
                                <div className="invalid-feedback d-block">{errors.title}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.courseTitle')} (العربية)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                dir="rtl"
                                value={translations.titleAr || ''}
                                onChange={(e) => {
                                  setTranslations(prev => ({ ...prev, titleAr: e.target.value }));
                                  if (!translations.titleEn && !formData.title) {
                                    handleInputChange('title', e.target.value);
                                  }
                                }}
                                placeholder="عنوان الدورة بالعربية"
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.courseCategory')}
                                <span className="text-danger ms-1">*</span>
                              </label>
                              {loadingCategories ? (
                                <div className="form-control d-flex align-items-center justify-content-center">
                                  <Spin size="small" /> <span className="ms-2">{t('addCourse.step1.loadingCategories')}</span>
                                </div>
                              ) : categoryOptions.length === 0 ? (
                                <div className="alert alert-warning mb-0 py-2">
                                  <small>
                                    <i className="isax isax-warning-2 me-1" />
                                    {t('addCourse.step1.noCategoriesWarning')}
                                  </small>
                                </div>
                              ) : (
                                <select
                                  className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                  value={formData.category}
                                  onChange={(e) => handleInputChange('category', e.target.value)}
                                >
                                  <option value="">{t('addCourse.step1.selectCategory')}</option>
                                  {categoryOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              )}
                              {errors.category && (
                                <div className="invalid-feedback d-block">{errors.category}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.courseLevel')}<span className="text-danger ms-1">*</span>
                              </label>
                              <select
                                className={`form-select ${errors.level ? 'is-invalid' : ''}`}
                                value={formData.level}
                                onChange={(e) => handleInputChange('level', e.target.value)}
                              >
                                <option value="">{t('addCourse.step1.selectLevel')}</option>
                                {CourseLevel.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              {errors.level && (
                                <div className="invalid-feedback d-block">{errors.level}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.language')}<span className="text-danger ms-1">*</span>
                              </label>
                              <select
                                className={`form-select ${errors.language ? 'is-invalid' : ''}`}
                                value={formData.language}
                                onChange={(e) => handleInputChange('language', e.target.value)}
                              >
                                <option value="">{t('addCourse.step1.selectLanguage')}</option>
                                {Language.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              {errors.language && (
                                <div className="invalid-feedback d-block">{errors.language}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.courseType')}<span className="text-danger ms-1">*</span>
                              </label>
                              <p className="text-muted small mb-3">
                                {t('addCourse.step1.courseTypeHelp')}
                              </p>
                              <div className="row g-3">
                                {/* Plan card */}
                                <div className="col-md-6">
                                  <div
                                    onClick={() => handleInputChange('courseType', 'PLAN')}
                                    style={{
                                      border: `2px solid ${formData.courseType === 'PLAN' ? '#651C32' : 'rgba(101,28,50,0.15)'}`,
                                      borderRadius: 12,
                                      padding: '20px 22px',
                                      cursor: 'pointer',
                                      background: formData.courseType === 'PLAN' ? 'rgba(101,28,50,0.04)' : '#fff',
                                      transition: 'all 0.2s ease',
                                      position: 'relative',
                                    }}
                                  >
                                    {formData.courseType === 'PLAN' && (
                                      <span style={{
                                        position: 'absolute', top: 12, right: 14,
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#651C32',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        <i className="fa-solid fa-check" style={{ fontSize: 10, color: '#fff' }} />
                                      </span>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                      <span style={{
                                        width: 44, height: 44, borderRadius: 10,
                                        background: 'rgba(101,28,50,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                      }}>
                                        <i className="isax isax-book-1" style={{ fontSize: 22, color: '#651C32' }} />
                                      </span>
                                      <div>
                                        <h6 style={{ margin: 0, fontWeight: 700, color: '#651C32', fontSize: 15 }}>{t('addCourse.step1.planCourseTitle')}</h6>
                                        <span style={{ fontSize: 12, color: 'rgba(58,30,32,0.55)', fontWeight: 400 }}>{t('addCourse.step1.planCourseSubtitle')}</span>
                                      </div>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'rgba(58,30,32,0.65)', lineHeight: 1.8 }}>
                                      <li>{t('addCourse.step1.planBullet1')}</li>
                                      <li>{t('addCourse.step1.planBullet2')}</li>
                                      <li>{t('addCourse.step1.planBullet3')}</li>
                                    </ul>
                                  </div>
                                </div>
                                {/* Masterclass card */}
                                <div className="col-md-6">
                                  <div
                                    onClick={() => handleInputChange('courseType', 'MASTERCLASS')}
                                    style={{
                                      border: `2px solid ${formData.courseType === 'MASTERCLASS' ? '#C5912C' : 'rgba(197,145,44,0.2)'}`,
                                      borderRadius: 12,
                                      padding: '20px 22px',
                                      cursor: 'pointer',
                                      background: formData.courseType === 'MASTERCLASS' ? 'rgba(197,145,44,0.04)' : '#fff',
                                      transition: 'all 0.2s ease',
                                      position: 'relative',
                                    }}
                                  >
                                    {formData.courseType === 'MASTERCLASS' && (
                                      <span style={{
                                        position: 'absolute', top: 12, right: 14,
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#C5912C',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        <i className="fa-solid fa-check" style={{ fontSize: 10, color: '#fff' }} />
                                      </span>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                      <span style={{
                                        width: 44, height: 44, borderRadius: 10,
                                        background: 'rgba(197,145,44,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                      }}>
                                        <i className="isax isax-crown" style={{ fontSize: 22, color: '#C5912C' }} />
                                      </span>
                                      <div>
                                        <h6 style={{ margin: 0, fontWeight: 700, color: '#9A6F1A', fontSize: 15 }}>{t('addCourse.step1.masterclassTitle')}</h6>
                                        <span style={{ fontSize: 12, color: 'rgba(58,30,32,0.55)', fontWeight: 400 }}>{t('addCourse.step1.masterclassSubtitle')}</span>
                                      </div>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'rgba(58,30,32,0.65)', lineHeight: 1.8 }}>
                                      <li>{t('addCourse.step1.masterclassBullet1')}</li>
                                      <li>{t('addCourse.step1.masterclassBullet2')}</li>
                                      <li>{t('addCourse.step1.masterclassBullet3')}</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              {!formData.courseType && errors.courseType && (
                                <div className="text-danger small mt-2">
                                  <i className="isax isax-warning-2 me-1" /> {t('addCourse.step1.selectCourseTypeError')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.shortDescription')} (English)
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <textarea
                                rows={3}
                                className={`form-control ${errors.shortDescription && touched.shortDescription ? 'is-invalid' : ''}`}
                                value={translations.descriptionEn || formData.shortDescription}
                                onChange={(e) => {
                                  handleInputChange('shortDescription', e.target.value);
                                  setTranslations(prev => ({ ...prev, descriptionEn: e.target.value }));
                                }}
                                placeholder="Short description in English"
                              />
                              {errors.shortDescription && touched.shortDescription && (
                                <div className="invalid-feedback d-block">{errors.shortDescription}</div>
                              )}
                              <small className="text-muted">
                                {t('addCourse.step1.shortDescMin', { count: formData.shortDescription.length })}
                              </small>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.shortDescription')} (العربية)
                              </label>
                              <textarea
                                rows={3}
                                className="form-control"
                                dir="rtl"
                                value={translations.shortDescriptionAr || ''}
                                onChange={(e) => {
                                  setTranslations(prev => ({ ...prev, shortDescriptionAr: e.target.value }));
                                }}
                                placeholder="وصف قصير بالعربية"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.courseDescription')} (English)
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <div className={`summernote ${errors.description ? 'border border-danger rounded' : ''}`}>
                                <DefaultEditor value={values} onChange={onChange} />
                              </div>
                              {errors.description && (
                                <div className="invalid-feedback d-block">{errors.description}</div>
                              )}
                              <small className="text-muted">
                                {t('addCourse.step1.descMin')}
                              </small>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step1.courseDescription')} (العربية)
                              </label>
                              <div className="summernote">
                                <DefaultEditor value={descriptionAr} onChange={onChangeDescAr} />
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="bg-light border p-4 rounded-3">
                              <h6 className="mb-2">
                                {t('addCourse.step1.whatLearn')}
                              </h6>
                              <div className="input-block">
                                {formData.learningObjectives.map((obj, index) => (
                                  <div key={index} className="d-flex align-items-center add-new-input">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder={t('addCourse.step1.learningPlaceholder')}
                                      value={obj}
                                      onChange={(e) => {
                                        const updated = [...formData.learningObjectives];
                                        updated[index] = e.target.value;
                                        handleInputChange('learningObjectives', updated);
                                      }}
                                    />
                                    {formData.learningObjectives.length > 1 && (
                                      <Link
                                        to="#"
                                        className="link-trash"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleInputChange('learningObjectives', formData.learningObjectives.filter((_, i) => i !== index));
                                        }}
                                      >
                                        <i className="isax isax-trash" />
                                      </Link>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="d-flex align-items-center justify-content-end">
                                <Link
                                  to="#"
                                  className="d-flex align-items-center add-new-topic"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleInputChange('learningObjectives', [...formData.learningObjectives, '']);
                                  }}
                                >
                                  <i className="isax isax-add me-1" /> {t('addCourse.step1.addNewItem')}
                                </Link>
                              </div>

                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="bg-light border	 p-4 rounded-3">
                              <h6 className="mb-2">{t('addCourse.step1.requirements')}</h6>
                                <div className="input-block">
                                {formData.requirements.map((req, index) => (
                                  <div key={index} className="d-flex align-items-center add-new-input">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder={t('addCourse.step1.requirementsPlaceholder')}
                                      value={req}
                                      onChange={(e) => {
                                        const updated = [...formData.requirements];
                                        updated[index] = e.target.value;
                                        handleInputChange('requirements', updated);
                                      }}
                                    />
                                    {formData.requirements.length > 1 && (
                                      <Link
                                        to="#"
                                        className="link-trash"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleInputChange('requirements', formData.requirements.filter((_, i) => i !== index));
                                        }}
                                      >
                                        <i className="isax isax-trash" />
                                      </Link>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="d-flex align-items-center justify-content-end">
                                <Link
                                  to="#"
                                  className="d-flex align-items-center add-new-topic"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleInputChange('requirements', [...formData.requirements, '']);
                                  }}
                                >
                                  <i className="isax isax-add me-1" /> {t('addCourse.step1.addNewItem')}
                                </Link>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-check form-switch form-check-md mb-0 mt-3">
                              <input
                                className="form-check-input form-checked-success"
                                type="checkbox"
                                id="checkFeature"
                                defaultChecked
                              />
                              <label
                                className="form-check-label"
                                htmlFor="checkFeature"
                              >
                                {t('addCourse.step1.featuredCourse')}
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="add-form-btn widget-next-btn submit-btn d-flex justify-content-between mb-0">
                          <div className="btn-left">
                            <small className={`${isStepValid ? 'text-success' : 'text-muted'}`}>
                              {isStepValid ? (
                                <><i className="isax isax-tick-circle me-1" /> {t('addCourse.step1.allFieldsCompleted')}</>
                              ) : (
                                <><i className="isax isax-info-circle me-1" /> {t('addCourse.step1.fillRequiredFields')}</>
                              )}
                            </small>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn main-btn next_btns"
                              onClick={handleNext}
                              style={{ cursor: 'pointer' }}
                            >
                              {t('addCourse.nav.next')} <i className="isax isax-arrow-right-3 ms-1" />
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )

                    }
                    {currentStep === 2 && (
                      <fieldset className="form-inner wizard-form-card" style={{ display: 'block' }}>
                        <div className="title">
                          <h5>{t('addCourse.step2.title')}</h5>
                          <p>
                            {t('addCourse.step2.subtitle')}
                          </p>
                        </div>
                        <div className="row">
                          {/* Thumbnail Upload Section */}
                          <div className="col-md-12 mb-4">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step2.courseThumbnail')}
                                <span className="text-muted ms-2">{t('addCourse.step2.thumbnailRecommended')}</span>
                              </label>
                              <div className="row">
                                <div className="col-md-6">
                                  <div
                                    className="upload-img-section d-flex align-items-center justify-content-center position-relative"
                                    style={{
                                      border: '2px dashed #ccc',
                                      borderRadius: '8px',
                                      padding: '40px 20px',
                                      cursor: 'pointer',
                                      minHeight: '200px',
                                      background: formData.thumbnailPreview ? 'transparent' : '#f8f9fa'
                                    }}
                                    onClick={() => document.getElementById('thumbnail-upload')?.click()}
                                  >
                                    <input
                                      type="file"
                                      id="thumbnail-upload"
                                      style={{ display: "none" }}
                                      accept="image/jpeg,image/png,image/gif,image/webp"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.size > 2 * 1024 * 1024) {
                                            message.error('Image size must be less than 2MB');
                                            return;
                                          }
                                          handleInputChange('thumbnail', file);
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            handleInputChange('thumbnailPreview', reader.result as string);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    {formData.thumbnailPreview ? (
                                      <div className="position-relative w-100 h-100">
                                        <img
                                          src={formData.thumbnailPreview}
                                          alt="Thumbnail preview"
                                          className="img-fluid rounded"
                                          style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-danger btn-sm position-absolute"
                                          style={{ top: '10px', right: '10px' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleInputChange('thumbnail', null);
                                            handleInputChange('thumbnailPreview', '');
                                          }}
                                        >
                                          <i className="fa fa-times" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="upload-content text-center">
                                        <span className="d-flex align-items-center justify-content-center mb-2">
                                          <i className="isax isax-image5 text-secondary" style={{ fontSize: '48px' }} />
                                        </span>
                                        <p className="fw-medium mb-1">
                                          {t('addCourse.step2.clickUploadThumbnail')}
                                        </p>
                                        <span className="text-muted small">
                                          {t('addCourse.step2.thumbnailFormats')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="p-3 bg-light rounded h-100">
                                    <h6 className="mb-3">{t('addCourse.step2.thumbnailTips')}</h6>
                                    <ul className="small text-muted mb-0">
                                      <li className="mb-2">{t('addCourse.step2.tip1')}</li>
                                      <li className="mb-2">{t('addCourse.step2.tip2')}</li>
                                      <li className="mb-2">{t('addCourse.step2.tip3')}</li>
                                      <li>{t('addCourse.step2.tip4')}</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <hr className="my-4" />

                          {/* Promo Video Section */}
                          <div className="col-md-12">
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step2.promoVideo')} <span className="text-muted">{t('addCourse.step2.optional')}</span>
                              </label>
                              <p className="text-muted small mb-3">
                                {t('addCourse.step2.promoVideoHelp')}
                              </p>
                              <div className="row">
                                <div className="col-md-4">
                                  <label className="form-label small">{t('addCourse.step2.videoSource')}</label>
                                  <select
                                    className="form-select"
                                    value={formData.videoType}
                                    onChange={(e) => handleInputChange('videoType', e.target.value)}
                                  >
                                    <option value="">{t('addCourse.step2.noPromoVideo')}</option>
                                    <option value="youtube">{t('addCourse.step2.youtubeUrl')}</option>
                                    <option value="vimeo">{t('addCourse.step2.vimeoUrl')}</option>
                                    <option value="external">{t('addCourse.step2.externalUrl')}</option>
                                  </select>
                                </div>
                                <div className="col-md-8">
                                  {formData.videoType ? (
                                    <div>
                                      <label className="form-label small">
                                        {formData.videoType === 'youtube' ? 'YouTube' :
                                         formData.videoType === 'vimeo' ? 'Vimeo' : 'External'} URL
                                      </label>
                                      <input
                                        type="text"
                                        className={`form-control ${errors.videoUrl ? 'is-invalid' : ''}`}
                                        placeholder={
                                          formData.videoType === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                                          formData.videoType === 'vimeo' ? 'https://vimeo.com/...' :
                                          'https://example.com/video.mp4'
                                        }
                                        value={formData.videoUrl}
                                        onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                                      />
                                      {errors.videoUrl && (
                                        <div className="invalid-feedback">{errors.videoUrl}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center h-100">
                                      <p className="text-muted mb-0">
                                        <i className="isax isax-info-circle me-2" />
                                        {t('addCourse.step2.selectVideoSource')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Video Preview */}
                          {formData.videoUrl && (formData.videoType === 'youtube' || formData.videoType === 'vimeo') && (
                            <div className="col-md-12 mt-4">
                              <div className="position-relative">
                                <div
                                  className="border rounded p-4 text-center bg-dark"
                                  style={{ cursor: 'pointer' }}
                                  onClick={handleOpenModal}
                                >
                                  <i className="fa-solid fa-play text-white fs-1" />
                                  <p className="text-white mt-2 mb-0">{t('addCourse.step2.clickPreviewVideo')}</p>
                                </div>
                              </div>
                              <VideoModal show={showModal} handleClose={handleCloseModal} videoUrl={formData.videoUrl} />
                            </div>
                          )}

                          {/* Mux Video Info */}
                          <div className="col-md-12 mt-4">
                            <div className="alert alert-info d-flex align-items-start">
                              <i className="isax isax-video-play fs-4 me-3 mt-1" />
                              <div>
                                <h6 className="mb-1">{t('addCourse.step2.howVideoWorks')}</h6>
                                <p className="mb-0 small">
                                  <strong>Step 1:</strong> {t('addCourse.step2.videoStep1')}<br/>
                                  <strong>Step 2:</strong> {t('addCourse.step2.videoStep2')}<br/>
                                  <strong>Step 3:</strong> {t('addCourse.step2.videoStep3')}<br/>
                                  {t('addCourse.step2.videoTranscode')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="add-form-btn widget-next-btn submit-btn">
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-light main-btn prev_btns d-flex align-items-center"
                              onClick={handlePrev}
                            >
                              <i className="isax isax-arrow-left-2 me-1" />
                              {t('addCourse.nav.prev')}
                            </button>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-secondary main-btn next_btns d-flex align-items-center"
                              onClick={handleNext}
                            >
                              {t('addCourse.nav.next')} <i className="isax isax-arrow-right-3 ms-1" />
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )
                    }
                    {currentStep === 3 && (
                      <fieldset className="form-inner wizard-form-card" style={{ display: 'block' }}>
                        <div className="title">
                          <div className="row align-items-center row-gap-2">
                            <div className="col-md-6">
                              <h5 className="mb-0">{t('addCourse.step3.title')}</h5>
                            </div>
                            <div className="col-md-6 text-md-end">
                              <Link
                                to="#"
                                className="btn add-edit-btn d-inline-flex align-items-center"
                                data-bs-toggle="modal"
                                data-bs-target="#add-topic"
                              >
                                <i className="isax isax-add-circle5 me-1" /> {t('addCourse.step3.addNewTopic')}
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div>
                          {curriculum.length === 0 && (
                            <div className="text-center text-muted py-5 border rounded-3">
                              <i className="isax isax-book fs-1 mb-2 d-block" />
                              <p className="mb-0">{t('addCourse.step3.noTopics')}</p>
                            </div>
                          )}
                          <div className="accordions-items-seperate">
                            {curriculum.map((topic) => (
                              <div key={topic.id} className="accordion-item">
                                <h2 className="accordion-header">
                                  <div
                                    className={`accordion-button d-flex align-items-center justify-content-between ${expandedTopics.has(topic.id) ? '' : 'collapsed'}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => toggleTopic(topic.id)}
                                  >
                                    <span className="d-flex align-items-center mb-0">
                                      <i className="isax isax-menu-15 me-2" />
                                      {topic.title}
                                      <span className="badge bg-secondary ms-2 small">{topic.lessons.length} {topic.lessons.length !== 1 ? t('addCourse.step3.lessons') : t('addCourse.step3.lesson')}</span>
                                    </span>
                                    <div className="d-flex align-items-center gap-2 ms-auto" onClick={(e) => e.stopPropagation()}>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                        onClick={(e) => { e.preventDefault(); handleRemoveTopic(topic.id); }}
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                </h2>
                                {expandedTopics.has(topic.id) && (
                                  <div className="accordion-collapse">
                                    <div className="accordion-body">
                                      {topic.lessons.length === 0 && (
                                        <p className="text-muted small text-center py-2">{t('addCourse.step3.noLessons')}</p>
                                      )}
                                      {topic.lessons.map((lesson) => (
                                        <div key={lesson.id} className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                          <div className="d-flex align-items-center">
                                            <span>
                                              <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                            </span>
                                            <p className="fw-medium text-gray-5 mb-0">{lesson.name}</p>
                                            {lesson.isPreview && (
                                              <span className="badge bg-success ms-2 small">{t('addCourse.step3.preview')}</span>
                                            )}
                                          </div>
                                          <div className="d-flex align-items-center">
                                            <Link
                                              to="#"
                                              className="delete-btn1"
                                              onClick={(e) => { e.preventDefault(); handleRemoveLesson(topic.id, lesson.id); }}
                                            >
                                              <i className="isax isax-trash fs-16" />
                                            </Link>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="d-flex align-items-center justify-content-between">
                                        <button
                                          type="button"
                                          className="btn add-edit-btn d-inline-flex align-items-center"
                                          data-bs-toggle="modal"
                                          data-bs-target="#add-lesson"
                                          onClick={() => setActiveLessonTopicId(topic.id)}
                                        >
                                          <i className="isax isax-add-circle5 me-2" />
                                          {t('addCourse.step3.addLesson')}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="add-form-btn widget-next-btn submit-btn">
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-light main-btn prev_btns"
                              onClick={handlePrev}
                            >
                              <i className="isax isax-arrow-left-2 me-1" />
                              {t('addCourse.nav.prev')}
                            </button>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-secondary main-btn next_btns"
                              onClick={handleNext}
                            >
                              {t('addCourse.nav.next')} <i className="isax isax-arrow-right-3 ms-1" />
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )
                    }
                    {currentStep === 4 && (
                      <fieldset className="form-inner wizard-form-card" style={{ display: 'block' }}>
                        <div className="title">
                          <div className="row align-items-center row-gap-3">
                            <div className="col-md-9">
                              <h5 className="mb-0">{t('addCourse.step4.faqs')}</h5>
                            </div>
                            <div className="col-md-3 text-end">
                              <Link
                                to="#"
                                className="btn add-edit-btn d-inline-flex align-items-center"
                                data-bs-toggle="modal"
                                data-bs-target="#add-faq"
                              >
                                <i className="isax isax-add-circle5 me-1" /> {t('addCourse.step4.addNew')}
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="pb-3 border-bottom mb-3">
                          {faqs.length === 0 && (
                            <div className="text-center text-muted py-4 border rounded-3">
                              <i className="isax isax-message-question fs-1 mb-2 d-block" />
                              <p className="mb-0">{t('addCourse.step4.noFaqs')}</p>
                            </div>
                          )}
                          {faqs.map((faq) => (
                            <div key={faq.id} className="border rounded-3 p-3 mb-3 bg-white">
                              <div className="d-flex align-items-start justify-content-between">
                                <div className="flex-grow-1">
                                  <p className="fw-medium mb-1">{faq.question}</p>
                                  {faq.answer && (
                                    <p className="text-muted small mb-0">{faq.answer}</p>
                                  )}
                                </div>
                                <Link
                                  to="#"
                                  className="delete-btn1 ms-3"
                                  onClick={(e) => { e.preventDefault(); handleRemoveFaq(faq.id); }}
                                >
                                  <i className="isax isax-trash fs-16" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pb-3 border-bottom mb-3">
                          <div className="input-block mb-0">
                            <label className="form-label">{t('addCourse.step4.tags')}</label>
                            <Chips value={value1} className="input-tags form-control h-100 w-100" onChange={(e: ChipsChangeEvent) => setValue1(e.value)} itemTemplate={customChip} />
                            <span className="fs-13 text-gray-6 mt-1 d-block">
                              {t('addCourse.step4.tagsHelp')}
                            </span>
                          </div>
                        </div>
                        <div className="input-block">
                          <label className="form-label">{t('addCourse.step4.messageReviewer')}</label>
                          <textarea className="form-control" defaultValue={""} />
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md d-flex align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              defaultValue=""
                              id="flexCheckChecked"
                              defaultChecked
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor="flexCheckChecked"
                            >
                              {t('addCourse.step4.licenseCheck')}
                            </label>
                          </div>
                        </div>
                        <div className="add-form-btn widget-next-btn submit-btn">
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-light main-btn prev_btns"
                              onClick={handlePrev}
                            >
                              <i className="isax isax-arrow-left-2 me-1" />
                              {t('addCourse.nav.prev')}
                            </button>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-secondary main-btn next_btns"
                              onClick={handleNext}
                            >
                              {t('addCourse.nav.next')} <i className="isax isax-arrow-right-3 ms-1" />
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )
                    }
                    {currentStep === 5 && (
                      <fieldset className="form-inner wizard-form-card" style={{ display: 'block' }}>
                        <div className="title mb-4">
                          <h5>{t('addCourse.step5.title')}</h5>
                          {/* Course type context banner */}
                          {formData.courseType === 'MASTERCLASS' ? (
                            <div className="d-flex align-items-center gap-2 mt-2 p-3 rounded-3"
                              style={{ background: 'rgba(197,145,44,0.07)', border: '1px solid rgba(197,145,44,0.2)' }}>
                              <i className="isax isax-crown" style={{ fontSize: 18, color: '#C5912C' }} />
                              <span style={{ fontSize: 13, color: '#7A5A0A', fontWeight: 500 }}>
                                {t('addCourse.step5.masterclassBanner')}
                              </span>
                            </div>
                          ) : formData.courseType === 'PLAN' ? (
                            <div className="d-flex align-items-center gap-2 mt-2 p-3 rounded-3"
                              style={{ background: 'rgba(45,95,63,0.06)', border: '1px solid rgba(45,95,63,0.18)' }}>
                              <i className="isax isax-tick-circle" style={{ fontSize: 18, color: '#2D5F3F' }} />
                              <span style={{ fontSize: 13, color: '#2D5F3F', fontWeight: 500 }}>
                                {t('addCourse.step5.planBanner')}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div>
                          {/* Price fields — only for MASTERCLASS (PLAN = subscription, no separate payment) */}
                          {formData.courseType === 'MASTERCLASS' && (
                            <>
                              <div className="input-block mb-2">
                                <label className="form-label">
                                  {t('addCourse.step5.coursePrice')}<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="number"
                                  className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                  value={formData.price}
                                  onChange={(e) => handleInputChange('price', e.target.value)}
                                  placeholder={t('addCourse.step5.enterPrice')}
                                  min="0"
                                  step="0.01"
                                />
                                {errors.price && (
                                  <div className="invalid-feedback d-block">{errors.price}</div>
                                )}
                              </div>
                              <div className="d-flex align-items-center mb-3">
                                <div className="form-check form-check-md d-flex align-items-center">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="flexCheckChecked2"
                                    checked={formData.hasDiscount}
                                    onChange={(e) => handleInputChange('hasDiscount', e.target.checked)}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor="flexCheckChecked2"
                                  >
                                    {t('addCourse.step5.hasDiscount')}
                                  </label>
                                </div>
                              </div>
                              {formData.hasDiscount && (
                                <div className="input-block mb-3">
                                  <label className="form-label">
                                    {t('addCourse.step5.discountPrice')}<span className="text-danger ms-1">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    className={`form-control mb-1 ${errors.discountPrice ? 'is-invalid' : ''}`}
                                    value={formData.discountPrice}
                                    onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                                    placeholder={t('addCourse.step5.enterDiscountPrice')}
                                    min="0"
                                    step="0.01"
                                  />
                                  {errors.discountPrice && (
                                    <div className="invalid-feedback d-block">{errors.discountPrice}</div>
                                  )}
                                  {formData.price && formData.discountPrice && Number(formData.discountPrice) < Number(formData.price) && (
                                    <span className="text-success">
                                      {t('addCourse.step5.discountPercent', { pct: Math.round((1 - Number(formData.discountPrice) / Number(formData.price)) * 100) })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                          <div className="mb-4">
                            <label className="form-label mb-1">{t('addCourse.step5.expiryPeriod')}</label>
                            <div className="d-flex align-items-center ">
                              <div className="form-check me-3">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="expiryPeriod"
                                  id="flexRadioDefault2"
                                  checked={formData.expiryType === 'lifetime'}
                                  onChange={() => handleInputChange('expiryType', 'lifetime')}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="flexRadioDefault2"
                                >
                                  {t('addCourse.step5.lifetime')}
                                </label>
                              </div>
                              <div className="form-check me-3">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="expiryPeriod"
                                  id="flexRadioDefault3"
                                  checked={formData.expiryType === 'limited'}
                                  onChange={() => handleInputChange('expiryType', 'limited')}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="flexRadioDefault3"
                                >
                                  {t('addCourse.step5.limitedTime')}
                                </label>
                              </div>
                            </div>
                          </div>
                          {formData.expiryType === 'limited' && (
                            <div className="input-block">
                              <label className="form-label">
                                {t('addCourse.step5.numberOfMonths')}<span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="number"
                                className={`form-control mb-1 ${errors.expiryMonths ? 'is-invalid' : ''}`}
                                value={formData.expiryMonths}
                                onChange={(e) => handleInputChange('expiryMonths', e.target.value)}
                                placeholder={t('addCourse.step5.enterMonths')}
                                min="1"
                              />
                              {errors.expiryMonths && (
                                <div className="invalid-feedback d-block">{errors.expiryMonths}</div>
                              )}
                              <span>
                                {t('addCourse.step5.expiryAccessFor', { months: formData.expiryMonths || '...' })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="add-form-btn widget-next-btn submit-btn d-flex justify-content-between">
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-light main-btn prev_btns"
                              onClick={handlePrev}
                            >
                              <i className="isax isax-arrow-left-2 me-1" />
                              {t('addCourse.nav.prev')}
                            </button>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <small className={`${isStepValid ? 'text-success' : 'text-muted'}`}>
                              {isStepValid ? (
                                <><i className="isax isax-tick-circle me-1" /> {t('addCourse.step5.readyToSubmit')}</>
                              ) : (
                                <><i className="isax isax-info-circle me-1" /> {t('addCourse.step5.completeAllFields')}</>
                              )}
                            </small>
                            <button
                              type="button"
                              className={`btn btn-secondary main-btn next_btns ${isSubmitting ? 'opacity-50' : ''}`}
                              disabled={isSubmitting}
                              onClick={handleSubmitCourse}
                              style={{ cursor: !isSubmitting ? 'pointer' : 'not-allowed' }}
                            >
                              {isSubmitting ? (
                                <>
                                  <Spin size="small" className="me-2" />
                                  {t('addCourse.step5.creatingCourse')}
                                </>
                              ) : (
                                t('addCourse.step5.submitCourse')
                              )}
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )

                    }

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Course watch */}

      {/* Add topic */}
      <div className="modal fade" id="add-topic">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>{t('addCourse.modals.topic.title')}</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setNewTopicTitle('')}
              >
                <i className="isax isax-close-circle5" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="input-block">
                  <label className="form-label">
                    {t('addCourse.modals.topic.topicTitle')}<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('addCourse.modals.topic.placeholder')}
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-light"
                  data-bs-dismiss="modal"
                  onClick={() => setNewTopicTitle('')}
                >
                  {t('addCourse.modals.topic.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={handleAddTopic}
                  disabled={!newTopicTitle.trim()}
                >
                  {t('addCourse.modals.topic.addTopic')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add topic */}
      {/* Add lesson */}
      <div className="modal fade" id="add-lesson">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>{t('addCourse.modals.lesson.title')}</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => { setNewLessonName(''); setNewLessonIsPreview(false); }}
              >
                <i className="isax isax-close-circle5" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="input-block mb-4">
                  <label className="form-label">
                    {t('addCourse.modals.lesson.lessonTitle')}<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('addCourse.modals.lesson.placeholder')}
                    value={newLessonName}
                    onChange={(e) => setNewLessonName(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center">
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="lessonPreview"
                      id="lessonPreviewNo"
                      checked={!newLessonIsPreview}
                      onChange={() => setNewLessonIsPreview(false)}
                    />
                    <label className="form-check-label" htmlFor="lessonPreviewNo">
                      {t('addCourse.modals.lesson.premium')}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="lessonPreview"
                      id="lessonPreviewYes"
                      checked={newLessonIsPreview}
                      onChange={() => setNewLessonIsPreview(true)}
                    />
                    <label className="form-check-label" htmlFor="lessonPreviewYes">
                      {t('addCourse.modals.lesson.freePreview')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-light"
                  data-bs-dismiss="modal"
                  onClick={() => { setNewLessonName(''); setNewLessonIsPreview(false); }}
                >
                  {t('addCourse.modals.lesson.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={handleAddLesson}
                  disabled={!newLessonName.trim()}
                >
                  {t('addCourse.modals.lesson.addLesson')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add lesson */}
      {/* Add Faq */}
      <div className="modal fade" id="add-faq">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>{t('addCourse.modals.faq.title')}</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => { setNewFaqQuestion(''); setNewFaqAnswer(''); }}
              >
                <i className="isax isax-close-circle5" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="input-block mb-4">
                  <label className="form-label">
                    {t('addCourse.modals.faq.question')}<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('addCourse.modals.faq.questionPlaceholder')}
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                  />
                </div>
                <div className="input-block mb-4">
                  <label className="form-label">
                    {t('addCourse.modals.faq.answer')}<span className="text-danger ms-1">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    placeholder={t('addCourse.modals.faq.answerPlaceholder')}
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-light"
                  data-bs-dismiss="modal"
                  onClick={() => { setNewFaqQuestion(''); setNewFaqAnswer(''); }}
                >
                  {t('addCourse.modals.faq.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={handleAddFaq}
                  disabled={!newFaqQuestion.trim()}
                >
                  {t('addCourse.modals.faq.addFaq')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Faq */}

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        title={null}
        footer={null}
        closable={false}
        centered
        width={450}
      >
        <div className="text-center py-4">
          <div className="text-success mb-3" style={{ fontSize: '48px' }}>
            <i className="fa-solid fa-circle-check" />
          </div>
          <h4 className="mb-2">{t('addCourse.success.congratulations')}</h4>
          <h5 className="mb-3">{t('addCourse.success.courseCreated')}</h5>
          <p className="text-muted mb-4">
            {t('addCourse.success.courseCreatedDesc')}
          </p>
          <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setShowSuccessModal(false);
                navigate(route.instructorDashboard);
              }}
            >
              <i className="fa-solid fa-arrow-left me-1" />
              {t('addCourse.success.backToDashboard')}
            </button>
            {createdCourseId && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/instructor/course-manage/${createdCourseId}`);
                }}
              >
                {t('addCourse.success.addModules')}
                <i className="fa-solid fa-arrow-right ms-1" />
              </button>
            )}
          </div>
        </div>
      </Modal>

    </LuxuryDashboardLayout>
  )
}

export default AddNewCourse
