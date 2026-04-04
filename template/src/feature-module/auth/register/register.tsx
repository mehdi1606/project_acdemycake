import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Slider from "react-slick";
import { all_routes } from "../../router/all_routes";
import { useAppDispatch, useAppSelector } from "../../../core/redux/hooks";
import { register, clearError } from "../../../core/redux/authSlice";
import { Spin, Alert } from "antd";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const hasNumber = (value: string): boolean => /[0-9]/.test(value);
const hasMixed  = (value: string): boolean => /[a-z]/.test(value) && /[A-Z]/.test(value);
const hasSpecial = (value: string): boolean => /[!#@$%^&*)(+=._-]/.test(value);

const strengthColor = (count: number): string => {
  if (count < 1) return "poor";
  if (count < 2) return "weak";
  if (count < 3) return "strong";
  return "heavy";
};

const strengthIndicator = (value: string): number => {
  let s = 0;
  if (value.length >= 8) s = 1;
  if (hasNumber(value) && value.length >= 8) s = 2;
  if (hasSpecial(value) && value.length >= 8 && hasNumber(value)) s = 3;
  if (hasMixed(value) && hasSpecial(value) && value.length >= 8 && hasNumber(value)) s = 3;
  return s;
};

const Register: React.FC = () => {
  const [eye, setEye] = useState<boolean>(true);
  const [eyeConfirmPassword, setEyeConfirmPassword] = useState<boolean>(true);
  const [strength, setStrength] = useState<string>("");
  const [validationError, setValidationError] = useState<number>(0);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const route = all_routes;

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) navigate(route.studentDashboard);
  }, [isAuthenticated, navigate, route]);

  useEffect(() => {
    if (formData.password) {
      setStrength(strengthColor(strengthIndicator(formData.password)));
    } else {
      setStrength("");
    }
  }, [formData.password]);

  const validatePassword = (value: string) => {
    if (!value) { setValidationError(1); return; }
    if (value.length < 8) { setValidationError(2); return; }
    if (!/[0-9]/.test(value)) { setValidationError(3); return; }
    if (!/[!@#$%^&*()]/.test(value)) { setValidationError(4); return; }
    setValidationError(5);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") validatePassword(value);
    // Clear field error as user types
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) dispatch(clearError());
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        if (value.trim().length > 100) return 'Full name must not exceed 100 characters.';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
        break;
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters.';
        break;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== formData.password) return 'Passwords do not match.';
        break;
    }
    return undefined;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const passwordMessages = () => {
    switch (validationError) {
      case 2: return (
        <span className="active mt-2" style={{ fontSize: 14, color: "#8B2335", marginTop: "8px" }}>
          <ImageWithBasePath src="assets/img/icon/angry.svg" className="me-2" alt="" />
          Weak. Must contain at least 8 characters
        </span>
      );
      case 3: return (
        <span className="active mt-2" style={{ fontSize: 14, color: "#C5973E", marginTop: "8px" }}>
          <ImageWithBasePath src="assets/img/icon/anguish.svg" className="me-2" alt="" />
          Average. Must contain at least 1 number
        </span>
      );
      case 4: return (
        <span className="active mt-2" style={{ fontSize: 14, color: "#4A7DAA", marginTop: "8px" }}>
          <ImageWithBasePath src="assets/img/icon/smile.svg" className="me-2" alt="" />
          Almost. Must contain a special symbol
        </span>
      );
      case 5: return (
        <span className="active mt-2" style={{ fontSize: 14, color: "#2D5F3F", marginTop: "8px" }}>
          <ImageWithBasePath src="assets/img/icon/smile.svg" className="me-2" alt="" />
          Awesome! You have a secure password.
        </span>
      );
      default: return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const errors: FieldErrors = {
      fullName:        validateField('fullName', formData.fullName),
      email:           validateField('email', formData.email),
      password:        validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };

    if (!agreeTerms) {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy.';
    }

    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(register({
        fullName: formData.fullName,
        email:    formData.email,
        password: formData.password,
        phone:    formData.phone || undefined,
      })).unwrap();

      navigate(route.login, {
        state: { registrationSuccess: true, email: formData.email }
      });
    } catch {
      // Error shown via inline Alert below
    }
  };

  const loginSLider = {
    dots: true, infinite: true,
    slidesToShow: 1, slidesToScroll: 1, adaptiveHeight: true,
  };

  return (
    <>
      <div className="main-wrapper">
        <div className="login-content">
          <div className="row">
            {/* Banner */}
            <div className="col-md-6 login-bg d-none d-lg-flex">
              <Slider {...loginSLider} className="login-carousel">
                <div><div className="login-carousel-section mb-3">
                  <div className="login-banner"><ImageWithBasePath src="assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo" /></div>
                  <div className="mentor-course text-center">
                    <h3 className="mb-2">Welcome to <br />SARA<span className="text-secondary">LÖWE</span> Academy</h3>
                    <p>Master the art of luxury cake design with world-class instructors.</p>
                  </div>
                </div></div>
                <div><div className="login-carousel-section mb-3">
                  <div className="login-banner"><ImageWithBasePath src="assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo" /></div>
                  <div className="mentor-course text-center">
                    <h3 className="mb-2">Start Your <br /><span className="text-secondary">Journey</span> Today</h3>
                    <p>Join thousands of aspiring cake artists.</p>
                  </div>
                </div></div>
                <div><div className="login-carousel-section mb-3">
                  <div className="login-banner"><ImageWithBasePath src="assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo" /></div>
                  <div className="mentor-course text-center">
                    <h3 className="mb-2">Learn from <br /><span className="text-secondary">the Best</span></h3>
                    <p>Our instructors are world-renowned pastry chefs.</p>
                  </div>
                </div></div>
              </Slider>
            </div>

            <div className="col-md-6 login-wrap-bg">
              <div className="login-wrapper">
                <div className="loginbox">
                  <div className="w-100">
                    <div className="d-flex align-items-center justify-content-between login-header">
                      <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid" alt="Logo" />
                      <Link to={route.homeone} className="link-1">Back to Home</Link>
                    </div>
                    <h1 className="fs-32 fw-bold topic">Create Your Account</h1>
                    <p className="text-muted mb-4">Join as a student and start learning today!</p>

                    {/* Backend error alert */}
                    {error && (
                      <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => dispatch(clearError())}
                        className="mb-3"
                        style={{ borderRadius: 8 }}
                      />
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mb-3 pb-3">
                      {/* Full Name */}
                      <div className="mb-3">
                        <label className="form-label">Full Name<span className="text-danger ms-1">*</span></label>
                        <div className="position-relative">
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`form-control form-control-lg${fieldErrors.fullName ? ' is-invalid' : ''}`}
                            placeholder="Enter your full name"
                            disabled={isLoading}
                          />
                          <span><i className="isax isax-user input-icon text-gray-7 fs-14" /></span>
                          {fieldErrors.fullName && (
                            <div className="invalid-feedback d-block">
                              <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                              {fieldErrors.fullName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mb-3 position-relative">
                        <label className="form-label">Email<span className="text-danger ms-1">*</span></label>
                        <div className="position-relative">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`form-control form-control-lg${fieldErrors.email ? ' is-invalid' : ''}`}
                            placeholder="Enter your email"
                            disabled={isLoading}
                          />
                          <span><i className="isax isax-sms input-icon text-gray-7 fs-14" /></span>
                          {fieldErrors.email && (
                            <div className="invalid-feedback d-block">
                              <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                              {fieldErrors.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="mb-3 position-relative">
                        <label className="form-label">Phone <span className="text-muted">(Optional)</span></label>
                        <div className="position-relative">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="form-control form-control-lg"
                            placeholder="Enter your phone number"
                            disabled={isLoading}
                          />
                          <span><i className="isax isax-call input-icon text-gray-7 fs-14" /></span>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="mb-3 position-relative">
                        <label className="form-label">Password <span className="text-danger">*</span></label>
                        <div className="position-relative" id="passwordInput">
                          <input
                            className={`form-control pass-input${fieldErrors.password ? ' is-invalid' : ''}`}
                            type={eye ? "password" : "text"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder="Create a password (min 8 characters)"
                            disabled={isLoading}
                          />
                          <span
                            onClick={() => setEye(prev => !prev)}
                            className={`toggle-passwords text-gray-7 fs-14 isax ${eye ? "isax-eye-slash" : "isax-eye"}`}
                          />
                        </div>
                        <div
                          id="passwordStrength"
                          style={{ display: "flex" }}
                          className={`password-strength ${
                            strength === "poor" ? "poor-active" :
                            strength === "weak" ? "avg-active" :
                            strength === "strong" ? "strong-active" :
                            strength === "heavy" ? "heavy-active" : ""
                          }`}
                        >
                          <span id="poor" className="active" />
                          <span id="weak" className="active" />
                          <span id="strong" className="active" />
                          <span id="heavy" className="active" />
                        </div>
                        <div id="passwordInfo">{passwordMessages()}</div>
                        {fieldErrors.password && (
                          <div className="text-danger mt-1" style={{ fontSize: 13 }}>
                            <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                            {fieldErrors.password}
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="mb-3 position-relative">
                        <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input
                            type={eyeConfirmPassword ? "password" : "text"}
                            className={`pass-inputa form-control form-control-lg${fieldErrors.confirmPassword ? ' is-invalid' : ''}`}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder="Confirm your password"
                            disabled={isLoading}
                          />
                          <span
                            className={`isax toggle-passworda ${eyeConfirmPassword ? "isax-eye-slash" : "isax-eye"} text-gray-7 fs-14`}
                            onClick={() => setEyeConfirmPassword(prev => !prev)}
                            style={{ cursor: "pointer", position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}
                          />
                          {fieldErrors.confirmPassword && (
                            <div className="invalid-feedback d-block">
                              <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                              {fieldErrors.confirmPassword}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="mb-3">
                        <div className="remember-me d-flex align-items-start">
                          <input
                            className={`form-check-input mt-1${fieldErrors.terms ? ' is-invalid' : ''}`}
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => {
                              setAgreeTerms(e.target.checked);
                              if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: undefined }));
                            }}
                            id="flexCheckDefault"
                          />
                          <label className="form-check-label mb-0 d-inline-flex remember-me fs-14 ms-2" htmlFor="flexCheckDefault">
                            I agree with{" "}
                            <Link to={route.termsConditions} className="link-2 mx-2">Terms of Service</Link>
                            and{" "}
                            <Link to={route.privacyPolicy} className="link-2 mx-2">Privacy Policy</Link>
                          </label>
                        </div>
                        {fieldErrors.terms && (
                          <div className="text-danger mt-1" style={{ fontSize: 13 }}>
                            <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                            {fieldErrors.terms}
                          </div>
                        )}
                      </div>

                      <div className="d-grid">
                        <button className="btn btn-secondary btn-lg" type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <><Spin size="small" className="me-2" />Creating Account...</>
                          ) : (
                            <>Sign Up <i className="isax isax-arrow-right-3 ms-1" /></>
                          )}
                        </button>
                      </div>
                    </form>

                    <div className="d-flex align-items-center justify-content-center or fs-14 mb-3">Or</div>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <Link to="#" className="btn btn-light me-2">
                        <ImageWithBasePath src="assets/img/icons/google.svg" alt="img" className="me-2" />Google
                      </Link>
                      <Link to="#" className="btn btn-light">
                        <ImageWithBasePath src="assets/img/icons/facebook.svg" alt="img" className="me-2" />Facebook
                      </Link>
                    </div>
                    <div className="fs-14 fw-normal d-flex align-items-center justify-content-center">
                      Already have an account?
                      <Link to={route.login} className="link-2 ms-1">Login</Link>
                    </div>
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

export default Register;
