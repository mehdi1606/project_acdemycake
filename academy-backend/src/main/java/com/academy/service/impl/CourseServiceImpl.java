package com.academy.service.impl;

import com.academy.dto.request.CreateCourseRequest;
import com.academy.dto.request.UpdateCourseRequest;
import com.academy.dto.response.*;
import com.academy.entity.Course;
import com.academy.entity.CourseCategory;
import com.academy.entity.User;
import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseType;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.MasterclassFormat;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.security.HtmlSanitizer;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.UserRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CategoryService;
import com.academy.service.CourseService;
import com.academy.service.FileStorageService;
import com.academy.service.SettingsService;
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

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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

    @PersistenceContext
    private EntityManager entityManager;
    private final CategoryService categoryService;
    private final FileStorageService fileStorageService;
    private final com.academy.service.TranslationService translationService;
    private final SettingsService settingsService;
    private final com.academy.service.MasterclassBookingService masterclassBookingService;
    private final com.academy.service.NotificationService notificationService;
    private final com.academy.repository.CoursePurchaseRepository coursePurchaseRepository;
    private final com.academy.repository.CertificateRepository certificateRepository;
    private final Slugify slugify = Slugify.builder().build();

    @Override
    public Course findById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
    }

    @Override
    // The response is localised (title/description) — the language is part of the key.
    @Cacheable(value = CacheConfig.COURSE_DETAIL, key = "#id + '-' + T(org.springframework.context.i18n.LocaleContextHolder).getLocale().getLanguage()")
    public CourseResponse getCourseById(UUID id) {
        Course course = findById(id);
        return buildResponse(course);
    }

    @Override
    public CourseResponse getCourseBySlug(String slug) {
        Course course = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "slug", slug));
        CourseResponse response = buildResponse(course);
        // Enrich with enrollment status for logged-in users (not cached — user-specific)
        try {
            User user = getCurrentUserSafe();
            if (user != null) {
                // A switched-off / expired enrollment is not "enrolled" (the user can buy again).
                boolean enrolled = courseEnrollmentRepository.findByUserAndCourse(user, course)
                        .map(com.academy.entity.CourseEnrollment::isAccessible).orElse(false);
                response.setIsEnrolled(enrolled);
                if (enrolled) {
                    courseEnrollmentRepository.findByUserAndCourse(user, course).ifPresent(e ->
                        response.setEnrollmentProgress(
                            e.getProgressPercentage() != null ? e.getProgressPercentage().intValue() : 0));
                }
            }
        } catch (Exception ignored) { /* unauthenticated — skip */ }
        return response;
    }

    @Override
    public PageResponse<CourseResponse> getAllCourses(int page, int size, String search,
                                                       UUID categoryId, CourseLevel level, String sortBy,
                                                       CourseType courseType) {
        Sort sort = getSort(sortBy);
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        Page<Course> courses;

        String courseTypeStr = courseType != null ? courseType.name() : null;
        if (courseType != null && search != null && !search.isBlank()) {
            // Search within a specific course type (e.g. search on Masterclass page)
            courses = courseRepository.searchPublishedCoursesByType(search, courseType, courseTypeStr, pageRequest);
        } else if (courseType != null && categoryId != null) {
            CourseCategory category = categoryService.findById(categoryId);
            courses = courseRepository.findPublishedByCourseTypeAndCategory(courseType, courseTypeStr, category, pageRequest);
        } else if (courseType != null) {
            courses = courseRepository.findPublishedByCourseType(courseType, courseTypeStr, pageRequest);
        } else if (search != null && !search.isBlank()) {
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
    @Cacheable(value = CacheConfig.COURSES, key = "'popular-' + #page + '-' + #size + '-' + T(org.springframework.context.i18n.LocaleContextHolder).getLocale().getLanguage()")
    public PageResponse<CourseResponse> getPopularCourses(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Course> courses = courseRepository.findPopularCourses(pageRequest);
        return PageResponse.from(courses, this::buildResponse);
    }

    @Override
    @Cacheable(value = CacheConfig.COURSES, key = "'latest-' + #page + '-' + #size + '-' + T(org.springframework.context.i18n.LocaleContextHolder).getLocale().getLanguage()")
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
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public CourseResponse createCourse(CreateCourseRequest request) {
        User instructor = getCurrentUser();

        if (instructor.getRole() != UserRole.INSTRUCTOR && instructor.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only instructors can create courses");
        }

        String baseSlug = slugify.slugify(request.getTitle());
        // Fallback for non-Latin titles (Arabic, Chinese, etc.) that produce an empty slug
        if (baseSlug == null || baseSlug.isBlank()) {
            baseSlug = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
        String slug = generateUniqueSlug(baseSlug);

        Course course = Course.builder()
                .title(request.getTitle())
                .slug(slug)
                .description(HtmlSanitizer.clean(request.getDescription()))
                .shortDescription(request.getShortDescription())
                .instructor(instructor)
                .isBeginner(request.getIsBeginner() != null ? request.getIsBeginner() : false)
                .courseType(request.getCourseType() != null ? request.getCourseType() : com.academy.entity.enums.CourseType.PLAN)
                .masterclassFormat(resolveMasterclassFormat(request.getCourseType(), request.getMasterclassFormat()))
                .maxStudents(request.getMaxStudents())
                .sessionDate(request.getSessionDate())
                .sessionStartTime(request.getSessionStartTime())
                .sessionEndTime(request.getSessionEndTime())
                .sessionLocation(trimToNull(request.getSessionLocation()))
                .previewVideoUrl(cleanVideoUrl(request.getPreviewVideoUrl()))
                // Masterclass always requires individual purchase
                .requiresPurchase(com.academy.entity.enums.CourseType.MASTERCLASS.equals(request.getCourseType()) ? true
                        : (request.getRequiresPurchase() != null ? request.getRequiresPurchase() : false))
                .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                .originalPrice(request.getOriginalPrice())
                .level(request.getLevel() != null ? request.getLevel() : CourseLevel.BEGINNER)
                .language(request.getLanguage() != null ? request.getLanguage() : "fr")
                .status(CourseStatus.PENDING_REVIEW)
                .whatYouWillLearn(request.getWhatYouWillLearn())
                .requirements(request.getRequirements())
                .targetAudience(request.getTargetAudience())
                .tags(request.getTags())
                .titleEn(request.getTitleEn())
                .descriptionEn(HtmlSanitizer.clean(request.getDescriptionEn()))
                .titleAr(request.getTitleAr())
                .titleFr(request.getTitleFr())
                .descriptionAr(HtmlSanitizer.clean(request.getDescriptionAr()))
                .descriptionFr(HtmlSanitizer.clean(request.getDescriptionFr()))
                .build();

        if (request.getCategoryId() != null) {
            CourseCategory category = categoryService.findById(request.getCategoryId());
            course.setCategory(category);
        }

        // A new LIVE masterclass must describe its session completely.
        validateLiveSession(course, true, null);
        course = courseRepository.saveAndFlush(course);
        // Proactively translate so the catalogue is ready in both languages immediately.
        translationService.prewarm(course.getTitle());
        translationService.prewarm(course.getShortDescription());
        translationService.prewarm(course.getDescription());
        log.info("Course created: {} (id: {}) by instructor: {}", course.getTitle(), course.getId(), instructor.getEmail());

        return buildResponse(course);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public CourseResponse updateCourse(UUID id, UpdateCourseRequest request) {
        Course course = findById(id);
        verifyInstructorAccess(course);
        java.time.LocalDate previousSessionDate = course.getSessionDate();

        if (request.getTitle() != null) {
            course.setTitle(request.getTitle());
            String newBase = slugify.slugify(request.getTitle());
            if (newBase == null || newBase.isBlank()) {
                newBase = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            }
            if (!course.getSlug().startsWith(newBase)) {
                course.setSlug(generateUniqueSlug(newBase));
            }
        }
        if (request.getDescription() != null) {
            course.setDescription(HtmlSanitizer.clean(request.getDescription()));
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
        if (request.getMaxStudents() != null) {
            course.setMaxStudents(request.getMaxStudents());
        }
        if (request.getSessionDate() != null) {
            course.setSessionDate(request.getSessionDate());
        }
        if (request.getSessionStartTime() != null) {
            course.setSessionStartTime(request.getSessionStartTime());
        }
        if (request.getSessionEndTime() != null) {
            course.setSessionEndTime(request.getSessionEndTime());
        }
        if (request.getSessionLocation() != null) {
            course.setSessionLocation(trimToNull(request.getSessionLocation()));
        }
        if (request.getPreviewVideoUrl() != null) {
            course.setPreviewVideoUrl(cleanVideoUrl(request.getPreviewVideoUrl()));
        }
        if (request.getCourseType() != null) {
            course.setCourseType(request.getCourseType());
            course.setMasterclassFormat(resolveMasterclassFormat(request.getCourseType(), request.getMasterclassFormat()));
            // Masterclass always requires purchase; PLAN courses keep their existing flag unless overridden below
            if (com.academy.entity.enums.CourseType.MASTERCLASS.equals(request.getCourseType())) {
                course.setRequiresPurchase(true);
            }
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
        if (request.getTitleEn() != null) {
            course.setTitleEn(request.getTitleEn());
        }
        if (request.getDescriptionEn() != null) {
            course.setDescriptionEn(HtmlSanitizer.clean(request.getDescriptionEn()));
        }
        if (request.getTitleAr() != null) {
            course.setTitleAr(request.getTitleAr());
        }
        if (request.getTitleFr() != null) {
            course.setTitleFr(request.getTitleFr());
        }
        if (request.getDescriptionAr() != null) {
            course.setDescriptionAr(HtmlSanitizer.clean(request.getDescriptionAr()));
        }
        if (request.getDescriptionFr() != null) {
            course.setDescriptionFr(HtmlSanitizer.clean(request.getDescriptionFr()));
        }

        // Older live masterclasses may still lack session details, so an update
        // does not demand them — but whatever is set must be consistent.
        validateLiveSession(course, false, previousSessionDate);
        if (masterclassBookingService.isSeatLimited(course)) {
            long paid = masterclassBookingService.countConfirmedSeats(course);
            if (course.getMaxStudents() < paid) {
                throw new BadRequestException("Capacity cannot be lower than the " + paid
                        + " participants who have already paid");
            }
        }

        course = courseRepository.save(course);
        notifyAdminsOfPublishedEdit(course);
        translationService.prewarm(course.getTitle());
        translationService.prewarm(course.getShortDescription());
        translationService.prewarm(course.getDescription());
        log.info("Course updated: {}", course.getTitle());

        return buildResponse(course);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
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
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public void deleteCourse(UUID id) {
        Course course = findById(id);
        verifyInstructorAccess(course);

        // Check the real records (the enrolled counter can be 0 after refunds while
        // purchases/certificates still reference the course — the delete then failed
        // with a misleading database error).
        if (course.getEnrolledCount() > 0 || courseEnrollmentRepository.existsByCourse(course)
                || coursePurchaseRepository.existsByCourse(course)
                || certificateRepository.existsByCourse(course)) {
            throw new BadRequestException("This course has students, purchases or certificates and cannot be deleted. Archive it instead.");
        }

        courseRepository.delete(course);
        log.info("Course deleted: {}", course.getTitle());
    }

    /**
     * Admin force-delete: removes the course AND every record that references it, in
     * foreign-key-safe (child → parent) order, so a course that has enrolled students
     * can still be removed. Destructive — also wipes that course's enrollments, lesson
     * progress, quiz attempts, certificates, purchases, reviews and wishlist entries.
     * Gated to admins by the /api/v1/admin/courses endpoint (hasRole('ADMIN')).
     */
    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public void forceDeleteCourse(UUID id) {
        Course course = findById(id);                  // 404 if it doesn't exist
        String title = course.getTitle();
        UUID c = course.getId();

        // ── children → parents, so no foreign key can block the delete ──
        bulkDelete("delete from QuizOption o where o.question.id in (select q.id from QuizQuestion q where q.quiz.id in (select z.id from Quiz z where z.course.id = :c))", c);
        bulkDelete("delete from QuizQuestion q where q.quiz.id in (select z.id from Quiz z where z.course.id = :c)", c);
        bulkDelete("delete from QuizAttempt a where a.quiz.id in (select z.id from Quiz z where z.course.id = :c)", c);
        bulkDelete("delete from Quiz z where z.course.id = :c", c);
        bulkDelete("delete from VideoAsset v where v.lesson.id in (select l.id from CourseLesson l where l.module.id in (select m.id from CourseModule m where m.course.id = :c))", c);
        bulkDelete("delete from LessonProgress p where p.lesson.id in (select l.id from CourseLesson l where l.module.id in (select m.id from CourseModule m where m.course.id = :c))", c);
        bulkDelete("delete from AssignmentSubmission s where s.assignment.id in (select a.id from Assignment a where a.course.id = :c)", c);
        bulkDelete("delete from Assignment a where a.course.id = :c", c);
        bulkDelete("delete from Certificate ct where ct.course.id = :c", c);
        bulkDelete("delete from CoursePurchase p where p.course.id = :c", c);
        bulkDelete("delete from InstructorEarning e where e.courseId = :c", c);
        bulkDelete("delete from Wishlist w where w.course.id = :c", c);
        bulkDelete("delete from CourseReview r where r.course.id = :c", c);
        bulkDelete("delete from CourseLesson l where l.module.id in (select m.id from CourseModule m where m.course.id = :c)", c);
        bulkDelete("delete from CourseModule m where m.course.id = :c", c);
        bulkDelete("delete from CourseEnrollment en where en.course.id = :c", c);

        entityManager.flush();
        entityManager.clear();                          // detach the managed course before the row goes
        bulkDelete("delete from Course cc where cc.id = :c", c);

        log.info("Course force-deleted (with all dependents): {} [{}]", title, c);
    }

    private void bulkDelete(String jpql, UUID courseId) {
        entityManager.createQuery(jpql).setParameter("c", courseId).executeUpdate();
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public void publishCourse(UUID id) {
        Course course = findById(id);
        verifyInstructorAccess(course);

        // A LIVE masterclass has no recorded lessons: it is ready for review once
        // its session (date, times, venue, capacity) is fully described.
        if (masterclassBookingService.isLiveMasterclass(course)) {
            validateLiveSession(course, true, null); // also refuses a session already in the past
            course.setStatus(CourseStatus.PENDING_REVIEW);
            courseRepository.save(course);
            log.info("Live masterclass submitted for review: {}", course.getTitle());
            return;
        }

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
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public void archiveCourse(UUID id) {
        Course course = findById(id);
        verifyInstructorAccess(course);

        course.setStatus(CourseStatus.ARCHIVED);
        courseRepository.save(course);
        log.info("Course archived: {}", course.getTitle());
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
    public void approveCourse(UUID id) {
        Course course = findById(id);

        course.setStatus(CourseStatus.PUBLISHED);
        course.setPublishedAt(LocalDateTime.now());
        courseRepository.save(course);
        log.info("Course approved and published: {}", course.getTitle());
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES, CacheConfig.COURSE_DETAIL, CacheConfig.PLATFORM_STATS}, allEntries = true)
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
        java.util.List<User> instructors = userRepository.findByRoleAndIsDeletedFalse(UserRole.INSTRUCTOR, pageRequest).getContent(); // deleted instructors are not "featured"

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
        if (baseSlug == null || baseSlug.isBlank()) {
            baseSlug = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
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
        // A LIVE masterclass is booked over WhatsApp, so the front end needs the
        // academy number. Left blank when the admin has not configured one yet.
        if (MasterclassFormat.LIVE.equals(course.getMasterclassFormat())) {
            response.setReservationWhatsapp(settingsService.getMasterclassWhatsappNumber());
            // Live seat availability: only confirmed paid seats and active card-payment
            // holds count — never page views, WhatsApp clicks or failed payments.
            if (masterclassBookingService.isSeatLimited(course)) {
                response.setSeatsTaken((int) masterclassBookingService.countConfirmedSeats(course));
                response.setSeatsRemaining(masterclassBookingService.remainingSeats(course));
            }
        }
        return response;
    }

    /** Largest value the price columns (NUMERIC(10,2)) can hold. */
    private static final BigDecimal MAX_PRICE = new BigDecimal("99999999.99");
    private static final int MAX_CAPACITY = 10_000;

    /**
     * Rejects inconsistent LIVE masterclass session data. No-op for other courses.
     *
     * @param requireComplete true when the session must be fully described
     *                        (new masterclass, or submission for review)
     * @param previousDate    the date stored before this change (null for a new course);
     *                        a past date is only refused when it is being set now
     */
    private void validateLiveSession(Course course, boolean requireComplete, java.time.LocalDate previousDate) {
        if (!masterclassBookingService.isLiveMasterclass(course)) return;

        if (requireComplete) {
            if (course.getMaxStudents() == null) {
                throw new BadRequestException("Please set the maximum number of participants");
            }
            if (course.getSessionDate() == null || course.getSessionStartTime() == null
                    || course.getSessionEndTime() == null) {
                throw new BadRequestException("Please set the date, start time and end time of the session");
            }
            if (course.getSessionLocation() == null || course.getSessionLocation().isBlank()) {
                throw new BadRequestException("Please set the location of the session");
            }
        }
        if (course.getMaxStudents() != null && course.getMaxStudents() < 1) {
            throw new BadRequestException("Capacity must be at least 1 participant");
        }
        if (course.getMaxStudents() != null && course.getMaxStudents() > MAX_CAPACITY) {
            throw new BadRequestException("Capacity cannot exceed " + MAX_CAPACITY + " participants");
        }
        if (course.getPrice() != null && course.getPrice().signum() < 0) {
            throw new BadRequestException("Price must be positive");
        }
        if (course.getPrice() != null && course.getPrice().compareTo(MAX_PRICE) > 0) {
            throw new BadRequestException("Price is too high");
        }
        if (course.getSessionStartTime() != null && course.getSessionEndTime() != null
                && !course.getSessionEndTime().isAfter(course.getSessionStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }
        if (course.getSessionDate() != null
                && !course.getSessionDate().equals(previousDate)
                && course.getSessionDate().isBefore(java.time.LocalDate.now())) {
            throw new BadRequestException("The session date cannot be in the past");
        }
    }

    /**
     * A published course stays online while it is edited (a live masterclass must
     * not disappear because its venue changed), but admins are told about every
     * instructor edit so they can re-check the content and price.
     */
    private void notifyAdminsOfPublishedEdit(Course course) {
        if (course.getStatus() != CourseStatus.PUBLISHED) return;
        User editor = getCurrentUserSafe();
        if (editor == null || editor.getRole() == UserRole.ADMIN) return;
        try {
            for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
                notificationService.createNotification(admin,
                        "Published course edited",
                        editor.getFullName() + " edited the published course \"" + course.getTitle() + "\". Please review it.",
                        com.academy.entity.enums.NotificationType.COURSE,
                        "/course/course-details/" + course.getSlug());
            }
        } catch (Exception e) {
            log.warn("Could not notify admins of edit to course {}: {}", course.getId(), e.getMessage());
        }
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Promo video link: blank means none; anything else must be an http(s) URL. */
    private static String cleanVideoUrl(String value) {
        String url = trimToNull(value);
        if (url == null) return null;
        String lower = url.toLowerCase(java.util.Locale.ROOT);
        if (!(lower.startsWith("https://") || lower.startsWith("http://")) || url.chars().anyMatch(Character::isWhitespace)) {
            throw new BadRequestException("The promo video link must be a full web address starting with https://");
        }
        return url;
    }

    /**
     * A format only applies to a MASTERCLASS. PLAN courses always clear it, and a
     * masterclass with no explicit choice stays RECORDED (today's behaviour).
     */
    private MasterclassFormat resolveMasterclassFormat(com.academy.entity.enums.CourseType type,
                                                       MasterclassFormat requested) {
        if (!com.academy.entity.enums.CourseType.MASTERCLASS.equals(type)) return null;
        return requested != null ? requested : MasterclassFormat.RECORDED;
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

    /** Returns the current user or null if the request is not authenticated. */
    private User getCurrentUserSafe() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal)) {
                return null;
            }
            return userService.findById(((UserPrincipal) auth.getPrincipal()).getId());
        } catch (Exception e) {
            return null;
        }
    }
}
