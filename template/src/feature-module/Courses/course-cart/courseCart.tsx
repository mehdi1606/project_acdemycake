import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../router/all_routes';
import { useAppSelector, useAppDispatch } from '../../../core/redux/hooks';
import { removeFromCart, clearCart } from '../../../core/redux/cartSlice';
import { App } from 'antd';
import { getFileUrl } from '../../../environment';

/* ── Design tokens ── */
const GOLD   = '#C5973E';
const GOLD_L = '#DEBB6B';
const BURG   = '#651C32';
const BURG_D = '#8B2335';
const IVORY  = '#F7F4EE';
const DARK   = '#1A1614';

const CourseCart = () => {
  const { t } = useTranslation();
  const route    = all_routes;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { items }           = useAppSelector((s) => s.cart);

  const subtotal   = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const savedTotal = items.reduce((s, i) => s + ((i.originalPrice ?? i.price) - i.price), 0);

  const handleRemove = (id: string, title: string) => {
    dispatch(removeFromCart(id));
    message.success(t('courseCart.removedFromCart', '"{{title}}" removed from cart', { title }));
  };

  const handleClear = () => {
    dispatch(clearCart());
    message.info(t('courseCart.cartCleared', 'Cart cleared'));
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      message.warning(t('courseCart.loginToCheckout', 'Please login to proceed to checkout'));
      return;
    }
    navigate(route.courseCheckout);
  };

  const getLevelDisplay = (level?: string) => {
    switch (level) {
      case 'BEGINNER':     return t('courseList.beginner', 'Beginner');
      case 'INTERMEDIATE': return t('courseList.intermediate', 'Intermediate');
      case 'ADVANCED':     return t('courseList.advanced', 'Advanced');
      case 'ALL_LEVELS':   return t('courseList.allLevels', 'All Levels');
      default:             return level || '';
    }
  };

  return (
    <div style={{ background: IVORY, minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, ${BURG} 60%, ${BURG_D} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 80,
        paddingBottom: 0,
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 260, height: 260, borderRadius: '50%',
          background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 40, left: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${BURG_D}44 0%, transparent 70%)`,
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Link to="/" style={{ color: `${GOLD_L}99`, fontSize: 13, textDecoration: 'none' }}>{t('sharedComponents.breadcrumb.home', 'Home')}</Link>
            <span style={{ color: `${GOLD_L}55`, fontSize: 13 }}>/</span>
            <Link to={route.courseGrid} style={{ color: `${GOLD_L}99`, fontSize: 13, textDecoration: 'none' }}>{t('nav.courses', 'Courses')}</Link>
            <span style={{ color: `${GOLD_L}55`, fontSize: 13 }}>/</span>
            <span style={{ color: GOLD_L, fontSize: 13, fontWeight: 600 }}>{t('courseCart.cart', 'Cart')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${GOLD}55`,
            }}>
              <i className="isax isax-shopping-cart" style={{ fontSize: 22, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#fff',
                fontSize: 32,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.5px',
              }}>
                {t('courseCart.yourCart', 'Your Cart')}
              </h1>
              <p style={{ color: `${GOLD_L}cc`, margin: 0, fontSize: 14 }}>
                {items.length === 0
                  ? t('courseCart.noCoursesSelected', 'No courses selected yet')
                  : t('courseCart.coursesReadyForCheckout', '{{count}} course(s) ready for checkout', { count: items.length })}
              </p>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 60, marginBottom: -1 }}>
          <path d="M0,0 C360,60 1080,0 1440,60 L1440,60 L0,60 Z" fill={IVORY} />
        </svg>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>

        {items.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD}18 0%, ${BURG}12 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              border: `2px dashed ${GOLD}44`,
            }}>
              <i className="isax isax-shopping-cart" style={{ fontSize: 40, color: `${GOLD}88` }} />
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: DARK, marginBottom: 12, fontSize: 26,
            }}>
              {t('courseCart.empty', 'Your cart is empty')}
            </h3>
            <p style={{ color: '#888', marginBottom: 32, maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.6 }}>
              {t('courseCart.emptyDesc', 'Discover our premium courses and invest in your future. Add courses to your cart to get started.')}
            </p>
            <Link
              to={route.courseGrid}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                color: '#fff', textDecoration: 'none',
                padding: '13px 32px', borderRadius: 50,
                fontWeight: 700, fontSize: 15,
                boxShadow: `0 4px 16px ${GOLD}44`,
              }}
            >
              <i className="isax isax-book-1" />
              {t('courseCart.browseCourses', 'Browse Courses')}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

            {/* ── Left: Items ── */}
            <div>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 24,
              }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: DARK, fontSize: 22, margin: 0, fontWeight: 700,
                }}>
                  {items.length} {items.length !== 1 ? t('courseCart.coursesInCartPlural', 'Courses') : t('courseCart.courseInCart', 'Course')} {t('courseCart.inCart', 'in Cart')}
                </h2>
                <button
                  onClick={handleClear}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: `1px solid #e0d0d4`,
                    color: BURG, borderRadius: 50,
                    padding: '7px 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${BURG}10`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <i className="isax isax-close-circle" />
                  {t('courseList.clearAll', 'Clear All')}
                </button>
              </div>

              {/* Course items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {items.map((item) => {
                  const thumb  = getFileUrl(item.thumbnailUrl) ?? item.thumbnailUrl;
                  const avatar = getFileUrl(item.instructorAvatar);
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                        border: '1px solid #f0ebe6',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'stretch',
                        transition: 'box-shadow .2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 28px rgba(0,0,0,0.1)`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'; }}
                    >
                      {/* Thumbnail */}
                      <Link
                        to={`${route.courseDetails}/${item.slug}`}
                        style={{ flexShrink: 0, display: 'block', width: 160 }}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%', minHeight: 120,
                            background: `linear-gradient(135deg, ${BURG}15 0%, ${GOLD}15 100%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <i className="isax isax-book-1" style={{ fontSize: 36, color: `${GOLD}88` }} />
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1, paddingRight: 16 }}>
                          {/* Instructor */}
                          {item.instructorName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={item.instructorName}
                                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 700, color: '#fff',
                                }}>
                                  {item.instructorName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {item.instructorId ? (
                                <Link
                                  to={`${route.instructorDetails}/${item.instructorId}`}
                                  style={{ color: GOLD, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                                >
                                  {item.instructorName}
                                </Link>
                              ) : (
                                <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>{item.instructorName}</span>
                              )}
                            </div>
                          )}

                          {/* Title */}
                          <Link
                            to={`${route.courseDetails}/${item.slug}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <h5 style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                              color: DARK, fontSize: 16, fontWeight: 700,
                              margin: '0 0 10px', lineHeight: 1.4,
                            }}>
                              {item.title}
                            </h5>
                          </Link>

                          {/* Meta */}
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            {item.rating !== undefined && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: `${GOLD}15`, color: GOLD,
                                borderRadius: 50, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                              }}>
                                <i className="fa-solid fa-star" style={{ fontSize: 10 }} />
                                {item.rating.toFixed(1)}
                                {item.ratingCount !== undefined && (
                                  <span style={{ color: '#999', fontWeight: 400 }}>({item.ratingCount})</span>
                                )}
                              </span>
                            )}
                            {item.level && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: `${BURG}10`, color: BURG,
                                borderRadius: 50, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                              }}>
                                {getLevelDisplay(item.level)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price + Remove */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}>
                              {item.price === 0 ? t('courseList.free', 'Free') : `${item.price.toFixed(2)} MAD`}
                            </div>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <del style={{ fontSize: 13, color: '#aaa' }}>{item.originalPrice.toFixed(2)} MAD</del>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemove(item.id, item.title)}
                            title={t('courseCart.remove', 'Remove')}
                            style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: `${BURG}10`, border: `1px solid ${BURG}25`,
                              color: BURG, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 15, transition: 'all .2s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = BURG; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${BURG}10`; (e.currentTarget as HTMLButtonElement).style.color = BURG; }}
                          >
                            <i className="isax isax-trash4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue shopping */}
              <div style={{ marginTop: 28 }}>
                <Link
                  to={route.courseGrid}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    color: BURG, textDecoration: 'none',
                    fontWeight: 600, fontSize: 14,
                    padding: '10px 20px',
                    border: `1px solid ${BURG}30`,
                    borderRadius: 50,
                    background: '#fff',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${BURG}08`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; }}
                >
                  <i className="isax isax-arrow-left-2" />
                  {t('courseCart.continueShopping', 'Continue Shopping')}
                </Link>
              </div>
            </div>

            {/* ── Right: Summary ── */}
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{
                background: '#fff',
                borderRadius: 20,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: '1px solid #f0ebe6',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${DARK} 0%, ${BURG} 100%)`,
                  padding: '22px 28px',
                }}>
                  <h3 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#fff', margin: 0, fontSize: 20, fontWeight: 700,
                  }}>{t('courseCart.orderSummary', 'Order Summary')}</h3>
                </div>

                <div style={{ padding: '24px 28px' }}>
                  {/* Items breakdown */}
                  <div style={{ marginBottom: 20 }}>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start', gap: 8,
                          padding: '10px 0',
                          borderBottom: '1px dashed #f0ebe6',
                        }}
                      >
                        <span style={{
                          color: '#555', fontSize: 13, lineHeight: 1.4,
                          flex: 1, paddingRight: 8,
                        }}>
                          {item.title.length > 40 ? item.title.slice(0, 40) + '…' : item.title}
                        </span>
                        <span style={{ color: DARK, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                          {item.price === 0 ? t('courseList.free', 'Free') : `${item.price.toFixed(2)} MAD`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 10,
                  }}>
                    <span style={{ color: '#666', fontSize: 14 }}>{t('courseCart.subtotal', 'Subtotal')}</span>
                    <span style={{ color: DARK, fontWeight: 700, fontSize: 14 }}>
                      {subtotal === 0 ? t('courseList.free', 'Free') : `${subtotal.toFixed(2)} MAD`}
                    </span>
                  </div>

                  {savedTotal > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 10,
                    }}>
                      <span style={{ color: '#4caf50', fontSize: 13 }}>{t('courseCart.youSave', 'You save')}</span>
                      <span style={{ color: '#4caf50', fontWeight: 700, fontSize: 13 }}>
                        -{savedTotal.toFixed(2)} MAD
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: 1, background: '#f0ebe6', margin: '16px 0' }} />

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <span style={{ fontWeight: 700, color: DARK, fontSize: 16 }}>{t('courseCart.total', 'Total')}</span>
                    <span style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontWeight: 800, color: GOLD, fontSize: 22,
                    }}>
                      {subtotal === 0 ? t('courseList.free', 'Free') : `${subtotal.toFixed(2)} MAD`}
                    </span>
                  </div>

                  {/* Guarantee */}
                  <div style={{
                    background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                    borderRadius: 10, padding: '12px 16px',
                    marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <i className="isax isax-shield-tick" style={{ color: GOLD, fontSize: 20, flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                      <strong style={{ color: DARK }}>{t('courseCart.moneyBackGuarantee', '30-day money-back guarantee.')}</strong>{' '}
                      {t('courseCart.learnWithConfidence', 'Learn with complete confidence.')}
                    </p>
                  </div>

                  {/* Checkout button */}
                  <button
                    onClick={handleCheckout}
                    style={{
                      width: '100%', padding: '15px',
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                      color: '#fff', border: 'none',
                      borderRadius: 50, cursor: 'pointer',
                      fontSize: 16, fontWeight: 700,
                      boxShadow: `0 6px 20px ${GOLD}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'all .2s',
                      letterSpacing: 0.5,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px ${GOLD}66`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px ${GOLD}55`; }}
                  >
                    <i className="isax isax-lock" />
                    {t('courseCart.proceedToCheckout', 'Proceed to Checkout')}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCart;
