import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../core/redux/hooks'
import { all_routes } from '../router/all_routes'

const STORAGE_KEY = 'sl_premium_popup_closed_at'
const RESHOW_INTERVAL_MS = 10 * 60 * 1000 // re-show after 10 minutes within the same session
const INITIAL_DELAY_MS = 2500

const PremiumPromoPopup: React.FC = () => {
    const { i18n } = useTranslation()
    const { user, isAuthenticated } = useAppSelector(s => s.auth)
    const [visible, setVisible] = useState(false)
    const isRtl = i18n.language === 'ar'

    // Only guests and students WITHOUT an active premium plan should see this
    const isEligible =
        !isAuthenticated ||
        (user?.role === 'STUDENT' && user?.subscriptionStatus !== 'ACTIVE')

    useEffect(() => {
        if (!isEligible) return

        const shouldShow = () => {
            const closedAt = sessionStorage.getItem(STORAGE_KEY)
            if (!closedAt) return true
            return Date.now() - Number(closedAt) >= RESHOW_INTERVAL_MS
        }

        // Never stack on top of the launch announcement popup
        const launchOpen = () => !!document.querySelector('.sl-launch-overlay')

        const tryShow = () => {
            if (shouldShow() && !launchOpen()) setVisible(true)
        }

        const initial = setTimeout(tryShow, INITIAL_DELAY_MS)
        const interval = setInterval(tryShow, 30_000)
        return () => { clearTimeout(initial); clearInterval(interval) }
    }, [isEligible])

    if (!isEligible || !visible) return null

    const handleClose = () => {
        setVisible(false)
        sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
    }

    const L = isRtl
        ? {
            title: 'انضم إلى العضوية المميزة',
            subtitle: 'احصل على وصول كامل لجميع الدورات والماستر كلاس',
            features: [
                'وصول غير محدود لجميع الدورات',
                'شهادات إتمام معتمدة',
                'مجتمع الأكاديمية والتواصل مع المدربين',
                'متابعة تقدمك خطوة بخطوة',
            ],
            cta: 'احصل على العضوية الآن',
            later: 'لاحقاً',
        }
        : {
            title: 'Join Premium Membership',
            subtitle: 'Get full access to all courses and masterclasses',
            features: [
                'Unlimited access to all courses',
                'Certified completion certificates',
                'Academy community & instructor messaging',
                'Step-by-step progress tracking',
            ],
            cta: 'Get Premium Now',
            later: 'Maybe later',
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
                    width: 34px; height: 34px; border-radius: 50%;
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
                <div className="sl-prem-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="sl-prem-close" onClick={handleClose} aria-label={isRtl ? 'إغلاق' : 'Close'}>
                        ✕
                    </button>

                    <div className="sl-prem-crown">
                        <i className="isax isax-crown-1" />
                    </div>

                    <div className="sl-prem-title">{L.title}</div>
                    <p className="sl-prem-sub">{L.subtitle}</p>

                    <ul className="sl-prem-features">
                        {L.features.map((f, i) => (
                            <li key={i}><i className="isax isax-tick-circle" />{f}</li>
                        ))}
                    </ul>

                    <Link to={all_routes.pricingPlan} className="sl-prem-cta" onClick={handleClose}>
                        {L.cta} 👑
                    </Link>

                    <button className="sl-prem-later" onClick={handleClose}>
                        {L.later}
                    </button>
                </div>
            </div>
        </>
    )
}

export default PremiumPromoPopup
