package com.academy.integration.mux;

import com.academy.dto.response.VideoUrlResponse;
import com.academy.entity.CourseLesson;
import com.academy.exception.BadRequestException;
import com.academy.repository.CourseLessonRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpDelete;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpPut;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.FileEntity;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.http.ContentType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MuxService {

    private final CourseLessonRepository lessonRepository;
    private final ObjectMapper objectMapper;

    @Value("${mux.token-id}")
    private String muxTokenId;

    @Value("${mux.token-secret}")
    private String muxTokenSecret;

    @Value("${mux.signing-key-id}")
    private String signingKeyId;

    @Value("${mux.signing-private-key}")
    private String signingPrivateKey;

    @Value("${mux.webhook-secret}")
    private String webhookSecret;

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Value("${app.file.base-url}")
    private String baseUrl;

    private static final String MUX_API_BASE = "https://api.mux.com";
    private static final String LOCAL_VIDEO_PREFIX = "local:";

    /**
     * Check if MUX is configured with valid credentials
     */
    public boolean isMuxConfigured() {
        return muxTokenId != null && !muxTokenId.isBlank()
                && muxTokenSecret != null && !muxTokenSecret.isBlank();
    }

    private String getBasicAuthHeader() {
        String auth = muxTokenId + ":" + muxTokenSecret;
        return "Basic " + Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
    }

    public String createDirectUploadUrl(UUID lessonId) {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            String requestBody = String.format("""
                {
                    "cors_origin": "*",
                    "new_asset_settings": {
                        "playback_policy": ["signed"],
                        "passthrough": "%s"
                    }
                }
                """, lessonId.toString());

            HttpPost request = new HttpPost(MUX_API_BASE + "/video/v1/uploads");
            request.setHeader("Content-Type", "application/json");
            request.setHeader("Authorization", getBasicAuthHeader());
            request.setEntity(new StringEntity(requestBody));

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity());
                JsonNode jsonResponse = objectMapper.readTree(responseBody);
                JsonNode data = jsonResponse.get("data");

                if (data == null) {
                    log.error("MUX API returned no data. Response: {}", responseBody);
                    throw new BadRequestException("MUX API returned an invalid response. Check your MUX credentials.");
                }

                String uploadId = data.get("id").asText();
                String uploadUrl = data.get("url").asText();

                CourseLesson lesson = lessonRepository.findById(lessonId)
                        .orElseThrow(() -> new BadRequestException("Lesson not found"));

                lesson.setMuxUploadId(uploadId);
                lesson.setVideoStatus("uploading");
                lessonRepository.save(lesson);

                log.info("Created MUX direct upload for lesson: {}", lessonId);
                return uploadUrl;
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create MUX upload URL: {}", e.getMessage());
            throw new BadRequestException("Failed to create video upload URL: " + e.getMessage());
        }
    }

    public VideoUrlResponse getSignedPlaybackUrl(CourseLesson lesson) {
        String playbackId = lesson.getMuxPlaybackId();

        if (playbackId == null) {
            throw new BadRequestException("Video is not ready yet");
        }

        // Handle local video storage
        if (playbackId.startsWith(LOCAL_VIDEO_PREFIX)) {
            String localPath = playbackId.substring(LOCAL_VIDEO_PREFIX.length());
            String videoUrl = baseUrl + "/files/" + localPath;

            return VideoUrlResponse.builder()
                    .playbackUrl(videoUrl)
                    .thumbnailUrl(null)
                    .durationSeconds(lesson.getVideoDurationSeconds())
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();
        }

        // MUX playback
        try {
            long expirationTime = System.currentTimeMillis() / 1000 + 3600;

            String token = generateSignedToken(lesson.getMuxPlaybackId(), expirationTime);

            String playbackUrl = String.format(
                    "https://stream.mux.com/%s.m3u8?token=%s",
                    lesson.getMuxPlaybackId(),
                    token
            );

            String thumbnailUrl = String.format(
                    "https://image.mux.com/%s/thumbnail.jpg",
                    lesson.getMuxPlaybackId()
            );

            return VideoUrlResponse.builder()
                    .playbackUrl(playbackUrl)
                    .thumbnailUrl(thumbnailUrl)
                    .durationSeconds(lesson.getVideoDurationSeconds())
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .tokenId(signingKeyId)
                    .build();

        } catch (Exception e) {
            log.error("Failed to generate signed playback URL: {}", e.getMessage());
            throw new BadRequestException("Failed to generate video URL: " + e.getMessage());
        }
    }

    public void processWebhook(String payload, String signature) {
        if (!verifyWebhookSignature(payload, signature)) {
            throw new BadRequestException("Invalid webhook signature");
        }

        try {
            Map<String, Object> webhookData = objectMapper.readValue(payload, Map.class);

            String type = (String) webhookData.get("type");
            Map<String, Object> data = (Map<String, Object>) webhookData.get("data");

            log.info("Processing MUX webhook: {}", type);

            switch (type) {
                case "video.asset.ready":
                    handleAssetReady(data);
                    break;
                case "video.asset.errored":
                    handleAssetError(data);
                    break;
                case "video.upload.asset_created":
                    handleUploadAssetCreated(data);
                    break;
                default:
                    log.info("Unhandled MUX webhook type: {}", type);
            }

        } catch (Exception e) {
            log.error("Failed to process MUX webhook: {}", e.getMessage());
            throw new BadRequestException("Failed to process webhook: " + e.getMessage());
        }
    }

    private void handleAssetReady(Map<String, Object> data) {
        String assetId = (String) data.get("id");
        String passthrough = (String) data.get("passthrough");

        java.util.List<Map<String, Object>> playbackIds =
                (java.util.List<Map<String, Object>>) data.get("playback_ids");

        String playbackId = playbackIds != null && !playbackIds.isEmpty()
                ? (String) playbackIds.get(0).get("id")
                : null;

        Double duration = (Double) data.get("duration");

        if (passthrough != null) {
            UUID lessonId = UUID.fromString(passthrough);
            lessonRepository.findById(lessonId).ifPresent(lesson -> {
                lesson.setMuxAssetId(assetId);
                lesson.setMuxPlaybackId(playbackId);
                lesson.setVideoStatus("ready");
                lesson.setVideoDurationSeconds(duration != null ? duration.intValue() : null);
                lessonRepository.save(lesson);
                log.info("Asset ready for lesson: {}", lessonId);
            });
        }
    }

    private void handleAssetError(Map<String, Object> data) {
        String passthrough = (String) data.get("passthrough");

        if (passthrough != null) {
            UUID lessonId = UUID.fromString(passthrough);
            lessonRepository.findById(lessonId).ifPresent(lesson -> {
                lesson.setVideoStatus("error");
                lessonRepository.save(lesson);
                log.error("Asset processing failed for lesson: {}", lessonId);
            });
        }
    }

    private void handleUploadAssetCreated(Map<String, Object> data) {
        String uploadId = (String) data.get("id");
        Map<String, Object> asset = (Map<String, Object>) data.get("asset");

        if (asset != null) {
            String assetId = (String) asset.get("id");

            lessonRepository.findByMuxUploadId(uploadId).ifPresent(lesson -> {
                lesson.setMuxAssetId(assetId);
                lesson.setVideoStatus("processing");
                lessonRepository.save(lesson);
                log.info("Upload completed, asset created: {} for lesson: {}", assetId, lesson.getId());
            });
        }
    }

    private String generateSignedToken(String playbackId, long expirationTime) {
        try {
            String header = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString("{\"alg\":\"RS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

            String payload = String.format(
                    "{\"sub\":\"%s\",\"exp\":%d,\"kid\":\"%s\"}",
                    playbackId, expirationTime, signingKeyId
            );
            String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payload.getBytes(StandardCharsets.UTF_8));

            String dataToSign = header + "." + encodedPayload;

            java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance("RSA");
            byte[] privateKeyBytes = Base64.getDecoder().decode(
                    signingPrivateKey.replace("-----BEGIN RSA PRIVATE KEY-----", "")
                            .replace("-----END RSA PRIVATE KEY-----", "")
                            .replaceAll("\\s", "")
            );
            java.security.spec.PKCS8EncodedKeySpec keySpec = new java.security.spec.PKCS8EncodedKeySpec(privateKeyBytes);
            java.security.PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

            java.security.Signature signature = java.security.Signature.getInstance("SHA256withRSA");
            signature.initSign(privateKey);
            signature.update(dataToSign.getBytes(StandardCharsets.UTF_8));
            String encodedSignature = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(signature.sign());

            return header + "." + encodedPayload + "." + encodedSignature;

        } catch (Exception e) {
            log.error("Failed to generate signed token: {}", e.getMessage());
            throw new BadRequestException("Failed to generate video token");
        }
    }

    private boolean verifyWebhookSignature(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return true;
        }

        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] hash = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hash);

            return signature.equals(computedSignature);

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to verify webhook signature: {}", e.getMessage());
            return false;
        }
    }

    public void deleteAsset(String assetId) {
        // If it's a local file, delete it from disk
        if (assetId != null && assetId.startsWith(LOCAL_VIDEO_PREFIX)) {
            String localPath = assetId.substring(LOCAL_VIDEO_PREFIX.length());
            try {
                Path filePath = Paths.get(uploadDir, localPath);
                Files.deleteIfExists(filePath);
                log.info("Deleted local video file: {}", localPath);
            } catch (IOException e) {
                log.error("Failed to delete local video file: {}", e.getMessage());
            }
            return;
        }

        // MUX asset deletion
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            HttpDelete request = new HttpDelete(MUX_API_BASE + "/video/v1/assets/" + assetId);
            request.setHeader("Authorization", getBasicAuthHeader());

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                log.info("Deleted MUX asset: {}", assetId);
            }

        } catch (Exception e) {
            log.error("Failed to delete MUX asset: {}", e.getMessage());
        }
    }

    /**
     * Upload video file - uses MUX if configured, otherwise stores locally
     */
    public void uploadVideoFile(UUID lessonId, MultipartFile videoFile) {
        if (isMuxConfigured()) {
            uploadVideoToMux(lessonId, videoFile);
        } else {
            uploadVideoLocally(lessonId, videoFile);
        }
    }

    /**
     * Store video locally when MUX is not configured (development mode)
     */
    private void uploadVideoLocally(UUID lessonId, MultipartFile videoFile) {
        try {
            String originalFilename = videoFile.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".mp4";

            String newFilename = lessonId.toString() + extension;
            String relativePath = "videos/lessons/" + newFilename;
            Path targetDirectory = Paths.get(uploadDir, "videos", "lessons");
            Files.createDirectories(targetDirectory);

            Path targetPath = targetDirectory.resolve(newFilename);
            Files.copy(videoFile.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Video stored locally: {} for lesson: {}", relativePath, lessonId);

            // Update lesson with local video info
            CourseLesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new BadRequestException("Lesson not found"));

            lesson.setMuxAssetId(LOCAL_VIDEO_PREFIX + relativePath);
            lesson.setMuxPlaybackId(LOCAL_VIDEO_PREFIX + relativePath);
            lesson.setVideoStatus("ready");
            lesson.setMuxUploadId("local");
            lessonRepository.save(lesson);

            log.info("Video uploaded locally and ready for lesson: {}", lessonId);

        } catch (IOException e) {
            log.error("Failed to store video locally: {}", e.getMessage());
            throw new BadRequestException("Failed to store video file: " + e.getMessage());
        }
    }

    /**
     * Upload video to MUX (production mode)
     */
    private void uploadVideoToMux(UUID lessonId, MultipartFile videoFile) {
        Path tempFile = null;
        try {
            // Save video temporarily
            String originalFilename = videoFile.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".mp4";
            tempFile = Files.createTempFile("video_" + lessonId + "_", extension);
            videoFile.transferTo(tempFile.toFile());

            log.info("Video file saved temporarily: {} for lesson: {}", tempFile, lessonId);

            // Create Mux direct upload URL
            String uploadUrl = createDirectUploadUrl(lessonId);

            // Upload file to Mux
            uploadFileToMux(uploadUrl, tempFile.toFile());

            log.info("Video uploaded to Mux successfully for lesson: {}", lessonId);

        } catch (IOException e) {
            log.error("Failed to save video file: {}", e.getMessage());
            throw new BadRequestException("Failed to save video file: " + e.getMessage());
        } finally {
            // Delete temp file
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                    log.info("Temporary video file deleted: {}", tempFile);
                } catch (IOException e) {
                    log.warn("Failed to delete temp file: {}", e.getMessage());
                }
            }
        }
    }

    private void uploadFileToMux(String uploadUrl, File videoFile) {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            HttpPut request = new HttpPut(uploadUrl);
            request.setEntity(new FileEntity(videoFile, ContentType.APPLICATION_OCTET_STREAM));

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                int statusCode = response.getCode();
                if (statusCode >= 200 && statusCode < 300) {
                    log.info("File uploaded to Mux successfully, status: {}", statusCode);
                } else {
                    String responseBody = EntityUtils.toString(response.getEntity());
                    log.error("Failed to upload file to Mux: {} - {}", statusCode, responseBody);
                    throw new BadRequestException("Failed to upload video to Mux: " + statusCode);
                }
            }

        } catch (Exception e) {
            log.error("Failed to upload file to Mux: {}", e.getMessage());
            throw new BadRequestException("Failed to upload video: " + e.getMessage());
        }
    }
}
