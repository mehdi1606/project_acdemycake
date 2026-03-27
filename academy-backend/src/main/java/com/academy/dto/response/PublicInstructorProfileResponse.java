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
public class PublicInstructorProfileResponse {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String bio;
    private String socialLinks;
    private long totalCourses;
    private long totalStudents;
    private double averageRating;
    private long totalReviews;
}
