import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCountryFlag from 'react-country-flag';

const languages = [
  { code: 'en', countryCode: 'GB', label: 'English', native: 'English' },
  { code: 'ar', countryCode: 'SA', label: 'Arabic',  native: 'العربية' },
];

interface LanguageSwitcherProps {
  /** 'dark' for use inside the burgundy header, 'light' for dashboard sidebars */
  variant?: 'dark' | 'light';
}

const Flag: React.FC<{ countryCode: string; size?: number }> = ({ countryCode, size = 22 }) => (
  <ReactCountryFlag
    countryCode={countryCode}
    svg
    style={{
      width: size,
      height: size * 0.67,
      borderRadius: 3,
      objectFit: 'cover',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      flexShrink: 0,
    }}
  />
);

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dark' }) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === i18n.language) ?? languages[0];

  const handleChange = (code: string) => {
    setOpen(false);
    if (code === i18n.language) return;
    // Detect text the visitor has typed but not submitted yet — a reload would wipe it.
    const hasUnsavedInput = (() => {
      try {
        const fields = Array.from(
          document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'),
        );
        return fields.some((el) => {
          if (el instanceof HTMLInputElement) {
            const skip = ['hidden', 'checkbox', 'radio', 'submit', 'button', 'file', 'range', 'color', 'search'];
            if (skip.includes(el.type)) return false;
          }
          return el.value.trim() !== '' && el.value !== el.defaultValue;
        });
      } catch {
        return false;
      }
    })();
    // i18n.ts already flips <html dir/lang>, the Arabic font and the Accept-Language header on
    // 'languageChanged', so UI strings switch in place. A reload is only used to re-fetch
    // DB content (localised by the backend) — and is skipped when it would lose typed text.
    i18n.changeLanguage(code).then(() => {
      if (!hasUnsavedInput) window.location.reload();
    });
  };

  // Close on outside click / Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const isDark = variant === 'dark';

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(101,28,50,0.06)',
    color: isDark ? 'rgba(255,255,255,0.75)' : '#2C1810',
    fontSize: 13, fontWeight: 600,
    transition: 'all 0.2s ease',
    height: 38,
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        style={btnStyle}
        onClick={() => setOpen(!open)}
        title={t('nav.changeLanguage', 'Change language')}
        aria-label={t('nav.changeLanguage', 'Change language')}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background =
            isDark ? 'rgba(255,255,255,0.15)' : 'rgba(101,28,50,0.12)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background =
            isDark ? 'rgba(255,255,255,0.08)' : 'rgba(101,28,50,0.06)';
        }}
      >
        <Flag countryCode={currentLang.countryCode} size={22} />
        <span className="d-none d-md-inline">{currentLang.code.toUpperCase()}</span>
        <i
          className={`isax isax-arrow-${open ? 'up' : 'down'}-1`}
          style={{ fontSize: 10, opacity: 0.6 }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)',
          right: 0, minWidth: 168,
          background: '#fff',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          border: '1px solid rgba(101,28,50,0.08)',
          zIndex: 9999,
          animation: 'fadeInDown 0.15s ease',
        }}>
          {languages.map(lang => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                lang={lang.code}
                onClick={() => handleChange(lang.code)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isActive ? 'rgba(197,151,62,0.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid #C5973E' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <Flag countryCode={lang.countryCode} size={28} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1810', lineHeight: 1.2 }}>
                    {lang.native}
                  </div>
                  <div style={{ fontSize: 11, color: '#9A8080', lineHeight: 1.3 }}>{lang.label}</div>
                </div>
                {isActive && (
                  <i className="isax isax-tick-circle" style={{ color: '#C5973E', fontSize: 16, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
