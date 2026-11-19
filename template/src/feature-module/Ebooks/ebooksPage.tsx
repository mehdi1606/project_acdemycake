import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook } from '../../services/api/ebook.service';
import { useAppSelector } from '../../core/redux/hooks';
import { getShowcase, ShowcaseLang } from './ebookShowcase';

// Saralöwe colours (unchanged). Only the way books are presented is new:
// realistic 3D covers on a shelf, and an open book that previews the selection.
const GOLD = '#C5912C';
const BURG = '#651C32';
const DARK = '#2B0F1E';
const IVORY = '#F2EFE8';
const SERIF = "'Playfair Display', Georgia, serif";

const localized = (e: Ebook, lang: string) => {
  const l = lang?.slice(0, 2);
  const title = (l === 'ar' && e.titleAr) || (l === 'fr' && e.titleFr) || (l === 'en' && e.titleEn) || e.title;
  const desc =
    (l === 'ar' && e.descriptionAr) || (l === 'fr' && e.descriptionFr) ||
    (l === 'en' && e.descriptionEn) || e.description || '';
  return { title, desc };
};

/** A printed-book look for a flat cover: spine, page edges, gloss and a soft floor shadow. */
const BookCover: React.FC<{ src?: string; title: string; selected?: boolean; size?: number }> = ({ src, title, selected, size = 150 }) => (
  <div className={`sl-book${selected ? ' is-selected' : ''}`} style={{ width: size }}>
    <div className="sl-book__body">
      {src ? (
        <img src={src} alt={title} onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
      ) : (
        <div className="sl-book__blank"><i className="isax isax-book-1" /><span>{title}</span></div>
      )}
      <span className="sl-book__spine" />
      <span className="sl-book__gloss" />
    </div>
    <span className="sl-book__pages" />
  </div>
);

const EbooksPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  const uiLang: ShowcaseLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [turn, setTurn] = useState(0); // re-triggers the page-turn animation
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    ebookService.getEbooks()
      .then(list => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setEbooks(arr);
        setSelectedId(arr[0]?.id ?? null);
      })
      .catch(() => { if (!cancelled) setError(t('ebooks.loadError', 'Could not load the ebooks.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ebooks;
    return ebooks.filter(b => {
      const { title, desc } = localized(b, i18n.language);
      return `${title} ${b.subtitle || ''} ${desc}`.toLowerCase().includes(q);
    });
  }, [ebooks, query, i18n.language]);

  const selected = ebooks.find(b => b.id === selectedId) || ebooks[0];
  const sel = selected ? localized(selected, i18n.language) : null;
  const show = selected ? getShowcase(selected.slug) : undefined;
  const showText = show?.text[uiLang];
  const firstName = (user?.fullName || '').trim().split(/\s+/)[0];
  const ownedFirst = ebooks.find(b => b.isOwned);

  const pick = (id: string) => {
    if (id !== selectedId) {
      setSelectedId(id);
      setTurn(n => n + 1);
    }
    // On phones/tablets the details panel sits below the list: bring it into view,
    // so a single tap visibly does something.
    if (window.innerWidth < 992) {
      window.setTimeout(() => asideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };

  const openBook = (b: Ebook) =>
    navigate(b.isOwned ? all_routes.ebookRead.replace(':id', b.id) : all_routes.ebookDetail.replace(':slug', b.slug));

  const rail = [
    { icon: 'isax-book-1', label: t('nav.ebooks', 'Ebooks'), to: all_routes.ebooks, active: true },
    { icon: 'isax-book-saved', label: t('ebooks.myLibrary', 'My library'), to: isAuthenticated ? all_routes.studentEbooks : all_routes.login },
    { icon: 'isax-video-play', label: t('nav.masterclasses', 'Masterclasses'), to: all_routes.masterclass },
    { icon: 'isax-teacher', label: t('nav.courses', 'Courses'), to: all_routes.courseList },
    { icon: 'isax-message-question', label: t('ebooksPage.contact', 'Contact'), to: all_routes.contactUs },
  ];

  return (
    <div className="sl-ebx">
      <style>{`
        .sl-ebx { background: ${IVORY}; min-height: 100vh; padding: 96px 0 70px; }
        .sl-ebx__frame { max-width: 1260px; margin: 0 auto; background: #FBF8F3; border-radius: 30px;
          box-shadow: 0 30px 80px rgba(43,15,30,.12), 0 0 0 1px rgba(197,145,44,.16);
          display: grid; grid-template-columns: 76px minmax(0,1fr) 400px; overflow: hidden; }
        .sl-ebx__rail { border-inline-end: 1px solid rgba(197,145,44,.18); padding: 26px 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .sl-ebx__rail a { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: ${BURG}; font-size: 20px; transition: background .2s, color .2s, transform .2s; }
        .sl-ebx__rail a:hover { background: rgba(197,145,44,.14); transform: translateY(-2px); }
        .sl-ebx__rail a.is-active { background: ${BURG}; color: #fff; box-shadow: 0 10px 22px rgba(101,28,50,.3); }
        .sl-ebx__main { padding: 30px 38px 36px; min-width: 0; }
        .sl-ebx__aside { background: #F6F0E6; padding: 30px 30px 34px; border-inline-start: 1px solid rgba(197,145,44,.14); min-width: 0; }
        .sl-ebx__search { display: flex; align-items: center; gap: 10px; flex: 1; max-width: 420px; padding: 10px 16px;
          border-radius: 999px; background: #fff; border: 1px solid rgba(197,145,44,.22); color: ${BURG}; }
        .sl-ebx__search input { border: none; outline: none; background: transparent; width: 100%; color: ${DARK}; font-size: .9rem; }
        .sl-ebx__h { font-family: ${SERIF}; color: ${BURG}; font-weight: 800; }
        .sl-ebx__section { display: flex; align-items: center; justify-content: space-between; margin: 34px 0 18px; }
        .sl-ebx__section h2 { font-family: ${SERIF}; color: ${BURG}; font-size: 1.25rem; font-weight: 700; margin: 0; }
        .sl-ebx__dots { color: ${GOLD}; letter-spacing: 3px; font-weight: 800; }
        .sl-ebx__shelf { display: flex; gap: 46px; flex-wrap: wrap; align-items: flex-end; }
        .sl-ebx__shelf button { background: none; border: none; padding: 0; text-align: start; cursor: pointer; width: 196px; }
        .sl-ebx__shelf .sl-ebx__btitle { font-family: ${SERIF}; color: ${DARK}; font-weight: 700; font-size: .92rem; margin: 18px 0 2px; line-height: 1.3; }
        .sl-ebx__shelf .sl-ebx__bsub { color: rgba(101,28,50,.6); font-size: .82rem; font-style: italic; }
        .sl-ebx__pick { display: inline-block; margin: 8px 0 2px; padding: 4px 12px; border-radius: 999px; font-size: .78rem; font-weight: 700;
          background: rgba(197,145,44,.14); color: ${BURG}; }
        .sl-ebx__shelf button[aria-pressed="true"] .sl-ebx__pick { background: ${BURG}; color: #fff; }
        .sl-ebx__rail a span { display: none; }
        @media (max-width: 991px) { .sl-ebx__rail { gap: 6px; flex-wrap: wrap; } .sl-ebx__rail a { width: auto; height: auto; padding: 8px 12px; border-radius: 999px; gap: 6px; font-size: 16px; }
          .sl-ebx__rail a span { display: inline; font-size: 12px; font-weight: 700; } }

        /* 3D printed book */
        .sl-book { position: relative; perspective: 900px; }
        .sl-book__body { position: relative; aspect-ratio: 3 / 4.25; border-radius: 3px 8px 8px 3px; overflow: hidden;
          transform: rotateY(-14deg); transform-origin: left center; transition: transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s;
          box-shadow: 6px 10px 18px rgba(43,15,30,.28), 18px 26px 34px rgba(43,15,30,.18); background: ${BURG}; }
        .sl-book__body img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .sl-book__spine { position: absolute; inset: 0 auto 0 0; width: 9%; background: linear-gradient(90deg, rgba(0,0,0,.35), rgba(255,255,255,.18) 45%, rgba(0,0,0,.12)); }
        .sl-book__gloss { position: absolute; inset: 0; background: linear-gradient(115deg, rgba(255,255,255,.22) 0%, transparent 32%, transparent 70%, rgba(0,0,0,.12)); pointer-events: none; }
        .sl-book__pages { position: absolute; top: 2%; bottom: 2%; right: -5px; width: 7px; border-radius: 0 3px 3px 0;
          background: repeating-linear-gradient(0deg, #fff, #fff 1px, #ece4d6 1px, #ece4d6 2px); transform: rotateY(-14deg) translateX(-2px); opacity: .9; }
        .sl-book:hover .sl-book__body, .sl-book.is-selected .sl-book__body { transform: rotateY(-4deg) translateY(-8px);
          box-shadow: 4px 8px 14px rgba(43,15,30,.25), 22px 34px 44px rgba(43,15,30,.22); }
        .sl-book.is-selected::after { content: ''; position: absolute; left: 12%; right: 12%; bottom: -16px; height: 3px; border-radius: 3px; background: ${GOLD}; }
        .sl-book__blank { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #fff; padding: 12px; text-align: center; font-family: ${SERIF}; }
        .sl-book__blank i { font-size: 40px; color: ${GOLD}; }

        /* Open book preview */
        .sl-open { perspective: 1600px; margin: 10px auto 0; max-width: 350px; }
        .sl-open__book { position: relative; display: grid; grid-template-columns: 1fr 1fr; aspect-ratio: 1.42;
          transform: rotateX(16deg) rotateZ(-4deg); transform-style: preserve-3d;
          filter: drop-shadow(0 26px 26px rgba(43,15,30,.28)); }
        .sl-open__page { position: relative; background: #FFFDF8; overflow: hidden; }
        .sl-open__page--l { border-radius: 6px 0 0 6px; padding: 12px 10px 10px 14px; box-shadow: inset -14px 0 18px -12px rgba(43,15,30,.35); }
        .sl-open__page--r { border-radius: 0 6px 6px 0; box-shadow: inset 14px 0 18px -12px rgba(43,15,30,.35); }
        .sl-open__page--r img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .sl-open__edge { position: absolute; inset: auto 0 -6px 0; height: 8px; border-radius: 0 0 6px 6px;
          background: repeating-linear-gradient(90deg, #fff, #fff 2px, #e9e0cf 2px, #e9e0cf 3px); z-index: -1; }
        .sl-open__turn { position: absolute; top: 0; bottom: 0; right: 0; width: 50%; transform-origin: left center; background: #FFFDF8;
          border-radius: 0 6px 6px 0; animation: sl-turn .8s cubic-bezier(.45,.05,.3,1) forwards; box-shadow: inset 14px 0 18px -12px rgba(43,15,30,.3); }
        @keyframes sl-turn { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(-178deg); opacity: .2; } }
        .sl-open__recipe { font-family: ${SERIF}; font-size: 9.5px; color: ${BURG}; line-height: 1.35; margin: 0 0 5px; }
        .sl-open__recipe span { color: ${GOLD}; font-weight: 800; margin-inline-end: 4px; }
        .sl-ebx__fade { animation: sl-fade .6s ease both; }
        @keyframes sl-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        .sl-ebx__row { display: grid; grid-template-columns: 54px minmax(0,1fr) auto 28px; gap: 16px; align-items: center;
          padding: 12px 14px; border-radius: 16px; transition: background .2s; cursor: pointer; }
        .sl-ebx__row:hover { background: rgba(197,145,44,.1); }
        .sl-ebx__btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 999px; border: none; font-weight: 800; cursor: pointer; font-size: .9rem; }
        .sl-ebx__creations { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .sl-ebx__creations img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 10px; display: block; }

        @media (max-width: 1199px) { .sl-ebx__frame { grid-template-columns: 70px minmax(0,1fr) 340px; } .sl-ebx__main { padding: 26px 26px 30px; } }
        @media (max-width: 991px) {
          .sl-ebx { padding-top: 84px; }
          .sl-ebx__frame { grid-template-columns: minmax(0,1fr); border-radius: 22px; margin: 0 12px; }
          .sl-ebx__rail { flex-direction: row; justify-content: center; padding: 14px; border-inline-end: none; border-bottom: 1px solid rgba(197,145,44,.18); }
          .sl-ebx__aside { border-inline-start: none; border-top: 1px solid rgba(197,145,44,.14); }
        }
        @media (max-width: 575px) {
          .sl-ebx__main { padding: 22px 18px 26px; } .sl-ebx__aside { padding: 24px 18px 28px; }
          .sl-ebx__shelf { gap: 22px; justify-content: center; } .sl-ebx__shelf button { width: 138px; } .sl-ebx__shelf .sl-book { width: 138px !important; }
        }
        [dir="rtl"] .sl-open, [dir="rtl"] .sl-book { direction: ltr; }
        [dir="rtl"] .sl-ebx .isax-arrow-right-3 { display: inline-block; transform: scaleX(-1); }
      `}</style>

      <div className="sl-ebx__frame">
        {/* ── Icon rail ── */}
        <nav className="sl-ebx__rail" aria-label={t('ebooksPage.nav', 'Library navigation')}>
          <img src={`${process.env.PUBLIC_URL}/assets/img/email/logo-gold.png`} alt="Saralöwe" width={40}
            style={{ marginBottom: 10, filter: 'drop-shadow(0 2px 4px rgba(43,15,30,.2))' }} className="d-none d-lg-block" />
          {rail.map(r => (
            <Link key={r.label} to={r.to} className={r.active ? 'is-active' : undefined} title={r.label} aria-label={r.label}>
              <i className={`isax ${r.icon}`} />
              <span>{r.label}</span>
            </Link>
          ))}
        </nav>

        {/* ── Main ── */}
        <main className="sl-ebx__main">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <label className="sl-ebx__search">
              <i className="isax isax-search-normal-1" aria-hidden="true" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t('ebooksPage.search', 'Search a book, a recipe, a flavour…')} />
            </label>
            {isAuthenticated ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: BURG, fontWeight: 700, fontSize: '.9rem' }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', background: BURG, color: GOLD, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 800 }}>
                  {(firstName || '?').charAt(0).toUpperCase()}
                </span>
                {user?.fullName}
              </span>
            ) : (
              <Link to={all_routes.login} style={{ color: BURG, fontWeight: 700, fontSize: '.9rem' }}>
                {t('nav.signIn', 'Sign In')}
              </Link>
            )}
          </div>

          <div style={{ marginTop: 30, maxWidth: 560 }}>
            <h1 className="sl-ebx__h" style={{ fontSize: 'clamp(2rem, 4.2vw, 3rem)', lineHeight: 1.12, margin: 0 }}>
              {firstName
                ? t('ebooksPage.helloName', 'Happy baking, {{name}}', { name: firstName })
                : t('ebooksPage.hello', 'Happy baking')}
            </h1>
            <p style={{ color: 'rgba(43,15,30,.68)', lineHeight: 1.75, margin: '14px 0 20px' }}>
              {ownedFirst
                ? t('ebooksPage.introOwned', 'Your recipes are waiting. Open your ebook and pick up where you left off — read it any time, on any device.')
                : t('ebooks.subtitle', 'Professional recipe collections — buy once, read any time on the platform.')}
            </p>
            <button type="button" className="sl-ebx__btn" style={{ background: DARK, color: '#fff' }}
              onClick={() => (ownedFirst ? openBook(ownedFirst) : selected && openBook(selected))}>
              {ownedFirst ? t('ebooksPage.continue', 'Continue reading') : t('ebooksPage.discover', 'Discover the book')}
              <i className="isax isax-arrow-right-3" />
            </button>
          </div>

          <div className="sl-ebx__section">
            <h2>{t('ebooksPage.popular', 'Popular now')}</h2>
            <span className="sl-ebx__dots" aria-hidden="true">••</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 auto', border: '3px solid rgba(197,145,44,.25)',
                borderTopColor: GOLD, animation: 'spin .9s linear infinite' }} />
            </div>
          ) : error ? (
            <p style={{ color: '#8B2335' }}>{error}</p>
          ) : visible.length === 0 ? (
            <p style={{ color: 'rgba(101,28,50,.6)' }}>
              {ebooks.length === 0 ? t('ebooks.empty', 'No ebooks available yet.') : t('ebooksPage.noMatch', 'No ebook matches your search.')}
              {ebooks.length > 0 && (
                <button type="button" className="sl-ebx__btn" style={{ background: '#fff', color: BURG, border: `1px solid rgba(197,145,44,.35)`, marginInlineStart: 12 }}
                  onClick={() => setQuery('')}>
                  {t('ebooksPage.clearSearch', 'Show all ebooks')}
                </button>
              )}
            </p>
          ) : (
            <div className="sl-ebx__shelf">
              {visible.map(b => {
                const { title } = localized(b, i18n.language);
                return (
                  <button key={b.id} type="button" onClick={() => pick(b.id)}
                    aria-pressed={b.id === selected?.id} aria-label={t('ebooksPage.selectBook', 'Show details of {{title}}', { title })}>
                    <BookCover src={b.coverUrl} title={title} selected={b.id === selected?.id} size={196} />
                    <div className="sl-ebx__btitle">{title}</div>
                    <span className="sl-ebx__pick">
                      {b.id === selected?.id ? t('ebooksPage.selected', 'Selected ✓') : t('ebooksPage.tapToSee', 'See details')}
                    </span>
                    <div className="sl-ebx__bsub">
                      {b.isOwned
                        ? t('ebooks.owned', 'Owned')
                        : uiLang === 'ar'
                          ? t('ebooks.recipesCount', '{{n}} exclusive recipes', { n: getShowcase(b.slug)?.text.ar.recipes.length ?? 10 })
                          : b.subtitle || `${b.price} ${b.currency}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {ebooks.length > 0 && (
            <>
              <div className="sl-ebx__section">
                <h2>{t('ebooksPage.collection', 'The collection')}</h2>
                <span className="sl-ebx__dots" aria-hidden="true">••</span>
              </div>
              <div>
                {ebooks.map(b => {
                  const { title } = localized(b, i18n.language);
                  const sc = getShowcase(b.slug);
                  const recipes = sc?.text[uiLang].recipes.length;
                  return (
                    <div key={b.id} className="sl-ebx__row" role="link" tabIndex={0}
                      onClick={() => openBook(b)} onKeyDown={e => { if (e.key === 'Enter') openBook(b); }}>
                      <div style={{ width: 54 }}><BookCover src={b.coverUrl} title={title} size={54} /></div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: SERIF, fontWeight: 700, color: DARK }}>{title}</div>
                        <div style={{ fontSize: '.8rem', color: 'rgba(101,28,50,.6)', fontStyle: 'italic' }}>
                          {[
                            recipes ? t('ebooks.recipesCount', '{{n}} exclusive recipes', { n: recipes }) : null,
                            b.pageCount ? t('ebooks.pages', '{{n}} pages', { n: b.pageCount }) : null,
                            (b.languages || []).map(l => l.toUpperCase()).join(' · ') || null,
                          ].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: b.isOwned ? '#16a34a' : BURG, whiteSpace: 'nowrap' }}>
                        {b.isOwned ? t('ebooks.owned', 'Owned') : `${b.price} ${b.currency}`}
                      </div>
                      <i className="isax isax-arrow-right-3" style={{ color: GOLD }} aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* ── Selected book: open-book preview + details ── */}
        <aside className="sl-ebx__aside" aria-live="polite" ref={asideRef}>
          {selected && sel ? (
            <div key={selected.id} className="sl-ebx__fade">
              <div className="sl-open">
                <div className="sl-open__book">
                  <div className="sl-open__page sl-open__page--l">
                    <div style={{ fontFamily: SERIF, color: GOLD, fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 6 }}>
                      {t('ebooks.insideBook', 'Inside the book')}
                    </div>
                    {(showText?.recipes || []).slice(0, 6).map((r, i) => (
                      <p key={r.title} className="sl-open__recipe"><span>{i + 1}</span>{r.title}</p>
                    ))}
                    {!showText && <p className="sl-open__recipe">{sel.desc}</p>}
                  </div>
                  <div className="sl-open__page sl-open__page--r">
                    <img src={show?.gallery[0] || selected.coverUrl} alt="" />
                  </div>
                  {turn > 0 && <div key={turn} className="sl-open__turn" aria-hidden="true" />}
                  <span className="sl-open__edge" aria-hidden="true" />
                </div>
              </div>

              <h2 className="sl-ebx__h" style={{ fontSize: '1.7rem', lineHeight: 1.2, margin: '34px 0 6px' }}>{sel.title}</h2>
              <div style={{ fontSize: '.88rem', color: 'rgba(43,15,30,.6)', marginBottom: 12 }}>
                {selected.pageCount ? (
                  <><span style={{ color: BURG, fontWeight: 800 }}>{selected.pageCount}</span> {t('ebooksPage.pagesLabel', 'pages')}</>
                ) : null}
                {showText ? <> · <span style={{ color: BURG, fontWeight: 800 }}>{showText.recipes.length}</span> {t('ebooksPage.recipesLabel', 'recipes')}</> : null}
              </div>
              <p style={{ color: 'rgba(43,15,30,.72)', fontSize: '.9rem', lineHeight: 1.7, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {showText?.intro || sel.desc}
              </p>
              <p style={{ textAlign: 'end', fontStyle: 'italic', color: GOLD, fontSize: '.85rem', margin: '8px 0 20px' }}>— Saralöwe</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {selected.isOwned ? (
                  <button type="button" className="sl-ebx__btn" style={{ background: '#16a34a', color: '#fff' }} onClick={() => openBook(selected)}>
                    <i className="isax isax-book-saved" /> {t('ebooks.readNow', 'Read now')}
                  </button>
                ) : (
                  <>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: BURG }}>
                      {selected.price} <span style={{ fontSize: '.9rem', color: GOLD }}>{selected.currency}</span>
                    </span>
                    <button type="button" className="sl-ebx__btn" style={{ background: `linear-gradient(135deg, ${GOLD}, #E0C56E)`, color: DARK }}
                      onClick={() => navigate(all_routes.ebookDetail.replace(':slug', selected.slug))}>
                      {t('ebooksPage.detailsBuy', 'Details & buy')} <i className="isax isax-arrow-right-3" />
                    </button>
                  </>
                )}
              </div>

              {show && show.creations.length > 0 && (
                <>
                  <div className="sl-ebx__section" style={{ marginTop: 32 }}>
                    <h2 style={{ fontSize: '1.05rem' }}>{t('ebooks.madeByStudents', 'Made with this book')}</h2>
                    <span className="sl-ebx__dots" aria-hidden="true">••</span>
                  </div>
                  <div className="sl-ebx__creations">
                    {show.creations.slice(0, 4).map(src => <img key={src} src={src} alt="" loading="lazy" />)}
                  </div>
                </>
              )}
            </div>
          ) : !loading ? (
            <p style={{ color: 'rgba(101,28,50,.6)' }}>{t('ebooks.empty', 'No ebooks available yet.')}</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default EbooksPage;
