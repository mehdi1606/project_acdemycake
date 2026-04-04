package com.academy.service.impl;

import com.academy.dto.request.CreateCourseRequest;
import com.academy.dto.request.UpdateCourseRequest;
import com.academy.dto.response.*;
import com.academy.entity.Course;
import com.academy.entity.CourseCategory;
import com.academy.entity.User;
import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.UserRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CategoryService;
import com.academy.service.CourseService;
import com.academy.service.FileStorageService;
import com.academy.service.UserService;
import com.github.slugify.Slugify;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.academy.config.CacheConfig;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final CategoryService categoryService;
    private final FileStorageService fileStorageService;
    private final Slugify slugify = Slugify.builder().build();

    @Override
    public Course findById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
    }

    @Override
    @Cacheable(value = CacheConfig.COURSE_DETAIL, key = "#id")
    public CourseResponse getCourseById(UUID id) {
        Course course = findById(id);
        return buildResponse(course);
    }

    @Override
    @Cacheable(value = CacheConfig.COURSE_DETAIL, key = "'slug-' + #slug")
    public CourseResponse getCourseBySlug(String slug) {
        Course course = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "slug", slug));
        return buildResponse(course);
    }

    @Override
    public PageResponse<CourseResponse> getAllCourses(int page, int size, String search,
                                                       UUID categoryId, CourseLevel level, String sortBy) {
        Sort sort = getSort(sortBy);
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        Page<Course> courses;

        if (search != null && !search.isBlank()) {
            courses = courseRepository.searchPublishedCourses(search, pageRequest);
        } else if (categoryId != null) {
            CourseCategory category = categoryService.findById(categoryId);
            courses = courseRepository.findPublishedByCategory(category, pageRequest);
        } else if (level != null) {
            courses = courseRepository.findPublishedByLevel(level, pageRequest);
        } else {
            courses = courseRepository.findByStatus(CourseStatus.PUBLISHED, pageRequest);
        }

        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    public PageResponse<CourseResponse> getBeginnerCourses(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> courses = courseRepository.findPublishedBeginnerCourses(pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    public PageResponse<CourseResponse> getPremiumCourses(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> courses = courseRepository.findPublishedPremiumCourses(pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    @Cacheable(value = CacheConfig.COURSES, key = "'popular-' + #page + '-' + #size")
    public PageResponse<CourseResponse> getPopularCourses(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Course> courses = courseRepository.findPopularCourses(pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    @Cacheable(value = CacheConfig.COURSES, key = "'latest-' + #page + '-' + #size")
    public PageResponse<CourseResponse> getLatestCourses(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Course> courses = courseRepository.findLatestCourses(pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    public PageResponse<CourseResponse> getCoursesByCategory(UUID categoryId, int page, int size) {
        CourseCategory category = categoryService.findById(categoryId);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> courses = courseRepository.findPublishedByCategory(category, pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    public PageResponse<CourseResponse> getCoursesByInstructor(UUID instructorId, int page, int size) {
        User instructor = userService.findById(instructorId);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> courses = courseRepository.findPublishedByInstructor(instructor, pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    public CurriculumResponse getCourseCurriculum(UUID courseId) {
        Course course = findById(courseId);

        return CurriculumResponse.builder()
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .totalModules(course.getModules().size())
                .totalLessons(course.getModules().stream()
                        .mapToInt(m -> m.getLessons().size())
                        .sum())
                .totalDurationSeconds(course.getModules().stream()
                        .mapToInt(m -> m.getTotalDurationSeconds())
                        .sum())
                .modules(course.getModules().stream()
                        .map(m -> ModuleResponse.fromEntity(m, true))
                        .collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public CourseResponse createCourse(CreateCourseRequest request) {
        User instructor = getCurrentUser();

        if (instructor.getRole() != UserRole.INSTRUCTOR && instructor.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only instructors can create courses");
        }

        String baseSlug = slugify.slugify(request.getTitle());
        String slug = generateUniqueSlug(baseSlug);

        Course course = Course.builder()
                .title(request.getTitle())
                .slug(slug)
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .instructor(instructor)
                .isBeginner(request.getIsBeginner() != null ? request.getIsBeginner() : false)
                .requiresPurchase(request.getRequiresPurchase() != null ? request.getRequiresPurchase() : false)
                .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                .originalPrice(request.getOriginalPrice())
                .level(request.getLevel() != null ? request.getLevel() : CourseLevel.BEGINNER)
                .language(request.getLanguage() != null ? request.getLanguage() : "fr")
                .status(CourseStatus.PENDING_REVIEW)
                .whatYouWillLearn(request.getWhatYouWillLearn())
                .requirements(request.getRequirements())
                .targetAudience(request.getTargetAudience())
                .tags(request.getTags())
                .build();

        if (request.getCategoryId() != null) {
            CourseCategory category = categoryService.findById(request.getCategoryId());
            course.setCategory(category);
        }

        course = courseRepository.saveAndFlush(course);
        log.info("Course created: {} (id: {}) by instructor: {}", course.getTitle(), course.getId(), instructor.getEmail());

        return buildResponse(course);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL}, allEntries = true)
    public CourseResponse updateCourse(UUID id, UpdateCourseRequest request) {
        Course course = findById(id);
        verifyInstructorAccess(course);

        if (request.getTitle() != null) {
            course.setTitle(request.getTitle());
            if (!course.getSlug().startsWith(slugify.slugify(request.getTitle()))) {
                course.setSlug(generateUniqueSlug(slugify.slugify(request.getTitle())));
            }
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getShortDescription() != null) {
            course.setShortDescription(request.getShortDescription());
        }
        if (request.getCategoryId() != null) {
            CourseCategory category = categoryService.findById(request.getCategoryId());
            course.setCategory(category);
        }
        if (request.getIsBeginner() != null) {
            course.setIsBeginner(request.getIsBeginner());
        }
        if (request.getRequiresPurchase() != null) {
            course.setRequiresPurchase(request.getRequiresPurchase());
        }
        if (request.getPrice() != null) {
            course.setPrice(request.getPrice());
        }
        if (request.getOriginalPrice() != null) {
            course.setOriginalPrice(request.getOriginalPrice());
        }
        if (request.getLevel() != null) {
            course.setLevel(request.getLevel());
        }
        if (request.getLanguage() != null) {
            course.setLanguage(request.getLanguage());
        }
        if (request.getWhatYouWillLearn() != null) {
            course.setWhatYouWillLearn(request.getWhatYouWillLearn());
        }
        if (request.getRequirements() != null) {
            course.setRequirements(request.getRequirements());
        }
        if (request.getTargetAudience() != null) {
            course.setTargetAudience(request.getTargetAudience());
        }
        if (request.getTags() != null) {
            course.setTags(request.getTags());
        }

        course = courseRepository.save(course);
        log.info("Course updated: {}", course.getTitle());

        return buildResponse(course);
    }

    @Override
    @Transactional
    public String uploadThumbnail(UUID courseId, MultipartFile file) {
        Course course = findById(courseId);
        verifyInstructorAccess(course);

        if (course.getThumbnailUrl() != null) {
            fileStorageService.deleteFile(course.getThumbnailUrl());
        }

        // Store relative path in DB (portable across environments)
        String relativePath = fileStorageService.storeFile(file, "courses/thumbnails");
        course.setThumbnailUrl(relativePath);
        courseRepository.save(course);

        // Return full URL to the frontend
        return fileStorageService.getFileUrl(relativePath);
    }

    @Override
    @Transactional
    public void deleteCourse(UUID id) {
        Course course = findById(id);
        verifyInstructorAccess(course);

        if (course.getEnrolledCount() > 0) {
            throw new BadRequestException("Cannot delete a course with enrolled students");
        }

        courseRepository.delete(course);
        log.info("Course deleted: {}", course.getTitle());
    }

    @Override
    @Transactional
    public void publishCourse(UUID id) {
        Course course = findById(id);
        verifyInstructorAccess(course);

        if (course.getModules().isEmpty()) {
            throw new BadRequestException("Cannot publish a course without modules");
        }

        boolean hasLessons = course.getModules().stream()
                .anyMatch(m -> !m.getLessons().isEmpty());

        if (!hasLessons) {
            throw new BadRequestException("Cannot publish a course without lessons");
        }

        course.setStatus(CourseStatus.PENDING_REVIEW);
        courseRepository.save(course);
        log.info("Course submitted for review: {}", course.getTitle());
    }

    @Override
    @Transactional
    public void archiveCourse(UUID id) {
        Course course = findById(id);
        verifyInstructorAccess(course);

        course.setStatus(CourseStatus.ARCHIVED);
        courseRepository.save(course);
        log.info("Course archived: {}", course.getTitle());
    }

    @Override
    @Transactional
    public void approveCourse(UUID id) {
        Course course = findById(id);

        course.setStatus(CourseStatus.PUBLISHED);
        course.setPublishedAt(LocalDateTime.now());
        courseRepository.save(course);
        log.info("Course approved and published: {}", course.getTitle());
    }

    @Override
    @Transactional
    public void rejectCourse(UUID id, String reason) {
        Course course = findById(id);

        if (course.getStatus() != CourseStatus.PENDING_REVIEW) {
            throw new BadRequestException("Only pending courses can be rejected");
        }

        course.setStatus(CourseStatus.DRAFT);
        courseRepository.save(course);
        log.info("Course rejected: {} - Reason: {}", course.getTitle(), reason);
    }

    @Override
    public PageResponse<CourseResponse> getInstructorCourses(int page, int size) {
        User instructor = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> courses = courseRepository.findByInstructor(instructor, pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    public PageResponse<CourseResponse> getPendingCourses(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> courses = courseRepository.findByStatus(CourseStatus.PENDING_REVIEW, pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    public PageResponse<CourseResponse> getAllCoursesForAdmin(int page, int size, String status) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> courses;

        if (status != null && !status.isBlank()) {
            try {
                CourseStatus courseStatus = CourseStatus.valueOf(status.toUpperCase());
                courses = courseRepository.findByStatus(courseStatus, pageRequest);
            } catch (IllegalArgumentException e) {
                courses = courseRepository.findAll(pageRequest);
            }
        } else {
            courses = courseRepository.findAll(pageRequest);
        }

        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    @Cacheable(value = CacheConfig.PLATFORM_STATS, key = "'stats'")
    public PlatformStatsResponse getPlatformStats() {
        long totalCourses = courseRepository.countPublishedCourses();
        long totalEnrollments = courseEnrollmentRepository.count();
        long totalInstructors = userRepository.countByRole(UserRole.INSTRUCTOR);
        long totalStudents = userRepository.countByRole(UserRole.STUDENT);

        return PlatformStatsResponse.builder()
                .totalCourses(totalCourses)
                .totalEnrollments(totalEnrollments)
                .totalInstructors(totalInstructors)
                .totalStudents(totalStudents)
                .build();
    }

    @Override
    public java.util.List<FeaturedInstructorResponse> getFeaturedInstructors(int limit) {
        // Get instructors with most published courses
        PageRequest pageRequest = PageRequest.of(0, limit);
        java.util.List<User> instructors = userRepository.findByRole(UserRole.INSTRUCTOR, pageRequest).getContent();

        return instructors.stream().map(instructor -> {
            long courseCount = courseRepository.countByInstructor(instructor);
            long studentCount = courseEnrollmentRepository.countStudentsByInstructor(instructor);

            // Calculate average rating from instructor's courses
            Page<Course> courses = courseRepository.findPublishedByInstructor(instructor, PageRequest.of(0, 100));
            double avgRating = courses.getContent().stream()
                    .filter(c -> c.getRatingAverage() != null && c.getRatingAverage().doubleValue() > 0)
                    .mapToDouble(c -> c.getRatingAverage().doubleValue())
                    .average()
                    .orElse(0.0);

            return FeaturedInstructorResponse.builder()
                    .id(instructor.getId())
                    .fullName(instructor.getFullName())
                    .avatarUrl(instructor.getAvatarUrl())
                    .bio(instructor.getBio())
                    .totalCourses(courseCount)
                    .totalStudents(studentCount)
                    .averageRating(Math.round(avgRating * 10.0) / 10.0)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public PublicInstructorProfileResponse getInstructorPublicProfile(UUID instructorId) {
        User instructor = userService.findById(instructorId);

        long courseCount = courseRepository.countByInstructor(instructor);
        long studentCount = courseEnrollmentRepository.countStudentsByInstructor(instructor);

        Page<Course> courses = courseRepository.findPublishedByInstructor(instructor, PageRequest.of(0, 200));
        double avgRating = courses.getContent().stream()
                .filter(c -> c.getRatingAverage() != null && c.getRatingAverage().doubleValue() > 0)
                .mapToDouble(c -> c.getRatingAverage().doubleValue())
                .average()
                .orElse(0.0);

        long totalReviews = courses.getContent().stream()
                .mapToLong(c -> c.getRatingCount() != null ? c.getRatingCount() : 0)
                .sum();

        return PublicInstructorProfileResponse.builder()
                .id(instructor.getId())
                .fullName(instructor.getFullName())
                .avatarUrl(instructor.getAvatarUrl())
                .bio(instructor.getBio())
                .socialLinks(instructor.getSocialLinks())
                .totalCourses(courseCount)
                .totalStudents(studentCount)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .totalReviews(totalReviews)
                .build();
    }

    private String generateUniqueSlug(String baseSlug) {
        String slug = baseSlug;
        int counter = 1;
        while (courseRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }
        return slug;
    }

    private Sort getSort(String sortBy) {
        if (sortBy == null) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sortBy) {
            case "popular" -> Sort.by(Sort.Direction.DESC, "enrolledCount");
            case "rating" -> Sort.by(Sort.Direction.DESC, "ratingAverage");
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "newest" -> Sort.by(Sort.Direction.DESC, "publishedAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    /**
     * Builds a CourseResponse with absolute file URLs for thumbnailUrl and
     * instructor avatarUrl, so the frontend can use them directly without
     * having to construct the path.
     */
    private CourseResponse buildResponse(Course course) {
        CourseResponse response = CourseResponse.fromEntity(course);
        // Convert relative storage path → full HTTP URL
        response.setThumbnailUrl(fileStorageService.getFileUrl(course.getThumbnailUrl()));
        if (response.getInstructor() != null && course.getInstructor() != null) {
            response.getInstructor().setAvatarUrl(
                    fileStorageService.getFileUrl(course.getInstructor().getAvatarUrl())
            );
        }
        return response;
    }

    private void verifyInstructorAccess(Course course) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN &&
                !course.getInstructor().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You don't have permission to modify this course");
        }
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
