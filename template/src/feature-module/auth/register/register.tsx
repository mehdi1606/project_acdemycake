import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { useAppDispatch, useAppSelector } from "../../../core/redux/hooks";
import { register, clearError } from "../../../core/redux/authSlice";
import { Spin, Alert } from "antd";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const hasNumber  = (v: string) => /[0-9]/.test(v);
const hasMixed   = (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v);
const hasSpecial = (v: string) => /[!#@$%^&*)(+=._-]/.test(v);

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

/* ── Particle ── */
const Particle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="sl-auth__particle" style={style} />
);

const Register: React.FC = () => {
  const [eye, setEye] = useState(true);
  const [eyeConfirm, setEyeConfirm] = useState(true);
  const [strength, setStrength] = useState("");
  const [validationError, setValidationError] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);
  const route = all_routes;

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => {
    if (isAuthenticated) navigate(route.studentDashboard);
  }, [isAuthenticated, navigate, route]);

  useEffect(() => {
    if (formData.password) setStrength(strengthColor(strengthIndicator(formData.password)));
    else setStrength("");
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
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (error) dispatch(clearError());
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required.";
        if (value.trim().length < 2) return "Must be at least 2 characters.";
        if (value.trim().length > 100) return "Must not exceed 100 characters.";
        break;
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
        break;
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        break;
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== formData.password) return "Passwords do not match.";
        break;
    }
    return undefined;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const passwordMessages = () => {
    switch (validationError) {
      case 2: return <span className="sl-auth__pw-hint sl-auth__pw-hint--weak"><ImageWithBasePath src="assets/img/icon/angry.svg" className="me-2" alt="" />Weak — at least 8 characters</span>;
      case 3: return <span className="sl-auth__pw-hint sl-auth__pw-hint--avg"><ImageWithBasePath src="assets/img/icon/anguish.svg" className="me-2" alt="" />Average — add a number</span>;
      case 4: return <span className="sl-auth__pw-hint sl-auth__pw-hint--good"><ImageWithBasePath src="assets/img/icon/smile.svg" className="me-2" alt="" />Almost — add a special character</span>;
      case 5: return <span className="sl-auth__pw-hint sl-auth__pw-hint--great"><ImageWithBasePath src="assets/img/icon/smile.svg" className="me-2" alt="" />Secure password ✓</span>;
      default: return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: FieldErrors = {
      fullName:        validateField("fullName", formData.fullName),
      email:           validateField("email", formData.email),
      password:        validateField("password", formData.password),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword),
    };
    if (!agreeTerms) errors.terms = "You must agree to the Terms of Service and Privacy Policy.";
    if (Object.values(errors).some(Boolean)) { setFieldErrors(errors); return; }

    try {
      await dispatch(register({
        fullName: formData.fullName,
        email:    formData.email,
        password: formData.password,
        phone:    formData.phone || undefined,
      })).unwrap();
      navigate(route.login, { state: { registrationSuccess: true, email: formData.email } });
    } catch { /* Error shown via Alert */ }
  };

  const particles = [
    { top: "10%", left: "15%", width: 5,  height: 5,  animationDelay: "0s",   animationDuration: "8s"  },
    { top: "25%", left: "78%", width: 7,  height: 7,  animationDelay: "1.5s", animationDuration: "10s" },
    { top: "50%", left: "8%",  width: 4,  height: 4,  animationDelay: "3s",   animationDuration: "7s"  },
    { top: "70%", left: "70%", width: 6,  height: 6,  animationDelay: "0.6s", animationDuration: "9s"  },
    { top: "85%", left: "35%", width: 3,  height: 3,  animationDelay: "2s",   animationDuration: "11s" },
    { top: "40%", left: "88%", width: 5,  height: 5,  animationDelay: "4.5s", animationDuration: "6s"  },
    { top: "18%", left: "48%", width: 4,  height: 4,  animationDelay: "1s",   animationDuration: "12s" },
    { top: "60%", left: "22%", width: 8,  height: 8,  animationDelay: "2.8s", animationDuration: "8s"  },
  ];

  return (
    <div className="sl-auth">
      {/* ════════════════════════════════════════════════════════
          LEFT — Cinematic brand panel
      ════════════════════════════════════════════════════════ */}
      <div className="sl-auth__panel sl-auth__panel--left d-none d-lg-flex">
        <div
          className="sl-auth__panel-bg"
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/img/Mockups/012.jpg)` }}
        />
        <div className="sl-auth__panel-overlay" />
        {particles.map((p, i) => (
          <Particle key={i} style={{ top: p.top, left: p.left, width: p.width, height: p.height, animationDelay: p.animationDelay, animationDuration: p.animationDuration }} />
        ))}
        <div className="sl-auth__panel-content">
          <div className="sl-auth__panel-logo">
            <img
              src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
              alt="SARALÖWE Academy"
              style={{ height: 56, width: 56, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="sl-auth__panel-tagline">Begin Your Artisan Journey</div>
          <h2 className="sl-auth__panel-headline">
            Learn. Grow.<br />
            <span className="sl-auth__panel-headline--gold">Excel.</span>
          </h2>
          <p className="sl-auth__panel-desc">
            Create your free account and unlock access to world-class masterclasses
            in luxury cake design, sugar artistry, and couture patisserie.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RIGHT — Form panel
      ════════════════════════════════════════════════════════ */}
      <div className="sl-auth__panel sl-auth__panel--right">
        <div className="sl-auth__form-wrap sl-auth__form-wrap--tall">

          {/* Logo header */}
          <div className="sl-auth__form-header">
            <Link to={route.homeone} className="sl-auth__logo-link">
              <img
                src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                alt="SARALÖWE Academy"
                style={{ height: 42, width: 42, objectFit: "contain" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="sl-auth__logo-text">SARALÖWE</span>
            </Link>
            <Link to={route.homeone} className="sl-auth__back-link">
              <i className="isax isax-arrow-left-2 me-1" />Back to Home
            </Link>
          </div>

          <h1 className="sl-auth__form-title">Create Your Account</h1>
          <p className="sl-auth__form-subtitle">Join as a student and start learning today</p>

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

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="sl-auth__field">
              <label className="sl-auth__label">Full Name <span className="sl-auth__required">*</span></label>
              <div className="sl-auth__input-wrap">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`sl-auth__input${fieldErrors.fullName ? " sl-auth__input--error" : ""}`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  autoComplete="name"
                />
                <i className="isax isax-user sl-auth__input-icon" />
              </div>
              {fieldErrors.fullName && <div className="sl-auth__field-error"><i className="isax isax-info-circle me-1" />{fieldErrors.fullName}</div>}
            </div>

            {/* Email */}
            <div className="sl-auth__field">
              <label className="sl-auth__label">Email <span className="sl-auth__required">*</span></label>
              <div className="sl-auth__input-wrap">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`sl-auth__input${fieldErrors.email ? " sl-auth__input--error" : ""}`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  autoComplete="email"
                />
                <i className="isax isax-sms sl-auth__input-icon" />
              </div>
              {fieldErrors.email && <div className="sl-auth__field-error"><i className="isax isax-info-circle me-1" />{fieldErrors.email}</div>}
            </div>

            {/* Phone */}
            <div className="sl-auth__field">
              <label className="sl-auth__label">Phone <span className="sl-auth__label--optional">(Optional)</span></label>
              <div className="sl-auth__input-wrap">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="sl-auth__input"
                  placeholder="Enter your phone number"
                  disabled={isLoading}
                  autoComplete="tel"
                />
                <i className="isax isax-call sl-auth__input-icon" />
              </div>
            </div>

            {/* Password */}
            <div className="sl-auth__field">
              <label className="sl-auth__label">Password <span className="sl-auth__required">*</span></label>
              <div className="sl-auth__input-wrap">
                <input
                  type={eye ? "password" : "text"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`sl-auth__input${fieldErrors.password ? " sl-auth__input--error" : ""}`}
                  placeholder="Create a password (min 8 characters)"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <span
                  className={`sl-auth__toggle-pw isax ${eye ? "isax-eye-slash" : "isax-eye"}`}
                  onClick={() => setEye((p) => !p)}
                />
              </div>
              {/* Strength bar */}
              <div
                className={`sl-auth__pw-strength ${
                  strength === "poor" ? "poor-active" :
                  strength === "weak" ? "avg-active" :
                  strength === "strong" ? "strong-active" :
                  strength === "heavy" ? "heavy-active" : ""
                }`}
              >
                <span /><span /><span /><span />
              </div>
              {passwordMessages()}
              {fieldErrors.password && <div className="sl-auth__field-error"><i className="isax isax-info-circle me-1" />{fieldErrors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="sl-auth__field">
              <label className="sl-auth__label">Confirm Password <span className="sl-auth__required">*</span></label>
              <div className="sl-auth__input-wrap">
                <input
                  type={eyeConfirm ? "password" : "text"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`sl-auth__input${fieldErrors.confirmPassword ? " sl-auth__input--error" : ""}`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <span
                  className={`sl-auth__toggle-pw isax ${eyeConfirm ? "isax-eye-slash" : "isax-eye"}`}
                  onClick={() => setEyeConfirm((p) => !p)}
                />
              </div>
              {fieldErrors.confirmPassword && <div className="sl-auth__field-error"><i className="isax isax-info-circle me-1" />{fieldErrors.confirmPassword}</div>}
            </div>

            {/* Terms */}
            <div className="sl-auth__field sl-auth__field--terms">
              <label className="sl-auth__remember">
                <input
                  type="checkbox"
                  className={`sl-auth__checkbox${fieldErrors.terms ? " sl-auth__checkbox--error" : ""}`}
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (fieldErrors.terms) setFieldErrors((p) => ({ ...p, terms: undefined }));
                  }}
                />
                <span>
                  I agree to the{" "}
                  <Link to={route.termsConditions} className="sl-auth__terms-link">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to={route.privacyPolicy} className="sl-auth__terms-link">Privacy Policy</Link>
                </span>
              </label>
              {fieldErrors.terms && <div className="sl-auth__field-error mt-1"><i className="isax isax-info-circle me-1" />{fieldErrors.terms}</div>}
            </div>

            {/* Submit */}
            <button type="submit" className="sl-auth__submit" disabled={isLoading}>
              {isLoading ? (
                <><Spin size="small" className="me-2" />Creating Account...</>
              ) : (
                <>Create Account <i className="isax isax-arrow-right-3 ms-1" /></>
              )}
            </button>
          </form>

          <div className="sl-auth__switch">
            Already have an account?{" "}
            <Link to={route.login} className="sl-auth__switch-link">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
