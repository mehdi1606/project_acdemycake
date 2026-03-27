import React from 'react'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath'

const Masterskill = () => {
    return (
        <>
            {/* Master skills Career */}
            <section className="master-skill-three">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-xl-5 col-lg-6 col-md-12" data-aos="fade-up">
                            <div className="master-three-images">
                                <div className="master-img">
                                     <ImageWithBasePath
                                        className="img-fluid master-bg1"
                                        src="assets/img/shapes/shape-10.svg"
                                        alt="img"
                                    />
                                     <ImageWithBasePath
                                        className="img-fluid master-bg2"
                                        src="assets/img/shapes/shape-7.svg"
                                        alt="img"
                                    />
                                     <ImageWithBasePath
                                        className="img-fluid master-skill-image1"
                                        src="assets/img/feature/feature-10.jpg"
                                        alt="img"
                                    />
                                    <div className="text-end">
                                         <ImageWithBasePath
                                            className="img-fluid master-skill-image2"
                                            src="assets/img/feature/feature-11.jpg"
                                            alt="img"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-7 col-lg-6 col-md-12" data-aos="fade-up">
                            <div className="master-skill-content">
                                <div className="home-five-head" data-aos="fade-up">
                                    <h2>Master the skills to drive your career</h2>
                                </div>
                                <div className="home-five-content" data-aos="fade-up">
                                    <p>
                                        Get certified, master modern tech skills, and level up your
                                        career whether you’re starting out or a seasoned pro. 95% of
                                        eLearning learners report our hands-on content directly helped
                                        their careers.
                                    </p>
                                </div>
                                <div className="skils-group">
                                    <div className="row row-gap-4">
                                        <div
                                            className="col-lg-6 col-xs-12 col-sm-6"
                                            data-aos="fade-down"
                                        >
                                            <div className="skils-icon-item">
                                                <div className="skils-icon">
                                                     <ImageWithBasePath
                                                        className="img-fluid"
                                                        src="assets/img/icon/career-01.svg"
                                                        alt="certified"
                                                    />
                                                </div>
                                                <div className="skils-content">
                                                    <h5 className="mb-2">Certified Courses</h5>
                                                    <p className="mb-0">
                                                        Get certified with 100+ certification courses
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-xs-12 col-sm-6" data-aos="fade-up">
                                            <div className="skils-icon-item">
                                                <div className="skils-icon">
                                                     <ImageWithBasePath
                                                        className="img-fluid"
                                                        src="assets/img/icon/career-02.svg"
                                                        alt="Build skills"
                                                    />
                                                </div>
                                                <div className="skils-content">
                                                    <h5 className="mb-2">Skill Building</h5>
                                                    <p className="mb-0">
                                                        Build skills your way, from labs to courses
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-xs-12 col-sm-6" data-aos="fade-up">
                                            <div className="skils-icon-item">
                                                <div className="skils-icon">
                                                     <ImageWithBasePath
                                                        className="img-fluid"
                                                        src="assets/img/icon/career-03.svg"
                                                        alt="Stay Motivated"
                                                    />
                                                </div>
                                                <div className="skils-content">
                                                    <h5 className="mb-2">Stay Inspired</h5>
                                                    <p className="mb-0">
                                                        Stay motivated with engaging instructors
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-xs-12 col-sm-6" data-aos="fade-up">
                                            <div className="skils-icon-item">
                                                <div className="skils-icon">
                                                    <ImageWithBasePath
                                                        className="img-fluid"
                                                        src="assets/img/icon/career-04.svg"
                                                        alt="latest cloud"
                                                    />
                                                </div>
                                                <div className="skils-content">
                                                    <h5 className="mb-2">Keep Upgrade</h5>
                                                    <p className="mb-0">Keep up with the latest in cloud</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* /Master skills Career */}
        </>

    )
}

export default Masterskill
