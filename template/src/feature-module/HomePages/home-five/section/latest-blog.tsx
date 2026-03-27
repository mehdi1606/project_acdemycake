import React from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath'
import { all_routes } from '../../../router/all_routes'

const Latestblog = () => {

    const route = all_routes;

    return (
        <>
            {/* Latest Blog */}
            <section className="latest-blog-three">
                <div className="container">
                    <div
                        className="home-five-head section-header-title pb-0"
                        data-aos="fade-up"
                    >
                        <div className="row align-items-center d-flex justify-content-between row-gap-4">
                            <div className="col-lg-6 col-md-8">
                                <h2>Latest News &amp; Events</h2>
                            </div>
                            <div className="col-lg-6 col-md-4">
                                <div className="see-all text-end">
                                    <Link to={route.blogGrid}>
                                        View All
                                        <i className="fas fa-arrow-right ms-2" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="latest-blog-main">
                        <div className="row">
                            <div className="col-lg-4 d-flex">
                                <div className="event-blog-three blog-three-one flex-fill">
                                    <div className="blog-img-three">
                                        <Link to={route.blogGrid}>
                                            <ImageWithBasePath
                                                className="img-fluid"
                                                alt="Img"
                                                src="assets/img/blog/blog-34.jpg"
                                            />
                                        </Link>
                                    </div>
                                    <div className="latest-blog-content">
                                        <div className="event-three-title">
                                            <div className="event-span-three d-flex align-items-center">
                                                <span className="span-name-three badge-green">
                                                    Lifestyle
                                                </span>
                                                <div className="blog-student-count">
                                                    <i className="fa-solid fa-calendar" />
                                                    <span>09 Aug 2025</span>
                                                </div>
                                            </div>
                                            <Link to={route.blogGrid}>
                                                <h5>Why an LMS is Essential for Modern Education</h5>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="blog-user-top">
                                        <Link to="#">
                                            <ImageWithBasePath src="assets/img/user/user-01.jpg" alt="" />
                                            David Benitez
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-8">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="event-blog-three blog-three-one">
                                            <div className="blog-img-three">
                                                <Link to={route.blogGrid}>
                                                    <ImageWithBasePath
                                                        className="img-fluid"
                                                        alt="Img"
                                                        src="assets/img/blog/blog-36.jpg"
                                                    />
                                                </Link>
                                            </div>
                                            <div className="latest-blog-content">
                                                <div className="event-three-title">
                                                    <div className="event-span-three d-flex align-items-center">
                                                        <span className="span-name-three badge-green">
                                                            Productivity
                                                        </span>
                                                        <div className="blog-student-count">
                                                            <i className="fa-solid fa-calendar" />
                                                            <span>09 Aug 2025</span>
                                                        </div>
                                                    </div>
                                                    <Link to={route.blogGrid}>
                                                        <h5>The Impact of LMS on Academic Journey Education</h5>
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="blog-user-top">
                                                <Link to="#">
                                                    <ImageWithBasePath src="assets/img/user/user-01.jpg" alt="" />
                                                    David Benitez
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="event-blog-three blog-three-one">
                                            <div className="blog-img-three">
                                                <Link to={route.blogGrid}>
                                                    <ImageWithBasePath
                                                        className="img-fluid"
                                                        alt="Img"
                                                        src="assets/img/blog/blog-37.jpg"
                                                    />
                                                </Link>
                                            </div>
                                            <div className="latest-blog-content">
                                                <div className="event-three-title">
                                                    <div className="event-span-three d-flex align-items-center">
                                                        <span className="span-name-three badge-green">
                                                            Productivity
                                                        </span>
                                                        <div className="blog-student-count">
                                                            <i className="fa-solid fa-calendar" />
                                                            <span>09 Aug 2025</span>
                                                        </div>
                                                    </div>
                                                    <Link to={route.blogGrid}>
                                                        <h5>Maximizing Academic Success with the Right LMS</h5>
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="blog-user-top">
                                                <Link to="#">
                                                    <ImageWithBasePath src="assets/img/user/user-01.jpg" alt="" />
                                                    David Benitez
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="event-blog-three blog-three-one">
                                            <div className="blog-img-three">
                                                <Link to={route.blogGrid}>
                                                    <ImageWithBasePath
                                                        className="img-fluid"
                                                        alt="Img"
                                                        src="assets/img/blog/blog-38.jpg"
                                                    />
                                                </Link>
                                            </div>
                                            <div className="latest-blog-content">
                                                <div className="event-three-title">
                                                    <div className="event-span-three d-flex align-items-center">
                                                        <span className="span-name-three badge-green">
                                                            UI /UX
                                                        </span>
                                                        <div className="blog-student-count">
                                                            <i className="fa-solid fa-calendar" />
                                                            <span>09 Aug 2025</span>
                                                        </div>
                                                    </div>
                                                    <Link to={route.blogGrid}>
                                                        <h5>Promoting Health &amp; Well being in Schools</h5>
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="blog-user-top">
                                                <Link to="#">
                                                    <ImageWithBasePath src="assets/img/user/user-01.jpg" alt="" />
                                                    David Benitez
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="event-blog-three blog-three-one">
                                            <div className="blog-img-three">
                                                <Link to={route.blogGrid}>
                                                    <ImageWithBasePath
                                                        className="img-fluid"
                                                        alt="Img"
                                                        src="assets/img/blog/blog-39.jpg"
                                                    />
                                                </Link>
                                            </div>
                                            <div className="latest-blog-content">
                                                <div className="event-three-title">
                                                    <div className="event-span-three d-flex align-items-center">
                                                        <span className="span-name-three badge-green">
                                                            Development
                                                        </span>
                                                        <div className="blog-student-count">
                                                            <i className="fa-solid fa-calendar" />
                                                            <span>09 Aug 2025</span>
                                                        </div>
                                                    </div>
                                                    <Link to={route.blogGrid}>
                                                        <h5>How to Build and Run a Pilot Mentoring Program</h5>
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="blog-user-top">
                                                <Link to="#">
                                                    <ImageWithBasePath src="assets/img/user/user-01.jpg" alt="" />
                                                    David Benitez
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* /Latest Blog */}
        </>

    )
}

export default Latestblog
