package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Reservations of one LIVE masterclass, as seen by its instructor (or an admin).
 *
 * Only purchases confirmed by a verified CMI callback are listed. No card data
 * is stored by the platform, so none can be exposed here.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MasterclassParticipantsResponse {

    private UUID courseId;
    private String title;
    private String slug;
    private LocalDate sessionDate;
    private LocalTime sessionStartTime;
    private LocalTime sessionEndTime;
    private String sessionLocation;
    private BigDecimal price;
    private String currency;

    /** Seat limit; null when the instructor set none. */
    private Integer capacity;
    /** Confirmed participants (card + manually added). */
    private long confirmedParticipants;
    /** Card payments started but not finished (informational only, they do not take a seat). */
    private long pendingHolds;
    /** Seats still bookable; null when there is no seat limit. */
    private Integer remainingPlaces;
    /** Sum of confirmed payments (refunds excluded). */
    private BigDecimal totalRevenue;
    /** Sum of amounts entered for manually added participants (paid outside the platform). */
    private BigDecimal manualRevenue;

    private List<Participant> participants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Participant {
        private UUID reservationId;
        private UUID userId;
        private String fullName;
        private String email;
        private String phone;
        private BigDecimal amount;
        private String currency;
        /** COMPLETED or REFUNDED. */
        private String paymentStatus;
        /** CONFIRMED or CANCELLED (refunded). */
        private String bookingStatus;
        /** CARD (paid online) or MANUAL (added by the instructor). */
        private String source;
        private String note;
        private LocalDateTime reservedAt;
    }
}
