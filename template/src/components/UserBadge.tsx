/**
 * UserBadge
 *
 * Renders the user's current badge with optional tooltip.
 * Sizes: 'sm' | 'md' | 'lg'
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeDefinition, badgeSrcSet } from '../config/badges';

interface Props {
  badge: BadgeDefinition;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
}

const SIZES = {
  sm: { img: 40,  font: 10 },
  md: { img: 64,  font: 12 },
  lg: { img: 100, font: 14 },
};

const UserBadge: React.FC<Props> = ({
  badge,
  size = 'md',
  showLabel = true,
  showTooltip = true,
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);   // mouse hover
  const [pinned, setPinned] = useState(false);     // tap / click toggle (touch users)
  const [focused, setFocused] = useState(false);   // keyboard focus
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const dim = SIZES[size];
  const tooltipOpen = showTooltip && (hovered || pinned || focused);

  /* Tapping/clicking outside closes a pinned tooltip; Escape closes it too. */
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPinned(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  return (
    <div
      ref={rootRef}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative',
        ...(showTooltip ? { cursor: 'pointer', outline: 'none' } : {}),
      }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(false); }}
      {...(showTooltip ? {
        role: 'button',
        tabIndex: 0,
        'aria-expanded': tooltipOpen,
        'aria-describedby': tooltipOpen ? tooltipId : undefined,
        'aria-label': t(badge.nameKey),
        onClick: () => { setPinned((p) => !p); setHovered(false); },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPinned((p) => !p); }
          if (e.key === 'Escape') { setPinned(false); setFocused(false); }
        },
        onFocus: (e: React.FocusEvent<HTMLDivElement>) => {
          // keyboard focus only (avoid double-toggle on tap)
          let kb = false;
          try { kb = e.currentTarget.matches(':focus-visible'); } catch { kb = false; }
          if (kb) setFocused(true);
        },
        onBlur: () => setFocused(false),
      } : {})}
    >
      {/* Badge image */}
      <div
        style={{
          width: dim.img,
          height: dim.img,
          borderRadius: '50%',
          border: `2px solid ${badge.color}88`,
          background: `radial-gradient(circle at 40% 35%, ${badge.color}22, transparent 70%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 ${dim.img / 3}px ${badge.color}33`,
          overflow: 'hidden',
          transition: 'box-shadow 0.3s',
          ...(tooltipOpen || hovered ? { boxShadow: `0 0 ${dim.img / 2}px ${badge.color}77` } : {}),
        }}
      >
        <img
          src={badge.image}
          srcSet={badgeSrcSet(badge.image)}
          sizes={`${dim.img}px`}
          alt={t(badge.nameKey)}
          loading="lazy"
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.35)',   // zoom into the centred shield (crops transparent padding)
          }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <span
          style={{
            fontSize: dim.font,
            fontWeight: 700,
            color: badge.color,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {t(badge.nameKey)}
        </span>
      )}

      {/* Tooltip */}
      {tooltipOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            background: 'rgba(20, 8, 12, 0.95)',
            border: `1px solid ${badge.color}55`,
            borderRadius: 10,
            padding: '10px 14px',
            minWidth: 200,
            maxWidth: 260,
            zIndex: 100,
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${badge.color}22`,
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              color: badge.color,
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {t(badge.nameKey)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {t(badge.descKey)}
          </p>
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${badge.color}55`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UserBadge;
