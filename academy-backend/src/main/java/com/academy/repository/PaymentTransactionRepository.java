package com.academy.repository;

import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByPayzoneTransactionId(String transactionId);

    Optional<PaymentTransaction> findByPayzoneOrderId(String orderId);

    Page<PaymentTransaction> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<PaymentTransaction> findByStatusOrderByCreatedAtDesc(PaymentStatus status, Pageable pageable);

    Page<PaymentTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
