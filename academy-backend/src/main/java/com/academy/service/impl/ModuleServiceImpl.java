package com.academy.service.impl;

import com.academy.dto.request.CreateModuleRequest;
import com.academy.dto.response.ModuleResponse;
import com.academy.entity.Course;
import com.academy.entity.CourseModule;
import com.academy.entity.User;
import com.academy.entity.enums.UserRole;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseModuleRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CourseService;
import com.academy.service.ModuleService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ModuleServiceImpl implements ModuleService {

    private final CourseModuleRepository moduleRepository;
    private final CourseService courseService;
    private final UserService userService;

    @Override
    public CourseModule findById(UUID id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", id));
    }

    @Override
    public List<ModuleResponse> getModulesByCourse(UUID courseId) {
        Course course = courseService.findById(courseId);
        return moduleRepository.findByCourseOrderByOrderIndexAsc(course).stream()
                .map(m -> ModuleResponse.fromEntity(m, true))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ModuleResponse createModule(UUID courseId, CreateModuleRequest request) {
        Course course = courseService.findById(courseId);
        verifyInstructorAccess(course);

        Integer maxOrder = moduleRepository.findMaxOrderIndexByCourse(course).orElse(-1);

        CourseModule module = CourseModule.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : maxOrder + 1)
                .isPublished(true)
                .build();

        module = moduleRepository.save(module);
        log.info("Module created: {} in course: {}", module.getTitle(), course.getTitle());

        return ModuleResponse.fromEntity(module);
    }

    @Override
    @Transactional
    public ModuleResponse updateModule(UUID moduleId, CreateModuleRequest request) {
        CourseModule module = findById(moduleId);
        verifyInstructorAccess(module.getCourse());

        if (request.getTitle() != null) {
            module.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            module.setDescription(request.getDescription());
        }
        if (request.getOrderIndex() != null) {
            module.setOrderIndex(request.getOrderIndex());
        }

        module = moduleRepository.save(module);
        log.info("Module updated: {}", module.getTitle());

        return ModuleResponse.fromEntity(module);
    }

    @Override
    @Transactional
    public void deleteModule(UUID moduleId) {
        CourseModule module = findById(moduleId);
        verifyInstructorAccess(module.getCourse());

        moduleRepository.delete(module);
        log.info("Module deleted: {}", module.getTitle());
    }

    @Override
    @Transactional
    public void reorderModules(UUID courseId, List<UUID> moduleIds) {
        Course course = courseService.findById(courseId);
        verifyInstructorAccess(course);

        for (int i = 0; i < moduleIds.size(); i++) {
            CourseModule module = findById(moduleIds.get(i));
            module.setOrderIndex(i);
            moduleRepository.save(module);
        }
    }

    private void verifyInstructorAccess(Course course) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN &&
                !course.getInstructor().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You don't have permission to modify this module");
        }
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
