package com.academy.controller;

import com.academy.dto.request.UpdateLessonProgressRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.LessonResponse;
import com.academy.dto.response.VideoUrlResponse;
import com.academy.service.LessonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
@Tag(name = "Lessons", description = "Lesson endpoints")
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/{id}")
    @Operation(summary = "Get lesson by ID")
    public ResponseEntity<ApiResponse<LessonResponse>> getLessonById(@PathVariable UUID id) {
        LessonResponse response = lessonService.getLessonById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/video-url")
    @Operation(summary = "Get signed video playback URL")
    public ResponseEntity<ApiResponse<VideoUrlResponse>> getVideoUrl(@PathVariable UUID id) {
        VideoUrlResponse response = lessonService.getVideoUrl(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/progress")
    @Operation(summary = "Update lesson watch progress")
    public ResponseEntity<ApiResponse<Void>> updateProgress(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLessonProgressRequest request) {
        lessonService.updateProgress(id, request);
        return ResponseEntity.ok(ApiResponse.success("Progress updated"));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark lesson as complete")
    public ResponseEntity<ApiResponse<Void>> markComplete(@PathVariable UUID id) {
        lessonService.markComplete(id);
        return ResponseEntity.ok(ApiResponse.success("Lesson marked as complete"));
    }

    @GetMapping("/{id}/resources")
    @Operation(summary = "Get lesson resources")
    public ResponseEntity<ApiResponse<String>> getResources(@PathVariable UUID id) {
        String resources = lessonService.getResourcesJson(id);
        return ResponseEntity.ok(ApiResponse.success(resources));
    }
}
