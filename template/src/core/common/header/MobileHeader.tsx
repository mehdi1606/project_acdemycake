/**
 * The mobile presentation of the public navigation, designed for touch:
 *  - a slim glass header: menu, the crest in the centre, the account on the right
 *  - a full-height drawer: the account, the site, language and experience
 *  - a bottom tab bar within thumb reach for the four places people go most
 * Same routes, same auth and same data as the desktop header.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../../../feature-module/router/all_routes';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/authSlice';
import { getFileUrl } from '../../../environment';
import AvatarImage from '../../../components/AvatarImage';
import ChristmasLights from '../../../components/season/ChristmasLights';
import { SantaHat } from '../../../components/season/ChristmasDecor';
import { useChallenge } from '../../../components/challenge/useChallenge';
import ExperienceSwitch from '../../../experience/ExperienceSwitch';
import './mobile-header.css';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

const MobileHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const challengeOn = !!useChallenge().challenge;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const dashboard =
    user?.role === 'ADMIN' ? all_routes.adminDashboard :
    user?.role === 'INSTRUCTOR' ? all_routes.instructorDashboard : all_routes.studentDashboard;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.documentElement.classList.add('menu-opened');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('menu-opened'); };
  }, [open]);
  // the tab bar takes the bottom of the screen on public pages
  useEffect(() => {
    document.body.classList.add('sl-has-tabbar');
    return () => document.body.classList.remove('sl-has-tabbar');
  }, []);

  const signOut = async () => {
    setOpen(false);
    await dispatch(logout());
    navigate(all_routes.homeone);
  };

  const setLang = (code: string) => {
    if (code === i18n.language) return;
    i18n.changeLanguage(code);
  };

  const site = [
    { to: all_routes.homeone, label: t('nav.home'), icon: 'isax-home-2' },
    { to: all_routes.masterclass, label: t('nav.masterclasses'), icon: 'isax-video-play' },
    ...(challengeOn ? [{ to: all_routes.challenge, label: t('nav.challenge', 'Challenge'), icon: 'isax-cake', spark: true }] : []),
    { to: all_routes.courseList, label: t('nav.courses'), icon: 'isax-book' },
    { to: all_routes.ebooks, label: t('nav.ebooks', 'Ebooks'), icon: 'isax-book-1' },
    { to: all_routes.blogGrid, label: t('nav.community'), icon: 'isax-people' },
  ];
  const isHere = (to: string) => (to === all_routes.homeone ? pathname === '/' || pathname === to : pathname.startsWith(to));

  const tabs = [
    { to: all_routes.homeone, label: t('nav.home'), icon: 'isax-home-2' },
    { to: all_routes.masterclass, label: t('mobileNav.classes', 'Classes'), icon: 'isax-video-play' },
    challengeOn
      ? { to: all_routes.challenge, label: t('nav.challenge', 'Challenge'), icon: 'isax-cake' }
      : { to: all_routes.ebooks, label: t('nav.ebooks', 'Ebooks'), icon: 'isax-book-1' },
    { to: all_routes.courseList, label: t('nav.courses'), icon: 'isax-book' },
    isAuthenticated
      ? { to: dashboard, label: t('mobileNav.me', 'My space'), icon: 'isax-user' }
      : { to: all_routes.login, label: t('nav.signIn'), icon: 'isax-login' },
  ];

  return (
    <>
      <header className={`smh${scrolled ? ' is-scrolled' : ''}`}>
        <div className="smh__bar">
          <button type="button" className="smh__btn" onClick={() => setOpen(true)} aria-label={t('nav.openMenu', 'Open menu')} aria-expanded={open} aria-controls="smh-drawer">
            <span className="smh__burger" aria-hidden="true"><i /><i /><i /></span>
          </button>
          <Link to={all_routes.homeone} className="smh__brand" aria-label={t('nav.homeLogo', 'Saralöwe — home page')}>
            <span className="smh__crest">
              <img src={`${process.env.PUBLIC_URL}/assets/img/Logos/saralowe-lions-crimson.svg`} alt="" />
              <SantaHat size={20} />
            </span>
            <span className="smh__word">SARALÖWE</span>
          </Link>
          {isAuthenticated && user ? (
            <Link to={dashboard} className="smh__btn smh__btn--me" aria-label={t('nav.dashboard')}>
              <AvatarImage src={user.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null} name={user.fullName} bg="transparent" />
            </Link>
          ) : (
            <Link to={all_routes.login} className="smh__btn" aria-label={t('nav.signIn')}>
              <i className="isax isax-user" aria-hidden="true" />
            </Link>
          )}
        </div>
        <ChristmasLights edge="bottom" />
      </header>

      {/* ── drawer ── */}
      <div className={`smd${open ? ' is-open' : ''}`} aria-hidden={!open} onClick={() => setOpen(false)}>
        <nav id="smh-drawer" className="smd__panel" aria-label={t('nav.menu', 'Menu')} onClick={(e) => e.stopPropagation()}>
          <div className="smd__top">
            <span className="smd__word">SARALÖWE</span>
            <button ref={closeRef} type="button" className="smd__close" onClick={() => setOpen(false)} aria-label={t('nav.closeMenu', 'Close menu')} tabIndex={open ? 0 : -1}>
              <i className="isax isax-close-circle" aria-hidden="true" />
            </button>
          </div>

          {isAuthenticated && user ? (
            <Link to={dashboard} className="smd__me" tabIndex={open ? 0 : -1}>
              <span className="smd__avatar">
                <AvatarImage src={user.avatarUrl ? (getFileUrl(user.avatarUrl) ?? user.avatarUrl) : null} name={user.fullName} bg="transparent" />
              </span>
              <span>
                <b>{user.fullName || t('common.student', 'Student')}</b>
                <small>{t('nav.dashboard')} →</small>
              </span>
            </Link>
          ) : (
            <div className="smd__auth">
              <Link to={all_routes.login} className="smd__pill smd__pill--line" tabIndex={open ? 0 : -1}>{t('nav.signIn')}</Link>
              <Link to={all_routes.register} className="smd__pill" tabIndex={open ? 0 : -1}>{t('nav.signUp')}</Link>
            </div>
          )}

          <ul className="smd__links">
            {site.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={isHere(l.to) ? 'is-here' : ''} tabIndex={open ? 0 : -1}>
                  <i className={`isax ${l.icon}`} aria-hidden="true" />
                  <span>{l.label}</span>
                  {'spark' in l && l.spark && <span className="smd__spark" aria-hidden="true">✦</span>}
                </Link>
              </li>
            ))}
          </ul>

          {user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR' && user?.subscriptionStatus !== 'ACTIVE' && (
            <Link to={all_routes.pricingPlan} className="smd__premium" tabIndex={open ? 0 : -1}>
              <i className="isax isax-crown-1" aria-hidden="true" /> {t('nav.getPremium')}
            </Link>
          )}

          <div className="smd__group">
            <p className="smd__label">{t('nav.changeLanguage', 'Language')}</p>
            <div className="smd__seg" role="group">
              {LANGS.map((l) => (
                <button key={l.code} type="button" lang={l.code} className={(i18n.language || 'en').startsWith(l.code) ? 'is-on' : ''} onClick={() => setLang(l.code)} tabIndex={open ? 0 : -1}>{l.label}</button>
              ))}
            </div>
          </div>
          <div className="smd__group">
            <p className="smd__label">{t('experience.label', 'Experience')}</p>
            <ExperienceSwitch compact tabIndex={open ? 0 : -1} />
          </div>

          {isAuthenticated && (
            <button type="button" className="smd__logout" onClick={signOut} tabIndex={open ? 0 : -1}>
              <i className="isax isax-logout" aria-hidden="true" /> {t('nav.logout')}
            </button>
          )}
        </nav>
      </div>

      {/* ── bottom tab bar ── */}
      <nav className="smt" aria-label={t('mobileNav.tabs', 'Main sections')}>
        {tabs.map((tab) => (
          <Link key={tab.to + tab.label} to={tab.to} className={`smt__tab${isHere(tab.to) ? ' is-here' : ''}`} aria-current={isHere(tab.to) ? 'page' : undefined}>
            <i className={`isax ${tab.icon}`} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default MobileHeader;
