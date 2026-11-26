package com.academy.repository;

import com.academy.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByPaymentId(UUID paymentId);

    boolean existsByPaymentId(UUID paymentId);

    Page<Invoice> findByUserIdOrderByIssuedAtDesc(UUID userId, Pageable pageable);

    Page<Invoice> findAllByOrderByIssuedAtDesc(Pageable pageable);

    /** Admin search on invoice number, buyer name or buyer email (case-insensitive). */
    @Query("SELECT i FROM Invoice i WHERE LOWER(i.invoiceNumber) LIKE :q " +
           "OR LOWER(i.buyerName) LIKE :q OR LOWER(i.buyerEmail) LIKE :q " +
           "ORDER BY i.issuedAt DESC")
    Page<Invoice> search(@Param("q") String likePattern, Pageable pageable);
}
