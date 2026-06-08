/**
 * BadgeAvatar
 *
 * Circular avatar wrapped by the user's badge as:
 *   - a coloured glowing ring
 *   - a small badge shield icon in the bottom-right corner
 *
 * Props
 *   avatarUrl   – profile image URL (null/undefined → show initials)
 *   name        – full name (used for initials + alt text)
 *   badge       – the user's BadgeDefinition
 *   size        – 'sm' (36 px) | 'md' (48 px) | 'lg' (56 px)
 *   roleColor   – fallback ring color when badge is undefined
 */

import React from 'react';
import { BadgeDefinition } from '../config/badges';

interface Props {
  avatarUrl?: string | null;
  name?: string;
  badge?: BadgeDefinition;
  size?: 'sm' | 'md' | 'lg';
  roleColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const DIMS = {
  sm: { outer: 36, inner: 30, badge: 16, fontSize: 13, borderW: 2 },
  md: { outer: 48, inner: 40, badge: 20, fontSize: 16, borderW: 2 },
  lg: { outer: 56, inner: 46, badge: 22, fontSize: 18, borderW: 3 },
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
        width: d.outer,
        height: d.outer,
        borderRadius: '50%',
        position: 'relative',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${d.borderW}px solid ${ringColor}88`,
          boxShadow: `0 0 ${d.outer / 3}px ${ringColor}44`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Inner avatar circle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: d.inner,
          height: d.inner,
          borderRadius: '50%',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${ringColor}28 0%, ${ringColor}12 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          <span style={{ color: ringColor, fontWeight: 700, fontSize: d.fontSize }}>
            {initial}
          </span>
        )}
      </div>

      {/* Small badge icon — bottom-right corner */}
      {badge && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: d.badge,
            height: d.badge,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `1.5px solid rgba(20,8,12,0.85)`,
            background: 'rgba(20,8,12,0.9)',
            zIndex: 3,
            boxShadow: `0 2px 6px rgba(0,0,0,0.5)`,
          }}
        >
          <img
            src={badge.image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default BadgeAvatar;
