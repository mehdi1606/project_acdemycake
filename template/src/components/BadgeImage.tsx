/**
 * BadgeImage
 *
 * Performance-optimised badge <img> used everywhere a badge graphic is shown.
 *
 * Features (addresses the onboarding slow-load issues):
 *  - Responsive `srcset` (128 / 256 / 512 WebP) → the browser downloads only the
 *    size it needs for the rendered box + device DPR.
 *  - Native lazy-loading for off-screen badges (`loading="lazy"`), eager for the
 *    one the user is looking at (`priority`).
 *  - `decoding="async"` so decode never blocks the main thread.
 *  - Fixed-size wrapper → zero layout shift while the image loads.
 *  - Lightweight shimmer skeleton until the first paint; skipped entirely if this
 *    badge URL has already loaded once this session (in-memory cache).
 *  - The same zoom-into-the-shield crop the rest of the app uses (cover + scale),
 *    so transparent padding is clipped away.
 */

import React, { useState } from 'react';
import { badgeSrcSet, isBadgeLoaded, markBadgeLoaded } from '../config/badges';

interface Props {
  src: string;
  alt?: string;
  /** Rendered box size in px (square). Drives `sizes` and prevents layout shift. */
  size: number;
  /** Accent colour for the skeleton shimmer. */
  color?: string;
  /** Eager-load (use for the badge currently on screen). Default: lazy. */
  priority?: boolean;
  /** Zoom factor into the centred shield (crops transparent padding). */
  scale?: number;
  /** Border radius of the frame. Default 50% (circle). */
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const BadgeImage: React.FC<Props> = ({
  src,
  alt = '',
  size,
  color = '#C5912C',
  priority = false,
  scale = 1.35,
  radius = '50%',
  className,
  style,
}) => {
  // If we've already loaded this badge once, render it instantly (no skeleton).
  const [loaded, setLoaded] = useState(() => isBadgeLoaded(src));

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
        background: loaded ? 'transparent' : `${color}14`,
        ...style,
      }}
    >
      {/* Skeleton shimmer — shown only until first load */}
      {!loaded && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(100deg, ${color}10 30%, ${color}33 50%, ${color}10 70%)`,
            backgroundSize: '200% 100%',
            animation: 'badgeShimmer 1.1s ease-in-out infinite',
          }}
        />
      )}

      <img
        src={src}
        srcSet={badgeSrcSet(src)}
        sizes={`${size}px`}
        alt={alt}
        width={size}
        height={size}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-ignore - fetchPriority is valid HTML but not in older React DOM types
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => { markBadgeLoaded(src); setLoaded(true); }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* keyframes (scoped, injected once is fine — identical rule dedupes) */}
      <style>{`@keyframes badgeShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
};

export default BadgeImage;
