package com.academy.service.impl;

import com.academy.exception.BadRequestException;
import com.academy.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Value("${app.file.base-url}")
    private String baseUrl;

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final List<String> ALLOWED_DOCUMENT_EXTENSIONS = Arrays.asList("pdf", "doc", "docx");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Override
    public String storeFile(MultipartFile file, String directory) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum allowed size (10MB)");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = FilenameUtils.getExtension(originalFilename).toLowerCase();

        if (!isAllowedExtension(extension)) {
            throw new BadRequestException("File type not allowed. Allowed types: " +
                    String.join(", ", ALLOWED_IMAGE_EXTENSIONS) + ", " +
                    String.join(", ", ALLOWED_DOCUMENT_EXTENSIONS));
        }

        String newFilename = UUID.randomUUID().toString() + "." + extension;
        Path targetDirectory = Paths.get(uploadDir, directory);

        try {
            Files.createDirectories(targetDirectory);
            Path targetPath = targetDirectory.resolve(newFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = directory + "/" + newFilename;
            log.info("File stored: {}", relativePath);

            return relativePath;
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage());
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }

        try {
            Path path = Paths.get(uploadDir, filePath);
            Files.deleteIfExists(path);
            log.info("File deleted: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", e.getMessage());
        }
    }

    @Override
    public byte[] loadFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            return Files.readAllBytes(path);
        } catch (IOException e) {
            log.error("Failed to load file: {}", e.getMessage());
            throw new BadRequestException("Failed to load file: " + e.getMessage());
        }
    }

    @Override
    public boolean fileExists(String filePath) {
        Path path = Paths.get(uploadDir, filePath);
        return Files.exists(path);
    }

    @Override
    public String getFileUrl(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return null;
        }
        return baseUrl + "/files/" + filePath;
    }

    private boolean isAllowedExtension(String extension) {
        return ALLOWED_IMAGE_EXTENSIONS.contains(extension) ||
                ALLOWED_DOCUMENT_EXTENSIONS.contains(extension);
    }
}
