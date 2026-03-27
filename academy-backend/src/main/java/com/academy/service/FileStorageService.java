package com.academy.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String storeFile(MultipartFile file, String directory);

    void deleteFile(String filePath);

    byte[] loadFile(String filePath);

    boolean fileExists(String filePath);

    String getFileUrl(String filePath);
}
