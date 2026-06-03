/**
 * SARALÖWE Academy — Secure Course Checkout
 *
 * Replaced the fake payment simulation with real CMI Chaabi gateway.
 *
 * Flow:
 *  1. Show order summary (items in Redux cart)
 *  2. On "Proceed to Payment" — call paymentService.initiateCmiCourse(firstItem.id)
 *  3. Store remaining cart items in sessionStorage as sl_checkout_queue
 *  4. Auto-submit hidden form → browser navigates to CMI hosted payment page
 *  5. CMI redirects back to /payment/callback → paymentCallback.tsx polls DB
 *  6. On success, callback page checks sl_checkout_queue and re-routes here if needed
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../router/all_routes';
import { useAppSelector, useAppDispatch } from '../../../core/redux/hooks';
import { removeFromCart } from '../../../core/redux/cartSlice';
import { App } from 'antd';
import { getFileUrl } from '../../../environment';
import PaymentBadges from '../../common/PaymentBadges';
import { paymentService } from '../../../services/api/payment.service';

/* ── Design tokens ── */
const GOLD   = '#C5973E';
const GOLD_L = '#DEBB6B';
const BURG   = '#651C32';
const BURG_D = '#8B2335';
const IVORY  = '#F7F4EE';
const DARK   = '#1A1614';

const CourseCheckout = () => {
  const { t } = useTranslation();
  const route    = all_routes;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { items } = useAppSelector((s) => s.cart);

  const subtotal   = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const savedTotal = items.reduce((s, i) => s + ((i.originalPrice ?? i.price) - i.price), 0);
  const tax        = parseFloat((subtotal * 0.2).toFixed(2));
  const total      = parseFloat((subtotal + tax).toFixed(2));

  const [processing, setProcessing] = useState(false);

  /* ── CMI checkout handler ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      message.warning(t('courseCheckout.loginToPurchase', 'Please login to complete your purchase'));
      navigate(route.login);
      return;
    }
    if (items.length === 0) {
      message.error(t('courseCart.empty', 'Your cart is empty'));
      return;
    }

    setProcessing(true);
    try {
      // Take the first course in the cart; store the rest in a queue
      const [firstItem, ...remainingItems] = items;

      const cmiResp = await paymentService.initiateCmiCourse(firstItem.id);
      sessionStorage.setItem('sl_pending_txn_id', cmiResp.transactionId);
      sessionStorage.setItem('sl_pending_plan_id', 'course');
      sessionStorage.setItem('sl_pending_course_id', firstItem.id);

      if (remainingItems.length > 0) {
        sessionStorage.setItem('sl_checkout_queue', JSON.stringify(remainingItems));
      } else {
        sessionStorage.removeItem('sl_checkout_queue');
      }

      // Browser navigates away to CMI payment page — no further React work
      paymentService.submitCmiForm(cmiResp.gatewayUrl, cmiResp.formParams);
    } catch (err: unknown) {
      setProcessing(false);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(
        axiosErr.response?.data?.message ||
        t('courseCheckout.paymentFailed', 'Payment initiation failed. Please try again.')
      );
    }
  };

  return (
    <div style={{ background: IVORY, minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, ${BURG} 60%, ${BURG_D} 100%)`,
        position: 'relative', overflow: 'hidden',
        paddingTop: 80, paddingBottom: 0,
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50,
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Link to="/" style={{ color: `${GOLD_L}99`, fontSize: 13, textDecoration: 'none' }}>{t('sharedComponents.breadcrumb.home', 'Home')}</Link>
            <span style={{ color: `${GOLD_L}55`, fontSize: 13 }}>/</span>
            <Link to={route.courseCart} style={{ color: `${GOLD_L}99`, fontSize: 13, textDecoration: 'none' }}>{t('courseCart.cart', 'Cart')}</Link>
            <span style={{ color: `${GOLD_L}55`, fontSize: 13 }}>/</span>
            <span style={{ color: GOLD_L, fontSize: 13, fontWeight: 600 }}>{t('courseCheckout.checkout', 'Checkout')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${GOLD}55`,
            }}>
              <i className="isax isax-lock" style={{ fontSize: 22, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#fff', fontSize: 32, fontWeight: 700,
                margin: 0, letterSpacing: '-0.5px',
              }}>
                {t('courseCheckout.secureCheckout', 'Secure Checkout')}
              </h1>
              <p style={{ color: `${GOLD_L}cc`, margin: 0, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="isax isax-shield-tick" style={{ fontSize: 14 }} />
                {t('courseCheckout.sslEncrypted', 'SSL Encrypted — Your payment is 100% secure')}
              </p>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 60, marginBottom: -1 }}>
          <path d="M0,0 C360,60 1080,0 1440,60 L1440,60 L0,60 Z" fill={IVORY} />
        </svg>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>

        {items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `${GOLD}15`, border: `2px dashed ${GOLD}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <i className="isax isax-shopping-cart" style={{ fontSize: 36, color: `${GOLD}88` }} />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: DARK, marginBottom: 12 }}>
              {t('courseCheckout.nothingToCheckout', 'Nothing to checkout')}
            </h3>
            <p style={{ color: '#888', marginBottom: 28 }}>{t('courseCheckout.cartEmptyAdd', 'Your cart is empty. Add some courses first.')}</p>
            <Link
              to={route.courseGrid}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                color: '#fff', textDecoration: 'none',
                padding: '13px 32px', borderRadius: 50,
                fontWeight: 700, fontSize: 15,
              }}
            >
              {t('courseCart.browseCourses', 'Browse Courses')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

              {/* ── Left Column: Order details + CMI notice ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Course list */}
                <div style={{
                  background: '#fff', borderRadius: 20,
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  border: '1px solid #f0ebe6', overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '20px 28px', borderBottom: '1px solid #f0ebe6',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>1</div>
                    <div>
                      <h4 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", color: DARK, fontSize: 18 }}>
                        {t('courseCheckout.yourCourses', 'Your Courses')}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                        {items.length} {items.length !== 1
                          ? t('courseCart.coursesInCartPlural', 'courses selected')
                          : t('courseCart.courseInCart', 'course selected')}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {items.map((item) => {
                      const thumb = getFileUrl(item.thumbnailUrl) ?? item.thumbnailUrl;
                      return (
                        <div key={item.id} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 0',
                          borderBottom: '1px dashed #f0ebe6',
                        }}>
                          <div style={{ flexShrink: 0, width: 72, height: 52, borderRadius: 10, overflow: 'hidden', background: `${GOLD}15` }}>
                            {thumb ? (
                              <img src={thumb} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="isax isax-book-1" style={{ fontSize: 22, color: GOLD }} />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0, fontSize: 14, color: DARK, fontWeight: 600, lineHeight: 1.4,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.title}
                            </p>
                            {item.instructorName && (
                              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
                                {t('courseCheckout.by', 'by')} {item.instructorName}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>
                              {item.price === 0 ? t('courseList.free', 'Free') : `${item.price.toFixed(2)} MAD`}
                            </span>
                            <button
                              type="button"
                              onClick={() => dispatch(removeFromCart(item.id))}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#ccc', fontSize: 16, padding: 4,
                                display: 'flex', alignItems: 'center',
                                transition: 'color .2s',
                              }}
                              title={t('courseCart.remove', 'Remove')}
                              onMouseEnter={e => (e.currentTarget.style.color = BURG)}
                              onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                            >
                              <i className="isax isax-close-circle" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CMI Payment notice */}
                <div style={{
                  background: '#fff', borderRadius: 20,
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  border: '1px solid #f0ebe6', overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '20px 28px', borderBottom: '1px solid #f0ebe6',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>2</div>
                    <div>
                      <h4 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", color: DARK, fontSize: 18 }}>
                        {t('courseCheckout.paymentMethod', 'Payment Method')}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                        {t('courseCheckout.secureGateway', 'Secured by CMI Chaabi Payment')}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '24px 28px' }}>
                    {/* CMI gateway notice */}
                    <div style={{
                      background: `linear-gradient(135deg, #f9f4eb 0%, #fff8ed 100%)`,
                      border: `1.5px solid ${GOLD}44`,
                      borderRadius: 14, padding: '20px 24px',
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(135deg, ${GOLD}22 0%, ${GOLD_L}22 100%)`,
                        border: `1.5px solid ${GOLD}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="isax isax-card" style={{ fontSize: 22, color: GOLD }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 6 }}>
                          {t('courseCheckout.cmiTitle', 'CMI Chaabi Secure Payment')}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                          {t('courseCheckout.cmiDesc', 'You will be redirected to the CMI Chaabi secure payment page to enter your card details. We do not store or process your card information.')}
                        </p>
                        {items.length > 1 && (
                          <div style={{
                            marginTop: 10, padding: '8px 12px',
                            background: `rgba(197,151,62,0.08)`, borderRadius: 8,
                            fontSize: 12, color: '#8B6914',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                            <i className="isax isax-info-circle" style={{ flexShrink: 0 }} />
                            {t('courseCheckout.multiCourseInfo',
                              `You have ${items.length} courses. Each course is processed in a separate secure transaction. Starting with: "${items[0]?.title}".`,
                              { count: items.length, title: items[0]?.title }
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Accepted payment logos */}
                    <div style={{ marginTop: 20 }}>
                      <PaymentBadges variant="light" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Order Summary ── */}
              <div style={{ position: 'sticky', top: 100 }}>
                <div style={{
                  background: '#fff', borderRadius: 20,
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
                    <p style={{ color: `${GOLD_L}99`, margin: '4px 0 0', fontSize: 12 }}>
                      {items.length} {items.length !== 1 ? t('courseCart.coursesInCartPlural', 'Courses') : t('courseCart.courseInCart', 'Course')}
                    </p>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    {/* Price breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#666', fontSize: 13 }}>{t('courseCart.subtotal', 'Subtotal')}</span>
                        <span style={{ color: DARK, fontWeight: 600, fontSize: 13 }}>{subtotal.toFixed(2)} MAD</span>
                      </div>
                      {savedTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#4caf50', fontSize: 13 }}>{t('courseCart.discount', 'Discount')}</span>
                          <span style={{ color: '#4caf50', fontWeight: 600, fontSize: 13 }}>-{savedTotal.toFixed(2)} MAD</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#666', fontSize: 13 }}>{t('courseCheckout.tva', 'TVA (20%)')}</span>
                        <span style={{ color: DARK, fontWeight: 600, fontSize: 13 }}>{tax.toFixed(2)} MAD</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: '#f0ebe6', margin: '12px 0 16px' }} />

                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <span style={{ fontWeight: 700, color: DARK, fontSize: 16 }}>{t('courseCart.total', 'Total')}</span>
                      <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 800, color: GOLD, fontSize: 22,
                      }}>
                        {total.toFixed(2)} MAD
                      </span>
                    </div>

                    {/* Guarantee */}
                    <div style={{
                      background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                      borderRadius: 10, padding: '12px 14px',
                      marginBottom: 20,
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <i className="isax isax-shield-tick" style={{ color: GOLD, fontSize: 20, flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                        <strong style={{ color: DARK }}>{t('courseCart.moneyBackGuarantee', '30-day money-back guarantee.')}</strong>{' '}
                        {t('courseCheckout.fullRefund', 'If you are not satisfied, get a full refund within 30 days.')}
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={processing}
                      style={{
                        width: '100%', padding: '16px',
                        background: processing
                          ? '#ccc'
                          : `linear-gradient(135deg, ${BURG} 0%, ${BURG_D} 100%)`,
                        color: '#fff', border: 'none',
                        borderRadius: 14, cursor: processing ? 'not-allowed' : 'pointer',
                        fontSize: 15, fontWeight: 700,
                        boxShadow: processing ? 'none' : `0 6px 20px rgba(101,28,50,0.35)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all .2s',
                        letterSpacing: 0.4,
                      }}
                    >
                      {processing ? (
                        <>
                          <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          {t('courseCheckout.redirecting', 'Redirecting to payment…')}
                        </>
                      ) : (
                        <>
                          <i className="isax isax-lock" style={{ fontSize: 18 }} />
                          {t('courseCheckout.proceedToPayment', 'Proceed to Secure Payment')}
                        </>
                      )}
                    </button>

                    {/* CMI logos */}
                    <PaymentBadges variant="light" style={{ marginTop: 16 }} />

                    {/* Terms note */}
                    <p style={{ margin: '12px 0 0', fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
                      {t('courseCheckout.byCompleting', 'By completing your purchase, you agree to our')}{' '}
                      <Link to="/terms" style={{ color: GOLD }}>{t('courseCheckout.termsOfService', 'Terms of Service')}</Link>{' '}
                      {t('courseCheckout.and', 'and')}{' '}
                      <Link to="/privacy" style={{ color: GOLD }}>{t('courseCheckout.privacyPolicy', 'Privacy Policy')}</Link>.
                    </p>
                  </div>
                </div>

                {/* Back to cart */}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Link
                    to={route.courseCart}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: BURG, textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    <i className="isax isax-arrow-left-2" />
                    {t('courseCheckout.backToCart', 'Back to Cart')}
                  </Link>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CourseCheckout;
