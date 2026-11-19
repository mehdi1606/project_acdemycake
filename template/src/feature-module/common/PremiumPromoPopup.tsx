import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../core/redux/hooks'
import { all_routes } from '../router/all_routes'

/** Dismissed → stay quiet for 7 days (localStorage). */
const DISMISS_KEY = 'sl_premium_popup_dismissed_at'
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000
/** Shown already in this tab session → never again until a new session. */
const SESSION_KEY = 'sl_premium_popup_shown'
/** Visitor must have spent this long on the site (since this session started) AND scrolled once. */
const MIN_TIME_ON_SITE_MS = 25 * 1000
const SESSION_START_KEY = 'sl_session_started_at'

const safeGet = (store: 'local' | 'session', key: string): string | null => {
    try { return (store === 'local' ? window.localStorage : window.sessionStorage).getItem(key) } catch { return null }
}
const safeSet = (store: 'local' | 'session', key: string, value: string) => {
    try { (store === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value) } catch { /* storage blocked */ }
}

/** Exact paths where the promo must never interrupt. */
const BLOCKED_EXACT = new Set<string>([
    all_routes.connect,
    all_routes.login,
    all_routes.register,
    all_routes.forgotpassword,
    all_routes.resetPassword,
    all_routes.verifyEmail,
    all_routes.cart,
    all_routes.courseCart,
    all_routes.courseCheckout,
    all_routes.paymentCallback,
])
/** Path prefixes / fragments: course player, quizzes, ebook reader, every dashboard. */
const isBlockedPath = (pathname: string): boolean => {
    const p = pathname.replace(/\/+$/, '') || '/'
    if (BLOCKED_EXACT.has(p)) return true
    if (/^\/(student|instructor|admin)(\/|$)/.test(p)) return true      // dashboards (incl. quizzes)
    if (p.startsWith(all_routes.courseWatch)) return true                // course player
    if (/\/(watch|player|lesson-player)(\/|$)/.test(p)) return true
    if (/quiz/i.test(p)) return true                                     // any quiz route
    if (/^\/ebooks\/[^/]+\/read(\/|$)/.test(p)) return true              // ebook reader
    if (/checkout|\/payment\//.test(p)) return true
    return false
}

/** Another modal/dialog is already on screen — never stack on top of it. */
const anotherModalOpen = (): boolean => {
    try {
        return !!document.querySelector('.modal.show, [role="dialog"], [aria-modal="true"]')
    } catch {
        return false
    }
}

const PremiumPromoPopup: React.FC = () => {
    const { t, i18n } = useTranslation()
    const { user, isAuthenticated } = useAppSelector(s => s.auth)
    const { pathname } = useLocation()
    const [visible, setVisible] = useState(false)
    const isRtl = i18n.language === 'ar'
    const hasScrolledRef = useRef(false)

    const isHiddenRoute = isBlockedPath(pathname)

    // Only guests and students WITHOUT an active premium plan should see this
    const isEligible =
        !isHiddenRoute &&
        (!isAuthenticated ||
        (user?.role === 'STUDENT' && user?.subscriptionStatus !== 'ACTIVE'))

    // Remember when this browsing session began (time on site, not on the current page).
    useEffect(() => {
        if (!safeGet('session', SESSION_START_KEY)) safeSet('session', SESSION_START_KEY, String(Date.now()))
    }, [])

    // Track the first scroll anywhere on the site.
    useEffect(() => {
        if (hasScrolledRef.current) return
        const onScroll = () => {
            hasScrolledRef.current = true
            window.removeEventListener('scroll', onScroll)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Leaving for a blocked route hides it immediately.
    useEffect(() => {
        if (!isEligible) setVisible(false)
    }, [isEligible])

    useEffect(() => {
        if (!isEligible) return

        const canShow = () => {
            if (safeGet('session', SESSION_KEY)) return false                 // max once per session
            const dismissedAt = Number(safeGet('local', DISMISS_KEY) || 0)
            if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) return false
            const startedAt = Number(safeGet('session', SESSION_START_KEY) || Date.now())
            if (Date.now() - startedAt < MIN_TIME_ON_SITE_MS) return false
            if (!hasScrolledRef.current) return false
            if (anotherModalOpen()) return false
            return true
        }

        const tick = () => {
            if (canShow()) {
                safeSet('session', SESSION_KEY, '1')
                setVisible(true)
            }
        }
        const interval = window.setInterval(tick, 2000)
        return () => window.clearInterval(interval)
    }, [isEligible])

    const handleClose = useCallback(() => {
        setVisible(false)
        safeSet('local', DISMISS_KEY, String(Date.now()))
    }, [])

    // Escape closes it.
    useEffect(() => {
        if (!visible) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [visible, handleClose])

    if (!isEligible || !visible) return null

    const L = {
        title: t('premiumPopup.title', 'Join Premium Membership'),
        subtitle: t('premiumPopup.subtitle', 'Get full access to all courses and masterclasses'),
        features: [
            t('premiumPopup.feature1', 'Unlimited access to all courses'),
            t('premiumPopup.feature2', 'Certified completion certificates'),
            t('premiumPopup.feature3', 'Academy community & instructor messaging'),
            t('premiumPopup.feature4', 'Step-by-step progress tracking'),
        ],
        cta: t('premiumPopup.cta', 'Get Premium Now'),
        later: t('premiumPopup.later', 'Maybe later'),
    }

    return (
        <>
            <style>{`
                .sl-prem-overlay {
                    position: fixed; inset: 0; z-index: 99990;
                    background: rgba(20, 5, 10, 0.72);
                    backdrop-filter: blur(5px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 1rem;
                    animation: sl-prem-fadeIn 0.35s ease;
                }
                .sl-prem-modal {
                    position: relative;
                    background: linear-gradient(160deg, #1A0A10 0%, #2A0E18 55%, #1A0A10 100%);
                    border: 1px solid rgba(197, 145, 44, 0.4);
                    border-radius: 18px;
                    max-width: 480px; width: 100%;
                    padding: 2.4rem 2rem 2rem;
                    direction: ${isRtl ? 'rtl' : 'ltr'};
                    text-align: center;
                    box-shadow: 0 24px 80px rgba(0,0,0,0.55), 0 0 60px rgba(197,145,44,0.1);
                    animation: sl-prem-scaleIn 0.35s ease;
                }
                .sl-prem-close {
                    position: absolute; top: 12px; ${isRtl ? 'left' : 'right'}: 12px;
                    width: 40px; height: 40px; border-radius: 50%;
                    border: 1px solid rgba(197,145,44,0.3);
                    background: rgba(197,145,44,0.08);
                    color: #C5912C; font-size: 1rem; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.25s;
                }
                .sl-prem-close:hover { background: rgba(197,145,44,0.2); }
                .sl-prem-crown {
                    width: 66px; height: 66px; border-radius: 50%;
                    margin: 0 auto 1rem;
                    background: linear-gradient(135deg, #C5912C, #E0C56E);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 10px 30px rgba(197,145,44,0.35);
                }
                .sl-prem-crown i { font-size: 1.7rem; color: #2A0E18; }
                .sl-prem-title {
                    font-family: var(--sl-font-display, serif);
                    font-size: 1.35rem; font-weight: 700; color: #F5DADF;
                    margin-bottom: 0.4rem;
                }
                .sl-prem-sub {
                    font-family: var(--sl-font-body, sans-serif);
                    font-size: 0.88rem; color: rgba(245,218,223,0.6);
                    margin-bottom: 1.3rem;
                }
                .sl-prem-features {
                    list-style: none; padding: 0; margin: 0 0 1.6rem;
                    text-align: ${isRtl ? 'right' : 'left'};
                }
                .sl-prem-features li {
                    font-family: var(--sl-font-body, sans-serif);
                    font-size: 0.85rem; color: rgba(245,218,223,0.82);
                    padding: 0.4rem 0;
                    display: flex; align-items: center; gap: 10px;
                }
                .sl-prem-features li i { color: #C5912C; font-size: 0.8rem; flex-shrink: 0; }
                .sl-prem-cta {
                    display: block; width: 100%;
                    padding: 0.85rem 1rem; border-radius: 12px;
                    background: linear-gradient(135deg, #C5912C, #E0C56E);
                    color: #2A0E18 !important; font-weight: 800;
                    font-family: var(--sl-font-body, sans-serif); font-size: 0.95rem;
                    text-decoration: none; border: none; cursor: pointer;
                    transition: transform 0.25s, box-shadow 0.25s;
                    box-shadow: 0 10px 26px rgba(197,145,44,0.3);
                }
                .sl-prem-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(197,145,44,0.45); }
                .sl-prem-later {
                    display: inline-block; margin-top: 0.9rem;
                    background: none; border: none; cursor: pointer;
                    color: rgba(245,218,223,0.45); font-size: 0.8rem;
                    text-decoration: underline;
                }
                .sl-prem-later:hover { color: rgba(245,218,223,0.7); }
                @keyframes sl-prem-fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sl-prem-scaleIn { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
                @media (max-width: 576px) {
                    .sl-prem-modal { padding: 2rem 1.25rem 1.5rem; }
                }
            `}</style>

            <div className="sl-prem-overlay" onClick={handleClose}>
                <div
                    className="sl-prem-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="sl-prem-title"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="sl-prem-close"
                        onClick={handleClose}
                        aria-label={t('common.close', 'Close')}
                        title={t('common.close', 'Close')}
                        autoFocus
                    >
                        <span aria-hidden="true">✕</span>
                    </button>

                    <div className="sl-prem-crown" aria-hidden="true">
                        <i className="isax isax-crown-1" />
                    </div>

                    <div className="sl-prem-title" id="sl-prem-title">{L.title}</div>
                    <p className="sl-prem-sub">{L.subtitle}</p>

                    <ul className="sl-prem-features">
                        {L.features.map((f, i) => (
                            <li key={i}><i className="isax isax-tick-circle" />{f}</li>
                        ))}
                    </ul>

                    <Link to={all_routes.pricingPlan} className="sl-prem-cta" onClick={handleClose}>
                        {L.cta} 👑
                    </Link>

                    <button type="button" className="sl-prem-later" onClick={handleClose}>
                        {L.later}
                    </button>
                </div>
            </div>
        </>
    )
}

export default PremiumPromoPopup
