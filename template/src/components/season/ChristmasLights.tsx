/**
 * A string of Christmas lights: a dark wire hanging in soft swags with a
 * glowing bulb at the bottom of each swag. It sits along the bottom edge (or
 * the top edge) of whatever positioned box it is placed in, and draws
 * nothing outside the Christmas season.
 */
import React, { useEffect, useRef, useState } from 'react';
import { isChristmasSeason } from '../../config/season';
import './xmas.css';

const COLORS = ['#E0233D', '#F2C14E', '#2F9E5B', '#FFF1CF', '#F59AB0', '#F2C14E'];

interface Props {
  /** 'bottom' hangs below the box (header), 'top' lies along its top edge (player, footer). */
  edge?: 'bottom' | 'top';
  /** Distance between bulbs, in pixels. */
  spacing?: number;
  className?: string;
}

const ChristmasLights: React.FC<Props> = ({ edge = 'bottom', spacing = 54, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [on] = useState(isChristmasSeason);

  useEffect(() => {
    if (!on || !ref.current) return;
    const el = ref.current;
    const measure = () => setCount(Math.max(4, Math.round(el.clientWidth / spacing)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [on, spacing]);

  if (!on) return null;

  // one swag per bulb, in a 0..100 × 0..20 box stretched to the strip
  let d = 'M0 2';
  for (let i = 0; i < count; i++) {
    const x0 = (i / count) * 100, x1 = ((i + 1) / count) * 100;
    d += ` Q${(x0 + x1) / 2} 22 ${x1} 2`;
  }

  return (
    <div ref={ref} className={`sl-lights sl-lights--${edge} ${className}`} aria-hidden="true">
      <svg className="sl-lights__wire" viewBox="0 0 100 20" preserveAspectRatio="none">
        <path d={d} vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="sl-bulb"
          style={{
            left: `${((i + 0.5) / count) * 100}%`,
            ['--c' as string]: COLORS[i % COLORS.length],
            ['--d' as string]: `${((i * 0.37) % 2.4).toFixed(2)}s`,
            ['--t' as string]: `${1.8 + ((i * 0.53) % 1.6)}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default ChristmasLights;
