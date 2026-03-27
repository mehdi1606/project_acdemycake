package com.academy.service.impl;

import com.academy.dto.response.CourseResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.entity.Wishlist;
import com.academy.exception.BadRequestException;
import com.academy.repository.WishlistRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CourseService;
import com.academy.service.FileStorageService;
import com.academy.service.UserService;
import com.academy.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final CourseService courseService;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    @Override
    public PageResponse<CourseResponse> getWishlist(int page, int size) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        Page<Wishlist> wishlistPage = wishlistRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable);

        return PageResponse.from(wishlistPage, wishlist -> buildCourseResponse(wishlist.getCourse()));
    }

    @Override
    @Transactional
    public void addToWishlist(UUID courseId) {
        User currentUser = getCurrentUser();
        Course course = courseService.findById(courseId);

        if (wishlistRepository.existsByUserAndCourse(currentUser, course)) {
            throw new BadRequestException("Course already in wishlist");
        }

        Wishlist wishlist = Wishlist.builder()
                .user(currentUser)
                .course(course)
                .build();

        wishlistRepository.save(wishlist);
        log.info("Course added to wishlist: {} by user: {}", courseId, currentUser.getEmail());
    }

    @Override
    @Transactional
    public void removeFromWishlist(UUID courseId) {
        User currentUser = getCurrentUser();
        Course course = courseService.findById(courseId);

        Wishlist wishlist = wishlistRepository.findByUserAndCourse(currentUser, course)
                .orElseThrow(() -> new BadRequestException("Course not in wishlist"));

        wishlistRepository.delete(wishlist);
        log.info("Course removed from wishlist: {} by user: {}", courseId, currentUser.getEmail());
    }

    @Override
    public boolean isInWishlist(UUID courseId) {
        User currentUser = getCurrentUser();
        Course course = courseService.findById(courseId);
        return wishlistRepository.existsByUserAndCourse(currentUser, course);
    }

    private CourseResponse buildCourseResponse(Course course) {
        CourseResponse response = CourseResponse.fromEntity(course);
        response.setThumbnailUrl(fileStorageService.getFileUrl(course.getThumbnailUrl()));
        if (response.getInstructor() != null && course.getInstructor() != null) {
            response.getInstructor().setAvatarUrl(
                    fileStorageService.getFileUrl(course.getInstructor().getAvatarUrl())
            );
        }
        return response;
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
