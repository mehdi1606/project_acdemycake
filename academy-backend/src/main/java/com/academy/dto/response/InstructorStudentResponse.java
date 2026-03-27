package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorStudentResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String avatarUrl;
    private int enrolledCoursesCount;   // number of this instructor's courses the student is in
    private double averageProgress;     // average progress across those courses (0–100)
    private LocalDateTime firstEnrolledAt;
    private LocalDateTime lastAccessedAt;
}
