package com.academy.repository;

import com.academy.entity.SupportTicket;
import com.academy.entity.User;
import com.academy.entity.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    Page<SupportTicket> findByStudent(User student, Pageable pageable);

    Page<SupportTicket> findByStudentAndStatus(User student, TicketStatus status, Pageable pageable);

    Page<SupportTicket> findByStatus(TicketStatus status, Pageable pageable);

    long countByStatus(TicketStatus status);

    long countByStudent(User student);

    long countByStudentAndStatus(User student, TicketStatus status);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(t.ticketNumber, 5) AS int)), 0) FROM SupportTicket t")
    Optional<Integer> findMaxTicketSequence();
}
