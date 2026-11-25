/**
 * The platform's Christmas dress, mounted once by the app shell.
 * Adds `sl-xmas` to <body> (xmas.css keys every seasonal touch on it) and
 * lets the snow fall. Course lessons get no page snow: the player has its own.
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isChristmasSeason } from '../../config/season';
import Snowfall from './Snowfall';
import './xmas.css';

const QUIET_SNOW = ['/student/', '/instructor/', '/admin/'];

const ChristmasDecor: React.FC = () => {
  const [on] = useState(isChristmasSeason);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!on) return;
    document.body.classList.add('sl-xmas');
    return () => document.body.classList.remove('sl-xmas');
  }, [on]);

  if (!on || pathname.startsWith('/course/course-watch')) return null;
  return <Snowfall density={QUIET_SNOW.some((p) => pathname.startsWith(p)) ? 0.45 : 1} />;
};

export default ChristmasDecor;

/** Gold, crimson and green baubles hanging on ribbons, for the corners of a bar. */
export const HangingOrnaments: React.FC<{ side: 'start' | 'end' }> = ({ side }) => {
  const [on] = useState(isChristmasSeason);
  if (!on) return null;
  const set = side === 'start'
    ? [{ len: 34, c: 'gold' }, { len: 58, c: 'crimson' }, { len: 22, c: 'green' }]
    : [{ len: 26, c: 'green' }, { len: 52, c: 'gold' }, { len: 38, c: 'crimson' }];
  return (
    <div className={`sl-ornaments sl-ornaments--${side}`} aria-hidden="true">
      {set.map((o, i) => (
        <span key={i} className={`sl-orn sl-orn--${o.c}`} style={{ ['--len' as string]: `${o.len}px`, ['--d' as string]: `${i * 0.6}s` } as React.CSSProperties}>
          <i />
        </span>
      ))}
    </div>
  );
};

/** A little Santa hat that sits on a logo (place inside a position:relative box). */
export const SantaHat: React.FC<{ size?: number; className?: string }> = ({ size = 26, className = '' }) => {
  const [on] = useState(isChristmasSeason);
  if (!on) return null;
  return (
    <svg className={`sl-santa-hat ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 46 C14 22 30 8 46 10 C52 11 56 16 58 24 C52 20 46 22 44 30 L40 46 Z" fill="#C8102E" />
      <path d="M8 46 C14 22 30 8 46 10 C40 14 30 26 26 46 Z" fill="#E0233D" opacity=".7" />
      <rect x="4" y="42" width="42" height="11" rx="5.5" fill="#FFF8F0" />
      <circle cx="58" cy="27" r="6" fill="#FFF8F0" />
    </svg>
  );
};
