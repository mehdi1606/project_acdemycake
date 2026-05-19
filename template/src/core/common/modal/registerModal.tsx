import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import ImageWithBasePath from '../imageWithBasePath';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { register, clearError } from '../../redux/authSlice';
import { message } from 'antd';
import { all_routes } from '../../../feature-module/router/all_routes';

type PasswordField = 'password' | 'confirmPassword';

const RegisterModal = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const routes = all_routes;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      errors.fullName = 'Full name must be between 2 and 100 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms of service';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const closeModal = () => {
    const modalElement = document.getElementById('register-modal');
    if (modalElement) {
      const modalInstance = (window as unknown as { bootstrap?: { Modal: { getInstance: (el: HTMLElement) => { hide: () => void } | null } } }).bootstrap?.Modal?.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
        })
      ).unwrap();

      // Close modal
      closeModal();

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
      });

      // Show success message and redirect to login page
      message.success('Registration successful! Please check your email to verify your account.');
      navigate(routes.login, {
        state: {
          registrationSuccess: true,
          email: formData.email
        }
      });
    } catch {
      // Error is handled by Redux
    }
  };

  return (
    <>
      {/* Register Modal */}
      <div className="modal fade" id="register-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header d-flex align-items-center justify-content-end pb-0 border-0">
              <Link to="#" data-bs-dismiss="modal">
                <i className="ti ti-x fs-20" />
              </Link>
            </div>
            <div className="modal-body p-4 pt-0">
              <form onSubmit={handleSubmit}>
                <div className="text-center border-bottom mb-3">
                  <h5 className="mb-1">Sign Up</h5>
                  <p className="mb-3">Create your Academy Account</p>
                </div>

                {error && (
                  <div className="alert alert-danger mb-3" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-2">
                  <label className="form-label">Full Name</label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-user" />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      className={`form-control form-control-lg ${validationErrors.fullName ? 'is-invalid' : ''}`}
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      minLength={2}
                      maxLength={100}
                    />
                  </div>
                  {validationErrors.fullName && (
                    <div className="invalid-feedback d-block">{validationErrors.fullName}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label">Email</label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-message" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className={`form-control form-control-lg ${validationErrors.email ? 'is-invalid' : ''}`}
                      placeholder="Enter Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.email && (
                    <div className="invalid-feedback d-block">{validationErrors.email}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label">Phone <span className="text-muted">(Optional)</span></label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-call" />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control form-control-lg"
                      placeholder="Enter Phone Number"
                      value={formData.phone}
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
                      type={passwordVisibility.password ? 'text' : 'password'}
                      name="password"
                      className={`form-control form-control-lg pass-input ${validationErrors.password ? 'is-invalid' : ''}`}
                      placeholder="Enter Password (min 8 characters)"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      minLength={8}
                    />
                    <span
                      className={`isax toggle-passwords ${
                        passwordVisibility.password ? 'isax-eye' : 'isax-eye-slash'
                      }`}
                      onClick={() => togglePasswordVisibility('password')}
                    />
                  </div>
                  {validationErrors.password && (
                    <div className="invalid-feedback d-block">{validationErrors.password}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-lock" />
                    </span>
                    <input
                      type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className={`form-control form-control-lg pass-input ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <span
                      className={`isax toggle-passwords ${
                        passwordVisibility.confirmPassword ? 'isax-eye' : 'isax-eye-slash'
                      }`}
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <div className="invalid-feedback d-block">{validationErrors.confirmPassword}</div>
                  )}
                </div>

                <div className="mt-3 mb-3">
                  <div className="d-flex">
                    <div className="form-check d-flex align-items-center mb-2">
                      <input
                        className={`form-check-input mt-0 ${validationErrors.agreeToTerms ? 'is-invalid' : ''}`}
                        type="checkbox"
                        name="agreeToTerms"
                        id="agree"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      <label
                        className="form-check-label ms-2 text-gray-9 fs-14"
                        htmlFor="agree"
                      >
                        I agree with the&nbsp;
                        <Link to="/terms-conditions" className="link-primary fw-medium">
                          Terms Of Service.
                        </Link>
                      </label>
                    </div>
                  </div>
                  {validationErrors.agreeToTerms && (
                    <div className="invalid-feedback d-block">{validationErrors.agreeToTerms}</div>
                  )}
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Register
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
                    Already have an account?{' '}
                    <Link
                      to="#"
                      className="link-primary fw-medium"
                      data-bs-toggle="modal"
                      data-bs-target="#login-modal"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Register Modal */}
    </>
  );
};

export default RegisterModal;
