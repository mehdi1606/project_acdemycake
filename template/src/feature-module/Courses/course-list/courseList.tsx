import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Slider, Spin, Empty, Pagination, message } from 'antd';
import type { SliderSingleProps } from 'antd';
import { all_routes } from '../../router/all_routes';
import { courseService } from '../../../services/api/course.service';
import { Course, CourseCategory, CourseLevel } from '../../../services/api/types';
import { useAppSelector } from '../../../core/redux/hooks';

const CourseList = () => {
  const [searchParams] = useSearchParams();
  const route = all_routes;

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Filter state
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | null>(
    searchParams.get('level') as CourseLevel || null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt,desc');

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const formatter: NonNullable<SliderSingleProps['tooltip']>['formatter'] = (value) => `$${value}`;

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, [currentPage, selectedCategory, selectedLevel, sortBy]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchCourses();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await courseService.getCategories();
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && typeof response === 'object') {
        const data = (response as any).content || (response as any).data || [];
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage - 1,
        size: 10,
        sort: sortBy,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedLevel) params.level = selectedLevel;

      const response = await courseService.getCourses(params);

      if (response) {
        setCourses(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async (courseId: string) => {
    if (!isAuthenticated) {
      message.warning('Please login to add courses to your wishlist');
      return;
    }

    try {
      if (wishlist.includes(courseId)) {
        await courseService.removeFromWishlist(courseId);
        setWishlist(wishlist.filter((id) => id !== courseId));
        message.success('Removed from wishlist');
      } else {
        await courseService.addToWishlist(courseId);
        setWishlist([...wishlist, courseId]);
        message.success('Added to wishlist');
      }
    } catch (error) {
      message.error('Failed to update wishlist');
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setCurrentPage(1);
  };

  const handleLevelChange = (level: CourseLevel) => {
    setSelectedLevel(selectedLevel === level ? null : level);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedLevel(null);
    setPriceRange([0, 500]);
    setCurrentPage(1);
  };

  const getLevelDisplay = (level: CourseLevel) => {
    switch (level) {
      case 'BEGINNER':
        return 'Beginner';
      case 'INTERMEDIATE':
        return 'Intermediate';
      case 'ADVANCED':
        return 'Advanced';
      case 'ALL_LEVELS':
        return 'All Levels';
      default:
        return level;
    }
  };

  return (
    <>
      <Breadcrumb title="Course List" />
      <section className="course-content course-list-content">
        <div className="container">
          <div className="row align-items-baseline">
            {/* Sidebar Filters */}
            <div className="col-lg-3 theiaStickySidebar">
              <div className="filter-clear">
                <div className="clear-filter mb-4 pb-lg-2 d-flex align-items-center justify-content-between">
                  <h5>
                    <i className="feather-filter me-2" />
                    Filters
                  </h5>
                  <Link to="#" className="clear-text" onClick={clearFilters}>
                    Clear
                  </Link>
                </div>

                <div className="accordion accordion-customicon1 accordions-items-seperate">
                  {/* Categories */}
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseCategories"
                      >
                        Categories <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div id="collapseCategories" className="accordion-collapse collapse show">
                      <div className="accordion-body">
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <div key={category.id}>
                              <label className="custom_check">
                                <input
                                  type="checkbox"
                                  checked={selectedCategory === category.id}
                                  onChange={() => handleCategoryChange(category.id)}
                                />
                                <span className="checkmark" /> {category.name} ({category.coursesCount})
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">No categories available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapsePrice"
                      >
                        Price Range <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div id="collapsePrice" className="accordion-collapse collapse show">
                      <div className="accordion-body">
                        <div className="filter-range">
                          <Slider
                            range
                            tooltip={{ formatter }}
                            min={0}
                            max={500}
                            value={priceRange}
                            onChange={(value) => setPriceRange(value as [number, number])}
                          />
                          <div className="d-flex justify-content-between mt-2">
                            <span>${priceRange[0]}</span>
                            <span>${priceRange[1]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseLevel"
                      >
                        Level <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div id="collapseLevel" className="accordion-collapse collapse show">
                      <div className="accordion-body">
                        {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'] as CourseLevel[]).map(
                          (level) => (
                            <div key={level}>
                              <label className="custom_check custom_one">
                                <input
                                  type="checkbox"
                                  checked={selectedLevel === level}
                                  onChange={() => handleLevelChange(level)}
                                />
                                <span className="checkmark" /> {getLevelDisplay(level)}
                              </label>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course List */}
            <div className="col-lg-9">
              {/* Filter Bar */}
              <div className="showing-list mb-4">
                <div className="row align-items-center">
                  <div className="col-lg-4">
                    <div className="show-result text-center text-lg-start">
                      <h6 className="fw-medium">
                        Showing {courses.length > 0 ? (currentPage - 1) * 10 + 1 : 0}-
                        {Math.min(currentPage * 10, totalElements)} of {totalElements} results
                      </h6>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="show-filter add-course-info">
                      <div className="d-sm-flex justify-content-center justify-content-lg-end mb-1 mb-lg-0">
                        <div className="view-icons mb-2 mb-sm-0">
                          <Link to={route.courseGrid} className="grid-view">
                            <i className="feather-grid" />
                          </Link>
                          <Link to={route.courseList} className="list-view active">
                            <i className="isax isax-task" />
                          </Link>
                        </div>
                        <select
                          className="form-select"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="createdAt,desc">Newly Published</option>
                          <option value="enrolledCount,desc">Most Popular</option>
                          <option value="ratingAverage,desc">Top Rated</option>
                          <option value="price,asc">Price: Low to High</option>
                          <option value="price,desc">Price: High to Low</option>
                        </select>
                        <div className="search-group">
                          <i className="isax isax-search-normal-1" />
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Items */}
              {loading ? (
                <div className="text-center py-5">
                  <Spin size="large" />
                  <p className="mt-3">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <Empty
                  description="No courses found"
                  className="py-5"
                >
                  <Link to={route.courseList} className="btn btn-primary" onClick={clearFilters}>
                    Clear Filters
                  </Link>
                </Empty>
              ) : (
                <div className="row course-list-wrap">
                  {courses.map((course) => (
                    <div key={course.id} className="col-12">
                      <div className="courses-list-item">
                        <div className="d-md-flex align-items-center">
                          <div className="position-relative overflow-hidden rounded-3 card-image">
                            <Link to={`${route.courseDetails}/${course.slug}`}>
                              {course.thumbnailUrl ? (
                                <img
                                  className="img-fluid rounded-3"
                                  src={course.thumbnailUrl}
                                  alt={course.title}
                                  style={{ width: '280px', height: '180px', objectFit: 'cover' }}
                                />
                              ) : (
                                <ImageWithBasePath
                                  className="img-fluid rounded-3"
                                  src="./assets/img/course/course-01.jpg"
                                  alt={course.title}
                                />
                              )}
                            </Link>
                            <div className="position-absolute start-0 top-0 d-flex align-items-start w-100 z-index-2 p-2">
                              <Link
                                to="#"
                                className={`like ${wishlist.includes(course.id) || course.isWishlisted ? 'selected' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleWishlist(course.id);
                                }}
                              >
                                <i className="isax isax-heart" />
                              </Link>
                              {course.isEnrolled && (
                                <span className="badge bg-primary ms-1">
                                  <i className="fa-solid fa-check me-1" />
                                  Enrolled
                                </span>
                              )}
                              {course.requiresPurchase && (
                                <span className="badge bg-warning ms-auto">
                                  <i className="isax isax-crown me-1" />
                                  Premium
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="course-list-contents w-100 ps-0 ps-md-3 pt-4 pt-md-0">
                            <div className="d-flex flex-wrap align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm rounded-circle">
                                  {course.instructor?.avatarUrl ? (
                                    <img
                                      className="img-fluid rounded-circle"
                                      src={course.instructor.avatarUrl}
                                      alt={course.instructor.fullName}
                                    />
                                  ) : (
                                    <ImageWithBasePath
                                      className="img-fluid rounded-circle"
                                      src="./assets/img/avatar/avatar1.jpg"
                                      alt={course.instructor?.fullName || 'Instructor'}
                                    />
                                  )}
                                </div>
                                <p className="ms-2">
                                  <Link to={`${route.instructorDetails}/${course.instructor?.id}`}>
                                    {course.instructor?.fullName || 'Instructor'}
                                  </Link>
                                </p>
                              </div>
                              <span>
                                <Link className="tag-btn" to={`${route.courseCategory}/${course.category?.slug}`}>
                                  {course.category?.name || 'Course'}
                                </Link>
                              </span>
                            </div>
                            <h4 className="mt-3 mb-2">
                              <Link to={`${route.courseDetails}/${course.slug}`}>{course.title}</Link>
                            </h4>
                            <p className="text-muted mb-2" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {course.shortDescription}
                            </p>
                            <div className="d-flex align-items-center">
                              <p className="d-flex align-items-center mb-0">
                                <i className="fa-solid fa-star text-warning me-2" />
                                {course.ratingAverage?.toFixed(1) || '0.0'} ({course.ratingCount || 0} Reviews)
                              </p>
                              <span className="dot" />
                              <p>{getLevelDisplay(course.level)}</p>
                              <span className="dot" />
                              <p>{course.lessonsCount || 0} Lessons</p>
                            </div>
                            <div className="d-flex justify-content-between mt-3 align-items-center">
                              {course.isEnrolled ? (
                                <span className="badge bg-success-subtle text-success fs-12 fw-medium px-2 py-1">
                                  <i className="fa-solid fa-check-circle me-1" />
                                  Owned
                                </span>
                              ) : !course.requiresPurchase ? (
                                <h5 className="text-success">Free</h5>
                              ) : (
                                <h5 className="text-secondary">
                                  {course.originalPrice && course.originalPrice > (course.price || 0) ? (
                                    <>
                                      ${course.price}{' '}
                                      <del className="text-muted fs-14">${course.originalPrice}</del>
                                    </>
                                  ) : (
                                    `$${course.price || 0}`
                                  )}
                                </h5>
                              )}
                              {course.isEnrolled ? (
                                <Link
                                  to={`${route.courseWatch}/${course.slug}`}
                                  className="btn btn-primary btn-sm d-inline-flex align-items-center"
                                >
                                  Continue Learning
                                  <i className="fs-8 fas fa-angle-right ms-2" />
                                </Link>
                              ) : (
                                <Link
                                  to={`${route.courseDetails}/${course.slug}`}
                                  className="btn btn-dark btn-sm d-inline-flex align-items-center"
                                >
                                  Get Course
                                  <i className="fs-8 fas fa-angle-right ms-2" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="row align-items-center mt-4">
                  <div className="col-12 d-flex justify-content-center">
                    <Pagination
                      current={currentPage}
                      total={totalElements}
                      pageSize={10}
                      onChange={(page) => setCurrentPage(page)}
                      showSizeChanger={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CourseList;
