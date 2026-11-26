import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { all_routes } from "../../../feature-module/router/all_routes";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logout } from "../../redux/authSlice";
import { getFileUrl } from "../../../environment";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../i18n/LanguageSwitcher";
import AvatarImage from "../../../components/AvatarImage";
import ChristmasLights from "../../../components/season/ChristmasLights";
import { HangingOrnaments, SantaHat } from "../../../components/season/ChristmasDecor";
import "./header.css";
import { useChallenge } from "../../../components/challenge/useChallenge";
import MobileHeader from "./MobileHeader";
import { useMobilePresentation } from "../../../experience/useExperience";
import { switchExperience } from "../../../experience/experience";

const DesktopHeader = () => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [academyMenuOpen, setAcademyMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const academyRef = useRef<HTMLDivElement>(null);
  const academyBtnRef = useRef<HTMLButtonElement>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const challengeOn = !!useChallenge().challenge;


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
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (academyRef.current && !academyRef.current.contains(event.target as Node)) {
        setAcademyMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAcademyMenuOpen((open) => {
          if (open) academyBtnRef.current?.focus();
          return false;
        });
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
        document.documentElement.classList.remove("menu-opened");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    setAcademyMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
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
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleMenuItemClick = (route: string) => {
    setProfileDropdownOpen(false);
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
      case 'ADMIN': return t('common.admin');
      case 'INSTRUCTOR': return t('common.instructor');
      default: return t('common.student');
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
        className={`header-one sl-hdr ${scrolled ? "fixed" : ""}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1050,
          /* blush glass, the same paper as the home illustration */
          background: scrolled ? 'rgba(245, 218, 223, 0.82)' : 'rgba(245, 218, 223, 0.6)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          borderBottom: '1px solid rgba(166, 25, 46, 0.16)',
          boxShadow: scrolled
            ? '0 10px 30px rgba(101, 28, 50, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.55)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={onHandleMobileMenu}
                className="d-lg-none sl-hdr-btn"
                aria-label={t('nav.openMenu', 'Open menu')}
                title={t('nav.openMenu', 'Open menu')}
                aria-expanded={mobileMenuOpen}
                aria-controls="sl-mobile-menu"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                  color: '#fff', fontSize: 20, padding: '0 10px',
                  minWidth: 40, minHeight: 40, borderRadius: 10,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <i className="fa-solid fa-bars" aria-hidden="true" />
                <span className="d-sm-none" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>
                  {t('nav.menu', 'Menu')}
                </span>
              </button>

              {/* Logo */}
              <Link
                to={all_routes.homeone}
                aria-label={t('nav.homeLogo', 'Saralöwe — home page')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  textDecoration: 'none', position: 'relative',
                }}
              >
                <SantaHat size={26} />
                {/* SVG Logo — gold (#c5912c) variant, perfect on dark bg */}
                <img
                  src={`${process.env.PUBLIC_URL}/assets/img/Logos/saralowe-lions-crimson.svg`}
                  alt="SARALÖWE Academy"
                  style={{ height: 40, width: 'auto', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="sl-hdr-wordmark" style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 18, fontWeight: 700, color: '#651C32',
                  letterSpacing: '0.12em', lineHeight: 1, textTransform: 'uppercase',
                }}>
                  SARALÖWE
                </span>
              </Link>
            </div>

            {/* ── Center: Nav Links (Desktop) ── */}
            <div className="d-none d-lg-flex" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

              {/* Home */}
              <Link
                to={all_routes.homeone}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  fontSize: 15, fontWeight: isActive('/', true) ? 600 : 500,
                  color: isActive('/', true) ? '#A6192E' : '#651C32',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                  background: isActive('/', true) ? 'rgba(166,25,46,0.1)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive('/', true)) e.currentTarget.style.color = '#A6192E'; }}
                onMouseLeave={e => { if (!isActive('/', true)) e.currentTarget.style.color = '#651C32'; }}
              >
                {t('nav.home')}
              </Link>

              {/* Masterclasses */}
              <Link
                to={all_routes.masterclass}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  fontSize: 15, fontWeight: isActive('/masterclass') ? 600 : 500,
                  color: isActive('/masterclass') ? '#A6192E' : '#651C32',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                  background: isActive('/masterclass') ? 'rgba(166,25,46,0.1)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive('/masterclass')) e.currentTarget.style.color = '#A6192E'; }}
                onMouseLeave={e => { if (!isActive('/masterclass')) e.currentTarget.style.color = '#651C32'; }}
              >
                {t('nav.masterclasses')}
              </Link>

              {/* New Year Cake Challenge (only while it runs) */}
              {challengeOn && (
                <Link
                  to={all_routes.challenge}
                  className="sl-hdr-challenge"
                  style={{
                    padding: '8px 14px', borderRadius: 999,
                    fontSize: 14.5, fontWeight: 700, textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: isActive('/challenge') ? '#A6192E' : '#651C32',
                    background: isActive('/challenge') ? 'rgba(166,25,46,0.1)' : 'transparent',
                  }}
                >
                  <span aria-hidden="true" className="sl-hdr-challenge__spark">✦</span>
                  {t('nav.challenge', 'Challenge')}
                </Link>
              )}

              {/* Academy dropdown */}
              <div
                ref={academyRef}
                style={{ position: 'relative' }}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setAcademyMenuOpen(true); }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') setAcademyMenuOpen(false); }}
                onBlur={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && !e.currentTarget.contains(next)) setAcademyMenuOpen(false);
                }}
              >
                <button
                  ref={academyBtnRef}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={academyMenuOpen}
                  aria-controls="sl-academy-menu"
                  onClick={() => setAcademyMenuOpen((o) => !o)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setAcademyMenuOpen(true);
                      setTimeout(() => {
                        const first = academyRef.current?.querySelector<HTMLAnchorElement>('#sl-academy-menu a');
                        first?.focus();
                      }, 0);
                    }
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 15, fontWeight: (isActive('/course') || isActive('/blog') || isActive('/ebooks')) ? 600 : 500,
                    color: (isActive('/course') || isActive('/blog') || isActive('/ebooks')) ? '#A6192E' : '#651C32',
                    textDecoration: 'none', transition: 'all 0.2s ease',
                    background: (isActive('/course') || isActive('/blog') || isActive('/ebooks')) ? 'rgba(166,25,46,0.1)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {t('nav.academy')}
                  <i className="isax isax-arrow-down5" style={{ fontSize: '0.7rem', marginTop: 1 }} />
                </button>

                {/* Dropdown panel */}
                {academyMenuOpen && (
                  <div id="sl-academy-menu" style={{
                    position: 'absolute', top: '100%', left: 0,
                    background: 'rgba(40, 8, 18, 0.97)',
                    border: '1px solid rgba(197,145,44,0.18)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 10,
                    minWidth: 180,
                    padding: '8px 0',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
                    zIndex: 999,
                  }}>
                    {[
                      { label: t('nav.courses'), to: all_routes.courseList, icon: 'isax-book' },
                      { label: t('nav.ebooks', 'Ebooks'), to: all_routes.ebooks, icon: 'isax-book-1' },
                      { label: t('nav.community'), to: all_routes.blogGrid, icon: 'isax-people' },
                    ].map(item => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setAcademyMenuOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 18px',
                          color: 'rgba(255,255,255,0.82)',
                          textDecoration: 'none',
                          fontSize: 14, fontWeight: 500,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#C5973E';
                          e.currentTarget.style.background = 'rgba(197,145,44,0.07)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.82)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <i className={`isax ${item.icon}`} style={{ fontSize: 16, color: 'rgba(197,145,44,0.7)' }} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ── Right: Actions ── */}
            <div className="sl-hdr-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Language Switcher */}
              <LanguageSwitcher variant="dark" />

              {isAuthenticated && user ? (
                <>
                  {/* Premium Badge / Get Premium CTA */}
                  {user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR' && (
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
                        {t('nav.premium')}
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
                        {t('nav.getPremium')}
                      </Link>
                    )
                  )}

                  {/* ── User Profile Dropdown ── */}
                  <div ref={dropdownRef} className="d-none d-lg-block" style={{ position: 'relative', marginLeft: 4 }}>
                    <button
                      type="button"
                      className="sl-hdr-btn sl-hdr-btn--pill"
                      onClick={toggleDropdown}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '5px 10px 5px 5px', borderRadius: 28,
                        border: `1.5px solid ${profileDropdownOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        background: profileDropdownOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        if (!profileDropdownOpen) {
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
                        <AvatarImage
                          src={user.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null}
                          name={user.fullName}
                          bg="transparent"
                        />
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
                        className={`isax isax-arrow-${profileDropdownOpen ? 'up' : 'down'}-1`}
                        style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', transition: 'transform 0.2s' }}
                      />
                    </button>

                    {/* ── Dropdown Menu ── */}
                    {profileDropdownOpen && (
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
                            <AvatarImage
                              src={user.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null}
                              name={user.fullName}
                              bg="transparent"
                            />
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
                              {getRoleLabel()}
                            </span>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div style={{ padding: '6px 0' }}>
                          <MenuItem icon="isax-category" label={t('nav.dashboard')} onClick={() => handleMenuItemClick(getDashboardRoute())} />
                          <MenuItem icon="isax-user" label={user?.role === 'ADMIN' ? t('admin.settings.title') : t('nav.myProfile')} onClick={() => handleMenuItemClick(getProfileRoute())} />

                          {user?.role === 'ADMIN' && (
                            <>
                              <MenuItem icon="isax-people" label={t('nav.manageUsers')} onClick={() => handleMenuItemClick(all_routes.adminUsers)} />
                              <MenuItem icon="isax-book" label={t('nav.manageCourses')} onClick={() => handleMenuItemClick(all_routes.adminCourses)} />
                              <MenuItem icon="isax-folder-2" label={t('nav.categories')} onClick={() => handleMenuItemClick(all_routes.adminCategories)} />
                            </>
                          )}

                          {user?.role !== 'ADMIN' && (
                            <>
                              <MenuItem icon="isax-book" label={t('nav.myCourses')} onClick={() => handleMenuItemClick(all_routes.studentCourses)} />
                              <MenuItem icon="isax-heart" label={t('nav.wishlist')} onClick={() => handleMenuItemClick(all_routes.studentWishlist)} />
                            </>
                          )}
                        </div>

                        <div style={{ height: 1, background: 'rgba(107, 29, 42, 0.06)' }} />

                        <div style={{ padding: '6px 0' }}>
                          <MenuItem icon="isax-setting-2" label={t('nav.settings')} onClick={() => handleMenuItemClick(getSettingsRoute())} />
                          <MenuItem icon="isax-mobile" label={t('experience.useMobile', 'Use the mobile experience')} onClick={() => switchExperience('mobile')} />
                          <MenuItem icon="isax-logout" label={t('nav.logout')} onClick={handleLogout} danger />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                {/* ── Not Authenticated: compact Sign in pill on phones/tablets ── */}
                <Link
                  to={all_routes.login}
                  className="d-inline-flex d-lg-none"
                  style={{
                    alignItems: 'center', gap: 6, textDecoration: 'none',
                    minHeight: 38, padding: '0 14px', borderRadius: 20, marginInlineStart: 2,
                    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 50%, #C5973E 100%)',
                    color: '#4E1420',
                  }}
                >
                  <i className="isax isax-login" aria-hidden="true" style={{ fontSize: 15 }} />
                  {t('nav.signIn')}
                </Link>
                {/* ── Not Authenticated ── */}
                <div className="d-none d-lg-flex" style={{ alignItems: 'center', gap: 8, marginLeft: 4 }}>
                  {/* Get Premium — visible to guests so they discover the plans */}
                  <Link
                    to={all_routes.pricingPlan}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none',
                      background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 50%, #C5973E 100%)',
                      color: '#4E1420', fontWeight: 600, fontSize: 13,
                      padding: '7px 16px', borderRadius: 20,
                      boxShadow: '0 2px 8px rgba(212,175,55,0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(212,175,55,0.45)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(212,175,55,0.3)'; }}
                  >
                    <i className="isax isax-crown-1" style={{ fontSize: 14 }} />
                    {t('nav.getPremium')}
                  </Link>

                  <Link
                    to={all_routes.login}
                    style={{
                      padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                      color: '#651C32', textDecoration: 'none',
                      border: '1.5px solid rgba(101,28,50,0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(166,25,46,0.55)'; e.currentTarget.style.background = 'rgba(166,25,46,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(101,28,50,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    {t('nav.signIn')}
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
                    {t('nav.signUp')}
                  </Link>
                </div>
                </>
              )}
            </div>
          </nav>
        </div>
        <ChristmasLights edge="bottom" />
        <HangingOrnaments side="start" />
        <HangingOrnaments side="end" />
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
            id="sl-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu', 'Menu')}
            style={{
              position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0,
              width: 'min(300px, 86vw)', background: '#4E1420',
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
                  aria-label={t('nav.closeMenu', 'Close menu')}
                  title={t('nav.closeMenu', 'Close menu')}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.8)',
                    fontSize: 20, cursor: 'pointer', width: 40, height: 40, borderRadius: 10,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className="isax isax-close-circle" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Mobile Nav Links */}
            {[
              { label: t('nav.home'),          to: all_routes.homeone,      icon: 'isax-home' },
              { label: t('nav.masterclasses'), to: all_routes.masterclass, icon: 'isax-video-play' },
              { label: t('nav.ebooks', 'Ebooks'), to: all_routes.ebooks,   icon: 'isax-book-1' },
              ...(challengeOn ? [{ label: t('nav.challenge', 'Challenge'), to: all_routes.challenge, icon: 'isax-cake' }] : []),
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

            {/* Academy section in mobile */}
            <div style={{ padding: '10px 24px 4px', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(197,145,44,0.55)', fontWeight: 600 }}>
              {t('nav.academy')}
            </div>
            {[
              { label: t('nav.courses'),   to: all_routes.courseList, icon: 'isax-book' },
              { label: t('nav.community'), to: all_routes.blogGrid,   icon: 'isax-people' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={onhandleCloseMenu}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 24px 12px 36px', color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', fontSize: 14, fontWeight: 500,
                  transition: 'background 0.15s',
                }}
              >
                <i className={`isax ${link.icon}`} style={{ fontSize: 16, width: 20, textAlign: 'center', color: 'rgba(197,145,44,0.5)' }} />
                {link.label}
              </Link>
            ))}

            {/* Divider + Auth Links */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 20px' }} />

            {isAuthenticated && user ? (
              <>
                {/* Signed-in identity */}
                <div style={{ padding: '6px 24px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                    backgroundColor: getRoleBadgeColor(), border: '2px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700,
                  }}>
                    <AvatarImage
                      src={user.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null}
                      name={user.fullName}
                      bg="transparent"
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.fullName || t('common.student', 'Student')}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{getRoleLabel()}</div>
                  </div>
                </div>
                {user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR' && user.subscriptionStatus !== 'ACTIVE' && (
                  <Link
                    to={all_routes.pricingPlan}
                    onClick={onhandleCloseMenu}
                    className="sl-mm-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 24px', color: '#C5973E',
                      textDecoration: 'none', fontSize: 15, fontWeight: 700,
                    }}
                  >
                    <i className="isax isax-crown-1" aria-hidden="true" style={{ fontSize: 18, width: 20, textAlign: 'center' }} />
                    {t('nav.getPremium')}
                  </Link>
                )}
                {[
                  { label: t('nav.dashboard'), to: getDashboardRoute(), icon: 'isax-category', show: true },
                  { label: t('nav.myCourses'), to: user.role === 'INSTRUCTOR' ? all_routes.instructorCourse : all_routes.studentCourses, icon: 'isax-book', show: user.role !== 'ADMIN' },
                  { label: t('nav.myEbooks', 'My Ebooks'), to: all_routes.studentEbooks, icon: 'isax-book-1', show: user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR' },
                  { label: t('nav.wishlist'), to: all_routes.studentWishlist, icon: 'isax-heart', show: user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR' },
                  { label: t('nav.mySubscription', 'My subscription'), to: all_routes.studentSubscription, icon: 'isax-crown', show: user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR' },
                  { label: user.role === 'ADMIN' ? t('admin.settings.title') : t('nav.myProfile'), to: getProfileRoute(), icon: 'isax-user', show: true },
                  { label: t('nav.settings'),  to: getSettingsRoute(), icon: 'isax-setting-2', show: user.role !== 'ADMIN' },
                  { label: t('footer.contact', 'Contact Us'), to: all_routes.contactUs, icon: 'isax-message-question', show: true },
                ].filter((l) => l.show).map((link) => (
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
                  {t('nav.logout')}
                </a>
              </>
            ) : (
              <>
                {/* Get Premium — mobile guest */}
                <Link
                  to={all_routes.pricingPlan}
                  onClick={onhandleCloseMenu}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 24px', color: '#C5973E',
                    textDecoration: 'none', fontSize: 15, fontWeight: 700,
                  }}
                >
                  <i className="isax isax-crown-1" style={{ fontSize: 18, width: 20, textAlign: 'center' }} />
                  {t('nav.getPremium')}
                </Link>
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
                  {t('nav.signIn')}
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
                  {t('nav.signUp')}
                </Link>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 20px' }} />
                {[
                  { label: t('footer.contact', 'Contact Us'), to: all_routes.contactUs, icon: 'isax-message-question' },
                  { label: t('footer.faq', 'FAQs'), to: all_routes.FAQ, icon: 'isax-info-circle' },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={onhandleCloseMenu}
                    className="sl-mm-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 24px', color: 'rgba(255,255,255,0.8)',
                      textDecoration: 'none', fontSize: 15, fontWeight: 500,
                    }}
                  >
                    <i className={`isax ${link.icon}`} aria-hidden="true" style={{ fontSize: 18, width: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }} />
                    {link.label}
                  </Link>
                ))}
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
        @media (max-width: 420px) {
          .header-one .sl-hdr-wordmark { display: none; }
        }
        .sl-mm-link:focus-visible, .header-one a:focus-visible, .header-one button:focus-visible {
          outline: 2px solid #C5973E; outline-offset: 2px;
        }
      `}</style>
    </>
  );
};

/** The mobile experience (and narrow windows) get the touch-first header; the rest keep the desktop one. */
const Header = () => (useMobilePresentation() ? <MobileHeader /> : <DesktopHeader />);

export default Header;
