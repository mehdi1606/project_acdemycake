package com.academy.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReplyTicketRequest {

    @NotBlank(message = "Message content is required")
    private String content;
}
