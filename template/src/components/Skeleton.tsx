import React from 'react';

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(107,29,42,0.05) 25%, rgba(107,29,42,0.10) 50%, rgba(107,29,42,0.05) 75%)',
  backgroundSize: '200% 100%',
  animation: 'lx-skeleton-shimmer 1.4s infinite',
  borderRadius: 6,
};

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('lx-skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'lx-skeleton-styles';
  style.textContent = `
    @keyframes lx-skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

// ── Primitives ────────────────────────────────────────────────────────────────

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ width = '100%', height = 16, style, className }) => (
  <div style={{ width, height, ...shimmer, ...style }} className={className} />
);

export const SkeletonText: React.FC<{ lines?: number; lastWidth?: string }> = ({ lines = 3, lastWidth = '60%' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox key={i} height={14} width={i === lines - 1 ? lastWidth : '100%'} />
    ))}
  </div>
);

// ── Composite Skeletons ───────────────────────────────────────────────────────

export const SkeletonCard: React.FC = () => (
  <div style={{ background: 'var(--lx-card)', border: '1px solid var(--lx-border)', borderRadius: 'var(--lx-radius)', overflow: 'hidden' }}>
    <SkeletonBox height={180} style={{ borderRadius: 0 }} />
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SkeletonBox height={18} width="80%" />
      <SkeletonBox height={14} width="50%" />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <SkeletonBox height={14} width="30%" />
        <SkeletonBox height={14} width="20%" />
      </div>
    </div>
  </div>
);

export const SkeletonCardGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '12px 16px' }}>
        <SkeletonBox height={14} width={i === 0 ? '80%' : '60%'} />
      </td>
    ))}
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <tbody>
      {Array.from({ length: rows }).map((_, i) => <SkeletonTableRow key={i} cols={cols} />)}
    </tbody>
  </table>
);

export const SkeletonListItem: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--lx-border)' }}>
    <SkeletonBox width={44} height={44} style={{ borderRadius: '50%', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SkeletonBox height={14} width="60%" />
      <SkeletonBox height={12} width="40%" />
    </div>
    <SkeletonBox height={28} width={64} style={{ borderRadius: 20, flexShrink: 0 }} />
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => <SkeletonListItem key={i} />)}
  </div>
);

export const SkeletonStatCard: React.FC = () => (
  <div style={{ background: 'var(--lx-card)', border: '1px solid var(--lx-border)', borderRadius: 'var(--lx-radius)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <SkeletonBox height={12} width="50%" />
      <SkeletonBox width={36} height={36} style={{ borderRadius: 8, flexShrink: 0 }} />
    </div>
    <SkeletonBox height={28} width="40%" />
    <SkeletonBox height={10} width="60%" />
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
    </div>
    <div style={{ background: 'var(--lx-card)', border: '1px solid var(--lx-border)', borderRadius: 'var(--lx-radius)', padding: 24 }}>
      <SkeletonBox height={20} width="30%" style={{ marginBottom: 20 }} />
      <SkeletonBox height={220} />
    </div>
  </div>
);
