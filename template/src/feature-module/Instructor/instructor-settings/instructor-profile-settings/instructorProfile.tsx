import React from 'react';
import InstructorSettingsLink from '../settings-link/instructorSettingsLink';
import StudentSettings from '../../../student/student-settings/studentSettings';

/**
 * Instructor › Settings › Profile.
 *
 * This page used to be a template form prefilled with demo data ("Eugene",
 * "instructordemo"…) whose "Update Profile" button saved nothing. It now uses
 * the same working profile form as students (name, phone, bio, social links,
 * avatar), with the instructor settings tabs.
 */
const InstructorProfileSettings = () => <StudentSettings links={<InstructorSettingsLink />} />;

export default InstructorProfileSettings;
