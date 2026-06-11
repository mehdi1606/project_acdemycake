/**
 * WhyChooseUs — SARALÖWE Academy
 * "What Awaits You Inside SARALÖWE Academy?" — a luxury 6-feature grid (2 rows × 3)
 * presenting the academy's ecosystem. Bilingual (AR/EN), RTL-aware.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { useTranslation } from 'react-i18next'

// ─── palette ──────────────────────────────────────────────────────────────────
const MAROON = '#6B1D2A'
const GOLD   = '#C9A84C'
const CREAM  = '#FAF6F0'

const WhyChooseUs: React.FC = () => {
  const { i18n } = useTranslation()
  const route = all_routes
  const isRtl = i18n.language === 'ar'

  // icon + destination per card (shared across languages)
  const meta = [
    { icon: 'isax-book-1',    to: route.courseList },
    { icon: 'isax-crown-1',   to: route.masterclass },
    { icon: 'isax-people',    to: route.blogGrid },
    { icon: 'isax-medal-star',to: route.studentCertificates },
    { icon: 'isax-cup',       to: route.blogGrid },
    { icon: 'isax-routing-2', to: route.courseList },
  ]

  const content = {
    en: {
      script:   'Why SARALÖWE',
      title:    'What Awaits You Inside SARALÖWE Academy?',
      subtitle: 'More than just courses — an integrated ecosystem that brings together learning, practice, community, and professional growth in one place.',
      cta:      'Discover Our World',
      boxes: [
        { title: 'Complete Professional Courses', desc: 'Learn step by step — from pastry fundamentals and cake design to advanced techniques — through a constantly growing library of high-quality courses.', link: 'Explore Courses' },
        { title: 'Exclusive Masterclasses',       desc: 'Join specialised masterclasses led by a select group of world-class experts and professional chefs to gain advanced techniques and expertise.', link: 'Discover Masterclasses' },
        { title: 'Global Interactive Community',   desc: 'Ask your questions, share your work, get feedback, take part in live challenges and events, and connect with thousands of learners worldwide.', link: 'Join the Community' },
        { title: 'Certificates & Achievement Badges', desc: 'Earn completion certificates and digital badges that reflect your progress and your level within the academy.', link: 'View Certificates' },
        { title: 'Competitions & Challenges',      desc: 'Test your skills through regular challenges and exclusive competitions with prizes and opportunities to be featured.', link: 'Take the Challenge' },
        { title: 'Clear Learning Paths',           desc: 'Whether you are a beginner or a professional, you will find a learning path designed to help you reach your goals.', link: 'Find Your Path' },
      ],
    },
    ar: {
      script:   'لماذا SARALÖWE',
      title:    'ماذا ينتظرك داخل أكاديمية SARALÖWE؟',
      subtitle: 'أكثر من مجرد دورات تعليمية... منظومة متكاملة تجمع التعلم، التطبيق، المجتمع، والتطور المهني في مكان واحد.',
      cta:      'اكتشف عالمنا',
      boxes: [
        { title: 'دورات احترافية متكاملة', desc: 'تعلم خطوة بخطوة من أساسيات الباتيسري وتصميم الكيك إلى التقنيات المتقدمة من خلال مكتبة متجددة من الدورات عالية الجودة.', link: 'استكشف الدورات' },
        { title: 'ماستر كلاس حصرية',        desc: 'شارك في ماستر كلاس متخصصة يقدمها نخبة من الخبراء والشيفات المحترفين حول العالم لاكتساب تقنيات وخبرات متقدمة.', link: 'اكتشف الماستر كلاس' },
        { title: 'مجتمع تفاعلي عالمي',       desc: 'اطرح أسئلتك، شارك أعمالك، احصل على الملاحظات، شارك في التحديات والفعاليات المباشرة، وتواصل مع آلاف المتعلمين حول العالم.', link: 'انضم إلى المجتمع' },
        { title: 'شهادات وشارات إنجاز',      desc: 'احصل على شهادات إتمام وشارات رقمية تعكس تقدمك ومستواك داخل الأكاديمية.', link: 'عرض الشهادات' },
        { title: 'مسابقات وتحديات',          desc: 'اختبر مهاراتك من خلال تحديات دورية ومسابقات حصرية مع جوائز وفرص للظهور.', link: 'شارك في التحدي' },
        { title: 'مسارات تعليمية واضحة',     desc: 'سواء كنت مبتدئاً أو محترفاً، ستجد مساراً تعليمياً مصمماً لمساعدتك على الوصول إلى أهدافك.', link: 'ابدأ مسارك' },
      ],
    },
  }

  const L = content[isRtl ? 'ar' : 'en']

  return (
    <>
      <style>{`
        .sl-feat {
          background: ${CREAM};
          padding: 84px 0 80px;
          position: relative;
          overflow: hidden;
        }
        .sl-feat::before, .sl-feat::after {
          content: ''; position: absolute; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, ${GOLD}55, transparent);
        }
        .sl-feat::before { top: 0; } .sl-feat::after { bottom: 0; }

        .sl-feat__header { text-align: center; margin-bottom: 52px; }
        .sl-feat__script {
          display: inline-flex; align-items: center; gap: 14px;
          font-family: 'Playfair Display', Georgia, serif; font-style: italic;
          font-size: 1.15rem; color: ${GOLD}; margin-bottom: 10px;
        }
        .sl-feat__script::before, .sl-feat__script::after {
          content: ''; display: block; width: 46px; height: 1px; background: ${GOLD}; opacity: .6;
        }
        .sl-feat__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.9rem, 4vw, 2.8rem); font-weight: 700;
          color: ${MAROON}; margin: 0 0 14px; line-height: 1.2;
        }
        .sl-feat__sub {
          color: #7a6a60; font-size: 1rem; max-width: 640px; margin: 0 auto; line-height: 1.75;
        }

        .sl-feat-card {
          background: #fff;
          border: 1px solid rgba(201,168,76,.16);
          border-radius: 16px;
          padding: 2rem 1.6rem 1.6rem;
          height: 100%;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          text-align: ${isRtl ? 'right' : 'left'};
          transition: transform .35s cubic-bezier(.25,.46,.45,.94), box-shadow .35s, border-color .35s;
        }
        .sl-feat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
          transform: scaleX(0); transition: transform .45s ease;
        }
        .sl-feat-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 22px 55px rgba(107,29,42,.13);
          border-color: ${GOLD}66;
        }
        .sl-feat-card:hover::before { transform: scaleX(1); }
        .sl-feat-card:hover .sl-feat-card__icon { transform: scale(1.06) rotate(-3deg); }

        .sl-feat-card__corner {
          position: absolute; top: .9rem; ${isRtl ? 'left' : 'right'}: .9rem;
          width: 1.5rem; height: 1.5rem;
          border-top: 1px solid ${GOLD};
          border-${isRtl ? 'left' : 'right'}: 1px solid ${GOLD};
          opacity: .45;
        }
        .sl-feat-card__icon {
          width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, ${MAROON} 0%, #8B2335 100%);
          display: flex; align-items: center; justify-content: center;
          color: ${GOLD}; font-size: 27px; margin-bottom: 1.2rem;
          box-shadow: 0 8px 22px rgba(107,29,42,.22);
          transition: transform .4s ease;
        }
        .sl-feat-card__title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.18rem; font-weight: 700; color: ${MAROON};
          margin: 0 0 .6rem; line-height: 1.35;
        }
        .sl-feat-card__desc {
          font-size: .9rem; color: #7a6a60; line-height: 1.7; margin: 0 0 1.1rem; flex: 1;
        }
        .sl-feat-card__link {
          color: ${GOLD}; font-weight: 700; font-size: .85rem; letter-spacing: .02em;
          text-decoration: none; display: inline-flex; align-items: center; gap: 7px;
          transition: gap .25s, color .25s;
        }
        .sl-feat-card__link:hover { color: ${MAROON}; gap: 11px; }

        .sl-feat__cta { text-align: center; margin-top: 50px; }

        @media (max-width: 380px) { .sl-feat { padding: 56px 0 52px; } }
      `}</style>

      <section className="sl-feat">
        <div className="container">
          {/* Header */}
          <div className="sl-feat__header" data-aos="fade-up" data-aos-duration="700">
            <div className="sl-feat__script">{L.script}</div>
            <h2 className="sl-feat__title">{L.title}</h2>
            <p className="sl-feat__sub">{L.subtitle}</p>
          </div>

          {/* 6-card grid — 3 per row */}
          <div className="row g-4">
            {L.boxes.map((box, i) => (
              <div
                key={i}
                className="col-lg-4 col-md-6"
                data-aos="fade-up"
                data-aos-delay={(i % 3) * 90}
                data-aos-duration="700"
              >
                <div className="sl-feat-card">
                  <span className="sl-feat-card__corner" aria-hidden="true" />
                  <div className="sl-feat-card__icon">
                    <i className={`isax ${meta[i].icon}`} />
                  </div>
                  <h3 className="sl-feat-card__title">{box.title}</h3>
                  <p className="sl-feat-card__desc">{box.desc}</p>
                  <Link to={meta[i].to} className="sl-feat-card__link">
                    {box.link}
                    <i className={`isax ${isRtl ? 'isax-arrow-left-2' : 'isax-arrow-right-1'}`} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="sl-feat__cta" data-aos="fade-up" data-aos-delay="150" data-aos-duration="700">
            <Link to={route.courseList} className="sl-btn-gold sl-btn-magnetic">
              {L.cta} <i className={`isax ${isRtl ? 'isax-arrow-left-2' : 'isax-arrow-right-1'}`} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default WhyChooseUs
