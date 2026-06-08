/**
 * BadgeAvatar
 *
 * Circular avatar wrapped by the user's badge:
 *   - Coloured glowing ring around the circle
 *   - Small badge shield in the bottom-right corner
 *
 * The outer container is intentionally overflow: visible so the ring
 * and corner badge are not clipped by any parent overflow: hidden rule.
 */

import React from 'react';
import { BadgeDefinition } from '../config/badges';

interface Props {
  avatarUrl?: string | null;
  name?: string;
  badge?: BadgeDefinition;
  /** sm=40 | md=52 | lg=62 (outer px) */
  size?: 'sm' | 'md' | 'lg';
  roleColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const DIMS = {
  sm: { outer: 40, inner: 32, cornerBadge: 20, fontSize: 14, ring: 2 },
  md: { outer: 52, inner: 42, cornerBadge: 24, fontSize: 17, ring: 2 },
  lg: { outer: 62, inner: 50, cornerBadge: 26, fontSize: 20, ring: 3 },
};

const BadgeAvatar: React.FC<Props> = ({
  avatarUrl,
  name,
  badge,
  size = 'md',
  roleColor = '#C5973E',
  className,
  style,
}) => {
  const d = DIMS[size];
  const ringColor = badge?.color ?? roleColor;
  const initial = name?.charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={className}
      style={{
        /* These override any CSS class that sets width/height/overflow */
        width: d.outer,
        height: d.outer,
        borderRadius: '50%',
        position: 'relative',
        flexShrink: 0,
        overflow: 'visible',          /* ← critical: lets ring + corner badge show */
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${d.ring}px solid ${ringColor}`,
          boxShadow: `0 0 8px ${ringColor}88, 0 0 14px ${ringColor}44`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Inner avatar circle (this one has overflow:hidden to clip the image) */}
      <div
        style={{
          width: d.inner,
          height: d.inner,
          borderRadius: '50%',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${ringColor}30 0%, ${ringColor}14 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              color: ringColor,
              fontWeight: 800,
              fontSize: d.fontSize,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {initial}
          </span>
        )}
      </div>

      {/* Corner badge shield */}
      {badge && (
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: d.cornerBadge,
            height: d.cornerBadge,
            borderRadius: '50%',
            background: '#fff',
            border: '1.5px solid rgba(255,255,255,0.9)',
            boxShadow: `0 2px 8px rgba(0,0,0,0.28), 0 0 6px ${ringColor}55`,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src={badge.image}
            alt=""
            style={{
              width: '90%',
              height: '90%',
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BadgeAvatar;
