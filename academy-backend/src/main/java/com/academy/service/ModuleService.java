package com.academy.service;

import com.academy.dto.request.CreateModuleRequest;
import com.academy.dto.response.ModuleResponse;
import com.academy.entity.CourseModule;

import java.util.List;
import java.util.UUID;

public interface ModuleService {

    CourseModule findById(UUID id);

    List<ModuleResponse> getModulesByCourse(UUID courseId);

    ModuleResponse createModule(UUID courseId, CreateModuleRequest request);

    ModuleResponse updateModule(UUID moduleId, CreateModuleRequest request);

    void deleteModule(UUID moduleId);

    void reorderModules(UUID courseId, List<UUID> moduleIds);
}
