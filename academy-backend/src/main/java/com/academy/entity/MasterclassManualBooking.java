package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A participant the instructor (or an admin) added by hand to a LIVE masterclass:
 * booked on WhatsApp and paid outside the platform. Takes a seat like a card
 * payment. Linked to a user account when the e-mail matches one.
 */
@Entity
@Table(name = "masterclass_manual_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterclassManualBooking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** Matching account, if any. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "amount_paid", precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "note", length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    private User addedBy;

    /** Set when the participant is removed; the seat is then free again. */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
}
