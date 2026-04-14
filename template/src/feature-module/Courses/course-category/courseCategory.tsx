import React, { useState, useEffect, useCallback } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { Spin } from 'antd';
import { courseService } from '../../../services/api/course.service';
import { CourseCategory as CourseCategoryType, Course } from '../../../services/api/types';
import { getFileUrl } from '../../../environment';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { addToCart } from '../../../core/redux/cartSlice';
import { App } from 'antd';

const CourseCategory = () => {
  const route = all_routes;
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { items: cartItems } = useAppSelector((s) => s.cart);

  const [categories,    setCategories]    = useState<CourseCategoryType[]>([]);
  const [activeTab,     setActiveTab]     = useState<string>('');
  const [courses,       setCourses]       = useState<Course[]>([]);
  const [catLoading,    setCatLoading]    = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage,   setCurrentPage]   = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);

  const PAGE_SIZE = 9;

  /* ── Load categories ── */
  useEffect(() => {
    courseService.getCategories()
      .then((cats) => {
        if (cats.length > 0) {
          setCategories(cats);
          setActiveTab(cats[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  /* ── Load courses when active tab or page changes ── */
  const fetchCourses = useCallback(async (categoryId: string, page: number) => {
    if (!categoryId) return;
    try {
      setCourseLoading(true);
      const result = await courseService.getCourses({
        categoryId,
        page,
        size: PAGE_SIZE,
        sortBy: 'newest',
      });
      setCourses(result.content ?? []);
      setTotalElements(result.totalElements ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch {
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab) {
      setCurrentPage(0);
      fetchCourses(activeTab, 0);
    }
  }, [activeTab, fetchCourses]);

  useEffect(() => {
    if (activeTab) fetchCourses(activeTab, currentPage);
  }, [currentPage]);

  const handleTabChange = (id: string) => {
    if (id === activeTab) return;
    setActiveTab(id);
  };

  const handleAddToCart = (course: Course) => {
    if (cartItems.some((i) => i.id === course.id)) {
      message.info('Already in cart');
      return;
    }
    dispatch(addToCart({
      id: course.id,
      slug: course.slug,
      title: course.title,
      thumbnailUrl: course.thumbnailUrl,
      price: course.price ?? 0,
      originalPrice: course.originalPrice,
      instructorName: course.instructor?.fullName,
      instructorId: course.instructor?.id,
      instructorAvatar: course.instructor?.avatarUrl,
      rating: course.ratingAverage,
      ratingCount: course.ratingCount,
      level: course.level,
    }));
    message.success(`"${course.title}" added to cart`);
  };

  const getLevelDisplay = (level: string) => {
    switch (level) {
      case 'BEGINNER':     return 'Beginner';
      case 'INTERMEDIATE': return 'Intermediate';
      case 'ADVANCED':     return 'Advanced';
      case 'ALL_LEVELS':   return 'All Levels';
      default:             return level;
    }
  };

  if (catLoading) {
    return (
      <>
        <Breadcrumb title="Course Category" />
        <section className="course-category">
          <div className="container text-center py-5">
            <Spin size="large" />
          </div>
        </section>
      </>
    );
  }

  if (categories.length === 0) {
    return (
      <>
        <Breadcrumb title="Course Category" />
        <section className="course-category">
          <div className="container text-center py-5">
            <h5 className="text-muted">No categories available yet</h5>
          </div>
        </section>
      </>
    );
  }

  const activeCategory = categories.find((c) => c.id === activeTab);

  return (
    <>
      <Breadcrumb title="Course Category" />

      <section className="course-category">
        <div className="container">
          <h2 className="mb-1">Browse By Categories</h2>
          <p className="text-muted mb-4">One stop shop for all your needs</p>

          {/* ── Category tabs ── */}
          <ul className="nav nav-pills mb-4 flex-wrap gap-2" id="pills-tab" role="tablist">
            {categories.map((cat) => (
              <li key={cat.id} className="nav-item" role="presentation">
                <button
                  className={`nav-link${activeTab === cat.id ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  onClick={() => handleTabChange(cat.id)}
                >
                  {cat.name}
                  {cat.coursesCount > 0 && (
                    <span style={{
                      marginLeft: 6, fontSize: 11, fontWeight: 700,
                      background: activeTab === cat.id ? 'rgba(255,255,255,0.25)' : 'rgba(107,29,42,0.1)',
                      color: activeTab === cat.id ? '#fff' : '#6B1D2A',
                      padding: '1px 7px', borderRadius: 10,
                    }}>
                      {cat.coursesCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* ── Tab content ── */}
          <div className="tab-content">
            {/* Results header */}
            {!courseLoading && (
              <div className="d-flex align-items-center justify-content-between mb-3">
                <p className="text-muted small mb-0">
                  {totalElements} course{totalElements !== 1 ? 's' : ''} in{' '}
                  <strong>{activeCategory?.name}</strong>
                </p>
                <Link
                  to={`${route.courseList}?category=${activeTab}`}
                  className="btn btn-sm btn-outline-primary rounded-pill"
                >
                  View All <i className="fas fa-angle-right ms-1" />
                </Link>
              </div>
            )}

            {courseLoading ? (
              <div className="text-center py-5">
                <Spin size="large" />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-5">
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(107,29,42,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <i className="isax isax-book" style={{ fontSize: 28, color: 'rgba(107,29,42,0.3)' }} />
                </div>
                <h6 className="text-muted">No courses in this category yet</h6>
              </div>
            ) : (
              <>
                <div className="row g-4">
                  {courses.map((course) => {
                    const thumb = getFileUrl(course.thumbnailUrl) ?? 'assets/img/course/course-01.jpg';
                    const inCart = cartItems.some((i) => i.id === course.id);

                    return (
                      <div key={course.id} className="col-xl-4 col-md-6">
                        <div className="course-box" style={{
                          borderRadius: 14, overflow: 'hidden',
                          border: '1px solid rgba(107,29,42,0.08)',
                          boxShadow: '0 2px 12px rgba(107,29,42,0.06)',
                          background: '#fff',
                          transition: 'box-shadow 0.2s',
                          height: '100%',
                          display: 'flex', flexDirection: 'column',
                        }}>
                          {/* Thumbnail */}
                          <div style={{ position: 'relative', overflow: 'hidden' }}>
                            <Link to={`${route.courseDetails}/${course.slug}`}>
                              <img
                                src={thumb}
                                alt={course.title}
                                style={{ width: '100%', height: 180, objectFit: 'cover' }}
                              />
                            </Link>
                            {/* Badges */}
                            <div style={{
                              position: 'absolute', top: 10, left: 10,
                              display: 'flex', gap: 6,
                            }}>
                              {!course.requiresPurchase && (
                                <span style={{
                                  background: '#10B981', color: '#fff',
                                  fontSize: 11, fontWeight: 700,
                                  padding: '2px 9px', borderRadius: 20,
                                }}>
                                  Free
                                </span>
                              )}
                              {course.isEnrolled && (
                                <span style={{
                                  background: '#3B82F6', color: '#fff',
                                  fontSize: 11, fontWeight: 700,
                                  padding: '2px 9px', borderRadius: 20,
                                }}>
                                  Enrolled
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Instructor */}
                            {course.instructor && (
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <div style={{
                                  width: 24, height: 24, borderRadius: '50%',
                                  overflow: 'hidden', flexShrink: 0,
                                  background: 'rgba(107,29,42,0.08)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {course.instructor.avatarUrl ? (
                                    <img
                                      src={getFileUrl(course.instructor.avatarUrl) ?? course.instructor.avatarUrl}
                                      alt={course.instructor.fullName}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6B1D2A' }}>
                                      {course.instructor.fullName?.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: 12, color: '#6b7280' }}>
                                  {course.instructor.fullName}
                                </span>
                              </div>
                            )}

                            {/* Title */}
                            <h6 className="mb-2" style={{ lineHeight: 1.4 }}>
                              <Link
                                to={`${route.courseDetails}/${course.slug}`}
                                style={{ color: '#2C1810', textDecoration: 'none' }}
                              >
                                {course.title}
                              </Link>
                            </h6>

                            {/* Rating + meta */}
                            <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: 12, color: '#6b7280' }}>
                              <i className="fa-solid fa-star text-warning" style={{ fontSize: 11 }} />
                              <span>{course.ratingAverage?.toFixed(1) ?? '0.0'}</span>
                              <span className="text-muted">({course.ratingCount ?? 0})</span>
                              <span>·</span>
                              <span>{getLevelDisplay(course.level)}</span>
                              <span>·</span>
                              <span>{course.lessonsCount ?? 0} lessons</span>
                            </div>

                            {/* Price + CTA */}
                            <div className="d-flex align-items-center justify-content-between mt-auto">
                              <div>
                                {course.isEnrolled ? (
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>
                                    <i className="fa-solid fa-check-circle me-1" />
                                    Owned
                                  </span>
                                ) : !course.requiresPurchase ? (
                                  <span style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>Free</span>
                                ) : (
                                  <div>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: '#6B1D2A' }}>
                                      ${course.price}
                                    </span>
                                    {course.originalPrice && course.originalPrice > (course.price ?? 0) && (
                                      <del className="text-muted ms-1" style={{ fontSize: 12 }}>
                                        ${course.originalPrice}
                                      </del>
                                    )}
                                  </div>
                                )}
                              </div>

                              {course.isEnrolled ? (
                                <Link
                                  to={`${route.courseWatch}/${course.slug}`}
                                  className="btn btn-sm btn-primary rounded-pill"
                                  style={{ fontSize: 12 }}
                                >
                                  Continue
                                </Link>
                              ) : course.requiresPurchase ? (
                                <button
                                  className={`btn btn-sm rounded-pill ${inCart ? 'btn-success' : 'btn-outline-primary'}`}
                                  style={{ fontSize: 12 }}
                                  onClick={() => handleAddToCart(course)}
                                  disabled={inCart}
                                >
                                  {inCart ? (
                                    <>
                                      <i className="fa-solid fa-check me-1" />
                                      In Cart
                                    </>
                                  ) : (
                                    <>
                                      <i className="isax isax-shopping-cart me-1" />
                                      Add to Cart
                                    </>
                                  )}
                                </button>
                              ) : (
                                <Link
                                  to={`${route.courseDetails}/${course.slug}`}
                                  className="btn btn-sm btn-outline-primary rounded-pill"
                                  style={{ fontSize: 12 }}
                                >
                                  Enroll Free
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <ul className="pagination">
                      <li className={`page-item prev ${currentPage === 0 ? 'disabled' : ''}`}>
                        <button
                          className="page-link border-0 bg-transparent"
                          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                        >
                          <i className="fas fa-angle-left" />
                        </button>
                      </li>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pg = i;
                        if (totalPages > 5) {
                          if (currentPage < 3) pg = i;
                          else if (currentPage > totalPages - 4) pg = totalPages - 5 + i;
                          else pg = currentPage - 2 + i;
                        }
                        return (
                          <li key={pg} className={`page-item ${currentPage === pg ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(pg)}>
                              {pg + 1}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item next ${currentPage === totalPages - 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link border-0 bg-transparent"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage === totalPages - 1}
                        >
                          <i className="fas fa-angle-right" />
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default CourseCategory;
