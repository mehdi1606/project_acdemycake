import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Slider from "react-slick";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useAppDispatch, useAppSelector } from "../../../core/redux/hooks";
import { login, clearError } from "../../../core/redux/authSlice";
import { Spin, Alert, App } from "antd";

type PasswordField = "password" | "confirmPassword";

interface LocationState {
  registrationSuccess?: boolean;
  email?: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

const Login = () => {
  const { message } = App.useApp();

  const loginSLider = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
  };

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const route = all_routes;

  // Check if redirected from registration
  useEffect(() => {
    if (locationState?.registrationSuccess) {
      setShowVerificationAlert(true);
      if (locationState.email) {
        setRegisteredEmail(locationState.email);
        setFormData(prev => ({ ...prev, email: locationState.email || "" }));
      }
      navigate(location.pathname, { replace: true });
    }
  }, [locationState, navigate, location.pathname]);

  // Clear error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        navigate(route.adminDashboard);
      } else if (user.role === 'INSTRUCTOR') {
        navigate(route.instructorDashboard);
      } else {
        navigate(route.studentDashboard);
      }
    }
  }, [isAuthenticated, user, navigate, route]);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear backend error when user modifies inputs
    if (error) dispatch(clearError());
  };

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'email') {
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
    }
    if (name === 'password') {
      if (!value) return 'Password is required.';
    }
    return undefined;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate all fields
    const errors: FieldErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      // Redirect is handled by the useEffect above
    } catch (err: unknown) {
      const errorMsg = typeof err === 'string' ? err : 'Invalid credentials. Please check your email and password.';
      message.error({ content: errorMsg, duration: 5, key: 'login-error' });
    }
  };

  return (
    <>
      <div className="main-wrapper">
        <div className="login-content">
          <div className="row">
            {/* Login Banner */}
            <div className="col-md-6 login-bg d-none d-lg-flex">
              <Slider {...loginSLider} className="login-carousel">
                <div>
                  <div className="login-carousel-section mb-3">
                    <div className="login-banner">
                      <ImageWithBasePath src="assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo" />
                    </div>
                    <div className="mentor-course text-center">
                      <h3 className="mb-2">
                        Welcome to <br />
                        SARA<span className="text-secondary">LÖWE</span> Academy
                      </h3>
                      <p>
                        Master the art of luxury cake design with world-class instructors.
                        Learn, create, and transform your passion into expertise.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="login-carousel-section mb-3">
                    <div className="login-banner">
                      <ImageWithBasePath src="assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo" />
                    </div>
                    <div className="mentor-course text-center">
                      <h3 className="mb-2">Premium <br /><span className="text-secondary">Masterclasses</span></h3>
                      <p>Access exclusive courses from renowned pastry chefs.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="login-carousel-section mb-3">
                    <div className="login-banner">
                      <ImageWithBasePath src="assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo" />
                    </div>
                    <div className="mentor-course text-center">
                      <h3 className="mb-2">Join Our <br /><span className="text-secondary">Community</span></h3>
                      <p>Connect with fellow cake artists from around the world.</p>
                    </div>
                  </div>
                </div>
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
                    <h1 className="fs-32 fw-bold topic">Sign into Your Account</h1>

                    {/* Registration success alert */}
                    {showVerificationAlert && (
                      <Alert
                        message="Registration Successful!"
                        description={
                          <div>
                            <p className="mb-2">
                              We've sent a verification email to <strong>{registeredEmail}</strong>.
                            </p>
                            <p className="mb-0">
                              Please check your inbox and click the verification link before logging in.
                            </p>
                          </div>
                        }
                        type="success"
                        showIcon
                        closable
                        onClose={() => setShowVerificationAlert(false)}
                        className="mb-4"
                      />
                    )}

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
                      {/* Email */}
                      <div className="mb-3 position-relative">
                        <label className="form-label">
                          Email<span className="text-danger ms-1">*</span>
                        </label>
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
                          <span>
                            <i className="isax isax-sms input-icon text-gray-7 fs-14" />
                          </span>
                          {fieldErrors.email && (
                            <div className="invalid-feedback d-block">
                              <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                              {fieldErrors.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Password */}
                      <div className="mb-3 position-relative">
                        <label className="form-label">
                          Password <span className="text-danger ms-1">*</span>
                        </label>
                        <div className="position-relative" id="passwordInput">
                          <input
                            type={passwordVisibility.password ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`form-control form-control-lg pass-input${fieldErrors.password ? ' is-invalid' : ''}`}
                            placeholder="Enter your password"
                            disabled={isLoading}
                          />
                          <span
                            className={`isax toggle-passwords fs-14 ${
                              passwordVisibility.password ? "isax-eye" : "isax-eye-slash"
                            }`}
                            onClick={() => togglePasswordVisibility("password")}
                          />
                          {fieldErrors.password && (
                            <div className="invalid-feedback d-block">
                              <i className="isax isax-info-circle me-1" style={{ fontSize: 12 }} />
                              {fieldErrors.password}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="remember-me d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            id="flexCheckDefault"
                          />
                          <label className="form-check-label ms-2" htmlFor="flexCheckDefault">
                            Remember Me
                          </label>
                        </div>
                        <Link to={route.forgotpassword} className="link-2">
                          Forgot Password?
                        </Link>
                      </div>

                      <div className="d-grid">
                        <button
                          className="btn btn-secondary btn-lg"
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Spin size="small" className="me-2" />
                              Signing In...
                            </>
                          ) : (
                            <>Login <i className="isax isax-arrow-right-3 ms-1" /></>
                          )}
                        </button>
                      </div>
                    </form>

                    <div className="d-flex align-items-center justify-content-center or fs-14 mb-3">Or</div>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <Link to="#" className="btn btn-light me-2">
                        <ImageWithBasePath src="assets/img/icons/google.svg" alt="img" className="me-2" />
                        Google
                      </Link>
                      <Link to="#" className="btn btn-light">
                        <ImageWithBasePath src="assets/img/icons/facebook.svg" alt="img" className="me-2" />
                        Facebook
                      </Link>
                    </div>
                    <div className="fs-14 fw-normal d-flex align-items-center justify-content-center">
                      Don't have an account?
                      <Link to={route.register} className="link-2 ms-1">Sign up</Link>
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

export default Login;
