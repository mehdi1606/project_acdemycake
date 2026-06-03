package com.academy.service.impl;

import com.academy.exception.BadRequestException;
import com.academy.service.VideoStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.UUID;

@Slf4j
@Service
public class VideoStorageServiceImpl implements VideoStorageService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    /** Hard limit: 4 GB per video file. */
    private static final long MAX_VIDEO_SIZE = 4L * 1024 * 1024 * 1024;

    // ── Store ────────────────────────────────────────────────────────────────

    @Override
    public String storeVideo(InputStream inputStream, String originalFilename, long fileSize) {
        if (fileSize > MAX_VIDEO_SIZE) {
            throw new BadRequestException("Video file exceeds maximum allowed size (4 GB)");
        }

        String extension = extractExtension(originalFilename);
        String filename  = UUID.randomUUID() + "." + extension;
        Path   videoDir  = Paths.get(uploadDir, "videos");

        try {
            Files.createDirectories(videoDir);
            Path targetPath = videoDir.resolve(filename);
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "videos/" + filename;
            log.info("Video stored: {}", relativePath);
            return relativePath;
        } catch (IOException e) {
            log.error("Failed to store video: {}", e.getMessage());
            throw new BadRequestException("Failed to store video: " + e.getMessage());
        }
    }

    // ── Stream ───────────────────────────────────────────────────────────────

    @Override
    public InputStream streamVideo(String filePath, long rangeStart, long rangeEnd) throws IOException {
        Path path = Paths.get(uploadDir, filePath);
        if (!Files.exists(path)) {
            throw new BadRequestException("Video file not found on server");
        }
        RandomAccessFile raf = new RandomAccessFile(path.toFile(), "r");
        raf.seek(rangeStart);
        long bytesToRead = rangeEnd - rangeStart + 1;
        return new BoundedInputStream(raf, bytesToRead);
    }

    // ── Delete / query ───────────────────────────────────────────────────────

    @Override
    public void deleteVideo(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(uploadDir, filePath));
            log.info("Video deleted: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete video {}: {}", filePath, e.getMessage());
        }
    }

    @Override
    public long getVideoSize(String filePath) {
        try {
            return Files.size(Paths.get(uploadDir, filePath));
        } catch (IOException e) {
            throw new BadRequestException("Cannot determine video file size: " + e.getMessage());
        }
    }

    @Override
    public boolean videoExists(String filePath) {
        return filePath != null && Files.exists(Paths.get(uploadDir, filePath));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "mp4";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    /**
     * Wraps a {@link RandomAccessFile} so that reads stop exactly at
     * {@code length} bytes, without relying on OS-level file truncation.
     */
    private static final class BoundedInputStream extends InputStream {

        private final RandomAccessFile raf;
        private long remaining;

        BoundedInputStream(RandomAccessFile raf, long length) {
            this.raf       = raf;
            this.remaining = length;
        }

        @Override
        public int read() throws IOException {
            if (remaining <= 0) return -1;
            remaining--;
            return raf.read();
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (remaining <= 0) return -1;
            int toRead    = (int) Math.min(len, remaining);
            int bytesRead = raf.read(b, off, toRead);
            if (bytesRead > 0) remaining -= bytesRead;
            return bytesRead;
        }

        @Override
        public void close() throws IOException {
            raf.close();
        }
    }
}
