package com.academy.service;

import com.academy.dto.request.CreateTicketRequest;
import com.academy.dto.request.ReplyTicketRequest;
import com.academy.dto.request.UpdateTicketStatusRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.TicketResponse;
import com.academy.dto.response.TicketStatsResponse;
import com.academy.entity.enums.TicketStatus;

import java.util.UUID;

public interface SupportTicketService {

    // ── Student operations ────────────────────────────────────────────────────

    TicketResponse createTicket(CreateTicketRequest request);

    PageResponse<TicketResponse> getMyTickets(int page, int size, TicketStatus status);

    TicketResponse getMyTicket(UUID ticketId);

    TicketResponse replyToMyTicket(UUID ticketId, ReplyTicketRequest request);

    void closeMyTicket(UUID ticketId);

    TicketStatsResponse getMyTicketStats();

    // ── Admin operations ──────────────────────────────────────────────────────

    PageResponse<TicketResponse> getAllTickets(int page, int size, TicketStatus status);

    TicketResponse getTicketAsAdmin(UUID ticketId);

    TicketResponse replyAsAdmin(UUID ticketId, ReplyTicketRequest request);

    TicketResponse updateTicketStatus(UUID ticketId, UpdateTicketStatusRequest request);

    TicketStatsResponse getAllTicketStats();
}
