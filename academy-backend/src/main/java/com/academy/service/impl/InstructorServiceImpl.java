package com.academy.service.impl;

import com.academy.dto.request.RequestPayoutRequest;
import com.academy.dto.response.CourseResponse;
import com.academy.dto.response.DashboardResponse;
import com.academy.dto.response.EarningResponse;
import com.academy.dto.response.EarningsSummaryResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PayoutResponse;
import com.academy.dto.response.UserResponse;
import com.academy.entity.Course;
import com.academy.entity.CourseEnrollment;
import com.academy.entity.InstructorEarning;
import com.academy.entity.InstructorPayout;
import com.academy.entity.User;
import com.academy.entity.enums.EarningSourceType;
import com.academy.entity.enums.PayoutStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.InstructorEarningRepository;
import com.academy.repository.InstructorPayoutRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.FileStorageService;
import com.academy.service.InstructorService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstructorServiceImpl implements InstructorService {

    private final InstructorEarningRepository earningRepository;
    private final InstructorPayoutRepository payoutRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    @Value("${app.platform-fee-percentage:20}")
    private BigDecimal platformFeePercentage;

    @Value("${app.minimum-payout-amount:100}")
    private BigDecimal minimumPayoutAmount;

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @Override
    public DashboardResponse.InstructorDashboard getDashboard() {
        User instructor = getCurrentInstructor();

        long totalStudents = enrollmentRepository.countStudentsByInstructor(instructor);
        long totalCourses  = courseRepository.countByInstructor(instructor);
        BigDecimal totalEarnings   = getTotalEarnings();
        BigDecimal pendingEarnings = getPendingEarnings();
        BigDecimal monthlyEarnings = getMonthlyEarnings();

        List<DashboardResponse.CourseStats>      topCourses         = getTopCourses(instructor, 5);
        List<DashboardResponse.RecentEnrollment> recentEnrollments  = getRecentEnrollments(instructor, 10);

        return DashboardResponse.InstructorDashboard.builder()
                .totalStudents((int) totalStudents)
                .totalCourses((int) totalCourses)
                .totalEarnings(totalEarnings)
                .pendingEarnings(pendingEarnings)
                .monthlyEarnings(monthlyEarnings)
                .topCourses(topCourses)
                .recentEnrollments(recentEnrollments)
                .build();
    }

    // ── Earnings summary ───────────────────────────────────────────────────────

    @Override
    public BigDecimal getTotalEarnings() {
        User instructor = getCurrentInstructor();
        BigDecimal total = earningRepository.sumTotalEarningsByInstructor(instructor);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getPendingEarnings() {
        User instructor = getCurrentInstructor();
        BigDecimal pending = earningRepository.sumPendingEarningsByInstructor(instructor);
        return pending != null ? pending : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getMonthlyEarnings() {
        User instructor = getCurrentInstructor();
        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        BigDecimal monthly = earningRepository.sumEarningsByInstructorSince(instructor, startOfMonth);
        return monthly != null ? monthly : BigDecimal.ZERO;
    }

    @Override
    public EarningsSummaryResponse getEarningsSummary() {
        User instructor = getCurrentInstructor();

        BigDecimal total   = getTotalEarnings();
        BigDecimal pending = getPendingEarnings();
        BigDecimal monthly = getMonthlyEarnings();

        // Total paid out (sum of completed payouts)
        BigDecimal totalPaidOut = payoutRepository.sumCompletedPayoutsByInstructor(instructor);
        if (totalPaidOut == null) totalPaidOut = BigDecimal.ZERO;

        // Last 12 months breakdown
        LocalDateTime twelveMonthsAgo = LocalDateTime.now().minusMonths(11)
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Object[]> rows = earningRepository.getMonthlyEarnings(instructor.getId(), twelveMonthsAgo);

        // Build a map: (year*100 + month) → amount
        Map<Integer, BigDecimal> byYearMonth = new HashMap<>();
        for (Object[] row : rows) {
            int year  = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            BigDecimal amount = row[2] instanceof BigDecimal
                    ? (BigDecimal) row[2]
                    : BigDecimal.valueOf(((Number) row[2]).doubleValue());
            byYearMonth.put(year * 100 + month, amount);
        }

        // Fill in all 12 months (including months with no earnings → 0)
        List<EarningsSummaryResponse.MonthlyBreakdown> breakdown = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDateTime cursor = twelveMonthsAgo;
        for (int i = 0; i < 12; i++) {
            int key = cursor.getYear() * 100 + cursor.getMonthValue();
            BigDecimal amount = byYearMonth.getOrDefault(key, BigDecimal.ZERO);
            breakdown.add(EarningsSummaryResponse.MonthlyBreakdown.builder()
                    .month(cursor.format(fmt))
                    .amount(amount)
                    .build());
            cursor = cursor.plusMonths(1);
        }

        return EarningsSummaryResponse.builder()
                .totalEarnings(total)
                .pendingEarnings(pending)
                .monthlyEarnings(monthly)
                .totalPaidOut(totalPaidOut)
                .monthlyBreakdown(breakdown)
                .build();
    }

    // ── Paginated earnings / payouts ───────────────────────────────────────────

    @Override
    public PageResponse<EarningResponse> getEarnings(int page, int size) {
        User instructor = getCurrentInstructor();
        Pageable pageable = PageRequest.of(page, size);
        Page<InstructorEarning> earningsPage =
                earningRepository.findByInstructorOrderByCreatedAtDesc(instructor, pageable);

        // Batch-fetch course names for all unique courseIds on this page
        List<UUID> courseIds = earningsPage.getContent().stream()
                .filter(e -> e.getCourseId() != null)
                .map(InstructorEarning::getCourseId)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, String> courseNameMap = courseIds.isEmpty()
                ? new HashMap<>()
                : courseRepository.findAllById(courseIds).stream()
                        .collect(Collectors.toMap(Course::getId, Course::getTitle));

        return PageResponse.from(earningsPage,
                e -> EarningResponse.fromEntity(e,
                        e.getCourseId() != null ? courseNameMap.get(e.getCourseId()) : null));
    }

    @Override
    public PageResponse<PayoutResponse> getPayouts(int page, int size) {
        User instructor = getCurrentInstructor();
        Pageable pageable = PageRequest.of(page, size);
        Page<InstructorPayout> payoutsPage =
                payoutRepository.findByInstructorOrderByCreatedAtDesc(instructor, pageable);
        return PageResponse.from(payoutsPage, PayoutResponse::fromEntity);
    }

    // ── Payout request ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PayoutResponse requestPayout(RequestPayoutRequest request) {
        User instructor = getCurrentInstructor();

        BigDecimal pendingAmount = getPendingEarnings();

        if (request.getAmount().compareTo(minimumPayoutAmount) < 0) {
            throw new BadRequestException("Minimum payout amount is " + minimumPayoutAmount + " MAD");
        }

        if (request.getAmount().compareTo(pendingAmount) > 0) {
            throw new BadRequestException("Requested amount exceeds available pending earnings");
        }

        InstructorPayout payout = InstructorPayout.builder()
                .instructor(instructor)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .bankAccountInfo(request.getBankAccountInfo())
                .notes(request.getNotes())
                .status(PayoutStatus.REQUESTED)
                .build();

        payout = payoutRepository.save(payout);
        log.info("Payout requested by instructor: {} amount: {}",
                instructor.getEmail(), request.getAmount());

        return PayoutResponse.fromEntity(payout);
    }

    // ── Internal: create earning entry ────────────────────────────────────────

    @Override
    @Transactional
    public void createEarning(UUID instructorId, UUID courseId, UUID sourceId,
                              EarningSourceType sourceType, BigDecimal amount) {
        User instructor = userService.findById(instructorId);

        BigDecimal fee = amount.multiply(platformFeePercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal netAmount = amount.subtract(fee);

        String description = generateEarningDescription(sourceType, amount);

        InstructorEarning earning = InstructorEarning.builder()
                .instructor(instructor)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .courseId(courseId)
                .amount(amount)
                .platformFee(fee)
                .netAmount(netAmount)
                .description(description)
                .build();

        earningRepository.save(earning);
        log.info("Earning created for instructor: {} amount: {} net: {}",
                instructor.getEmail(), amount, netAmount);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private List<DashboardResponse.CourseStats> getTopCourses(User instructor, int limit) {
        List<Course> courses = courseRepository.findByInstructor(instructor);
        return courses.stream()
                .map(course -> {
                    long enrollments = enrollmentRepository.countByCourse(course);
                    return DashboardResponse.CourseStats.builder()
                            .course(buildCourseResponse(course))
                            .enrollmentsCount((int) enrollments)
                            .revenue(BigDecimal.ZERO)
                            .averageRating(course.getRatingAverage())
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getEnrollmentsCount(), a.getEnrollmentsCount()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<DashboardResponse.RecentEnrollment> getRecentEnrollments(User instructor, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<CourseEnrollment> enrollments =
                enrollmentRepository.findRecentEnrollmentsByInstructor(instructor, pageable);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        return enrollments.getContent().stream()
                .map(enrollment -> DashboardResponse.RecentEnrollment.builder()
                        .student(UserResponse.fromEntity(enrollment.getUser()))
                        .course(buildCourseResponse(enrollment.getCourse()))
                        .enrolledAt(enrollment.getEnrolledAt().format(formatter))
                        .build())
                .collect(Collectors.toList());
    }

    private CourseResponse buildCourseResponse(Course course) {
        CourseResponse response = CourseResponse.fromEntity(course);
        response.setThumbnailUrl(fileStorageService.getFileUrl(course.getThumbnailUrl()));
        if (response.getInstructor() != null && course.getInstructor() != null) {
            response.getInstructor().setAvatarUrl(
                    fileStorageService.getFileUrl(course.getInstructor().getAvatarUrl())
            );
        }
        return response;
    }

    private String generateEarningDescription(EarningSourceType sourceType, BigDecimal amount) {
        return switch (sourceType) {
            case COURSE_PURCHASE    -> "Course purchase — " + amount + " MAD";
            case SUBSCRIPTION_SHARE -> "Subscription revenue share — " + amount + " MAD";
        };
    }

    private User getCurrentInstructor() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.INSTRUCTOR
                && currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Instructor access required");
        }
        return currentUser;
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
