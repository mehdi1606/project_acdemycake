import { Route } from "react-router";
import { all_routes } from "./all_routes";
import SubscriptionGuard from "../common/SubscriptionGuard";
import RoleGuard from "../common/RoleGuard";
import HomeOne from "../HomePages/home-one/homeone";
import CourseGrid from "../Courses/courses-grid/courseGrid";
import CourseList from "../Courses/course-list/courseList";
import CourseCategory from "../Courses/course-category/courseCategory";
import CourseCategoryThree from "../Courses/course-category-three/courseCategoryThree";
import CourseResume from "../Courses/course-resume/courseResume";
import CourseWatch from "../Courses/course-watch/courseWatch";
import CourseCart from "../Courses/course-cart/courseCart";
import CourseCheckout from "../Courses/course-checkout/courseCheckout";
import AddNewCourse from "../Courses/add-newCourse/addNewCourse";
import InstructorDashboard from "../Instructor/instructor-dashboard/instructorDashboard";
import InstructorProfile from "../Instructor/instructor-profile/instructorProfile";
import InstructorCertificate from "../Instructor/instructor-certificate/instructorCertificate";
import InstructorCourse from "../Instructor/instructor-course/instructorCourse";
import InstructorAnnouncements from "../Instructor/instructor-announcements/instructorAnnouncements";
import InstructorAssignment from "../Instructor/instructor-assignment/instructorAssignment";
import StudentGrid from "../Instructor/student-grid/studentGrid";
import StudentList from "../Instructor/student-list/studentList";
import InstructorQuiz from "../Instructor/instructor-quiz/instructorQuiz";
import InstructorQuizResult from "../Instructor/instructor-quiz-result/instructorQuizResult";
import InstructorEarning from "../Instructor/instructor-earning/instructorEarning";
import InstructorStatement from "../Instructor/instructor-statement/instructorStatement";
import InstructorMessage from "../Instructor/instructor-message/instructorMessage";
import InstructorChangePassoword from "../Instructor/instructor-settings/instructor-change-password/instructorChangePassoword";
import InstructorPlanSettings from "../Instructor/instructor-settings/instructor-plans-settings/instructorPlanSettings";
import InstructorSocialprofileSettings from "../Instructor/instructor-settings/instructor-socialprofile-settings/instructorSocialprofileSettings";
import InstructorLinkedAccounts from "../Instructor/instructor-settings/instructor-linked-accounts/instructorLinkedAccounts";
import InstructorNotification from "../Instructor/instructor-settings/instructor-notification/instructorNotification";
import InstructorIntegrations from "../Instructor/instructor-settings/instructor-integrations/instructorIntegrations";
import InstructorWithdraw from "../Instructor/instructor-settings/instructor-withdraw/instructorWithdraw";
import CourseDetails from "../Courses/course-details/courseDetails";
import CourseDetailsTwo from "../Courses/course-details-2/courseDetailsTwo";
import CourseCategoryTwo from "../Courses/course-category-two/courseCategoryTwo";
import StudentDashboard from "../student/dashboard/studentDashboard";
import BlogGrid from "../blog/blog-layouts/blogGrid";
import BlogGrid2 from "../blog/blog-layouts/blogGrid2";
import BlogGrid3 from "../blog/blog-layouts/blogGrid3";
import BlogCarousal from "../blog/blog-layouts/blogCarousal";
import BlogMasonry from "../blog/blog-layouts/blogMasonry";
import BlogLeftSidebar from "../blog/blog-layouts/blogLeftSidebar";
import BlogRightSidebar from "../blog/blog-layouts/blogRightSidebar";
import BlogDetailsLeftSidebar from "../blog/blog-details/blogDetailsLeftSidebar";
import BlogDetailsRightSidebar from "../blog/blog-details/blogDetailsRightSidebar";
import InstructorGrid from "../Pages/instructor/instructor-grid/instructorGrid";
import InstructorList from "../Pages/instructor/instructor-list/instructorList";
import InstructorDetails from "../Pages/instructor/instructor-details/instructor-details";
import AboutUs from "../Pages/about-us/aboutUs";
import ContactUs from "../Pages/contact-us/contactUs";
import Notification from "../Pages/notification/notification";
import BecomeInstructor from "../Pages/become-instructor/becomeInstructor";
import Testimonials from "../Pages/testimonials/testimonials";
import PricePlanning from "../Pages/price-planning/pricePlanning";
import Faq from "../Pages/faq/faq";
import TermsCondition from "../Pages/terms-condition/termsCondition";
import PrivacyPolicy from "../Pages/privacy-policy/privacyPolicy";
import Login from "../auth/login/login";
import Register from "../auth/register/register";
import ForgortPassword from "../auth/forgot-password/forgortPassword";
import SetPassword from "../auth/set-password/setPassword";
import Otp from "../auth/otp/otp";
import LockScreen from "../auth/lock-screen/lockScreen";
import Error404 from "../auth/error/error-404/error400";
import Error500 from "../auth/error/error-500/error500";
import ComingSoon from "../auth/coming-soon/comingSoon";
import UnderConstruction from "../auth/underconstruction/underConstruction";
import InstructorCourseGrid from "../Instructor/instructor-course/instructorCourseGrid";
import CourseManage from "../Instructor/instructor-course/CourseManage";

import StudentProfile from "../student/student-profile/studentProfile";
import StudentCourse from "../student/student-course/studentCourse";
import StudentCertificates from "../student/student-certificates/student-certificates";
import StudentWishlist from "../student/student-wishlist/studentWishlist";
import StudentReviews from "../student/student-reviews/studentReviews";
import StudentQuiz from "../student/student-quiz/studentQuiz";
import StudentOrder from "../student/student-order-history/studentOrder";
import StudentRefferal from "../student/student-refferal/studentRefferal";
import StudentMessage from "../student/student-message/studentMessage";
import StudentsDetails from "../Instructor/student-details/studentsDetails";
import InstructorQuizQuestions from "../Instructor/instructor-quiz-question/instructorQuizQuestions";
import StudentTickets from "../student/student-tickets/studentTickets";
import StudentSettings from "../student/student-settings/studentSettings";
import StudentChangePassword from "../student/student-settings/student-change-password/studentChangePassword";
import StudentSocialProfile from "../student/student-settings/student-social-profile/studentSocialProfile";
import StudentLinkedAccounts from "../student/student-settings/student-linked-accounts/studentLinkedAccounts";
import StudentNotification from "../student/student-settings/student-notifications/studentNotification";
import StudentBillingAddress from "../student/student-settings/student-billing-address/studentBillingAddress";
import StudentQuizQuestion from "../student/student-quiz-question/studentQuizQuestion";
import InstructorProfileSettings from "../Instructor/instructor-settings/instructor-profile-settings/instructorProfile";

// Admin imports
import AdminDashboard from "../admin/dashboard/adminDashboard";
import AdminUsers from "../admin/users/adminUsers";
import AdminCourses from "../admin/courses/adminCourses";
import AdminPendingCourses from "../admin/courses/adminPendingCourses";
import AdminCategories from "../admin/categories/adminCategories";
import AdminTransactions from "../admin/transactions/adminTransactions";
import AdminTickets from "../admin/tickets/adminTickets";
import AdminSettings from "../admin/settings/adminSettings";

const routes = all_routes;

export const publicRoutes = [
  {
    path: routes.homeone,
    element: <HomeOne />,
    route: Route,
  },
  {
    path: routes.courseGrid,
    element: <CourseGrid />,
    route: Route,
  },
  {
    path: routes.courseList,
    element: <CourseList />,
    route: Route,
  },
  {
    path: routes.courseCategory,
    element: <CourseCategory />,
    route: Route,
  },
  {
    path: `${routes.courseCategory}/:slug`,
    element: <CourseCategory />,
    route: Route,
  },
  {
    path: routes.courseCategory2,
    element: <CourseCategoryTwo />,
    route: Route,
  },
  {
    path: routes.courseCategory3,
    element: <CourseCategoryThree />,
    route: Route,
  },
  {
    path: routes.courseResume,
    element: <CourseResume />,
    route: Route,
  },
  {
    path: `${routes.courseWatch}/:courseSlug`,
    element: <SubscriptionGuard><CourseWatch /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.courseCart,
    element: <CourseCart />,
    route: Route,
  },
  {
    path: routes.courseCheckout,
    element: <CourseCheckout />,
    route: Route,
  },
  {
    path: routes.addNewCourse,
    element: <AddNewCourse />,
    route: Route,
  },
  {
    path: routes.instructorDashboard,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDashboard  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorProfile,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorProfile  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorCourse,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorCourse  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorAnnouncements,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorAnnouncements  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorAssignment,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorAssignment  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.studentsGrid,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><StudentGrid /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.studentsList,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><StudentList /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorQuiz,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorQuiz  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorQuizResult,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorQuizResult  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorCertificate,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorCertificate  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorEarning,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorEarning  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorStatements,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorStatement  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorMessage,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorMessage  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorChangePassword,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorChangePassoword  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorPlan,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorPlanSettings  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorSocialProfiles,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorSocialprofileSettings  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorLinkedAccounts,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorLinkedAccounts  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorNotification,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorNotification  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorIntegrations,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorIntegrations  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorWithdraw,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorWithdraw  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.courseDetails,
    element: <CourseDetails />,
    route: Route,
  },
  {
    path: `${routes.courseDetails}/:slug`,
    element: <CourseDetails />,
    route: Route,
  },
  {
    path: routes.courseDetails2,
    element: <CourseDetailsTwo />,
    route: Route,
  },
  {
    path: routes.studentDashboard,
    element: <SubscriptionGuard><StudentDashboard /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.blogGrid,
    element: <BlogGrid />,
    route: Route,
  },
  {
    path: routes.blogGrid2,
    element: <BlogGrid2 />,
    route: Route,
  },
  {
    path: routes.blogGrid3,
    element: <BlogGrid3 />,
    route: Route,
  },
  {
    path: routes.blogCarousal,
    element: <BlogCarousal />,
    route: Route,
  },
  {
    path: routes.blogMasonry,
    element: <BlogMasonry />,
    route: Route,
  },
  {
    path: routes.blogLeftSidebar,
    element: <BlogLeftSidebar />,
    route: Route,
  },
  {
    path: routes.blogRightSidebar,
    element: <BlogRightSidebar />,
    route: Route,
  },
  {
    path: routes.blogDetailsLeftSidebar,
    element: <BlogDetailsLeftSidebar />,
    route: Route,
  },
  {
    path: routes.blogDetailsRightSidebar,
    element: <BlogDetailsRightSidebar />,
    route: Route,
  },
  {
    path: routes.instructorGrid,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorGrid  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorList,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorList  /></RoleGuard>,
    route: Route,
  },
  {
    path: `${routes.instructorDetails}/:instructorId`,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorDetails  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.about_us,
    element: <AboutUs />,
    route: Route,
  },
  {
    path: routes.contactUs,
    element: <ContactUs />,
    route: Route,
  },
  {
    path: routes.notification,
    element: <Notification />,
    route: Route,
  },
  {
    path: routes.becomeAnInstructor,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><BecomeInstructor  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.testimonials,
    element: <Testimonials />,
    route: Route,
  },
  {
    path: routes.pricingPlan,
    element: <PricePlanning />,
    route: Route,
  },
  {
    path: routes.FAQ,
    element: <Faq />,
    route: Route,
  },
  {
    path: routes.termsConditions,
    element: <TermsCondition />,
    route: Route,
  },
  {
    path: routes.privacyPolicy,
    element: <PrivacyPolicy />,
    route: Route,
  },
  {
    path: routes.studentProfile,
    element: <SubscriptionGuard><StudentProfile /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentCourses,
    element: <SubscriptionGuard><StudentCourse /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentCertificates,
    element: <SubscriptionGuard><StudentCertificates /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentWishlist,
    element: <SubscriptionGuard><StudentWishlist /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentReviews,
    element: <SubscriptionGuard><StudentReviews /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentQuiz,
    element: <SubscriptionGuard><StudentQuiz /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentOrderHistory,
    element: <SubscriptionGuard><StudentOrder /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentReferral,
    element: <SubscriptionGuard><StudentRefferal /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentMessage,
    element: <SubscriptionGuard><StudentMessage /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.instructorCourseGrid,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorCourseGrid  /></RoleGuard>,
    route: Route,
  },
  {
    path: `${routes.instructorCourseManage}/:courseId`,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><CourseManage /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.studentsDetails,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><StudentsDetails /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorQA,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorQuizQuestions  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.studentTickets,
    element: <SubscriptionGuard><StudentTickets /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentSettings,
    element: <SubscriptionGuard><StudentSettings /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentChangePassword,
    element: <SubscriptionGuard><StudentChangePassword /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentSocialProfile,
    element: <SubscriptionGuard><StudentSocialProfile /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentLinkedAccounts,
    element: <SubscriptionGuard><StudentLinkedAccounts /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentNotification,
    element: <SubscriptionGuard><StudentNotification /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentBillingAddress,
    element: <SubscriptionGuard><StudentBillingAddress /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.studentQuizQuestion,
    element: <SubscriptionGuard><StudentQuizQuestion /></SubscriptionGuard>,
    route: Route,
  },
  {
    path: routes.instructorsettings,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorProfileSettings  /></RoleGuard>,
    route: Route,
  },
  // Admin Routes
  {
    path: routes.adminDashboard,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminDashboard  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminUsers,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminUsers  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminCourses,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminCourses  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminPendingCourses,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminPendingCourses  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminCategories,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminCategories  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminTransactions,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminTransactions  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminTickets,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminTickets  /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminSettings,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminSettings  /></RoleGuard>,
    route: Route,
  },
];

export const authRoutes = [
  {
    path: routes.login,
    element: <Login />,
    route: Route,
  },
  {
    path: routes.register,
    element: <Register />,
    route: Route,
  },
  {
    path: routes.forgotpassword,
    element: <ForgortPassword />,
    route: Route,
  },
  {
    path: routes.setpassowrd,
    element: <SetPassword />,
    route: Route,
  },
  {
    path: routes.otp,
    element: <Otp />,
    route: Route,
  },
  {
    path: routes.lockscreen,
    element: <LockScreen />,
    route: Route,
  },
  {
    path: routes.Error404,
    element: <Error404 />,
    route: Route,
  },
  {
    path: routes.Error500,
    element: <Error500 />,
    route: Route,
  },
  {
    path: routes.underconstruction,
    element: <UnderConstruction />,
    route: Route,
  },
  {
    path: routes.comingSoon,
    element: <ComingSoon />,
    route: Route,
  },
];
