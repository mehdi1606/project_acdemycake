import React from 'react';

/**
 * Glass placeholders shown while a dashboard loads: the page keeps its shape,
 * so nothing jumps when the numbers arrive (feels faster than a spinner).
 */
export const DashSkeleton: React.FC<{ stats?: number; cards?: number }> = ({ stats = 4, cards = 2 }) => (
  <div aria-busy="true" aria-live="polite">
    <div className="row g-3 g-md-4 mb-4">
      {Array.from({ length: stats }).map((_, i) => (
        <div key={i} className={stats === 3 ? 'col-6 col-md-4' : 'col-6 col-xl-3'}>
          <div className="lx-skel lx-skel--stat">
            <span className="lx-skel__dot" />
            <span className="lx-skel__lines"><span /><span /></span>
          </div>
        </div>
      ))}
    </div>
    <div className="row g-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className={cards === 1 ? 'col-12' : i === 0 ? 'col-xl-5' : 'col-xl-7'}>
          <div className="lx-skel lx-skel--card"><span /><span /><span /></div>
        </div>
      ))}
    </div>
  </div>
);

export default DashSkeleton;
