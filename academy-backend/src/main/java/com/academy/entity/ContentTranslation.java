package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Cached machine translation of a piece of dynamic content.
 * Keyed by (text_hash, target_lang) so identical text translates once and is reused.
 */
@Entity
@Table(name = "content_translations",
        uniqueConstraints = @UniqueConstraint(name = "uq_content_translation", columnNames = {"text_hash", "target_lang"}),
        indexes = @Index(name = "idx_content_translation_lookup", columnList = "text_hash,target_lang"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentTranslation extends BaseEntity {

    @Column(name = "text_hash", nullable = false, length = 64)
    private String textHash;

    @Column(name = "target_lang", nullable = false, length = 8)
    private String targetLang;

    @Column(name = "source_lang", length = 8)
    private String sourceLang;

    @Column(name = "translated", nullable = false, columnDefinition = "TEXT")
    private String translated;
}
