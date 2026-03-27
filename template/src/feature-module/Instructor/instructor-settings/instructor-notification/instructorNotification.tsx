import React from 'react';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import InstructorSettingsLink from '../settings-link/instructorSettingsLink';

const InstructorNotification: React.FC = () => {
  return (
    <LuxuryDashboardLayout>
      <div className="content">
        <div className="mb-3">
          <h5>Settings</h5>
        </div>

        <InstructorSettingsLink />

        {/* General Notifications */}
        <form>
          <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
            <h5 className="fs-18 mb-0">General Notifications</h5>
            <button className="btn btn-sm btn-dark" type="button">
              Toggle all
            </button>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Student Questions</h6>
              <small>
                Notify me when a student asks a question in the Q&amp;A section
              </small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkPrivacy1"
                defaultChecked
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Feedback Received</h6>
              <small>Notify me when receive feedback from students</small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkPrivacy7"
                defaultChecked
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Quiz/Exam Results Submission</h6>
              <small>Notify me when quiz or exam results are submitted</small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input className="form-check-input" type="checkbox" id="checkPrivacy4" />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Forum Activity</h6>
              <small>
                Notify me about new posts or replies in course discussion forums.
              </small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input className="form-check-input" type="checkbox" id="checkPrivacy5" />
            </div>
          </div>
        </form>

        <div className="text-center my-5" />

        {/* Email Notifications */}
        <form>
          <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
            <h5 className="fs-18 mb-0">Email Notifications</h5>
            <button className="btn btn-sm btn-dark" type="button">
              Toggle all
            </button>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Course Enrolment</h6>
              <small>Send me emails when a new student enrolls the course</small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkPrivacy6"
                defaultChecked
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Assignment Submission</h6>
              <small>Send me email whenever an assignment is submitted by a student</small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkPrivacy7_email"
                defaultChecked
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Course Comments</h6>
              <small>
                Get notified about comments on your posts and replies to your comments.
              </small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input className="form-check-input" type="checkbox" id="checkPrivacy8" />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Course Reminders</h6>
              <small>
                Receive booking assistance reminders to stay updated on your scheduled sessions.
              </small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input className="form-check-input" type="checkbox" id="checkPrivacy9" />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>System Updates</h6>
              <small>Send me emails about updates to the LMS platform</small>
            </div>
            <div className="form-check form-switch form-check-md mb-0 ms-3">
              <input className="form-check-input" type="checkbox" id="checkPrivacy17" />
            </div>
          </div>
        </form>
      </div>
    </LuxuryDashboardLayout>
  );
};

export default InstructorNotification;
