-- Add achievement file URL to community_comments (image or PDF uploaded with challenge response)
ALTER TABLE community_comments
    ADD COLUMN IF NOT EXISTS achievement_file_url TEXT;
