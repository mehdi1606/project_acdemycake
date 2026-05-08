import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

/* Auth-route shell — renders the outlet directly.
   Error / maintenance pages keep their bg treatment; all other
   auth pages (login, register, forgot-password …) render clean
   with no extra wrappers so the sl-auth full-screen layout works. */
const AuthFeature = () => {
  const location = useLocation();
  const [isError, setIsError] = React.useState(false);

  useEffect(() => {
    const errorPages =
      location.pathname === "/under-maintenance" ||
      location.pathname === "/error-404" ||
      location.pathname === "/error-500";

    if (errorPages) {
      document.body.classList.add("bg-primary-transparent");
      setIsError(true);
    } else {
      setIsError(false);
      document.body.classList.remove("bg-primary-transparent");
    }

    return () => {
      document.body.classList.remove("bg-primary-transparent");
    };
  }, [location.pathname]);

  const comingSoon = location.pathname === "/pages/coming-soon";

  if (isError) return <Outlet />;

  if (comingSoon) {
    return (
      <div className="coming-soon-wrapper">
        <Outlet />
      </div>
    );
  }

  // Login / Register / Forgot-password — full-screen, no wrappers
  return <Outlet />;
};

export default AuthFeature;
