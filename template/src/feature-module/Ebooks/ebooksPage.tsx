/**
 * The SARALÖWE library (/ebooks): an editorial page for the recipe books.
 * A dark hero with the books on a plinth, the collection standing on a shelf,
 * one "volume" section per book (inside the book, photos, students' cakes),
 * then the promises and a link to the live masterclasses.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook } from '../../services/api/ebook.service';
import { useAppSelector } from '../../core/redux/hooks';
import { getShowcase, ShowcaseLang } from './ebookShowcase';
import './ebooks-library.css';

const localized = (e: Ebook, lang: string) => {
  const l = lang?.slice(0, 2);
  const title = (l === 'ar' && e.titleAr) || (l === 'fr' && e.titleFr) || (l === 'en' && e.titleEn) || e.title;
  const desc =
    (l === 'ar' && e.descriptionAr) || (l === 'fr' && e.descriptionFr) ||
    (l === 'en' && e.descriptionEn) || e.description || '';
  return { title, desc };
};

/** A printed book: cover, spine shading, page edges, gloss. */
const Book: React.FC<{ src?: string; title: string; className?: string; eager?: boolean }> = ({ src, title, className, eager }) => (
  <span className={`lib-book${className ? ` ${className}` : ''}`}>
    <span className="lib-book__body">
      {src ? <img src={src} alt={title} loading={eager ? 'eager' : 'lazy'} decoding={eager ? 'sync' : 'async'} {...(eager ? { fetchPriority: 'high' as const } : {})} /> : <span className="lib-book__blank">{title}</span>}
      <span className="lib-book__spine" />
      <span className="lib-book__gloss" />
    </span>
    <span className="lib-book__pages" />
  </span>
);

const EbooksPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const uiLang: ShowcaseLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const shelfRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    ebookService.getEbooks()
      .then((list) => { if (!cancelled) setEbooks(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setError(t('ebooks.loadError', 'Could not load the ebooks.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ebooks;
    return ebooks.filter((b) => {
      const { title, desc } = localized(b, i18n.language);
      const recipes = getShowcase(b.slug)?.text[uiLang].recipes.map((r) => r.title).join(' ') || '';
      return `${title} ${b.subtitle || ''} ${desc} ${recipes}`.toLowerCase().includes(q);
    });
  }, [ebooks, query, i18n.language, uiLang]);

  const totalRecipes = ebooks.reduce((n, b) => n + (getShowcase(b.slug)?.text[uiLang].recipes.length ?? 0), 0);
  const ownsAny = ebooks.some((b) => b.isOwned);

  const detailHref = (b: Ebook) => all_routes.ebookDetail.replace(':slug', b.slug);
  const readHref = (b: Ebook) => all_routes.ebookRead.replace(':id', b.id);
  const scrollToShelf = () => shelfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const meta = (b: Ebook) => {
    const recipes = getShowcase(b.slug)?.text[uiLang].recipes.length;
    return [
      recipes ? t('ebooks.recipesCount', '{{n}} exclusive recipes', { n: recipes }) : null,
      b.pageCount ? t('ebooks.pages', '{{n}} pages', { n: b.pageCount }) : null,
    ].filter(Boolean).join(' · ');
  };

  const Cta: React.FC<{ b: Ebook; big?: boolean }> = ({ b, big }) => (
    b.isOwned ? (
      <Link to={readHref(b)} className={`lib-btn lib-btn--gold${big ? ' lib-btn--lg' : ''}`}>
        <i className="isax isax-book-1" /> {t('ebooks.readNow', 'Read now')}
      </Link>
    ) : (
      <Link to={detailHref(b)} className={`lib-btn lib-btn--gold${big ? ' lib-btn--lg' : ''}`}>
        {t('ebooksPage.discover', 'Discover the book')} <i className="isax isax-arrow-right-3 lib-flip" />
      </Link>
    )
  );

  return (
    <div className="lib">
      {/* ── Hero ── */}
      <section className="lib-hero">
        <div className="lib-wrap lib-hero__grid">
          <div className="lib-hero__copy">
            <p className="lib-kicker">{t('ebooksPage.kicker', 'The SARALÖWE library')}</p>
            <h1>{t('ebooksPage.heroTitle', 'Recipe books, written in the atelier.')}</h1>
            <p className="lib-hero__text">
              {t('ebooksPage.heroText', 'Signature recipes by Chef Sara, tested with our students and photographed step by step. Buy once, and read them on any device, for good.')}
            </p>
            <div className="lib-hero__actions">
              <button type="button" className="lib-btn lib-btn--gold lib-btn--lg" onClick={scrollToShelf}>
                {t('ebooksPage.explore', 'Explore the collection')} <i className="isax isax-arrow-down-1" />
              </button>
              {isAuthenticated && ownsAny && (
                <Link to={all_routes.studentEbooks} className="lib-btn lib-btn--glass lib-btn--lg">
                  <i className="isax isax-book-saved" /> {t('ebooks.myLibrary', 'My library')}
                </Link>
              )}
            </div>
            {ebooks.length > 0 && (
              <ul className="lib-hero__stats">
                <li><b>{ebooks.length}</b>{t('ebooksPage.statBooks', 'books')}</li>
                {totalRecipes > 0 && <li><b>{totalRecipes}</b>{t('ebooksPage.statRecipes', 'signature recipes')}</li>}
                <li><b><i className="isax isax-mobile" /></b>{t('ebooksPage.statDevices', 'read on any device')}</li>
              </ul>
            )}
          </div>

          <div className="lib-hero__stage" aria-hidden="true">
            <span className="lib-hero__light" />
            <div className="lib-hero__books">
              {ebooks.slice(0, 3).map((b, i) => (
                <Book key={b.id} src={b.coverUrl} title={localized(b, i18n.language).title} className={`lib-hero__book lib-hero__book--${i}`} eager />
              ))}
            </div>
            <span className="lib-hero__plinth" />
          </div>
        </div>
      </section>

      {/* ── The collection, on a shelf ── */}
      <section className="lib-shelf-sec" ref={shelfRef}>
        <div className="lib-wrap">
          <div className="lib-head">
            <p className="lib-kicker lib-kicker--dark">{t('ebooksPage.collectionKicker', 'The collection')}</p>
            <h2>{t('ebooksPage.collectionTitle', 'Every book, on one shelf')}</h2>
            <span className="lib-ornament" aria-hidden="true"><i /></span>
          </div>

          {ebooks.length > 4 && (
            <label className="lib-search">
              <i className="isax isax-search-normal-1" aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t('ebooksPage.search', 'Search a book, a recipe, a flavour…')} />
            </label>
          )}

          {loading ? (
            <div className="lib-shelf lib-shelf--loading" aria-busy="true">
              {[0, 1, 2].map((i) => <span key={i} className="lib-skel" />)}
            </div>
          ) : error ? (
            <p className="lib-note">{error}</p>
          ) : visible.length === 0 ? (
            <div className="lib-note">
              <p>{ebooks.length === 0 ? t('ebooks.empty', 'No ebooks available yet.') : t('ebooksPage.noMatch', 'No ebook matches your search.')}</p>
              {ebooks.length > 0 && (
                <button type="button" className="lib-btn lib-btn--line" onClick={() => setQuery('')}>
                  {t('ebooksPage.clearSearch', 'Show all ebooks')}
                </button>
              )}
            </div>
          ) : (
            <div className="lib-shelf">
              <div className="lib-shelf__row">
                {visible.map((b) => {
                  const { title } = localized(b, i18n.language);
                  return (
                    <article key={b.id} className="lib-item">
                      <Link to={b.isOwned ? readHref(b) : detailHref(b)} className="lib-item__cover" aria-label={title}>
                        <Book src={b.coverUrl} title={title} eager />
                        {b.isOwned && <span className="lib-item__owned">{t('ebooks.owned', 'Owned')}</span>}
                      </Link>
                      <div className="lib-item__info">
                        {(b.languages || []).length > 0 && (
                          <span className="lib-langs">{b.languages.map((l) => l.toUpperCase()).join(' · ')}</span>
                        )}
                        <h3>{title}</h3>
                        <p className="lib-item__meta">{meta(b)}</p>
                        <div className="lib-item__buy">
                          {!b.isOwned && <span className="lib-price">{b.price}<small>{b.currency}</small></span>}
                          <Cta b={b} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <span className="lib-shelf__plank" aria-hidden="true" />
            </div>
          )}
        </div>
      </section>

      {/* ── One section per book ── */}
      {!loading && !error && ebooks.map((b, idx) => {
        const { title, desc } = localized(b, i18n.language);
        const sc = getShowcase(b.slug);
        const text = sc?.text[uiLang];
        const photos = sc?.gallery.slice(0, 3) || [];
        return (
          <section key={b.id} className={`lib-vol${idx % 2 ? ' lib-vol--flip' : ''}`}>
            <div className="lib-wrap lib-vol__grid">
              <div className="lib-vol__visual">
                <div className="lib-vol__collage">
                  {photos.map((src, i) => <img key={src} src={src} alt="" loading="lazy" className={`lib-vol__photo lib-vol__photo--${i}`} />)}
                  <Book src={b.coverUrl} title={title} className="lib-vol__book" />
                </div>
              </div>

              <div className="lib-vol__copy">
                <p className="lib-kicker lib-kicker--dark">
                  {t('ebooksPage.volume', 'Volume {{n}}', { n: idx + 1 })}{text?.tagline ? ` · ${text.tagline}` : ''}
                </p>
                <h2>{title}</h2>
                <p className="lib-vol__intro">{text?.intro || desc}</p>

                {text && text.recipes.length > 0 && (
                  <>
                    <p className="lib-vol__label">{t('ebooks.insideBook', 'Inside the book')}</p>
                    <ol className="lib-recipes">
                      {text.recipes.slice(0, 10).map((r, i) => (
                        <li key={r.title}><span>{String(i + 1).padStart(2, '0')}</span>{r.title}</li>
                      ))}
                    </ol>
                  </>
                )}

                <div className="lib-vol__chips">
                  {b.pageCount ? <span><i className="isax isax-document-text" />{t('ebooks.pages', '{{n}} pages', { n: b.pageCount })}</span> : null}
                  {(b.languages || []).length > 0 && <span><i className="isax isax-language-square" />{b.languages.map((l) => l.toUpperCase()).join(' · ')}</span>}
                  <span><i className="isax isax-mobile" />{t('ebooksPage.statDevices', 'read on any device')}</span>
                </div>

                <div className="lib-vol__buy">
                  {!b.isOwned && <span className="lib-price lib-price--lg">{b.price}<small>{b.currency}</small></span>}
                  <Cta b={b} big />
                  {!b.isOwned && (
                    <Link to={detailHref(b)} className="lib-link">{t('ebooksPage.seeInside', 'See inside the book')}</Link>
                  )}
                </div>
              </div>
            </div>

            {sc && sc.creations.length > 0 && (
              <div className="lib-wrap">
                <div className="lib-made">
                  <p className="lib-vol__label">{t('ebooks.madeByStudents', 'Made with this book')}</p>
                  <div className="lib-made__strip">
                    {sc.creations.slice(0, 6).map((src) => <img key={src} src={src} alt="" loading="lazy" />)}
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* ── Promises ── */}
      <section className="lib-promises">
        <div className="lib-wrap lib-promises__grid">
          {[
            { icon: 'isax-crown-1', title: t('ebooksPage.p1Title', 'Yours for good'), text: t('ebooksPage.p1Text', 'Buy once. Your book stays in your library.') },
            { icon: 'isax-mobile', title: t('ebooksPage.p2Title', 'Any device'), text: t('ebooksPage.p2Text', 'Phone, tablet or computer, right where you bake.') },
            { icon: 'isax-camera', title: t('ebooksPage.p3Title', 'Step-by-step photos'), text: t('ebooksPage.p3Text', 'Precise quantities and the photos to follow them.') },
            { icon: 'isax-shield-tick', title: t('ebooksPage.p4Title', 'Secure payment'), text: t('ebooksPage.p4Text', 'Paid by card, with an invoice in your account.') },
          ].map((p) => (
            <div key={p.title} className="lib-promise">
              <span className="lib-promise__icon"><i className={`isax ${p.icon}`} /></span>
              <div><h4>{p.title}</h4><p>{p.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live classes ── */}
      <section className="lib-wrap">
        <div className="lib-live">
          <div>
            <p className="lib-kicker">{t('ebooksPage.liveKicker', 'Prefer to learn live?')}</p>
            <h2>{t('ebooksPage.liveTitle', 'Bake beside Chef Sara in a masterclass')}</h2>
          </div>
          <button type="button" className="lib-btn lib-btn--gold lib-btn--lg" onClick={() => navigate(all_routes.masterclass)}>
            {t('ebooksPage.liveCta', 'See the masterclasses')} <i className="isax isax-arrow-right-3 lib-flip" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default EbooksPage;
