import { all_routes } from './all_routes';

type CourseLike = { id: string; courseType?: string; masterclassFormat?: string | null };

/**
 * Where an instructor's "Manage" action should go.
 * A LIVE masterclass has no lessons to build — it is managed through its
 * reservations; every other course opens the curriculum manager.
 */
export const instructorManageHref = (course: CourseLike): string =>
  course.courseType === 'MASTERCLASS' && course.masterclassFormat === 'LIVE'
    ? `${all_routes.instructorMasterclassReservations}?course=${course.id}`
    : `${all_routes.instructorCourseManage}/${course.id}`;
