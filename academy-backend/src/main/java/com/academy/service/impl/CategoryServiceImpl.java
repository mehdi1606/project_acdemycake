package com.academy.service.impl;

import com.academy.dto.request.CreateCategoryRequest;
import com.academy.dto.response.CategoryResponse;
import com.academy.entity.CourseCategory;
import com.academy.entity.User;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseCategoryRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CategoryService;
import com.academy.service.FileStorageService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final CourseCategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;
    private final UserService userService;

    @Override
    public CourseCategory findById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllActiveWithCourseCount().stream()
                .map(row -> {
                    CourseCategory category = (CourseCategory) row[0];
                    Long count = (Long) row[1];
                    return CategoryResponse.fromEntityWithCount(category, count != null ? count.intValue() : 0);
                })
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse getCategoryById(UUID id) {
        CourseCategory category = findById(id);
        return CategoryResponse.fromEntity(category);
    }

    @Override
    public CategoryResponse getCategoryBySlug(String slug) {
        CourseCategory category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "slug", slug));
        return CategoryResponse.fromEntity(category);
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        verifyAdmin();

        String slug = generateSlug(request.getName());

        // Check for duplicate slug
        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Category with similar name already exists");
        }

        // Check for duplicate name
        if (categoryRepository.existsByName(request.getName())) {
            throw new BadRequestException("Category with this name already exists");
        }

        Integer displayOrder = request.getDisplayOrder();
        if (displayOrder == null) {
            displayOrder = categoryRepository.findAllOrderByDisplayOrder().size();
        }

        CourseCategory category = CourseCategory.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .displayOrder(displayOrder)
                .isActive(true)
                .build();

        category = categoryRepository.save(category);
        log.info("Category created: {} with slug: {}", request.getName(), slug);

        return CategoryResponse.fromEntity(category);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(UUID id, CreateCategoryRequest request) {
        verifyAdmin();

        CourseCategory category = findById(id);

        if (request.getName() != null && !request.getName().equals(category.getName())) {
            String newSlug = generateSlug(request.getName());
            if (!newSlug.equals(category.getSlug()) && categoryRepository.existsBySlug(newSlug)) {
                throw new BadRequestException("Category with similar name already exists");
            }
            category.setName(request.getName());
            category.setSlug(newSlug);
        }

        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }

        category = categoryRepository.save(category);
        log.info("Category updated: {}", id);

        return CategoryResponse.fromEntity(category);
    }

    @Override
    @Transactional
    public String uploadCategoryImage(UUID id, MultipartFile file) {
        verifyAdmin();

        CourseCategory category = findById(id);

        String imageUrl = fileStorageService.storeFile(file, "categories");
        category.setImageUrl(imageUrl);
        categoryRepository.save(category);

        log.info("Category image uploaded: {} url: {}", id, imageUrl);
        return imageUrl;
    }

    @Override
    @Transactional
    public void deleteCategory(UUID id) {
        verifyAdmin();

        CourseCategory category = findById(id);

        // Check if category has courses
        if (category.getCourses() != null && !category.getCourses().isEmpty()) {
            throw new BadRequestException("Cannot delete category with existing courses. Move or delete courses first.");
        }

        categoryRepository.delete(category);
        log.info("Category deleted: {}", id);
    }

    @Override
    @Transactional
    public void reorderCategories(List<UUID> categoryIds) {
        verifyAdmin();

        for (int i = 0; i < categoryIds.size(); i++) {
            CourseCategory category = findById(categoryIds.get(i));
            category.setDisplayOrder(i);
            categoryRepository.save(category);
        }

        log.info("Categories reordered");
    }

    private String generateSlug(String input) {
        String noWhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(noWhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }

    private void verifyAdmin() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Admin access required");
        }
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
