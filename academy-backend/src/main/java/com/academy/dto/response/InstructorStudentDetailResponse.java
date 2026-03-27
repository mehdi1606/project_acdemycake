package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorStudentDetailResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String avatarUrl;
    private LocalDateTime joinedAt;
    private int enrolledCoursesCount;
    private double averageProgress;
    private LocalDateTime firstEnrolledAt;
    private LocalDateTime lastAccessedAt;
    private List<EnrollmentResponse> enrolledCourses;
}
