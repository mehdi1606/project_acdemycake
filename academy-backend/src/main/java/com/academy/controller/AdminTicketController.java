package com.academy.controller;

import com.academy.dto.request.ReplyTicketRequest;
import com.academy.dto.request.UpdateTicketStatusRequest;
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
@RequestMapping("/api/v1/admin/tickets")
@RequiredArgsConstructor
@Tag(name = "Admin Tickets", description = "Admin support ticket management endpoints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTicketController {

    private final SupportTicketService supportTicketService;

    @GetMapping("/stats")
    @Operation(summary = "Get ticket statistics")
    public ResponseEntity<ApiResponse<TicketStatsResponse>> getStats() {
        TicketStatsResponse stats = supportTicketService.getAllTicketStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping
    @Operation(summary = "Get all support tickets")
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) TicketStatus status) {
        PageResponse<TicketResponse> tickets = supportTicketService.getAllTickets(page, size, status);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a ticket by ID")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(@PathVariable UUID id) {
        TicketResponse ticket = supportTicketService.getTicketAsAdmin(id);
        return ResponseEntity.ok(ApiResponse.success(ticket));
    }

    @PostMapping("/{id}/reply")
    @Operation(summary = "Reply to a ticket as admin")
    public ResponseEntity<ApiResponse<TicketResponse>> replyToTicket(
            @PathVariable UUID id,
            @Valid @RequestBody ReplyTicketRequest request) {
        TicketResponse ticket = supportTicketService.replyAsAdmin(id, request);
        return ResponseEntity.ok(ApiResponse.success("Reply sent", ticket));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update ticket status")
    public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        TicketResponse ticket = supportTicketService.updateTicketStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Status updated", ticket));
    }
}
