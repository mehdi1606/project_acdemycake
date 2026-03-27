package com.academy.service;

import com.academy.dto.response.CourseResponse;
import com.academy.dto.response.PageResponse;

import java.util.UUID;

public interface WishlistService {

    PageResponse<CourseResponse> getWishlist(int page, int size);

    void addToWishlist(UUID courseId);

    void removeFromWishlist(UUID courseId);

    boolean isInWishlist(UUID courseId);
}
