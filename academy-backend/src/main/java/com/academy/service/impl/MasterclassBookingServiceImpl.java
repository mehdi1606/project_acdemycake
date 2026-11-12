package com.academy.service.impl;

import com.academy.config.CacheConfig;
import com.academy.dto.response.MasterclassParticipantsResponse;
import com.academy.entity.Course;
import com.academy.entity.CoursePurchase;
import com.academy.entity.User;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.CourseType;
import com.academy.entity.enums.MasterclassFormat;
import com.academy.entity.enums.PaymentStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ConflictException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CoursePurchaseRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.MasterclassBookingService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MasterclassBookingServiceImpl implements MasterclassBookingService {

    private final CourseRepository courseRepository;
    private final CoursePurchaseRepository coursePurchaseRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final UserService userService;
    private final CacheManager cacheManager;

    // ── Classification ───────────────────────────────────────────────────────

    @Override
    public boolean isLiveMasterclass(Course course) {
        return course != null
                && CourseType.MASTERCLASS.equals(course.getCourseType())
                && MasterclassFormat.LIVE.equals(course.getMasterclassFormat());
    }

    @Override
    public boolean isSeatLimited(Course course) {
        return isLiveMasterclass(course) && course.getMaxStudents() != null && course.getMaxStudents() > 0;
    }

    // ── Seat counting ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Course lockCourse(UUID courseId) {
        return courseRepository.findByIdForUpdate(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
    }

    @Override
    @Transactional(readOnly = true)
    public long countConfirmedSeats(Course course) {
        return coursePurchaseRepository.countByCourseAndStatus(course, PaymentStatus.COMPLETED);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer remainingSeats(Course course) {
        if (!isSeatLimited(course)) return null;
        long taken = countConfirmedSeats(course);
        long held  = transactionRepository.countActiveSeatHolds(course.getId(), LocalDateTime.now());
        return (int) Math.max(0, course.getMaxStudents() - taken - held);
    }

    // ── Payment guards ───────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public void assertCanStartCardPayment(Course course, User user) {
        if (!isLiveMasterclass(course)) return;

        if (course.getPrice() == null || course.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("This masterclass is reserved through WhatsApp only.");
        }
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new BadRequestException("This masterclass is not open for booking.");
        }
        if (course.getSessionDate() != null && course.getSessionDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("This masterclass has already taken place.");
        }
        if (coursePurchaseRepository.existsByUserAndCourseAndStatus(user, course, PaymentStatus.COMPLETED)) {
            throw new BadRequestException("You already have a confirmed place in this masterclass.");
        }
        if (isSeatLimited(course)) {
            long taken = countConfirmedSeats(course);
            long heldByOthers = transactionRepository.countActiveSeatHoldsExcludingUser(
                    course.getId(), LocalDateTime.now(), user);
            if (taken + heldByOthers >= course.getMaxStudents()) {
                throw new ConflictException(taken >= course.getMaxStudents()
                        ? "This masterclass is full."
                        : "All remaining places are being booked right now. Please try again in a few minutes.");
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String refusalReasonForConfirmation(Course course, User user) {
        if (coursePurchaseRepository.existsByUserAndCourseAndStatus(user, course, PaymentStatus.COMPLETED)) {
            return "DUPLICATE: you already have a confirmed place — this payment was not captured.";
        }
        if (isSeatLimited(course)) {
            long taken = countConfirmedSeats(course);
            // This user's own hold is the one being converted, so only other users' holds count.
            long heldByOthers = transactionRepository.countActiveSeatHoldsExcludingUser(
                    course.getId(), LocalDateTime.now(), user);
            if (taken + heldByOthers >= course.getMaxStudents()) {
                return "FULL: the masterclass was fully booked before your payment completed — your card was not charged.";
            }
        }
        return null;
    }

    // ── Cache ────────────────────────────────────────────────────────────────

    @Override
    public void evictCourseCachesAfterCommit() {
        Runnable evict = () -> {
            for (String name : List.of(CacheConfig.COURSES, CacheConfig.COURSE_DETAIL)) {
                Cache cache = cacheManager.getCache(name);
                if (cache != null) cache.clear();
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evict.run();
                }
            });
        } else {
            evict.run();
        }
    }

    // ── Instructor view ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public MasterclassParticipantsResponse getParticipants(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        User current = currentUser();
        if (current.getRole() != UserRole.ADMIN
                && !course.getInstructor().getId().equals(current.getId())) {
            throw new ForbiddenException("You can only view reservations of your own masterclasses");
        }
        if (!isLiveMasterclass(course)) {
            throw new BadRequestException("Reservations are only available for live masterclasses");
        }

        List<CoursePurchase> purchases = coursePurchaseRepository.findParticipants(
                course, List.of(PaymentStatus.COMPLETED, PaymentStatus.REFUNDED));

        List<MasterclassParticipantsResponse.Participant> participants = purchases.stream()
                .map(p -> MasterclassParticipantsResponse.Participant.builder()
                        .reservationId(p.getId())
                        .userId(p.getUser().getId())
                        .fullName(p.getUser().getFullName())
                        .email(p.getUser().getEmail())
                        .phone(p.getUser().getPhone())
                        .amount(p.getAmount())
                        .currency(p.getCurrency())
                        .paymentStatus(p.getStatus().name())
                        .bookingStatus(p.getStatus() == PaymentStatus.COMPLETED ? "CONFIRMED" : "CANCELLED")
                        .reservedAt(p.getPurchasedAt() != null ? p.getPurchasedAt() : p.getCreatedAt())
                        .build())
                .toList();

        long confirmed = purchases.stream().filter(p -> p.getStatus() == PaymentStatus.COMPLETED).count();
        BigDecimal revenue = purchases.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .map(CoursePurchase::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long holds = transactionRepository.countActiveSeatHolds(course.getId(), LocalDateTime.now());

        return MasterclassParticipantsResponse.builder()
                .courseId(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .sessionDate(course.getSessionDate())
                .sessionStartTime(course.getSessionStartTime())
                .sessionEndTime(course.getSessionEndTime())
                .sessionLocation(course.getSessionLocation())
                .price(course.getPrice())
                .currency(course.getCurrency())
                .capacity(isSeatLimited(course) ? course.getMaxStudents() : null)
                .confirmedParticipants(confirmed)
                .pendingHolds(holds)
                .remainingPlaces(remainingSeats(course))
                .totalRevenue(revenue)
                .participants(participants)
                .build();
    }

    private User currentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(principal.getId());
    }
}
