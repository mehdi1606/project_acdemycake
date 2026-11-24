package com.academy.service;

import com.academy.dto.response.AssignmentRequirementResponse;
import com.academy.entity.Assignment;
import com.academy.entity.User;

import java.util.List;

/**
 * An assignment unlocks only when the student has finished every course it is linked to:
 * access to the course, every lesson completed and every published quiz passed.
 */
public interface AssignmentRequirementsService {

    /** What is still missing, per linked course. Empty when the assignment is unlocked. */
    List<AssignmentRequirementResponse> missingFor(User student, Assignment assignment);

    default boolean isUnlocked(User student, Assignment assignment) {
        return missingFor(student, assignment).isEmpty();
    }
}
