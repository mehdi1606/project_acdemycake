import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Slider from "react-slick";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useAppDispatch, useAppSelector } from "../../../core/redux/hooks";
import { login, clearError } from "../../../core/redux/authSlice";
import { message, Spin, Alert } from "antd";

type PasswordField = "password" | "confirmPassword";

interface LocationState {
  registrationSuccess?: boolean;
  email?: string;
}

const Login = () => {
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
      // Clear the location state
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
      // Redirect based on user role
      if (user.role === 'ADMIN') {
        navigate(route.adminDashboard);
      } else if (user.role === 'INSTRUCTOR') {
        navigate(route.instructorDashboard);
      } else {
        navigate(route.studentDashboard);
      }
    }
  }, [isAuthenticated, user, navigate, route]);

  // Show error message
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      message.error("Please fill in all fields");
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      message.success("Login successful! Welcome back.");
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
                        Premium <br />
                        <span className="text-secondary">Masterclasses</span>
                      </h3>
                      <p>
                        Access exclusive courses from renowned pastry chefs.
                        Learn techniques that will elevate your creations to
                        the next level.
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
                        Join Our <br />
                        <span className="text-secondary">Community</span>
                      </h3>
                      <p>
                        Connect with fellow cake artists from around the world.
                        Share your creations and get inspired.
                      </p>
                    </div>
                  </div>
                </div>
              </Slider>
            </div>
            {/* /Login Banner */}
            <div className="col-md-6 login-wrap-bg">
              {/* Login */}
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
                    <h1 className="fs-32 fw-bold topic">
                      Sign into Your Account
                    </h1>

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

                    <form onSubmit={handleSubmit} className="mb-3 pb-3">
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
                          Password <span className="text-danger ms-1">*</span>
                        </label>
                        <div className="position-relative" id="passwordInput">
                          <input
                            type={passwordVisibility.password ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="form-control form-control-lg pass-input"
                            placeholder="Enter your password"
                            required
                          />
                          <span
                            className={`isax toggle-passwords fs-14 ${
                              passwordVisibility.password
                                ? "isax-eye"
                                : "isax-eye-slash"
                            }`}
                            onClick={() => togglePasswordVisibility("password")}
                          ></span>
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
                          <label
                            className="form-check-label ms-2"
                            htmlFor="flexCheckDefault"
                          >
                            Remember Me
                          </label>
                        </div>
                        <div className="">
                          <Link to={route.forgotpassword} className="link-2">
                            Forgot Password ?
                          </Link>
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
                              Signing In...
                            </>
                          ) : (
                            <>
                              Login <i className="isax isax-arrow-right-3 ms-1" />
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
                      Don't have an account?
                      <Link to={route.register} className="link-2 ms-1">
                        {" "}
                        Sign up
                      </Link>
                    </div>
                    {/* /Login */}
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

export default Login;
