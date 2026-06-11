/**
 * StorySection — SARALÖWE Academy
 * "Where the Story Began" — heritage / origin section. Real training-session
 * photos (assets/img/formation) presented as an editorial mosaic with hover
 * captions and a click-to-zoom lightbox. Bilingual (AR/EN), RTL-aware.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { useTranslation } from 'react-i18next'

// ─── palette ──────────────────────────────────────────────────────────────────
const MAROON = '#6B1D2A'
const GOLD   = '#C9A84C'
const IVORY  = '#F2EFE8'

// Optimised WebP album (originals 3750×5000 → 900px webp)
const PHOTOS = [
  'IMG_5556.webp', 'IMG_5557.webp', 'IMG_5558.webp', 'IMG_5560.webp',
  'IMG_5561.webp', 'IMG_5564.webp', 'IMG_5565.webp', 'IMG_5555.webp',
]
const N = PHOTOS.length

const StorySection: React.FC = () => {
  const { i18n } = useTranslation()
  const route = all_routes
  const isRtl = i18n.language === 'ar'

  // Lightbox state
  const [active, setActive] = useState<number | null>(null)
  const close = useCallback(() => setActive(null), [])
  const go = useCallback((dir: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActive(a => (a === null ? a : (a + dir + N) % N))
  }, [])

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      else if (e.key === 'ArrowRight') setActive(a => (a === null ? a : (a + 1) % N))
      else if (e.key === 'ArrowLeft') setActive(a => (a === null ? a : (a - 1 + N) % N))
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [active])

  const content = {
    en: {
      ornament: 'Our Heritage',
      title: 'Where the Story Began',
      description: 'For over 15 years, SARALÖWE has shared its expertise with thousands of students around the world — through in-person courses, hands-on workshops, and professional masterclasses that have built a true community of creators and professionals.',
      badge: '15+ Years of Experience',
      cta: 'Discover Our Story',
      captions: ['In-Person Workshops', 'Cake Design & Decoration', 'Golden Touches', 'Chocolate Artistry', 'Mastering the Details', 'Boundless Creativity', 'Sugar Flowers', 'Personal Mentoring'],
    },
    ar: {
      ornament: 'إرثنا',
      title: 'حيث بدأت الحكاية',
      description: 'على مدار أكثر من 15 عاماً، شاركت SARALÖWE خبراتها مع آلاف الطلاب حول العالم من خلال دورات حضورية، ورش تطبيقية، وماستر كلاس احترافية صنعت مجتمعاً من المبدعين والمحترفين.',
      badge: '15+ سنة من الخبرة',
      cta: 'تعرّف على قصتنا',
      captions: ['ورش حضورية', 'تصميم وزخرفة الكيك', 'اللمسات الذهبية', 'فن الشوكولاتة', 'إتقان التفاصيل', 'إبداع بلا حدود', 'زهور السكر', 'تدريب شخصي'],
    },
  }

  const L = content[isRtl ? 'ar' : 'en']
  const src = (name: string) => `${process.env.PUBLIC_URL}/assets/img/formation/${name}`

  return (
    <>
      <style>{`
        .sl-story {
          background: radial-gradient(120% 90% at 50% 0%, #FBF8F2 0%, ${IVORY} 60%, #ECE7DC 100%);
          padding: 88px 0 84px; position: relative; overflow: hidden;
        }
        .sl-story::before, .sl-story::after {
          content: ''; position: absolute; left: 8%; right: 8%; height: 1px;
          background: linear-gradient(90deg, transparent, ${GOLD}55, transparent);
        }
        .sl-story::before { top: 0; } .sl-story::after { bottom: 0; }

        .sl-story__header { text-align: center; margin-bottom: 50px; }
        .sl-story__badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Playfair Display', Georgia, serif; font-weight: 700;
          font-size: .82rem; letter-spacing: .04em; color: ${MAROON};
          background: rgba(201,168,76,.14); border: 1px solid ${GOLD}55;
          border-radius: 999px; padding: .42rem 1.1rem; margin-bottom: 1rem;
        }
        .sl-story__badge i { color: ${GOLD}; font-size: 1rem; }
        .sl-story__script {
          display: inline-flex; align-items: center; gap: 14px;
          font-family: 'Playfair Display', Georgia, serif; font-style: italic;
          font-size: 1.1rem; color: ${GOLD}; margin-bottom: 8px;
        }
        .sl-story__script::before, .sl-story__script::after {
          content: ''; display: block; width: 42px; height: 1px; background: ${GOLD}; opacity: .6;
        }
        .sl-story__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.9rem, 4vw, 2.9rem); font-weight: 700;
          color: ${MAROON}; margin: 0 0 14px; line-height: 1.2;
        }
        .sl-story__desc { color: #6f6058; font-size: 1.02rem; line-height: 1.85; max-width: 760px; margin: 0 auto; }

        /* ── Editorial mosaic ───────────────────────────────────────────── */
        .sl-story__mosaic {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: clamp(158px, 18vw, 212px);
          grid-template-areas:
            "a a b c"
            "a a b d"
            "e f g d"
            "e f g h";
          gap: 1rem;
        }
        .sl-story__tile:nth-child(1) { grid-area: a; }
        .sl-story__tile:nth-child(2) { grid-area: b; }
        .sl-story__tile:nth-child(3) { grid-area: c; }
        .sl-story__tile:nth-child(4) { grid-area: d; }
        .sl-story__tile:nth-child(5) { grid-area: e; }
        .sl-story__tile:nth-child(6) { grid-area: f; }
        .sl-story__tile:nth-child(7) { grid-area: g; }
        .sl-story__tile:nth-child(8) { grid-area: h; }

        .sl-story__tile {
          position: relative; overflow: hidden; border-radius: 16px; cursor: pointer;
          border: 1px solid rgba(201,168,76,.18);
          box-shadow: 0 10px 30px rgba(107,29,42,.08);
          transition: box-shadow .4s ease, border-color .4s ease;
        }
        .sl-story__tile:nth-child(1) { border-color: ${GOLD}55; }
        .sl-story__tile img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform .9s cubic-bezier(.25,.46,.45,.94), filter .5s;
        }
        .sl-story__tile::before {
          content: ''; position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(to top, rgba(58,12,24,.78) 0%, rgba(58,12,24,.12) 42%, transparent 70%);
          opacity: 0; transition: opacity .45s ease;
        }
        .sl-story__corner {
          position: absolute; top: .7rem; ${isRtl ? 'left' : 'right'}: .7rem; z-index: 2;
          width: 1.5rem; height: 1.5rem;
          border-top: 1px solid ${GOLD}; border-${isRtl ? 'left' : 'right'}: 1px solid ${GOLD};
          opacity: 0; transition: opacity .45s ease;
        }
        .sl-story__zoom {
          position: absolute; top: .65rem; ${isRtl ? 'right' : 'left'}: .65rem; z-index: 3;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(201,168,76,.92); color: #2A0E18;
          display: flex; align-items: center; justify-content: center; font-size: .95rem;
          opacity: 0; transform: scale(.7); transition: opacity .4s ease, transform .4s ease;
        }
        .sl-story__cap {
          position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
          padding: 1rem 1.1rem; text-align: ${isRtl ? 'right' : 'left'};
          font-family: 'Playfair Display', Georgia, serif; font-weight: 600;
          font-size: .95rem; letter-spacing: .02em; color: #fff;
          transform: translateY(12px); opacity: 0;
          transition: transform .45s ease, opacity .45s ease;
        }
        .sl-story__cap::before {
          content: ''; display: inline-block; width: 22px; height: 2px;
          background: ${GOLD}; vertical-align: middle; margin-${isRtl ? 'left' : 'right'}: 8px;
        }
        .sl-story__tile:hover { box-shadow: 0 24px 55px rgba(107,29,42,.22); border-color: ${GOLD}; }
        .sl-story__tile:hover img { transform: scale(1.08); }
        .sl-story__tile:hover::before,
        .sl-story__tile:hover .sl-story__corner,
        .sl-story__tile:hover .sl-story__zoom,
        .sl-story__tile:hover .sl-story__cap { opacity: 1; transform: none; }
        .sl-story__tile:hover .sl-story__zoom { transform: scale(1); }

        @media (max-width: 992px) {
          .sl-story__mosaic {
            grid-template-columns: repeat(2, 1fr);
            grid-template-areas: none;
            grid-auto-rows: auto; gap: .8rem;
          }
          .sl-story__tile { grid-area: auto !important; aspect-ratio: 3 / 4; }
          .sl-story__cap, .sl-story__corner { opacity: 1; transform: none; }
          .sl-story__tile::before { opacity: 1; }
        }
        @media (max-width: 480px) { .sl-story__mosaic { gap: .55rem; } .sl-story { padding: 60px 0 56px; } }

        .sl-story__cta { text-align: center; margin-top: 48px; }

        /* ── Lightbox ───────────────────────────────────────────────────── */
        .sl-lb {
          position: fixed; inset: 0; z-index: 99990;
          background: rgba(28,8,16,.93); backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
          display: flex; align-items: center; justify-content: center; padding: 5vh 4vw;
          animation: sl-lb-in .28s ease;
        }
        @keyframes sl-lb-in { from { opacity: 0 } to { opacity: 1 } }
        .sl-lb__img {
          max-width: min(92vw, 720px); max-height: 86vh; border-radius: 12px;
          border: 1px solid rgba(201,168,76,.4); box-shadow: 0 30px 90px rgba(0,0,0,.55);
          animation: sl-lb-zoom .35s cubic-bezier(.16,1,.3,1);
        }
        @keyframes sl-lb-zoom { from { transform: scale(.92); opacity: .4 } to { transform: scale(1); opacity: 1 } }
        .sl-lb__btn {
          position: absolute; border-radius: 50%; cursor: pointer; z-index: 2;
          background: rgba(255,255,255,.08); border: 1px solid rgba(201,168,76,.45); color: ${GOLD};
          display: flex; align-items: center; justify-content: center;
          transition: background .25s ease, color .25s ease, transform .2s ease;
        }
        .sl-lb__btn:hover { background: ${GOLD}; color: #2A0E18; }
        .sl-lb__close { top: 20px; right: 24px; width: 46px; height: 46px; font-size: 1.5rem; color: #fff; }
        .sl-lb__nav { top: 50%; transform: translateY(-50%); width: 54px; height: 54px; font-size: 1.5rem; }
        .sl-lb__nav.prev { left: 2.5vw; } .sl-lb__nav.next { right: 2.5vw; }
        .sl-lb__cap {
          position: absolute; bottom: 4vh; left: 0; right: 0; text-align: center;
          font-family: 'Playfair Display', Georgia, serif; color: ${IVORY};
          letter-spacing: .05em; font-size: 1rem;
        }
        .sl-lb__cap span { color: ${GOLD}; margin: 0 .5rem; font-size: .85rem; }
        @media (max-width: 600px) {
          .sl-lb__nav { width: 44px; height: 44px; }
          .sl-lb__nav.prev { left: 4px; } .sl-lb__nav.next { right: 4px; }
        }
      `}</style>

      <section className="sl-story">
        <div className="container">
          {/* Header */}
          <div className="sl-story__header" data-aos="fade-up" data-aos-duration="700">
            <div className="sl-story__badge"><i className="isax isax-medal-star" />{L.badge}</div>
            <div className="sl-story__script">{L.ornament}</div>
            <h2 className="sl-story__title">{L.title}</h2>
            <p className="sl-story__desc">{L.description}</p>
          </div>

          {/* Editorial mosaic */}
          <div className="sl-story__mosaic">
            {PHOTOS.map((name, i) => (
              <div
                key={name}
                className="sl-story__tile"
                onClick={() => setActive(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActive(i) }}
                aria-label={L.captions[i]}
                data-aos="zoom-in"
                data-aos-delay={(i % 4) * 70}
                data-aos-duration="700"
              >
                <img
                  src={src(name)}
                  alt={L.captions[i]}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                />
                <span className="sl-story__corner" aria-hidden="true" />
                <span className="sl-story__zoom" aria-hidden="true"><i className="isax isax-maximize-3" /></span>
                <div className="sl-story__cap">{L.captions[i]}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="sl-story__cta" data-aos="fade-up" data-aos-delay="120" data-aos-duration="700">
            <Link to={route.about_us} className="sl-btn-gold sl-btn-magnetic">
              {L.cta} <i className={`isax ${isRtl ? 'isax-arrow-left-2' : 'isax-arrow-right-1'}`} />
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {active !== null && (
        <div className="sl-lb" onClick={close} role="dialog" aria-modal="true">
          <button className="sl-lb__btn sl-lb__close" onClick={(e) => { e.stopPropagation(); close() }} aria-label="Close">
            <i className="isax isax-close-circle" />
          </button>
          <button className="sl-lb__btn sl-lb__nav prev" onClick={(e) => go(-1, e)} aria-label="Previous">
            <i className="isax isax-arrow-left-2" />
          </button>
          <img
            className="sl-lb__img"
            src={src(PHOTOS[active])}
            alt={L.captions[active]}
            onClick={(e) => e.stopPropagation()}
          />
          <button className="sl-lb__btn sl-lb__nav next" onClick={(e) => go(1, e)} aria-label="Next">
            <i className="isax isax-arrow-right-1" />
          </button>
          <div className="sl-lb__cap">
            {L.captions[active]}<span>✦</span>{active + 1} / {N}
          </div>
        </div>
      )}
    </>
  )
}

export default StorySection
