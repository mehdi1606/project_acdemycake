-- Add CHALLENGE post type support and achievement badge to community posts
ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS achievement_text  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS achievement_icon  VARCHAR(50);
