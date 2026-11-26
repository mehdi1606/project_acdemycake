import React from 'react';

interface LxEmptyStateProps {
  /** isax icon name without the "isax " prefix, e.g. "isax-book" */
  icon: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  /** smaller padding, for use inside tables and side panels */
  compact?: boolean;
  /** optional actions (buttons / links) shown under the text */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The glass atelier empty state: an icon in a glass circle, a short serif
 * title and one helpful line. Styled by .lx-empty-state (_lux-glass*.scss).
 */
const LxEmptyState: React.FC<LxEmptyStateProps> = ({ icon, title, text, compact, children, className }) => (
  <div className={['lx-empty-state', compact ? 'is-compact' : '', className || ''].filter(Boolean).join(' ')} role="status">
    <div className="empty-icon" aria-hidden="true"><i className={`isax ${icon}`} /></div>
    <h6>{title}</h6>
    {text && <p>{text}</p>}
    {children && <div className="d-flex gap-2 justify-content-center flex-wrap">{children}</div>}
  </div>
);

export default LxEmptyState;
