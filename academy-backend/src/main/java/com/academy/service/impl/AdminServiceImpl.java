package com.academy.service.impl;

import com.academy.dto.response.CourseResponse;
import com.academy.dto.response.DashboardResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.TransactionResponse;
import com.academy.dto.response.TransactionStatsResponse;
import com.academy.dto.response.UserResponse;
import com.academy.entity.Course;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.PaymentStatus;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.repository.*;
import com.academy.security.UserPrincipal;
import com.academy.service.AdminService;
import com.academy.service.TranslationService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final CourseCategoryRepository categoryRepository;
    private final TranslationService translationService;
    private final UserService userService;

    /** Every transactionType written by the payment flows. */
    private static final Set<String> TRANSACTION_TYPES = Set.of("SUBSCRIPTION", "COURSE_PURCHASE", "EBOOK_PURCHASE");

    /**
     * One-time proactive translation of ALL existing courses & categories.
     * Each unique text is translated once (LibreTranslate) and cached, so this is
     * safe to run repeatedly. Translation happens in the background; this returns
     * immediately with the counts queued.
     */
    @Override
    @Transactional(readOnly = true)
    public Object prewarmAllTranslations() {
        verifyAdmin();

        var courses = courseRepository.findAll();
        for (var c : courses) {
            translationService.prewarm(c.getTitle());
            translationService.prewarm(c.getShortDescription());
            translationService.prewarm(c.getDescription());
        }

        var categories = categoryRepository.findAll();
        for (var cat : categories) {
            translationService.prewarm(cat.getName());
            translationService.prewarm(cat.getDescription());
        }

        log.info("Prewarm-all: queued translations for {} courses and {} categories",
                courses.size(), categories.size());

        Map<String, Object> result = new HashMap<>();
        result.put("courses", courses.size());
        result.put("categories", categories.size());
        result.put("message", "Translation prewarm started in the background");
        return result;
    }

    @Override
    public DashboardResponse.AdminDashboard getDashboard() {
        verifyAdmin();

        long totalUsers = userRepository.countByIsDeletedFalse();
        // All courses in every status (courses are hard-deleted, so count() = every existing course)
        long totalCourses = courseRepository.count();
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long totalEnrollments = enrollmentRepository.count();
        long activeSubscriptions = subscriptionRepository.countActiveSubscriptions();

        // Revenue is now sourced from realised CMI payments (COMPLETED transactions),
        // so the dashboard and the Transactions page always agree on one number.
        BigDecimal totalRevenue = transactionRepository.sumAmountByStatus(PaymentStatus.COMPLETED);
        BigDecimal monthlyRevenue = transactionRepository.sumAmountByStatusSince(PaymentStatus.COMPLETED, startOfMonth);

        List<DashboardResponse.CourseStats> topCourses = getTopCourses(5);
        List<DashboardResponse.UserStats> topInstructors = getTopInstructors(5);
        List<DashboardResponse.MonthlyRevenue> revenueHistory = getRevenueHistory(12);

        return DashboardResponse.AdminDashboard.builder()
                .totalUsers((int) totalUsers)
                .totalCourses((int) totalCourses)
                .totalEnrollments((int) totalEnrollments)
                .activeSubscriptions((int) activeSubscriptions)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .monthlyRevenue(monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO)
                .topCourses(topCourses)
                .topInstructors(topInstructors)
                .revenueHistory(revenueHistory)
                .build();
    }

    @Override
    public PageResponse<TransactionResponse> getTransactions(int page, int size, PaymentStatus status, String type) {
        verifyAdmin();

        String txType = null;
        if (type != null && !type.isBlank()) {
            txType = type.trim().toUpperCase();
            if (!TRANSACTION_TYPES.contains(txType)) {
                throw new BadRequestException("Invalid transaction type: " + type);
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<PaymentTransaction> transactionsPage;
        if (status != null && txType != null) {
            transactionsPage = transactionRepository.findByStatusAndTransactionTypeOrderByCreatedAtDesc(status, txType, pageable);
        } else if (status != null) {
            transactionsPage = transactionRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (txType != null) {
            transactionsPage = transactionRepository.findByTransactionTypeOrderByCreatedAtDesc(txType, pageable);
        } else {
            transactionsPage = transactionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        // Map inside the transaction so the lazy User proxy is accessible
        return PageResponse.from(transactionsPage, TransactionResponse::from);
    }

    @Override
    public TransactionStatsResponse getTransactionStats() {
        verifyAdmin();

        // Realised revenue = COMPLETED CMI payments, aggregated across ALL rows in SQL
        // (not just the current page) so the figures are correct under pagination.
        BigDecimal totalRevenue        = transactionRepository.sumAmountByStatus(PaymentStatus.COMPLETED);
        BigDecimal subscriptionRevenue = transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "SUBSCRIPTION");
        BigDecimal courseRevenue       = transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "COURSE_PURCHASE");
        BigDecimal ebookRevenue        = transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "EBOOK_PURCHASE");
        BigDecimal pendingAmount       = transactionRepository.sumAmountByStatus(PaymentStatus.PENDING);

        return TransactionStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .subscriptionRevenue(subscriptionRevenue)
                .courseRevenue(courseRevenue)
                .ebookRevenue(ebookRevenue)
                .pendingAmount(pendingAmount)
                .completedCount(transactionRepository.countByStatus(PaymentStatus.COMPLETED))
                .pendingCount(transactionRepository.countByStatus(PaymentStatus.PENDING))
                .currency("MAD")
                .build();
    }

    @Override
    public Map<String, Long> getCourseStats() {
        verifyAdmin();

        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", courseRepository.count());
        for (CourseStatus status : CourseStatus.values()) {
            stats.put(status.name(), courseRepository.countByStatus(status));
        }
        return stats;
    }

    /**
     * Analytics for the selected period. Every money figure comes from realised
     * CMI payments (COMPLETED PaymentTransaction rows) so it matches the dashboard
     * and the Transactions page.
     */
    @Override
    public Object getAnalytics(String period) {
        verifyAdmin();

        LocalDateTime startDate = calculateStartDate(period);
        LocalDate firstDay = startDate.toLocalDate();
        LocalDate today = LocalDate.now();

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("period", period.toUpperCase());
        analytics.put("startDate", startDate);

        // Money (period) - COMPLETED transactions created since the start of the period
        analytics.put("totalRevenue",
                transactionRepository.sumAmountByStatusSince(PaymentStatus.COMPLETED, startDate));
        analytics.put("coursesSold",
                transactionRepository.countByStatusAndTypeSince(PaymentStatus.COMPLETED, "COURSE_PURCHASE", startDate));

        // Users / subscriptions / enrollments
        analytics.put("totalUsers", userRepository.countByIsDeletedFalse());
        analytics.put("newUsers", userRepository.countNewUsersSince(startDate));
        analytics.put("activeSubscriptions", subscriptionRepository.countActiveSubscriptions());
        analytics.put("newEnrollments", enrollmentRepository.countEnrollmentsSince(startDate));

        // Per-day series (every day of the period, zero-filled)
        Map<LocalDate, BigDecimal> revenuePerDay = new TreeMap<>();
        Map<LocalDate, Long> usersPerDay = new TreeMap<>();
        for (LocalDate d = firstDay; !d.isAfter(today); d = d.plusDays(1)) {
            revenuePerDay.put(d, BigDecimal.ZERO);
            usersPerDay.put(d, 0L);
        }
        for (Object[] row : transactionRepository.findCreatedAtAndAmountByStatusSince(PaymentStatus.COMPLETED, startDate)) {
            if (row[0] == null || row[1] == null) continue;
            LocalDate day = ((LocalDateTime) row[0]).toLocalDate();
            revenuePerDay.merge(day, (BigDecimal) row[1], BigDecimal::add);
        }
        for (LocalDateTime createdAt : userRepository.findCreatedAtSince(startDate)) {
            if (createdAt == null) continue;
            usersPerDay.merge(createdAt.toLocalDate(), 1L, Long::sum);
        }

        List<Map<String, Object>> revenueByDay = new ArrayList<>();
        revenuePerDay.forEach((day, amount) -> {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", day.toString());
            point.put("amount", amount);
            revenueByDay.add(point);
        });
        List<Map<String, Object>> usersByDay = new ArrayList<>();
        usersPerDay.forEach((day, count) -> {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", day.toString());
            point.put("count", count);
            usersByDay.add(point);
        });
        analytics.put("revenueByDay", revenueByDay);
        analytics.put("usersByDay", usersByDay);

        // Best sellers of the period by realised revenue
        List<Map<String, Object>> topCourses = new ArrayList<>();
        for (Object[] row : transactionRepository.findTopCourseRevenueSince(
                PaymentStatus.COMPLETED, startDate, PageRequest.of(0, 5))) {
            UUID courseId = (UUID) row[0];
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("courseId", courseId);
            item.put("title", courseRepository.findById(courseId).map(Course::getTitle).orElse(null));
            item.put("revenue", row[1]);
            item.put("sales", row[2]);
            topCourses.add(item);
        }
        analytics.put("topCourses", topCourses);

        return analytics;
    }

    @Override
    public Object getReports(String type) {
        verifyAdmin();

        return switch (type.toLowerCase()) {
            case "users" -> generateUserReport();
            case "revenue" -> generateRevenueReport();
            case "courses" -> generateCourseReport();
            case "subscriptions" -> generateSubscriptionReport();
            default -> throw new BadRequestException(
                    "Unknown report type: " + type + " (expected users, revenue, courses or subscriptions)");
        };
    }

    private List<DashboardResponse.CourseStats> getTopCourses(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<Course> popularCourses = courseRepository.findPopularCourses(pageable);

        return popularCourses.getContent().stream()
                .map(course -> {
                    long enrollments = enrollmentRepository.countByCourse(course);
                    // Realised revenue: COMPLETED COURSE_PURCHASE payments for this course
                    BigDecimal revenue = transactionRepository.sumCourseRevenue(PaymentStatus.COMPLETED, course.getId());
                    return DashboardResponse.CourseStats.builder()
                            .course(CourseResponse.fromEntity(course))
                            .enrollmentsCount((int) enrollments)
                            .revenue(revenue != null ? revenue : BigDecimal.ZERO)
                            .averageRating(course.getRatingAverage())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<DashboardResponse.UserStats> getTopInstructors(int limit) {
        List<User> instructors = userRepository.findByRoleAndIsDeletedFalse(UserRole.INSTRUCTOR);

        return instructors.stream()
                .map(instructor -> {
                    long students = enrollmentRepository.countStudentsByInstructor(instructor);
                    long courses = courseRepository.countByInstructor(instructor);
                    return DashboardResponse.UserStats.builder()
                            .user(UserResponse.fromEntity(instructor))
                            .studentsCount((int) students)
                            .coursesCount((int) courses)
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getStudentsCount(), a.getStudentsCount()))
                .limit(limit)
                .peek(stats -> {
                    // Only computed for the instructors actually shown
                    User instructor = userRepository.getReferenceById(stats.getUser().getId());
                    BigDecimal revenue = transactionRepository.sumCourseRevenueByInstructor(PaymentStatus.COMPLETED, instructor);
                    stats.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);
                })
                .collect(Collectors.toList());
    }

    private List<DashboardResponse.MonthlyRevenue> getRevenueHistory(int months) {
        List<DashboardResponse.MonthlyRevenue> history = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        LocalDateTime now = LocalDateTime.now();
        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            // Per-month realised revenue from CMI payments (COMPLETED only, within the window)
            BigDecimal revenue = transactionRepository.sumAmountByStatusBetween(
                    PaymentStatus.COMPLETED, monthStart, monthEnd);
            long enrollments = enrollmentRepository.countEnrollmentsBetween(monthStart, monthEnd);

            history.add(DashboardResponse.MonthlyRevenue.builder()
                    .month(monthStart.format(formatter))
                    .revenue(revenue != null ? revenue : BigDecimal.ZERO)
                    .enrollments((int) enrollments)
                    .build());
        }

        return history;
    }

    private LocalDateTime calculateStartDate(String period) {
        return switch (period.toLowerCase()) {
            case "day" -> LocalDateTime.now().minusDays(1);
            case "week" -> LocalDateTime.now().minusWeeks(1);
            case "month" -> LocalDateTime.now().minusMonths(1);
            case "quarter" -> LocalDateTime.now().minusMonths(3);
            case "year" -> LocalDateTime.now().minusYears(1);
            default -> throw new BadRequestException(
                    "Invalid period: " + period + " (expected day, week, month, quarter or year)");
        };
    }

    private static LocalDateTime startOfMonth() {
        return LocalDate.now().withDayOfMonth(1).atStartOfDay();
    }

    private Map<String, Object> generateUserReport() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalUsers", userRepository.countByIsDeletedFalse());
        report.put("students", userRepository.countByRole(UserRole.STUDENT));
        report.put("instructors", userRepository.countByRole(UserRole.INSTRUCTOR));
        report.put("admins", userRepository.countByRole(UserRole.ADMIN));
        report.put("newUsersThisMonth", userRepository.countNewUsersSince(startOfMonth()));
        report.put("activeSubscribers", userRepository.countActiveSubscriptions());
        report.put("generatedAt", LocalDateTime.now());
        return report;
    }

    private Map<String, Object> generateRevenueReport() {
        // Realised revenue = COMPLETED CMI payments (same source as the dashboard)
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalRevenue", transactionRepository.sumAmountByStatus(PaymentStatus.COMPLETED));
        report.put("monthlyRevenue", transactionRepository.sumAmountByStatusSince(PaymentStatus.COMPLETED, startOfMonth()));
        report.put("subscriptionRevenue", transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "SUBSCRIPTION"));
        report.put("courseRevenue", transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "COURSE_PURCHASE"));
        report.put("ebookRevenue", transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "EBOOK_PURCHASE"));
        report.put("pendingAmount", transactionRepository.sumAmountByStatus(PaymentStatus.PENDING));
        report.put("refundedAmount", transactionRepository.sumAmountByStatus(PaymentStatus.REFUNDED));
        report.put("completedCount", transactionRepository.countByStatus(PaymentStatus.COMPLETED));
        report.put("pendingCount", transactionRepository.countByStatus(PaymentStatus.PENDING));
        report.put("failedCount", transactionRepository.countByStatus(PaymentStatus.FAILED));
        report.put("currency", "MAD");
        report.put("generatedAt", LocalDateTime.now());
        return report;
    }

    private Map<String, Object> generateCourseReport() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalCourses", courseRepository.count());
        report.put("publishedCourses", courseRepository.countByStatus(CourseStatus.PUBLISHED));
        report.put("pendingReviewCourses", courseRepository.countByStatus(CourseStatus.PENDING_REVIEW));
        report.put("draftCourses", courseRepository.countByStatus(CourseStatus.DRAFT));
        report.put("archivedCourses", courseRepository.countByStatus(CourseStatus.ARCHIVED));
        report.put("totalEnrollments", enrollmentRepository.count());
        report.put("coursesSold", transactionRepository.countByStatusAndTransactionType(PaymentStatus.COMPLETED, "COURSE_PURCHASE"));
        report.put("courseRevenue", transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "COURSE_PURCHASE"));
        report.put("currency", "MAD");
        report.put("generatedAt", LocalDateTime.now());
        return report;
    }

    private Map<String, Object> generateSubscriptionReport() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalSubscriptions", subscriptionRepository.count());
        report.put("activeSubscriptions", subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE));
        report.put("pastDueSubscriptions", subscriptionRepository.countByStatus(SubscriptionStatus.PAST_DUE));
        report.put("cancelledSubscriptions", subscriptionRepository.countByStatus(SubscriptionStatus.CANCELLED));
        report.put("expiredSubscriptions", subscriptionRepository.countByStatus(SubscriptionStatus.EXPIRED));
        report.put("subscriptionRevenue", transactionRepository.sumAmountByStatusAndType(PaymentStatus.COMPLETED, "SUBSCRIPTION"));
        report.put("monthlySubscriptionRevenue", transactionRepository.sumAmountByStatusAndTypeSince(
                PaymentStatus.COMPLETED, "SUBSCRIPTION", startOfMonth()));
        report.put("currency", "MAD");
        report.put("generatedAt", LocalDateTime.now());
        return report;
    }

    private void verifyAdmin() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Admin access required");
        }
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
