package com.academy.dto.request;

import com.academy.entity.enums.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLessonRequest {

    @NotBlank(message = "Lesson title is required")
    @Size(min = 2, max = 255, message = "Title must be between 2 and 255 characters")
    private String title;

    private String description;

    private ContentType contentType = ContentType.VIDEO;

    private String textContent;

    private Boolean isPreview = false;

    private Integer orderIndex;
}
