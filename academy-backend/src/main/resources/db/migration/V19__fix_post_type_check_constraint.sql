-- Hibernate 6 auto-generates a CHECK constraint from @Enumerated(EnumType.STRING).
-- When CHALLENGE was added to the PostType enum the old DB constraint was not updated.
-- Drop the stale constraint and re-create it with all current enum values.
ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_post_type_check;

ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_post_type_check
    CHECK (post_type IN ('DISCUSSION', 'SHOWCASE', 'QUESTION', 'ANNOUNCEMENT', 'CHALLENGE'));
