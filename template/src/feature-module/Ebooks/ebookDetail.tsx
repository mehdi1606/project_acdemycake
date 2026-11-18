import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook } from '../../services/api/ebook.service';
import paymentService from '../../services/api/payment.service';
import { extractApiError } from '../../services/api/error.utils';
import { useAppSelector } from '../../core/redux/hooks';
import { getShowcase, ShowcaseLang, ShowcaseText } from './ebookShowcase';

const GOLD = '#C5912C';
const BURG = '#651C32';
const DARK = '#2B0F1E';
const IVORY = '#F2EFE8';
const SERIF = "'Playfair Display', Georgia, serif";

const LANG_NAMES: Record<string, { en: string; ar: string }> = {
  en: { en: 'English', ar: 'الإنجليزية' },
  fr: { en: 'French', ar: 'الفرنسية' },
  ar: { en: 'Arabic', ar: 'العربية' },
};

const localized = (e: Ebook, lang: string) => {
  const l = lang?.slice(0, 2);
  const title = (l === 'ar' && e.titleAr) || (l === 'fr' && e.titleFr) || (l === 'en' && e.titleEn) || e.title;
  const desc =
    (l === 'ar' && e.descriptionAr) || (l === 'fr' && e.descriptionFr) ||
    (l === 'en' && e.descriptionEn) || e.description || '';
  return { title, desc };
};

// ── Small building blocks ────────────────────────────────────────────────────

const Eyebrow: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <p style={{
    color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase',
    fontSize: '0.78rem', fontWeight: 700, marginBottom: 8, opacity: light ? 0.95 : 1,
  }}>
    {children}
  </p>
);

const SectionTitle: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <h2 style={{
    fontFamily: SERIF, fontWeight: 800, color: light ? '#fff' : BURG,
    fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)', marginBottom: 12, lineHeight: 1.2,
  }}>
    {children}
  </h2>
);

/** Full-screen photo viewer with keyboard + swipe-free arrow navigation. */
const Lightbox: React.FC<{
  images: string[]; index: number; onClose: () => void; onMove: (i: number) => void; alt: string;
}> = ({ images, index, onClose, onMove, alt }) => {
  const prev = useCallback(() => onMove((index - 1 + images.length) % images.length), [index, images.length, onMove]);
  const next = useCallback(() => onMove((index + 1) % images.length), [index, images.length, onMove]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose, prev, next]);

  const navBtn: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(197,145,44,0.9)', color: DARK, fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(15,5,10,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <img
        src={images[index]}
        alt={`${alt} ${index + 1}`}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      />
      <button type="button" aria-label="Close" onClick={onClose}
        style={{ ...navBtn, top: 22, right: 22, transform: 'none', width: 42, height: 42 }}>
        <i className="isax isax-close-circle" />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Previous" onClick={e => { e.stopPropagation(); prev(); }} style={{ ...navBtn, left: 14 }}>
            <i className="isax isax-arrow-left-2" />
          </button>
          <button type="button" aria-label="Next" onClick={e => { e.stopPropagation(); next(); }} style={{ ...navBtn, right: 14 }}>
            <i className="isax isax-arrow-right-2" />
          </button>
        </>
      )}
      <span style={{ position: 'absolute', bottom: 18, color: IVORY, fontSize: '0.85rem', opacity: 0.8 }}>
        {index + 1} / {images.length}
      </span>
    </div>
  );
};

/** Main photo with arrows, auto-advance and a thumbnail strip. */
const Gallery: React.FC<{ images: string[]; alt: string; onOpen: (i: number) => void }> = ({ images, alt, onOpen }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length < 2) return;
    const id = window.setInterval(() => setCurrent(c => (c + 1) % images.length), 3500);
    return () => window.clearInterval(id);
  }, [paused, images.length]);

  const go = (i: number) => { setCurrent((i + images.length) % images.length); setPaused(true); };

  const arrow: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(242,239,232,0.92)', color: BURG, fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
  };

  return (
    <div>
      <div style={{
        position: 'relative', borderRadius: 18, overflow: 'hidden', background: DARK,
        aspectRatio: '4 / 5', maxHeight: 620, margin: '0 auto', boxShadow: '0 22px 50px rgba(0,0,0,0.35)',
      }}>
        <img
          key={current}
          src={images[current]}
          alt={`${alt} ${current + 1}`}
          onClick={() => onOpen(current)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', animation: 'ebFade .6s ease' }}
        />
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(current - 1)} style={{ ...arrow, left: 12 }}>
              <i className="isax isax-arrow-left-2" />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(current + 1)} style={{ ...arrow, right: 12 }}>
              <i className="isax isax-arrow-right-2" />
            </button>
          </>
        )}
        <span style={{
          position: 'absolute', top: 12, left: 12, background: GOLD, color: DARK,
          fontWeight: 800, fontSize: '0.75rem', padding: '5px 11px', borderRadius: 999,
        }}>
          {current + 1} / {images.length}
        </span>
      </div>

      <div className="eb-thumbs" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 2px 4px' }}>
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Photo ${i + 1}`}
            onClick={() => go(i)}
            style={{
              flex: '0 0 auto', width: 62, height: 76, padding: 0, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
              border: `2px solid ${i === current ? GOLD : 'transparent'}`, opacity: i === current ? 1 : 0.6, background: 'none',
            }}
          >
            <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const EbookDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(s => s.auth);

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    ebookService.getBySlug(slug)
      .then(e => { if (!cancelled) setEbook(e); })
      .catch(() => { if (!cancelled) setEbook(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const handleBuy = async () => {
    if (!ebook) return;
    // An ebook needs an account, but deliberately NOT a subscription.
    if (!isAuthenticated) {
      navigate(all_routes.login, { state: { from: `/ebooks/${ebook.slug}` } });
      return;
    }
    setBuying(true);
    try {
      const res = await paymentService.initiateCmiEbook(ebook.id);
      // Same keys as the other checkouts, so the payment result page shows the
      // ebook screen (not a stale subscription / course one).
      sessionStorage.setItem('sl_pending_txn_id', String(res.transactionId));
      sessionStorage.setItem('sl_pending_plan_id', 'ebook');
      sessionStorage.setItem('sl_pending_ebook_slug', ebook.slug);
      localStorage.setItem('sl_pending_txn_id_fb', String(res.transactionId));
      localStorage.setItem('sl_pending_plan_id_fb', 'ebook');
      paymentService.submitCmiForm(res.gatewayUrl, res.formParams);
    } catch (err) {
      message.error(extractApiError(err, 'Could not start the payment'));
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: IVORY, minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          border: '3px solid rgba(197,145,44,0.25)', borderTopColor: GOLD,
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div style={{ background: IVORY, minHeight: '70vh', paddingTop: 120, textAlign: 'center' }}>
        <p style={{ color: BURG, fontWeight: 700 }}>{t('ebooks.notFound', 'This ebook was not found.')}</p>
        <Link to={all_routes.ebooks} style={{ color: GOLD, fontWeight: 700 }}>
          {t('ebooks.backToList', 'Back to ebooks')}
        </Link>
      </div>
    );
  }

  const uiLang: ShowcaseLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const { title, desc } = localized(ebook, i18n.language);
  const showcase = getShowcase(ebook.slug);
  const sc: ShowcaseText | undefined = showcase?.text[uiLang];
  const editions = (ebook.languages || []).map(l => LANG_NAMES[l]?.[uiLang] || l.toUpperCase()).join(' · ');
  const openLightbox = (images: string[], index: number) => setLightbox({ images, index });

  // ── Buy / read box (shown in the hero and again at the bottom) ──
  const BuyBox: React.FC<{ dark?: boolean }> = ({ dark }) => (
    ebook.isOwned ? (
      <div>
        <p style={{ color: dark ? '#4ade80' : '#16a34a', fontWeight: 800, marginBottom: 12 }}>
          <i className="isax isax-tick-circle" style={{ marginInlineEnd: 6 }} />
          {t('ebooks.alreadyOwned', 'This ebook is already in your library')}
        </p>
        <button
          type="button"
          onClick={() => navigate(all_routes.ebookRead.replace(':id', ebook.id))}
          style={{
            padding: '14px 30px', borderRadius: 999, border: 'none',
            background: '#16a34a', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
          }}
        >
          <i className="isax isax-book-saved" style={{ marginInlineEnd: 8 }} />
          {t('ebooks.readNow', 'Read now')}
        </button>
      </div>
    ) : (
      <div>
        <p style={{ fontSize: '2.2rem', fontWeight: 800, color: dark ? '#fff' : BURG, marginBottom: 2 }}>
          {ebook.price} <span style={{ fontSize: '1.1rem', color: GOLD }}>{ebook.currency}</span>
        </p>
        <p style={{ color: dark ? 'rgba(242,239,232,0.7)' : 'rgba(101,28,50,0.6)', fontSize: '0.85rem', marginBottom: 16 }}>
          {t('ebooks.noPlanNeeded', 'One-time purchase — no subscription needed.')}
        </p>
        <button
          type="button"
          onClick={handleBuy}
          disabled={buying}
          style={{
            padding: '15px 34px', borderRadius: 999, border: 'none',
            background: `linear-gradient(135deg, ${GOLD}, #E0C56E)`,
            color: DARK, fontWeight: 800, fontSize: '1rem',
            cursor: buying ? 'wait' : 'pointer', opacity: buying ? 0.75 : 1,
            boxShadow: '0 10px 26px rgba(197,145,44,0.35)',
          }}
        >
          <i className="isax isax-card" style={{ marginInlineEnd: 8 }} />
          {buying ? t('common.loading', 'Loading…') : t('ebooks.buyNow', 'Buy now')}
        </button>
        <p style={{ color: dark ? 'rgba(242,239,232,0.6)' : 'rgba(101,28,50,0.5)', fontSize: '0.78rem', marginTop: 12 }}>
          <i className="isax isax-shield-tick" style={{ marginInlineEnd: 5 }} />
          {t('ebooks.securePayment', 'Secure payment by CMI')}
        </p>
      </div>
    )
  );

  const metaItem = (icon: string, text: React.ReactNode) => (
    <span style={{ color: IVORY, fontSize: '0.9rem', opacity: 0.92 }}>
      <i className={`isax ${icon}`} style={{ marginInlineEnd: 6, color: GOLD }} />
      {text}
    </span>
  );

  return (
    <div style={{ background: IVORY, minHeight: '100vh' }}>
      <style>{`
        @keyframes ebFade { from { opacity: .35 } to { opacity: 1 } }
        .eb-thumbs::-webkit-scrollbar { height: 6px }
        .eb-thumbs::-webkit-scrollbar-thumb { background: rgba(197,145,44,.5); border-radius: 3px }
        .eb-card { transition: transform .25s ease, box-shadow .25s ease }
        .eb-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(101,28,50,.16) }
        .eb-creation { transition: transform .3s ease }
        .eb-creation:hover { transform: scale(1.03) }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        background: `linear-gradient(160deg, #4A0E1F 0%, ${BURG} 50%, ${DARK} 100%)`,
        padding: '96px 0 64px', color: IVORY,
      }}>
        <div className="container" style={{ maxWidth: 1140 }}>
          <Link to={all_routes.ebooks} style={{ color: GOLD, fontWeight: 600, fontSize: '0.9rem' }}>
            ← {t('ebooks.backToList', 'Back to ebooks')}
          </Link>

          <div className="row g-5 align-items-center" style={{ marginTop: 4 }}>
            <div className="col-lg-7 order-2 order-lg-1">
              {sc && <Eyebrow light>{sc.tagline}</Eyebrow>}
              <h1 style={{
                fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 800, lineHeight: 1.1,
                marginBottom: 10,
                background: `linear-gradient(90deg, ${IVORY}, ${GOLD})`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>
                {title}
              </h1>
              {ebook.subtitle && !sc && (
                <p style={{ color: GOLD, fontWeight: 600, marginBottom: 14 }}>{ebook.subtitle}</p>
              )}

              <p style={{ color: 'rgba(242,239,232,0.88)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: 14 }}>
                {sc?.intro || desc}
              </p>

              {sc && (
                <>
                  <p style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>{sc.highlight}</p>
                  <ul style={{ listStyle: 'disc', paddingInlineStart: 20, marginBottom: 18, color: 'rgba(242,239,232,0.85)' }}>
                    {sc.bullets.map(b => <li key={b} style={{ marginBottom: 4 }}>{b}</li>)}
                  </ul>
                </>
              )}

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
                {ebook.pageCount ? metaItem('isax-document-text', t('ebooks.pages', '{{n}} pages', { n: ebook.pageCount })) : null}
                {editions && metaItem('isax-language-square', `${t('ebooks.edition', 'Edition')}: ${editions}`)}
                {metaItem('isax-document-download', t('ebooks.readAndDownload', 'Read online & download'))}
              </div>

              <BuyBox dark />
            </div>

            <div className="col-lg-5 order-1 order-lg-2">
              <div style={{
                position: 'relative', maxWidth: 380, margin: '0 auto',
                borderRadius: 20, overflow: 'hidden', aspectRatio: '3 / 4',
                boxShadow: '0 30px 70px rgba(0,0,0,0.45)', border: '3px solid rgba(197,145,44,0.35)',
                background: `linear-gradient(150deg, ${BURG}, ${DARK})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ebook.coverUrl ? (
                  <img
                    src={ebook.coverUrl}
                    alt={title}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <i className="isax isax-book-1" style={{ fontSize: 76, color: GOLD }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {sc && showcase && (
        <>
          {/* ── Photos + about ── */}
          <section style={{ padding: '64px 0' }}>
            <div className="container" style={{ maxWidth: 1140 }}>
              <div className="row g-5 align-items-center">
                <div className="col-lg-6">
                  <Gallery images={showcase.gallery} alt={title} onOpen={i => openLightbox(showcase.gallery, i)} />
                </div>
                <div className="col-lg-6">
                  <Eyebrow>{t('ebooks.aboutBook', 'About the book')}</Eyebrow>
                  <SectionTitle>{sc.aboutTitle}</SectionTitle>
                  <p style={{ color: 'rgba(101,28,50,0.8)', lineHeight: 1.8, marginBottom: 24 }}>{sc.about}</p>
                  <div className="row g-3">
                    {sc.cards.map(c => (
                      <div className="col-sm-6" key={c.title}>
                        <div className="eb-card" style={{
                          background: '#fff', borderRadius: 16, padding: 18, height: '100%',
                          border: '1px solid rgba(197,145,44,0.25)',
                        }}>
                          <i className={`isax ${c.icon}`} style={{ fontSize: 24, color: GOLD }} />
                          <h3 style={{ fontFamily: SERIF, fontSize: '1.05rem', fontWeight: 700, color: BURG, margin: '8px 0 4px' }}>
                            {c.title}
                          </h3>
                          <p style={{ fontSize: '0.88rem', color: 'rgba(34,34,34,0.7)', margin: 0, lineHeight: 1.55 }}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Inside the book: the recipes ── */}
          <section style={{ background: BURG, padding: '64px 0', color: IVORY }}>
            <div className="container" style={{ maxWidth: 1140 }}>
              <div className="row g-5 align-items-center">
                <div className={showcase.video ? 'col-lg-8' : 'col-12'}>
                  <div style={{ textAlign: showcase.video ? undefined : 'center' }}>
                    <Eyebrow light>{t('ebooks.insideBook', 'Inside the book')}</Eyebrow>
                    <SectionTitle light>
                      {t('ebooks.recipesCount', '{{n}} exclusive recipes', { n: sc.recipes.length })}
                    </SectionTitle>
                    <p style={{ color: 'rgba(242,239,232,0.82)', lineHeight: 1.7, marginBottom: 28, maxWidth: 720, marginInline: showcase.video ? undefined : 'auto' }}>
                      {sc.recipesIntro}
                    </p>
                  </div>
                </div>
                {showcase.video && (
                  <div className="col-lg-4 d-none d-lg-block">
                    <video
                      src={showcase.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', maxWidth: 260, display: 'block', marginInline: 'auto', borderRadius: 18, border: '3px solid rgba(197,145,44,0.35)' }}
                    />
                  </div>
                )}
              </div>
              <div className="row g-3">
                {sc.recipes.map((r, i) => (
                  <div className="col-md-6 col-lg-4" key={r.title}>
                    <div style={{
                      background: IVORY, borderRadius: 16, padding: 20, height: '100%', color: BURG,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{
                          flex: '0 0 auto', width: 32, height: 32, borderRadius: '50%', background: GOLD, color: DARK,
                          fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {i + 1}
                        </span>
                        <h3 style={{ fontFamily: SERIF, fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{r.title}</h3>
                      </div>
                      <ul style={{ listStyle: 'disc', paddingInlineStart: 18, margin: 0, fontSize: '0.87rem', lineHeight: 1.6, color: 'rgba(101,28,50,0.85)' }}>
                        {r.points.map(p => <li key={p}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Highlights ── */}
          <section style={{ padding: '64px 0' }}>
            <div className="container" style={{ maxWidth: 1140 }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Eyebrow>{t('ebooks.whyLove', 'Why you’ll love these recipes')}</Eyebrow>
                <SectionTitle>{t('ebooks.highlights', 'The highlights of our creations')}</SectionTitle>
              </div>
              <div className="row g-3">
                {sc.features.map(f => (
                  <div className="col-sm-6 col-lg-3" key={f.title}>
                    <div className="eb-card" style={{
                      background: '#fff', borderRadius: 16, padding: 20, height: '100%', textAlign: 'center',
                      border: '1px solid rgba(197,145,44,0.2)',
                    }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: '50%', background: 'rgba(197,145,44,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                      }}>
                        <i className={`isax ${f.icon}`} style={{ fontSize: 22, color: GOLD }} />
                      </div>
                      <h3 style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: BURG, marginBottom: 6 }}>{f.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(34,34,34,0.7)', margin: 0, lineHeight: 1.55 }}>{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Student creations ── */}
          {showcase.creations.length > 0 && (
            <section style={{ background: '#fff', padding: '64px 0' }}>
              <div className="container" style={{ maxWidth: 1140 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <Eyebrow>{t('ebooks.madeByStudents', 'Made with this book')}</Eyebrow>
                  <SectionTitle>{t('ebooks.studentCreations', 'Our students’ creations')}</SectionTitle>
                </div>
                <div style={{
                  display: 'grid', gap: 12,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(46%, 200px), 1fr))',
                }}>
                  {showcase.creations.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => openLightbox(showcase.creations, i)}
                      aria-label={`${t('ebooks.studentCreations', 'Our students’ creations')} ${i + 1}`}
                      style={{ padding: 0, border: 'none', background: 'none', borderRadius: 14, overflow: 'hidden', cursor: 'zoom-in', aspectRatio: '3 / 4' }}
                    >
                      <img className="eb-creation" src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Final call to action ── */}
          <section style={{
            background: `linear-gradient(160deg, ${BURG}, ${DARK})`, padding: '60px 0', color: IVORY, textAlign: 'center',
          }}>
            <div className="container" style={{ maxWidth: 720 }}>
              <SectionTitle light>{title}</SectionTitle>
              <p style={{ color: 'rgba(242,239,232,0.8)', marginBottom: 22 }}>
                {sc.editionNote}
                {ebook.pageCount ? ` · ${t('ebooks.pages', '{{n}} pages', { n: ebook.pageCount })}` : ''}
                {` · ${t('ebooks.readAndDownload', 'Read online & download')}`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BuyBox dark />
              </div>
            </div>
          </section>
        </>
      )}

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          alt={title}
          onClose={() => setLightbox(null)}
          onMove={i => setLightbox(lb => (lb ? { ...lb, index: i } : lb))}
        />
      )}
    </div>
  );
};

export default EbookDetail;
