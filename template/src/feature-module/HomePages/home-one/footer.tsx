import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'

const Footer = () => {
    const { t } = useTranslation()
    const route = all_routes

    return (
        <footer className="sl-footer" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Decorative toile cover as ultra-faint footer bg */}
            <div
                style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/img/cover/A5 cover.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    opacity: 0.03,
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div className="row row-gap-5">

                    {/* ── Brand column ── */}
                    <div className="col-lg-4">
                        {/* SVG Logo — gold on dark */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
                            <img
                                src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                                alt="SARALÖWE Academy"
                                style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <div>
                                <div className="sl-footer__brand-name">SARALÖWE</div>
                                <div className="sl-footer__brand-sub">Academy of Couture Pastry Design</div>
                            </div>
                        </div>

                        <div className="sl-footer__divider" />

                        <p className="sl-footer__description">
                            {t('footer.descriptionLong', "The world's premier online destination for luxury cake design education. Expert-led programmes, industry-recognised certificates, and a global community of passionate pastry artists.")}
                        </p>
                        <div className="sl-footer__tagline">l'art du gâteau</div>

                        <div className="sl-footer__social">
                            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
                            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                            <a href="#" aria-label="Pinterest"><i className="fa-brands fa-pinterest-p" /></a>
                            <a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
                            <a href="#" aria-label="TikTok"><i className="fa-brands fa-tiktok" /></a>
                        </div>
                    </div>

                    {/* ── Links columns ── */}
                    <div className="col-lg-5">
                        <div className="row row-gap-4">
                            <div className="col-6 col-md-4">
                                <div className="sl-footer__heading">{t('footer.learn', 'Learn')}</div>
                                <ul className="sl-footer__links">
                                    <li><Link to={route.courseList}>{t('footer.allCourses', 'All Courses')}</Link></li>
                                    <li><Link to={route.masterclass}>{t('footer.masterclasses', 'Masterclasses')}</Link></li>
                                    <li><Link to={route.instructorList}>{t('footer.instructors', 'Instructors')}</Link></li>
                                    <li><Link to={route.pricingPlan}>{t('footer.pricing', 'Pricing')}</Link></li>
                                    <li><Link to={route.courseGrid}>{t('student.certificates.title', 'Certificates')}</Link></li>
                                </ul>
                            </div>
                            <div className="col-6 col-md-4">
                                <div className="sl-footer__heading">{t('footer.academy', 'Academy')}</div>
                                <ul className="sl-footer__links">
                                    <li><Link to={route.about_us}>{t('footer.about', 'About Us')}</Link></li>
                                    <li><Link to={route.instructorList}>{t('footer.ourArtists', 'Our Artists')}</Link></li>
                                    <li><Link to={route.blogGrid}>{t('footer.journal', 'Journal')}</Link></li>
                                    <li><Link to={route.FAQ}>{t('footer.faq', 'FAQs')}</Link></li>
                                    <li><Link to={route.contactUs}>{t('footer.contact', 'Contact')}</Link></li>
                                </ul>
                            </div>
                            <div className="col-6 col-md-4">
                                <div className="sl-footer__heading">{t('footer.legal', 'Legal')}</div>
                                <ul className="sl-footer__links">
                                    <li><Link to={route.termsConditions}>{t('footer.termsOfUse', 'Terms of Use')}</Link></li>
                                    <li><Link to={route.privacyPolicy}>{t('footer.privacy', 'Privacy Policy')}</Link></li>
                                    <li><Link to="#">{t('footer.cookiePolicy', 'Cookie Policy')}</Link></li>
                                    <li><Link to="#">{t('footer.refundPolicy', 'Refund Policy')}</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* ── Newsletter column ── */}
                    <div className="col-lg-3">
                        <div className="sl-footer__heading">{t('footer.newsletter', 'Studio Newsletter')}</div>
                        <p style={{
                            fontFamily: 'var(--sl-font-body)', fontSize: '0.8rem',
                            color: 'rgba(245,218,223,0.42)', lineHeight: 1.7, marginBottom: '1.25rem',
                        }}>
                            {t('footer.newsletterDesc', 'Receive new course announcements, technique tips, and exclusive student offers.')}
                        </p>
                        <form onSubmit={e => e.preventDefault()}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <input
                                    type="email"
                                    placeholder={t('footer.emailPlaceholder', 'Your email address')}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(245,218,223,0.12)',
                                        color: 'rgba(245,218,223,0.8)',
                                        fontFamily: 'var(--sl-font-body)',
                                        fontSize: '0.8rem',
                                        padding: '0.75rem 1rem',
                                        outline: 'none',
                                        width: '100%',
                                    }}
                                />
                                <button
                                    type="submit"
                                    className="sl-btn-gold"
                                    style={{ justifyContent: 'center', width: '100%' }}
                                >
                                    {t('footer.subscribe', 'Subscribe')}
                                </button>
                            </div>
                        </form>

                        {/* Trust badges */}
                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            border: '1px solid rgba(197,145,44,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                        }}>
                            <img
                                src={`${process.env.PUBLIC_URL}/assets/img/Logos/Logo Saralowe Academy-12.svg`}
                                alt=""
                                style={{ width: 32, height: 32, opacity: 0.7 }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <div style={{
                                fontFamily: 'var(--sl-font-body)',
                                fontSize: '0.62rem',
                                color: 'rgba(245,218,223,0.4)',
                                letterSpacing: '0.08em',
                                lineHeight: 1.6,
                            }}>
                                {t('footer.craftedByScience', 'Crafted by Science.')}<br />
                                {t('footer.elevatedByArt', 'Elevated by Art.')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="sl-footer__border" />
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    <p className="sl-footer__copy mb-0">
                        © {new Date().getFullYear()} SARALÖWE Academy. {t('footer.allRightsReserved', 'All rights reserved.')}
                    </p>
                    <div className="sl-footer__bottom-links">
                        <Link to={route.termsConditions}>{t('footer.terms', 'Terms')}</Link>
                        <Link to={route.privacyPolicy}>{t('footer.privacy', 'Privacy')}</Link>
                        <Link to="#">{t('footer.cookies', 'Cookies')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
