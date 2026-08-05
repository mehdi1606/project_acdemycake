import React, { useState, useEffect } from 'react';

/**
 * AvatarImage
 *
 * Renders a user's avatar, falling back to their coloured initial whenever the
 * picture is missing OR fails to load. Without this, a dead avatar URL renders
 * the browser's broken-image glyph, which is what users see as a "broken" card.
 *
 * Two modes:
 *   • `size` given      → renders its own circle of that size.
 *   • `size` omitted    → fills the parent element (for existing styled circles).
 *
 * `src` should already be resolved (e.g. via getFileUrl) by the caller.
 */
interface Props {
  src?: string | null;
  name?: string;
  /** Renders a self-contained circle of this many px. Omit to fill the parent. */
  size?: number;
  /** Background of the fallback circle. */
  bg?: string;
  /** Colour of the fallback initial. */
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

const AvatarImage: React.FC<Props> = ({
  src,
  name,
  size,
  bg = 'linear-gradient(135deg, #6B1D2A, #C5973E)',
  color = '#fff',
  className,
  style,
  alt = '',
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || 'U';
  const showImage = !!src && !failed;

  const box: React.CSSProperties = size
    ? { width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', ...style }
    : { width: '100%', height: '100%', ...style };

  if (showImage) {
    return (
      <img
        src={src as string}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        onError={() => setFailed(true)}
        style={{ ...box, objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <span
      className={className}
      aria-label={name || undefined}
      style={{
        ...box,
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size ? Math.round(size * 0.42) : '1em',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {initial}
    </span>
  );
};

export default AvatarImage;
