package com.academy.config;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs lightweight data-migrations once at startup.
 * Safe to re-run — all statements are idempotent.
 */
@Slf4j
@Configuration
public class DataMigrationConfig {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Back-fill course_type for rows created before the column existed.
     * Any course with NULL course_type is treated as PLAN (subscription course).
     */
    @PostConstruct
    @Transactional
    public void backfillCourseType() {
        try {
            int updated = entityManager
                    .createNativeQuery("UPDATE courses SET course_type = 'PLAN' WHERE course_type IS NULL")
                    .executeUpdate();
            if (updated > 0) {
                log.info("DataMigration: set course_type = 'PLAN' on {} course(s) that had NULL", updated);
            }
        } catch (Exception e) {
            log.warn("DataMigration: backfillCourseType skipped — {}", e.getMessage());
        }
    }
}
