-- Migration: Add shareable integration suggestions
-- Purpose: Enable sharing of integration suggestions for viral growth
-- Created: 2025-01-22

-- Add share fields to suggestions table
DO $$ 
BEGIN
    -- Add share_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'share_code') THEN
        ALTER TABLE suggestions ADD COLUMN share_code TEXT UNIQUE;
    END IF;
    
    -- Add share_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'share_enabled') THEN
        ALTER TABLE suggestions ADD COLUMN share_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add view_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'view_count') THEN
        ALTER TABLE suggestions ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add share_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'share_count') THEN
        ALTER TABLE suggestions ADD COLUMN share_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for share functionality
CREATE INDEX IF NOT EXISTS idx_suggestions_share_code ON suggestions(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suggestions_share_enabled ON suggestions(share_enabled) WHERE share_enabled = TRUE;

-- Comments
COMMENT ON COLUMN suggestions.share_code IS 'Unique share code for public sharing';
COMMENT ON COLUMN suggestions.share_enabled IS 'Whether this suggestion can be shared publicly';
COMMENT ON COLUMN suggestions.view_count IS 'Number of times this shared suggestion has been viewed';
COMMENT ON COLUMN suggestions.share_count IS 'Number of times this suggestion has been shared';
