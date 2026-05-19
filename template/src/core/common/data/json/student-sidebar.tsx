import { all_routes } from "../../../../feature-module/router/all_routes";

export const studentSidebarData = [
    {
        title:'Dashboard',
        i18nKey:'student.sidebar.dashboard',
        icon:'isax isax-grid-35',
        route: all_routes.studentDashboard
    },
    {
        title:'My Profile',
        i18nKey:'student.sidebar.profile',
        icon:'fa-solid fa-user',
        route: all_routes.studentProfile
    },
    {
        title:'Enrolled Courses',
        i18nKey:'student.sidebar.myCourses',
        icon:'isax isax-teacher5',
        route: all_routes.studentCourses
    },
    {
        title:'Certificates',
        i18nKey:'student.sidebar.certificates',
        icon:'isax isax-note-215',
        route: all_routes.studentCertificates
    },

    {
        title:'Wishlist',
        i18nKey:'student.sidebar.wishlist',
        icon:'isax isax-heart5',
        route: all_routes.studentWishlist
    },
    {
        title:'Reviews',
        i18nKey:'student.sidebar.reviews',
        icon:'isax isax-star5',
        route: all_routes.studentReviews
    },
    {
        title:'Assignments',
        i18nKey:'student.sidebar.assignments',
        icon:'isax isax-document-text5',
        route: all_routes.studentAssignments
    },
    {
        title:'Order History',
        i18nKey:'student.sidebar.orders',
        icon:'isax isax-shopping-cart5',
        route: all_routes.studentOrderHistory
    },
    {
        title:'Messages',
        i18nKey:'student.sidebar.messages',
        icon:'isax isax-messages-35',
        route: all_routes.studentMessage
    },
    {
        title:'Support Tickets',
        i18nKey:'student.sidebar.tickets',
        icon:'isax isax-ticket5',
        route: all_routes.studentTickets
    },


]
