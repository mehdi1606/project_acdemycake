package com.academy.service.impl;

import com.academy.dto.request.CreateTicketRequest;
import com.academy.dto.request.ReplyTicketRequest;
import com.academy.dto.request.UpdateTicketStatusRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.TicketMessageResponse;
import com.academy.dto.response.TicketResponse;
import com.academy.dto.response.TicketStatsResponse;
import com.academy.entity.SupportTicket;
import com.academy.entity.TicketMessage;
import com.academy.entity.User;
import com.academy.entity.enums.TicketStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.SupportTicketRepository;
import com.academy.repository.TicketMessageRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.SupportTicketService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final UserService userService;

    // ── Student operations ────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        User student = getCurrentUser();

        String ticketNumber = generateTicketNumber();

        SupportTicket ticket = SupportTicket.builder()
                .student(student)
                .ticketNumber(ticketNumber)
                .subject(request.getSubject())
                .description(request.getDescription())
                .priority(request.getPriority())
                .category(request.getCategory())
                .status(TicketStatus.OPEN)
                .build();

        ticket = ticketRepository.save(ticket);

        // Create the initial message from the description
        TicketMessage firstMessage = TicketMessage.builder()
                .ticket(ticket)
                .sender(student)
                .content(request.getDescription())
                .isAdminReply(false)
                .build();

        messageRepository.save(firstMessage);
        log.info("Support ticket {} created by student {}", ticketNumber, student.getEmail());

        return TicketResponse.fromEntityDetail(ticket, List.of(TicketMessageResponse.fromEntity(firstMessage)));
    }

    @Override
    public PageResponse<TicketResponse> getMyTickets(int page, int size, TicketStatus status) {
        User student = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<SupportTicket> tickets = (status != null)
                ? ticketRepository.findByStudentAndStatus(student, status, pageable)
                : ticketRepository.findByStudent(student, pageable);

        return PageResponse.from(tickets, TicketResponse::fromEntitySummary);
    }

    @Override
    public TicketResponse getMyTicket(UUID ticketId) {
        User student = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        if (!ticket.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("Access denied to this ticket");
        }

        List<TicketMessageResponse> messages = messageRepository
                .findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(TicketMessageResponse::fromEntity)
                .collect(Collectors.toList());

        return TicketResponse.fromEntityDetail(ticket, messages);
    }

    @Override
    @Transactional
    public TicketResponse replyToMyTicket(UUID ticketId, ReplyTicketRequest request) {
        User student = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        if (!ticket.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("Access denied to this ticket");
        }

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new ForbiddenException("Cannot reply to a closed ticket");
        }

        TicketMessage message = TicketMessage.builder()
                .ticket(ticket)
                .sender(student)
                .content(request.getContent())
                .isAdminReply(false)
                .build();

        messageRepository.save(message);

        // Re-open if it was IN_PROGRESS (student replied, admin should respond again)
        if (ticket.getStatus() == TicketStatus.IN_PROGRESS) {
            ticket.setStatus(TicketStatus.OPEN);
            ticketRepository.save(ticket);
        }

        log.info("Student {} replied to ticket {}", student.getEmail(), ticket.getTicketNumber());

        List<TicketMessageResponse> messages = messageRepository
                .findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(TicketMessageResponse::fromEntity)
                .collect(Collectors.toList());

        return TicketResponse.fromEntityDetail(ticket, messages);
    }

    @Override
    @Transactional
    public void closeMyTicket(UUID ticketId) {
        User student = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        if (!ticket.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("Access denied to this ticket");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        log.info("Ticket {} closed by student {}", ticket.getTicketNumber(), student.getEmail());
    }

    @Override
    public TicketStatsResponse getMyTicketStats() {
        User student = getCurrentUser();
        long total = ticketRepository.countByStudent(student);
        long open = ticketRepository.countByStudentAndStatus(student, TicketStatus.OPEN);
        long inProgress = ticketRepository.countByStudentAndStatus(student, TicketStatus.IN_PROGRESS);
        long closed = ticketRepository.countByStudentAndStatus(student, TicketStatus.CLOSED);

        return TicketStatsResponse.builder()
                .total(total)
                .open(open)
                .inProgress(inProgress)
                .closed(closed)
                .build();
    }

    // ── Admin operations ──────────────────────────────────────────────────────

    @Override
    public PageResponse<TicketResponse> getAllTickets(int page, int size, TicketStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<SupportTicket> tickets = (status != null)
                ? ticketRepository.findByStatus(status, pageable)
                : ticketRepository.findAll(pageable);

        return PageResponse.from(tickets, TicketResponse::fromEntitySummary);
    }

    @Override
    public TicketResponse getTicketAsAdmin(UUID ticketId) {
        SupportTicket ticket = findTicketById(ticketId);

        List<TicketMessageResponse> messages = messageRepository
                .findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(TicketMessageResponse::fromEntity)
                .collect(Collectors.toList());

        return TicketResponse.fromEntityDetail(ticket, messages);
    }

    @Override
    @Transactional
    public TicketResponse replyAsAdmin(UUID ticketId, ReplyTicketRequest request) {
        User admin = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new ForbiddenException("Cannot reply to a closed ticket. Reopen it first.");
        }

        TicketMessage message = TicketMessage.builder()
                .ticket(ticket)
                .sender(admin)
                .content(request.getContent())
                .isAdminReply(true)
                .build();

        messageRepository.save(message);

        // Move to IN_PROGRESS when admin replies
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticketRepository.save(ticket);
        }

        log.info("Admin {} replied to ticket {}", admin.getEmail(), ticket.getTicketNumber());

        List<TicketMessageResponse> messages = messageRepository
                .findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(TicketMessageResponse::fromEntity)
                .collect(Collectors.toList());

        return TicketResponse.fromEntityDetail(ticket, messages);
    }

    @Override
    @Transactional
    public TicketResponse updateTicketStatus(UUID ticketId, UpdateTicketStatusRequest request) {
        SupportTicket ticket = findTicketById(ticketId);
        TicketStatus newStatus = request.getStatus();

        ticket.setStatus(newStatus);
        if (newStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        } else {
            ticket.setClosedAt(null);
        }

        ticketRepository.save(ticket);
        log.info("Ticket {} status updated to {}", ticket.getTicketNumber(), newStatus);

        List<TicketMessageResponse> messages = messageRepository
                .findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(TicketMessageResponse::fromEntity)
                .collect(Collectors.toList());

        return TicketResponse.fromEntityDetail(ticket, messages);
    }

    @Override
    public TicketStatsResponse getAllTicketStats() {
        long total = ticketRepository.count();
        long open = ticketRepository.countByStatus(TicketStatus.OPEN);
        long inProgress = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long closed = ticketRepository.countByStatus(TicketStatus.CLOSED);

        return TicketStatsResponse.builder()
                .total(total)
                .open(open)
                .inProgress(inProgress)
                .closed(closed)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private SupportTicket findTicketById(UUID id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SupportTicket", "id", id));
    }

    private String generateTicketNumber() {
        int next = ticketRepository.findMaxTicketSequence().orElse(0) + 1;
        return String.format("TKT-%04d", next);
    }

    private User getCurrentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(principal.getId());
    }
}
