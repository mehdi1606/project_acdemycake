import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LuxuryDashboardLayout from '../../../components/LuxuryDashboardLayout';
import LxEmptyState from '../../../components/LxEmptyState';
import { all_routes } from '../../router/all_routes';
import ebookService, { Ebook } from '../../../services/api/ebook.service';

const GOLD = '#C5912C';

/** The buyer's own library: everything they have paid for, readable inside the platform (no download). */
const StudentEbooks: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ebookService.getMyLibrary()
      .then(list => { if (!cancelled) setEbooks(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setEbooks([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <LuxuryDashboardLayout>
      <div style={{ marginBottom: 22 }}>
        <h5 style={{ fontSize: 20, fontWeight: 700, color: 'var(--lx-text)', margin: 0 }}>
          {t('ebooks.myLibrary', 'My Ebooks')}
          {!loading && (
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--lx-text-muted)', marginInlineStart: 8 }}>
              ({ebooks.length})
            </span>
          )}
        </h5>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', margin: '0 auto',
            border: '3px solid var(--lx-primary)', borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : ebooks.length === 0 ? (
        <div className="lx-card">
          <LxEmptyState
            icon="isax-book-1"
            title={t('ebooks.libraryEmpty', 'No ebooks yet')}
            text={t('ebooks.libraryEmptyHint', 'Ebooks you buy appear here to read any time on the platform.')}
          >
            <Link to={all_routes.ebooks} className="lx-btn lx-btn-gold">
              {t('ebooks.browse', 'Browse ebooks')}
            </Link>
          </LxEmptyState>
        </div>
      ) : (
        <div className="row g-3">
          {ebooks.map(book => (
            <div className="col-md-6" key={book.id}>
              <div className="lx-card" style={{ height: '100%' }}>
                <div className="lx-card-body" style={{ display: 'flex', gap: 16 }}>
                  {/* Cover */}
                  <div style={{
                    width: 86, height: 116, flexShrink: 0, borderRadius: 10, overflow: 'hidden',
                    background: 'linear-gradient(150deg,#651C32,#2B0F1E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="isax isax-book-1" style={{ fontSize: 30, color: GOLD }} />
                    )}
                  </div>

                  {/* Info + actions */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <h6 style={{ fontSize: 15, fontWeight: 700, color: 'var(--lx-text)', margin: '0 0 4px' }}>
                      {book.title}
                    </h6>
                    <span style={{ fontSize: 12, color: 'var(--lx-text-muted)' }}>
                      {book.purchasedAt
                        ? t('ebooks.purchasedOn', 'Purchased {{date}}', {
                            date: new Date(book.purchasedAt).toLocaleDateString(i18n.language),
                          })
                        : ''}
                    </span>
                    {book.languages?.length > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--lx-text-muted)', marginTop: 2 }}>
                        {t('ebooks.editions', 'Editions')}: {book.languages.map(l => l.toUpperCase()).join(' · ')}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="lx-btn lx-btn-gold lx-btn-sm"
                        onClick={() => navigate(all_routes.ebookRead.replace(':id', book.id))}
                      >
                        <i className="isax isax-book-saved" style={{ marginInlineEnd: 5 }} />
                        {t('ebooks.read', 'Read')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </LuxuryDashboardLayout>
  );
};

export default StudentEbooks;
