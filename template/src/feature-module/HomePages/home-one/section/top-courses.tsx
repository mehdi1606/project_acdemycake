import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { all_routes } from '../../../router/all_routes';
import { courseService } from '../../../../services/api/course.service';
import { CourseCategory } from '../../../../services/api/types';
import { getFileUrl } from '../../../../environment';
import { Spin } from 'antd';

const Topcourses = () => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await courseService.getCategories();
        // Handle different response formats
        if (Array.isArray(response)) {
          setCategories(response);
        } else if (response && typeof response === 'object') {
          const data = (response as any).content || (response as any).data || [];
          setCategories(Array.isArray(data) ? data : []);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const topcourseslider = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const route = all_routes;

  const getCategoryIcon = (category: CourseCategory) => {
    const resolvedUrl = getFileUrl(category.imageUrl);
    if (resolvedUrl) return resolvedUrl;
    // Default category icons
    const defaultIcons = [
      'assets/img/category/icons/icon-6.svg',
      'assets/img/category/icons/icon-7.svg',
      'assets/img/category/icons/icon-8.svg',
      'assets/img/category/icons/icon-9.svg',
      'assets/img/category/icons/icon-10.svg',
      'assets/img/category/icons/icon-11.svg',
    ];
    // Use hash of category id string for consistent icon selection
    const hash = category.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return defaultIcons[hash % defaultIcons.length];
  };

  if (loading) {
    return (
      <section className="top-courses-sec">
        <ImageWithBasePath className="top-courses-bg" src="./assets/img/bg/bg-20.png" alt="img" />
        <div className="container text-center py-5">
          <Spin size="large" />
          <p className="mt-3">Loading categories...</p>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="top-courses-sec">
        <ImageWithBasePath className="top-courses-bg" src="./assets/img/bg/bg-20.png" alt="img" />
        <div className="container">
          <div className="section-header text-center">
            <span className="fw-medium text-secondary text-decoration-underline mb-2 d-inline-block">
              Our Categories
            </span>
            <h2>Top Courses &amp; Categories</h2>
            <p>Categories will be available soon!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="top-courses-sec">
        <ImageWithBasePath className="top-courses-bg" src="./assets/img/bg/bg-20.png" alt="img" />
        <div className="container">
          <div className="section-header text-center">
            <span className="fw-medium text-secondary text-decoration-underline mb-2 d-inline-block">
              Our Categories
            </span>
            <h2>Top Courses &amp; Categories</h2>
            <p>
              The right course, guided by an expert mentor, can provide invaluable
              insights, practical skills
            </p>
          </div>
          <Slider {...topcourseslider} className="top-courses-slider lazy">
            {categories.map((category) => (
              <div key={category.id}>
                <div className="categories-item categories-item-three mb-0">
                  <img
                    className="mx-auto"
                    src={getCategoryIcon(category)}
                    alt={category.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'assets/img/category/icons/icon-6.svg';
                    }}
                    style={{ width: '60px', height: '60px' }}
                  />
                  <h6 className="title">
                    <Link to={`${route.courseCategory}/${category.slug}`}>{category.name}</Link>
                  </h6>
                  {category.coursesCount > 0 && (
                    <span className="badge badge-soft-primary mt-2">{category.coursesCount} courses</span>
                  )}
                </div>
              </div>
            ))}
          </Slider>
          <Link to={route.courseCategory} className="btn btn-primary btn-md">
            View All Categories
          </Link>
        </div>
      </section>
    </>
  );
};

export default Topcourses;
