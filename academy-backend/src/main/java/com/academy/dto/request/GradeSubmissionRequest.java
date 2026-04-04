package com.academy.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GradeSubmissionRequest {

    @NotNull(message = "Grade is required")
    @Min(value = 0, message = "Grade cannot be negative")
    @Max(value = 10000, message = "Grade is too high")
    private Integer grade;

    private String feedback;
}
