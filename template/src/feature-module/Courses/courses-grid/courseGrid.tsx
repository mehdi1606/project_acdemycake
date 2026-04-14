import React, { useEffect, useState, useCallback } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import type { SliderSingleProps } from 'antd';
import { Slider, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { fetchCourses, fetchCategories, fetchWishlist } from '../../../core/redux/courseSlice';
import CourseCard from '../../../components/CourseCard';
import { CourseLevel, CourseQueryParams } from '../../../services/api/types';

const CourseGrid = () => {
  const dispatch = useAppDispatch();
  const { courses, categories, totalElements, totalPages, currentPage, isLoading } = useAppSelector(
    (state) => state.courses
  );

  const [filters, setFilters] = useState<CourseQueryParams>({
    page: 0,
    size: 9,
    search: '',
    categoryId: undefined,
    level: undefined,
    isPremium: undefined,
    isFree: undefined,
    minRating: undefined,
  });

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<CourseLevel[]>([]);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);

  // Fetch wishlist once so hearts show correctly
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  // (auth selector also used by CourseCard internally)
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated]);

  // Fetch courses on mount and when filters change
  useEffect(() => {
    const queryParams: CourseQueryParams = {
      ...filters,
      sortBy,                                                       // ← correct param name
      categoryId: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
      level: selectedLevels.length === 1 ? selectedLevels[0] : undefined,
      isFree: priceFilter === 'free' ? true : priceFilter === 'paid' ? false : undefined,
      minRating: selectedRating,
    };
    dispatch(fetchCourses(queryParams));
  }, [dispatch, filters, sortBy, selectedCategories, selectedLevels, priceFilter, selectedRating]);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 0 }));
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    setFilters((prev) => ({ ...prev, page: 0 }));
  };

  const handleLevelToggle = (level: CourseLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
    );
    setFilters((prev) => ({ ...prev, page: 0 }));
  };

  const handlePriceFilterChange = (value: 'all' | 'free' | 'paid') => {
    setPriceFilter(value);
    setFilters((prev) => ({ ...prev, page: 0 }));
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating((prev) => (prev === rating ? undefined : rating));
    setFilters((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setPriceFilter('all');
    setSelectedRating(undefined);
    setPriceRange([0, 500]);
    setSearchTerm('');
    setSortBy('newest');
    setFilters({
      page: 0,
      size: 9,
      search: '',
      categoryId: undefined,
      level: undefined,
      isPremium: undefined,
      isFree: undefined,
      minRating: undefined,
    });
  };

  const formatter: NonNullable<SliderSingleProps['tooltip']>['formatter'] = (value) =>
    `$${value}`;

  const startIndex = currentPage * filters.size! + 1;
  const endIndex = Math.min((currentPage + 1) * filters.size!, totalElements);

  const levels: { value: CourseLevel; label: string }[] = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'ALL_LEVELS', label: 'All Levels' },
  ];

  return (
    <>
      <Breadcrumb title="Course Grid" />

      {/* Course */}
      <section className="course-content">
        <div className="container">
          <div className="row align-items-baseline">
            <div className="col-lg-3 theiaStickySidebar">
              <div className="filter-clear">
                <div className="clear-filter mb-4 pb-lg-2 d-flex align-items-center justify-content-between">
                  <h5>
                    <i className="feather-filter me-2" />
                    Filters
                  </h5>
                  <Link to="#" className="clear-text" onClick={handleClearFilters}>
                    Clear
                  </Link>
                </div>
                <div className="accordion accordion-customicon1 accordions-items-seperate">
                  {/* Categories Filter */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="headingcustomicon1One">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapsecustomicon1One"
                        aria-expanded="true"
                        aria-controls="collapsecustomicon1One"
                      >
                        Categories <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div
                      id="collapsecustomicon1One"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingcustomicon1One"
                    >
                      <div className="accordion-body">
                        {categories.length === 0 ? (
                          <p className="text-muted">No categories available</p>
                        ) : (
                          categories.map((category) => (
                            <div key={category.id}>
                              <label className="custom_check">
                                <input
                                  type="checkbox"
                                  name="select_category"
                                  checked={selectedCategories.includes(category.id)}
                                  onChange={() => handleCategoryToggle(category.id)}
                                />
                                <span className="checkmark" /> {category.name} ({category.coursesCount})
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="headingcustomicon1Three">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapsecustomicon1Three"
                        aria-expanded="true"
                        aria-controls="collapsecustomicon1Three"
                      >
                        Price
                        <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div
                      id="collapsecustomicon1Three"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingcustomicon1Three"
                    >
                      <div className="accordion-body">
                        <div>
                          <label className="custom_check custom_one">
                            <input
                              type="checkbox"
                              name="select_price"
                              checked={priceFilter === 'all'}
                              onChange={() => handlePriceFilterChange('all')}
                            />
                            <span className="checkmark" /> All
                          </label>
                        </div>
                        <div>
                          <label className="custom_check custom_one">
                            <input
                              type="checkbox"
                              name="select_price"
                              checked={priceFilter === 'free'}
                              onChange={() => handlePriceFilterChange('free')}
                            />
                            <span className="checkmark" /> Free
                          </label>
                        </div>
                        <div>
                          <label className="custom_check custom_one mb-0">
                            <input
                              type="checkbox"
                              name="select_price"
                              checked={priceFilter === 'paid'}
                              onChange={() => handlePriceFilterChange('paid')}
                            />
                            <span className="checkmark" /> Paid
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="headingcustomicon1Four">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapsecustomicon1Four"
                        aria-expanded="true"
                        aria-controls="collapsecustomicon1Four"
                      >
                        Price Range
                        <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div
                      id="collapsecustomicon1Four"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingcustomicon1Four"
                    >
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

                  {/* Level Filter */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="headingcustomicon1Five">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapsecustomicon1Five"
                        aria-expanded="true"
                        aria-controls="collapsecustomicon1Five"
                      >
                        Level
                        <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div
                      id="collapsecustomicon1Five"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingcustomicon1Five"
                    >
                      <div className="accordion-body">
                        {levels.map((level) => (
                          <div key={level.value}>
                            <label className="custom_check custom_one">
                              <input
                                type="checkbox"
                                name="select_level"
                                checked={selectedLevels.includes(level.value)}
                                onChange={() => handleLevelToggle(level.value)}
                              />
                              <span className="checkmark" />
                              {level.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="headingcustomicon1Six">
                      <Link
                        to="#"
                        className="accordion-button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapsecustomicon1Six"
                        aria-expanded="true"
                        aria-controls="collapsecustomicon1Six"
                      >
                        Reviews <i className="fa-solid fa-chevron-down" />
                      </Link>
                    </h2>
                    <div
                      id="collapsecustomicon1Six"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingcustomicon1Six"
                    >
                      <div className="accordion-body">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating}>
                            <label className="custom_check custom_one">
                              <input
                                type="checkbox"
                                name="select_rating"
                                checked={selectedRating === rating}
                                onChange={() => handleRatingChange(rating)}
                              />
                              <span className="checkmark" />
                              {Array.from({ length: 5 }, (_, i) => (
                                <i
                                  key={i}
                                  className={`fa-solid fa-star ${
                                    i < rating ? 'text-warning' : 'text-light'
                                  } me-1`}
                                />
                              ))}
                              <span className="ms-1">& Up</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-9">
              {/* Filter Header */}
              <div className="showing-list mb-4">
                <div className="row align-items-center">
                  <div className="col-lg-4">
                    <div className="show-result text-center text-lg-start">
                      <h6 className="fw-medium">
                        {totalElements === 0
                          ? 'No courses found'
                          : `Showing ${startIndex}-${endIndex} of ${totalElements} results`}
                      </h6>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="show-filter add-course-info">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSearch();
                        }}
                      >
                        <div className="d-sm-flex justify-content-center justify-content-lg-end mb-1 mb-lg-0">
                          <div className="view-icons mb-2 mb-sm-0">
                            <Link to={all_routes.courseGrid} className="grid-view active">
                              <i className="isax isax-element-3" />
                            </Link>
                            <Link to={all_routes.courseList} className="list-view">
                              <i className="isax isax-task" />
                            </Link>
                          </div>
                          <select
                            className="form-select"
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setFilters((p) => ({ ...p, page: 0 })); }}
                          >
                            <option value="newest">Newly Published</option>
                            <option value="popular">Trending Courses</option>
                            <option value="rating">Top Rated</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                          </select>
                          <div className="search-group">
                            <i className="isax isax-search-normal-1" />
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Filter Header */}

              {/* Course Grid */}
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spin size="large" />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-5">
                  <i className="isax isax-book fs-1 text-muted mb-3 d-block" />
                  <h5>No courses found</h5>
                  <p className="text-muted">
                    Try adjusting your filters or search term
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="row">
                  {courses.map((course) => (
                    <div key={course.id} className="col-xl-4 col-md-6">
                      <CourseCard course={course} layout="grid" />
                    </div>
                  ))}
                </div>
              )}
              {/* /Course Grid */}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="row align-items-center mt-4">
                  <div className="col-md-2">
                    <p className="pagination-text">
                      Page {currentPage + 1} of {totalPages}
                    </p>
                  </div>
                  <div className="col-md-10">
                    <ul className="pagination lms-page justify-content-center justify-content-md-end mt-2 mt-md-0">
                      <li className={`page-item prev ${currentPage === 0 ? 'disabled' : ''}`}>
                        <Link
                          className="page-link"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 0) handlePageChange(currentPage - 1);
                          }}
                        >
                          <i className="fas fa-angle-left" />
                        </Link>
                      </li>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (currentPage < 3) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <li
                            key={pageNum}
                            className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                          >
                            <Link
                              className="page-link"
                              to="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pageNum);
                              }}
                            >
                              {pageNum + 1}
                            </Link>
                          </li>
                        );
                      })}
                      <li
                        className={`page-item next ${
                          currentPage === totalPages - 1 ? 'disabled' : ''
                        }`}
                      >
                        <Link
                          className="page-link"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages - 1) handlePageChange(currentPage + 1);
                          }}
                        >
                          <i className="fas fa-angle-right" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              {/* /Pagination */}
            </div>
          </div>
        </div>
      </section>
      {/* /Course */}
    </>
  );
};

export default CourseGrid;
