package com.academy.repository;

import com.academy.entity.Ebook;
import com.academy.entity.enums.EbookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EbookRepository extends JpaRepository<Ebook, UUID> {

    List<Ebook> findByStatusOrderByDisplayOrderAsc(EbookStatus status);

    Optional<Ebook> findBySlug(String slug);
}
