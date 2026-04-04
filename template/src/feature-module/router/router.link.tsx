import React, { lazy } from "react";
import { Route } from "react-router";
import { all_routes } from "./all_routes";
import SubscriptionGuard from "../common/SubscriptionGuard";
import RoleGuard from "../common/RoleGuard";

// ── Lazy page imports (split each route into its own chunk) ──────────────────
const HomeOne                       = lazy(() => import("../HomePages/home-one/homeone"));
const CourseGrid                    = lazy(() => import("../Courses/courses-grid/courseGrid"));
const CourseList                    = lazy(() => import("../Courses/course-list/courseList"));
const CourseCategory                = lazy(() => import("../Courses/course-category/courseCategory"));
const CourseCategoryTwo             = lazy(() => import("../Courses/course-category-two/courseCategoryTwo"));
const CourseCategoryThree           = lazy(() => import("../Courses/course-category-three/courseCategoryThree"));
const CourseResume                  = lazy(() => import("../Courses/course-resume/courseResume"));
const CourseWatch                   = lazy(() => import("../Courses/course-watch/courseWatch"));
const CourseCart                    = lazy(() => import("../Courses/course-cart/courseCart"));
const CourseCheckout                = lazy(() => import("../Courses/course-checkout/courseCheckout"));
const CourseDetails                 = lazy(() => import("../Courses/course-details/courseDetails"));
const CourseDetailsTwo              = lazy(() => import("../Courses/course-details-2/courseDetailsTwo"));
const AddNewCourse                  = lazy(() => import("../Courses/add-newCourse/addNewCourse"));
const CourseManage                  = lazy(() => import("../Instructor/instructor-course/CourseManage"));

const InstructorDashboard           = lazy(() => import("../Instructor/instructor-dashboard/instructorDashboard"));
const InstructorProfile             = lazy(() => import("../Instructor/instructor-profile/instructorProfile"));
const InstructorCertificate         = lazy(() => import("../Instructor/instructor-certificate/instructorCertificate"));
const InstructorCourse              = lazy(() => import("../Instructor/instructor-course/instructorCourse"));
const InstructorCourseGrid          = lazy(() => import("../Instructor/instructor-course/instructorCourseGrid"));
const InstructorAnnouncements       = lazy(() => import("../Instructor/instructor-announcements/instructorAnnouncements"));
const InstructorAssignment          = lazy(() => import("../Instructor/instructor-assignment/instructorAssignment"));
const InstructorQuiz                = lazy(() => import("../Instructor/instructor-quiz/instructorQuiz"));
const InstructorQuizResult          = lazy(() => import("../Instructor/instructor-quiz-result/instructorQuizResult"));
const InstructorQuizQuestions       = lazy(() => import("../Instructor/instructor-quiz-question/instructorQuizQuestions"));
const InstructorEarning             = lazy(() => import("../Instructor/instructor-earning/instructorEarning"));
const InstructorStatement           = lazy(() => import("../Instructor/instructor-statement/instructorStatement"));
const InstructorMessage             = lazy(() => import("../Instructor/instructor-message/instructorMessage"));
const InstructorWishlist            = lazy(() => import("../Instructor/instructor-wishlist/instructorWishlist"));
const InstructorReviews             = lazy(() => import("../Instructor/instructor-reviews/instructorReviews"));
const InstructorOrders              = lazy(() => import("../Instructor/instructor-orders/instructorOrders"));
const InstructorReferral            = lazy(() => import("../Instructor/instructor-referral/instructorReferral"));
const InstructorProfileSettings     = lazy(() => import("../Instructor/instructor-settings/instructor-profile-settings/instructorProfile"));
const InstructorChangePassoword     = lazy(() => import("../Instructor/instructor-settings/instructor-change-password/instructorChangePassoword"));
const InstructorPlanSettings        = lazy(() => import("../Instructor/instructor-settings/instructor-plans-settings/instructorPlanSettings"));
const InstructorSocialprofileSettings = lazy(() => import("../Instructor/instructor-settings/instructor-socialprofile-settings/instructorSocialprofileSettings"));
const InstructorLinkedAccounts      = lazy(() => import("../Instructor/instructor-settings/instructor-linked-accounts/instructorLinkedAccounts"));
const InstructorNotification        = lazy(() => import("../Instructor/instructor-settings/instructor-notification/instructorNotification"));
const InstructorIntegrations        = lazy(() => import("../Instructor/instructor-settings/instructor-integrations/instructorIntegrations"));
const InstructorWithdraw            = lazy(() => import("../Instructor/instructor-settings/instructor-withdraw/instructorWithdraw"));
const StudentGrid                   = lazy(() => import("../Instructor/student-grid/studentGrid"));
const StudentList                   = lazy(() => import("../Instructor/student-list/studentList"));
const StudentsDetails               = lazy(() => import("../Instructor/student-details/studentsDetails"));

const StudentDashboard              = lazy(() => import("../student/dashboard/studentDashboard"));
const StudentProfile                = lazy(() => import("../student/student-profile/studentProfile"));
const StudentCourse                 = lazy(() => import("../student/student-course/studentCourse"));
const StudentCertificates           = lazy(() => import("../student/student-certificates/student-certificates"));
const StudentWishlist               = lazy(() => import("../student/student-wishlist/studentWishlist"));
const StudentReviews                = lazy(() => import("../student/student-reviews/studentReviews"));
const StudentQuiz                   = lazy(() => import("../student/student-quiz/studentQuiz"));
const StudentQuizQuestion           = lazy(() => import("../student/student-quiz-question/studentQuizQuestion"));
const StudentAssignment             = lazy(() => import("../student/student-assignment/studentAssignment"));
const StudentSubscription           = lazy(() => import("../student/student-subscription/studentSubscription"));
const StudentOrder                  = lazy(() => import("../student/student-order-history/studentOrder"));
const StudentRefferal               = lazy(() => import("../student/student-refferal/studentRefferal"));
const StudentMessage                = lazy(() => import("../student/student-message/studentMessage"));
const StudentTickets                = lazy(() => import("../student/student-tickets/studentTickets"));
const StudentSettings               = lazy(() => import("../student/student-settings/studentSettings"));
const StudentChangePassword         = lazy(() => import("../student/student-settings/student-change-password/studentChangePassword"));
const StudentSocialProfile          = lazy(() => import("../student/student-settings/student-social-profile/studentSocialProfile"));
const StudentLinkedAccounts         = lazy(() => import("../student/student-settings/student-linked-accounts/studentLinkedAccounts"));
const StudentNotification           = lazy(() => import("../student/student-settings/student-notifications/studentNotification"));
const StudentBillingAddress         = lazy(() => import("../student/student-settings/student-billing-address/studentBillingAddress"));

const AdminDashboard                = lazy(() => import("../admin/dashboard/adminDashboard"));
const AdminUsers                    = lazy(() => import("../admin/users/adminUsers"));
const AdminCourses                  = lazy(() => import("../admin/courses/adminCourses"));
const AdminPendingCourses           = lazy(() => import("../admin/courses/adminPendingCourses"));
const AdminCategories               = lazy(() => import("../admin/categories/adminCategories"));
const AdminTransactions             = lazy(() => import("../admin/transactions/adminTransactions"));
const AdminTickets                  = lazy(() => import("../admin/tickets/adminTickets"));
const AdminSettings                 = lazy(() => import("../admin/settings/adminSettings"));
const AdminAnalytics                = lazy(() => import("../admin/analytics/adminAnalytics"));
const AdminSubscriptions            = lazy(() => import("../admin/subscriptions/adminSubscriptions"));
const AdminReports                  = lazy(() => import("../admin/reports/adminReports"));

const BlogGrid                      = lazy(() => import("../blog/blog-layouts/blogGrid"));
const BlogGrid2                     = lazy(() => import("../blog/blog-layouts/blogGrid2"));
const BlogGrid3                     = lazy(() => import("../blog/blog-layouts/blogGrid3"));
const BlogCarousal                  = lazy(() => import("../blog/blog-layouts/blogCarousal"));
const BlogMasonry                   = lazy(() => import("../blog/blog-layouts/blogMasonry"));
const BlogLeftSidebar               = lazy(() => import("../blog/blog-layouts/blogLeftSidebar"));
const BlogRightSidebar              = lazy(() => import("../blog/blog-layouts/blogRightSidebar"));
const BlogDetailsLeftSidebar        = lazy(() => import("../blog/blog-details/blogDetailsLeftSidebar"));
const BlogDetailsRightSidebar       = lazy(() => import("../blog/blog-details/blogDetailsRightSidebar"));
const CommunityPage                 = lazy(() => import("../community/CommunityPage"));
const CommunityPostDetail           = lazy(() => import("../community/CommunityPostDetail"));
const InstructorGrid                = lazy(() => import("../Pages/instructor/instructor-grid/instructorGrid"));
const InstructorList                = lazy(() => import("../Pages/instructor/instructor-list/instructorList"));
const InstructorDetails             = lazy(() => import("../Pages/instructor/instructor-details/instructor-details"));
const AboutUs                       = lazy(() => import("../Pages/about-us/aboutUs"));
const ContactUs                     = lazy(() => import("../Pages/contact-us/contactUs"));
const Notification                  = lazy(() => import("../Pages/notification/notification"));
const BecomeInstructor              = lazy(() => import("../Pages/become-instructor/becomeInstructor"));
const Testimonials                  = lazy(() => import("../Pages/testimonials/testimonials"));
const PricePlanning                 = lazy(() => import("../Pages/price-planning/pricePlanning"));
const Faq                           = lazy(() => import("../Pages/faq/faq"));
const TermsCondition                = lazy(() => import("../Pages/terms-condition/termsCondition"));
const PrivacyPolicy                 = lazy(() => import("../Pages/privacy-policy/privacyPolicy"));
const Login                         = lazy(() => import("../auth/login/login"));
const Register                      = lazy(() => import("../auth/register/register"));
const ForgortPassword               = lazy(() => import("../auth/forgot-password/forgortPassword"));
const SetPassword                   = lazy(() => import("../auth/set-password/setPassword"));
const Otp                           = lazy(() => import("../auth/otp/otp"));
const LockScreen                    = lazy(() => import("../auth/lock-screen/lockScreen"));
const Error404                      = lazy(() => import("../auth/error/error-404/error400"));
const Error500                      = lazy(() => import("../auth/error/error-500/error500"));
const ComingSoon                    = lazy(() => import("../auth/coming-soon/comingSoon"));
const UnderConstruction             = lazy(() => import("../auth/underconstruction/underConstruction"));

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
    path: routes.instructorWishlist,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorWishlist /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorReviews,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorReviews /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorQuizAttempts,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorQuizResult /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorOrders,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorOrders /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorChat,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorMessage /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.instructorReferral,
    element: <RoleGuard allowedRoles={['INSTRUCTOR', 'ADMIN']}><InstructorReferral /></RoleGuard>,
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
    path: routes.studentSubscription,
    element: <RoleGuard allowedRoles={['STUDENT']}><StudentSubscription /></RoleGuard>,
    route: Route,
  },
  {
    path: '/student/student-assignments',
    element: <SubscriptionGuard><StudentAssignment /></SubscriptionGuard>,
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
  {
    path: routes.adminAnalytics,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminAnalytics /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminSubscriptions,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminSubscriptions /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.adminReports,
    element: <RoleGuard allowedRoles={['ADMIN']}><AdminReports /></RoleGuard>,
    route: Route,
  },
  {
    path: routes.community,
    element: <CommunityPage />,
    route: Route,
  },
  {
    path: routes.communityPost,
    element: <CommunityPostDetail />,
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
