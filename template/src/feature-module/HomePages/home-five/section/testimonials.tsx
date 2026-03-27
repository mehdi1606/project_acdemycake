import React from 'react'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/scrollbar";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Link } from 'react-router-dom';

const Testimonials = () => {
    return (
        <>
            {/* Testimonial */}
            <section className="testimonial-three">
                <div className="container">
                    <div className="testimonial-pattern">
                        <ImageWithBasePath
                            className="pattern-left img-fluid"
                            alt="Img"
                            src="assets/img/bg/pattern-05.svg"
                        />
                    </div>
                    <div className="testimonial-three-content">
                        <div className="row align-items-center row-gap-4">
                            <div className="col-xl-6 col-lg-12 col-md-12" data-aos="fade-down">
                                <div className="become-content">
                                    <h2 className="aos-init aos-animate">They Trusted us</h2>
                                    <h4 className="aos-init aos-animate">
                                        We are a very happy because we have a happy customer
                                    </h4>
                                </div>
                                {/* View all Testimonail */}
                                <Link
                                    to="#"
                                    className="btn btn-white aos-init aos-animate"
                                    data-aos="fade-up"
                                >
                                    Join Our Community
                                </Link>
                                {/* View all Testimonail */}
                            </div>
                            <div className="col-xl-6 col-lg-12 col-md-12" data-aos="fade-down">
                                <div className="swiper-testimonial-three">
                                    <Swiper effect="coverflow"
                                        loop={false}
                                        direction='horizontal'
                                        grabCursor={true}
                                        centeredSlides={true}
                                        slidesPerView="auto"
                                        initialSlide={2}
                                        speed={400}
                                        navigation={{
                                            prevEl: ".slide-prev-btn",
                                            nextEl: ".slide-next-btn",
                                        }}
                                        pagination={{ el: ".swiper-pagination", clickable: true }}
                                        coverflowEffect={{
                                            rotate: 0,
                                            stretch: 0,
                                            depth: 100,
                                            modifier: 10,
                                            slideShadows: true,
                                        }}
                                        modules={[EffectCoverflow, Navigation, Pagination]}
                                        className="swiper-wrapper">

                                        <SwiperSlide >
                                            <div className="swiper-slide">
                                                <div className="testimonial-item-five">
                                                    <div className="testimonial-quote">
                                                        <ImageWithBasePath
                                                            className="quote img-fluid"
                                                            alt="Img"
                                                            src="assets/img/bg/quote.svg"
                                                        />
                                                    </div>
                                                    <div className="testimonial-content">
                                                        <p>
                                                            I’ve become more organized, confident, and focused
                                                            thanks to my life coach. They helped me set realistic
                                                            goals and break them down into actionable steps. I’ve
                                                            accomplished so much already!
                                                        </p>
                                                    </div>
                                                    <div className="testimonial-ratings">
                                                        <div className="rating">
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star" />
                                                            <p className="d-inline-block">
                                                                4.5<span>ratings</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="testimonial-users">
                                                        <div className="imgbx">
                                                            <ImageWithBasePath
                                                                className="img-fluid"
                                                                alt="Img"
                                                                src="assets/img/user/user-01.jpg"
                                                            />
                                                        </div>
                                                        <div className="d-block">
                                                            <h6>Jeff J. Sparrow</h6>
                                                            <p>Designer</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>


                                        <SwiperSlide>
                                            <div className="swiper-slide">
                                                <div className="testimonial-item-five">
                                                    <div className="testimonial-quote">
                                                        <ImageWithBasePath
                                                            className="quote img-fluid"
                                                            alt="Img"
                                                            src="assets/img/bg/quote.svg"
                                                        />
                                                    </div>
                                                    <div className="testimonial-content">
                                                        <p>
                                                            As a writer, I’ve learned so much about structure and
                                                            storytelling from my mentor. Their feedback helped me
                                                            tighten up my writing and make my characters more
                                                            compelling.
                                                        </p>
                                                    </div>
                                                    <div className="testimonial-ratings">
                                                        <div className="rating">
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star" />
                                                            <p className="d-inline-block">
                                                                4.5<span>ratings</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="testimonial-users">
                                                        <div className="imgbx">
                                                            <ImageWithBasePath
                                                                className=""
                                                                alt="Img"
                                                                src="assets/img/user/user-02.jpg"
                                                            />
                                                        </div>
                                                        <div className="d-block">
                                                            <h6>Martin Harn</h6>
                                                            <p>Docker Development</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>

                                        <SwiperSlide>
                                            {/* Swiper Slide */}
                                            <div className="swiper-slide">
                                                <div className="testimonial-item-five">
                                                    <div className="testimonial-quote">
                                                        <ImageWithBasePath
                                                            className="quote img-fluid"
                                                            alt="Img"
                                                            src="assets/img/bg/quote.svg"
                                                        />
                                                    </div>
                                                    <div className="testimonial-content">
                                                        <p>
                                                            I often felt like the mentor’s answers were too
                                                            detailed, which made it hard for me to keep up.
                                                            Sometimes, a simpler explanation would have helped me
                                                            understand things faster.
                                                        </p>
                                                    </div>
                                                    <div className="testimonial-ratings">
                                                        <div className="rating">
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star filled" />
                                                            <i className="fas fa-star" />
                                                            <p className="d-inline-block">
                                                                4.8<span>ratings</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="testimonial-users">
                                                        <div className="imgbx">
                                                            <ImageWithBasePath
                                                                className=""
                                                                alt="Img"
                                                                src="assets/img/user/user-03.jpg"
                                                            />
                                                        </div>
                                                        <div className="d-block">
                                                            <h6>Noah Aarons</h6>
                                                            <p>Business Man</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* /Swiper Slide */}
                                        </SwiperSlide>
                                    </Swiper>
                                    <div className="testimonial-bottom-nav">
                                        <div className="slide-next-btn testimonial-next-pre">
                                            <i className="fas fa-arrow-left" />
                                        </div>
                                        <div className="slide-prev-btn testimonial-next-pre">
                                            <i className="fas fa-arrow-right" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*/Testimonial */}
        </>

    )
}

export default Testimonials
