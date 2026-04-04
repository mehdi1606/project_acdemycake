package com.academy.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    public static final String COURSES        = "courses";
    public static final String COURSE_DETAIL  = "course-detail";
    public static final String CATEGORIES     = "categories";
    public static final String PLATFORM_STATS = "platform-stats";
    public static final String INSTRUCTORS    = "instructors";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                COURSES, COURSE_DETAIL, CATEGORIES, PLATFORM_STATS, INSTRUCTORS
        );
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats());
        return manager;
    }
}
