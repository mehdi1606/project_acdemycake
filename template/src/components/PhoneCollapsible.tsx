import React, { useState } from 'react';
import useIsPhone from '../hooks/useIsPhone';

/**
 * On phones, folds a long panel (e.g. course filters) behind an elegant toggle
 * so results show first. On tablets and desktops it renders the children
 * untouched — the DOM is exactly what it was before.
 */
const PhoneCollapsible: React.FC<{ label: React.ReactNode; active?: boolean; children: React.ReactNode }> = ({
  label, active, children,
}) => {
  const isPhone = useIsPhone();
  const [open, setOpen] = useState(false);

  if (!isPhone) return <>{children}</>;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
          border: '1px solid rgba(197,145,44,0.32)', background: '#fff',
          color: '#651C32', fontWeight: 800, fontSize: 14,
          boxShadow: '0 4px 18px rgba(78,20,32,0.07)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <i className="isax isax-filter" style={{ color: '#C5912C', fontSize: 18 }} />
          {label}
          {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C5912C' }} />}
        </span>
        <i className={`isax ${open ? 'isax-arrow-up-2' : 'isax-arrow-down-1'}`} style={{ fontSize: 16, color: '#C5912C' }} />
      </button>
      {open && <div style={{ marginTop: 12, animation: 'slCwFade .25s ease' }}>{children}</div>}
    </div>
  );
};

export default PhoneCollapsible;
