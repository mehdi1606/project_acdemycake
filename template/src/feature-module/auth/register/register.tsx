import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Slider from "react-slick";
import { all_routes } from "../../router/all_routes";
import { useAppDispatch, useAppSelector } from "../../../core/redux/hooks";
import { register, clearError } from "../../../core/redux/authSlice";
import { message, Spin } from "antd";

const hasNumber = (value: string): boolean => {
  return /[0-9]/.test(value);
};

const hasMixed = (value: string): boolean => {
  return /[a-z]/.test(value) && /[A-Z]/.test(value);
};

const hasSpecial = (value: string): boolean => {
  return /[!#@$%^&*)(+=._-]/.test(value);
};

const strengthColor = (count: number): string => {
  if (count < 1) return "poor";
  if (count < 2) return "weak";
  if (count < 3) return "strong";
  if (count < 4) return "heavy";
  return "poor";
};

const Register: React.FC = () => {
  const [eye, setEye] = useState<boolean>(true);
  const [eyeConfirmPassword, setEyeConfirmPassword] = useState<boolean>(true);
  const [strength, setStrength] = useState<string>("");
  const [validationError, setValidationError] = useState<number>(0);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);

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

  // Clear error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(route.studentDashboard);
    }
  }, [isAuthenticated, navigate, route]);

  // Show error message
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const loginSLider = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      validatePassword(value);
    }
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setValidationError(1);
    } else if (value.length < 8) {
      setValidationError(2);
    } else if (!/[0-9]/.test(value)) {
      setValidationError(3);
    } else if (!/[!@#$%^&*()]/.test(value)) {
      setValidationError(4);
    } else {
      setValidationError(5);
    }
  };

  const messages = () => {
    switch (validationError) {
      case 2:
        return (
          <span
            id="poor"
            className="active mt-2"
            style={{ fontSize: 14, color: "#8B2335", marginTop: "8px" }}
          >
            <ImageWithBasePath
              src="assets/img/icon/angry.svg"
              className="me-2"
              alt=""
            />{" "}
            Weak. Must contain at least 8 characters
          </span>
        );
      case 3:
        return (
          <span
            id="weak"
            className="active mt-2"
            style={{ fontSize: 14, color: "#C5973E", marginTop: "8px" }}
          >
            <ImageWithBasePath
              src="assets/img/icon/anguish.svg"
              className="me-2"
              alt=""
            />{" "}
            Average. Must contain at least 1 number
          </span>
        );
      case 4:
        return (
          <span
            id="strong"
            className="active mt-2"
            style={{ fontSize: 14, color: "#4A7DAA", marginTop: "8px" }}
          >
            <ImageWithBasePath
              src="assets/img/icon/smile.svg"
              className="me-2"
              alt=""
            />{" "}
            Almost. Must contain special symbol
          </span>
        );
      case 5:
        return (
          <span
            id="heavy"
            className="active mt-2"
            style={{ fontSize: 14, color: "#2D5F3F", marginTop: "8px" }}
          >
            <ImageWithBasePath
              src="assets/img/icon/smile.svg"
              className="me-2"
              alt=""
            />{" "}
            Awesome! You have a secure password.
          </span>
        );
      default:
        return null;
    }
  };

  const strengthIndicator = (value: string): number => {
    let strengths = 0;
    if (value.length >= 8) strengths = 1;
    if (hasNumber(value) && value.length >= 8) strengths = 2;
    if (hasSpecial(value) && value.length >= 8 && hasNumber(value))
      strengths = 3;
    if (
      hasMixed(value) &&
      hasSpecial(value) &&
      value.length >= 8 &&
      hasNumber(value)
    )
      strengths = 3;
    return strengths;
  };

  useEffect(() => {
    if (formData.password) {
      let strengthValue = strengthIndicator(formData.password);
      let color = strengthColor(strengthValue);
      setStrength(color);
    } else {
      setStrength("");
    }
  }, [formData.password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      message.error("Please fill in all required fields");
      return;
    }

    if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      message.error("Full name must be between 2 and 100 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      message.error("Password must be at least 8 characters long");
      return;
    }

    if (!agreeTerms) {
      message.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      await dispatch(register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      })).unwrap();

      // Registration successful - redirect to login with verification message
      message.success("Registration successful! Please check your email to verify your account.");
      navigate(route.login, {
        state: {
          registrationSuccess: true,
          email: formData.email
        }
      });
    } catch (err) {
      // Error is handled by the slice
    }
  };

  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="login-content">
          <div className="row">
            {/* Login Banner */}
            <div className="col-md-6 login-bg d-none d-lg-flex">
              <Slider {...loginSLider} className="login-carousel">
                <div>
                  <div className="login-carousel-section mb-3">
                    <div className="login-banner">
                      <ImageWithBasePath
                        src="assets/img/auth/auth-1.svg"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="mentor-course text-center">
                      <h3 className="mb-2">
                        Welcome to <br />
                        SARA<span className="text-secondary">LÖWE</span>{" "}
                        Academy
                      </h3>
                      <p>
                        Master the art of luxury cake design with world-class
                        instructors. Learn, create, and transform your passion
                        into expertise.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="login-carousel-section mb-3">
                    <div className="login-banner">
                      <ImageWithBasePath
                        src="assets/img/auth/auth-1.svg"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="mentor-course text-center">
                      <h3 className="mb-2">
                        Start Your <br />
                        <span className="text-secondary">Journey</span> Today
                      </h3>
                      <p>
                        Join thousands of aspiring cake artists. Get access to
                        premium courses, live sessions, and a supportive community.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="login-carousel-section mb-3">
                    <div className="login-banner">
                      <ImageWithBasePath
                        src="assets/img/auth/auth-1.svg"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="mentor-course text-center">
                      <h3 className="mb-2">
                        Learn from <br />
                        <span className="text-secondary">the Best</span>
                      </h3>
                      <p>
                        Our instructors are world-renowned pastry chefs who will
                        guide you every step of the way.
                      </p>
                    </div>
                  </div>
                </div>
              </Slider>
            </div>
            {/* /Login Banner */}
            <div className="col-md-6 login-wrap-bg">
              {/* Register */}
              <div className="login-wrapper">
                <div className="loginbox">
                  <div className="w-100">
                    <div className="d-flex align-items-center justify-content-between login-header">
                      <ImageWithBasePath
                        src="assets/img/logo.svg"
                        className="img-fluid"
                        alt="Logo"
                      />
                      <Link to={route.homeone} className="link-1">
                        Back to Home
                      </Link>
                    </div>
                    <h1 className="fs-32 fw-bold topic">Create Your Account</h1>
                    <p className="text-muted mb-4">
                      Join as a student and start learning today!
                    </p>
                    <form onSubmit={handleSubmit} className="mb-3 pb-3">
                      <div className="mb-3">
                        <label className="form-label">
                          Full Name<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="position-relative">
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="form-control form-control-lg"
                            placeholder="Enter your full name"
                            minLength={2}
                            maxLength={100}
                            required
                          />
                          <span>
                            <i className="isax isax-user input-icon text-gray-7 fs-14" />
                          </span>
                        </div>
                      </div>
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
                            className="form-control form-control-lg"
                            placeholder="Enter your email"
                            required
                          />
                          <span>
                            <i className="isax isax-sms input-icon text-gray-7 fs-14" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3 position-relative">
                        <label className="form-label">
                          Phone <span className="text-muted">(Optional)</span>
                        </label>
                        <div className="position-relative">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="form-control form-control-lg"
                            placeholder="Enter your phone number"
                          />
                          <span>
                            <i className="isax isax-call input-icon text-gray-7 fs-14" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3 position-relative">
                        <label className="form-label">
                          Password <span className="text-danger"> *</span>
                        </label>
                        <div className="position-relative" id="passwordInput">
                          <input
                            className="form-control pass-input"
                            type={eye ? "password" : "text"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Create a password (min 8 characters)"
                            minLength={8}
                            maxLength={100}
                            required
                          />
                          <span
                            onClick={() => setEye((prev) => !prev)}
                            className={`toggle-passwords text-gray-7 fs-14 isax ${
                              eye ? "isax-eye-slash" : "isax-eye"
                            }`}
                          />
                        </div>
                        <div
                          id="passwordStrength"
                          style={{ display: "flex" }}
                          className={`password-strength ${
                            strength === "poor"
                              ? "poor-active"
                              : strength === "weak"
                              ? "avg-active"
                              : strength === "strong"
                              ? "strong-active"
                              : strength === "heavy"
                              ? "heavy-active"
                              : ""
                          }`}
                        >
                          <span id="poor" className="active"></span>
                          <span id="weak" className="active"></span>
                          <span id="strong" className="active"></span>
                          <span id="heavy" className="active"></span>
                        </div>
                        <div id="passwordInfo">{messages()}</div>
                      </div>
                      <div className="mb-3 position-relative">
                        <label className="form-label">
                          Confirm Password{" "}
                          <span className="text-danger"> *</span>
                        </label>
                        <div className="position-relative">
                          <input
                            type={eyeConfirmPassword ? "password" : "text"}
                            className="pass-inputa form-control form-control-lg"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your password"
                            required
                          />
                          <span
                            className={`isax toggle-passworda ${
                              eyeConfirmPassword ? "isax-eye-slash" : "isax-eye"
                            } text-gray-7 fs-14`}
                            onClick={() => setEyeConfirmPassword((prev) => !prev)}
                            style={{
                              cursor: "pointer",
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          />
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="remember-me d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            id="flexCheckDefault"
                          />
                          <label
                            className="form-check-label mb-0 d-inline-flex remember-me fs-14"
                            htmlFor="flexCheckDefault"
                          >
                            I agree with{" "}
                            <Link to={route.termsConditions} className="link-2 mx-2">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link to={route.privacyPolicy} className="link-2 mx-2">
                              Privacy Policy
                            </Link>
                          </label>
                        </div>
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
                              Creating Account...
                            </>
                          ) : (
                            <>
                              Sign Up <i className="isax isax-arrow-right-3 ms-1" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                    <div className="d-flex align-items-center justify-content-center or fs-14 mb-3">
                      Or
                    </div>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <Link to="#" className="btn btn-light me-2">
                        <ImageWithBasePath
                          src="assets/img/icons/google.svg"
                          alt="img"
                          className="me-2"
                        />
                        Google
                      </Link>
                      <Link to="#" className="btn btn-light">
                        <ImageWithBasePath
                          src="assets/img/icons/facebook.svg"
                          alt="img"
                          className="me-2"
                        />
                        Facebook
                      </Link>
                    </div>
                    <div className="fs-14 fw-normal d-flex align-items-center justify-content-center">
                      Already have an account?
                      <Link to={route.login} className="link-2 ms-1">
                        {" "}
                        Login
                      </Link>
                    </div>
                    {/* /Register */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Main Wrapper */}
    </>
  );
};

export default Register;
