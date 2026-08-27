import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook } from '../../services/api/ebook.service';

const GOLD = '#C5912C';
const DARK = '#1A0A10';

/**
 * Reads an owned ebook.
 *
 * The PDF is fetched as a blob with the JWT in the Authorization header, so the
 * file URL is never a shareable link — the server checks ownership on every
 * request. `#toolbar=0` hides the browser's built-in download/print bar; the
 * explicit Download button is the supported route.
 */
const EbookReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  // Load the chosen edition.
  const loadContent = useCallback(async (lang: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const url = await ebookService.fetchContentBlobUrl(id, lang || undefined);
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (e: any) {
      setError(e?.message || t('ebooks.loadError', 'Could not load the ebook.'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (ebook && language !== null) loadContent(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebook, language]);

  // Release the blob when leaving the reader.
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  const handleDownload = async () => {
    if (!id || !ebook) return;
    setDownloading(true);
    try {
      const safe = ebook.title.replace(/[^\w؀-ۿ -]/g, '').trim() || 'ebook';
      await ebookService.download(id, `${safe}.pdf`, language || undefined);
    } catch (e: any) {
      message.error(e?.message || t('ebooks.downloadError', 'Download failed'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ background: DARK, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '12px 20px', borderBottom: '1px solid rgba(197,145,44,0.25)',
        background: 'rgba(0,0,0,0.35)',
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
        </span>

        {/* Edition switcher — Alchemy ships FR and AR under one purchase */}
        {ebook && ebook.languages?.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {ebook.languages.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                style={{
                  padding: '6px 13px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 800,
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

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !ebook}
          style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: downloading ? 'wait' : 'pointer',
            background: `linear-gradient(135deg, ${GOLD}, #E0C56E)`, color: DARK,
            fontSize: 13, fontWeight: 800, opacity: downloading ? 0.7 : 1,
          }}
        >
          <i className="isax isax-document-download" style={{ marginInlineEnd: 6 }} />
          {downloading ? t('common.loading', 'Loading…') : t('ebooks.download', 'Download')}
        </button>
      </div>

      {/* Viewer */}
      <div style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid rgba(197,145,44,0.25)', borderTopColor: GOLD,
              animation: 'spin 0.9s linear infinite',
            }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#F5DADF' }}>
            <i className="isax isax-lock-1" style={{ fontSize: 44, color: GOLD, display: 'block', marginBottom: 14 }} />
            <p style={{ fontWeight: 700 }}>{error}</p>
            <button
              type="button"
              onClick={() => navigate(all_routes.ebooks)}
              style={{
                marginTop: 12, padding: '10px 22px', borderRadius: 999, border: 'none',
                background: GOLD, color: DARK, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {t('ebooks.backToList', 'Back to ebooks')}
            </button>
          </div>
        ) : blobUrl ? (
          <div style={{
            border: '1px solid rgba(197,145,44,0.3)', borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 18px 50px rgba(0,0,0,0.45)', background: '#3a3d40',
          }}>
            <iframe
              src={`${blobUrl}#toolbar=0&navpanes=0&view=FitH`}
              title={ebook?.title || 'Ebook'}
              style={{ width: '100%', height: 'calc(100vh - 130px)', minHeight: 560, border: 'none', display: 'block' }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EbookReader;
