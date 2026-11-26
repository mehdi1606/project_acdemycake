package com.academy.repository;

import com.academy.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID>, JpaSpecificationExecutor<Invoice> {

    Optional<Invoice> findByPaymentId(UUID paymentId);

    boolean existsByPaymentId(UUID paymentId);

    Optional<Invoice> findByManualBookingId(UUID manualBookingId);

    List<Invoice> findByManualBookingIdIn(Collection<UUID> manualBookingIds);

    /** Invoices of card payments for one course (masterclass reservations page). */
    @Query(value = "SELECT i.* FROM invoices i JOIN payment_transactions p ON p.id = i.payment_id " +
                   "WHERE p.transaction_type = 'COURSE_PURCHASE' AND p.reference_id = :courseId",
           nativeQuery = true)
    List<Invoice> findCardInvoicesForCourse(@Param("courseId") UUID courseId);

    Page<Invoice> findByUserIdOrderByIssuedAtDesc(UUID userId, Pageable pageable);

    Page<Invoice> findAllByOrderByIssuedAtDesc(Pageable pageable);

}
