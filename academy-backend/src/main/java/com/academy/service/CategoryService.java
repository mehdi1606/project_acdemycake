package com.academy.service;

import com.academy.dto.request.CreateCategoryRequest;
import com.academy.dto.response.CategoryResponse;
import com.academy.entity.CourseCategory;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    CourseCategory findById(UUID id);

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryById(UUID id);

    CategoryResponse getCategoryBySlug(String slug);

    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse updateCategory(UUID id, CreateCategoryRequest request);

    String uploadCategoryImage(UUID id, MultipartFile file);

    void deleteCategory(UUID id);

    void reorderCategories(List<UUID> categoryIds);
}
