package com.academy.dto.response;

import com.academy.entity.CourseModule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleResponse {
    private UUID id;
    private String title;
    private String description;
    private Integer orderIndex;
    private Integer lessonsCount;
    private Integer totalDurationSeconds;
    private List<LessonResponse> lessons;

    public static ModuleResponse fromEntity(CourseModule module) {
        return fromEntity(module, false);
    }

    public static ModuleResponse fromEntity(CourseModule module, boolean includeLessons) {
        ModuleResponseBuilder builder = ModuleResponse.builder()
                .id(module.getId())
                .title(module.getTitle())
                .description(module.getDescription())
                .orderIndex(module.getOrderIndex())
                .lessonsCount(module.getLessons() != null ? module.getLessons().size() : 0)
                .totalDurationSeconds(module.getTotalDurationSeconds());

        if (includeLessons && module.getLessons() != null) {
            builder.lessons(module.getLessons().stream()
                    .map(LessonResponse::fromEntity)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
