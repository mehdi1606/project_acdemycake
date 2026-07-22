import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'

const Featureinstructor = () => {
  const { t } = useTranslation()
  const avatarSrc = 'assets/img/avatar/avatar1.jpeg'

  const STATS = [
    { icon: 'isax isax-medal-star',    value: '15+',      label: t('home.instructor.yearsExperience', 'Years of\nExperience')  },
    { icon: 'isax isax-star',          value: '500+',     label: t('home.instructor.recipesCreated',  'Recipes\nCreated')       },
    { icon: 'isax isax-profile-2user', value: '5 000+',   label: t('home.instructor.studentsTrained', 'Students\nTrained')      },
    { icon: 'isax isax-instagram',     value: '100K+',    label: t('home.instructor.instagramFollowers','Instagram\nFollowers')  },
  ]

  return (
    <>
      <style>{`
        /* ── Instructor section responsive ─────────────────────── */
        .sl-instr-section {
          /* Custom couture pattern image layered over the unified burgundy gradient. */
          background-color: #5A1A2E;
          background-image: url("${process.env.PUBLIC_URL}/assets/img/cover/back%20pattern.png"),
            radial-gradient(120% 85% at 50% 50%, #6E1E36 0%, #5A1A2E 55%, #4A1425 100%);
          background-repeat: no-repeat, no-repeat;
          background-size: cover, cover;
          background-position: center, center;
          position: relative;
          overflow: hidden;
          padding: 100px 0 90px;
        }
        .sl-instr-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 64px;
          align-items: center;
        }
        .sl-instr-circle {
          width: 320px;
          height: 320px;
        }
        .sl-instr-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }
        .sl-instr-stat-val {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 800;
          color: #C5973E;
          line-height: 1;
          margin-bottom: 6px;
        }

        /* ── Tablet (≤ 900px): stack, shrink circle ────────────── */
        @media (max-width: 900px) {
          .sl-instr-section { padding: 72px 0 64px; }
          .sl-instr-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .sl-instr-circle {
            width: 240px;
            height: 240px;
          }
          .sl-instr-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          .sl-instr-stat-val { font-size: 20px; }
        }

        /* ── Mobile (≤ 480px): tighter ─────────────────────────── */
        @media (max-width: 480px) {
          .sl-instr-section { padding: 56px 0 52px; }
          .sl-instr-circle {
            width: 200px;
            height: 200px;
          }
          .sl-instr-stat-val { font-size: 18px; }
          .sl-instr-name {
            font-size: clamp(32px, 9vw, 52px) !important;
          }
          .sl-instr-bio { font-size: 14px !important; }
        }

        /* ── RTL overrides ───────────────────────────────────────── */
        [dir="rtl"] .sl-instr-quote {
          border-left: 1px solid rgba(197,151,62,0.28) !important;
          border-right: 4px solid #C5973E !important;
          border-radius: 12px 0 0 12px !important;
        }
        [dir="rtl"] .sl-instr-medal {
          right: auto !important;
          left: 16px !important;
        }
      `}</style>

      <section className="sl-instr-section">
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(80,14,28,0) 30%, rgba(50,6,18,0.55) 100%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="sl-instr-grid">

            {/* ── Portrait ─────────────────────────────────────────── */}
            <div
              data-aos="fade-right"
              data-aos-duration="900"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Outer ring */}
                <div style={{
                  position: 'absolute', inset: -10,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(197,151,62,0.35)',
                }} />
                {/* Circle */}
                <div
                  className="sl-instr-circle"
                  style={{
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '5px solid rgba(197,151,62,0.55)',
                    boxShadow: '0 0 0 12px rgba(92,18,40,0.6), 0 24px 64px rgba(0,0,0,0.5)',
                    background: '#3a0c1a',
                  }}
                >
                  <img
                    src={avatarSrc}
                    alt={t('home.instructor.avatarAlt', 'Sara Alöwe')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                {/* Medal */}
                <div className="sl-instr-medal" style={{
                  position: 'absolute', bottom: 16, right: 16,
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 100%)',
                  border: '3px solid #5C1228',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="isax isax-medal-star" style={{ fontSize: 24, color: '#5C1228' }} />
                </div>
              </div>
            </div>

            {/* ── Content ──────────────────────────────────────────── */}
            <div data-aos="fade-left" data-aos-duration="900">
              <p style={{
                fontFamily: "'Cinzel','Trajan Pro',Georgia,serif",
                fontSize: 12, letterSpacing: '0.3em',
                color: '#C5973E', marginBottom: 10,
                fontWeight: 600, textTransform: 'uppercase',
              }}>
                {t('home.instructor.meetTheAuthor', 'Meet The Author')}
              </p>

              <h2
                className="sl-instr-name"
                style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  fontSize: 'clamp(36px, 5vw, 58px)',
                  fontWeight: 800, margin: '0 0 24px', lineHeight: 1.1,
                }}
              >
                <span style={{ color: '#fff' }}>Sara </span>
                <span style={{ color: '#C5973E' }}>Alöwe</span>
              </h2>

              <div
                className="sl-instr-bio"
                style={{
                  color: 'rgba(255,235,240,0.88)',
                  fontSize: 15, lineHeight: 1.8, marginBottom: 32,
                }}
              >
                <p style={{ margin: '0 0 14px' }}>
                  {t('home.instructor.bio1', "Hello, I'm Chef Sara Alaoui.")}
                </p>
                <p style={{ margin: '0 0 18px' }}>
                  {t('home.instructor.bio2', "If I had to describe my journey in a few words, I'd say it began with curiosity, grew with passion, and continues to this day.")}
                </p>
                <Link
                  to={all_routes.about_us}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#C5973E',
                    fontFamily: "'Playfair Display',Georgia,serif",
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(197,151,62,0.4)',
                    paddingBottom: 2,
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#DEBB6B';
                    (e.currentTarget as HTMLElement).style.borderColor = '#DEBB6B';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = '#C5973E';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(197,151,62,0.4)';
                  }}
                >
                  {t('home.instructor.seeMore', 'See More')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>

              {/* Stats grid */}
              <div className="sl-instr-stats">
                {STATS.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(197,151,62,0.22)',
                      borderRadius: 14,
                      padding: '16px 8px',
                      textAlign: 'center',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <i className={s.icon} style={{ fontSize: 20, color: '#C5973E', display: 'block', marginBottom: 8 }} />
                    <div className="sl-instr-stat-val">{s.value}</div>
                    <div style={{
                      color: 'rgba(255,235,240,0.7)',
                      fontSize: 11, lineHeight: 1.4,
                      whiteSpace: 'pre-line', letterSpacing: '0.03em',
                    }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quote */}
              <div className="sl-instr-quote" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(197,151,62,0.28)',
                borderLeft: '4px solid #C5973E',
                borderRadius: '0 12px 12px 0',
                padding: '20px 24px',
                backdropFilter: 'blur(8px)',
              }}>
                <p style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  fontStyle: 'italic',
                  color: 'rgba(255,235,240,0.9)',
                  fontSize: 14.5, lineHeight: 1.75, margin: '0 0 10px',
                }}>
                  {t('home.instructor.quote', '"Alchemy is not magic… it\'s the science of natural ingredients, carefully balanced to create stability and beauty in cakes."')}
                </p>
                <p style={{
                  color: '#C5973E', fontSize: 13,
                  fontWeight: 600, margin: 0, letterSpacing: '0.04em',
                }}>
                  {t('home.instructor.quoteAuthor', '— Saralöwe')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default Featureinstructor
