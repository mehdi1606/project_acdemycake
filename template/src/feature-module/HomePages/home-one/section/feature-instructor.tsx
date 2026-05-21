import React from 'react'
import { useTranslation } from 'react-i18next'

const CAKE_PATTERN_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='340' height='340'>
  <g fill='none' stroke='rgba(222,140,160,0.18)' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'>
    <g transform='translate(28,24)'>
      <path d='M10,44 L18,62 L42,62 L50,44 Z'/>
      <path d='M8,44 C8,24 18,12 30,12 C42,12 52,24 52,44 Z'/>
      <path d='M26,12 Q30,2 34,12'/><circle cx='30' cy='8' r='4'/>
    </g>
    <g transform='translate(260,18)'>
      <rect x='0' y='20' width='60' height='36' rx='3'/>
      <line x1='0' y1='36' x2='60' y2='36'/>
      <path d='M10,20 Q20,8 30,20'/><path d='M30,20 Q40,8 50,20'/>
      <circle cx='20' cy='14' r='3'/><circle cx='40' cy='14' r='3'/>
    </g>
    <g transform='translate(14,148)'>
      <ellipse cx='28' cy='14' rx='28' ry='14'/>
      <ellipse cx='28' cy='44' rx='28' ry='14'/>
      <rect x='4' y='14' width='48' height='30' rx='2'/>
    </g>
    <g transform='translate(276,140)'>
      <path d='M6,40 L14,58 L46,58 L54,40 Z'/>
      <path d='M4,40 C4,22 14,10 30,10 C46,10 56,22 56,40 Z'/>
      <path d='M22,10 Q30,0 38,10'/><circle cx='30' cy='6' r='4'/>
    </g>
    <g transform='translate(20,252)'>
      <rect x='4'  y='44' width='72' height='22' rx='3'/>
      <rect x='10' y='24' width='60' height='22' rx='3'/>
      <rect x='16' y='8'  width='48' height='18' rx='3'/>
      <path d='M28,8 Q40,-4 52,8'/><circle cx='40' cy='4' r='4'/>
    </g>
    <g transform='translate(268,254)'>
      <line x1='10' y1='0' x2='10' y2='70'/>
      <path d='M4,0 L4,28 Q10,32 16,28 L16,0'/>
      <line x1='4'  y1='0' x2='4'  y2='22'/>
      <line x1='10' y1='0' x2='10' y2='22'/>
      <line x1='16' y1='0' x2='16' y2='22'/>
    </g>
    <g stroke='rgba(222,140,160,0.22)'>
      <path d='M168,40 L171,48 L179,48 L173,54 L175,62 L168,57 L161,62 L163,54 L157,48 L165,48 Z'/>
      <path d='M168,188 L170,194 L176,194 L171,198 L173,204 L168,200 L163,204 L165,198 L160,194 L166,194 Z'/>
      <path d='M90,120 L92,126 L98,126 L93,130 L95,136 L90,132 L85,136 L87,130 L82,126 L88,126 Z'/>
      <path d='M248,108 L250,114 L256,114 L251,118 L253,124 L248,120 L243,124 L245,118 L240,114 L246,114 Z'/>
    </g>
  </g>
</svg>`

const PATTERN_URL = `url("data:image/svg+xml,${encodeURIComponent(CAKE_PATTERN_SVG)}")`

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
          background: #5C1228;
          background-image: ${PATTERN_URL};
          background-repeat: repeat;
          background-size: 340px 340px;
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
                  {t('home.instructor.bio1', 'Sara Alöwe is a cake designer and passionate instructor, known for her attention to detail and artistic approach to pastry. After many requests from her students, she compiled her expertise into a three-volume collection featuring 30 innovative cake recipes for modern cake design.')}
                </p>
                <p style={{ margin: 0 }}>
                  {t('home.instructor.bio2', 'Cupcake Evolution – 10 Innovative Cake Recipes is the first volume in this series, dedicated to stability, creativity, and excellence in contemporary pastry.')}
                </p>
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
