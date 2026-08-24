-- Migration: Create Ambassador Program & Additional Tables
-- Version: 008
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-25
-- Status: Ambassador Program & Supplementary Data

-- Create ambassadors table
CREATE TABLE IF NOT EXISTS ambassadors (
  ambassador_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  ambassador_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- standard, elite, vip
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended, alumni
  skill_level VARCHAR(50) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  website VARCHAR(255),
  social_media JSONB,
  territories TEXT[], -- Geographic regions or cities they represent
  specializations TEXT[], -- Areas of expertise: coaching, tournaments, community, etc.
  commission_rate DECIMAL(5, 2),
  recruits_count INTEGER DEFAULT 0,
  referred_revenue DECIMAL(12, 2) DEFAULT 0,
  performance_score DECIMAL(5, 2),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  deactivated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_ambassador_type CHECK (ambassador_type IN ('standard', 'elite', 'vip')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended', 'alumni')),
  CONSTRAINT valid_commission CHECK (commission_rate >= 0 AND commission_rate <= 100),
  CONSTRAINT valid_performance CHECK (performance_score >= 0 AND performance_score <= 100)
);

-- Create indexes for ambassadors table
CREATE INDEX IF NOT EXISTS idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_status ON ambassadors(status);
CREATE INDEX IF NOT EXISTS idx_ambassadors_ambassador_type ON ambassadors(ambassador_type);
CREATE INDEX IF NOT EXISTS idx_ambassadors_performance_score ON ambassadors(performance_score DESC);

-- Create ambassador_recruits table for tracking referrals
CREATE TABLE IF NOT EXISTS ambassador_recruits (
  recruit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(ambassador_id),
  recruited_user_id UUID NOT NULL REFERENCES users(user_id),
  recruit_source VARCHAR(50), -- referral_link, social_media, email, event, other
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, converted
  conversion_value DECIMAL(12, 2),
  conversion_date DATE,
  recruited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ambassador_id, recruited_user_id),

  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'converted'))
);

-- Create indexes for ambassador_recruits table
CREATE INDEX IF NOT EXISTS idx_ambassador_recruits_ambassador_id ON ambassador_recruits(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_recruits_recruited_user_id ON ambassador_recruits(recruited_user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_recruits_status ON ambassador_recruits(status);

-- Create ambassador_rewards table
CREATE TABLE IF NOT EXISTS ambassador_rewards (
  reward_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(ambassador_id),
  reward_type VARCHAR(50) NOT NULL, -- commission, bonus, prize, merchandise
  amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid, rejected
  payment_method VARCHAR(50),
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_reward_type CHECK (reward_type IN ('commission', 'bonus', 'prize', 'merchandise', 'other'))
);

-- Create indexes for ambassador_rewards table
CREATE INDEX IF NOT EXISTS idx_ambassador_rewards_ambassador_id ON ambassador_rewards(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_rewards_status ON ambassador_rewards(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_rewards_created_at ON ambassador_rewards(created_at DESC);

-- Create sponsor_partnerships table
CREATE TABLE IF NOT EXISTS sponsor_partnerships (
  partnership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) NOT NULL, -- equipment, apparel, technology, travel, services
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  website VARCHAR(255),
  logo_url TEXT,
  description TEXT,
  terms TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
  agreement_start_date DATE,
  agreement_end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_partner_type CHECK (partner_type IN (
    'equipment', 'apparel', 'technology', 'travel', 'services', 'media', 'other'
  ))
);

-- Create indexes for sponsor_partnerships table
CREATE INDEX IF NOT EXISTS idx_sponsor_partnerships_partner_type ON sponsor_partnerships(partner_type);
CREATE INDEX IF NOT EXISTS idx_sponsor_partnerships_status ON sponsor_partnerships(status);

-- Create sponsor_offers table
CREATE TABLE IF NOT EXISTS sponsor_offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES sponsor_partnerships(partnership_id),
  offer_type VARCHAR(50), -- discount, free_product, event_sponsorship, exclusive_access
  description TEXT,
  discount_percentage DECIMAL(5, 2),
  promo_code VARCHAR(50),
  valid_from DATE,
  valid_to DATE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, expired
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sponsor_offers table
CREATE INDEX IF NOT EXISTS idx_sponsor_offers_partnership_id ON sponsor_offers(partnership_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_offers_promo_code ON sponsor_offers(promo_code);
CREATE INDEX IF NOT EXISTS idx_sponsor_offers_valid_to ON sponsor_offers(valid_to);

-- Create user_preferences table for general user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(20) DEFAULT 'light', -- light, dark, auto
  email_frequency VARCHAR(50) DEFAULT 'daily', -- off, weekly, daily
  newsletter_subscribed BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  privacy_profile BOOLEAN DEFAULT FALSE, -- False means private, True means public
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  allow_match_invitations BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_preferences table
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create user_followers table for social features
CREATE TABLE IF NOT EXISTS user_followers (
  follower_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, follower_user_id),

  CONSTRAINT different_users CHECK (user_id != follower_user_id)
);

-- Create indexes for user_followers table
CREATE INDEX IF NOT EXISTS idx_user_followers_user_id ON user_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_follower_user_id ON user_followers(follower_user_id);

-- Create user_photos table for user image gallery
CREATE TABLE IF NOT EXISTS user_photos (
  photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_photos table
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_uploaded_at ON user_photos(uploaded_at DESC);

-- Create api_keys table for API access
CREATE TABLE IF NOT EXISTS api_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, revoked, expired
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

-- Create indexes for api_keys table
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

-- Create function for timestamp updates
CREATE OR REPLACE FUNCTION update_ambassador_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_ambassadors_timestamp ON ambassadors;
CREATE TRIGGER trigger_update_ambassadors_timestamp
BEFORE UPDATE ON ambassadors
FOR EACH ROW
EXECUTE FUNCTION update_ambassador_timestamp();

DROP TRIGGER IF EXISTS trigger_update_sponsor_partnerships_timestamp ON sponsor_partnerships;
CREATE TRIGGER trigger_update_sponsor_partnerships_timestamp
BEFORE UPDATE ON sponsor_partnerships
FOR EACH ROW
EXECUTE FUNCTION update_ambassador_timestamp();

DROP TRIGGER IF EXISTS trigger_update_user_preferences_timestamp ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_ambassador_timestamp();

-- Migration status: COMPLETED
-- Tables created: ambassadors, ambassador_recruits, ambassador_rewards, sponsor_partnerships, sponsor_offers, user_preferences, user_followers, user_photos, api_keys
-- Indexes created: 26
-- Triggers created: 3
-- Total objects: 38
