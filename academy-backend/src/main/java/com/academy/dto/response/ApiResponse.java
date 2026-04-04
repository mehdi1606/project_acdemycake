package com.academy.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Unified API response envelope returned by every endpoint.
 *
 * <pre>
 * Success:  { success: true,  message: "...", data: {...},   timestamp: "..." }
 * Error:    { success: false, message: "...", errorCode: "AUTH_001",
 *             errors: { field: "msg" },  path: "/api/v1/...", timestamp: "..." }
 * </pre>
 *
 * Fields are omitted from JSON when null (@JsonInclude NON_NULL).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /** true for successful responses, false for errors. */
    private boolean success;

    /** Human-readable message. */
    private String message;

    /**
     * Machine-readable error code (e.g. "AUTH_001").
     * Present only on error responses.
     */
    private String errorCode;

    /** Response payload. Null on error responses. */
    private T data;

    /**
     * Field-level validation errors: { "fieldName": "error message" }.
     * Present only when errorCode == "VAL_001".
     */
    private Map<String, String> errors;

    /**
     * Request URI that triggered the error (e.g. "/api/v1/auth/login").
     * Present only on error responses.
     */
    private String path;

    /** UTC timestamp of the response. */
    private LocalDateTime timestamp;

    // ── Success factories ─────────────────────────────────────────────────────

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ── Error factories ───────────────────────────────────────────────────────

    /** Simple error — no machine-readable code. */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /** Error with a machine-readable error code string. */
    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /** Validation error — carries per-field messages. */
    public static <T> ApiResponse<T> validationError(Map<String, String> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message("Validation failed. Please check the highlighted fields.")
                .errorCode("VAL_001")
                .errors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ── Fluent enrichment ─────────────────────────────────────────────────────

    /** Attaches the request URI to the response for debugging. */
    public ApiResponse<T> withPath(String path) {
        this.path = path;
        return this;
    }
}
