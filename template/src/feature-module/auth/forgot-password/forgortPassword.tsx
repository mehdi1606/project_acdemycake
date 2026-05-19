import React, { useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Slider from "react-slick";
import authService from "../../../services/api/auth.service";
import { extractApiError } from "../../../services/api/error.utils";
import { Alert, Spin } from "antd";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const route = all_routes;

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const loginSLider = {
    dots: true, infinite: true,
    slidesToShow: 1, slidesToScroll: 1, adaptiveHeight: true,
  };

  const validateEmail = (value: string): string => {
    if (!value.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
    return "";
  };

  const handleBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
    if (apiError) setApiError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }

    setIsLoading(true);
    setApiError("");
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (error: unknown) {
      setApiError(extractApiError(error, "Failed to send reset email. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="main-wrapper">
        <div className="login-content">
          <div className="row">
            {/* Banner */}
            <div className="col-md-6 login-bg d-none d-lg-flex">
              <Slider {...loginSLider} className="login-carousel">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="login-carousel-section mb-3">
                      <div className="login-banner">
                        <ImageWithBasePath src="assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo" />
                      </div>
                      <div className="mentor-course text-center">
                        <h3 className="mb-2">{t('auth.forgotPassword.sliderTitle1', 'Welcome to')} <br />SARA<span className="text-secondary">LÖWE</span> Academy</h3>
                        <p>{t('auth.forgotPassword.sliderDesc', 'Master the art of luxury cake design with world-class instructors.')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>

            <div className="col-md-6 login-wrap-bg">
              <div className="login-wrapper">
                <div className="loginbox">
                  <div className="w-100">
                    <div className="d-flex align-items-center justify-content-between login-header">
                      <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid" alt="Logo" />
                      <Link to={route.homeone} className="link-1">{t('common.backToHome', 'Back to Home')}</Link>
                    </div>

                    <div className="topic">
                      <h1 className="fs-32 fw-bold mb-3">{t('auth.forgotPassword.title', 'Forgot Password')}</h1>
                      <p className="fs-14 fw-normal mb-0">
                        {t('auth.forgotPassword.subtitle', "Enter your email and we'll send you a link to reset your password.")}
                      </p>
                    </div>

                    {/* Success state */}
                    {success ? (
                      <div className="mt-4">
                        <Alert
                          message={t('auth.forgotPassword.checkEmail', 'Email Sent!')}
                          description={
                            <>
                              <p className="mb-2">
                                {t('auth.forgotPassword.linkSent', "We've sent a password reset link to")} <strong>{email}</strong>.
                              </p>
                              <p className="mb-0">
                                {t('auth.forgotPassword.checkSpam', 'Please check your inbox (and spam folder) and follow the instructions.')}
                              </p>
                            </>
                          }
                          type="success"
                          showIcon
                          style={{ borderRadius: 8 }}
                        />
                        <div className="mt-4 text-center">
                          <p className="fs-14">
                            {t('auth.forgotPassword.didntReceive', "Didn't receive it?")}{" "}
                            <button
                              className="btn btn-link p-0 fs-14"
                              onClick={() => { setSuccess(false); setEmail(""); }}
                            >
                              {t('common.tryAgain', 'Try again')}
                            </button>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} noValidate className="mb-3 pb-3 mt-4">
                        {/* API error */}
                        {apiError && (
                          <Alert
                            message={apiError}
                            type="error"
                            showIcon
                            closable
                            onClose={() => setApiError("")}
                            className="mb-3"
                            style={{ borderRadius: 8 }}
                          />
                        )}

                        <div className="mb-4 position-relative">
                          <label className="form-label">
                            {t('auth.forgotPassword.email', 'Email')}<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="position-relative">
                            <input
                              type="email"
                              name="email"
                              value={email}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={`form-control form-control-lg${emailError ? ' is-invalid' : ''}`}
                              placeholder={t('auth.forgotPassword.emailPlaceholder', 'Enter your email address')}
                              disabled={isLoading}
                            />
                            <span>
                              <i className="isax isax-sms input-icon text-gray-7 fs-14" />
                            </span>
                            {emailError && (
                              <div className="invalid-feedback d-block">
                                <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                                {emailError}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="d-grid">
                          <button
                            className="btn btn-secondary btn-lg"
                            type="submit"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <><Spin size="small" className="me-2" />{t('auth.forgotPassword.sending', 'Sending...')}</>
                            ) : (
                              <>{t('auth.forgotPassword.sendLink', 'Send Reset Link')} <i className="isax isax-arrow-right-3 ms-1" /></>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    <p className="fs-14 fw-normal d-flex align-items-center justify-content-center mt-3">
                      {t('auth.forgotPassword.rememberPassword', 'Remember your password?')}
                      <Link to={route.login} className="link-2 ms-1">{t('auth.login.signIn', 'Sign In')}</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
