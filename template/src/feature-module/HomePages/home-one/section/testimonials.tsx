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

const Testimonials = () => {
    const { t } = useTranslation();

    const testimonials = [
        {
            text: t('home.testimonials.t1.text', 'SARALÖWE transformed how I approach cake design. The isomalt module alone is worth every penny — I landed my first luxury wedding contract three weeks after completing it.'),
            name: 'Amelia Fontaine',
            role: t('home.testimonials.t1.role', 'Pastry Artist · Paris'),
            avatar: null,
            initials: 'AF',
            dark: false,
        },
        {
            text: t('home.testimonials.t2.text', "The video quality and step-by-step guidance are unlike anything I've seen on other platforms. My instructors responded to feedback within hours. Absolutely world-class."),
            name: 'Yuki Nakashima',
            role: t('home.testimonials.t2.role', 'Cake Designer · Tokyo'),
            avatar: null,
            initials: 'YN',
            dark: true,
        },
        {
            text: t('home.testimonials.t3.text', "I was a complete beginner. Eighteen months later I'm running a boutique cake studio. SARALÖWE gave me the confidence, the skills, and the certificate to make it real."),
            name: 'Isabela Moreno',
            role: t('home.testimonials.t3.role', 'Studio Owner · Madrid'),
            avatar: null,
            initials: 'IM',
            dark: false,
        },
        {
            text: t('home.testimonials.t4.text', 'The sugar flower programme is extraordinarily detailed. Every petal, every shade, every tool — explained with the patience of a true master. This is couture education.'),
            name: 'Charlotte Reed',
            role: t('home.testimonials.t4.role', 'Floral Sugar Artist · London'),
            avatar: null,
            initials: 'CR',
            dark: false,
        },
    ]
    const sliderSettings = {
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: true,
        autoplay: true,
        autoplaySpeed: 5500,
        pauseOnHover: true,
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
                backgroundColor: 'var(--sl-blush)',
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
                        <span className="sl-script" style={{ fontSize: '1.8rem' }}>{t('home.testimonials.ornament', 'Voices')}</span>
                    </div>
                    <h2 style={{ marginTop: '0.5rem' }}>{t('home.testimonials.title', 'What Our Students Say')}</h2>
                    <p>
                        {t('home.testimonials.subtitle', 'Real stories from pastry artists who turned their passion into a career with SARALÖWE Academy.')}
                    </p>
                </div>

                {/* Slider */}
                <div className="sl-slider-wrap" data-aos="fade-up" data-aos-delay="100" data-aos-duration="900">
                    <Slider {...sliderSettings}>
                        {testimonials.map((testimonial, i) => (
                            <div key={i} className="px-2">
                                <div className={`sl-testimonial-card${testimonial.dark ? ' sl-testimonial-card--dark' : ''}`}>
                                    <div className="sl-testimonial-card__quote">"</div>
                                    <p className="sl-testimonial-card__text">{testimonial.text}</p>
                                    <div className="sl-testimonial-card__footer">
                                        {/* Avatar initials circle */}
                                        <div className="sl-testimonial-card__avatar" style={{
                                            background: testimonial.dark ? 'rgba(197,145,44,0.2)' : 'rgba(101,28,50,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span style={{
                                                fontFamily: 'var(--sl-font-display)',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                color: testimonial.dark ? 'var(--sl-gold)' : 'var(--sl-burgundy)',
                                            }}>
                                                {testimonial.initials}
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
                        ))}
                    </Slider>
                </div>

                {/* Trust stats below testimonials */}
                <div
                    className="row g-4 mt-5 justify-content-center"
                    data-aos="fade-up"
                    data-aos-delay="200"
                    data-aos-duration="800"
                >
                    {[
                        { value: '98%', label: t('home.testimonials.stat1', 'Student satisfaction') },
                        { value: '4.9★', label: t('home.testimonials.stat2', 'Average course rating') },
                        { value: '50+', label: t('home.testimonials.stat3', 'Countries represented') },
                    ].map((stat, i) => (
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
