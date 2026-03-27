import React, { useState, useEffect, useMemo } from 'react'
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link, useNavigate } from 'react-router-dom';
import CustomSelect from '../../../core/common/commonSelect';
import { CourseLevel, Language, PrivateCourse } from '../../../core/common/selectOption/json/selectOption';
import DefaultEditor from "react-simple-wysiwyg";
import VideoModal from '../../HomePages/home-one/section/videoModal';
import { all_routes } from '../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Chips, ChipsChangeEvent } from "primereact/chips";
import { message, Modal, Spin } from 'antd';
import { courseService } from '../../../services/api/course.service';
import { instructorService } from '../../../services/api/instructor.service';
import { CourseCategory as CourseCategoryType, CourseLevel as CourseLevelType } from '../../../services/api/types';

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
  const navigate = useNavigate();
  const route = all_routes
  const [value1, setValue1] = useState<any>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        console.log('Fetching categories...');
        const categories = await courseService.getCategories();
        console.log('Categories received:', categories);
        const options = categories.map((cat: CourseCategoryType) => ({
          label: cat.name,
          value: cat.id.toString()
        }));
        console.log('Category options:', options);
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
    console.log('CourseLevel options:', CourseLevel);
    console.log('Language options:', Language);
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

    if (!formData.isFree) {
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
        const shortDescValid = formData.shortDescription.trim().length >= 20;
        const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
        const descriptionValid = descriptionText.length >= 50;

        console.log('Step 1 Validation:', {
          title: formData.title, titleValid,
          category: formData.category, categoryValid,
          level: formData.level, levelValid,
          language: formData.language, languageValid,
          shortDescription: formData.shortDescription.length, shortDescValid,
          descriptionLength: descriptionText.length, descriptionValid
        });

        return titleValid && categoryValid && levelValid && languageValid && shortDescValid && descriptionValid;
      case 2:
        return true; // Media step is optional
      case 3:
        return true; // Curriculum step - modules/lessons can be added later
      case 4:
        return true; // Additional info is optional
      case 5:
        if (formData.isFree) return true;
        const priceValid = formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0;
        const discountValid = !formData.hasDiscount ||
          (formData.discountPrice && Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price));
        const expiryValid = formData.expiryType === 'lifetime' ||
          (formData.expiryMonths && Number(formData.expiryMonths) > 0);
        return priceValid && discountValid && expiryValid;
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

  function onChange(e: any) {
    const newValue = e.target.value;
    setValue(newValue);
    handleInputChange('description', newValue);
  };
  const [items, setItems] = useState<string[]>([]);

  const addNewItem = () => {
    setItems([...items, ""]);
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const [showModal, setShowModal] = useState(false);
  const videoUrl = 'https://www.youtube.com/embed/1trvO6dqQUI';

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
      console.log('Validation errors:', validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the course data - match backend CreateCourseRequest fields
      const courseData = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        categoryId: formData.category, // Send as string (UUID)
        level: formData.level as CourseLevelType,
        language: formData.language || 'fr',
        // Pricing: if has discount, originalPrice is the full price, price is the discounted price
        price: formData.isFree ? 0 : (formData.hasDiscount ? parseFloat(formData.discountPrice) : parseFloat(formData.price)),
        originalPrice: formData.isFree ? undefined : (formData.hasDiscount ? parseFloat(formData.price) : undefined),
        requiresPurchase: !formData.isFree,
        // Convert arrays to comma-separated strings for backend
        requirements: formData.requirements.filter(r => r.trim() !== '').join('\n'),
        whatYouWillLearn: formData.learningObjectives.filter(o => o.trim() !== '').join('\n'),
        tags: Array.isArray(value1) ? value1.join(',') : (value1 || ''),
      };

      console.log('Submitting course:', courseData);

      // Create the course
      const createdCourse = await instructorService.createCourse(courseData);
      console.log('Course created:', createdCourse);
      setCreatedCourseId(createdCourse.id);

      // Upload thumbnail if provided
      if (formData.thumbnail) {
        try {
          await instructorService.uploadThumbnail(createdCourse.id, formData.thumbnail);
          console.log('Thumbnail uploaded successfully');
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

  return (
    <>
      <Breadcrumb title='Add New Course' />

      <>
        {/* Course add */}
        <div className="content">
          <div className="container">
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
                            <p>Course Information</p>
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
                            <p>Course Media</p>
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
                            <p>Curriculam</p>
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
                            <p>Additional information</p>
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
                            <p>Pricing</p>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="initialization-form-set">
                    {currentStep === 1 && (
                      <fieldset className="form-inner wizard-form-card" id="first">
                        <div className="title">
                          <h5>Basic Information</h5>
                        </div>
                        <div className="row">
                          <div className="col-md-12">
                            <div className="input-block">
                              <label className="form-label">
                                Course Title<span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="text"
                                className={`form-control ${errors.title && touched.title ? 'is-invalid' : ''}`}
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Enter course title (min 5 characters)"
                              />
                              {errors.title && touched.title && (
                                <div className="invalid-feedback d-block">{errors.title}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="input-block">
                              <label className="form-label">
                                Course Category
                                <span className="text-danger ms-1">*</span>
                              </label>
                              {loadingCategories ? (
                                <div className="form-control d-flex align-items-center justify-content-center">
                                  <Spin size="small" /> <span className="ms-2">Loading...</span>
                                </div>
                              ) : categoryOptions.length === 0 ? (
                                <div className="alert alert-warning mb-0 py-2">
                                  <small>
                                    <i className="isax isax-warning-2 me-1" />
                                    No categories available. Admin must create categories first.
                                  </small>
                                </div>
                              ) : (
                                <select
                                  className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                  value={formData.category}
                                  onChange={(e) => handleInputChange('category', e.target.value)}
                                >
                                  <option value="">Select category</option>
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
                                Course Level<span className="text-danger ms-1">*</span>
                              </label>
                              <select
                                className={`form-select ${errors.level ? 'is-invalid' : ''}`}
                                value={formData.level}
                                onChange={(e) => handleInputChange('level', e.target.value)}
                              >
                                <option value="">Select level</option>
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
                                Language<span className="text-danger ms-1">*</span>
                              </label>
                              <select
                                className={`form-select ${errors.language ? 'is-invalid' : ''}`}
                                value={formData.language}
                                onChange={(e) => handleInputChange('language', e.target.value)}
                              >
                                <option value="">Select language</option>
                                {Language.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              {errors.language && (
                                <div className="invalid-feedback d-block">{errors.language}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                Max Number of Students
                              </label>
                              <input
                                type="number"
                                className="form-control student-count"
                                value={formData.maxStudents}
                                onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                                placeholder="Leave empty for unlimited"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-block">
                              <label className="form-label">
                                Public / Private Course
                              </label>
                              <select
                                className="form-select"
                                value={formData.courseType}
                                onChange={(e) => handleInputChange('courseType', e.target.value)}
                              >
                                <option value="">Select</option>
                                {PrivateCourse.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="input-block">
                              <label className="form-label">
                                Short Description
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="text"
                                className={`form-control ${errors.shortDescription && touched.shortDescription ? 'is-invalid' : ''}`}
                                value={formData.shortDescription}
                                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                placeholder="Brief overview of your course (min 20 characters)"
                              />
                              {errors.shortDescription && touched.shortDescription && (
                                <div className="invalid-feedback d-block">{errors.shortDescription}</div>
                              )}
                              <small className="text-muted">
                                {formData.shortDescription.length}/20 characters minimum
                              </small>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="input-block">
                              <label className="form-label">
                                Course Description
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <div className={`summernote ${errors.description ? 'border border-danger rounded' : ''}`}>
                                <DefaultEditor value={values} onChange={onChange} />
                              </div>
                              {errors.description && (
                                <div className="invalid-feedback d-block">{errors.description}</div>
                              )}
                              <small className="text-muted">
                                Detailed description (min 50 characters)
                              </small>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="bg-light border p-4 rounded-3">
                              <h6 className="mb-2">
                                What will students learn in your course?
                              </h6>
                              <div className="input-block" id="input-block">
                                <div className="d-flex align-items-center add-new-input">
                                  <input
                                    type="text"
                                    className="form-control"
                                    defaultValue="Become a UX designer"
                                  />
                                  <Link to="#" className="link-trash">
                                    <i className="isax isax-trash" />
                                  </Link>
                                </div>
                                <div id="input-block">
                                  {items.map((item, index) => (
                                    <div key={index} className="d-flex align-items-center add-new-input">
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter new item"
                                        value={item}
                                        onChange={(e) => updateItem(index, e.target.value)}
                                      />
                                      <Link
                                        to="#"
                                        className="link-trash"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          removeItem(index);
                                        }}
                                      >
                                        <i className="isax isax-trash"></i>
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="d-flex align-items-center justify-content-end">
                                <Link
                                  to="#"
                                  className="d-flex align-items-center add-new-topic"
                                  id="add-new-topic-btn"
                                  onClick={addNewItem}
                                >
                                  <i className="isax isax-add me-1" /> Add New Item
                                </Link>
                                <div>
                                </div>
                              </div>

                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="bg-light border	 p-4 rounded-3">
                              <h6 className="mb-2">Requirements</h6>
                              <div className="input-block">
                                <div className="d-flex align-items-center add-new-input">
                                  <input type="text" className="form-control" />
                                  <Link to="#" className="link-trash">
                                    <i className="isax isax-trash" />
                                  </Link>
                                </div>
                              </div>
                              <div className="d-flex align-items-center justify-content-end">
                                <Link
                                  to="#"
                                  className="d-flex align-items-center add-new-topic"
                                >
                                  <i className="isax isax-add me-1" /> Add New Item
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
                                Check this for featured course
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="add-form-btn widget-next-btn submit-btn d-flex justify-content-between mb-0">
                          <div className="btn-left">
                            <small className={`${isStepValid ? 'text-success' : 'text-muted'}`}>
                              {isStepValid ? (
                                <><i className="isax isax-tick-circle me-1" /> All required fields completed</>
                              ) : (
                                <><i className="isax isax-info-circle me-1" /> Please fill all required fields</>
                              )}
                            </small>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className={`btn main-btn next_btns ${!isStepValid ? 'btn-secondary opacity-50' : ''}`}
                              onClick={handleNext}
                              disabled={!isStepValid}
                              style={{ cursor: isStepValid ? 'pointer' : 'not-allowed' }}
                            >
                              Next <i className="isax isax-arrow-right-3 ms-1" />
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )

                    }
                    {currentStep === 2 && (
                      <fieldset className="form-inner wizard-form-card" style={{ display: 'block' }}>
                        <div className="title">
                          <h5>Course Media</h5>
                          <p>
                            Upload course thumbnail and promotional video
                          </p>
                        </div>
                        <div className="row">
                          {/* Thumbnail Upload Section */}
                          <div className="col-md-12 mb-4">
                            <div className="input-block">
                              <label className="form-label">
                                Course Thumbnail
                                <span className="text-muted ms-2">(Recommended: 1280x720px)</span>
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
                                          Click to upload thumbnail
                                        </p>
                                        <span className="text-muted small">
                                          JPEG, PNG, GIF, WebP - Max 2MB
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="p-3 bg-light rounded h-100">
                                    <h6 className="mb-3">Thumbnail Tips</h6>
                                    <ul className="small text-muted mb-0">
                                      <li className="mb-2">Use high-quality images (1280x720px recommended)</li>
                                      <li className="mb-2">Make it visually appealing and relevant</li>
                                      <li className="mb-2">Avoid too much text in the image</li>
                                      <li>Use bright, contrasting colors</li>
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
                                Promotional Video <span className="text-muted">(Optional)</span>
                              </label>
                              <p className="text-muted small mb-3">
                                Add a short promotional video to attract students. Provide a YouTube or Vimeo URL.
                              </p>
                              <div className="row">
                                <div className="col-md-4">
                                  <label className="form-label small">Video Source</label>
                                  <select
                                    className="form-select"
                                    value={formData.videoType}
                                    onChange={(e) => handleInputChange('videoType', e.target.value)}
                                  >
                                    <option value="">No promo video</option>
                                    <option value="youtube">YouTube URL</option>
                                    <option value="vimeo">Vimeo URL</option>
                                    <option value="external">External URL</option>
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
                                        Select a video source to add a promotional video
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
                                  <p className="text-white mt-2 mb-0">Click to preview video</p>
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
                                <h6 className="mb-1">How Video Upload Works</h6>
                                <p className="mb-0 small">
                                  <strong>Step 1:</strong> Create and submit the course (complete all 5 steps).<br/>
                                  <strong>Step 2:</strong> Add modules and lessons from the course management page.<br/>
                                  <strong>Step 3:</strong> For each video lesson, click "Upload Video" to upload directly to Mux.<br/>
                                  Videos are automatically transcoded for optimal streaming quality.
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
                              Prev
                            </button>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-secondary main-btn next_btns d-flex align-items-center"
                              onClick={handleNext}
                            >
                              Next <i className="isax isax-arrow-right-3 ms-1" />
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
                              <h5 className="mb-0">Curriculum</h5>
                            </div>
                            <div className="col-md-6 text-md-end">
                              <Link
                                to="#"
                                className="btn add-edit-btn d-inline-flex align-items-center"
                                data-bs-toggle="modal"
                                data-bs-target="#add-topic"
                              >
                                <i className="isax isax-add-circle5 me-1" /> Add New
                                Topic
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div
                            className="accordions-items-seperate"
                            id="accordionSpacingExample"
                          >
                            <div className="accordion-item">
                              <h2 className="accordion-header" id="headingSpacingOne">
                                <Link
                                  to="#"
                                  className="accordion-button collapsed"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#SpacingOne"
                                  aria-expanded="false"
                                  aria-controls="SpacingOne"
                                >
                                  <span className="d-flex align-items-center mb-0">
                                    <i className="isax isax-menu-15 me-2" />
                                    Introduction of Digital Marketing
                                  </span>
                                </Link>
                              </h2>
                              <div
                                id="SpacingOne"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingSpacingOne"
                                data-bs-parent="#accordionSpacingExample"
                              >
                                <div className="accordion-body">
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Describe SEO Engine
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Know about all marketing
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="btn add-edit-btn d-inline-flex align-items-center"
                                        data-bs-toggle="modal"
                                        data-bs-target="#add-lesson"
                                      >
                                        <i className="isax isax-add-circle5 me-2" />
                                        Add Lesson
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="accordion-item">
                              <h2 className="accordion-header" id="headingSpacingTwo">
                                <Link
                                  to="#"
                                  className="accordion-button collapsed"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#SpacingTwo"
                                  aria-expanded="false"
                                  aria-controls="SpacingTwo"
                                >
                                  <span className="d-flex align-items-center mb-0">
                                    <i className="isax isax-menu-15 me-2" />
                                    Installing Development Software
                                  </span>
                                </Link>
                              </h2>
                              <div
                                id="SpacingTwo"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingSpacingTwo"
                                data-bs-parent="#accordionSpacingExample"
                              >
                                <div className="accordion-body">
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Describe SEO Engine
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Know about all marketing
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="btn btn-primary d-inline-flex align-items-center"
                                        data-bs-toggle="modal"
                                        data-bs-target="#add-lesson"
                                      >
                                        <i className="isax isax-add-circle5 me-2" />
                                        Add Lesson
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="accordion-item">
                              <h2 className="accordion-header" id="headingSpacingThree">
                                <Link
                                  to="#"
                                  className="accordion-button collapsed"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#SpacingThree"
                                  aria-expanded="false"
                                  aria-controls="SpacingThree"
                                >
                                  <span className="d-flex align-items-center mb-0">
                                    <i className="isax isax-menu-15 me-2" />
                                    Hello World Project from GitHub
                                  </span>
                                </Link>
                              </h2>
                              <div
                                id="SpacingThree"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingSpacingThree"
                                data-bs-parent="#accordionSpacingExample"
                              >
                                <div className="accordion-body">
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Describe SEO Engine
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Know about all marketing
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="btn btn-primary d-inline-flex align-items-center"
                                        data-bs-toggle="modal"
                                        data-bs-target="#add-lesson"
                                      >
                                        <i className="isax isax-add-circle5 me-2" />
                                        Add Lesson
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
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
                              Prev
                            </button>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-secondary main-btn next_btns"
                              onClick={handleNext}
                            >
                              Next <i className="isax isax-arrow-right-3 ms-1" />
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
                              <h5 className="mb-0">FAQ’s</h5>
                            </div>
                            <div className="col-md-3 text-end">
                              <Link
                                to="#"
                                className="btn add-edit-btn d-inline-flex align-items-center"
                                data-bs-toggle="modal"
                                data-bs-target="#add-faq"
                              >
                                <i className="isax isax-add-circle5 me-1" /> Add New
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="pb-3 border-bottom mb-3">
                          <div
                            className="accordions-items-seperate"
                            id="accordionSpacingExample1"
                          >
                            <div className="accordion-item">
                              <h2 className="accordion-header" id="headingSpacingFour">
                                <Link
                                  to="#"
                                  className="accordion-button collapsed"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#Spacingthree"
                                  aria-expanded="false"
                                  aria-controls="Spacingthree"
                                >
                                  <span className="d-flex align-items-center text-gray-9 mb-0">
                                    <i className="isax isax-menu-15 me-2" />
                                    Hello World Project from GitHub
                                  </span>
                                </Link>
                              </h2>
                              <div
                                id="Spacingthree"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingSpacingFour"
                                data-bs-parent="#accordionSpacingExample1"
                              >
                                <div className="accordion-body">
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Describe SEO Engine
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Know about all marketing
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="accordion-item">
                              <h2 className="accordion-header" id="headingSpacingFive">
                                <Link
                                  to="#"
                                  className="accordion-button collapsed"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#Spacingone"
                                  aria-expanded="false"
                                  aria-controls="Spacingone"
                                >
                                  <span className="d-flex align-items-center text-gray-9">
                                    <i className="isax isax-menu-15 me-2" />
                                    New Update
                                  </span>
                                </Link>
                              </h2>
                              <div
                                id="Spacingone"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingSpacingFive"
                                data-bs-parent="#accordionSpacingExample"
                              >
                                <div className="accordion-body">
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Describe SEO Engine
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded-3 mb-3">
                                    <div className="d-flex align-items-center">
                                      <span>
                                        <i className="isax isax-play-circle5 text-success fs-24 me-1" />
                                      </span>
                                      <p className="fw-medium text-gray-5 mb-0">
                                        Know about all marketing
                                      </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <Link
                                        to="#"
                                        className="edit-btn1"
                                      >
                                        <i className="isax isax-edit-25 fs-16" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="delete-btn1"
                                      >
                                        <i className="isax isax-trash fs-16" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="pb-3 border-bottom mb-3">
                          <div className="input-block mb-0">
                            <label className="form-label">Tags</label>
                            <Chips value={value1} className="input-tags form-control h-100 w-100" onChange={(e: ChipsChangeEvent) => setValue1(e.value)} itemTemplate={customChip} />
                            <span className="fs-13 text-gray-6 mt-1 d-block">
                              Maximum of 14 keywords. Keywords should all be in
                              lowercase. e.g. javascript, react, marketing
                            </span>
                          </div>
                        </div>
                        <div className="input-block">
                          <label className="form-label">Message to a reviewer</label>
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
                              Any images, sounds, or other assets that are not my own
                              work, have been appropriately licensed for use in the file
                              preview or main course. Other than these items, this work
                              is entirely my own and I have full rights to sell it here.
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
                              Prev
                            </button>
                          </div>
                          <div className="btn-left">
                            <button
                              type="button"
                              className="btn btn-secondary main-btn next_btns"
                              onClick={handleNext}
                            >
                              Next <i className="isax isax-arrow-right-3 ms-1" />
                            </button>
                          </div>
                        </div>
                      </fieldset>
                    )
                    }
                    {currentStep === 5 && (
                      <fieldset className="form-inner wizard-form-card" style={{ display: 'block' }}>
                        <div className="title mb-4">
                          <h5>Pricing Information</h5>
                        </div>
                        <div>
                          <div className="d-flex align-items-center mb-3">
                            <div className="form-check form-check-md d-flex align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="flexCheckChecked1"
                                checked={formData.isFree}
                                onChange={(e) => handleInputChange('isFree', e.target.checked)}
                              />
                              <label
                                className="form-check-label ms-2"
                                htmlFor="flexCheckChecked1"
                              >
                                Check if this is a free course
                              </label>
                            </div>
                          </div>
                          {!formData.isFree && (
                            <>
                              <div className="input-block mb-2">
                                <label className="form-label">
                                  Course Price ($)<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="number"
                                  className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                  value={formData.price}
                                  onChange={(e) => handleInputChange('price', e.target.value)}
                                  placeholder="Enter course price"
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
                                    Check if this course has discount
                                  </label>
                                </div>
                              </div>
                              {formData.hasDiscount && (
                                <div className="input-block">
                                  <label className="form-label">
                                    Discount Price ($)<span className="text-danger ms-1">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    className={`form-control mb-1 ${errors.discountPrice ? 'is-invalid' : ''}`}
                                    value={formData.discountPrice}
                                    onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                                    placeholder="Enter discount price"
                                    min="0"
                                    step="0.01"
                                  />
                                  {errors.discountPrice && (
                                    <div className="invalid-feedback d-block">{errors.discountPrice}</div>
                                  )}
                                  {formData.price && formData.discountPrice && Number(formData.discountPrice) < Number(formData.price) && (
                                    <span className="text-success">
                                      This course has {Math.round((1 - Number(formData.discountPrice) / Number(formData.price)) * 100)}% Discount
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                          <div className="mb-4">
                            <label className="form-label mb-1">Expiry Period</label>
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
                                  Lifetime
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
                                  Limited Time
                                </label>
                              </div>
                            </div>
                          </div>
                          {formData.expiryType === 'limited' && (
                            <div className="input-block">
                              <label className="form-label">
                                Number of months<span className="text-danger ms-1">*</span>
                              </label>
                              <input
                                type="number"
                                className={`form-control mb-1 ${errors.expiryMonths ? 'is-invalid' : ''}`}
                                value={formData.expiryMonths}
                                onChange={(e) => handleInputChange('expiryMonths', e.target.value)}
                                placeholder="Enter number of months"
                                min="1"
                              />
                              {errors.expiryMonths && (
                                <div className="invalid-feedback d-block">{errors.expiryMonths}</div>
                              )}
                              <span>
                                After purchase, students can access the course for {formData.expiryMonths || '...'} months.
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
                              Prev
                            </button>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <small className={`${isStepValid ? 'text-success' : 'text-muted'}`}>
                              {isStepValid ? (
                                <><i className="isax isax-tick-circle me-1" /> Ready to submit</>
                              ) : (
                                <><i className="isax isax-info-circle me-1" /> Complete all required fields</>
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
                                  Creating Course...
                                </>
                              ) : (
                                'Submit Course'
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
      </>

      {/* Add topic */}
      <div className="modal fade" id="add-topic">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Topic Name</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="isax isax-close-circle5" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="input-block">
                  <label className="form-label">
                    Add Name<span className="text-danger ms-1">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-secondary">
                  Add New
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
              <h5>New Lesson</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="isax isax-close-circle5" />
              </button>
            </div>
            <form >
              <div className="modal-body">
                <div className="input-block mb-4">
                  <label className="form-label">
                    Add Lesson<span className="text-danger ms-1">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="input-block mb-4">
                  <label className="form-label">
                    Video link<span className="text-danger ms-1">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="input-block mb-4">
                  <label className="form-label">Course Description</label>
                  <textarea className="form-control" defaultValue={""} />
                </div>
                <div className="d-flex align-items-center">
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="flexRadioDefault"
                      id="flexRadioDefault4"
                      defaultChecked
                    />
                    <label className="form-check-label" htmlFor="flexRadioDefault4">
                      free
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="flexRadioDefault"
                      id="flexRadioDefault5"
                    />
                    <label className="form-check-label" htmlFor="flexRadioDefault5">
                      Premium
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-secondary">
                  Add New
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
              <h5>New FAQ</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="isax isax-close-circle5" />
              </button>
            </div>
            <form >
              <div className="modal-body">
                <div className="input-block mb-4">
                  <label className="form-label">
                    Question<span className="text-danger ms-1">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="input-block mb-4">
                  <label className="form-label">
                    Answer<span className="text-danger ms-1">*</span>
                  </label>
                  <textarea className="form-control" defaultValue={""} />
                </div>
                <div className="d-flex align-items-center">
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="flexRadioDefault"
                      id="flexRadioDefault6"
                      defaultChecked
                    />
                    <label className="form-check-label" htmlFor="flexRadioDefault6">
                      Enable
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="flexRadioDefault"
                      id="flexRadioDefault7"
                    />
                    <label className="form-check-label" htmlFor="flexRadioDefault7">
                      Disable
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-secondary">
                  Add New
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
          <h4 className="mb-2">Congratulations!</h4>
          <h5 className="mb-3">Course Created Successfully</h5>
          <p className="text-muted mb-4">
            Your course has been created. You can now add modules and lessons to it.
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
              Back to Dashboard
            </button>
            {createdCourseId && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/instructor/course-manage/${createdCourseId}`);
                }}
              >
                Add Modules & Lessons
                <i className="fa-solid fa-arrow-right ms-1" />
              </button>
            )}
          </div>
        </div>
      </Modal>

    </>
  )
}

export default AddNewCourse
