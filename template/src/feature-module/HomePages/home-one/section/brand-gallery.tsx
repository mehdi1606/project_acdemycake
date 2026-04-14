/**
 * BrandGallery — SARALÖWE Academy
 * A luxury brand-identity showcase using real brand mockups.
 * Shows the physical & digital touchpoints of the brand to
 * build trust and convey premium positioning.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'

const galleryItems = [
    {
        src: 'Mockups/009.jpg',
        alt: 'SARALÖWE luxury satin ribbon — Crafted by Science, Elevated by Art',
        caption: 'Signature Ribbon',
        span: 'col-md-6',
        aspectRatio: '4/3',
    },
    {
        src: 'Mockups/006.jpg',
        alt: 'SARALÖWE gold foil oval seal — Est. 2019',
        caption: 'Gold Seal',
        span: 'col-md-3',
        aspectRatio: '3/4',
    },
    {
        src: 'Mockups/015.jpg',
        alt: 'SARALÖWE branded luxury shopping bag with toile de jouy pattern',
        caption: 'Toile Bag',
        span: 'col-md-3',
        aspectRatio: '3/4',
    },
    {
        src: 'Mockups/013.jpg',
        alt: 'SARALÖWE branded invoice & luxury cakes',
        caption: 'Stationery',
        span: 'col-md-4',
        aspectRatio: '3/2',
    },
    {
        src: 'Mockups/016.jpg',
        alt: 'SARALÖWE thank-you cards spread — red & blush toile',
        caption: 'Thank-You Cards',
        span: 'col-md-4',
        aspectRatio: '3/2',
    },
    {
        src: 'Mockups/008.jpg',
        alt: 'SARALÖWE logo sticker sheet — multiple colorways',
        caption: 'Sticker Collection',
        span: 'col-md-4',
        aspectRatio: '3/2',
    },
]

const BrandGallery = () => {
    const route = all_routes
    return (
        <section className="sl-section sl-section--burg" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Decorative graphic element (top-right) */}
            <img
                src={`${process.env.PUBLIC_URL}/assets/img/Graphics/Graphics Elements-09.svg`}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '40%', opacity: 0.06,
                    pointerEvents: 'none',
                }}
            />
            {/* Decorative graphic element (bottom-left) */}
            <img
                src={`${process.env.PUBLIC_URL}/assets/img/Graphics/Graphics Elements-13.svg`}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute', bottom: 0, left: 0,
                    width: '35%', opacity: 0.05,
                    pointerEvents: 'none',
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
                        <span
                            className="sl-script"
                            style={{ fontSize: '1.8rem', color: 'var(--sl-gold)' }}
                        >
                            The brand
                        </span>
                    </div>
                    <h2 className="light" style={{ marginTop: '0.5rem' }}>A World of Couture Identity</h2>
                    <p className="light" style={{ maxWidth: 560, margin: '0 auto' }}>
                        Every touchpoint — from certificates to packaging — reflects SARALÖWE's
                        commitment to luxury, artistry, and timeless elegance.
                    </p>
                </div>

                {/* Gallery grid — asymmetric masonry feel */}
                <div className="row g-3">
                    {galleryItems.map((item, i) => (
                        <div
                            key={i}
                            className={item.span}
                            data-aos="fade-up"
                            data-aos-delay={i * 80}
                            data-aos-duration="800"
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    aspectRatio: item.aspectRatio,
                                    cursor: 'pointer',
                                }}
                                className="sl-gallery-item"
                            >
                                <img
                                    src={`${process.env.PUBLIC_URL}/assets/img/${item.src}`}
                                    alt={item.alt}
                                    style={{
                                        width: '100%', height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                        transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                    }}
                                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                                />
                                {/* Hover overlay */}
                                <div className="sl-gallery-item__overlay">
                                    <span className="sl-gallery-item__caption">{item.caption}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div
                    className="text-center mt-5"
                    data-aos="fade-up"
                    data-aos-delay="200"
                    data-aos-duration="700"
                >
                    <Link to={route.courseList} className="sl-btn-gold">
                        Discover Our Programmes <i className="isax isax-arrow-right-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default BrandGallery
