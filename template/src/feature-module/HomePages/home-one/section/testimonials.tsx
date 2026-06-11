/**
 * Testimonials — SARALÖWE Academy
 * "What Our Students Say" — real student voices, presented in an auto-playing
 * carousel. Bilingual (AR/EN), RTL-aware slider.
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const Stars = () => (
    <div className="sl-testimonial-card__stars">
        {[1, 2, 3, 4, 5].map(i => (
            <i key={i} className="fa-solid fa-star" style={{ marginRight: '2px' }} />
        ))}
    </div>
)

// First letters of the first two name-parts (works for AR & EN)
const initialsOf = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('')

const Testimonials = () => {
    const { i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    const content = {
        en: {
            ornament: 'Voices',
            title: 'What Our Students Say',
            subtitle: 'Real stories from cake designers and pastry artists who developed their craft with SARALÖWE Academy.',
            stats: [
                { value: '98%',  label: 'Student satisfaction' },
                { value: '4.9★', label: 'Average course rating' },
                { value: '50+',  label: 'Countries represented' },
            ],
            list: [
                { name: 'Nahla Bouchaib',        role: 'Cake Designer · Morocco',            text: 'When you learn with Chef Sara, you immediately feel she has a genuine scientific background. She doesn’t just explain the steps — she explains the reasons behind every technique, which makes learning deeper and far easier to apply.' },
                { name: 'Hajar Mansouri',        role: 'Pastry Business Owner · Morocco',     text: 'For the first time I feel I truly understand what I’m doing. Every lesson is full of precise information and details that give you the confidence to develop your own recipes and your own business.' },
                { name: 'Aya Ben Omar',          role: 'Cake Designer · Tunisia',            text: 'What sets SARALÖWE Academy apart is its level of professionalism and organisation. The content is rich, clear, and reflects long years of real expertise in the field.' },
                { name: 'Rim Al-Zahrani',        role: 'Cake Artist · Saudi Arabia',         text: 'I had followed Chef Sara’s work for years, but learning with her revealed secrets and techniques I hadn’t found anywhere else. An experience worth every minute.' },
                { name: 'Mariam El-Kettani',     role: 'Patisserie Student · Morocco',        text: 'What impressed me most is that Chef Sara doesn’t just pass on knowledge — she passes on the professional way of thinking behind every successful project.' },
                { name: 'Iman Abdullah',         role: 'Cake Designer · UAE',                 text: 'Between art, science, and attention to detail, I found in SARALÖWE what I had been looking for for years. Refined content that rivals the best international academies.' },
                { name: 'Nour El-Houda Bensalem',role: 'Artistic Cake Specialist · Algeria',  text: 'The quality of the lessons, the organisation, and the guidance made me feel as if I were receiving personal training. A professional learning experience in every sense.' },
                { name: 'Asmaa El-Alaoui',       role: 'Home Pastry Business Owner · Morocco', text: 'What I loved most is the blend of the artistic and the scientific side. I no longer just follow recipes — I now understand why they work and how to improve them.' },
            ],
        },
        ar: {
            ornament: 'آراء',
            title: 'ماذا تقول طالباتنا',
            subtitle: 'قصص حقيقية من مصممات كيك وفنانات باتيسري طوّرن مهاراتهن مع أكاديمية SARALÖWE.',
            stats: [
                { value: '98%',  label: 'رضا الطالبات' },
                { value: '4.9★', label: 'متوسط تقييم الدورات' },
                { value: '50+',  label: 'دولة حول العالم' },
            ],
            list: [
                { name: 'نهلة بوشعيب',     role: 'مصممة كيك – المغرب',              text: 'عندما تتعلم مع الشيف سارة، تشعر فوراً أنها تمتلك خلفية علمية حقيقية. فهي لا تشرح الخطوات فقط، بل تشرح الأسباب وراء كل تقنية، مما يجعل التعلم أعمق وأسهل في التطبيق.' },
                { name: 'هاجر منصوري',     role: 'صاحبة مشروع حلويات – المغرب',      text: 'لأول مرة أشعر أنني أفهم ما أفعله فعلاً. كل درس مليء بالمعلومات الدقيقة والتفاصيل التي تمنحك الثقة لتطوير وصفاتك وأعمالك بنفسك.' },
                { name: 'آية بن عمر',       role: 'مصممة كيك – تونس',                text: 'ما يميز أكاديمية SARALÖWE هو مستوى الاحترافية والتنظيم. المحتوى غني، واضح، ويعكس سنوات طويلة من الخبرة والتجربة في المجال.' },
                { name: 'ريم الزهراني',     role: 'فنانة كيك – السعودية',            text: 'كنت أتابع أعمال الشيف سارة منذ سنوات، لكن التعلم معها كشف لي أسراراً وتقنيات لم أجدها في أي مكان آخر. تجربة تستحق كل دقيقة.' },
                { name: 'مريم الكتاني',     role: 'طالبة باتيسري – المغرب',          text: 'أكثر ما أعجبني هو أن الشيف سارة لا تنقل المعرفة فقط، بل تنقل طريقة التفكير الاحترافية التي تقف وراء كل مشروع ناجح.' },
                { name: 'إيمان عبد الله',   role: 'مصممة كيك – الإمارات',            text: 'بين الفن، العلم، والدقة في التفاصيل، وجدت في SARALÖWE ما كنت أبحث عنه منذ سنوات. محتوى راقٍ يوازي أفضل الأكاديميات العالمية.' },
                { name: 'نور الهدى بنسالم', role: 'متخصصة في الكيك الفني – الجزائر', text: 'جودة الدروس والتنظيم والإرشادات جعلتني أشعر وكأنني أتلقى تدريباً شخصياً. تجربة تعليمية احترافية بكل معنى الكلمة.' },
                { name: 'أسماء العلوي',     role: 'صاحبة مشروع حلويات منزلية – المغرب', text: 'أكثر ما أعجبني هو الجمع بين الجانب الفني والجانب العلمي. لم أعد أطبق الوصفات فقط، بل أصبحت أفهم أسباب نجاحها وكيفية تطويرها.' },
            ],
        },
    }

    const L = content[isRtl ? 'ar' : 'en']

    const sliderSettings = {
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: true,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 5500,
        pauseOnHover: true,
        rtl: isRtl,
        responsive: [
            { breakpoint: 1100, settings: { slidesToShow: 2, slidesToScroll: 1 } },
            { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1 } },
        ],
    }

    return (
        <section
            className="sl-section"
            style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'var(--sl-ivory)',
            }}
        >
            {/* ── Atmospheric background image — luxury satin ribbon ── */}
            <div
                style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/img/Mockups/009.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.06,
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* ── Decorative graphic overlay ── */}
            <img
                src={`${process.env.PUBLIC_URL}/assets/img/Graphics/Graphics Elements-17.svg`}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute', bottom: 0, right: '5%',
                    width: '280px', opacity: 0.06,
                    pointerEvents: 'none', zIndex: 0,
                }}
            />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div
                    className="sl-section__header center"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <div className="sl-ornament justify-content-center">
                        <span className="sl-script" style={{ fontSize: '1.8rem' }}>{L.ornament}</span>
                    </div>
                    <h2 style={{ marginTop: '0.5rem' }}>{L.title}</h2>
                    <p>{L.subtitle}</p>
                </div>

                {/* Slider */}
                <div className="sl-slider-wrap" data-aos="fade-up" data-aos-delay="100" data-aos-duration="900">
                    <Slider {...sliderSettings}>
                        {L.list.map((testimonial, i) => {
                            const dark = i % 3 === 1
                            return (
                                <div key={i} className="px-2">
                                    <div className={`sl-testimonial-card${dark ? ' sl-testimonial-card--dark' : ''}`} style={{ height: '100%' }}>
                                        <div className="sl-testimonial-card__quote">"</div>
                                        <p className="sl-testimonial-card__text">{testimonial.text}</p>
                                        <div className="sl-testimonial-card__footer">
                                            {/* Avatar initials circle */}
                                            <div className="sl-testimonial-card__avatar" style={{
                                                background: dark ? 'rgba(197,145,44,0.2)' : 'rgba(101,28,50,0.12)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span style={{
                                                    fontFamily: 'var(--sl-font-display)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    color: dark ? 'var(--sl-gold)' : 'var(--sl-burgundy)',
                                                }}>
                                                    {initialsOf(testimonial.name)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="sl-testimonial-card__name">{testimonial.name}</div>
                                                <div className="sl-testimonial-card__role">{testimonial.role}</div>
                                            </div>
                                            <Stars />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </Slider>
                </div>

                {/* Trust stats below testimonials */}
                <div
                    className="row g-4 mt-5 justify-content-center"
                    data-aos="fade-up"
                    data-aos-delay="200"
                    data-aos-duration="800"
                >
                    {L.stats.map((stat, i) => (
                        <div key={i} className="col-auto text-center">
                            <div style={{
                                fontFamily: 'var(--sl-font-display)',
                                fontSize: '2.4rem',
                                fontWeight: 700,
                                color: 'var(--sl-burgundy)',
                                lineHeight: 1,
                            }}>
                                {stat.value}
                            </div>
                            <div style={{
                                fontFamily: 'var(--sl-font-body)',
                                fontSize: '0.62rem',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: 'rgba(101,28,50,0.5)',
                                marginTop: '0.4rem',
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}

export default Testimonials
