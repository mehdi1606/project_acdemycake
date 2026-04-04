package com.academy.exception;

import com.academy.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralized exception handler. Catches every possible exception and converts
 * it into a clean, structured {@link ApiResponse} with:
 * <ul>
 *   <li>{@code success: false}</li>
 *   <li>A human-readable {@code message}</li>
 *   <li>A machine-readable {@code errorCode} (e.g. "AUTH_001")</li>
 *   <li>Per-field {@code errors} map for validation failures</li>
 *   <li>The request {@code path} for easy debugging</li>
 * </ul>
 *
 * Handler priority (most specific → most generic):
 * 1. Custom domain exceptions
 * 2. Spring Security exceptions
 * 3. Spring Web / MVC exceptions
 * 4. Jakarta Validation exceptions
 * 5. Database exceptions
 * 6. Generic fallback
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. CUSTOM DOMAIN EXCEPTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.NOT_FOUND,
                ex.getMessage(),
                ErrorCode.NOT_FOUND,
                request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(
            BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                ErrorCode.BAD_REQUEST,
                request);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
            UnauthorizedException ex, HttpServletRequest request) {
        log.warn("Unauthorized [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                ErrorCode.UNAUTHORIZED,
                request);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(
            ForbiddenException ex, HttpServletRequest request) {
        log.warn("Forbidden [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.FORBIDDEN,
                ex.getMessage(),
                ErrorCode.FORBIDDEN,
                request);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(
            ConflictException ex, HttpServletRequest request) {
        log.warn("Conflict [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.CONFLICT,
                ex.getMessage(),
                ErrorCode.CONFLICT,
                request);
    }

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<ApiResponse<Void>> handlePayment(
            PaymentException ex, HttpServletRequest request) {
        log.error("Payment error [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.PAYMENT_REQUIRED,
                ex.getMessage(),
                ErrorCode.PAYMENT_FAILED,
                request);
    }

    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<ApiResponse<Void>> handleRateLimit(
            RateLimitException ex, HttpServletRequest request) {
        log.warn("Rate limit exceeded [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.TOO_MANY_REQUESTS,
                ex.getMessage(),
                ErrorCode.RATE_LIMIT_EXCEEDED,
                request);
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<ApiResponse<Void>> handleServiceUnavailable(
            ServiceUnavailableException ex, HttpServletRequest request) {
        log.error("Service unavailable [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.SERVICE_UNAVAILABLE,
                ex.getMessage(),
                ErrorCode.SERVICE_UNAVAILABLE,
                request);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. SPRING SECURITY EXCEPTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /** Wrong email or password. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Bad credentials [{}]", request.getRequestURI());
        return build(HttpStatus.UNAUTHORIZED,
                "Invalid email or password.",
                ErrorCode.INVALID_CREDENTIALS,
                request);
    }

    /** Account set to disabled (e.g. soft-deleted). */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<Void>> handleDisabled(
            DisabledException ex, HttpServletRequest request) {
        log.warn("Disabled account [{}]", request.getRequestURI());
        return build(HttpStatus.UNAUTHORIZED,
                "Your account has been disabled. Please contact support.",
                ErrorCode.ACCOUNT_DISABLED,
                request);
    }

    /** Account temporarily locked after too many failed attempts. */
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<Void>> handleLocked(
            LockedException ex, HttpServletRequest request) {
        log.warn("Locked account [{}]", request.getRequestURI());
        return build(HttpStatus.UNAUTHORIZED,
                "Your account has been temporarily locked. Please try again later.",
                ErrorCode.ACCOUNT_LOCKED,
                request);
    }

    /** Anonymous user trying to access a protected resource. */
    @ExceptionHandler(InsufficientAuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleInsufficientAuth(
            InsufficientAuthenticationException ex, HttpServletRequest request) {
        log.warn("Insufficient authentication [{}]", request.getRequestURI());
        return build(HttpStatus.UNAUTHORIZED,
                "You must be logged in to access this resource.",
                ErrorCode.INSUFFICIENT_AUTHENTICATION,
                request);
    }

    /** Authenticated user lacks required role/permission. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied [{}]", request.getRequestURI());
        return build(HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action.",
                ErrorCode.FORBIDDEN,
                request);
    }

    /** Catch-all for remaining Spring Security authentication failures. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication failed [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED,
                "Authentication failed. Please log in again.",
                ErrorCode.UNAUTHORIZED,
                request);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. SPRING WEB / MVC EXCEPTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @Valid / @Validated failures on @RequestBody.
     * Returns per-field error messages in the {@code errors} map.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = (error instanceof FieldError fe) ? fe.getField() : error.getObjectName();
            errors.put(field, error.getDefaultMessage());
        });

        log.warn("Validation failed [{}]: {}", request.getRequestURI(), errors);

        ApiResponse<Void> body = ApiResponse.<Void>validationError(errors)
                .withPath(request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * @Validated on controller method parameters (path vars, query params).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        Map<String, String> errors = ex.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        cv -> {
                            String path = cv.getPropertyPath().toString();
                            // Strip method name prefix: "methodName.paramName" → "paramName"
                            return path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
                        },
                        ConstraintViolation::getMessage,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        log.warn("Constraint violation [{}]: {}", request.getRequestURI(), errors);

        ApiResponse<Void> body = ApiResponse.<Void>validationError(errors)
                .withPath(request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Request body is missing, empty, or contains invalid JSON syntax.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed request body [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST,
                "Request body is missing or contains invalid JSON.",
                ErrorCode.MALFORMED_REQUEST,
                request);
    }

    /**
     * Wrong HTTP method (e.g. GET on a POST-only endpoint).
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        String allowed = String.join(", ", ex.getSupportedMethods() != null
                ? ex.getSupportedMethods() : new String[]{});
        log.warn("Method not allowed [{}]: {} — allowed: {}", request.getRequestURI(), ex.getMethod(), allowed);
        return build(HttpStatus.METHOD_NOT_ALLOWED,
                String.format("HTTP method '%s' is not supported. Allowed: %s.", ex.getMethod(), allowed),
                ErrorCode.METHOD_NOT_ALLOWED,
                request);
    }

    /**
     * Content-Type header not supported (e.g. sending XML to a JSON endpoint).
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        log.warn("Unsupported media type [{}]: {}", request.getRequestURI(), ex.getContentType());
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                String.format("Content type '%s' is not supported. Use 'application/json'.", ex.getContentType()),
                ErrorCode.UNSUPPORTED_MEDIA_TYPE,
                request);
    }

    /**
     * Accept header cannot be satisfied by the endpoint.
     */
    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMediaTypeNotAcceptable(
            HttpMediaTypeNotAcceptableException ex, HttpServletRequest request) {
        log.warn("Not acceptable [{}]", request.getRequestURI());
        return build(HttpStatus.NOT_ACCEPTABLE,
                "Requested response format is not supported.",
                ErrorCode.NOT_ACCEPTABLE,
                request);
    }

    /**
     * Required @RequestParam missing from the request.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        log.warn("Missing request parameter [{}]: {}", request.getRequestURI(), ex.getParameterName());
        return build(HttpStatus.BAD_REQUEST,
                String.format("Required parameter '%s' is missing.", ex.getParameterName()),
                ErrorCode.MISSING_PARAMETER,
                request);
    }

    /**
     * Required @PathVariable missing (usually indicates a routing misconfiguration).
     */
    @ExceptionHandler(MissingPathVariableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingPathVariable(
            MissingPathVariableException ex, HttpServletRequest request) {
        log.warn("Missing path variable [{}]: {}", request.getRequestURI(), ex.getVariableName());
        return build(HttpStatus.BAD_REQUEST,
                String.format("Required path variable '%s' is missing.", ex.getVariableName()),
                ErrorCode.MISSING_PATH_VARIABLE,
                request);
    }

    /**
     * @PathVariable or @RequestParam has wrong type (e.g. "abc" for a Long).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String expected = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown";
        log.warn("Type mismatch [{}]: param '{}' expected {}", request.getRequestURI(), ex.getName(), expected);
        return build(HttpStatus.BAD_REQUEST,
                String.format("Parameter '%s' must be of type %s.", ex.getName(), expected),
                ErrorCode.INVALID_PARAMETER_TYPE,
                request);
    }

    /**
     * No route matched the request URI.
     * Requires spring.mvc.throw-exception-if-no-handler-found=true in application.yml.
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoHandler(
            NoHandlerFoundException ex, HttpServletRequest request) {
        log.warn("No handler found [{}] {}", ex.getHttpMethod(), request.getRequestURI());
        return build(HttpStatus.NOT_FOUND,
                String.format("Endpoint '%s %s' does not exist.", ex.getHttpMethod(), ex.getRequestURL()),
                ErrorCode.NOT_FOUND,
                request);
    }

    /**
     * File upload exceeds configured maximum size.
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("File too large [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.PAYLOAD_TOO_LARGE,
                "Uploaded file exceeds the maximum allowed size (50 MB).",
                ErrorCode.BAD_REQUEST,
                request);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. DATABASE / PERSISTENCE EXCEPTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Database constraint violation (duplicate key, FK, NOT NULL, etc.).
     * The raw DB message is never exposed — a safe generic message is used instead.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        log.error("Data integrity violation [{}]: {}", request.getRequestURI(), ex.getMessage());

        // Try to give a friendlier message for duplicate-key violations
        String msg = "The operation could not be completed due to a data conflict.";
        String root = ex.getRootCause() != null ? ex.getRootCause().getMessage() : "";
        if (root.contains("duplicate key") || root.contains("unique constraint")) {
            msg = "A record with the same value already exists.";
        } else if (root.contains("foreign key") || root.contains("violates foreign key")) {
            msg = "The operation references a resource that does not exist.";
        } else if (root.contains("not-null") || root.contains("null value in column")) {
            msg = "A required field value is missing.";
        }

        return build(HttpStatus.CONFLICT, msg, ErrorCode.CONFLICT, request);
    }

    /**
     * Optimistic locking conflict — concurrent update detected.
     */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLocking(
            OptimisticLockingFailureException ex, HttpServletRequest request) {
        log.warn("Optimistic lock failure [{}]", request.getRequestURI());
        return build(HttpStatus.CONFLICT,
                "The resource was modified by another request. Please refresh and try again.",
                ErrorCode.CONFLICT,
                request);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. COMMON JAVA RUNTIME EXCEPTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Illegal argument passed to a service method.
     * Treated as a client error (400).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Illegal argument [{}]: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST,
                ex.getMessage() != null ? ex.getMessage() : "Invalid input provided.",
                ErrorCode.BAD_REQUEST,
                request);
    }

    /**
     * Illegal state — usually a programming error or inconsistent app state.
     * Treated as a server error (500).
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(
            IllegalStateException ex, HttpServletRequest request) {
        log.error("Illegal state [{}]: {}", request.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected server error occurred. Please try again later.",
                ErrorCode.INTERNAL_ERROR,
                request);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. CATCH-ALL FALLBACK
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Last-resort handler for any unhandled exception.
     * Logs the full stack trace; returns a safe generic message (no internals leaked).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(
            Exception ex, HttpServletRequest request) {
        log.error("Unexpected error [{}]: {}", request.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.",
                ErrorCode.INTERNAL_ERROR,
                request);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private ResponseEntity<ApiResponse<Void>> build(
            HttpStatus status,
            String message,
            ErrorCode code,
            HttpServletRequest request) {

        ApiResponse<Void> body = ApiResponse.<Void>error(message, code.getCode())
                .withPath(request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
