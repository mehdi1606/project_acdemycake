import React from 'react'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import CountUp from 'react-countup'

const Acheivegoal = () => {
    return (
        <>
            {/* Acheive you Goals  */}
            <section className="home-five-goals">
                <div className="container">
                    <div className="row align-items-center justify-content-center row-gap-4">
                        {/* Col */}
                        <div className="col-xl-3 col-lg-12 col-md-12" data-aos="fade-down">
                            <div className="acheive-goals-main">
                                <h2>Acheive you Goals with SARALOWE</h2>
                            </div>
                        </div>
                        {/* /Col */}
                        {/* Col */}
                        <div className="col-xl-3 col-lg-4 col-md-4 col-12" data-aos="fade-down">
                            <div className="acheive-goals">
                                <div className="acheive-elips-one">
                                    <ImageWithBasePath src="assets/img/icon/ellipse-1.svg" alt="Img" />
                                </div>
                                <div className="acheive-goals-content text-center course-count ms-0">
                                    <h4>
                                        <span className="counterUp"><CountUp end={253085} /></span>
                                    </h4>
                                    <p>Students Enrolled all over World</p>
                                </div>
                            </div>
                        </div>
                        {/* /Col */}
                        {/* Col */}
                        <div className="col-xl-3 col-lg-4 col-md-4 col-12" data-aos="fade-down">
                            <div className="acheive-goals">
                                <div className="acheive-elips-two">
                                    <ImageWithBasePath src="assets/img/icon/ellipse-2.svg" alt="Img" />
                                </div>
                                <div className="acheive-goals-content text-center course-count ms-0">
                                    <h4>
                                        <span className="counterUp"><CountUp end={1205} /></span>
                                    </h4>
                                    <p>Total Courses on our Platform</p>
                                </div>
                            </div>
                        </div>
                        {/* /Col */}
                        {/* Col */}
                        <div className="col-xl-3 col-lg-4 col-md-4 col-12" data-aos="fade-down">
                            <div className="acheive-goals">
                                <div className="acheive-elips-three">
                                    <ImageWithBasePath src="assets/img/icon/ellipse-3.svg" alt="Img" />
                                </div>
                                <div className="acheive-goals-content text-center course-count ms-0">
                                    <h4>
                                        <span className="counterUp"><CountUp end={56} /></span>
                                    </h4>
                                    <p>Various Countries of Students</p>
                                </div>
                            </div>
                        </div>
                        {/* /Col */}
                    </div>
                </div>
            </section>
            {/* /Acheive you Goals  */}
        </>

    )
}

export default Acheivegoal
