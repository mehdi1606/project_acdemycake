import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'

const benefits = [
    {
        icon: 'isax isax-book-1',
        accent: 'burgundy',
        title: 'Learn at Your Pace',
        text: 'Access every lesson on-demand, revisit techniques as often as you need, and progress through modules whenever your schedule allows — no deadlines, no pressure.',
        link: 'Explore programmes',
        delay: 0,
    },
    {
        icon: 'isax isax-medal-star',
        accent: 'gold',
        title: 'Accredited Certificates',
        text: 'Earn certificates recognised by luxury hospitality brands and patisseries worldwide. Showcase your credentials with a digital badge you can share anywhere.',
        link: 'See certificates',
        delay: 150,
    },
    {
        icon: 'isax isax-profile-2user',
        accent: 'forest',
        title: 'Expert-Led Mentorship',
        text: 'Our instructors are award-winning pastry artists with decades of couture experience. Receive personalised feedback on every project submission.',
        link: 'Meet instructors',
        delay: 300,
    },
]

const Benefits = () => {
    const route = all_routes
    return (
        <section className="sl-section sl-section--ivory">
            <div className="container">

                {/* ── Split layout: text header + certificate visual ── */}
                <div className="row align-items-center mb-5 g-5">
                    <div className="col-lg-6" data-aos="fade-right" data-aos-duration="900">
                        <div className="sl-section__header">
                            <div className="sl-ornament sl-ornament--left">
                                <span className="sl-script" style={{ fontSize: '1.8rem' }}>Why us</span>
                            </div>
                            <h2 style={{ marginTop: '0.5rem' }}>Crafted for Aspiring Pastry Artists</h2>
                            <p>
                                Everything you need to go from curious beginner to confident cake
                                couturier — all in one beautifully designed academy.
                            </p>
                            <Link to={route.courseList} className="sl-btn-dark" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                                Start Learning <i className="isax isax-arrow-right-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Certificate mockup */}
                    <div
                        className="col-lg-6 d-flex justify-content-center"
                        data-aos="fade-left"
                        data-aos-duration="900"
                        data-aos-delay="100"
                    >
                        <div style={{ position: 'relative', maxWidth: 420, width: '100%' }}>
                            {/* Outer gold frame */}
                            <div style={{
                                position: 'absolute', inset: '-10px',
                                border: '1px solid rgba(197,145,44,0.22)',
                                pointerEvents: 'none',
                            }} />

                            <img
                                src={`${process.env.PUBLIC_URL}/assets/img/Mockups/002.jpg`}
                                alt="SARALÖWE Academy Certificate"
                                style={{
                                    width: '100%',
                                    display: 'block',
                                    boxShadow: '0 24px 64px rgba(101,28,50,0.18)',
                                }}
                                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                            />

                            {/* "Award-winning" badge */}
                            <div style={{
                                position: 'absolute', bottom: -18, right: -18,
                                background: 'var(--sl-burgundy)',
                                color: 'var(--sl-blush)',
                                fontFamily: 'var(--sl-font-body)',
                                fontSize: '0.58rem',
                                fontWeight: 700,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                padding: '0.65rem 1.1rem',
                                zIndex: 2,
                                boxShadow: '0 8px 24px rgba(101,28,50,0.3)',
                            }}>
                                Industry Recognised ✦
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Three benefit cards ── */}
                <div className="row g-4">
                    {benefits.map((b, i) => (
                        <div key={i} className="col-lg-4 col-md-6">
                            <div
                                className={`sl-benefit-card sl-benefit-card--${b.accent}`}
                                data-aos="fade-up"
                                data-aos-delay={b.delay}
                                data-aos-duration="800"
                            >
                                <div className={`sl-benefit-card__icon sl-benefit-card__icon--${b.accent}`}>
                                    <i className={b.icon} />
                                </div>
                                <div className="sl-benefit-card__title">{b.title}</div>
                                <div className="sl-benefit-card__divider" />
                                <p className="sl-benefit-card__text">{b.text}</p>
                                <Link to={route.courseList} className="sl-benefit-card__link">
                                    {b.link} <i className="isax isax-arrow-right-1" style={{ fontSize: '0.65rem' }} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}

export default Benefits
