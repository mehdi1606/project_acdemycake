import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'

const steps = [
    {
        num: '01',
        icon: 'isax isax-user-add',
        title: 'Create Your Account',
        text: 'Sign up in under a minute. Choose the plan that suits you and unlock instant access to our full course library.',
    },
    {
        num: '02',
        icon: 'isax isax-book-1',
        title: 'Choose Your Programme',
        text: 'Browse disciplines — from sculpted fondant to sugar flowers and isomalt art. Filter by level, duration, or instructor.',
    },
    {
        num: '03',
        icon: 'isax isax-video-play',
        title: 'Learn & Create',
        text: 'Follow step-by-step video lessons, download technique sheets, and submit your creations for expert feedback.',
    },
    {
        num: '04',
        icon: 'isax isax-medal-star',
        title: 'Earn Your Certificate',
        text: 'Complete all modules and assessments to receive your industry-recognised SARALÖWE Academy certificate.',
    },
]

const Howitworks = () => {
    const route = all_routes
    return (
        <section className="sl-section sl-process">
            <div className="container">
                <div className="row align-items-center g-5">

                    {/* ── Left: steps ── */}
                    <div className="col-lg-6">
                        <div
                            className="sl-section__header"
                            data-aos="fade-right"
                            data-aos-duration="900"
                        >
                            <div className="sl-ornament sl-ornament--left">
                                <span
                                    className="sl-script"
                                    style={{ fontSize: '1.8rem', color: 'var(--sl-gold)' }}
                                >
                                    Your journey
                                </span>
                            </div>
                            <h2 className="light" style={{ marginTop: '0.5rem' }}>From Curious to Couture</h2>
                            <p className="light">
                                Four simple steps stand between you and a world-class cake design education.
                            </p>
                        </div>

                        <div className="mt-4">
                            {steps.map((s, i) => (
                                <div
                                    key={i}
                                    data-aos="fade-right"
                                    data-aos-delay={i * 100}
                                    data-aos-duration="700"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1.25rem',
                                        paddingBottom: i < steps.length - 1 ? '1.75rem' : 0,
                                        marginBottom: i < steps.length - 1 ? '1.75rem' : 0,
                                        borderBottom: i < steps.length - 1 ? '1px solid rgba(197,145,44,0.12)' : 'none',
                                    }}
                                >
                                    {/* Step number circle */}
                                    <div style={{
                                        width: 52, height: 52, flexShrink: 0,
                                        borderRadius: '50%',
                                        background: 'rgba(197,145,44,0.12)',
                                        border: '1px solid rgba(197,145,44,0.35)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexDirection: 'column',
                                    }}>
                                        <span style={{
                                            fontFamily: 'var(--sl-font-display)',
                                            fontSize: '0.65rem',
                                            color: 'var(--sl-gold)',
                                            lineHeight: 1,
                                            fontWeight: 700,
                                        }}>
                                            {s.num}
                                        </span>
                                    </div>

                                    <div>
                                        <h6 style={{
                                            fontFamily: 'var(--sl-font-display)',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'var(--sl-blush)',
                                            marginBottom: '0.35rem',
                                        }}>
                                            {s.title}
                                        </h6>
                                        <p style={{
                                            fontFamily: 'var(--sl-font-body)',
                                            fontSize: '0.82rem',
                                            lineHeight: 1.7,
                                            color: 'rgba(245,218,223,0.55)',
                                            margin: 0,
                                        }}>
                                            {s.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            className="mt-5"
                            data-aos="fade-up"
                            data-aos-delay="400"
                            data-aos-duration="700"
                        >
                            <Link to={route.register} className="sl-btn-gold">
                                Start Learning Today <i className="isax isax-arrow-right-1" />
                            </Link>
                        </div>
                    </div>

                    {/* ── Right: brand storefront / atmosphere ── */}
                    <div
                        className="col-lg-6 d-none d-lg-flex justify-content-center"
                        data-aos="fade-left"
                        data-aos-duration="1000"
                        data-aos-delay="150"
                    >
                        <div style={{ position: 'relative', maxWidth: 460, width: '100%' }}>
                            {/* Corner accent top-left */}
                            <div style={{
                                position: 'absolute', top: -10, left: -10,
                                width: 28, height: 28,
                                borderTop: '2px solid var(--sl-gold)',
                                borderLeft: '2px solid var(--sl-gold)',
                                opacity: 0.6,
                                zIndex: 2,
                            }} />
                            {/* Corner accent bottom-right */}
                            <div style={{
                                position: 'absolute', bottom: -10, right: -10,
                                width: 28, height: 28,
                                borderBottom: '2px solid var(--sl-gold)',
                                borderRight: '2px solid var(--sl-gold)',
                                opacity: 0.6,
                                zIndex: 2,
                            }} />

                            {/* Primary: storefront */}
                            <img
                                src={`${process.env.PUBLIC_URL}/assets/img/Mockups/003.jpg`}
                                alt="SARALÖWE Academy — Couture Pastry"
                                style={{
                                    width: '100%',
                                    display: 'block',
                                    filter: 'brightness(0.92) contrast(1.05)',
                                }}
                                onError={(e) => {
                                    // Fallback to another mockup
                                    (e.target as HTMLImageElement).src =
                                        `${process.env.PUBLIC_URL}/assets/img/Mockups/004.jpg`
                                }}
                            />

                            {/* Floating ribbon detail */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -20,
                                    left: -20,
                                    width: 130,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid rgba(197,145,44,0.35)',
                                    boxShadow: '0 8px 28px rgba(74,20,37,0.5)',
                                    zIndex: 3,
                                }}
                                data-aos="zoom-in"
                                data-aos-delay="600"
                                data-aos-duration="600"
                            >
                                <img
                                    src={`${process.env.PUBLIC_URL}/assets/img/Mockups/007.jpg`}
                                    alt=""
                                    style={{ width: '100%', display: 'block' }}
                                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default Howitworks
