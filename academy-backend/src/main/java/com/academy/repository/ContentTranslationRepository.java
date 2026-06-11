package com.academy.repository;

import com.academy.entity.ContentTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentTranslationRepository extends JpaRepository<ContentTranslation, UUID> {

    Optional<ContentTranslation> findByTextHashAndTargetLang(String textHash, String targetLang);
}
