package com.academy.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitAssignmentRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private String fileUrl;
}
