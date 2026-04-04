import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ImageWithBasePath from '../imageWithBasePath';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { login, clearError } from '../../redux/authSlice';
import { message } from 'antd';

const LoginModal = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error as user types
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    if (!formData.email || !formData.password) {
      message.error('Please fill in all fields');
      return;
    }

    try {
      const result = await dispatch(
        login({
          email: formData.email,
          password: formData.password,
        })
      ).unwrap();

      // Close modal
      const modalElement = document.getElementById('login-modal');
      if (modalElement) {
        const modalInstance = (window as unknown as { bootstrap?: { Modal: { getInstance: (el: HTMLElement) => { hide: () => void } | null } } }).bootstrap?.Modal?.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      }

      message.success('Welcome back!');

      // Redirect based on role
      if (result.role === 'INSTRUCTOR') {
        navigate('/instructor/instructor-dashboard');
      } else if (result.role === 'ADMIN') {
        navigate('/admin/admin-dashboard');
      } else {
        navigate('/student/student-dashboard');
      }
    } catch {
      // Error is handled by Redux
    }
  };

  return (
    <>
      {/* Login Modal */}
      <div className="modal fade" id="login-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header d-flex align-items-center justify-content-end pb-0 border-0">
              <Link to="#" data-bs-dismiss="modal">
                <i className="ti ti-x fs-20" />
              </Link>
            </div>
            <div className="modal-body p-4 pt-0">
              <form onSubmit={handleSubmit}>
                <div className="text-center mb-3">
                  <h5 className="mb-1">Sign In</h5>
                  <p>Sign in to access your Academy account</p>
                </div>

                {error && (
                  <div className="alert alert-danger mb-3" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-2">
                  <label className="form-label">Email</label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-message" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className="form-control form-control-lg"
                      placeholder="Enter Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label">Password</label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-lock" />
                    </span>
                    <input
                      type={isPasswordVisible ? 'text' : 'password'}
                      name="password"
                      className="form-control form-control-lg pass-input"
                      placeholder="Enter Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <span
                      className="input-icon-addon toggle-password"
                      onClick={togglePasswordVisibility}
                    >
                      <i
                        className={`isax ${
                          isPasswordVisible ? 'isax-eye' : 'isax-eye-slash'
                        }`}
                      />
                    </span>
                  </div>
                </div>
                <div className="mt-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <div className="form-check d-flex align-items-center mb-2">
                      <input
                        className="form-check-input mt-0"
                        type="checkbox"
                        name="rememberMe"
                        id="remembers_me"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      <label
                        className="form-check-label ms-2 text-gray-9 fs-14"
                        htmlFor="remembers_me"
                      >
                        Remember Me
                      </label>
                    </div>
                    <Link
                      to="#"
                      className="link-primary fw-medium fs-14 mb-2"
                      data-bs-toggle="modal"
                      data-bs-target="#forgot-modal"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>
                <div className="mb-3">
                  <button
                    type="submit"
                    className="btn btn-xl btn-primary d-flex align-items-center justify-content-center w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Login
                        <i className="isax isax-arrow-right-3 ms-2" />
                      </>
                    )}
                  </button>
                </div>
                <div className="login-or mb-3">
                  <span className="span-or">Or</span>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <Link
                    to="#"
                    className="btn btn-light flex-fill d-flex align-items-center justify-content-center me-2"
                  >
                    <ImageWithBasePath
                      src="assets/img/icons/google-icon.svg"
                      className="me-2"
                      alt="Img"
                    />
                    Google
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-light flex-fill d-flex align-items-center justify-content-center"
                  >
                    <ImageWithBasePath
                      src="assets/img/icons/fb-icon.svg"
                      className="me-2"
                      alt="Img"
                    />
                    Facebook
                  </Link>
                </div>
                <div className="d-flex justify-content-center">
                  <p className="fs-14">
                    Don't you have an account?{' '}
                    <Link
                      to="#"
                      className="link-primary fw-medium"
                      data-bs-toggle="modal"
                      data-bs-target="#register-modal"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Login Modal */}
    </>
  );
};

export default LoginModal;
