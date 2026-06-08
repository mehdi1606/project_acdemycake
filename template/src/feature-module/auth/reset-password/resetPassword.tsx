import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { authService } from "../../../services/api/auth.service";
import { extractApiError } from "../../../services/api/error.utils";
import { Spin, Alert } from "antd";
import { useTranslation } from "react-i18next";

const Particle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="sl-auth__particle" style={style} />
);

const particles = [
  { top: "8%",  left: "12%", width: 6,  height: 6,  animationDelay: "0s",   animationDuration: "7s"  },
  { top: "20%", left: "82%", width: 4,  height: 4,  animationDelay: "1.2s", animationDuration: "9s"  },
  { top: "55%", left: "6%",  width: 8,  height: 8,  animationDelay: "2.5s", animationDuration: "11s" },
  { top: "72%", left: "75%", width: 5,  height: 5,  animationDelay: "0.8s", animationDuration: "8s"  },
  { top: "38%", left: "90%", width: 3,  height: 3,  animationDelay: "3s",   animationDuration: "6s"  },
  { top: "88%", left: "40%", width: 7,  height: 7,  animationDelay: "1.8s", animationDuration: "10s" },
  { top: "14%", left: "55%", width: 4,  height: 4,  animationDelay: "4s",   animationDuration: "8s"  },
  { top: "63%", left: "28%", width: 5,  height: 5,  animationDelay: "0.5s", animationDuration: "12s" },
];

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const route = all_routes;

  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ password: false, confirmPassword: false });
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* If no token in URL, redirect to forgot-password immediately */
  useEffect(() => {
    if (!token) {
      navigate(route.forgotpassword, { replace: true });
    }
  }, [token, navigate, route.forgotpassword]);

  const validateField = (name: string, value: string): string | undefined => {
    if (name === "password") {
      if (!value) return t("auth.resetPassword.passwordRequired", "Password is required.");
      if (value.length < 8) return t("auth.resetPassword.passwordTooShort", "Password must be at least 8 characters.");
    }
    if (name === "confirmPassword") {
      if (!value) return t("auth.resetPassword.confirmRequired", "Please confirm your password.");
      if (value !== formData.password) return t("auth.resetPassword.passwordMismatch", "Passwords do not match.");
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError("");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = {
      password: validateField("password", formData.password),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword),
    };
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setApiError("");
    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
    } catch (err: unknown) {
      setApiError(extractApiError(err, t("auth.resetPassword.failedError", "Failed to reset password. The link may have expired.")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sl-auth">
      {/* ── LEFT — brand panel ───────────────────────────────── */}
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
          <div className="sl-auth__panel-tagline">{t("auth.login.panelTagline", "The Art of Cake Couture")}</div>
          <h2 className="sl-auth__panel-headline">
            {t("auth.login.panelHeadline", "Craft. Create.")}<br />
            <span className="sl-auth__panel-headline--gold">{t("auth.login.panelInspire", "Inspire.")}</span>
          </h2>
          <p className="sl-auth__panel-desc">
            {t("auth.login.panelDesc", "Join a world-class atelier where luxury cake design meets artisan mastery. Learn from podium-winning instructors and transform your passion.")}
          </p>
        </div>
      </div>

      {/* ── RIGHT — form panel ───────────────────────────────── */}
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
            <Link to={route.login} className="sl-auth__back-link">
              <i className="isax isax-arrow-left-2 me-1" />
              {t("auth.login.signIn", "Sign In")}
            </Link>
          </div>

          {success ? (
            /* ── Success state ── */
            <>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(60, 140, 80, 0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem",
                }}>
                  <i className="isax isax-tick-circle" style={{ fontSize: 32, color: "#3a7d44" }} />
                </div>
                <h1 className="sl-auth__form-title" style={{ textAlign: "center" }}>
                  {t("auth.resetPassword.successTitle", "Password Reset!")}
                </h1>
                <p className="sl-auth__form-subtitle" style={{ textAlign: "center" }}>
                  {t("auth.resetPassword.successDesc", "Your password has been updated successfully. You can now sign in with your new password.")}
                </p>
              </div>
              <button
                className="sl-auth__submit"
                onClick={() => navigate(route.login)}
              >
                {t("auth.login.signIn", "Sign In")} <i className="isax isax-arrow-right-3 ms-1" />
              </button>
            </>
          ) : (
            /* ── Form state ── */
            <>
              <h1 className="sl-auth__form-title">
                {t("auth.resetPassword.title", "New Password")}
              </h1>
              <p className="sl-auth__form-subtitle">
                {t("auth.resetPassword.subtitle", "Choose a strong password to secure your account.")}
              </p>

              {apiError && (
                <Alert
                  message={apiError}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setApiError("")}
                  className="mb-3"
                  style={{ borderRadius: 8, marginBottom: "1rem" }}
                />
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className="sl-auth__field">
                  <label className="sl-auth__label">
                    {t("auth.resetPassword.newPassword", "New Password")}
                    <span className="sl-auth__required"> *</span>
                  </label>
                  <div className="sl-auth__input-wrap">
                    <input
                      type={showPassword.password ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`sl-auth__input${fieldErrors.password ? " sl-auth__input--error" : ""}`}
                      placeholder={t("auth.resetPassword.newPasswordPlaceholder", "Enter new password")}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <span
                      className={`sl-auth__toggle-pw isax ${showPassword.password ? "isax-eye" : "isax-eye-slash"}`}
                      onClick={() => setShowPassword((p) => ({ ...p, password: !p.password }))}
                    />
                  </div>
                  {fieldErrors.password && (
                    <div className="sl-auth__field-error">
                      <i className="isax isax-info-circle me-1" />
                      {fieldErrors.password}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="sl-auth__field">
                  <label className="sl-auth__label">
                    {t("auth.resetPassword.confirmPassword", "Confirm Password")}
                    <span className="sl-auth__required"> *</span>
                  </label>
                  <div className="sl-auth__input-wrap">
                    <input
                      type={showPassword.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`sl-auth__input${fieldErrors.confirmPassword ? " sl-auth__input--error" : ""}`}
                      placeholder={t("auth.resetPassword.confirmPasswordPlaceholder", "Re-enter new password")}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <span
                      className={`sl-auth__toggle-pw isax ${showPassword.confirmPassword ? "isax-eye" : "isax-eye-slash"}`}
                      onClick={() => setShowPassword((p) => ({ ...p, confirmPassword: !p.confirmPassword }))}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <div className="sl-auth__field-error">
                      <i className="isax isax-info-circle me-1" />
                      {fieldErrors.confirmPassword}
                    </div>
                  )}
                </div>

                {/* Password hint */}
                <p style={{ fontSize: "0.78rem", color: "#9A8888", marginBottom: "1.25rem", marginTop: "-0.25rem" }}>
                  {t("auth.resetPassword.passwordHint", "Must be at least 8 characters.")}
                </p>

                <button
                  type="submit"
                  className="sl-auth__submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Spin size="small" className="me-2" />{t("auth.resetPassword.resetting", "Resetting...")}</>
                  ) : (
                    <>{t("auth.resetPassword.resetButton", "Reset Password")} <i className="isax isax-arrow-right-3 ms-1" /></>
                  )}
                </button>
              </form>

              <div className="sl-auth__switch">
                {t("auth.forgotPassword.rememberPassword", "Remember your password?")}{" "}
                <Link to={route.login} className="sl-auth__switch-link">
                  {t("auth.login.signIn", "Sign In")}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
