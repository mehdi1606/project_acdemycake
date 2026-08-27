import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook } from '../../services/api/ebook.service';
import { useAppSelector } from '../../core/redux/hooks';

const GOLD = '#C5912C';
const BURG = '#651C32';
const DARK = '#2B0F1E';
const IVORY = '#F2EFE8';

/** Title/description in the active UI language, falling back to the default. */
const localized = (e: Ebook, lang: string) => {
  const l = lang?.slice(0, 2);
  const title = (l === 'ar' && e.titleAr) || (l === 'fr' && e.titleFr) || (l === 'en' && e.titleEn) || e.title;
  const desc =
    (l === 'ar' && e.descriptionAr) || (l === 'fr' && e.descriptionFr) ||
    (l === 'en' && e.descriptionEn) || e.description || '';
  return { title, desc };
};

const EbooksPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(s => s.auth);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    ebookService.getEbooks()
      .then(list => { if (!cancelled) setEbooks(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setError(t('ebooks.loadError', 'Could not load the ebooks.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  const toggleFlip = (id: string) => {
    if (!isMobile) return;
    setFlipped(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  return (
    <>
      <style>{`
        .sl-eb-perspective { perspective: 1400px; }
        .sl-eb-inner {
          position: relative; width: 100%; height: 520px;
          transition: transform .7s cubic-bezier(.25,.46,.45,.94);
          transform-style: preserve-3d;
        }
        .sl-eb-inner.is-flipped { transform: rotateY(180deg); }
        .sl-eb-face {
          position: absolute; inset: 0;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
          border-radius: 22px; overflow: hidden;
        }
        .sl-eb-back { transform: rotateY(180deg); }
        /* The card flips on its own axis, so it must not mirror in RTL. */
        [dir="rtl"] .sl-eb-perspective { direction: ltr; }
        [dir="rtl"] .sl-eb-text { direction: rtl; text-align: right; }
        @media (max-width: 576px) { .sl-eb-inner { height: 460px; } }
      `}</style>

      <div style={{ background: IVORY, minHeight: '100vh', padding: '90px 0 70px' }}>
        <div className="container">

          {/* Header */}
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span style={{
              fontFamily: 'var(--sl-font-body, sans-serif)', fontSize: '0.72rem',
              letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 700,
            }}>
              {t('ebooks.eyebrow', 'Digital Library')}
            </span>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, color: BURG, margin: '10px 0 12px',
            }}>
              {t('ebooks.title', 'Our Exclusive Ebooks')}
            </h1>
            <p style={{ color: 'rgba(101,28,50,0.7)', fontSize: '1.02rem', maxWidth: 620, margin: '0 auto' }}>
              {t('ebooks.subtitle', 'Professional recipe collections — buy once, read and download any time.')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div style={{
                width: 38, height: 38, borderRadius: '50%', margin: '0 auto',
                border: `3px solid rgba(197,145,44,0.25)`, borderTopColor: GOLD,
                animation: 'spin 0.9s linear infinite',
              }} />
            </div>
          ) : error ? (
            <div className="text-center py-5" style={{ color: '#8B2335' }}>{error}</div>
          ) : ebooks.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'rgba(101,28,50,0.6)' }}>
              <i className="isax isax-book-1" style={{ fontSize: 44, display: 'block', marginBottom: 12, opacity: 0.4 }} />
              {t('ebooks.empty', 'No ebooks available yet.')}
            </div>
          ) : (
            <div className="row g-4 justify-content-center" style={{ maxWidth: 1080, margin: '0 auto' }}>
              {ebooks.map(book => {
                const { title, desc } = localized(book, i18n.language);
                const isFlipped = flipped.includes(book.id);
                return (
                  <div className="col-md-6" key={book.id}>
                    <div
                      className="sl-eb-perspective"
                      onMouseEnter={() => !isMobile && setFlipped(p => [...p, book.id])}
                      onMouseLeave={() => !isMobile && setFlipped(p => p.filter(x => x !== book.id))}
                      onClick={() => toggleFlip(book.id)}
                    >
                      <div className={`sl-eb-inner${isFlipped ? ' is-flipped' : ''}`}>

                        {/* Front — cover */}
                        <div className="sl-eb-face" style={{
                          background: '#fff', border: '2px solid rgba(43,15,30,0.14)',
                          boxShadow: '0 20px 50px rgba(44,24,16,0.18)',
                        }}>
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={title}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              background: `linear-gradient(150deg, ${BURG}, ${DARK})`,
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28,
                            }}>
                              <i className="isax isax-book-1" style={{ fontSize: 52, color: GOLD }} />
                              <span style={{
                                fontFamily: "'Playfair Display', Georgia, serif", color: '#fff',
                                fontSize: '1.35rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.3,
                              }}>{title}</span>
                            </div>
                          )}

                          <div style={{
                            position: 'absolute', left: 0, right: 0, bottom: 0, padding: '22px 20px',
                            background: `linear-gradient(to top, ${BURG}, rgba(101,28,50,0.92), transparent)`,
                          }}>
                            <h3 className="sl-eb-text" style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                              fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 4px',
                            }}>{title}</h3>
                            {book.subtitle && (
                              <p className="sl-eb-text" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', margin: 0 }}>
                                {book.subtitle}
                              </p>
                            )}
                          </div>

                          {book.isOwned && (
                            <span style={{
                              position: 'absolute', top: 14, insetInlineEnd: 14,
                              background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 800,
                              padding: '5px 12px', borderRadius: 20,
                            }}>
                              {t('ebooks.owned', 'Owned')}
                            </span>
                          )}
                        </div>

                        {/* Back — details */}
                        <div className="sl-eb-face sl-eb-back" style={{
                          background: `linear-gradient(150deg, ${BURG}, ${DARK})`,
                          padding: '30px 26px', display: 'flex', flexDirection: 'column',
                          justifyContent: 'space-between', color: '#fff',
                          boxShadow: '0 20px 50px rgba(44,24,16,0.22)',
                        }}>
                          <div className="sl-eb-text">
                            <h3 style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                              fontSize: '1.4rem', fontWeight: 800, marginBottom: 12,
                            }}>{title}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                              {desc}
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
                              {book.pageCount ? (
                                <li style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, fontSize: '0.85rem' }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
                                  {t('ebooks.pages', '{{n}} pages', { n: book.pageCount })}
                                </li>
                              ) : null}
                              {book.languages?.length > 0 && (
                                <li style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, fontSize: '0.85rem' }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
                                  {t('ebooks.editions', 'Editions')}: {book.languages.map(l => l.toUpperCase()).join(' · ')}
                                </li>
                              )}
                              <li style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.85rem' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
                                {t('ebooks.readAndDownload', 'Read online & download')}
                              </li>
                            </ul>
                          </div>

                          <div className="sl-eb-text">
                            {!book.isOwned && (
                              <p style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 12px', color: GOLD }}>
                                {book.price} <span style={{ fontSize: '1rem' }}>{book.currency}</span>
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  book.isOwned
                                    ? all_routes.ebookRead.replace(':id', book.id)
                                    : all_routes.ebookDetail.replace(':slug', book.slug)
                                );
                              }}
                              style={{
                                width: '100%', padding: '13px 18px', borderRadius: 999, border: 'none',
                                background: book.isOwned ? '#16a34a' : '#fff',
                                color: book.isOwned ? '#fff' : BURG,
                                fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              }}
                            >
                              <i className={`isax ${book.isOwned ? 'isax-book-saved' : 'isax-shopping-cart'}`} />
                              {book.isOwned
                                ? t('ebooks.readNow', 'Read now')
                                : t('ebooks.seeMore', 'See more')}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isAuthenticated && (
            <div className="text-center" style={{ marginTop: 42 }}>
              <Link
                to={all_routes.studentEbooks}
                style={{ color: BURG, fontWeight: 700, fontSize: '0.92rem', textDecoration: 'underline' }}
              >
                {t('ebooks.goToLibrary', 'Go to my library')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EbooksPage;
