import React from 'react'
import { useTranslation } from 'react-i18next'

/* ─────────────────────────────────────────────────────────────────────────────
   SVG cake-pattern background (inline data-url) — mimics the screenshot overlay
   ───────────────────────────────────────────────────────────────────────────── */
const CAKE_PATTERN_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='340' height='340'>
  <g fill='none' stroke='rgba(222,140,160,0.18)' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'>

    <!-- cupcake 1 — top-left -->
    <g transform='translate(28,24)'>
      <path d='M10,44 L18,62 L42,62 L50,44 Z'/>
      <path d='M8,44 C8,24 18,12 30,12 C42,12 52,24 52,44 Z'/>
      <path d='M26,12 Q30,2 34,12'/>
      <circle cx='30' cy='8' r='4'/>
    </g>

    <!-- cake slice 1 — top-right -->
    <g transform='translate(260,18)'>
      <rect x='0' y='20' width='60' height='36' rx='3'/>
      <line x1='0' y1='36' x2='60' y2='36'/>
      <path d='M10,20 Q20,8 30,20'/>
      <path d='M30,20 Q40,8 50,20'/>
      <circle cx='20' cy='14' r='3'/>
      <circle cx='40' cy='14' r='3'/>
    </g>

    <!-- macaron — mid-left -->
    <g transform='translate(14,148)'>
      <ellipse cx='28' cy='14' rx='28' ry='14'/>
      <ellipse cx='28' cy='44' rx='28' ry='14'/>
      <rect x='4' y='14' width='48' height='30' rx='2'/>
    </g>

    <!-- cupcake 2 — mid-right -->
    <g transform='translate(276,140)'>
      <path d='M6,40 L14,58 L46,58 L54,40 Z'/>
      <path d='M4,40 C4,22 14,10 30,10 C46,10 56,22 56,40 Z'/>
      <path d='M22,10 Q30,0 38,10'/>
      <circle cx='30' cy='6' r='4'/>
    </g>

    <!-- layered cake — bottom-left -->
    <g transform='translate(20,252)'>
      <rect x='4'  y='44' width='72' height='22' rx='3'/>
      <rect x='10' y='24' width='60' height='22' rx='3'/>
      <rect x='16' y='8'  width='48' height='18' rx='3'/>
      <path d='M28,8 Q40,-4 52,8'/>
      <circle cx='40' cy='4' r='4'/>
    </g>

    <!-- fork — bottom-right area -->
    <g transform='translate(268,254)'>
      <line x1='10' y1='0' x2='10' y2='70'/>
      <path d='M4,0 L4,28 Q10,32 16,28 L16,0'/>
      <line x1='4'  y1='0' x2='4'  y2='22'/>
      <line x1='10' y1='0' x2='10' y2='22'/>
      <line x1='16' y1='0' x2='16' y2='22'/>
    </g>

    <!-- small star accents -->
    <g stroke='rgba(222,140,160,0.22)'>
      <path d='M168,40 L171,48 L179,48 L173,54 L175,62 L168,57 L161,62 L163,54 L157,48 L165,48 Z'/>
      <path d='M168,188 L170,194 L176,194 L171,198 L173,204 L168,200 L163,204 L165,198 L160,194 L166,194 Z'/>
      <path d='M90,120 L92,126 L98,126 L93,130 L95,136 L90,132 L85,136 L87,130 L82,126 L88,126 Z'/>
      <path d='M248,108 L250,114 L256,114 L251,118 L253,124 L248,120 L243,124 L245,118 L240,114 L246,114 Z'/>
    </g>
  </g>
</svg>`

const PATTERN_URL = `url("data:image/svg+xml,${encodeURIComponent(CAKE_PATTERN_SVG)}")`

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */
const Featureinstructor = () => {
  const { t } = useTranslation()
  const avatarSrc = 'assets/img/avatar/avatar1.jpeg'

  const STATS = [
    { icon: 'isax isax-medal-star',   value: '15+',      label: t('home.instructor.yearsExperience', 'Years of\nExperience')   },
    { icon: 'isax isax-star',         value: '500+',     label: t('home.instructor.recipesCreated', 'Recipes\nCreated')        },
    { icon: 'isax isax-profile-2user',value: '5 000+',   label: t('home.instructor.studentsTrained', 'Students\nTrained')       },
    { icon: 'isax isax-instagram',    value: '100 000+', label: t('home.instructor.instagramFollowers', 'Instagram\nFollowers')    },
  ]
  const firstName = 'Sara'
  const restName  = 'Alöwe'

  return (
    <section
      style={{
        background: '#5C1228',
        backgroundImage: PATTERN_URL,
        backgroundRepeat: 'repeat',
        backgroundSize: '340px 340px',
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 0 90px',
      }}
    >
      {/* Subtle vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(80,14,28,0) 30%, rgba(50,6,18,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.35fr',
          gap: 64,
          alignItems: 'center',
        }}>

          {/* ── LEFT: circular portrait ───────────────────────────────────────── */}
          <div
            data-aos="fade-right"
            data-aos-duration="900"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>

              {/* Outer decorative ring */}
              <div style={{
                position: 'absolute', inset: -10,
                borderRadius: '50%',
                border: '1.5px solid rgba(197,151,62,0.35)',
              }} />

              {/* Photo circle */}
              <div style={{
                width: 320,
                height: 320,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '5px solid rgba(197,151,62,0.55)',
                boxShadow: '0 0 0 12px rgba(92,18,40,0.6), 0 24px 64px rgba(0,0,0,0.5)',
                background: '#3a0c1a',
              }}>
                <img
                  src={avatarSrc}
                  alt={t('home.instructor.avatarAlt', 'Sara Alöwe')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              {/* Gold medal badge */}
              <div style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C5973E 0%, #DEBB6B 100%)',
                border: '3px solid #5C1228',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="isax isax-medal-star" style={{ fontSize: 24, color: '#5C1228' }} />
              </div>
            </div>
          </div>

          {/* ── RIGHT: content ────────────────────────────────────────────────── */}
          <div data-aos="fade-left" data-aos-duration="900">

            {/* "MEET THE AUTHOR" label */}
            <p style={{
              fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
              fontSize: 12,
              letterSpacing: '0.3em',
              color: '#C5973E',
              marginBottom: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>
              {t('home.instructor.meetTheAuthor', 'Meet The Author')}
            </p>

            {/* Name */}
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(36px, 4vw, 58px)',
              fontWeight: 800,
              margin: '0 0 24px',
              lineHeight: 1.1,
            }}>
              <span style={{ color: '#fff' }}>{firstName} </span>
              <span style={{ color: '#C5973E' }}>{restName}</span>
            </h2>

            {/* Bio */}
            <div style={{
              color: 'rgba(255,235,240,0.88)',
              fontSize: 15,
              lineHeight: 1.8,
              marginBottom: 32,
            }}>
              <p style={{ margin: '0 0 14px' }}>
                {t('home.instructor.bio1', 'Sara Alöwe is a cake designer and passionate instructor, known for her attention to detail and artistic approach to pastry. After many requests from her students, she compiled her expertise into a three-volume collection featuring 30 innovative cake recipes for modern cake design.')}
              </p>
              <p style={{ margin: 0 }}>
                {t('home.instructor.bio2', 'Cupcake Evolution – 10 Innovative Cake Recipes is the first volume in this series, dedicated to stability, creativity, and excellence in contemporary pastry.')}
              </p>
            </div>

            {/* Stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 32,
            }}>
              {STATS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(197,151,62,0.22)',
                    borderRadius: 14,
                    padding: '18px 10px',
                    textAlign: 'center',
                    backdropFilter: 'blur(6px)',
                    transition: 'background .2s, border-color .2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(197,151,62,0.12)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(197,151,62,0.55)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(197,151,62,0.22)'
                  }}
                >
                  <i className={s.icon} style={{ fontSize: 22, color: '#C5973E', display: 'block', marginBottom: 8 }} />
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#C5973E',
                    lineHeight: 1,
                    marginBottom: 6,
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    color: 'rgba(255,235,240,0.7)',
                    fontSize: 11,
                    lineHeight: 1.4,
                    whiteSpace: 'pre-line',
                    letterSpacing: '0.03em',
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Quote box */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(197,151,62,0.28)',
              borderLeft: '4px solid #C5973E',
              borderRadius: '0 12px 12px 0',
              padding: '20px 24px',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
                color: 'rgba(255,235,240,0.9)',
                fontSize: 14.5,
                lineHeight: 1.75,
                margin: '0 0 10px',
              }}>
                {t('home.instructor.quote', '"Alchemy is not magic… it\'s the science of natural ingredients, carefully balanced to create stability and beauty in cakes."')}
              </p>
              <p style={{
                color: '#C5973E',
                fontSize: 13,
                fontWeight: 600,
                margin: 0,
                letterSpacing: '0.04em',
              }}>
                {t('home.instructor.quoteAuthor', '— Saralöwe')}
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default Featureinstructor
