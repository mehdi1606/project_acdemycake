import React, { useState, useEffect } from 'react';
import LuxuryTopbar from './LuxuryTopbar';
import LuxurySidebar from './LuxurySidebar';

interface LuxuryDashboardLayoutProps {
  children: React.ReactNode;
}

const LuxuryDashboardLayout: React.FC<LuxuryDashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    if (window.innerWidth < 992) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  /* Close mobile sidebar on resize to desktop */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={[
        'luxury-dashboard',
        sidebarCollapsed  ? 'sidebar-collapsed'    : '',
        mobileSidebarOpen ? 'mobile-sidebar-open'  : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Fixed top bar */}
      <LuxuryTopbar onSidebarToggle={handleSidebarToggle} />

      {/* Below the topbar: sidebar + content */}
      <div className="luxury-body">
        {/* Mobile overlay — tapping it closes the sidebar */}
        {mobileSidebarOpen && (
          <div
            className="sidebar-mobile-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Collapsible sidebar */}
        <LuxurySidebar
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />

        {/* Page content */}
        <main className="luxury-main">{children}</main>
      </div>
    </div>
  );
};

export default LuxuryDashboardLayout;
