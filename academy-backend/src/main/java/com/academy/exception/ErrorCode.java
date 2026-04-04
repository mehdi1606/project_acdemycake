package com.academy.exception;

/**
 * Machine-readable error codes returned in every error response.
 * Format: CATEGORY_NNN — lets the frontend handle specific cases programmatically.
 */
public enum ErrorCode {

    // ── Authentication ────────────────────────────────────────────────────────
    /** Wrong email or password */
    INVALID_CREDENTIALS("AUTH_001"),
    /** Account banned by an administrator */
    ACCOUNT_BANNED("AUTH_002"),
    /** Account disabled */
    ACCOUNT_DISABLED("AUTH_003"),
    /** Account temporarily locked */
    ACCOUNT_LOCKED("AUTH_004"),
    /** JWT access token has expired */
    TOKEN_EXPIRED("AUTH_005"),
    /** JWT token is malformed or has an invalid signature */
    TOKEN_INVALID("AUTH_006"),
    /** Request requires authentication */
    UNAUTHORIZED("AUTH_007"),
    /** Authenticated but email not yet verified */
    EMAIL_NOT_VERIFIED("AUTH_008"),
    /** Not fully authenticated (anonymous user on protected route) */
    INSUFFICIENT_AUTHENTICATION("AUTH_009"),

    // ── Authorization ─────────────────────────────────────────────────────────
    /** Authenticated but insufficient role/permissions */
    FORBIDDEN("AUTHZ_001"),

    // ── Validation ────────────────────────────────────────────────────────────
    /** @Valid / @Validated field-level failures */
    VALIDATION_FAILED("VAL_001"),
    /** Required request parameter missing */
    MISSING_PARAMETER("VAL_002"),
    /** Path variable or query param has wrong type */
    INVALID_PARAMETER_TYPE("VAL_003"),
    /** Request body is missing or malformed JSON */
    MALFORMED_REQUEST("VAL_004"),
    /** Content-Type not supported by the endpoint */
    UNSUPPORTED_MEDIA_TYPE("VAL_005"),
    /** HTTP method not allowed on this endpoint */
    METHOD_NOT_ALLOWED("VAL_006"),
    /** Accept header cannot be satisfied */
    NOT_ACCEPTABLE("VAL_007"),
    /** Missing required path variable */
    MISSING_PATH_VARIABLE("VAL_008"),

    // ── Resources ─────────────────────────────────────────────────────────────
    /** Requested resource does not exist */
    NOT_FOUND("RES_001"),
    /** Conflict with existing resource (duplicate, FK violation, etc.) */
    CONFLICT("RES_002"),

    // ── Business logic ────────────────────────────────────────────────────────
    /** General bad request from application logic */
    BAD_REQUEST("BUS_001"),
    /** Payment processing error */
    PAYMENT_FAILED("BUS_002"),

    // ── Rate limiting ─────────────────────────────────────────────────────────
    /** Too many requests — client is being throttled */
    RATE_LIMIT_EXCEEDED("RATE_001"),

    // ── Server ────────────────────────────────────────────────────────────────
    /** Unexpected internal server error */
    INTERNAL_ERROR("SRV_001"),
    /** Downstream service temporarily unavailable */
    SERVICE_UNAVAILABLE("SRV_002"),
    /** Database / persistence error */
    DATABASE_ERROR("SRV_003");

    // ─────────────────────────────────────────────────────────────────────────

    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    @Override
    public String toString() {
        return code;
    }
}
