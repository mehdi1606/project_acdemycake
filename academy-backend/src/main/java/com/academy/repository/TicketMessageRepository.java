package com.academy.repository;

import com.academy.entity.SupportTicket;
import com.academy.entity.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketMessageRepository extends JpaRepository<TicketMessage, UUID> {

    List<TicketMessage> findByTicketOrderByCreatedAtAsc(SupportTicket ticket);
}
