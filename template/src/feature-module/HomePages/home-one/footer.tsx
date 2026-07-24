import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'
import PaymentBadges from '../../common/PaymentBadges'

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
                            <a href="https://www.instagram.com/saralowe.academy/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
                            <a href="https://www.facebook.com/SweetcakesChezSara" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                        </div>
                    </div>

                    {/* ── Links columns ── */}
                    <div className="col-lg-8">
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
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Bottom bar ── */}
                <div className="sl-footer__border" />
                <div className="d-flex flex-column align-items-center gap-4">

                    {/* Payment badges */}
                    <PaymentBadges variant="dark" />

                    {/* Copyright + links row */}
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 w-100">
                        <p className="sl-footer__copy mb-0">
                            © {new Date().getFullYear()} SARALÖWE Academy. {t('footer.allRightsReserved', 'All rights reserved.')}
                        </p>
                        <div className="sl-footer__bottom-links">
                            <Link to={route.termsConditions}>{t('footer.terms', 'Terms')}</Link>
                            <Link to={route.privacyPolicy}>{t('footer.privacy', 'Privacy')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
