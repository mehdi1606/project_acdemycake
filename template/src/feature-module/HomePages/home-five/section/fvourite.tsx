import React from 'react'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath'
import { Link } from 'react-router-dom'
import Slider from 'react-slick';
import { all_routes } from '../../../router/all_routes';

const Favourite = () => {

    const route = all_routes;

    //Favourite Slider
    const favouriteslider = {
        dots: true,
        infinite: false,
        speed: 300,
        slidesToShow: 5,
        slidesToScroll: 5,
        arrows: false,
        responsive: [
          {
            breakpoint: 1399,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 4,
              infinite: true,
              dots: true,
            },
          },
          {
            breakpoint: 1300,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 3,
              infinite: true,
              dots: true,
            },
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      };

    return (
        <>
            {/* Favourite Course */}
            <section className="home-five-favourite">
                <div className="container">
                    <div className="category-sec">
                        <div className="row">
                            <div className="container">
                                <div
                                    className="home-five-head section-header-title"
                                    data-aos="fade-up"
                                >
                                    <div className="row align-items-center d-flex justify-content-between row-gap-4">
                                        <div className="col-md-8 col-sm-12">
                                            <h2>Choose favourite Course from top Category</h2>
                                        </div>
                                        <div className="col-md-4 col-sm-12">
                                            <div className="see-all text-end">
                                                <Link to={route.courseDetails}>
                                                    View All
                                                    <i className="fas fa-arrow-right ms-2" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Slider {...favouriteslider}>
                                    <div
                                        className="categories-item categories-item-five"
                                        data-aos="fade-down"
                                    >
                                        <div className="categories-icon">
                                            <ImageWithBasePath
                                                className="img-fluid"
                                                src="assets/img/icon/favourite-01.svg"
                                                alt="Angular Development"
                                            />
                                        </div>
                                        <div className="category-info">
                                            <h3>
                                                <Link to={route.courseDetails}>Angular Development</Link>
                                            </h3>
                                        </div>
                                        <div className="instructors-info">
                                            <p className="me-4">Instructors</p>
                                            <ul className="instructors-list">
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 1"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-13.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 2"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-14.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 3"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-15.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li className="more-set">
                                                    <Link to="#">80+</Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div
                                        className="categories-item categories-item-five"
                                        data-aos="fade-down"
                                    >
                                        <div className="categories-icon">
                                            <ImageWithBasePath
                                                className="img-fluid"
                                                src="assets/img/icon/favourite-02.svg"
                                                alt="Angular Development"
                                            />
                                        </div>
                                        <div className="category-info">
                                            <h3>
                                                <Link to={route.courseDetails}>Pyhton Developmentt</Link>
                                            </h3>
                                        </div>
                                        <div className="instructors-info">
                                            <p className="me-4">Instructors</p>
                                            <ul className="instructors-list">
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 1"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-10.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 2"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-11.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 3"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-12.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li className="more-set">
                                                    <Link to="#">80+</Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div
                                        className="categories-item categories-item-five"
                                        data-aos="fade-down"
                                    >
                                        <div className="favourite-item flex-fill">
                                            <div className="categories-icon">
                                                <ImageWithBasePath
                                                    className="img-fluid"
                                                    src="assets/img/icon/favourite-03.svg"
                                                    alt="NODE JS Development"
                                                />
                                            </div>
                                            <div className="category-info">
                                                <h3>
                                                    <Link to={route.courseDetails}>NODE JS Development</Link>
                                                </h3>
                                            </div>
                                            <div className="instructors-info">
                                                <p className="me-4">Instructors</p>
                                                <ul className="instructors-list">
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 1"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-07.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 2"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-08.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 3"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-09.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li className="more-set">
                                                        <Link to="#">80+</Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="categories-item categories-item-five"
                                        data-aos="fade-down"
                                    >
                                        <div className="favourite-item flex-fill">
                                            <div className="categories-icon">
                                                <ImageWithBasePath
                                                    className="img-fluid"
                                                    src="assets/img/icon/favourite-04.svg"
                                                    alt="NODE JS Development"
                                                />
                                            </div>
                                            <div className="category-info">
                                                <h3>
                                                    <Link to={route.courseDetails}>Corephp Development</Link>
                                                </h3>
                                            </div>
                                            <div className="instructors-info">
                                                <p className="me-4">Instructors</p>
                                                <ul className="instructors-list">
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 1"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-04.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 2"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-05.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 3"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-06.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li className="more-set">
                                                        <Link to="#">80+</Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="categories-item categories-item-five"
                                        data-aos="fade-down"
                                    >
                                        <div className="favourite-item flex-fill">
                                            <div className="categories-icon">
                                                <ImageWithBasePath
                                                    className="img-fluid"
                                                    src="assets/img/icon/favourite-05.svg"
                                                    alt="Angular Development"
                                                />
                                            </div>
                                            <div className="category-info">
                                                <h3>
                                                    <Link to={route.courseDetails}>Laravel Development</Link>
                                                </h3>
                                            </div>
                                            <div className="instructors-info">
                                                <p className="me-4">Instructors</p>
                                                <ul className="instructors-list">
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 1"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-01.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 2"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-02.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title=""
                                                            data-bs-original-title="leader 3"
                                                        >
                                                            <ImageWithBasePath src="assets/img/user/user-03.jpg" alt="img" />
                                                        </Link>
                                                    </li>
                                                    <li className="more-set">
                                                        <Link to="#">80+</Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="categories-item categories-item-five"
                                        data-aos="fade-down"
                                    >
                                        <div className="categories-icon">
                                            <ImageWithBasePath
                                                className="img-fluid"
                                                src="assets/img/icon/favourite-01.svg"
                                                alt="Angular Development"
                                            />
                                        </div>
                                        <div className="category-info">
                                            <h3>
                                                <Link to={route.courseDetails}>Angular Development</Link>
                                            </h3>
                                        </div>
                                        <div className="instructors-info">
                                            <p className="me-4">Instructors</p>
                                            <ul className="instructors-list">
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 1"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-13.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 2"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-14.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        data-bs-toggle="tooltip"
                                                        data-bs-placement="top"
                                                        title=""
                                                        data-bs-original-title="leader 3"
                                                    >
                                                        <ImageWithBasePath src="assets/img/user/user-15.jpg" alt="img" />
                                                    </Link>
                                                </li>
                                                <li className="more-set">
                                                    <Link to="#">80+</Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </Slider>
                            </div>
                        </div>
                    </div>
                    {/* /Favourite Course */}
                </div>
            </section>
            {/* Feature Course */}
        </>

    )
}

export default Favourite
