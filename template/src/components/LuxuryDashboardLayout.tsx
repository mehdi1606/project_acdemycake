import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LuxuryTopbar from './LuxuryTopbar';
import LuxurySidebar from './LuxurySidebar';
import { useAppDispatch } from '../core/redux/hooks';
import { fetchCurrentUser } from '../core/redux/authSlice';

const USER_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

interface LuxuryDashboardLayoutProps {
  children: React.ReactNode;
}

const LuxuryDashboardLayout: React.FC<LuxuryDashboardLayoutProps> = ({ children }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch();
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const lastRefresh = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastRefresh.current > USER_REFRESH_INTERVAL) {
      lastRefresh.current = now;
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, children]);

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

      {/* Floating WhatsApp community button */}
      <a
        href="https://chat.whatsapp.com/GYeg9kfflBBLhInu1ghzJM"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Group"
        title={t('common.whatsappGroup', 'Join our WhatsApp group')}
        style={{
          position: 'fixed',
          bottom: 24,
          insetInlineEnd: 24,
          zIndex: 1040,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37,211,102,0.4)',
          textDecoration: 'none',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,211,102,0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.4)';
        }}
      >
        <i className="fa-brands fa-whatsapp" style={{ fontSize: 30, color: '#fff' }} />
      </a>
    </div>
  );
};

export default LuxuryDashboardLayout;
