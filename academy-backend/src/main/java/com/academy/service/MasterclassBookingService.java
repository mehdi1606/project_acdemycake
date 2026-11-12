package com.academy.service;

import com.academy.dto.request.AddManualParticipantRequest;
import com.academy.dto.response.MasterclassParticipantsResponse;
import com.academy.entity.Course;
import com.academy.entity.User;

import java.util.UUID;

/**
 * Seat management for LIVE masterclasses paid by card.
 *
 * Rules enforced here (server side, never trusted to the browser):
 *  - a seat is only taken by a purchase confirmed through a verified payment callback;
 *  - opening a page, clicking WhatsApp, or a failed / cancelled payment never takes a seat;
 *  - a seat is taken by a CMI-confirmed card payment or a participant added by the instructor;
 *  - if the last place is paid twice at the same moment, the later payment is refused and not captured;
 *  - every check runs under a row lock on the course, so concurrent payments are serialised.
 */
public interface MasterclassBookingService {

    /** How long a started card payment stays open (it does not take a seat). */
    int SEAT_HOLD_MINUTES = 30;

    /** True for a LIVE masterclass. */
    boolean isLiveMasterclass(Course course);

    /** True for a LIVE masterclass that has a positive seat limit. */
    boolean isSeatLimited(Course course);

    /** Loads the course with a write lock held until the current transaction ends. */
    Course lockCourse(UUID courseId);

    /** Confirmed paid seats. */
    long countConfirmedSeats(Course course);

    /** Seats still bookable (capacity − confirmed); null when unlimited. */
    Integer remainingSeats(Course course);

    /**
     * Throws if the user may not start a card payment for this LIVE masterclass
     * (no price, session over, not published, or no seat left). Call with the course locked.
     */
    void assertCanStartCardPayment(Course lockedCourse, User user);

    /**
     * Returns null when a confirmed payment may take its seat, otherwise the reason
     * it must be refused (already booked, or full). Call with the course locked.
     */
    String refusalReasonForConfirmation(Course lockedCourse, User user);

    /** Clears cached course responses once the current transaction commits. */
    void evictCourseCachesAfterCommit();

    /** Participant list + totals for the instructor who owns the masterclass (or an admin). */
    MasterclassParticipantsResponse getParticipants(UUID courseId);

    /** Adds a participant booked on WhatsApp and paid outside the platform (takes a seat). */
    MasterclassParticipantsResponse addManualParticipant(UUID courseId, AddManualParticipantRequest request);

    /** Removes a manually added participant and frees the seat. */
    MasterclassParticipantsResponse removeManualParticipant(UUID courseId, UUID bookingId);
}
