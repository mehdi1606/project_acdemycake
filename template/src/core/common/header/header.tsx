import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { all_routes } from "../../../feature-module/router/all_routes";
import { setDataTheme } from "../../redux/themeSettingSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logout } from "../../redux/authSlice";
import { getFileUrl } from "../../../environment";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const dataTheme = useAppSelector((state) => state.themeSetting.dataTheme);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const cartCount = useAppSelector((state) => state.cart.items.length);

  const handleDataThemeChange = (theme: string) => {
    dispatch(setDataTheme(theme));
  };

  const onHandleMobileMenu = () => {
    setMobileMenuOpen(true);
    document.getElementsByTagName("html")[0].classList.add("menu-opened");
  };

  const onhandleCloseMenu = () => {
    setMobileMenuOpen(false);
    document.getElementsByTagName("html")[0].classList.remove("menu-opened");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("class", dataTheme);
  }, [dataTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setDropdownOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

  const getDashboardRoute = () => {
    if (user?.role === 'ADMIN') return all_routes.adminDashboard;
    if (user?.role === 'INSTRUCTOR') return all_routes.instructorDashboard;
    return all_routes.studentDashboard;
  };

  const getProfileRoute = () => {
    if (user?.role === 'ADMIN') return all_routes.adminSettings;
    if (user?.role === 'INSTRUCTOR') return all_routes.instructorProfile;
    return all_routes.studentProfile;
  };

  const getSettingsRoute = () => {
    if (user?.role === 'ADMIN') return all_routes.adminSettings;
    if (user?.role === 'INSTRUCTOR') return all_routes.instructorsettings;
    return all_routes.studentSettings;
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleMenuItemClick = (route: string) => {
    setDropdownOpen(false);
    navigate(route);
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'ADMIN': return '#6B1D2A';
      case 'INSTRUCTOR': return '#2D5F3F';
      default: return '#C5973E';
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'ADMIN': return 'Admin';
      case 'INSTRUCTOR': return 'Instructor';
      default: return 'Student';
    }
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path || location.pathname === '/home-one';
    return location.pathname.includes(path);
  };

  /* ── Dropdown Menu Item ── */
  const MenuItem = ({ icon, label, onClick, danger }: {
    icon: string; label: string; onClick: () => void; danger?: boolean;
  }) => (
    <div
      onClick={onClick}
      style={{
        padding: '11px 20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.15s',
        color: danger ? '#6B1D2A' : '#2C1810',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? '#FFF5F5' : '#FAF0ED';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <i className={`isax ${icon}`} style={{ fontSize: 18, color: danger ? '#6B1D2A' : '#8B6D5E', width: 20, textAlign: 'center' }} />
      <span style={{ fontWeight: 500, fontSize: 14 }}>{label}</span>
    </div>
  );

  return (
    <>
      <header
        className={`header-one ${scrolled ? "fixed" : ""}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1050,
          background: scrolled
            ? 'rgba(78, 20, 32, 0.97)'
            : 'linear-gradient(135deg, #4E1420 0%, #3A0F18 100%)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(78, 20, 32, 0.25)' : '0 1px 0 rgba(78, 20, 32, 0.08)',
          transition: 'all 0.4s ease',
        }}
      >
        <div className="container">
          <nav
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              height: 68, gap: 16,
            }}
          >
            {/* ── Left: Hamburger + Logo ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={onHandleMobileMenu}
                className="d-lg-none"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#fff', fontSize: 22, padding: 4,
                }}
              >
                <i className="isax isax-menu" />
              </button>

              {/* Logo */}
              <Link
                to={all_routes.homeone}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  textDecoration: 'none',
                }}
              >
                {/* SVG Logo — gold (#c5912c) variant, perfect on dark bg */}
                <img
                  src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                  alt="SARALÖWE Academy"
                  style={{ height: 42, width: 42, objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 18, fontWeight: 700, color: 'var(--sl-blush, #F5DADF)',
                  letterSpacing: '0.12em', lineHeight: 1, textTransform: 'uppercase',
                }}>
                  SARALÖWE
                </span>
              </Link>
            </div>

            {/* ── Center: Nav Links (Desktop) ── */}
            <div className="d-none d-lg-flex" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[
                { label: 'Home', to: all_routes.homeone, active: isActive('/', true) },
                { label: 'Courses', to: all_routes.courseList, active: isActive('/course') && !isActive('/course-category') },
                { label: 'Masterclasses', to: all_routes.courseCategory, active: isActive('/course-category') },
                { label: 'Community', to: all_routes.blogGrid, active: isActive('/blog') },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    fontSize: 15, fontWeight: link.active ? 600 : 500,
                    color: link.active ? '#C5973E' : 'rgba(255,255,255,0.85)',
                    textDecoration: 'none', transition: 'all 0.2s ease',
                    background: link.active ? 'rgba(197, 151, 62, 0.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!link.active) e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    if (!link.active) e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ── Right: Actions ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => handleDataThemeChange(dataTheme === 'light' ? 'dark-mode' : 'light')}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <i className={`isax ${dataTheme === 'light' ? 'isax-moon' : 'isax-sun-1'}`} />
              </button>

              {/* Cart */}
              <Link
                to={all_routes.courseCart}
                style={{
                  width: 38, height: 38, borderRadius: 10, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  fontSize: 18, transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <i className="isax isax-shopping-cart" />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    minWidth: 15, height: 15, borderRadius: 8,
                    background: '#C5973E', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                    border: '1.5px solid rgba(107,29,42,0.8)',
                  }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated && user ? (
                <>
                  {/* Premium Badge / Get Premium CTA */}
                  {user.role !== 'ADMIN' && (
                    user.subscriptionStatus === 'ACTIVE' ? (
                      <span
                        className="d-none d-md-inline-flex"
                        style={{
                          alignItems: 'center', gap: 5,
                          background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 50%, #C5973E 100%)',
                          color: '#4E1420', fontWeight: 700, fontSize: 12,
                          padding: '6px 14px', borderRadius: 20, marginLeft: 4,
                          boxShadow: '0 2px 10px rgba(212, 175, 55, 0.4)',
                        }}
                      >
                        <i className="isax isax-crown-1" style={{ fontSize: 14 }} />
                        Premium
                      </span>
                    ) : (
                      <Link
                        to={all_routes.pricingPlan}
                        className="d-none d-md-inline-flex"
                        style={{
                          alignItems: 'center', gap: 5, textDecoration: 'none',
                          background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 50%, #C5973E 100%)',
                          color: '#4E1420', fontWeight: 600, fontSize: 12,
                          padding: '7px 16px', borderRadius: 20, marginLeft: 4,
                          boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <i className="isax isax-crown-1" style={{ fontSize: 14 }} />
                        Get Premium
                      </Link>
                    )
                  )}

                  {/* ── User Profile Dropdown ── */}
                  <div ref={dropdownRef} className="d-none d-lg-block" style={{ position: 'relative', marginLeft: 4 }}>
                    <button
                      type="button"
                      onClick={toggleDropdown}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '5px 10px 5px 5px', borderRadius: 28,
                        border: `1.5px solid ${dropdownOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        background: dropdownOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        if (!dropdownOpen) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: getRoleBadgeColor(),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 15,
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.15)',
                      }}>
                        {user.avatarUrl ? (
                          <img src={getFileUrl(user.avatarUrl) ?? user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user.fullName?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>

                      {/* Name + Role */}
                      <div className="d-none d-xl-block" style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                          {user.fullName?.split(' ')[0] || 'User'}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>
                          {getRoleLabel()}
                        </div>
                      </div>

                      {/* Arrow */}
                      <i
                        className={`isax isax-arrow-${dropdownOpen ? 'up' : 'down'}-1`}
                        style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', transition: 'transform 0.2s' }}
                      />
                    </button>

                    {/* ── Dropdown Menu ── */}
                    {dropdownOpen && (
                      <div style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                        minWidth: 260, borderRadius: 14, overflow: 'hidden',
                        background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                        border: '1px solid rgba(107, 29, 42, 0.06)',
                        animation: 'fadeInDown 0.2s ease',
                      }}>
                        {/* User Header */}
                        <div style={{
                          padding: '18px 20px',
                          background: 'linear-gradient(135deg, #4E1420 0%, #2d2d44 100%)',
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                            backgroundColor: getRoleBadgeColor(),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 17, overflow: 'hidden',
                            border: '2px solid rgba(255,255,255,0.15)',
                          }}>
                            {user.avatarUrl ? (
                              <img src={getFileUrl(user.avatarUrl) ?? user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              user.fullName?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user.fullName || 'User'}
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user.email}
                            </div>
                            <span style={{
                              display: 'inline-block', marginTop: 4,
                              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                              padding: '2px 8px', borderRadius: 10, letterSpacing: 0.3,
                              backgroundColor: getRoleBadgeColor(), color: '#fff',
                            }}>
                              {user.role}
                            </span>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div style={{ padding: '6px 0' }}>
                          <MenuItem icon="isax-category" label="Dashboard" onClick={() => handleMenuItemClick(getDashboardRoute())} />
                          <MenuItem icon="isax-user" label={user?.role === 'ADMIN' ? 'Admin Settings' : 'My Profile'} onClick={() => handleMenuItemClick(getProfileRoute())} />

                          {user?.role === 'ADMIN' && (
                            <>
                              <MenuItem icon="isax-people" label="Manage Users" onClick={() => handleMenuItemClick(all_routes.adminUsers)} />
                              <MenuItem icon="isax-book" label="Manage Courses" onClick={() => handleMenuItemClick(all_routes.adminCourses)} />
                              <MenuItem icon="isax-folder-2" label="Categories" onClick={() => handleMenuItemClick(all_routes.adminCategories)} />
                            </>
                          )}

                          {user?.role !== 'ADMIN' && (
                            <>
                              <MenuItem icon="isax-book" label="My Courses" onClick={() => handleMenuItemClick(all_routes.studentCourses)} />
                              <MenuItem icon="isax-heart" label="Wishlist" onClick={() => handleMenuItemClick(all_routes.studentWishlist)} />
                            </>
                          )}
                        </div>

                        <div style={{ height: 1, background: 'rgba(107, 29, 42, 0.06)' }} />

                        <div style={{ padding: '6px 0' }}>
                          <MenuItem icon="isax-setting-2" label="Settings" onClick={() => handleMenuItemClick(getSettingsRoute())} />
                          <MenuItem icon="isax-logout" label="Logout" onClick={handleLogout} danger />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ── Not Authenticated ── */
                <div className="d-none d-lg-flex" style={{ alignItems: 'center', gap: 8, marginLeft: 4 }}>
                  <Link
                    to={all_routes.login}
                    style={{
                      padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                      color: '#fff', textDecoration: 'none',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to={all_routes.register}
                    style={{
                      padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 50%, #C5973E 100%)',
                      color: '#4E1420', border: 'none',
                      boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1060,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }}
          onClick={onhandleCloseMenu}
        >
          <div
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 280, background: '#4E1420',
              boxShadow: '4px 0 24px rgba(78, 20, 32, 0.4)',
              overflowY: 'auto', padding: '20px 0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                    alt="SARALÖWE"
                    style={{ height: 34, width: 34, objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 700, color: 'var(--sl-blush, #F5DADF)', letterSpacing: '0.1em' }}>SARALÖWE</span>
                </div>
                <button
                  type="button" onClick={onhandleCloseMenu}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', padding: 4 }}
                >
                  <i className="isax isax-close-circle" />
                </button>
              </div>
            </div>

            {/* Mobile Nav Links */}
            {[
              { label: 'Home', to: all_routes.homeone, icon: 'isax-home' },
              { label: 'Courses', to: all_routes.courseList, icon: 'isax-book' },
              { label: 'Masterclasses', to: all_routes.courseCategory, icon: 'isax-video-play' },
              { label: 'Community', to: all_routes.blogGrid, icon: 'isax-people' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={onhandleCloseMenu}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 24px', color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none', fontSize: 15, fontWeight: 500,
                  transition: 'background 0.15s',
                }}
              >
                <i className={`isax ${link.icon}`} style={{ fontSize: 18, width: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }} />
                {link.label}
              </Link>
            ))}

            {/* Divider + Auth Links */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 20px' }} />

            {isAuthenticated && user ? (
              <>
                {[
                  { label: 'Dashboard', to: getDashboardRoute(), icon: 'isax-category' },
                  { label: 'My Profile', to: getProfileRoute(), icon: 'isax-user' },
                  { label: 'Settings', to: getSettingsRoute(), icon: 'isax-setting-2' },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={onhandleCloseMenu}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 24px', color: 'rgba(255,255,255,0.8)',
                      textDecoration: 'none', fontSize: 15, fontWeight: 500,
                    }}
                  >
                    <i className={`isax ${link.icon}`} style={{ fontSize: 18, width: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }} />
                    {link.label}
                  </Link>
                ))}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleLogout(); onhandleCloseMenu(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 24px', color: '#E8A598',
                    textDecoration: 'none', fontSize: 15, fontWeight: 500,
                  }}
                >
                  <i className="isax isax-logout" style={{ fontSize: 18, width: 20, textAlign: 'center' }} />
                  Logout
                </a>
              </>
            ) : (
              <>
                <Link
                  to={all_routes.login}
                  onClick={onhandleCloseMenu}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 24px', color: 'rgba(255,255,255,0.8)',
                    textDecoration: 'none', fontSize: 15, fontWeight: 500,
                  }}
                >
                  <i className="isax isax-login" style={{ fontSize: 18, width: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }} />
                  Sign In
                </Link>
                <Link
                  to={all_routes.register}
                  onClick={onhandleCloseMenu}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 24px', color: '#C5973E',
                    textDecoration: 'none', fontSize: 15, fontWeight: 600,
                  }}
                >
                  <i className="isax isax-user-add" style={{ fontSize: 18, width: 20, textAlign: 'center' }} />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Header;
