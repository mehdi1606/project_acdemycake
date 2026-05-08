package com.academy.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Serves uploaded files with correct Content-Type and Content-Disposition headers
 * so PDFs and images display inline in the browser instead of being downloaded.
 *
 * Replaces the static-resource handler in WebMvcConfig for /files/** so that
 * we have full control over response headers.
 */
@RestController
@RequestMapping("/files")
public class FileController {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    // MIME types that should display inline in the browser
    private static final Map<String, String> INLINE_TYPES = Map.of(
        "pdf",  "application/pdf",
        "png",  "image/png",
        "jpg",  "image/jpeg",
        "jpeg", "image/jpeg",
        "gif",  "image/gif",
        "webp", "image/webp",
        "svg",  "image/svg+xml",
        "mp4",  "video/mp4",
        "webm", "video/webm",
        "ogg",  "video/ogg"
    );

    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request) {
        // Extract the relative path after /files/
        String requestUri = request.getRequestURI();
        String relativePath = requestUri.startsWith("/files/")
            ? requestUri.substring("/files/".length())
            : requestUri;

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath   = uploadPath.resolve(relativePath).normalize();

            // Security: prevent path traversal
            if (!filePath.startsWith(uploadPath)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Determine content type from extension
            String filename  = filePath.getFileName().toString();
            String extension = "";
            int dot = filename.lastIndexOf('.');
            if (dot >= 0) extension = filename.substring(dot + 1).toLowerCase();

            String mimeType       = INLINE_TYPES.getOrDefault(extension, MediaType.APPLICATION_OCTET_STREAM_VALUE);
            boolean displayInline = INLINE_TYPES.containsKey(extension);

            String disposition = displayInline
                ? "inline; filename=\"" + filename + "\""
                : "attachment; filename=\"" + filename + "\"";

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                .header("X-Frame-Options", "SAMEORIGIN")
                .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
