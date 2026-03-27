package com.academy.service;

import com.academy.dto.response.EnrollmentResponse;
import com.academy.dto.response.InstructorStudentDetailResponse;
import com.academy.dto.response.InstructorStudentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Course;
import com.academy.entity.CourseEnrollment;
import com.academy.entity.User;
import com.academy.entity.enums.EnrollmentType;

import java.util.List;
import java.util.UUID;

public interface EnrollmentService {

    boolean isEnrolled(User user, Course course);

    boolean hasAccess(User user, Course course);

    CourseEnrollment getEnrollment(User user, Course course);

    EnrollmentResponse enrollUser(UUID courseId);

    void enrollUserInCourse(User user, Course course, EnrollmentType type);

    void enrollUserInCourse(User user, Course course, boolean isPurchase);

    void enrollUserInAllBeginnerCourses(User user);

    boolean isUserEnrolled(User user, Course course);

    void revokeEnrollment(User user, Course course);

    void deactivateSubscriptionEnrollments(User user);

    PageResponse<EnrollmentResponse> getMyEnrollments(int page, int size);

    List<EnrollmentResponse> getContinueWatching(int limit);

    PageResponse<EnrollmentResponse> getCourseStudents(UUID courseId, int page, int size);

    void updateLastAccessed(UUID enrollmentId, UUID lessonId);

    void updateProgress(UUID enrollmentId);

    void markCourseComplete(UUID enrollmentId);

    long getStudentCountForInstructor();

    long getEnrollmentCountForCourse(UUID courseId);

    PageResponse<InstructorStudentResponse> getMyStudents(int page, int size, String search);

    InstructorStudentDetailResponse getStudentDetail(UUID studentId);
}
