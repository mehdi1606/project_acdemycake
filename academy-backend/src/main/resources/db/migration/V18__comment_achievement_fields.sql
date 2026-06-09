-- Add achievement fields to community_comments for Challenge post responses
-- One achievement allowed per student per challenge post
ALTER TABLE community_comments
    ADD COLUMN IF NOT EXISTS achievement_text  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS achievement_icon  VARCHAR(50);
