package com.academy.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLessonProgressRequest {

    @NotNull(message = "Position is required")
    @Min(value = 0, message = "Position must be positive")
    private Integer positionSeconds;

    @NotNull(message = "Duration is required")
    @Min(value = 0, message = "Duration must be positive")
    private Integer durationSeconds;

    private Boolean markComplete = false;
}
