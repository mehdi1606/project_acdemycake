package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedInstructorResponse {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String bio;
    private long totalCourses;
    private long totalStudents;
    private double averageRating;
}
