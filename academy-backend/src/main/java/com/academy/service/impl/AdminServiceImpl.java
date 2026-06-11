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
import com.academy.entity.enums.PaymentStatus;
import com.academy.entity.enums.UserRole;
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
        long totalCourses = courseRepository.countPublishedCourses();
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
    public PageResponse<TransactionResponse> getTransactions(int page, int size) {
        verifyAdmin();

        Pageable pageable = PageRequest.of(page, size);
        Page<PaymentTransaction> transactionsPage = transactionRepository.findAllByOrderByCreatedAtDesc(pageable);

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
        BigDecimal pendingAmount       = transactionRepository.sumAmountByStatus(PaymentStatus.PENDING);

        return TransactionStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .subscriptionRevenue(subscriptionRevenue)
                .courseRevenue(courseRevenue)
                .pendingAmount(pendingAmount)
                .completedCount(transactionRepository.countByStatus(PaymentStatus.COMPLETED))
                .pendingCount(transactionRepository.countByStatus(PaymentStatus.PENDING))
                .currency("MAD")
                .build();
    }

    @Override
    public Object getAnalytics(String period) {
        verifyAdmin();

        LocalDateTime startDate = calculateStartDate(period);

        Map<String, Object> analytics = new HashMap<>();

        // User analytics
        long newUsers = userRepository.countNewUsersSince(startDate);
        long totalStudents = userRepository.countByRole(UserRole.STUDENT);
        long totalInstructors = userRepository.countByRole(UserRole.INSTRUCTOR);

        analytics.put("newUsers", newUsers);
        analytics.put("totalStudents", totalStudents);
        analytics.put("totalInstructors", totalInstructors);

        // Enrollment analytics
        long newEnrollments = enrollmentRepository.countEnrollmentsSince(startDate);
        analytics.put("newEnrollments", newEnrollments);

        // Revenue analytics
        BigDecimal periodRevenue = subscriptionRepository.sumRevenueFromSubscriptionsSince(startDate);
        analytics.put("periodRevenue", periodRevenue != null ? periodRevenue : BigDecimal.ZERO);

        // Course analytics
        long publishedCourses = courseRepository.countPublishedCourses();
        analytics.put("publishedCourses", publishedCourses);

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
            default -> Map.of("error", "Unknown report type");
        };
    }

    private List<DashboardResponse.CourseStats> getTopCourses(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<Course> popularCourses = courseRepository.findPopularCourses(pageable);

        return popularCourses.getContent().stream()
                .map(course -> {
                    long enrollments = enrollmentRepository.countByCourse(course);
                    return DashboardResponse.CourseStats.builder()
                            .course(CourseResponse.fromEntity(course))
                            .enrollmentsCount((int) enrollments)
                            .revenue(course.getPrice().multiply(BigDecimal.valueOf(enrollments)))
                            .averageRating(course.getRatingAverage())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<DashboardResponse.UserStats> getTopInstructors(int limit) {
        List<User> instructors = userRepository.findByRole(UserRole.INSTRUCTOR);

        return instructors.stream()
                .map(instructor -> {
                    long students = enrollmentRepository.countStudentsByInstructor(instructor);
                    long courses = courseRepository.countByInstructor(instructor);
                    return DashboardResponse.UserStats.builder()
                            .user(UserResponse.fromEntity(instructor))
                            .studentsCount((int) students)
                            .coursesCount((int) courses)
                            .totalRevenue(BigDecimal.ZERO) // Would aggregate from earnings
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getStudentsCount(), a.getStudentsCount()))
                .limit(limit)
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
            long enrollments = enrollmentRepository.countEnrollmentsSince(monthStart);

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
            default -> LocalDateTime.now().minusMonths(1);
        };
    }

    private Map<String, Object> generateUserReport() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalUsers", userRepository.countByIsDeletedFalse());
        report.put("students", userRepository.countByRole(UserRole.STUDENT));
        report.put("instructors", userRepository.countByRole(UserRole.INSTRUCTOR));
        report.put("admins", userRepository.countByRole(UserRole.ADMIN));
        report.put("activeSubscriptions", userRepository.countActiveSubscriptions());
        report.put("generatedAt", LocalDateTime.now());
        return report;
    }

    private Map<String, Object> generateRevenueReport() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalRevenue", subscriptionRepository.sumTotalSubscriptionRevenue());
        report.put("monthlyRevenue", subscriptionRepository.sumRevenueFromSubscriptionsSince(
                LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0)));
        report.put("activeSubscriptions", subscriptionRepository.countActiveSubscriptions());
        report.put("generatedAt", LocalDateTime.now());
        return report;
    }

    private Map<String, Object> generateCourseReport() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalCourses", courseRepository.count());
        report.put("publishedCourses", courseRepository.countPublishedCourses());
        report.put("totalEnrollments", enrollmentRepository.count());
        report.put("generatedAt", LocalDateTime.now());
        return report;
    }

    private Map<String, Object> generateSubscriptionReport() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalSubscriptions", subscriptionRepository.count());
        report.put("activeSubscriptions", subscriptionRepository.countActiveSubscriptions());
        report.put("totalRevenue", subscriptionRepository.sumTotalSubscriptionRevenue());
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
