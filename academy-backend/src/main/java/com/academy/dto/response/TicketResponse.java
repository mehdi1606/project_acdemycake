package com.academy.dto.response;

import com.academy.entity.SupportTicket;
import com.academy.entity.enums.TicketCategory;
import com.academy.entity.enums.TicketPriority;
import com.academy.entity.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private UUID id;
    private String ticketNumber;
    private String subject;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;
    private TicketCategory category;

    // Student info (visible to admin)
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String studentAvatar;

    private int messageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;

    // Populated only in detail view (null in list view)
    private List<TicketMessageResponse> messages;

    /** Summary (for list view — no messages loaded) */
    public static TicketResponse fromEntitySummary(SupportTicket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .category(ticket.getCategory())
                .studentId(ticket.getStudent().getId())
                .studentName(ticket.getStudent().getFullName())
                .studentEmail(ticket.getStudent().getEmail())
                .studentAvatar(ticket.getStudent().getAvatarUrl())
                .messageCount(ticket.getMessages() != null ? ticket.getMessages().size() : 0)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .closedAt(ticket.getClosedAt())
                .build();
    }

    /** Detail (for single ticket view — messages included) */
    public static TicketResponse fromEntityDetail(SupportTicket ticket, List<TicketMessageResponse> messages) {
        TicketResponse response = fromEntitySummary(ticket);
        response.setMessages(messages);
        return response;
    }
}
