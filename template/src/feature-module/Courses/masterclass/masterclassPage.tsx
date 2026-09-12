import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { App } from 'antd';
import { courseService } from '../../../services/api/course.service';
import { CourseCategory, Course } from '../../../services/api/types';
import { useAppDispatch, useAppSelector } from '../../../core/redux/hooks';
import { addToCart } from '../../../core/redux/cartSlice';
import { all_routes } from '../../router/all_routes';
import CourseCard from '../../../components/CourseCard';
import { getLocalizedCategory } from '../../../hooks/useLocalizedCategory';

const PAGE_SIZE = 9;

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <div className="sl-cl-skeleton" style={{ animationDelay: `${index * 0.07}s`, flexDirection: 'column', minHeight: 360 }}>
    <div className="sl-cl-skeleton__thumb" style={{ height: 200, width: '100%' }} />
    <div className="sl-cl-skeleton__body">
      <div className="sl-cl-skeleton__line" style={{ width: '50%', height: 12, marginBottom: 12 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '90%', height: 18, marginBottom: 6 }} />
      <div className="sl-cl-skeleton__line" style={{ width: '70%', height: 14, marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="sl-cl-skeleton__line" style={{ width: 70, height: 22 }} />
        <div className="sl-cl-skeleton__line" style={{ width: 90, height: 34, borderRadius: 20 }} />
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const MasterclassPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const route    = all_routes;
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { items: cartItems } = useAppSelector(s => s.cart);
  const { isAuthenticated: _isAuthenticated } = useAppSelector(s => s.auth);

  const [categories,    setCategories]    = useState<CourseCategory[]>([]);
  const [activeTab,     setActiveTab]     = useState<string>('all');
  const [courses,       setCourses]       = useState<Course[]>([]);
  const [catLoading,    setCatLoading]    = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage,   setCurrentPage]   = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);
  const [searchQuery,   setSearchQuery]   = useState('');

  useEffect(() => {
    AOS.init({ once: true, easing: 'ease-out-cubic', duration: 800, offset: 40 });
  }, []);

  // Load categories
  useEffect(() => {
    courseService.getCategories()
      .then(cats => setCategories(cats ?? []))
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  const fetchCourses = useCallback(async (categoryId: string, page: number, search?: string) => {
    try {
      setCourseLoading(true);
      const params: any = {
        page,
        size: PAGE_SIZE,
        sortBy: 'newest',
        courseType: 'MASTERCLASS',
      };
      if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
      if (search && search.trim()) params.search = search.trim();

      const result = await courseService.getCourses(params);
      setCourses(result.content ?? []);
      setTotalElements(result.totalElements ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch {
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  }, []);

  // Re-fetch when tab, page or language changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCurrentPage(0);
    fetchCourses(activeTab, 0, searchQuery);
  }, [activeTab]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCourses(activeTab, currentPage, searchQuery);
  }, [currentPage]);

  // Search debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(0);
      fetchCourses(activeTab, 0, searchQuery);
    }, 450);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleCart = (course: Course) => {
    if (cartItems.some(i => i.id === course.id)) { message.info(t('masterclass.alreadyInCart')); return; }
    dispatch(addToCart({
      id: course.id, slug: course.slug, title: course.title,
      thumbnailUrl: course.thumbnailUrl, price: course.price ?? 0,
      originalPrice: course.originalPrice,
      instructorName: course.instructor?.fullName,
      instructorId: course.instructor?.id,
    }));
    message.success(t('masterclass.addedToCart'));
  };

  // Pagination numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - (currentPage + 1)) <= 1)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
      acc.push(p); return acc;
    }, []);

  return (
    <>
      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #2C1106 0%, #4E1420 40%, #3A1A10 100%)',
        position: 'relative', overflow: 'hidden',
        padding: '80px 0 60px',
      }}>
        {/* Toile pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C5912C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Floating particles */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="sl-particle" style={{ left: `${12 + i * 15}%`, bottom: '20%', animationDelay: `${i * 0.8}s` }} />
          ))}
        </div>

        {/* Gold accent lines */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent 0%, #C5912C 30%, #DEBB6B 50%, #C5912C 70%, transparent 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
            {/* Script ornament */}
            <div data-aos="fade-up" data-aos-duration="600" style={{ marginBottom: '0.5rem' }}>
              <span style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic', fontSize: '1.8rem',
                color: '#C5912C', opacity: 0.85,
              }}>
                {t('masterclass.script')}
              </span>
            </div>

            {/* Crown icon */}
            <div data-aos="fade-up" data-aos-delay="60" style={{ marginBottom: '0.8rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(197,145,44,0.15) 0%, rgba(197,145,44,0.05) 100%)',
                border: '1px solid rgba(197,145,44,0.3)',
              }}>
                <i className="isax isax-crown" style={{ fontSize: 26, color: '#C5912C' }} />
              </span>
            </div>

            <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="700" style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700,
              color: '#fff', marginBottom: '0.8rem', lineHeight: 1.2,
            }}>
              {t('masterclass.title')}
            </h1>

            <p data-aos="fade-up" data-aos-delay="180" data-aos-duration="700" style={{
              fontSize: '1rem', color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7, marginBottom: '1.8rem',
            }}>
              {t('masterclass.heroSubtitle')}
            </p>

            {/* Search bar */}
            <form
              data-aos="fade-up" data-aos-delay="260" data-aos-duration="700"
              onSubmit={e => e.preventDefault()}
              style={{
                display: 'flex', alignItems: 'center', maxWidth: 520, margin: '0 auto 1.5rem',
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(197,145,44,0.25)', borderRadius: 40,
                padding: '6px 6px 6px 20px',
              }}
            >
              <i className="isax isax-search-normal-1" style={{ color: 'rgba(255,255,255,0.4)', marginRight: 10, fontSize: 16 }} />
              <input
                type="text"
                placeholder={t('masterclass.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.9rem',
                }}
              />
              <button type="submit" style={{
                background: 'linear-gradient(135deg, #C5912C 0%, #DEBB6B 100%)',
                border: 'none', borderRadius: 30, padding: '8px 20px',
                color: '#4E1420', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
              }}>
                {t('masterclass.search')}
              </button>
            </form>

            {/* Breadcrumb */}
            <nav data-aos="fade-up" data-aos-delay="320" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
            }}>
              <Link to={route.homeone} style={{ color: 'rgba(197,145,44,0.7)', textDecoration: 'none' }}>{t('nav.home')}</Link>
              <span style={{ fontSize: '0.5rem' }}>✦</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{t('masterclass.title')}</span>
            </nav>
          </div>
        </div>

        {/* Bottom divider */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(197,145,44,0.3) 50%, transparent 100%)',
        }} />
      </div>

      {/* ── Main Content ── */}
      <section style={{ padding: '3rem 0 5rem', background: '#fdfaf7' }}>
        <div className="container">

          {/* ── Category Filter Tabs ── */}
          {catLoading ? (
            <div className="d-flex gap-2 mb-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="sl-cl-skeleton__line" style={{ width: 100, height: 40, borderRadius: 30 }} />
              ))}
            </div>
          ) : (
            <div
              data-aos="fade-up" data-aos-duration="600"
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '2.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(197,145,44,0.12)',
              }}
            >
              {/* "All" tab */}
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '8px 22px',
                  fontSize: '0.72rem', fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  border: activeTab === 'all'
                    ? '1.5px solid #C5912C'
                    : '1.5px solid rgba(197,145,44,0.2)',
                  background: activeTab === 'all'
                    ? 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)'
                    : 'transparent',
                  color: activeTab === 'all' ? '#C5912C' : 'rgba(78,20,32,0.55)',
                  borderRadius: 30, cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <i className="isax isax-crown" style={{ fontSize: 13 }} />
                {t('masterclass.allMasterclasses')}
                {totalElements > 0 && (
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 700,
                    background: activeTab === 'all' ? 'rgba(197,145,44,0.2)' : 'rgba(197,145,44,0.08)',
                    color: '#C5912C', padding: '1px 6px', borderRadius: 20,
                  }}>
                    {totalElements}
                  </span>
                )}
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  style={{
                    padding: '8px 22px',
                    fontSize: '0.72rem', fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    border: activeTab === cat.id
                      ? '1.5px solid #C5912C'
                      : '1.5px solid rgba(197,145,44,0.2)',
                    background: activeTab === cat.id
                      ? 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)'
                      : 'transparent',
                    color: activeTab === cat.id ? '#C5912C' : 'rgba(78,20,32,0.55)',
                    borderRadius: 30, cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {getLocalizedCategory(cat, i18n.language).name}
                </button>
              ))}
            </div>
          )}

          {/* ── Toolbar ── */}
          {!courseLoading && courses.length > 0 && (
            <div className="sl-cl-toolbar" style={{ marginBottom: '1.75rem' }} data-aos="fade-down">
              <p className="sl-cl-toolbar__results">
                {t('masterclass.showing')} <strong>{totalElements}</strong> {totalElements !== 1 ? t('courseCategory.masterclasses') : t('courseCategory.masterclass')}
                {activeTab !== 'all' && (() => {
                  const activeCat = categories.find(c => c.id === activeTab);
                  return activeCat ? <> {t('masterclass.in')} <strong>{getLocalizedCategory(activeCat, i18n.language).name}</strong></> : null;
                })()}
                {searchQuery && <> {t('masterclass.matching')} "<strong>{searchQuery}</strong>"</>}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none', border: '1px solid rgba(197,145,44,0.3)',
                    borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                    fontSize: '0.7rem', color: '#9A6F1A',
                  }}
                >
                  <i className="isax isax-close-circle" style={{ marginRight: 4 }} />
                  {t('masterclass.clearSearch')}
                </button>
              )}
            </div>
          )}

          {/* ── Course Grid ── */}
          {courseLoading ? (
            <div className="row g-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="col-xl-4 col-md-6"><SkeletonCard index={i} /></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="sl-cl-empty" data-aos="fade-up">
              <div className="sl-ornament">
                <span className="sl-script" style={{ fontSize: '2rem' }}>
                  {searchQuery ? t('masterclass.noResults') : t('masterclass.comingSoon')}
                </span>
              </div>
              <i className="isax isax-crown sl-cl-empty__icon" style={{ color: '#C5912C' }} />
              <h4 className="sl-cl-empty__title">
                {searchQuery
                  ? t('courseCategory.noMasterclassesYet')
                  : t('courseCategory.noMasterclassesYet')}
              </h4>
              <p className="sl-cl-empty__text">
                {searchQuery
                  ? t('courseCategory.crafting')
                  : t('courseCategory.crafting')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                className="sl-btn-gold sl-btn-magnetic"
              >
                {t('masterclass.allMasterclasses')} <i className="isax isax-arrow-right-1" />
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {courses.map((course, i) => (
                <div key={course.id} className="col-xl-4 col-md-6" style={{ display: 'flex' }}>
                  <CourseCard
                    course={course}
                    inCart={cartItems.some(item => item.id === course.id)}
                    onCart={handleCart}
                    index={i}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="sl-cl-pagination" data-aos="fade-up" data-aos-duration="600">
              <button
                className="sl-cl-pagination__arrow"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              {pageNumbers.map((p, i) =>
                p === '…' ? (
                  <span key={`el-${i}`} className="sl-cl-pagination__ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`sl-cl-pagination__page${currentPage + 1 === p ? ' is-active' : ''}`}
                    onClick={() => setCurrentPage((p as number) - 1)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="sl-cl-pagination__arrow"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                aria-label="Next"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}

          {/* ── Bottom CTA strip ── */}
          {!courseLoading && courses.length > 0 && (
            <div
              data-aos="fade-up" data-aos-duration="700"
              style={{
                marginTop: '4rem', padding: '2.5rem 2rem', borderRadius: 20, textAlign: 'center',
                background: 'linear-gradient(135deg, #4E1420 0%, #6B1D2A 100%)',
                border: '1px solid rgba(197,145,44,0.2)',
              }}
            >
              <i className="isax isax-book-1" style={{ fontSize: 36, color: 'rgba(197,145,44,0.6)', marginBottom: 12, display: 'block' }} />
              <h4 style={{ fontFamily: '"Playfair Display", serif', color: '#fff', marginBottom: 8 }}>
                {t('masterclass.ctaTitle')}
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {t('masterclass.ctaDesc')}
              </p>
              <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
                {t('masterclass.ctaBtn')} <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
          )}

        </div>
      </section>
    </>
  );
};

export default MasterclassPage;
