package com.academy.entity;

import com.academy.entity.enums.EarningSourceType;
import com.academy.entity.enums.PayoutStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "instructor_earnings", indexes = {
        @Index(name = "idx_instructor_earnings_instructor_id", columnList = "instructor_id"),
        @Index(name = "idx_instructor_earnings_source_type", columnList = "source_type"),
        @Index(name = "idx_instructor_earnings_payout_status", columnList = "payout_status"),
        @Index(name = "idx_instructor_earnings_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorEarning {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    private EarningSourceType sourceType;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "platform_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "net_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Enumerated(EnumType.STRING)
    @Column(name = "payout_status", nullable = false, length = 20)
    @Builder.Default
    private PayoutStatus payoutStatus = PayoutStatus.PENDING;

    @Column(name = "payout_id")
    private UUID payoutId;

    @Column(name = "payout_date")
    private LocalDateTime payoutDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "description", length = 500)
    private String description;
}
