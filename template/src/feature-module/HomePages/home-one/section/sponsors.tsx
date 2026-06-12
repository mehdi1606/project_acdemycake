/**
 * SponsorsSection — SARALÖWE Academy
 * An infinite, auto-scrolling marquee of sponsor / partner logos. Logos sit on
 * elegant white cards (so any logo displays cleanly), drift continuously, pause
 * on hover, and lift on hover. Bilingual (AR/EN), edge-faded, seamless loop.
 */
import React from 'react'
import { useTranslation } from 'react-i18next'

// ─── palette ──────────────────────────────────────────────────────────────────
const GOLD   = '#C9A84C'
const MAROON = '#6B1D2A'
const IVORY  = '#F2EFE8'

// Logos in public/assets/img/sponsor (filenames kept verbatim — encoded at render)
const SPONSORS = [
  'Bilait.webp', 'Bravo.png', 'Fo ozmer.jpg.jpeg', 'Katsan.jpg.jpeg',
  'logo-cioccolato.png', 'logo-gelato.png', 'logo-master.png', 'Martini.png',
  'natra-cacao.png', 'one-way-plastics.webp', 'Saracino.png',
]

const SponsorsSection: React.FC = () => {
  const { i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const src = (n: string) => `${process.env.PUBLIC_URL}/assets/img/sponsor/${encodeURIComponent(n)}`
  const label = (n: string) => n.replace(/\.(webp|png|jpe?g|jpg\.jpeg)$/i, '').replace(/[-_]/g, ' ')

  const L = isRtl
    ? { ornament: 'بثقة من', title: 'رعاتنا وشركاؤنا', sub: 'بفخر بدعم من أبرز العلامات التجارية في عالم الباتيسري وفنون الطهي.' }
    : { ornament: 'Trusted By', title: 'Our Sponsors & Partners', sub: 'Proudly supported by leading brands across the pastry and culinary world.' }

  // Rendered twice → translateX(-50%) gives a seamless infinite loop.
  const track = [...SPONSORS, ...SPONSORS]

  return (
    <>
      <style>{`
        .sl-spon { background: ${IVORY}; padding: 76px 0 80px; position: relative; overflow: hidden; }
        .sl-spon::before, .sl-spon::after {
          content: ''; position: absolute; left: 8%; right: 8%; height: 1px;
          background: linear-gradient(90deg, transparent, ${GOLD}55, transparent);
        }
        .sl-spon::before { top: 0; } .sl-spon::after { bottom: 0; }

        .sl-spon__head { text-align: center; margin-bottom: 46px; }
        .sl-spon__script {
          display: inline-flex; align-items: center; gap: 14px;
          font-family: 'Playfair Display', Georgia, serif; font-style: italic;
          font-size: 1.1rem; color: ${GOLD}; margin-bottom: 8px;
        }
        .sl-spon__script::before, .sl-spon__script::after {
          content: ''; display: block; width: 42px; height: 1px; background: ${GOLD}; opacity: .6;
        }
        .sl-spon__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.8rem, 3.8vw, 2.6rem); font-weight: 700;
          color: ${MAROON}; margin: 0 0 12px; line-height: 1.2;
        }
        .sl-spon__sub { color: #6f6058; font-size: 1rem; line-height: 1.7; max-width: 620px; margin: 0 auto; }

        .sl-spon__viewport { position: relative; overflow: hidden; }
        .sl-spon__viewport::before, .sl-spon__viewport::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 110px; z-index: 2; pointer-events: none;
        }
        .sl-spon__viewport::before { left: 0;  background: linear-gradient(90deg, ${IVORY}, transparent); }
        .sl-spon__viewport::after  { right: 0; background: linear-gradient(270deg, ${IVORY}, transparent); }

        .sl-spon__track {
          display: flex; width: max-content; align-items: center; direction: ltr;
          animation: sl-spon-scroll 44s linear infinite; will-change: transform;
        }
        .sl-spon__viewport:hover .sl-spon__track { animation-play-state: paused; }

        .sl-spon__item { flex: 0 0 auto; width: 190px; height: 112px; padding: 0 14px; display: flex; }
        .sl-spon__card {
          width: 100%; height: 100%; background: #fff; border-radius: 16px;
          border: 1px solid rgba(201,168,76,.16); box-shadow: 0 8px 24px rgba(107,29,42,.06);
          display: flex; align-items: center; justify-content: center; padding: 18px;
          transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
        }
        .sl-spon__card:hover { transform: translateY(-6px); box-shadow: 0 18px 42px rgba(107,29,42,.14); border-color: ${GOLD}66; }
        .sl-spon__card img {
          max-width: 100%; max-height: 60px; object-fit: contain;
          opacity: .9; transition: opacity .35s ease, transform .35s ease;
        }
        .sl-spon__card:hover img { opacity: 1; transform: scale(1.04); }

        @keyframes sl-spon-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .sl-spon__track { animation: none; flex-wrap: wrap; justify-content: center; }
        }
        @media (max-width: 600px) {
          .sl-spon { padding: 56px 0 58px; }
          .sl-spon__item { width: 152px; height: 94px; }
          .sl-spon__card img { max-height: 46px; }
        }
      `}</style>

      <section className="sl-spon">
        <div className="container">
          <div className="sl-spon__head" data-aos="fade-up" data-aos-duration="700">
            <div className="sl-spon__script">{L.ornament}</div>
            <h2 className="sl-spon__title">{L.title}</h2>
            <p className="sl-spon__sub">{L.sub}</p>
          </div>
        </div>

        <div className="sl-spon__viewport" data-aos="fade-up" data-aos-delay="100" data-aos-duration="800">
          <div className="sl-spon__track">
            {track.map((name, i) => (
              <div className="sl-spon__item" key={i} aria-hidden={i >= SPONSORS.length}>
                <div className="sl-spon__card">
                  <img
                    src={src(name)}
                    alt={label(name)}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const item = (e.target as HTMLImageElement).closest('.sl-spon__item') as HTMLElement | null
                      if (item) item.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default SponsorsSection
