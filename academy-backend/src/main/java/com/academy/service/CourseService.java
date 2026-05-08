package com.academy.service;

import com.academy.dto.request.CreateCourseRequest;
import com.academy.dto.request.UpdateCourseRequest;
import com.academy.dto.response.*;
import com.academy.entity.Course;
import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface CourseService {

    Course findById(UUID id);

    CourseResponse getCourseById(UUID id);

    CourseResponse getCourseBySlug(String slug);

    PageResponse<CourseResponse> getAllCourses(int page, int size, String search, UUID categoryId,
                                                CourseLevel level, String sortBy, CourseType courseType);

    PageResponse<CourseResponse> getBeginnerCourses(int page, int size);

    PageResponse<CourseResponse> getPremiumCourses(int page, int size);

    PageResponse<CourseResponse> getPopularCourses(int page, int size);

    PageResponse<CourseResponse> getLatestCourses(int page, int size);

    PageResponse<CourseResponse> getCoursesByCategory(UUID categoryId, int page, int size);

    PageResponse<CourseResponse> getCoursesByInstructor(UUID instructorId, int page, int size);

    CurriculumResponse getCourseCurriculum(UUID courseId);

    CourseResponse createCourse(CreateCourseRequest request);

    CourseResponse updateCourse(UUID id, UpdateCourseRequest request);

    String uploadThumbnail(UUID courseId, MultipartFile file);

    void deleteCourse(UUID id);

    void publishCourse(UUID id);

    void archiveCourse(UUID id);

    void approveCourse(UUID id);

    void rejectCourse(UUID id, String reason);

    PageResponse<CourseResponse> getInstructorCourses(int page, int size);

    PageResponse<CourseResponse> getPendingCourses(int page, int size);

    PageResponse<CourseResponse> getAllCoursesForAdmin(int page, int size, String status);

    PlatformStatsResponse getPlatformStats();

    List<FeaturedInstructorResponse> getFeaturedInstructors(int limit);

    PublicInstructorProfileResponse getInstructorPublicProfile(UUID instructorId);
}
