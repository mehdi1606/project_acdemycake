package com.academy.service;

import java.io.IOException;
import java.io.InputStream;

/**
 * Handles raw video file storage and retrieval on the local file system.
 * Kept intentionally separate from FileStorageService (which handles
 * images and documents) so the two concerns never intermingle.
 */
public interface VideoStorageService {

    /**
     * Write an incoming video stream to disk under the uploads/videos/ folder.
     *
     * @param inputStream    the video data (consumed and closed by this method)
     * @param originalFilename the original client filename (used to derive extension)
     * @param fileSize       declared byte size (used for size validation only)
     * @return relative path from the upload root, e.g. "videos/uuid.mp4"
     */
    String storeVideo(InputStream inputStream, String originalFilename, long fileSize);

    /**
     * Open a bounded input stream for the requested byte range.
     * Caller is responsible for closing the stream.
     *
     * @param filePath   relative path returned by {@link #storeVideo}
     * @param rangeStart first byte (inclusive)
     * @param rangeEnd   last byte (inclusive)
     */
    InputStream streamVideo(String filePath, long rangeStart, long rangeEnd) throws IOException;

    /** Delete the video file. Silent no-op if the path is null or the file is missing. */
    void deleteVideo(String filePath);

    /** Total byte size of the stored file. */
    long getVideoSize(String filePath);

    /** Returns true if the file exists on disk. */
    boolean videoExists(String filePath);
}
