package com.academy.dto.request;

import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.CourseType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseRequest {

    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    private String description;

    @Size(max = 500, message = "Short description must not exceed 500 characters")
    private String shortDescription;

    private UUID categoryId;

    private Boolean isBeginner;

    private CourseType courseType;

    private Boolean requiresPurchase;

    @DecimalMin(value = "0.0", message = "Price must be positive")
    private BigDecimal price;

    private BigDecimal originalPrice;

    private CourseLevel level;

    private CourseStatus status;

    private String language;

    private String whatYouWillLearn;

    private String requirements;

    private String targetAudience;

    private String tags;
}
