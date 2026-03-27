package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumResponse {
    private UUID courseId;
    private String courseTitle;
    private Integer totalModules;
    private Integer totalLessons;
    private Integer totalDurationSeconds;
    private List<ModuleResponse> modules;
}
