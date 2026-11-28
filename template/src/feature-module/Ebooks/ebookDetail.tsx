/**
 * One book's page (/ebooks/:slug): the product page of the SARALÖWE library.
 * Hero with the book on a lit plinth and a glass purchase card, the book in
 * pictures, what it is about, the contents (recipes, opened one by one), the
 * highlights, the students' cakes and a closing purchase band. A slim glass
 * bar keeps the price and the button in reach once the hero is scrolled past.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message, Modal } from 'antd';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook } from '../../services/api/ebook.service';
import paymentService, { PayMethod } from '../../services/api/payment.service';
import PaymentMethodPicker, { usePayMethod, usePayPalConfig } from '../../components/PaymentMethodPicker';
import { extractApiError } from '../../services/api/error.utils';
import { useAppSelector } from '../../core/redux/hooks';
import { getShowcase, ShowcaseLang, ShowcaseText } from './ebookShowcase';
import './ebooks-library.css';
import './ebook-detail.css';

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

/** Full-screen photo viewer: Escape closes, arrows move. */
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
  return (
    <div className="ebd-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <img src={images[index]} alt={`${alt} ${index + 1}`} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="ebd-lightbox__close" aria-label="Close" onClick={onClose}><i className="isax isax-close-circle" /></button>
      {images.length > 1 && (
        <>
          <button type="button" className="ebd-lightbox__nav ebd-lightbox__nav--prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev(); }}><i className="isax isax-arrow-left-2" /></button>
          <button type="button" className="ebd-lightbox__nav ebd-lightbox__nav--next" aria-label="Next" onClick={(e) => { e.stopPropagation(); next(); }}><i className="isax isax-arrow-right-2" /></button>
        </>
      )}
      <span className="ebd-lightbox__count">{index + 1} / {images.length}</span>
    </div>
  );
};

const EbookDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [payMethod, setPayMethod] = usePayMethod();
  const [chooseOpen, setChooseOpen] = useState(false);
  const payPalOn = !!usePayPalConfig()?.enabled;
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [photo, setPhoto] = useState(0);
  const [openRecipe, setOpenRecipe] = useState<number | null>(0);
  const [showBar, setShowBar] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    ebookService.getBySlug(slug)
      .then((e) => { if (!cancelled) setEbook(e); })
      .catch(() => { if (!cancelled) setEbook(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [slug]);

  // The slim purchase bar appears once the hero's purchase card is out of view.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [ebook]);

  const handleBuy = () => {
    if (!ebook) return;
    // An ebook needs an account, but deliberately NOT a subscription.
    if (!isAuthenticated) {
      navigate(all_routes.login, { state: { from: `/ebooks/${ebook.slug}` } });
      return;
    }
    // With PayPal on, ask how to pay first; otherwise straight to the card page.
    if (payPalOn) setChooseOpen(true);
    else pay('card');
  };

  const pay = async (method: PayMethod) => {
    if (!ebook) return;
    setBuying(true);
    try {
      const res = await paymentService.startPayment(method, { kind: 'ebook', id: ebook.id });
      // Same keys as the other checkouts, so the payment result page shows the
      // ebook screen (not a stale subscription / course one).
      sessionStorage.setItem('sl_pending_txn_id', String(res.transactionId));
      sessionStorage.setItem('sl_pending_plan_id', 'ebook');
      sessionStorage.setItem('sl_pending_ebook_slug', ebook.slug);
      localStorage.setItem('sl_pending_txn_id_fb', String(res.transactionId));
      localStorage.setItem('sl_pending_plan_id_fb', 'ebook');
      res.go();
    } catch (err) {
      message.error(extractApiError(err, 'Could not start the payment'));
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="lib ebd ebd--loading" aria-busy="true">
        <div className="ebd-hero"><div className="lib-wrap ebd-hero__grid"><span className="lib-skel" /><span /></div></div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="lib ebd">
        <div className="ebd-missing">
          <h1>{t('ebooks.notFound', 'This ebook was not found.')}</h1>
          <Link to={all_routes.ebooks} className="lib-btn lib-btn--gold">{t('ebooks.backToList', 'Back to ebooks')}</Link>
        </div>
      </div>
    );
  }

  const uiLang: ShowcaseLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const { title, desc } = localized(ebook, i18n.language);
  const showcase = getShowcase(ebook.slug);
  const sc: ShowcaseText | undefined = showcase?.text[uiLang];
  const editions = (ebook.languages || []).map((l) => LANG_NAMES[l]?.[uiLang] || l.toUpperCase()).join(' · ');
  const gallery = showcase?.gallery ?? [];
  const recipeCount = sc?.recipes.length ?? 0;
  const readHref = all_routes.ebookRead.replace(':id', ebook.id);

  const PrimaryAction: React.FC<{ big?: boolean }> = ({ big }) => (
    ebook.isOwned ? (
      <Link to={readHref} className={`lib-btn lib-btn--gold${big ? ' lib-btn--lg' : ''}`}>
        <i className="isax isax-book-1" /> {t('ebooks.readNow', 'Read now')}
      </Link>
    ) : (
      <button type="button" className={`lib-btn lib-btn--gold${big ? ' lib-btn--lg' : ''}`} onClick={handleBuy} disabled={buying}>
        <i className="isax isax-bag-2" /> {buying ? t('common.loading', 'Loading…') : t('ebooks.buyNow', 'Buy now')}
      </button>
    )
  );

  const facts = [
    recipeCount ? { icon: 'isax-cake', value: String(recipeCount), label: t('ebooksPage.recipesLabel', 'recipes') } : null,
    ebook.pageCount ? { icon: 'isax-document-text', value: String(ebook.pageCount), label: t('ebooksPage.pagesLabel', 'pages') } : null,
    editions ? { icon: 'isax-language-square', value: (ebook.languages || []).map((l) => l.toUpperCase()).join(' · '), label: t('ebooks.edition', 'Edition') } : null,
    { icon: 'isax-mobile', value: '∞', label: t('ebooksPage.statDevices', 'read on any device') },
  ].filter(Boolean) as { icon: string; value: string; label: string }[];

  return (
    <div className="lib ebd">
      {/* ── Hero ── */}
      <section className="ebd-hero">
        <div className="lib-wrap">
          <nav className="ebd-crumbs" aria-label="breadcrumb">
            <Link to={all_routes.ebooks}>{t('ebooksPage.kicker', 'The SARALÖWE library')}</Link>
            <i className="isax isax-arrow-right-3 lib-flip" aria-hidden="true" />
            <span>{title}</span>
          </nav>
          <div className="ebd-hero__grid">
            <div className="ebd-hero__stage" aria-hidden="true">
              <span className="lib-hero__light" />
              <span className="lib-book ebd-hero__book">
                <span className="lib-book__body">
                  {ebook.coverUrl ? <img src={ebook.coverUrl} alt="" loading="eager" decoding="sync" fetchPriority="high" /> : <span className="lib-book__blank">{title}</span>}
                  <span className="lib-book__spine" /><span className="lib-book__gloss" />
                </span>
                <span className="lib-book__pages" />
              </span>
              <span className="lib-hero__plinth" />
            </div>

            <div className="ebd-hero__copy">
              {sc?.tagline && <p className="lib-kicker">{sc.tagline}</p>}
              <h1>{title}</h1>
              <p className="ebd-hero__intro">{sc?.highlight || ebook.subtitle || desc}</p>

              <ul className="ebd-facts">
                {facts.map((f) => (
                  <li key={f.label}><b>{f.value}</b><span>{f.label}</span></li>
                ))}
              </ul>

              <div className="ebd-buy" ref={heroRef as React.RefObject<HTMLDivElement>}>
                {ebook.isOwned ? (
                  <>
                    <span className="ebd-owned"><i className="isax isax-tick-circle" /> {t('ebooks.alreadyOwned', 'This ebook is already in your library')}</span>
                    <PrimaryAction big />
                  </>
                ) : (
                  <>
                    <div className="ebd-buy__price">
                      <span className="lib-price lib-price--lg ebd-price">{ebook.price}<small>{ebook.currency}</small></span>
                      <span className="ebd-buy__note">{t('ebooks.noPlanNeeded', 'One-time purchase — no subscription needed.')}</span>
                    </div>
                    <PrimaryAction big />
                    <p className="ebd-buy__trust">
                      <span><i className="isax isax-shield-tick" /> {payPalOn ? t('ebooks.securePaymentPP', 'Secure payment: card or PayPal') : t('ebooks.securePayment', 'Secure payment by CMI')}</span>
                      <span><i className="isax isax-receipt-2" /> {t('ebooks.invoiceNote', 'Invoice in your account')}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {sc && showcase && (
        <>
          {/* ── The book in pictures + about ── */}
          <section className="ebd-sec">
            <div className="lib-wrap ebd-about">
              {gallery.length > 0 && (
                <div className="ebd-gallery">
                  <button type="button" className="ebd-gallery__main" onClick={() => setLightbox({ images: gallery, index: photo })}
                    aria-label={t('ebooks.enlargePhoto', 'Enlarge the photo')}>
                    <img key={photo} src={gallery[photo]} alt={`${title} ${photo + 1}`} />
                    <span className="ebd-gallery__count">{photo + 1} / {gallery.length}</span>
                    <span className="ebd-gallery__zoom"><i className="isax isax-maximize-4" /></span>
                  </button>
                  <div className="ebd-gallery__thumbs">
                    {gallery.slice(0, 12).map((src, i) => (
                      <button key={src} type="button" className={i === photo ? 'is-on' : ''} onClick={() => setPhoto(i)} aria-label={`${i + 1}`}>
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="ebd-about__copy">
                <p className="lib-kicker lib-kicker--dark">{t('ebooks.aboutBook', 'About the book')}</p>
                <h2>{sc.aboutTitle}</h2>
                <p className="ebd-lead">{sc.intro}</p>
                <p className="ebd-text">{sc.about}</p>
                <div className="ebd-cards">
                  {sc.cards.map((c) => (
                    <div key={c.title} className="ebd-card">
                      <span className="ebd-card__icon"><i className={`isax ${c.icon}`} /></span>
                      <div><h3>{c.title}</h3><p>{c.text}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Contents: the recipes ── */}
          <section className="ebd-sec ebd-contents-sec">
            <div className="lib-wrap">
              <div className="lib-head">
                <p className="lib-kicker">{t('ebooks.insideBook', 'Inside the book')}</p>
                <h2>{t('ebooks.recipesCount', '{{n}} exclusive recipes', { n: recipeCount })}</h2>
                <span className="lib-ornament" aria-hidden="true"><i /></span>
                <p className="ebd-contents__intro">{sc.recipesIntro}</p>
              </div>
              <div className={`ebd-contents${showcase.video ? ' has-video' : ''}`}>
                <ol className="ebd-toc">
                  {sc.recipes.map((r, i) => {
                    const open = openRecipe === i;
                    return (
                      <li key={r.title} className={open ? 'is-open' : ''}>
                        <button type="button" onClick={() => setOpenRecipe(open ? null : i)} aria-expanded={open}>
                          <span className="ebd-toc__num">{String(i + 1).padStart(2, '0')}</span>
                          <span className="ebd-toc__title">{r.title}</span>
                          <i className="isax isax-arrow-down-1 ebd-toc__chev" aria-hidden="true" />
                        </button>
                        <div className="ebd-toc__body" hidden={!open}>
                          <ul>{r.points.map((p) => <li key={p}>{p}</li>)}</ul>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {showcase.video && (
                  <div className="ebd-video">
                    <video src={showcase.video} autoPlay loop muted playsInline preload="metadata" />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Highlights ── */}
          <section className="ebd-sec">
            <div className="lib-wrap">
              <div className="lib-head">
                <p className="lib-kicker lib-kicker--dark">{t('ebooks.whyLove', 'Why you’ll love these recipes')}</p>
                <h2>{t('ebooks.highlights', 'The highlights of our creations')}</h2>
                <span className="lib-ornament" aria-hidden="true"><i /></span>
              </div>
              <div className="ebd-features">
                {sc.features.map((f) => (
                  <div key={f.title} className="ebd-feature">
                    <span className="ebd-card__icon"><i className={`isax ${f.icon}`} /></span>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Students' cakes ── */}
          {showcase.creations.length > 0 && (
            <section className="ebd-sec">
              <div className="lib-wrap">
                <div className="lib-head">
                  <p className="lib-kicker lib-kicker--dark">{t('ebooks.madeByStudents', 'Made with this book')}</p>
                  <h2>{t('ebooks.studentCreations', 'Our students’ creations')}</h2>
                  <span className="lib-ornament" aria-hidden="true"><i /></span>
                </div>
                <div className="ebd-creations">
                  {showcase.creations.map((src, i) => (
                    <button key={src} type="button" onClick={() => setLightbox({ images: showcase.creations, index: i })}
                      aria-label={`${t('ebooks.studentCreations', 'Our students’ creations')} ${i + 1}`}>
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Closing band ── */}
      <section className="lib-wrap">
        <div className="lib-live ebd-final">
          <span className="lib-book ebd-final__book" aria-hidden="true">
            <span className="lib-book__body">
              {ebook.coverUrl ? <img src={ebook.coverUrl} alt="" loading="lazy" /> : <span className="lib-book__blank">{title}</span>}
              <span className="lib-book__spine" /><span className="lib-book__gloss" />
            </span>
            <span className="lib-book__pages" />
          </span>
          <div className="ebd-final__copy">
            <p className="lib-kicker">{sc?.editionNote || t('ebooksPage.kicker', 'The SARALÖWE library')}</p>
            <h2>{title}</h2>
          </div>
          <div className="ebd-final__buy">
            {!ebook.isOwned && <span className="lib-price lib-price--lg ebd-price">{ebook.price}<small>{ebook.currency}</small></span>}
            <PrimaryAction big />
          </div>
        </div>
      </section>

      {/* ── How to pay (only when PayPal is on) ── */}
      <Modal
        open={chooseOpen}
        onCancel={() => { if (!buying) setChooseOpen(false); }}
        title={t('payMethod.dialogTitle', 'Complete your purchase')}
        okText={buying ? t('common.loading', 'Loading…') : t('payMethod.continue', 'Continue to payment')}
        onOk={() => pay(payMethod)}
        okButtonProps={{ loading: buying, style: { background: '#651C32', borderColor: '#651C32' } }}
        cancelText={t('common.cancel', 'Cancel')}
        destroyOnClose
      >
        <p style={{ margin: '0 0 14px', fontWeight: 700 }}>
          {title} · {ebook.price} {ebook.currency}
        </p>
        <PaymentMethodPicker value={payMethod} onChange={setPayMethod} amountMad={Number(ebook.price) || 0} disabled={buying} />
      </Modal>

      {/* ── Slim purchase bar ── */}
      <div className={`ebd-bar${showBar ? ' is-on' : ''}`} aria-hidden={!showBar}>
        <div className="ebd-bar__in">
          <span className="ebd-bar__title">{title}</span>
          {!ebook.isOwned && <span className="lib-price ebd-bar__price">{ebook.price}<small>{ebook.currency}</small></span>}
          <PrimaryAction />
        </div>
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          alt={title}
          onClose={() => setLightbox(null)}
          onMove={(i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb))}
        />
      )}
    </div>
  );
};

export default EbookDetail;
