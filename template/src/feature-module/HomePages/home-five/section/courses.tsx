import React from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath'
import { all_routes } from '../../../router/all_routes'

const Courses = () => {

    const route = all_routes;

    return (
        <>
            {/* Courses */}
            <section className="home-five-courses">
                <div className="container">
                    <div className="favourite-course-sec">
                        <div className="row">
                            <div
                                className="home-five-head section-header-title"
                                data-aos="fade-up"
                            >
                                <div className="row align-items-center d-flex justify-content-between row-gap-4">
                                    <div className="col-md-6">
                                        <h2>Featured Courses</h2>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="see-all text-end">
                                            <Link to={route.courseGrid}>
                                                View All
                                                <i className="fas fa-arrow-right ms-2" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="all-corses-main">
                                <div className="tab-content">
                                    <div className="nav tablist-three" role="tablist">
                                        <Link
                                            className="nav-tab active me-3"
                                            data-bs-toggle="tab"
                                            to="#alltab"
                                            role="tab"
                                        >
                                            All
                                        </Link>
                                        <Link
                                            className="nav-tab me-3"
                                            data-bs-toggle="tab"
                                            to="#mostpopulartab"
                                            role="tab"
                                        >
                                            Most popular
                                        </Link>
                                        <Link
                                            className="nav-tab me-3"
                                            data-bs-toggle="tab"
                                            to="#businesstab"
                                            role="tab"
                                        >
                                            Business
                                        </Link>
                                        <Link
                                            className="nav-tab me-3"
                                            data-bs-toggle="tab"
                                            to="#designtab"
                                            role="tab"
                                        >
                                            Design
                                        </Link>
                                        <Link
                                            className="nav-tab me-3"
                                            data-bs-toggle="tab"
                                            to="#designtab"
                                            role="tab"
                                        >
                                            Music
                                        </Link>
                                        <Link
                                            className="nav-tab me-3"
                                            data-bs-toggle="tab"
                                            to="#programmingtab"
                                            role="tab"
                                        >
                                            Programming
                                        </Link>
                                        <Link
                                            className="nav-tab me-3"
                                            data-bs-toggle="tab"
                                            to="#databasetab"
                                            role="tab"
                                        >
                                            Database
                                        </Link>
                                    </div>
                                    <div className="tab-content">
                                        {/* All */}
                                        <div
                                            className="tab-pane fade active show"
                                            id="alltab"
                                            role="tabpanel"
                                        >
                                            <div className="all-course">
                                                <div className="row">
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-35.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-02.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Pyhton Development</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            The Complete Web Developer PHP Course
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">500 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $650 <span>$99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-34.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-01.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Web Design</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            Build Responsive Websites with HTML
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">450 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $650 <span>$99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-28.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-03.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Business Management</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            The Complete Business Management Course
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">400 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $300 <span> $99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-29.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-04.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Creative Arts &amp; media</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            Build Creative Arts &amp; media Course
                                                                            Completed
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">250 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $700 <span> $99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-30.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-05.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Personalized Learning</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            Build Responsive Websites with HTML
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">400 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $650 <span> $99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-31.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-06.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Pyhton Development</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            The Complete Pyhton Development Course
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">400 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $650 <span> $99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-32.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-07.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Business Management</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            Build Websites with HTML5 CSS3 Javascript
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">400 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $650 <span> $99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-item course-item-five">
                                                            <div className="course-img">
                                                                <Link to={route.instructorProfile}>
                                                                    <ImageWithBasePath
                                                                        src="assets/img/course/course-33.jpg"
                                                                        alt="Img"
                                                                        className="img-fluid"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="course-content">
                                                                <div className="course-user-img">
                                                                    <Link to={route.instructorProfile}>
                                                                        <ImageWithBasePath
                                                                            src="assets/img/user/user-08.jpg"
                                                                            alt="Img"
                                                                            className="img-fluid"
                                                                        />
                                                                    </Link>
                                                                </div>
                                                                <div className="course-three-text">
                                                                    <p>Creative Arts &amp; media</p>
                                                                    <h3 className="title instructor-text">
                                                                        <Link to={route.courseDetails}>
                                                                            Build Responsive Websites with HTML
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="student-counts-info d-flex align-items-center">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/icon/student.svg"
                                                                        alt="Img"
                                                                    />
                                                                    <p className="ms-2">300 Students</p>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="course-price">
                                                                        <h3>
                                                                            $550 <span> $99.00</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fa-regular fa-clock me-2" />
                                                                        <span>6hr 30min</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                </div>
                                            </div>
                                        </div>
                                        {/* /All */}
                                        {/* Most popular */}
                                        <div className="tab-pane fade" id="mostpopulartab">
                                            <div className="all-course">
                                                <div className="row">
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-34.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-01.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Web Design</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>450 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-35.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-02.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Web Developer PHP Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>500 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-28.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-03.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Business Management Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-29.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-04.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Creative Arts &amp; media Course
                                                                                Completed
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>250 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $700 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-30.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-05.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Personalized Learning</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>$650 </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-31.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-06.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Pyhton Development Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>Free </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-32.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-07.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Websites with HTML5 CSS3 Javascript
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-33.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-08.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                </div>
                                            </div>
                                        </div>
                                        {/* /Most popular */}
                                        {/* Business */}
                                        <div className="tab-pane fade" id="businesstab">
                                            <div className="all-course">
                                                <div className="row">
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-34.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-01.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Web Design</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>450 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-35.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-02.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Web Developer PHP Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>500 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-28.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-03.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Business Management Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-29.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-04.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Creative Arts &amp; media Course
                                                                                Completed
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>250 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $700 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-30.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-05.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Personalized Learning</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>$650 </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-31.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-06.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Pyhton Development Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>Free </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-32.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-07.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Websites with HTML5 CSS3 Javascript
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-33.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-08.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                </div>
                                            </div>
                                        </div>
                                        {/* /Business */}
                                        {/* Design */}
                                        <div className="tab-pane fade" id="designtab">
                                            <div className="all-course">
                                                <div className="row">
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-34.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-01.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Web Design</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>450 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-35.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-02.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Web Developer PHP Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>500 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-28.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-03.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Business Management Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-29.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-04.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Creative Arts &amp; media Course
                                                                                Completed
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>250 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $700 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-30.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-05.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Personalized Learning</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>$650 </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-31.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-06.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Pyhton Development Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>Free </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-32.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-07.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Websites with HTML5 CSS3 Javascript
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-33.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-08.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                </div>
                                            </div>
                                        </div>
                                        {/* /Design */}
                                        {/* Music */}
                                        <div className="tab-pane fade" id="musictab">
                                            <div className="all-course">
                                                <div className="row">
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-34.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-01.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Web Design</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>450 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-35.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-02.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Web Developer PHP Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>500 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-28.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-03.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Business Management Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-29.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-04.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Creative Arts &amp; media Course
                                                                                Completed
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>250 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $700 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-30.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-05.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Personalized Learning</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>$650 </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-31.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-06.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Pyhton Development Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>Free </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-32.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-07.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Websites with HTML5 CSS3 Javascript
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-33.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-08.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                </div>
                                            </div>
                                        </div>
                                        {/* /Music */}
                                        {/* Programmiing */}
                                        <div className="tab-pane fade" id="programmingtab">
                                            <div className="all-course">
                                                <div className="row">
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-34.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-01.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Web Design</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>450 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-35.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-02.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Web Developer PHP Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>500 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-28.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-03.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Business Management Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-29.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-04.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Creative Arts &amp; media Course
                                                                                Completed
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>250 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $700 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-30.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-05.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Personalized Learning</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>$650 </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-31.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-06.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Pyhton Development Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>Free </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-32.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-07.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Websites with HTML5 CSS3 Javascript
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-33.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-08.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                </div>
                                            </div>
                                        </div>
                                        {/* /Programmiing */}
                                        {/* Database */}
                                        <div className="tab-pane fade" id="databasetab">
                                            <div className="all-course">
                                                <div className="row">
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-34.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-01.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Web Design</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>450 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-35.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-02.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Web Developer PHP Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>500 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-28.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-03.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Business Management Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-29.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-04.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Creative Arts &amp; media Course
                                                                                Completed
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>250 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $700 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-30.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-05.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Personalized Learning</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>$650 </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-31.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-06.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Pyhton Development</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                The Complete Pyhton Development Course
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>Free </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-32.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-07.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Business Management</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Websites with HTML5 CSS3 Javascript
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $650 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                    {/* Col */}
                                                    <div
                                                        className="col-xl-3 col-lg-6 col-md-6 col-12"
                                                        data-aos="fade-up"
                                                    >
                                                        <div className="course-box-three">
                                                            <div className="course-three-item">
                                                                <div className="course-three-img">
                                                                    <Link to={route.courseDetails}>
                                                                        <ImageWithBasePath
                                                                            className="img-fluid"
                                                                            alt="Img"
                                                                            src="assets/img/course/course-33.jpg"
                                                                        />
                                                                    </Link>
                                                                    <div className="heart-three">
                                                                        <Link to="#">
                                                                            <i className="fa-regular fa-heart" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="course-three-content">
                                                                    <div className="course-group-three">
                                                                        <div className="group-three-img">
                                                                            <Link to={route.instructorProfile}>
                                                                                <ImageWithBasePath
                                                                                    src="assets/img/user/user-08.jpg"
                                                                                    alt="Img"
                                                                                    className="img-fluid"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                    <div className="course-three-text">
                                                                        <p>Creative Arts &amp; media</p>
                                                                        <h3 className="title instructor-text">
                                                                            <Link to={route.courseDetails}>
                                                                                Build Responsive Websites with HTML
                                                                            </Link>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="student-counts-info d-flex align-items-center">
                                                                        <div className="students-three-counts d-flex align-items-center">
                                                                            <ImageWithBasePath
                                                                                src="assets/img/icon/student.svg"
                                                                                alt="Img"
                                                                            />
                                                                            <p>400 Students</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="price-three-group d-flex align-items-center justify-content-between">
                                                                        <div className="price-three-view d-flex align-items-center">
                                                                            <div className="course-price-three">
                                                                                <h3>
                                                                                    $300 <span>$99.00</span>
                                                                                </h3>
                                                                            </div>
                                                                        </div>
                                                                        <div className="price-three-time d-inline-flex align-items-center">
                                                                            <i className="fa-regular fa-clock me-2" />
                                                                            <span>6hr 30min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* /Col */}
                                                </div>
                                            </div>
                                        </div>
                                        {/* /Database */}
                                    </div>
                                    <div className="text-center mt-3">
                                        <Link to={route.courseGrid} className="btn btn-secondary">
                                            View all Courses
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* /Courses */}
        </>

    )
}

export default Courses
