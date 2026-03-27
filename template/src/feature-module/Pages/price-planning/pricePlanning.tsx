import React, { useEffect, useState } from "react";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { subscriptionService } from "../../../services/api/subscription.service";
import { SubscriptionPlan, Subscription } from "../../../services/api/types";
import { useAppSelector } from "../../../core/redux/hooks";
import { Spin, message, Modal } from "antd";

const PricePlanning = () => {
  const route = all_routes;
  const navigate = useNavigate();

  const [premiumPlan, setPremiumPlan] = useState<SubscriptionPlan | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const isSubscribed =
    currentSubscription?.status === 'ACTIVE' ||
    user?.subscriptionStatus === 'ACTIVE';

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        subscriptionService.getPlans(),
        isAuthenticated ? subscriptionService.getMySubscription() : Promise.resolve(null),
      ]);
      setPremiumPlan(plansData[0] ?? null);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPremiumPlan({
        planId: 'yearly',
        name: 'Premium',
        description: 'Full platform access with all courses',
        price: 199,
        currency: 'MAD',
        billingPeriod: 'yearly',
        features: [
          'Full Student Dashboard',
          'Access to all courses',
          'Course completion certificates',
          'Community forum access',
          'Direct messaging with instructors',
          'Priority support',
          'Progress tracking',
        ],
        isPopular: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      Modal.confirm({
        title: 'Login Required',
        content: 'You need to login to subscribe. Would you like to login now?',
        okText: 'Login',
        cancelText: 'Cancel',
        onOk: () => navigate(route.login),
      });
      return;
    }

    if (!premiumPlan) return;

    try {
      setSubscribing(true);
      const response = await subscriptionService.subscribe(premiumPlan.planId);
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        message.success('Subscription activated successfully!');
        fetchData();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to process subscription');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb title="Pricing Plan" />
        <section style={{ padding: '60px 0' }}>
          <div className="container text-center py-5">
            <Spin size="large" />
            <p className="mt-3" style={{ color: 'var(--lx-text-muted)' }}>Loading subscription plans...</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title="Pricing Plan" />

      <section style={{ padding: '60px 0', background: 'var(--lx-bg)' }}>
        <div className="container">

          {/* Header */}
          <div className="row">
            <div className="col-lg-7 mx-auto text-center">
              <p style={{ fontWeight: 600, color: 'var(--lx-primary)', fontSize: 14, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                Simple & Transparent Pricing
              </p>
              <h2 style={{ fontWeight: 800, color: 'var(--lx-text)', fontSize: 32, marginBottom: 12 }}>
                Choose Your Learning Journey
              </h2>
              <p style={{ color: 'var(--lx-text-muted)', fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
                Register for free and get full access to the platform — dashboard, courses,
                and certificates included. Upgrade to Premium for masterclasses and exclusive perks.
              </p>
              {isSubscribed && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 16,
                    padding: '10px 20px',
                    borderRadius: 'var(--lx-radius)',
                    background: 'rgba(45, 95, 63, 0.08)',
                    border: '1px solid rgba(45, 95, 63, 0.15)',
                    color: 'var(--lx-green)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <i className="isax isax-crown" />
                  <span>
                    You're on the <strong>Premium</strong> plan — expires{' '}
                    {currentSubscription?.currentPeriodEnd
                      ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : user?.subscriptionEndDate
                      ? new Date(user.subscriptionEndDate).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Plan Cards */}
          <div className="row justify-content-center mt-5 g-4">

            {/* ── FREE PLAN ── */}
            <div className="col-xl-4 col-md-6">
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 'var(--lx-radius-lg)',
                  border: '1px solid rgba(107, 29, 42, 0.08)',
                  padding: 32,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <span className="lx-badge badge-info" style={{ marginBottom: 8 }}>Free</span>
                  <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 4 }}>Free Access</h5>
                  <p style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>Everything you need to start learning</p>
                </div>

                <h1 style={{ fontWeight: 800, color: 'var(--lx-text)', marginBottom: 20 }}>
                  <sup style={{ fontSize: 20, marginRight: 4, color: 'var(--lx-text-mid)' }}>$</sup>0
                  <small style={{ fontSize: 14, color: 'var(--lx-text-muted)', fontWeight: 400 }}>/forever</small>
                </h1>

                <div style={{ borderTop: '1px solid rgba(107, 29, 42, 0.06)', paddingTop: 16, flex: 1 }}>
                  {[
                    'Browse course catalog',
                    'View instructor profiles',
                    'Read course descriptions',
                    'Access student dashboard',
                    'Enroll in courses',
                    'Course certificates',
                    'Community & messaging',
                  ].map((text, idx) => (
                    <p key={idx} className="d-flex align-items-center" style={{ marginBottom: 14, fontSize: 14, color: 'var(--lx-text)' }}>
                      <i className="isax isax-tick-circle" style={{ color: 'var(--lx-green)', marginRight: 10, fontSize: 16 }} />
                      {text}
                    </p>
                  ))}
                  <p className="d-flex align-items-center" style={{ marginBottom: 14, fontSize: 14 }}>
                    <i className="isax isax-close-circle" style={{ color: 'var(--lx-text-soft)', marginRight: 10, fontSize: 16 }} />
                    <span style={{ color: 'var(--lx-text-muted)' }}>Masterclasses (sold separately)</span>
                  </p>
                </div>

                {!isAuthenticated ? (
                  <Link
                    to={route.register}
                    className="lx-btn lx-btn-outline"
                    style={{ width: '100%', marginTop: 16, textAlign: 'center', justifyContent: 'center' }}
                  >
                    Sign Up Free
                  </Link>
                ) : (
                  <button
                    className="lx-btn lx-btn-outline"
                    style={{ width: '100%', marginTop: 16, opacity: 0.6 }}
                    disabled
                  >
                    {isSubscribed ? (
                      'Included in Premium'
                    ) : (
                      <>
                        <i className="isax isax-tick-circle" style={{ marginRight: 6 }} />
                        Your Current Plan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── PREMIUM PLAN ── */}
            <div className="col-xl-4 col-md-6">
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderRadius: 'var(--lx-radius-lg)',
                  border: '2px solid rgba(107, 29, 42, 0.15)',
                  padding: 32,
                  boxShadow: '0 8px 32px rgba(107, 29, 42, 0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Recommended badge */}
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, var(--lx-primary) 0%, var(--lx-primary-dark) 100%)',
                      color: '#fff',
                      padding: '5px 16px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                    }}
                  >
                    Recommended
                  </span>
                </div>

                <div style={{ marginBottom: 20, marginTop: 8 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'rgba(107, 29, 42, 0.08)',
                      color: 'var(--lx-primary)',
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Premium
                  </span>
                  <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 4 }}>
                    {premiumPlan?.name ?? 'Premium'}
                  </h5>
                  <p style={{ color: 'var(--lx-text-muted)', fontSize: 13 }}>
                    Everything in Free, plus exclusive masterclass access
                  </p>
                </div>

                <h1 style={{ fontWeight: 800, color: 'var(--lx-text)', marginBottom: 4 }}>
                  <sup style={{ fontSize: 18, marginRight: 4, color: 'var(--lx-text-mid)' }}>
                    {premiumPlan?.currency ?? 'MAD'}
                  </sup>
                  {premiumPlan?.price ?? 199}
                  <small style={{ fontSize: 14, color: 'var(--lx-text-muted)', fontWeight: 400 }}>
                    /{premiumPlan?.billingPeriod ?? 'year'}
                  </small>
                </h1>
                <p style={{ color: 'var(--lx-green)', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                  <i className="isax isax-verify" style={{ marginRight: 4 }} />
                  One payment, one full year of access
                </p>

                <div style={{ borderTop: '1px solid rgba(107, 29, 42, 0.06)', paddingTop: 16, flex: 1 }}>
                  {/* Everything from Free */}
                  {[
                    'Browse course catalog',
                    'Access student dashboard',
                    'Enroll in all courses',
                    'Course certificates',
                    'Community & messaging',
                  ].map((feature, idx) => (
                    <p key={idx} className="d-flex align-items-center" style={{ marginBottom: 14, fontSize: 14, color: 'var(--lx-text)' }}>
                      <i className="isax isax-tick-circle" style={{ color: 'var(--lx-green)', marginRight: 10, fontSize: 16 }} />
                      {feature}
                    </p>
                  ))}
                  {/* Premium extras */}
                  <p className="d-flex align-items-center" style={{ marginBottom: 14, fontSize: 14 }}>
                    <i className="isax isax-crown" style={{ color: 'var(--lx-gold)', marginRight: 10, fontSize: 16 }} />
                    <strong style={{ color: 'var(--lx-text)' }}>Masterclass access (exclusive)</strong>
                  </p>
                  <p className="d-flex align-items-center" style={{ marginBottom: 14, fontSize: 14 }}>
                    <i className="isax isax-crown" style={{ color: 'var(--lx-gold)', marginRight: 10, fontSize: 16 }} />
                    <strong style={{ color: 'var(--lx-text)' }}>Priority support</strong>
                  </p>
                  <p className="d-flex align-items-center" style={{ marginBottom: 14, fontSize: 14 }}>
                    <i className="isax isax-crown" style={{ color: 'var(--lx-gold)', marginRight: 10, fontSize: 16 }} />
                    <strong style={{ color: 'var(--lx-text)' }}>Early access to new courses</strong>
                  </p>
                </div>

                {isSubscribed ? (
                  <button
                    className="lx-btn"
                    style={{
                      width: '100%',
                      marginTop: 16,
                      background: 'var(--lx-green)',
                      color: '#fff',
                      border: 'none',
                      opacity: 0.8,
                      justifyContent: 'center',
                    }}
                    disabled
                  >
                    <i className="isax isax-tick-circle" style={{ marginRight: 6 }} />
                    Current Plan
                  </button>
                ) : (
                  <button
                    className="lx-btn lx-btn-gold"
                    style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                    onClick={handleSubscribe}
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      <>
                        <Spin size="small" style={{ marginRight: 8 }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        Get Premium
                        <i className="isax isax-arrow-right-3" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Masterclasses Info Banner */}
          <div className="row mt-5">
            <div className="col-lg-8 mx-auto">
              <div
                style={{
                  padding: 24,
                  borderRadius: 'var(--lx-radius-lg)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(107, 29, 42, 0.08)',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--lx-radius)',
                      background: 'rgba(197, 151, 62, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i className="isax isax-teacher" style={{ fontSize: 24, color: 'var(--lx-gold)' }} />
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 6, fontSize: 16 }}>
                      Masterclasses — Premium Exclusive
                    </h5>
                    <p style={{ color: 'var(--lx-text-muted)', marginBottom: 0, fontSize: 14, lineHeight: 1.7 }}>
                      Masterclasses are exclusive live or recorded sessions led by world-renowned
                      pastry chefs. They are accessible to <strong style={{ color: 'var(--lx-text)' }}>Premium subscribers</strong> and
                      can also be purchased <strong style={{ color: 'var(--lx-text)' }}>individually</strong> by any registered user,
                      regardless of subscription status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What's included section */}
          <div className="row mt-5">
            <div className="col-12 text-center mb-4">
              <h3 style={{ fontWeight: 800, color: 'var(--lx-text)' }}>Why Upgrade to Premium?</h3>
              <p style={{ color: 'var(--lx-text-muted)' }}>Premium subscribers get exclusive extras on top of everything in the free plan</p>
            </div>
            {[
              { icon: 'isax isax-crown', color: 'var(--lx-gold)', title: 'Masterclass Access', desc: 'Gain access to exclusive live and recorded masterclasses led by world-renowned pastry chefs' },
              { icon: 'isax isax-headphone', color: 'var(--lx-primary)', title: 'Priority Support', desc: 'Get faster responses from our support team and dedicated assistance for any issues' },
              { icon: 'isax isax-flash', color: 'var(--lx-primary)', title: 'Early Access', desc: 'Be the first to access newly released courses before they open to all students' },
            ].map((item, idx) => (
              <div key={idx} className="col-md-4 mb-4">
                <div
                  style={{
                    textAlign: 'center',
                    padding: 28,
                    borderRadius: 'var(--lx-radius-lg)',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(107, 29, 42, 0.06)',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: item.color === 'var(--lx-gold)' ? 'rgba(197, 151, 62, 0.1)' : 'rgba(107, 29, 42, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <i className={item.icon} style={{ fontSize: 28, color: item.color }} />
                  </div>
                  <h5 style={{ fontWeight: 700, color: 'var(--lx-text)', marginBottom: 8, fontSize: 16 }}>{item.title}</h5>
                  <p style={{ color: 'var(--lx-text-muted)', marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="row mt-5">
            <div className="col-lg-8 mx-auto">
              <h3 className="text-center" style={{ fontWeight: 800, color: 'var(--lx-text)', marginBottom: 24 }}>
                Frequently Asked Questions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    q: 'What do I get with the free plan?',
                    a: 'The free plan lets you browse all courses, read descriptions, and explore the platform. To access the student dashboard, enroll in courses, or earn certificates you need an active Premium subscription.',
                  },
                  {
                    q: 'Are masterclasses included in Premium?',
                    a: 'No. Masterclasses are exclusive sessions that are sold individually. You can purchase any masterclass at any time, regardless of your subscription plan.',
                  },
                  {
                    q: 'Can I cancel my subscription?',
                    a: 'Yes. You can cancel at any time. Your access continues until the end of the current billing year.',
                  },
                  {
                    q: 'What payment methods are accepted?',
                    a: 'We accept all major credit and debit cards via our secure payment gateway.',
                  },
                ].map((faq, idx) => (
                  <details
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: 'var(--lx-radius)',
                      border: '1px solid rgba(107, 29, 42, 0.06)',
                      overflow: 'hidden',
                    }}
                    {...(idx === 0 ? { open: true } : {})}
                  >
                    <summary
                      style={{
                        padding: '16px 20px',
                        fontWeight: 600,
                        fontSize: 15,
                        color: 'var(--lx-text)',
                        cursor: 'pointer',
                        listStyle: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {faq.q}
                      <i className="isax isax-arrow-down-1" style={{ fontSize: 16, color: 'var(--lx-text-muted)', flexShrink: 0 }} />
                    </summary>
                    <div style={{ padding: '0 20px 16px', color: 'var(--lx-text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* CTA for unauthenticated */}
          {!isAuthenticated && (
            <div className="row mt-5">
              <div className="col-12">
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 32px',
                    borderRadius: 'var(--lx-radius-lg)',
                    background: 'linear-gradient(135deg, var(--lx-primary) 0%, var(--lx-primary-dark) 100%)',
                    color: '#fff',
                  }}
                >
                  <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: 12 }}>Ready to Start Learning?</h3>
                  <p style={{ marginBottom: 24, opacity: 0.9, fontSize: 15 }}>
                    Join our community of cake design students and start your journey today.
                  </p>
                  <Link
                    to={route.register}
                    className="lx-btn"
                    style={{
                      background: '#fff',
                      color: 'var(--lx-primary)',
                      fontWeight: 700,
                      marginRight: 12,
                      padding: '10px 28px',
                    }}
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    to={route.courseList}
                    className="lx-btn"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      padding: '10px 28px',
                    }}
                  >
                    Browse Courses
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
};

export default PricePlanning;
