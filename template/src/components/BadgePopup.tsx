/**
 * BadgePopup
 *
 * Shown once per user session when they first open their dashboard.
 * Explains the badge they currently hold and what the next level requires.
 * Fully bilingual (EN / AR) via i18next.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { claimPopupSlot } from '../core/common/popupGate';
import { useTranslation } from 'react-i18next';
import { BadgeDefinition, BadgeProgress, BADGES, getNextBadge, badgeSrcSet } from '../config/badges';
import BadgeRequirementList from './BadgeRequirementList';

interface Props {
  badge: BadgeDefinition;
  userId: string;
  completedCourses: number;
  /** The student's badge numbers (see config/badges) */
  progress?: BadgeProgress | null;
  /** False while a new student is still earning Apprentice: no "Congratulations" yet */
  earned?: boolean;
}

const LS_KEY_PREFIX = 'slw_badge_popup_';

const BadgePopup: React.FC<Props> = ({ badge, userId, progress, earned = true }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show once per user — reset each time their badge level changes
    const lsKey = `${LS_KEY_PREFIX}${userId}_${badge.id}`;
    if (!earned) return;
    let seen = false;
    try { seen = !!localStorage.getItem(lsKey); } catch { seen = false; }
    if (seen) return;
    // Never stack on top of another modal/dialog: wait until the screen is clear.
    const otherModalOpen = () => {
      try {
        return !!document.querySelector('.modal.show, [role="dialog"], [aria-modal="true"]');
      } catch { return false; }
    };
    let timer: number | undefined;
    const tryShow = () => {
      if (otherModalOpen()) {
        timer = window.setTimeout(tryShow, 1500);
      } else if (claimPopupSlot(`badge_${badge.id}`)) {
        setVisible(true);
      }
    };
    timer = window.setTimeout(tryShow, 600);
    return () => { if (timer) window.clearTimeout(timer); };
  }, [userId, badge.id, earned]);

  const dismiss = useCallback(() => {
    const lsKey = `${LS_KEY_PREFIX}${userId}_${badge.id}`;
    try { localStorage.setItem(lsKey, '1'); } catch { /* storage blocked */ }
    setVisible(false);
  }, [userId, badge.id]);

  // Escape closes the popup
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  const nextBadge = getNextBadge(badge, progress ?? {});
  const isStudentBadge = badge.id <= 7;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={t('badges.popup.yourBadge')}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: '100%',
          maxWidth: 480,
          padding: '0 16px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(160deg, #1a0a0e 0%, #2d1218 60%, #1a0a0e 100%)',
            border: `2px solid ${badge.color}55`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: `0 0 60px ${badge.color}33, 0 24px 60px rgba(0,0,0,0.7)`,
            position: 'relative',
          }}
        >
          {/* Top gold line */}
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, transparent, ${badge.color}, transparent)`,
            }}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('common.close', 'Close')}
            title={t('common.close', 'Close')}
            autoFocus
            style={{
              position: 'absolute',
              top: 12,
              [isRtl ? 'left' : 'right']: 12,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <span aria-hidden="true">×</span>
          </button>

          {/* Content */}
          <div style={{ padding: '32px 28px 28px' }}>
            {/* Title */}
            <p
              style={{
                textAlign: 'center',
                color: badge.color,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {t('badges.popup.yourBadge')}
            </p>
            <h3
              style={{
                textAlign: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 22,
                marginBottom: 28,
                letterSpacing: 0.5,
              }}
            >
              {t('badges.popup.congratulations')}
            </h3>

            {/* Badge image */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  display: 'inline-block',
                  position: 'relative',
                }}
              >
                {/* Glow ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: -12,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${badge.color}22 0%, transparent 70%)`,
                    animation: 'badgePulse 2.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: 190,
                    height: 190,
                    position: 'relative',
                    zIndex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={badge.image}
                    srcSet={badgeSrcSet(badge.image)}
                    sizes="380px"
                    alt={t(badge.nameKey)}
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 14px 22px rgba(0,0,0,0.45)) drop-shadow(0 0 18px ${badge.color}55)` }}
                  />
                </div>
              </div>
            </div>

            {/* Badge name */}
            <h4
              style={{
                textAlign: 'center',
                color: badge.color,
                fontWeight: 800,
                fontSize: 20,
                marginBottom: 12,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {t(badge.nameKey)}
            </h4>

            {/* Description */}
            <p
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.75)',
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              {t(badge.descKey)}
            </p>

            {/* Progress to next badge: everything the next gemstone needs */}
            {isStudentBadge && nextBadge && (
              <div style={{ marginBottom: 24 }}>
                <BadgeRequirementList next={nextBadge} current={badge} progress={progress ?? {}} />
              </div>
            )}

            {/* All badges strip */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('badges.popup.allBadges')}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {BADGES.slice(0, 7).map(b => (
                  <div
                    key={b.id}
                    title={t(b.nameKey)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: b.id === badge.id
                        ? `2px solid ${badge.color}`
                        : '2px solid rgba(255,255,255,0.12)',
                      opacity: b.id <= badge.id ? 1 : 0.3,
                      transition: 'all 0.2s',
                    }}
                  >
                    <img
                      src={b.image}
                      alt={t(b.nameKey)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={dismiss}
              style={{
                display: 'block',
                width: '100%',
                padding: '13px 24px',
                background: `linear-gradient(135deg, ${badge.color}, ${badge.color}bb)`,
                border: 'none',
                borderRadius: 10,
                color: badge.id === 1 ? '#5a2030' : '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                letterSpacing: 0.5,
                transition: 'all 0.2s',
                boxShadow: `0 4px 20px ${badge.color}44`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 30px ${badge.color}66`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${badge.color}44`;
              }}
            >
              {t('badges.popup.continue')}
            </button>
          </div>

          {/* Bottom gold line */}
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, transparent, ${badge.color}, transparent)`,
            }}
          />
        </div>
      </div>

      {/* Keyframe for glow pulse */}
      <style>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default BadgePopup;
