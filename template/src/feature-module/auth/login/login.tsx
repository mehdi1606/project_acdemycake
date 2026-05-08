import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { useAppDispatch, useAppSelector } from "../../../core/redux/hooks";
import { login, clearError } from "../../../core/redux/authSlice";
import { authService } from "../../../services/api/auth.service";
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

/* ── Floating gold particle ── */
const Particle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="sl-auth__particle" style={style} />
);

const Login = () => {
  const { message } = App.useApp();

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const route = all_routes;

  useEffect(() => {
    if (locationState?.registrationSuccess) {
      setShowVerificationAlert(true);
      if (locationState.email) {
        setRegisteredEmail(locationState.email);
        setFormData((prev) => ({ ...prev, email: locationState.email || "" }));
      }
      navigate(location.pathname, { replace: true });
    }
  }, [locationState, navigate, location.pathname]);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "ADMIN") navigate(route.adminDashboard);
      else if (user.role === "INSTRUCTOR") navigate(route.instructorDashboard);
      else navigate(route.studentDashboard);
    }
  }, [isAuthenticated, user, navigate, route]);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (error) dispatch(clearError());
  };

  const validateField = (name: string, value: string): string | undefined => {
    if (name === "email") {
      if (!value.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
    }
    if (name === "password") {
      if (!value) return "Password is required.";
    }
    return undefined;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  /* Whether the current error is "email not verified" */
  const isVerifyError = !!error && error.toLowerCase().includes('verify your email');

  const handleResendVerification = async () => {
    if (!formData.email || resendState !== 'idle') return;
    setResendState('sending');
    try {
      await authService.resendVerificationEmail(formData.email);
      setResendState('sent');
    } catch {
      setResendState('idle');
      message.error({ content: 'Could not send the email. Please try again.', duration: 4 });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: FieldErrors = {
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    };
    if (Object.values(errors).some(Boolean)) { setFieldErrors(errors); return; }
    try {
      await dispatch(login(formData)).unwrap();
    } catch (err: unknown) {
      const errorMsg = typeof err === "string" ? err : "Invalid credentials. Please check your email and password.";
      message.error({ content: errorMsg, duration: 5, key: "login-error" });
    }
  };

  /* ── Particles data ── */
  const particles = [
    { top: "8%",  left: "12%", width: 6,  height: 6,  animationDelay: "0s",    animationDuration: "7s"  },
    { top: "20%", left: "82%", width: 4,  height: 4,  animationDelay: "1.2s",  animationDuration: "9s"  },
    { top: "55%", left: "6%",  width: 8,  height: 8,  animationDelay: "2.5s",  animationDuration: "11s" },
    { top: "72%", left: "75%", width: 5,  height: 5,  animationDelay: "0.8s",  animationDuration: "8s"  },
    { top: "38%", left: "90%", width: 3,  height: 3,  animationDelay: "3s",    animationDuration: "6s"  },
    { top: "88%", left: "40%", width: 7,  height: 7,  animationDelay: "1.8s",  animationDuration: "10s" },
    { top: "14%", left: "55%", width: 4,  height: 4,  animationDelay: "4s",    animationDuration: "8s"  },
    { top: "63%", left: "28%", width: 5,  height: 5,  animationDelay: "0.5s",  animationDuration: "12s" },
  ];

  return (
    <div className="sl-auth">
      {/* ════════════════════════════════════════════════════════
          LEFT — Cinematic brand panel
      ════════════════════════════════════════════════════════ */}
      <div className="sl-auth__panel sl-auth__panel--left d-none d-lg-flex">
        {/* Background cake image */}
        <div
          className="sl-auth__panel-bg"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/assets/img/Mockups/012.jpg)`,
          }}
        />
        {/* Dark overlay */}
        <div className="sl-auth__panel-overlay" />

        {/* Floating particles */}
        {particles.map((p, i) => (
          <Particle
            key={i}
            style={{
              top: p.top, left: p.left,
              width: p.width, height: p.height,
              animationDelay: p.animationDelay,
              animationDuration: p.animationDuration,
            }}
          />
        ))}

        {/* Panel content */}
        <div className="sl-auth__panel-content">
          {/* Logo mark */}
          <div className="sl-auth__panel-logo">
            <img
              src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
              alt="SARALÖWE Academy"
              style={{ height: 56, width: 56, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          <div className="sl-auth__panel-tagline">The Art of Cake Couture</div>

          <h2 className="sl-auth__panel-headline">
            Craft. Create.<br />
            <span className="sl-auth__panel-headline--gold">Inspire.</span>
          </h2>

          <p className="sl-auth__panel-desc">
            Join a world-class atelier where luxury cake design meets artisan mastery.
            Learn from podium-winning instructors and transform your passion.
          </p>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RIGHT — Form panel
      ════════════════════════════════════════════════════════ */}
      <div className="sl-auth__panel sl-auth__panel--right">
        <div className="sl-auth__form-wrap">

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

          {/* Heading */}
          <h1 className="sl-auth__form-title">Welcome Back</h1>
          <p className="sl-auth__form-subtitle">Sign in to continue your journey</p>

          {/* Registration success alert */}
          {showVerificationAlert && (
            <Alert
              message="Registration Successful!"
              description={
                <div>
                  <p className="mb-2">We've sent a verification email to <strong>{registeredEmail}</strong>.</p>
                  <p className="mb-0">Please check your inbox and click the verification link before logging in.</p>
                </div>
              }
              type="success"
              showIcon
              closable
              onClose={() => setShowVerificationAlert(false)}
              className="mb-4"
            />
          )}

          {/* Backend error alert — smart: detects "verify email" and shows resend CTA */}
          {error && !isVerifyError && (
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
          {error && isVerifyError && (
            <Alert
              type="warning"
              showIcon
              closable
              onClose={() => { dispatch(clearError()); setResendState('idle'); }}
              className="mb-3"
              style={{ borderRadius: 8 }}
              message="Email Not Verified"
              description={
                resendState === 'sent' ? (
                  <span style={{ color: '#3a7d44' }}>
                    <strong>Verification email sent!</strong> Check your inbox and click the link.
                  </span>
                ) : (
                  <span>
                    Please verify your email before signing in.{' '}
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendState === 'sending'}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#C5912C', fontWeight: 700, cursor: 'pointer',
                        textDecoration: 'underline', fontSize: 'inherit',
                      }}
                    >
                      {resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
                    </button>
                  </span>
                )
              }
            />
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="sl-auth__field">
              <label className="sl-auth__label">
                Email <span className="sl-auth__required">*</span>
              </label>
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
              {fieldErrors.email && (
                <div className="sl-auth__field-error">
                  <i className="isax isax-info-circle me-1" />
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="sl-auth__field">
              <label className="sl-auth__label">
                Password <span className="sl-auth__required">*</span>
              </label>
              <div className="sl-auth__input-wrap">
                <input
                  type={passwordVisibility.password ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`sl-auth__input${fieldErrors.password ? " sl-auth__input--error" : ""}`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <span
                  className={`sl-auth__toggle-pw isax ${passwordVisibility.password ? "isax-eye" : "isax-eye-slash"}`}
                  onClick={() => togglePasswordVisibility("password")}
                />
              </div>
              {fieldErrors.password && (
                <div className="sl-auth__field-error">
                  <i className="isax isax-info-circle me-1" />
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="sl-auth__row-between">
              <label className="sl-auth__remember">
                <input
                  type="checkbox"
                  className="sl-auth__checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
              <Link to={route.forgotpassword} className="sl-auth__forgot">
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="sl-auth__submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Spin size="small" className="me-2" />Signing In...</>
              ) : (
                <>Sign In <i className="isax isax-arrow-right-3 ms-1" /></>
              )}
            </button>
          </form>

          {/* Sign-up link */}
          <div className="sl-auth__switch">
            Don't have an account?{" "}
            <Link to={route.register} className="sl-auth__switch-link">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
