import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { all_routes } from '../router/all_routes';
import ebookService, { Ebook } from '../../services/api/ebook.service';
import paymentService from '../../services/api/payment.service';
import { extractApiError } from '../../services/api/error.utils';
import { useAppSelector } from '../../core/redux/hooks';

const GOLD = '#C5912C';
const BURG = '#651C32';
const DARK = '#2B0F1E';
const IVORY = '#F2EFE8';

const localized = (e: Ebook, lang: string) => {
  const l = lang?.slice(0, 2);
  const title = (l === 'ar' && e.titleAr) || (l === 'fr' && e.titleFr) || (l === 'en' && e.titleEn) || e.title;
  const desc =
    (l === 'ar' && e.descriptionAr) || (l === 'fr' && e.descriptionFr) ||
    (l === 'en' && e.descriptionEn) || e.description || '';
  return { title, desc };
};

const EbookDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(s => s.auth);

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
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
      sessionStorage.setItem('cmi_txn_id', String(res.transactionId));
      localStorage.setItem('cmi_txn_id', String(res.transactionId));
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

  const { title, desc } = localized(ebook, i18n.language);

  return (
    <div style={{ background: IVORY, minHeight: '100vh', padding: '90px 0 70px' }}>
      <div className="container" style={{ maxWidth: 1040 }}>
        <Link to={all_routes.ebooks} style={{ color: BURG, fontWeight: 600, fontSize: '0.9rem' }}>
          ← {t('ebooks.backToList', 'Back to ebooks')}
        </Link>

        <div className="row g-5 align-items-center" style={{ marginTop: 8 }}>
          {/* Cover */}
          <div className="col-md-5">
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(44,24,16,0.22)',
              background: `linear-gradient(150deg, ${BURG}, ${DARK})`,
              aspectRatio: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

          {/* Details */}
          <div className="col-md-7">
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.7rem)', fontWeight: 800, color: BURG, marginBottom: 6,
            }}>
              {title}
            </h1>
            {ebook.subtitle && (
              <p style={{ color: GOLD, fontWeight: 600, marginBottom: 18 }}>{ebook.subtitle}</p>
            )}

            <p style={{ color: 'rgba(101,28,50,0.78)', fontSize: '1rem', lineHeight: 1.8 }}>{desc}</p>

            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '22px 0' }}>
              {ebook.pageCount ? (
                <span style={{ color: BURG, fontSize: '0.9rem' }}>
                  <i className="isax isax-document-text" style={{ marginInlineEnd: 6, color: GOLD }} />
                  {t('ebooks.pages', '{{n}} pages', { n: ebook.pageCount })}
                </span>
              ) : null}
              {ebook.languages?.length > 0 && (
                <span style={{ color: BURG, fontSize: '0.9rem' }}>
                  <i className="isax isax-language-square" style={{ marginInlineEnd: 6, color: GOLD }} />
                  {ebook.languages.map(l => l.toUpperCase()).join(' · ')}
                </span>
              )}
              <span style={{ color: BURG, fontSize: '0.9rem' }}>
                <i className="isax isax-document-download" style={{ marginInlineEnd: 6, color: GOLD }} />
                {t('ebooks.readAndDownload', 'Read online & download')}
              </span>
            </div>

            {ebook.isOwned ? (
              <div>
                <p style={{ color: '#16a34a', fontWeight: 800, marginBottom: 12 }}>
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
                <p style={{ fontSize: '2.2rem', fontWeight: 800, color: BURG, marginBottom: 4 }}>
                  {ebook.price} <span style={{ fontSize: '1.1rem', color: GOLD }}>{ebook.currency}</span>
                </p>
                <p style={{ color: 'rgba(101,28,50,0.6)', fontSize: '0.85rem', marginBottom: 18 }}>
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
                  {buying
                    ? t('common.loading', 'Loading…')
                    : t('ebooks.buyNow', 'Buy now')}
                </button>
                <p style={{ color: 'rgba(101,28,50,0.5)', fontSize: '0.78rem', marginTop: 12 }}>
                  <i className="isax isax-shield-tick" style={{ marginInlineEnd: 5 }} />
                  {t('ebooks.securePayment', 'Secure payment by CMI')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookDetail;
