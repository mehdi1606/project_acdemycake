package com.academy.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String storeFile(MultipartFile file, String directory);

    /** Stores already-validated bytes under a new random name with the given extension. */
    String storeBytes(byte[] content, String directory, String extension);

    void deleteFile(String filePath);

    byte[] loadFile(String filePath);

    boolean fileExists(String filePath);

    String getFileUrl(String filePath);
}
