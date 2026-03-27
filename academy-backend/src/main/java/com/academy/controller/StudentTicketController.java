package com.academy.controller;

import com.academy.dto.request.CreateTicketRequest;
import com.academy.dto.request.ReplyTicketRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.TicketResponse;
import com.academy.dto.response.TicketStatsResponse;
import com.academy.entity.enums.TicketStatus;
import com.academy.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/tickets")
@RequiredArgsConstructor
@Tag(name = "Student Tickets", description = "Student support ticket endpoints")
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
public class StudentTicketController {

    private final SupportTicketService supportTicketService;

    @GetMapping("/stats")
    @Operation(summary = "Get my ticket statistics")
    public ResponseEntity<ApiResponse<TicketStatsResponse>> getMyStats() {
        TicketStatsResponse stats = supportTicketService.getMyTicketStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping
    @Operation(summary = "Get my tickets")
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getMyTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) TicketStatus status) {
        PageResponse<TicketResponse> tickets = supportTicketService.getMyTickets(page, size, status);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a ticket by ID")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(@PathVariable UUID id) {
        TicketResponse ticket = supportTicketService.getMyTicket(id);
        return ResponseEntity.ok(ApiResponse.success(ticket));
    }

    @PostMapping
    @Operation(summary = "Create a new support ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @Valid @RequestBody CreateTicketRequest request) {
        TicketResponse ticket = supportTicketService.createTicket(request);
        return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
    }

    @PostMapping("/{id}/reply")
    @Operation(summary = "Reply to a ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> replyToTicket(
            @PathVariable UUID id,
            @Valid @RequestBody ReplyTicketRequest request) {
        TicketResponse ticket = supportTicketService.replyToMyTicket(id, request);
        return ResponseEntity.ok(ApiResponse.success("Reply sent", ticket));
    }

    @PutMapping("/{id}/close")
    @Operation(summary = "Close a ticket")
    public ResponseEntity<ApiResponse<Void>> closeTicket(@PathVariable UUID id) {
        supportTicketService.closeMyTicket(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket closed"));
    }
}
