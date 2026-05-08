import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import Header from "../core/common/header/header";
import BackToTop from "../core/common/backtotop/backToTop";
import Footer from "./HomePages/home-one/footer";

/* Prefixes for dashboard/instructor/admin pages — they provide their
   own luxury layout (topbar + sidebar) via LuxuryDashboardLayout.
   Also includes full-screen pages like course-watch that own their
   entire viewport (no public header/footer).                          */
const DASHBOARD_PREFIXES = [
  '/student/',
  '/instructor/',
  '/admin/',
  '/course/add-course',
  '/course/course-watch',
];

const Feature = () => {
  const location = useLocation();

  const isDashboard = DASHBOARD_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  /* Dashboard pages render their own LuxuryDashboardLayout — skip
     the public header & footer entirely for those routes.             */
  if (isDashboard) {
    return (
      <div className="main-wrapper">
        <Outlet />
        <div className="sidebar-overlay" />
      </div>
    );
  }

  const homeVariant =
    location.pathname === '/index-3' ? 'home-3' :
    location.pathname === '/index-4' ? 'home-4' :
    location.pathname === '/index-6' ? 'home-six' : '';

  return (
    <>
      <div className="main-wrapper">
        <div className={homeVariant}>
          <Header />
          <Outlet />
          <Footer />
          <BackToTop />
        </div>
        <div className="sidebar-overlay" />
      </div>
    </>
  );
};

export default Feature;
