/**
 * BadgeGuide
 *
 * Multi-step visual guide through ALL badges.
 * Shows automatically on first account open (localStorage flag per user).
 * Can be reopened at any time via the trigger icon in the topbar.
 *
 * Slides:
 *   0  – Welcome / intro
 *   1–7 – Every student progression badge
 *   8   – Instructor badge  (always shown so students know it exists)
 *   9   – Admin badge       (always shown)
 *  10   – "Your badge RIGHT NOW" — personalised closing slide
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BADGES, BadgeDefinition } from '../config/badges';

const LS_KEY = 'slw_badge_guide_seen_';

interface Props {
  userId: string;
  currentBadge: BadgeDefinition;
  completedCourses: number;
  /** Controlled externally: set true to force the guide open (from trigger icon) */
  forceOpen?: boolean;
  onClose?: () => void;
}

/* ─── slide types ─────────────────────────────────────────── */
type Slide =
  | { type: 'intro' }
  | { type: 'badge'; badge: BadgeDefinition; isCurrent: boolean }
  | { type: 'current'; badge: BadgeDefinition; completedCourses: number };

const BadgeGuide: React.FC<Props> = ({
  userId,
  currentBadge,
  completedCourses,
  forceOpen = false,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  /* Build slide deck — all badges + personalised last slide */
  const slides: Slide[] = [
    { type: 'intro' },
    ...BADGES.map((b) => ({
      type: 'badge' as const,
      badge: b,
      isCurrent: b.id === currentBadge.id,
    })),
    { type: 'current', badge: currentBadge, completedCourses },
  ];

  const total = slides.length;

  /* Auto-open once per user */
  useEffect(() => {
    const seen = localStorage.getItem(`${LS_KEY}${userId}`);
    if (!seen) setVisible(true);
  }, [userId]);

  /* Open when forced from outside (icon click) */
  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setVisible(true);
    }
  }, [forceOpen]);

  const dismiss = useCallback(() => {
    localStorage.setItem(`${LS_KEY}${userId}`, '1');
    setVisible(false);
    onClose?.();
  }, [userId, onClose]);

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  if (!visible) return null;

  const current = slides[step];

  /* ── shared colours ── */
  const accentColor =
    current.type === 'badge'   ? current.badge.color :
    current.type === 'current' ? current.badge.color :
    '#C5973E';

  /* ── render helpers ── */
  const renderSlide = () => {
    if (current.type === 'intro') {
      return (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          {/* Trophy / stars graphic */}
          <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>🏅</div>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('badgeGuide.intro.title', 'Your Culinary Badge Journey')}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
            {t('badgeGuide.intro.body',
              'At SARALÖWE Academy, every course you complete earns you a higher chef rank. Discover all 7 student levels plus special badges for instructors and admins.'
            )}
          </p>
          {/* Mini preview strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {BADGES.slice(0, 7).map((b) => (
              <img
                key={b.id}
                src={b.image}
                alt=""
                style={{
                  width: 38, height: 38,
                  borderRadius: '50%',
                  border: `2px solid ${b.color}55`,
                  objectFit: 'contain',
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (current.type === 'badge') {
      const { badge, isCurrent } = current;
      const isStudentBadge = badge.id <= 7;
      return (
        <div style={{ textAlign: 'center' }}>
          {/* Badge index chip */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase',
              color: badge.color,
              background: `${badge.color}18`,
              padding: '4px 12px', borderRadius: 20,
              border: `1px solid ${badge.color}44`,
            }}>
              {isStudentBadge
                ? t('badgeGuide.badge.level', 'Level {{n}}', { n: badge.id })
                : t('badgeGuide.badge.special', 'Special Badge')
              }
            </span>
          </div>

          {/* Badge image */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            {/* Active ring if this is the user's current badge */}
            {isCurrent && (
              <div style={{
                position: 'absolute', inset: -10,
                borderRadius: '50%',
                border: `2px solid ${badge.color}`,
                animation: 'badgeGuidePulse 1.8s ease-in-out infinite',
              }} />
            )}
            <img
              src={badge.image}
              alt={t(badge.nameKey)}
              style={{
                width: 130, height: 'auto',
                filter: `drop-shadow(0 0 16px ${badge.color}66)`,
                position: 'relative', zIndex: 1,
              }}
            />
            {/* "YOURS" label */}
            {isCurrent && (
              <div style={{
                position: 'absolute', bottom: -6, left: '50%',
                transform: 'translateX(-50%)',
                background: badge.color, color: badge.id === 1 ? '#5a2030' : '#fff',
                fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                zIndex: 2,
              }}>
                {t('badgeGuide.badge.yours', 'YOURS')}
              </div>
            )}
          </div>

          {/* Name */}
          <h4 style={{
            color: badge.color, fontWeight: 800, fontSize: 20,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            {t(badge.nameKey)}
          </h4>

          {/* Criteria */}
          {isStudentBadge && badge.id > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 12,
            }}>
              <span style={{ color: badge.color, fontSize: 13 }}>{'★'.repeat(badge.stars)}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                {badge.id === 1
                  ? t('badgeGuide.badge.startBadge', 'Starting badge — welcome!')
                  : t('badgeGuide.badge.criteria', '{{n}}+ courses completed', { n: badge.minCourses })
                }
              </span>
            </div>
          )}

          {/* Description */}
          <p style={{
            color: 'rgba(255,255,255,0.68)', fontSize: 13.5,
            lineHeight: 1.7, margin: 0,
          }}>
            {t(badge.descKey)}
          </p>
        </div>
      );
    }

    if (current.type === 'current') {
      const { badge } = current;
      const isElite = badge.id === 7;
      const nextBadge = badge.id < 7 ? BADGES[badge.id] : null; // BADGES is 0-indexed; badge 1 = index 0

      return (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            color: badge.color, textTransform: 'uppercase', marginBottom: 8,
          }}>
            {t('badgeGuide.current.subtitle', 'Your Badge Right Now')}
          </p>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 20 }}>
            {t('badgeGuide.current.title', 'You are')} {t(badge.nameKey)}!
          </h3>

          {/* Badge with glow */}
          <div style={{ display: 'inline-block', position: 'relative', marginBottom: 16 }}>
            <div style={{
              position: 'absolute', inset: -16, borderRadius: '50%',
              background: `radial-gradient(circle, ${badge.color}22, transparent 70%)`,
              animation: 'badgeGuidePulse 2s ease-in-out infinite',
            }} />
            <img
              src={badge.image}
              alt={t(badge.nameKey)}
              style={{
                width: 150, height: 'auto',
                filter: `drop-shadow(0 0 20px ${badge.color}88)`,
                position: 'relative', zIndex: 1,
              }}
            />
          </div>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            {t(badge.descKey)}
          </p>

          {/* Progress to next (students only) */}
          {nextBadge && badge.id <= 7 && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 0,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 8,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                  {t('badges.popup.nextLevel', 'Next Level')}
                </span>
                <span style={{ color: nextBadge.color, fontSize: 12, fontWeight: 700 }}>
                  {t(nextBadge.nameKey)}
                </span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 100, height: 6, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: `linear-gradient(90deg, ${badge.color}, ${nextBadge.color})`,
                  width: `${Math.min(100, (completedCourses / nextBadge.minCourses) * 100)}%`,
                  transition: 'width 1s ease',
                }} />
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.45)', fontSize: 11,
                marginTop: 6, marginBottom: 0,
              }}>
                {t('badges.popup.coursesNeeded', {
                  completed: completedCourses,
                  needed: nextBadge.minCourses,
                })}
              </p>
            </div>
          )}

          {isElite && (
            <div style={{
              background: `${badge.color}18`, border: `1px solid ${badge.color}55`,
              borderRadius: 12, padding: '12px 18px',
            }}>
              <p style={{ color: badge.color, fontWeight: 700, margin: 0, fontSize: 14 }}>
                🏆 {t('badgeGuide.current.elite', 'You have reached the highest level!')}
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
          backdropFilter: 'blur(5px)',
        }}
      />

      {/* Modal */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: '100%', maxWidth: 500,
          padding: '0 16px',
        }}
      >
        <div style={{
          background: 'linear-gradient(160deg, #1a0a0e 0%, #2d1218 60%, #1a0a0e 100%)',
          border: `2px solid ${accentColor}44`,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: `0 0 70px ${accentColor}22, 0 28px 70px rgba(0,0,0,0.75)`,
          transition: 'border-color 0.4s ease',
        }}>
          {/* Top accent line */}
          <div style={{
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            transition: 'background 0.4s ease',
          }} />

          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 0',
          }}>
            {/* Step indicator */}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600 }}>
              {step + 1} / {total}
            </span>

            {/* Dot bar */}
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {slides.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === step ? accentColor : 'rgba(255,255,255,0.18)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            {/* Close */}
            <button
              onClick={dismiss}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '50%',
                width: 30, height: 30,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.55)',
                fontSize: 17,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Slide content */}
          <div style={{ padding: '20px 28px 24px', minHeight: 340 }}>
            {renderSlide()}
          </div>

          {/* Footer navigation */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px 24px',
            gap: 12,
          }}>
            {/* Previous */}
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '10px 20px',
                color: step === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {isRtl ? '›' : '‹'} {t('badgeGuide.nav.previous', 'Previous')}
            </button>

            {/* Skip (only on non-last slides) */}
            {step < total - 1 && (
              <button
                onClick={() => setStep(total - 1)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                {t('badgeGuide.nav.skip', 'Skip to my badge')}
              </button>
            )}

            {/* Next / Done */}
            <button
              onClick={step < total - 1 ? next : dismiss}
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
                border: 'none',
                borderRadius: 10, padding: '10px 22px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                boxShadow: `0 4px 16px ${accentColor}44`,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {step < total - 1
                ? <>{t('badgeGuide.nav.next', 'Next')} {isRtl ? '‹' : '›'}</>
                : t('badgeGuide.nav.done', 'Got it!')
              }
            </button>
          </div>

          {/* Bottom accent line */}
          <div style={{
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            transition: 'background 0.4s ease',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes badgeGuidePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.12); }
        }
      `}</style>
    </>
  );
};

export default BadgeGuide;
