package com.academy.exception;

/**
 * A rejected profile photo. Extends {@link BadRequestException} so existing callers
 * still see a 400, but carries a dedicated {@link ErrorCode} (AVATAR_001..003).
 */
public class AvatarException extends BadRequestException {

    private final ErrorCode errorCode;

    public AvatarException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
