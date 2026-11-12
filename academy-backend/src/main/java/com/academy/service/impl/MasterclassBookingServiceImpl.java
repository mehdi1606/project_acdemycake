package com.academy.service.impl;

import com.academy.config.CacheConfig;
import com.academy.dto.request.AddManualParticipantRequest;
import com.academy.dto.response.MasterclassParticipantsResponse;
import com.academy.entity.Course;
import com.academy.entity.CoursePurchase;
import com.academy.entity.MasterclassManualBooking;
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
import com.academy.repository.MasterclassManualBookingRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.repository.UserRepository;
import com.academy.service.EnrollmentService;
import com.academy.security.UserPrincipal;
import com.academy.service.MasterclassBookingService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.CacheManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
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
    private final MasterclassManualBookingRepository manualBookingRepository;
    private final UserRepository userRepository;
    // Provider: EnrollmentService -> CourseService -> this service would be a cycle.
    private final ObjectProvider<EnrollmentService> enrollmentServiceProvider;

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
        // Card payments confirmed by CMI + participants the instructor added by hand
        // (WhatsApp bookings paid outside the platform). A payment that was only
        // started — page opened and closed, declined, abandoned — never takes a seat.
        return coursePurchaseRepository.countByCourseAndStatus(course, PaymentStatus.COMPLETED)
                + manualBookingRepository.countByCourseAndCancelledAtIsNull(course);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer remainingSeats(Course course) {
        if (!isSeatLimited(course)) return null;
        return (int) Math.max(0, course.getMaxStudents() - countConfirmedSeats(course));
    }

    private boolean hasConfirmedPlace(Course course, User user) {
        return coursePurchaseRepository.existsByUserAndCourseAndStatus(user, course, PaymentStatus.COMPLETED)
                || manualBookingRepository.existsByCourseAndUserAndCancelledAtIsNull(course, user);
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
        if (hasConfirmedPlace(course, user)) {
            throw new BadRequestException("You already have a confirmed place in this masterclass.");
        }
        // Only confirmed seats count. If several people pay for the last place at the
        // same time, the first confirmed payment wins and the others are refused at
        // confirmation without being charged (pre-authorisation is never captured).
        if (isSeatLimited(course) && countConfirmedSeats(course) >= course.getMaxStudents()) {
            throw new ConflictException("This masterclass is full.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String refusalReasonForConfirmation(Course course, User user) {
        if (hasConfirmedPlace(course, user)) {
            return "DUPLICATE: you already have a confirmed place — this payment was not captured.";
        }
        if (isSeatLimited(course) && countConfirmedSeats(course) >= course.getMaxStudents()) {
            return "FULL: the masterclass was fully booked before your payment completed — your card was not charged.";
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

    /** Loads a LIVE masterclass the current user owns (or any, for an admin). */
    private Course ownedLiveMasterclass(UUID courseId, User current) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
        if (current.getRole() != UserRole.ADMIN
                && !course.getInstructor().getId().equals(current.getId())) {
            throw new ForbiddenException("You can only manage reservations of your own masterclasses");
        }
        if (!isLiveMasterclass(course)) {
            throw new BadRequestException("Reservations are only available for live masterclasses");
        }
        return course;
    }

    @Override
    @Transactional(readOnly = true)
    public MasterclassParticipantsResponse getParticipants(UUID courseId) {
        Course course = ownedLiveMasterclass(courseId, currentUser());

        List<CoursePurchase> purchases = coursePurchaseRepository.findParticipants(
                course, List.of(PaymentStatus.COMPLETED, PaymentStatus.REFUNDED));
        List<MasterclassManualBooking> manual = manualBookingRepository.findAllForCourse(course);

        List<MasterclassParticipantsResponse.Participant> participants = new ArrayList<>();
        purchases.forEach(p -> participants.add(MasterclassParticipantsResponse.Participant.builder()
                        .reservationId(p.getId())
                        .userId(p.getUser().getId())
                        .fullName(p.getUser().getFullName())
                        .email(p.getUser().getEmail())
                        .phone(p.getUser().getPhone())
                        .amount(p.getAmount())
                        .currency(p.getCurrency())
                        .paymentStatus(p.getStatus().name())
                        .bookingStatus(p.getStatus() == PaymentStatus.COMPLETED ? "CONFIRMED" : "CANCELLED")
                        .source("CARD")
                        .reservedAt(p.getPurchasedAt() != null ? p.getPurchasedAt() : p.getCreatedAt())
                        .build()));
        manual.forEach(b -> participants.add(MasterclassParticipantsResponse.Participant.builder()
                        .reservationId(b.getId())
                        .userId(b.getUser() != null ? b.getUser().getId() : null)
                        .fullName(b.getFullName())
                        .email(b.getEmail())
                        .phone(b.getPhone())
                        .amount(b.getAmountPaid())
                        .currency(b.getCurrency())
                        .paymentStatus("MANUAL")
                        .bookingStatus(b.getCancelledAt() == null ? "CONFIRMED" : "CANCELLED")
                        .source("MANUAL")
                        .note(b.getNote())
                        .reservedAt(b.getCreatedAt())
                        .build()));
        participants.sort(Comparator.comparing(MasterclassParticipantsResponse.Participant::getReservedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        long confirmed = countConfirmedSeats(course);
        BigDecimal revenue = purchases.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .map(CoursePurchase::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal manualRevenue = manual.stream()
                .filter(b -> b.getCancelledAt() == null && b.getAmountPaid() != null)
                .map(MasterclassManualBooking::getAmountPaid)
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
                .manualRevenue(manualRevenue)
                .participants(participants)
                .build();
    }

    @Override
    @Transactional
    public MasterclassParticipantsResponse addManualParticipant(UUID courseId, AddManualParticipantRequest request) {
        User current = currentUser();
        ownedLiveMasterclass(courseId, current);
        Course course = lockCourse(courseId);   // serialise with card confirmations

        if (isSeatLimited(course) && countConfirmedSeats(course) >= course.getMaxStudents()) {
            throw new ConflictException("This masterclass is full. Increase the capacity first if you want to add more participants.");
        }

        String email = request.getEmail() == null || request.getEmail().isBlank()
                ? null : request.getEmail().trim().toLowerCase();
        User account = email == null ? null : userRepository.findByEmail(email)
                .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
                .orElse(null);
        if (account != null && hasConfirmedPlace(course, account)) {
            throw new ConflictException("This person already has a confirmed place in this masterclass.");
        }

        MasterclassManualBooking booking = MasterclassManualBooking.builder()
                .course(course)
                .user(account)
                .fullName(request.getFullName().trim())
                .phone(request.getPhone() == null || request.getPhone().isBlank() ? null : request.getPhone().trim())
                .email(email)
                .amountPaid(request.getAmountPaid())
                .currency(course.getCurrency() != null ? course.getCurrency() : "MAD")
                .note(request.getNote() == null || request.getNote().isBlank() ? null : request.getNote().trim())
                .addedBy(current)
                .build();
        manualBookingRepository.save(booking);

        // A matching account sees "Your place is confirmed" on the masterclass page.
        if (account != null) {
            enrollmentServiceProvider.getObject().enrollUserInCourse(account, course, true);
        }
        log.info("Manual participant added to masterclass {} by {} (linked account: {})",
                course.getId(), current.getEmail(), account != null);

        evictCourseCachesAfterCommit();
        return getParticipants(courseId);
    }

    @Override
    @Transactional
    public MasterclassParticipantsResponse removeManualParticipant(UUID courseId, UUID bookingId) {
        User current = currentUser();
        Course course = ownedLiveMasterclass(courseId, current);

        MasterclassManualBooking booking = manualBookingRepository.findById(bookingId)
                .filter(b -> b.getCourse().getId().equals(course.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", bookingId));
        if (booking.getCancelledAt() != null) {
            return getParticipants(courseId);
        }
        booking.setCancelledAt(LocalDateTime.now());
        manualBookingRepository.save(booking);

        // Take back the access given above, unless the person also paid by card.
        User account = booking.getUser();
        if (account != null && !hasConfirmedPlace(course, account)) {
            enrollmentServiceProvider.getObject().revokeEnrollment(account, course);
        }
        log.info("Manual participant {} removed from masterclass {} by {}", bookingId, course.getId(), current.getEmail());

        evictCourseCachesAfterCommit();
        return getParticipants(courseId);
    }

    private User currentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(principal.getId());
    }
}
