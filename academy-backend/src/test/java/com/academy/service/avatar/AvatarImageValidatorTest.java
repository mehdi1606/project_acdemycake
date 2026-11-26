package com.academy.service.avatar;

import com.academy.exception.AvatarException;
import com.academy.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Arrays;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

/** Server-side profile-photo rules: required, 1 MB max, real JPEG/PNG/WebP content. */
class AvatarImageValidatorTest {

    // 8x8 images, embedded so the test needs no AWT.
    private static final byte[] JPEG = Base64.getDecoder().decode(
            "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDzOiiike+f/9k=");
    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGNMlTFiwAaYsIoOWgkAka0AwwpXurEAAAAASUVORK5CYII=");
    private static final byte[] WEBP = Base64.getDecoder().decode(
            "UklGRjAAAABXRUJQVlA4ICQAAABQAQCdASoIAAgAAUAmJaAABAAAAP74tOf//G8f67v8ot6AAAA=");
    private static final byte[] GIF = Base64.getDecoder().decode(
            "R0lGODdhCAAIAIEAAGUcMgAAAAAAAAAAACwAAAAACAAIAAAIDwABCBxIsKDBgwgTKkwYEAA7");

    private static ErrorCode codeOf(Runnable r) {
        try {
            r.run();
        } catch (AvatarException e) {
            return e.getErrorCode();
        }
        throw new AssertionError("expected an AvatarException");
    }

    @Test
    void acceptsRealJpegPngAndWebp() {
        assertThat(AvatarImageValidator.validate(JPEG).extension()).isEqualTo("jpg");
        assertThat(AvatarImageValidator.validate(PNG).extension()).isEqualTo("png");
        assertThat(AvatarImageValidator.validate(WEBP).extension()).isEqualTo("webp");
    }

    @Test
    void extensionComesFromContentNotFromName() {
        MockMultipartFile f = new MockMultipartFile("avatar", "me.gif", "image/gif", PNG);
        assertThat(AvatarImageValidator.validate(f).extension()).isEqualTo("png");
    }

    @Test
    void missingPhotoIsRequired() {
        assertThat(codeOf(() -> AvatarImageValidator.validate((MockMultipartFile) null)))
                .isEqualTo(ErrorCode.AVATAR_REQUIRED);
        assertThat(codeOf(() -> AvatarImageValidator.validate(
                new MockMultipartFile("avatar", "a.jpg", "image/jpeg", new byte[0]))))
                .isEqualTo(ErrorCode.AVATAR_REQUIRED);
    }

    @Test
    void rejectsAnythingOverOneMegabyte() {
        byte[] big = Arrays.copyOf(JPEG, (int) AvatarImageValidator.MAX_BYTES + 1);
        assertThat(codeOf(() -> AvatarImageValidator.validate(big))).isEqualTo(ErrorCode.AVATAR_TOO_LARGE);
        assertThat(codeOf(() -> AvatarImageValidator.validate(
                new MockMultipartFile("avatar", "a.jpg", "image/jpeg", big))))
                .isEqualTo(ErrorCode.AVATAR_TOO_LARGE);
    }

    @Test
    void exactlyOneMegabyteIsNotTooLarge() {
        byte[] webp = Arrays.copyOf(WEBP, (int) AvatarImageValidator.MAX_BYTES);
        assertThat(AvatarImageValidator.validate(webp).extension()).isEqualTo("webp");
    }

    @Test
    void rejectsNonImagesGifAndForgedHeaders() {
        byte[] text = "<?php echo 'hi'; ?>".getBytes();
        assertThat(codeOf(() -> AvatarImageValidator.validate(
                new MockMultipartFile("avatar", "me.jpg", "image/jpeg", text))))
                .isEqualTo(ErrorCode.AVATAR_INVALID_TYPE);
        assertThat(codeOf(() -> AvatarImageValidator.validate(GIF))).isEqualTo(ErrorCode.AVATAR_INVALID_TYPE);

        byte[] forgedJpeg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1, 2, 3, 4, 5, 6, 7};
        assertThat(codeOf(() -> AvatarImageValidator.validate(forgedJpeg))).isEqualTo(ErrorCode.AVATAR_INVALID_TYPE);

        byte[] truncatedPng = Arrays.copyOf(PNG, PNG.length - 12);
        assertThat(codeOf(() -> AvatarImageValidator.validate(truncatedPng))).isEqualTo(ErrorCode.AVATAR_INVALID_TYPE);

        byte[] truncatedWebp = Arrays.copyOf(WEBP, 20);
        assertThat(codeOf(() -> AvatarImageValidator.validate(truncatedWebp))).isEqualTo(ErrorCode.AVATAR_INVALID_TYPE);
    }
}
