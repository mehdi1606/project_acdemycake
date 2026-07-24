import React, { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'sl_launch_popup_closed_at'
const RESHOW_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

const LaunchAnnouncementPopup: React.FC = () => {
    const [visible, setVisible] = useState(false)

    const shouldShow = useCallback(() => {
        const closedAt = sessionStorage.getItem(STORAGE_KEY)
        if (!closedAt) return true
        return Date.now() - Number(closedAt) >= RESHOW_INTERVAL_MS
    }, [])

    useEffect(() => {
        if (shouldShow()) {
            setVisible(true)
        }

        const interval = setInterval(() => {
            if (shouldShow()) {
                setVisible(true)
            }
        }, 60_000)

        return () => clearInterval(interval)
    }, [shouldShow])

    const handleClose = () => {
        setVisible(false)
        sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
    }

    if (!visible) return null

    return (
        <>
            <style>{`
                .sl-launch-overlay {
                    position: fixed; inset: 0; z-index: 99999;
                    background: rgba(20, 5, 10, 0.75);
                    backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 1rem;
                    animation: sl-launch-fadeIn 0.4s ease;
                }
                .sl-launch-modal {
                    position: relative;
                    background: linear-gradient(160deg, #1A0A10 0%, #2A0E18 50%, #1A0A10 100%);
                    border: 1px solid rgba(197, 145, 44, 0.35);
                    border-radius: 16px;
                    max-width: 560px; width: 100%;
                    padding: 2.5rem 2rem 2rem;
                    direction: rtl;
                    text-align: center;
                    box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(197,145,44,0.08);
                    animation: sl-launch-scaleIn 0.4s ease;
                }
                .sl-launch-close {
                    position: absolute; top: 12px; left: 12px;
                    width: 36px; height: 36px; border-radius: 50%;
                    border: 1px solid rgba(197,145,44,0.3);
                    background: rgba(197,145,44,0.08);
                    color: var(--sl-gold, #C5912C);
                    font-size: 1.1rem; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.25s, transform 0.25s;
                }
                .sl-launch-close:hover { background: rgba(197,145,44,0.2); transform: scale(1.1); }
                .sl-launch-logo {
                    width: 60px; height: 60px; object-fit: contain;
                    margin-bottom: 1rem;
                }
                .sl-launch-date {
                    font-family: var(--sl-font-display, serif);
                    font-size: 1.05rem; font-weight: 600;
                    color: var(--sl-gold, #C5912C);
                    line-height: 1.8;
                    margin-bottom: 1.25rem;
                }
                .sl-launch-intro {
                    font-family: var(--sl-font-body, sans-serif);
                    font-size: 0.9rem; color: rgba(245,218,223,0.7);
                    margin-bottom: 1rem;
                }
                .sl-launch-features {
                    list-style: none; padding: 0; margin: 0 0 1.5rem;
                    text-align: right;
                }
                .sl-launch-features li {
                    font-family: var(--sl-font-body, sans-serif);
                    font-size: 0.88rem; color: rgba(245,218,223,0.8);
                    line-height: 2; padding-right: 0.25rem;
                }
                .sl-launch-thanks {
                    font-family: var(--sl-font-display, serif);
                    font-size: 0.92rem; color: var(--sl-blush, #F5DADF);
                    font-weight: 500; line-height: 1.7;
                    border-top: 1px solid rgba(197,145,44,0.15);
                    padding-top: 1.25rem; margin-top: 0.5rem;
                }
                .sl-launch-divider {
                    width: 60px; height: 2px; margin: 0.75rem auto 1rem;
                    background: linear-gradient(90deg, transparent, var(--sl-gold, #C5912C), transparent);
                }
                @keyframes sl-launch-fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sl-launch-scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
                @media (max-width: 576px) {
                    .sl-launch-modal { padding: 2rem 1.25rem 1.5rem; }
                    .sl-launch-date { font-size: 0.95rem; }
                }
            `}</style>

            <div className="sl-launch-overlay" onClick={handleClose}>
                <div className="sl-launch-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="sl-launch-close" onClick={handleClose} aria-label="إغلاق">
                        ✕
                    </button>

                    <img
                        src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                        alt="SARALÖWE Academy"
                        className="sl-launch-logo"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />

                    <div className="sl-launch-divider" />

                    <p className="sl-launch-date">
                        سيتم الإطلاق الرسمي للدورات الكاملة يوم 11 سبتمبر 2026.
                    </p>

                    <p className="sl-launch-intro">
                        وحتى ذلك الحين، يمكنكم الاستمتاع بـ:
                    </p>

                    <ul className="sl-launch-features">
                        <li>✨ الانضمام إلى مجتمع الأكاديمية والتفاعل مع الأعضاء.</li>
                        <li>✨ استكشاف المنصة والتعرف على جميع الأقسام.</li>
                        <li>✨ مشاهدة عدد من الدورات التجريبية المجانية.</li>
                        <li>✨ متابعة آخر التحديثات والاستعداد لانطلاق الرحلة التعليمية.</li>
                    </ul>

                    <p className="sl-launch-thanks">
                        شكراً لثقتكم، ونتطلع لاستقبالكم في الإطلاق الرسمي 🎂
                    </p>
                </div>
            </div>
        </>
    )
}

export default LaunchAnnouncementPopup
