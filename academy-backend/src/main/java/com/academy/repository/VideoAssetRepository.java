package com.academy.repository;

import com.academy.entity.VideoAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VideoAssetRepository extends JpaRepository<VideoAsset, UUID> {

    Optional<VideoAsset> findByLessonId(UUID lessonId);

    void deleteByLessonId(UUID lessonId);
}
