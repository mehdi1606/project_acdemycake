import { all_routes } from "../../../../feature-module/router/all_routes";

export const instructorSidebarData = [
    {
        title:'Dashboard',
        i18nKey:'instructor.sidebar.dashboard',
        icon:'isax isax-grid-35',
        route: all_routes.instructorDashboard
    },
    {
        title:'My Profile',
        i18nKey:'instructor.sidebar.profile',
        icon:'fa-solid fa-user',
        route: all_routes.instructorProfile
    },
    {
        title:'Courses',
        i18nKey:'instructor.sidebar.myCourses',
        icon:'isax isax-teacher5',
        route: all_routes.instructorCourse
    },
    {
        title:'Announcements',
        i18nKey:'instructor.sidebar.announcements',
        icon:'isax isax-volume-high5',
        route: all_routes.instructorAnnouncements
    },
    {
        title:'Assignments',
        i18nKey:'instructor.sidebar.assignments',
        icon:'isax isax-clipboard-text5',
        route: all_routes.instructorAssignment
    },
    {
        title:'Students',
        i18nKey:'instructor.sidebar.students',
        icon:'isax isax-profile-2user5',
        route: all_routes.studentsList
    },
    {
        title:'Quiz',
        i18nKey:'instructor.sidebar.quizzes',
        icon:'isax isax-award5',
        route: all_routes.instructorQuiz,
        subRoute: all_routes.instructorQA
    },
    {
        title:'Quiz Results',
        i18nKey:'instructor.sidebar.quizResults',
        icon:'isax isax-medal-star5',
        route: all_routes.instructorQuizResult
    },
    {
        title:'Certificates',
        i18nKey:'instructor.sidebar.certificates',
        icon:'isax isax-note-215',
        route: all_routes.instructorCertificate
    },
    {
        title:'Earnings',
        i18nKey:'instructor.sidebar.earnings',
        icon:'isax isax-wallet-add5',
        route: all_routes.instructorEarning
    },
    {
        title:'Payout',
        i18nKey:'instructor.sidebar.payout',
        icon:'isax isax-coin-15',
        route: all_routes.instructorPayout
    },
    {
        title:'Statements',
        i18nKey:'instructor.sidebar.statement',
        icon:'isax isax-shopping-cart5',
        route: all_routes.instructorStatements
    },
    {
        title:'Messages',
        i18nKey:'instructor.sidebar.messages',
        icon:'isax isax-messages-35',
        route: all_routes.instructorMessage
    },
    {
        title:'Support Tickets',
        i18nKey:'instructor.sidebar.tickets',
        icon:'isax isax-ticket5',
        route: all_routes.instructorTickets
    },


]
