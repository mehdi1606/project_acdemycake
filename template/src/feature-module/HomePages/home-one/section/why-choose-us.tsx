/**
 * WhyChooseUs — SARALÖWE Academy
 * ─────────────────────────────────────────────────────────────────────────────
 * Static brand statistics section — no API call, no 0+ counters.
 * Five pillars with outline SVG icons, count-up animation on scroll entry,
 * elegant dividers and ornamental flourishes.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { useTranslation } from 'react-i18next'
import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'

// ─── palette ──────────────────────────────────────────────────────────────────
const MAROON = '#6B1D2A'
const GOLD   = '#C9A84C'
const CREAM  = '#FAF6F0'

// ─── SVG icons (outline, single-colour) ──────────────────────────────────────
const IconGradCap = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
    <polygon points="24,6 46,16 24,26 2,16" />
    <path d="M10 21v10c0 4.4 6.3 8 14 8s14-3.6 14-8V21" />
    <line x1="46" y1="16" x2="46" y2="28" />
    <circle cx="46" cy="30" r="2" fill={GOLD} stroke="none" />
  </svg>
)

const IconWreath = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
    <path d="M8 24c0-8.8 7.2-16 16-16s16 7.2 16 16-7.2 16-16 16S8 32.8 8 24z" />
    <path d="M4 24c0-2 1-3.5 2.5-4.5M4 24c0 2 1 3.5 2.5 4.5" />
    <path d="M44 24c0-2-1-3.5-2.5-4.5M44 24c0 2-1 3.5-2.5 4.5" />
    <path d="M20 34l4 6 4-6" />
    <circle cx="24" cy="24" r="3" fill={GOLD} stroke="none" />
  </svg>
)

const IconStar = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
    <polygon points="24,4 29.5,17.5 44,18.5 33.5,28.5 36.5,43 24,35.5 11.5,43 14.5,28.5 4,18.5 18.5,17.5" />
  </svg>
)

const IconGlobe = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
    <circle cx="24" cy="24" r="19" />
    <ellipse cx="24" cy="24" rx="8" ry="19" />
    <line x1="5" y1="24" x2="43" y2="24" />
    <path d="M9 14h30M9 34h30" />
  </svg>
)

const IconTrophy = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
    <path d="M16 6h16v16c0 6.6-3.6 12-8 13.5C19.6 34 16 28.6 16 22V6z" />
    <path d="M16 10H8c0 6.6 3.6 11 8 11" />
    <path d="M32 10h8c0 6.6-3.6 11-8 11" />
    <line x1="24" y1="36" x2="24" y2="42" />
    <line x1="16" y1="42" x2="32" y2="42" />
  </svg>
)

// ─── Pillar data ──────────────────────────────────────────────────────────────
// animated value  = number to count up to; display = what shows after count
// For text-only stats (e.g. "World Finalist") animated = 0 / displayText handles it
interface PillarData {
  icon:     React.ReactNode
  animated: number          // count-up end value  (0 = skip animation, show displayText)
  suffix:   string
  prefix:   string
  valKey:   string          // i18n key for the bold display string (static fallback)
  labelKey: string
  descKey:  string
  delay:    number
}

// ─── Animated number pill ─────────────────────────────────────────────────────
const CountStat: React.FC<{
  animated: number; suffix: string; prefix: string; valKey: string
  inView: boolean; delay: number; t: (k: string) => string
}> = ({ animated, suffix, prefix, valKey, inView, delay: _delay, t }) => {
  const count = useCountUp(animated, 1800, 0, inView)

  // For non-numeric stats (animated === 0) show the translation string directly
  if (animated === 0) {
    return (
      <div className="sl-why2__value" style={{ color: MAROON }}>
        {t(valKey)}
      </div>
    )
  }

  return (
    <div className="sl-why2__value" style={{ color: MAROON }}>
      {prefix}
      <span>{count}</span>
      {suffix}
    </div>
  )
}

// ─── Single pillar card ───────────────────────────────────────────────────────
const Pillar: React.FC<PillarData & { inView: boolean; t: (k: string) => string }> = (props) => {
  const { icon, animated, suffix, prefix, valKey, labelKey, descKey, delay, inView, t } = props
  return (
    <div
      className="sl-why2__pillar"
      data-aos="fade-up"
      data-aos-delay={delay}
      data-aos-duration="700"
    >
      {/* Icon */}
      <div className="sl-why2__icon">{icon}</div>

      {/* Animated / static number */}
      <CountStat
        animated={animated}
        suffix={suffix}
        prefix={prefix}
        valKey={valKey}
        inView={inView}
        delay={delay}
        t={t}
      />

      {/* Label */}
      <div className="sl-why2__label">{t(labelKey)}</div>

      {/* Gold rule */}
      <div className="sl-why2__rule" />

      {/* Desc */}
      <p className="sl-why2__desc">{t(descKey)}</p>
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────
const WhyChooseUs: React.FC = () => {
  const { t } = useTranslation()
  const route = all_routes
  const { ref, inView } = useInView<HTMLDivElement>(0.15)

  const pillars: PillarData[] = [
    {
      icon: <IconGradCap />,
      animated: 10, suffix: 'K+', prefix: '',
      valKey: 'whyChooseUs.stat1Val',
      labelKey: 'whyChooseUs.stat1Label',
      descKey:  'whyChooseUs.stat1Desc',
      delay: 0,
    },
    {
      icon: <IconWreath />,
      animated: 15, suffix: '+', prefix: '',
      valKey: 'whyChooseUs.stat2Val',
      labelKey: 'whyChooseUs.stat2Label',
      descKey:  'whyChooseUs.stat2Desc',
      delay: 80,
    },
    {
      icon: <IconStar />,
      animated: 98, suffix: '%', prefix: '',
      valKey: 'whyChooseUs.stat3Val',
      labelKey: 'whyChooseUs.stat3Label',
      descKey:  'whyChooseUs.stat3Desc',
      delay: 160,
    },
    {
      icon: <IconGlobe />,
      animated: 1, suffix: 'ST', prefix: '',
      valKey: 'whyChooseUs.stat4Val',
      labelKey: 'whyChooseUs.stat4Label',
      descKey:  'whyChooseUs.stat4Desc',
      delay: 240,
    },
    {
      icon: <IconTrophy />,
      animated: 0, suffix: '', prefix: '',   // text-only
      valKey: 'whyChooseUs.stat5Val',
      labelKey: 'whyChooseUs.stat5Label',
      descKey:  'whyChooseUs.stat5Desc',
      delay: 320,
    },
  ]

  return (
    <>
      {/* ── Scoped CSS ── */}
      <style>{`
        .sl-why2 {
          background: ${CREAM};
          padding: 80px 0 72px;
          position: relative;
          overflow: hidden;
        }
        /* Subtle top & bottom border lines */
        .sl-why2::before,
        .sl-why2::after {
          content: '';
          position: absolute;
          left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${GOLD}55, transparent);
        }
        .sl-why2::before { top: 0; }
        .sl-why2::after  { bottom: 0; }

        /* Section header */
        .sl-why2__header {
          text-align: center;
          margin-bottom: 56px;
        }
        .sl-why2__script {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: 1.15rem;
          color: ${GOLD};
          margin-bottom: 10px;
        }
        .sl-why2__script::before,
        .sl-why2__script::after {
          content: '';
          display: block;
          width: 48px;
          height: 1px;
          background: ${GOLD};
          opacity: .6;
        }
        .sl-why2__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2rem, 4vw, 2.9rem);
          font-weight: 700;
          color: ${MAROON};
          margin: 0 0 6px;
          line-height: 1.15;
        }
        .sl-why2__ornament {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin: 10px 0 14px;
          color: ${GOLD};
          font-size: 1.1rem;
          opacity: .7;
        }
        .sl-why2__ornament::before,
        .sl-why2__ornament::after {
          content: '';
          display: block;
          width: 40px;
          height: 1px;
          background: ${GOLD};
          opacity: .4;
        }
        .sl-why2__sub {
          color: #7a6a60;
          font-size: .97rem;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* Grid */
        .sl-why2__grid {
          display: flex;
          gap: 0;
          flex-wrap: wrap;
        }

        /* Pillar */
        .sl-why2__pillar {
          flex: 1 1 0;
          min-width: 150px;
          text-align: center;
          padding: 24px 20px 28px;
          position: relative;
          transition: background .25s;
        }
        .sl-why2__pillar:hover {
          background: rgba(201,168,76,.06);
          border-radius: 8px;
        }
        /* Vertical separator between pillars */
        .sl-why2__pillar + .sl-why2__pillar::before {
          content: '';
          position: absolute;
          left: 0; top: 10%; bottom: 10%;
          width: 1px;
          background: linear-gradient(180deg, transparent, ${GOLD}44, transparent);
        }

        .sl-why2__icon {
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
          opacity: .85;
        }

        .sl-why2__value {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 700;
          line-height: 1;
          color: ${MAROON};
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .sl-why2__label {
          font-size: .68rem;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: ${MAROON};
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .sl-why2__rule {
          width: 28px;
          height: 2px;
          background: ${GOLD};
          margin: 0 auto 12px;
          border-radius: 2px;
        }

        .sl-why2__desc {
          font-size: .84rem;
          color: #8a7060;
          line-height: 1.6;
          margin: 0;
          max-width: 160px;
          margin-inline: auto;
        }

        /* CTA */
        .sl-why2__cta {
          text-align: center;
          margin-top: 52px;
        }

        /* Responsive: 3 cols on tablet, 1-2 on mobile */
        @media (max-width: 900px) {
          .sl-why2__pillar { min-width: 33%; }
        }
        @media (max-width: 600px) {
          .sl-why2__grid { gap: 0; }
          .sl-why2__pillar { min-width: 50%; }
          .sl-why2__pillar + .sl-why2__pillar::before { display: none; }
          .sl-why2__pillar:nth-child(even) { border-left: 1px solid ${GOLD}33; }
        }
      `}</style>

      <section className="sl-why2">
        <div className="container">

          {/* ── Header ── */}
          <div
            className="sl-why2__header"
            data-aos="fade-up"
            data-aos-duration="700"
          >
            <div className="sl-why2__script">
              {t('whyChooseUs.ornament', 'By the numbers')}
            </div>
            <h2 className="sl-why2__title">
              {t('whyChooseUs.title', 'Why SARALÖWE Stands Apart')}
            </h2>
            {/* Ornamental clover / fleur */}
            <div className="sl-why2__ornament">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="12" cy="7" r="4"/>
                <circle cx="17" cy="14" r="4"/>
                <circle cx="7" cy="14" r="4"/>
                <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none"/>
              </svg>
            </div>
            <p className="sl-why2__sub">
              {t('whyChooseUs.description', 'Numbers that reflect a decade of craftsmanship, community, and couture education.')}
            </p>
          </div>

          {/* ── Pillars grid ── */}
          <div ref={ref} className="sl-why2__grid">
            {pillars.map((p) => (
              <Pillar key={p.labelKey} {...p} inView={inView} t={t} />
            ))}
          </div>

          {/* ── CTA ── */}
          <div
            className="sl-why2__cta"
            data-aos="fade-up"
            data-aos-delay="200"
            data-aos-duration="700"
          >
            <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
              {t('whyChooseUs.discoverOurWorld', 'Discover Our World')}{' '}
              <i className="isax isax-arrow-right-1" />
            </Link>
          </div>

        </div>
      </section>
    </>
  )
}

export default WhyChooseUs
