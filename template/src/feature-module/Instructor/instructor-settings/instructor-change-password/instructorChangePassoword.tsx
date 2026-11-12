import React from 'react';
import InstructorSettingsLink from '../settings-link/instructorSettingsLink';
import StudentChangePassword from '../../../student/student-settings/student-change-password/studentChangePassword';

/**
 * Instructor › Settings › Security.
 *
 * This page used to be a template form with no handler (submitting reloaded the
 * page and changed nothing, while showing "richard@example.com"). It now uses the
 * same working change-password form as students (PUT /profile/password).
 */
const InstructorChangePassoword = () => <StudentChangePassword links={<InstructorSettingsLink />} />;

export default InstructorChangePassoword;
