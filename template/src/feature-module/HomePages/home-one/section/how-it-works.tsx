import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import { useTranslation } from 'react-i18next'

const Howitworks = () => {
    const { i18n } = useTranslation()
    const route = all_routes
    const isRtl = i18n.language === 'ar'

    // ── Bilingual content (AR / EN) ──────────────────────────────────────────
    const content = {
        en: {
            ornament: 'Your Journey',
            title: 'How Your Journey Begins with SARALÖWE',
            subtitle: 'From passion to creativity, and from learning to excellence — SARALÖWE Academy is designed to accompany you at every stage of your professional journey.',
            cta: 'Start Learning Today',
            steps: [
                { num: '01', icon: 'isax isax-user-add',   title: 'Join the Academy',           text: 'Create your account in minutes and choose the membership that fits your goals and learning ambitions.' },
                { num: '02', icon: 'isax isax-discover-1', title: 'Explore the World of Learning', text: 'Browse courses, masterclasses, and learning resources designed to help you build your skills step by step.' },
                { num: '03', icon: 'isax isax-video-play', title: 'Learn & Apply',               text: 'Watch the lessons, complete hands-on projects, and share your work to receive feedback and guidance from experts and the community.' },
                { num: '04', icon: 'isax isax-medal-star', title: 'Achieve Your Milestones',     text: 'Complete courses, collect badges, and earn certificates that reflect your progress and level within the academy.' },
                { num: '05', icon: 'isax isax-teacher',    title: 'Join the Elite Instructors',  text: 'Are you a chef, trainer, or expert in patisserie and cake art? Apply for an instructor account and join the Elite Instructors network to offer your courses and masterclasses and reach thousands of students worldwide.', highlight: true },
            ],
            ad: {
                aria: 'Become an Elite Instructor at SARALÖWE Academy',
                phrases: ['For Experts & Creators', 'Would you like to teach with us?', 'Join the Elite Instructors program', 'Apply to Join →'],
            },
        },
        ar: {
            ornament: 'رحلتك التعليمية',
            title: 'كيف تبدأ رحلتك مع SARALÖWE',
            subtitle: 'من الشغف إلى الإبداع، ومن التعلم إلى التميز، صُممت أكاديمية SARALÖWE لترافقك في كل مرحلة من رحلتك المهنية.',
            cta: 'ابدأ التعلم اليوم',
            steps: [
                { num: '01', icon: 'isax isax-user-add',   title: 'انضم إلى الأكاديمية',      text: 'أنشئ حسابك في دقائق واختر العضوية التي تناسب أهدافك وطموحاتك التعليمية.' },
                { num: '02', icon: 'isax isax-discover-1', title: 'استكشف عالم التعلم',       text: 'تصفح الدورات، الماستر كلاس، والموارد التعليمية المصممة لمساعدتك على تطوير مهاراتك خطوة بخطوة.' },
                { num: '03', icon: 'isax isax-video-play', title: 'تعلّم وطبّق',               text: 'شاهد الدروس، نفّذ المشاريع العملية، وشارك أعمالك للحصول على الملاحظات والتوجيهات من الخبراء والمجتمع.' },
                { num: '04', icon: 'isax isax-medal-star', title: 'حقّق إنجازاتك',            text: 'أكمل الدورات، اجمع الشارات، واحصل على شهادات تعكس تقدمك ومستواك داخل الأكاديمية.' },
                { num: '05', icon: 'isax isax-teacher',    title: 'انضم إلى نخبة المدربين',   text: 'هل أنت شيف، مدرب، أو خبير في مجال الباتيسري وفنون الكيك؟ يمكنك التقديم للحصول على حساب مدرب والانضمام إلى شبكة Elite Instructors لتقديم دوراتك وماستر كلاسك والوصول إلى آلاف الطلاب حول العالم.', highlight: true },
            ],
            ad: {
                aria: 'انضم إلى نخبة المدربين في أكاديمية SARALÖWE',
                phrases: ['للخبراء وصنّاع الإبداع', 'هل ترغب في التدريس معنا؟', 'انضم إلى برنامج Elite Instructors', 'قدّم طلب الانضمام →'],
            },
        },
    }

    const L = content[isRtl ? 'ar' : 'en']

    return (
        <>
        <style>{`
          /* ── How-It-Works RTL overrides ─────────────────── */
          [dir="rtl"] .sl-hiw-corner-tl {
            left: auto !important;
            right: -10px !important;
            border-left: none !important;
            border-right: 2px solid var(--sl-gold) !important;
          }
          [dir="rtl"] .sl-hiw-corner-br {
            right: auto !important;
            left: -10px !important;
            border-right: none !important;
            border-left: 2px solid var(--sl-gold) !important;
          }
          @media (max-width: 576px) {
            .sl-process .sl-section__header h2 { font-size: clamp(1.6rem, 7vw, 2.4rem) !important; }
          }

          /* ── Step rows ──────────────────────────────────── */
          .sl-hiw-step { display: flex; align-items: flex-start; gap: 1.25rem; }
          .sl-hiw-step__num {
            width: 52px; height: 52px; flex-shrink: 0; border-radius: 50%;
            background: rgba(197,145,44,0.12);
            border: 1px solid rgba(197,145,44,0.35);
            display: flex; align-items: center; justify-content: center; flex-direction: column;
            transition: background .35s ease, border-color .35s ease, transform .35s ease;
          }
          .sl-hiw-step__num i { font-size: 1.15rem; color: var(--sl-gold); }
          .sl-hiw-step:hover .sl-hiw-step__num { background: rgba(197,145,44,0.22); transform: translateY(-3px); }
          .sl-hiw-step--elite .sl-hiw-step__num {
            background: linear-gradient(135deg, var(--sl-gold), #E0C56E);
            border-color: var(--sl-gold);
            box-shadow: 0 10px 26px rgba(197,145,44,0.35);
          }
          .sl-hiw-step--elite .sl-hiw-step__num i { color: #2A0E18; }
          .sl-hiw-tag {
            display: inline-block; margin-${isRtl ? 'right' : 'left'}: 0.6rem;
            font-family: var(--sl-font-body); font-size: 0.58rem; font-weight: 700;
            letter-spacing: 0.14em; text-transform: uppercase;
            color: #2A0E18; background: var(--sl-gold);
            padding: 0.16rem 0.5rem; border-radius: 999px; vertical-align: middle;
          }
          .sl-hiw-step__cta {
            display: inline-flex; align-items: center; gap: 6px;
            margin-top: 0.55rem; color: var(--sl-gold);
            font-family: var(--sl-font-body); font-size: 0.76rem; font-weight: 700;
            letter-spacing: 0.04em; text-decoration: none;
            transition: gap .25s ease, color .25s ease;
          }
          .sl-hiw-step__cta:hover { gap: 11px; color: #E0C56E; }

          /* ── Scrolling advertisement banner (Elite Instructors) ── */
          .sl-ticker {
            position: relative; display: block; overflow: hidden; text-decoration: none;
            background: linear-gradient(90deg, #C9A84C 0%, #E6CE7E 50%, #C9A84C 100%);
            border-top: 1px solid rgba(42,14,24,0.18);
            border-bottom: 1px solid rgba(42,14,24,0.18);
          }
          .sl-ticker::before, .sl-ticker::after {
            content: ''; position: absolute; top: 0; bottom: 0; width: 90px; z-index: 2; pointer-events: none;
          }
          .sl-ticker::before { left: 0;  background: linear-gradient(90deg, #C9A84C, transparent); }
          .sl-ticker::after  { right: 0; background: linear-gradient(270deg, #C9A84C, transparent); }
          .sl-ticker__track {
            display: flex; width: max-content; will-change: transform;
            animation: sl-ticker-scroll 40s linear infinite;
          }
          .sl-ticker:hover .sl-ticker__track { animation-play-state: paused; }
          .sl-ticker__unit { display: inline-flex; align-items: center; padding: 0.95rem 0; white-space: nowrap; }
          .sl-ticker__phrase {
            font-family: var(--sl-font-display); font-size: 0.95rem; font-weight: 600;
            letter-spacing: 0.03em; color: #2A0E18; padding: 0 1.3rem;
          }
          .sl-ticker__phrase--cta { color: #6B1D2A; font-weight: 800; }
          .sl-ticker__sep { color: #6B1D2A; opacity: 0.55; font-size: 0.7rem; }
          @keyframes sl-ticker-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .sl-ticker__track { animation: none; }
          }
        `}</style>

        <section className="sl-section sl-process">
            <div className="container">
                <div className="row align-items-center g-5">

                    {/* ── Left: steps ── */}
                    <div className="col-lg-6">
                        <div className="sl-section__header" data-aos="fade-right" data-aos-duration="900">
                            <div className="sl-ornament sl-ornament--left">
                                <span className="sl-script" style={{ fontSize: '1.8rem', color: 'var(--sl-gold)' }}>
                                    {L.ornament}
                                </span>
                            </div>
                            <h2 className="light" style={{ marginTop: '0.5rem' }}>{L.title}</h2>
                            <p className="light">{L.subtitle}</p>
                        </div>

                        <div className="mt-4">
                            {L.steps.map((s, i) => {
                                const last = i === L.steps.length - 1
                                return (
                                    <div
                                        key={i}
                                        className={`sl-hiw-step${s.highlight ? ' sl-hiw-step--elite' : ''}`}
                                        data-aos="fade-right"
                                        data-aos-delay={i * 100}
                                        data-aos-duration="700"
                                        style={{
                                            paddingBottom: last ? 0 : '1.75rem',
                                            marginBottom: last ? 0 : '1.75rem',
                                            borderBottom: last ? 'none' : '1px solid rgba(197,145,44,0.12)',
                                        }}
                                    >
                                        {/* Step number / icon circle */}
                                        <div className="sl-hiw-step__num">
                                            <i className={s.icon} />
                                        </div>

                                        <div>
                                            <h6 style={{
                                                fontFamily: 'var(--sl-font-display)',
                                                fontSize: '1rem', fontWeight: 600,
                                                color: s.highlight ? 'var(--sl-gold)' : 'var(--sl-blush)',
                                                marginBottom: '0.35rem',
                                            }}>
                                                <span style={{ opacity: 0.55, fontSize: '0.78rem', marginInlineEnd: '0.5rem' }}>{s.num}</span>
                                                {s.title}
                                                {s.highlight && <span className="sl-hiw-tag">Elite</span>}
                                            </h6>
                                            <p style={{
                                                fontFamily: 'var(--sl-font-body)',
                                                fontSize: '0.82rem', lineHeight: 1.7,
                                                color: 'rgba(245,218,223,0.55)', margin: 0,
                                            }}>
                                                {s.text}
                                            </p>
                                            {(s as any).ctaLabel && (
                                                <Link to={route.becomeAnInstructor} className="sl-hiw-step__cta">
                                                    {(s as any).ctaLabel}
                                                    <i className={`isax ${isRtl ? 'isax-arrow-left-2' : 'isax-arrow-right-1'}`} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-5" data-aos="fade-up" data-aos-delay="400" data-aos-duration="700">
                            <Link to={route.register} className="sl-btn-gold">
                                {L.cta} <i className={`isax ${isRtl ? 'isax-arrow-left-2' : 'isax-arrow-right-1'}`} />
                            </Link>
                        </div>
                    </div>

                    {/* ── Right: couture cake atmosphere ── */}
                    <div
                        className="col-lg-6 d-none d-lg-flex justify-content-center"
                        data-aos="fade-left"
                        data-aos-duration="1000"
                        data-aos-delay="150"
                    >
                        <div style={{ position: 'relative', maxWidth: 460, width: '100%' }}>
                            <div className="sl-hiw-corner-tl" style={{
                                position: 'absolute', top: -10, left: -10, width: 28, height: 28,
                                borderTop: '2px solid var(--sl-gold)', borderLeft: '2px solid var(--sl-gold)',
                                opacity: 0.6, zIndex: 2,
                            }} />
                            <div className="sl-hiw-corner-br" style={{
                                position: 'absolute', bottom: -10, right: -10, width: 28, height: 28,
                                borderBottom: '2px solid var(--sl-gold)', borderRight: '2px solid var(--sl-gold)',
                                opacity: 0.6, zIndex: 2,
                            }} />
                            <img
                                src={`${process.env.PUBLIC_URL}/assets/img/cake/11.png`}
                                alt={isRtl ? 'أكاديمية SARALÖWE — فن الباتيسري' : 'SARALÖWE Academy — Couture Pastry'}
                                style={{ width: '100%', display: 'block', filter: 'brightness(0.96) contrast(1.04)' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `${process.env.PUBLIC_URL}/assets/img/cake/12.png`
                                }}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>

        {/* ── Elite Instructors — scrolling advertisement banner (full-width) ── */}
        <Link to={route.becomeAnInstructor} className="sl-ticker" aria-label={L.ad.aria}>
            <div className="sl-ticker__track" dir="ltr">
                {Array.from({ length: 8 }).map((_, u) => (
                    <span className="sl-ticker__unit" key={u} aria-hidden={u > 0}>
                        {L.ad.phrases.map((p, k) => (
                            <React.Fragment key={k}>
                                <span className={`sl-ticker__phrase${k === L.ad.phrases.length - 1 ? ' sl-ticker__phrase--cta' : ''}`}>
                                    {p}
                                </span>
                                <span className="sl-ticker__sep">✦</span>
                            </React.Fragment>
                        ))}
                    </span>
                ))}
            </div>
        </Link>
        </>
    )
}

export default Howitworks
