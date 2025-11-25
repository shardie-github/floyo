-- Migration: Add referral system
-- Purpose: Enable referral tracking and viral growth
-- Created: 2025-01-21

-- Referrals table (matches existing model structure)
-- Note: This migration adds columns if they don't exist to match the existing Referral model
DO $$ 
BEGIN
    -- Add columns to existing referrals table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referrer_id') THEN
        ALTER TABLE referrals ADD COLUMN referrer_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'code') THEN
        ALTER TABLE referrals ADD COLUMN code TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'usage_count') THEN
        ALTER TABLE referrals ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_count') THEN
        ALTER TABLE referrals ADD COLUMN reward_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'last_used_at') THEN
        ALTER TABLE referrals ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Indexes (create if not exists)
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);

-- Add referral fields to users table (if they don't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code_used_at TIMESTAMP WITH TIME ZONE;

-- Indexes for users referral fields
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_user_id) WHERE referred_by_user_id IS NOT NULL;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    -- Generate code: FLOYO-{first 8 chars of user_id}
    code := 'FLOYO-' || UPPER(SUBSTRING(user_id::text FROM 1 FOR 8));
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals
CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- Service role can do everything
CREATE POLICY "Service role can manage referrals"
    ON referrals FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE referrals IS 'Referral tracking for viral growth';
COMMENT ON COLUMN referrals.referral_code IS 'Unique referral code (e.g., FLOYO-ABC12345)';
COMMENT ON COLUMN referrals.reward_type IS 'Type of reward: free_month, discount, etc.';
COMMENT ON COLUMN referrals.reward_value IS 'Value of reward (e.g., 29 for free month, 0.1 for 10% discount)';
