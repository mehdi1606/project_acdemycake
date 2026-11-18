import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook, EbookAccessError } from '../../services/api/ebook.service';
import PdfPageViewer from './PdfPageViewer';

const GOLD = '#C5912C';
const DARK = '#1A0A10';
const ZOOMS = [0.6, 0.75, 1, 1.25, 1.5, 2];
const HEADER_H = 68;

/**
 * Reads an owned ebook — inside the platform only.
 *
 * The PDF is fetched with the JWT in the Authorization header (never a shareable
 * URL; ownership is checked on every request) and drawn page by page onto
 * canvases. There is deliberately no download button, and the browser's own PDF
 * viewer (which has save/print buttons) is not used.
 */
const EbookReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [language, setLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomIdx, setZoomIdx] = useState(2);
  const [pages, setPages] = useState(0);

  // Find the book in the user's library (also proves ownership client-side).
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    ebookService.getMyLibrary()
      .then(list => {
        if (cancelled) return;
        const found = (list || []).find(b => b.id === id) || null;
        setEbook(found);
        if (found) {
          const ui = i18n.language?.slice(0, 2) || 'en';
          setLanguage(found.languages?.includes(ui) ? ui : (found.languages?.[0] || ''));
        } else {
          setError(t('ebooks.notOwned', 'You have not purchased this ebook.'));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setError(t('ebooks.loadError', 'Could not load the ebook.')); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [id, i18n.language, t]);

  // An owner must never be told they lack access when the file is just missing.
  const accessMessage = useCallback((e: unknown) => {
    if (e instanceof EbookAccessError) {
      if (e.reason === 'NOT_OWNED') return t('ebooks.notOwned', 'You have not purchased this ebook.');
      if (e.reason === 'UNAVAILABLE') {
        return t('ebooks.fileUnavailable', 'Your purchase is saved, but this ebook file is temporarily unavailable. Please try again later or contact us.');
      }
    }
    return t('ebooks.loadError', 'Could not load the ebook.');
  }, [t]);

  // Load the chosen edition.
  useEffect(() => {
    if (!id || !ebook) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    ebookService.fetchContent(id, language || undefined)
      .then(buf => { if (!cancelled) setData(buf); })
      .catch(e => { if (!cancelled) setError(accessMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, ebook, language, accessMessage]);

  // No saving or printing from the reader.
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p')) e.preventDefault();
    };
    window.addEventListener('keydown', block);
    return () => window.removeEventListener('keydown', block);
  }, []);

  const toolBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 800,
    border: '1px solid rgba(197,145,44,0.35)', background: 'transparent', color: GOLD,
  };

  return (
    <div className="eb-reader" style={{ background: DARK, minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: HEADER_H }}>
      <style>{'@media print { .eb-reader { display: none !important } }'}</style>

      {/* Toolbar */}
      <div style={{
        // Sits just under the site's fixed header (68px).
        position: 'sticky', top: HEADER_H, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '12px 20px', borderBottom: '1px solid rgba(197,145,44,0.25)',
        background: 'rgba(26,10,16,0.96)',
      }}>
        <button
          type="button"
          onClick={() => navigate(all_routes.studentEbooks)}
          style={{
            background: 'none', border: '1px solid rgba(197,145,44,0.35)', borderRadius: 8,
            color: GOLD, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          ← {t('ebooks.myLibrary', 'My library')}
        </button>

        <span style={{ color: '#F5DADF', fontWeight: 700, fontSize: 15, flex: 1, minWidth: 160 }}>
          {ebook?.title || ''}
          {pages > 0 && (
            <span style={{ fontWeight: 500, opacity: 0.6, fontSize: 13, marginInlineStart: 8 }}>
              · {t('ebooks.pages', '{{n}} pages', { n: pages })}
            </span>
          )}
        </span>

        {/* Edition switcher (only when a title has several languages) */}
        {ebook && ebook.languages?.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {ebook.languages.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                style={{
                  padding: '6px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  border: `1px solid ${language === l ? GOLD : 'rgba(197,145,44,0.3)'}`,
                  background: language === l ? GOLD : 'transparent',
                  color: language === l ? DARK : GOLD,
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button type="button" aria-label={t('ebooks.zoomOut', 'Zoom out')} style={toolBtn}
              disabled={zoomIdx === 0} onClick={() => setZoomIdx(i => Math.max(0, i - 1))}>−</button>
            <span style={{ color: GOLD, fontSize: 12, minWidth: 40, textAlign: 'center' }}>
              {Math.round(ZOOMS[zoomIdx] * 100)}%
            </span>
            <button type="button" aria-label={t('ebooks.zoomIn', 'Zoom in')} style={toolBtn}
              disabled={zoomIdx === ZOOMS.length - 1} onClick={() => setZoomIdx(i => Math.min(ZOOMS.length - 1, i + 1))}>+</button>
          </div>
        )}
      </div>

      {/* Viewer */}
      <div style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid rgba(197,145,44,0.25)', borderTopColor: GOLD,
              animation: 'spin 0.9s linear infinite',
            }} />
            <span style={{ color: 'rgba(245,218,223,0.7)', fontSize: 13 }}>
              {t('ebooks.opening', 'Opening your ebook…')}
            </span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#F5DADF' }}>
            <i className="isax isax-lock-1" style={{ fontSize: 44, color: GOLD, display: 'block', marginBottom: 14 }} />
            <p style={{ fontWeight: 700, maxWidth: 520, margin: '0 auto' }}>{error}</p>
            <button
              type="button"
              onClick={() => navigate(all_routes.ebooks)}
              style={{
                marginTop: 16, padding: '10px 22px', borderRadius: 999, border: 'none',
                background: GOLD, color: DARK, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {t('ebooks.backToList', 'Back to ebooks')}
            </button>
          </div>
        ) : data ? (
          <PdfPageViewer
            data={data}
            zoom={ZOOMS[zoomIdx]}
            onPageCount={setPages}
            onError={() => setError(t('ebooks.loadError', 'Could not load the ebook.'))}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EbookReader;
