package com.academy.service.avatar;

import com.academy.exception.AvatarException;
import com.academy.exception.ErrorCode;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;

/**
 * Server-side checks for profile photos: present, at most 1 MB, and really a
 * JPEG, PNG or WebP image. The type comes from the file's own bytes (magic
 * numbers, then a full decode for JPEG/PNG), never from its name or Content-Type.
 */
public final class AvatarImageValidator {

    /** 1 MB = 1,048,576 bytes. */
    public static final long MAX_BYTES = 1024L * 1024L;

    private AvatarImageValidator() {
    }

    /** A validated photo: its bytes and the extension matching its real content. */
    public record ValidatedAvatar(byte[] bytes, String extension) {
    }

    public static ValidatedAvatar validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AvatarException(ErrorCode.AVATAR_REQUIRED, "A profile photo is required.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw tooLarge();
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new AvatarException(ErrorCode.AVATAR_INVALID_TYPE, "The profile photo could not be read.");
        }
        return validate(bytes);
    }

    public static ValidatedAvatar validate(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new AvatarException(ErrorCode.AVATAR_REQUIRED, "A profile photo is required.");
        }
        if (bytes.length > MAX_BYTES) {
            throw tooLarge();
        }
        String ext = detectExtension(bytes);
        if (ext == null || !hasValidStructure(ext, bytes)) {
            throw invalidType();
        }
        if (!"webp".equals(ext) && !decodesWithImageIo(bytes)) {
            throw invalidType();
        }
        return new ValidatedAvatar(bytes, ext);
    }

    /**
     * Pure-Java structure check (no native code): the header must describe a real
     * picture with a width and height, and the file must be complete.
     */
    static boolean hasValidStructure(String ext, byte[] b) {
        return switch (ext) {
            case "jpg" -> jpegLooksValid(b);
            case "png" -> pngLooksValid(b);
            case "webp" -> webpLooksValid(b);
            default -> false;
        };
    }

    private static boolean jpegLooksValid(byte[] b) {
        // Walk the markers up to the start-of-frame segment that carries the size.
        int i = 2;
        while (i + 3 < b.length) {
            if ((b[i] & 0xFF) != 0xFF) return false;
            int marker = b[i + 1] & 0xFF;
            if (marker == 0xFF) { i++; continue; }                       // fill byte
            if (marker == 0xD8 || marker == 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }
            if (marker == 0xD9 || marker == 0xDA) return false;          // end or scan before a frame header
            int len = ((b[i + 2] & 0xFF) << 8) | (b[i + 3] & 0xFF);
            if (len < 2 || i + 2 + len > b.length) return false;
            boolean sof = marker >= 0xC0 && marker <= 0xCF && marker != 0xC4 && marker != 0xC8 && marker != 0xCC;
            if (sof) {
                if (len < 8) return false;
                int h = ((b[i + 5] & 0xFF) << 8) | (b[i + 6] & 0xFF);
                int w = ((b[i + 7] & 0xFF) << 8) | (b[i + 8] & 0xFF);
                return w > 0 && h > 0 && hasJpegEnd(b);
            }
            i += 2 + len;
        }
        return false;
    }

    private static boolean hasJpegEnd(byte[] b) {
        // End-of-image marker near the end (some devices append padding bytes).
        int from = Math.max(2, b.length - 4096);
        for (int i = b.length - 2; i >= from; i--) {
            if ((b[i] & 0xFF) == 0xFF && (b[i + 1] & 0xFF) == 0xD9) return true;
        }
        return false;
    }

    private static boolean pngLooksValid(byte[] b) {
        if (b.length < 8 + 25 + 12) return false;
        boolean ihdr = readInt(b, 8) == 13 && b[12] == 'I' && b[13] == 'H' && b[14] == 'D' && b[15] == 'R';
        if (!ihdr) return false;
        long w = readInt(b, 16) & 0xFFFFFFFFL;
        long h = readInt(b, 20) & 0xFFFFFFFFL;
        int n = b.length;
        boolean iend = b[n - 8] == 'I' && b[n - 7] == 'E' && b[n - 6] == 'N' && b[n - 5] == 'D';
        return w > 0 && h > 0 && iend;
    }

    private static boolean webpLooksValid(byte[] b) {
        long riffSize = (b[4] & 0xFFL) | (b[5] & 0xFFL) << 8 | (b[6] & 0xFFL) << 16 | (b[7] & 0xFFL) << 24;
        char kind = (char) b[15];
        return riffSize >= 8 && riffSize + 8 <= b.length && (kind == ' ' || kind == 'L' || kind == 'X');
    }

    private static int readInt(byte[] b, int at) {
        return (b[at] & 0xFF) << 24 | (b[at + 1] & 0xFF) << 16 | (b[at + 2] & 0xFF) << 8 | (b[at + 3] & 0xFF);
    }

    /**
     * Full JPEG/PNG decode with the JDK. On a runtime without the native imaging
     * library (a stripped JDK) the structure check above is the only check.
     */
    static boolean decodesWithImageIo(byte[] bytes) {
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
            return img != null && img.getWidth() > 0 && img.getHeight() > 0;
        } catch (IOException | RuntimeException e) {
            return false;
        } catch (LinkageError e) {
            return true;
        }
    }

    /** "jpg", "png" or "webp" from the magic bytes; null for anything else. */
    static String detectExtension(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "png";
        }
        if (b.length >= 16 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P'
                && b[12] == 'V' && b[13] == 'P' && b[14] == '8') {
            return "webp";
        }
        return null;
    }

    private static AvatarException tooLarge() {
        return new AvatarException(ErrorCode.AVATAR_TOO_LARGE, "The profile photo must be 1 MB or smaller.");
    }

    private static AvatarException invalidType() {
        return new AvatarException(ErrorCode.AVATAR_INVALID_TYPE,
                "The profile photo must be a JPEG, PNG or WebP image.");
    }
}
