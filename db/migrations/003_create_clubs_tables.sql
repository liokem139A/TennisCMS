-- Migration: Create Clubs & Facilities Management Tables
-- Version: 003
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-25
-- Status: Club Management Core

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  club_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  logo_url TEXT,
  cover_image_url TEXT,
  court_count INTEGER,
  established_year INTEGER,
  manager_id UUID REFERENCES users(user_id),
  verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
  avg_rating DECIMAL(3, 2),
  total_ratings INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived')),
  CONSTRAINT valid_rating CHECK (avg_rating >= 0 AND avg_rating <= 5),
  CONSTRAINT valid_court_count CHECK (court_count >= 0),
  CONSTRAINT valid_established_year CHECK (established_year >= 1800 AND established_year <= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- Create indexes for clubs table
CREATE INDEX IF NOT EXISTS idx_clubs_city ON clubs(city);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(status);
CREATE INDEX IF NOT EXISTS idx_clubs_manager_id ON clubs(manager_id);
CREATE INDEX IF NOT EXISTS idx_clubs_verified ON clubs(verified);
CREATE INDEX IF NOT EXISTS idx_clubs_location ON clubs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_clubs_created_at ON clubs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clubs_deleted_at ON clubs(deleted_at) WHERE deleted_at IS NULL;

-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
  court_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
  court_number INTEGER NOT NULL,
  name VARCHAR(100),
  surface_type VARCHAR(50) NOT NULL, -- hard_court, clay, grass, synthetic
  length_meters DECIMAL(5, 2),
  width_meters DECIMAL(5, 2),
  lighting BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'available', -- available, maintenance, retired
  capacity INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(club_id, court_number),

  CONSTRAINT valid_surface_type CHECK (surface_type IN ('hard_court', 'clay', 'grass', 'synthetic')),
  CONSTRAINT valid_status CHECK (status IN ('available', 'maintenance', 'retired')),
  CONSTRAINT valid_dimensions CHECK (length_meters > 0 AND width_meters > 0),
  CONSTRAINT valid_capacity CHECK (capacity > 0)
);

-- Create indexes for courts table
CREATE INDEX IF NOT EXISTS idx_courts_club_id ON courts(club_id);
CREATE INDEX IF NOT EXISTS idx_courts_surface_type ON courts(surface_type);
CREATE INDEX IF NOT EXISTS idx_courts_status ON courts(status);

-- Create club_memberships table
CREATE TABLE IF NOT EXISTS club_memberships (
  membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  membership_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- bronze, silver, gold, platinum, standard
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, cancelled, suspended
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  cancellation_reason VARCHAR(255),
  cancelled_at TIMESTAMP,
  UNIQUE(club_id, user_id),

  CONSTRAINT valid_membership_type CHECK (membership_type IN ('bronze', 'silver', 'gold', 'platinum', 'standard')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'cancelled', 'suspended')),
  CONSTRAINT expiry_after_join CHECK (expires_at IS NULL OR expires_at > joined_at)
);

-- Create indexes for club_memberships table
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON club_memberships(status);
CREATE INDEX IF NOT EXISTS idx_club_memberships_expires_at ON club_memberships(expires_at);

-- Create club_ratings table for user feedback
CREATE TABLE IF NOT EXISTS club_ratings (
  rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  review_text TEXT,
  verified_member BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(club_id, user_id),

  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Create indexes for club_ratings table
CREATE INDEX IF NOT EXISTS idx_club_ratings_club_id ON club_ratings(club_id);
CREATE INDEX IF NOT EXISTS idx_club_ratings_user_id ON club_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_club_ratings_rating ON club_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_club_ratings_created_at ON club_ratings(created_at DESC);

-- Create court_availability table for scheduling
CREATE TABLE IF NOT EXISTS court_availability (
  availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(court_id) ON DELETE CASCADE,
  available_from TIME NOT NULL,
  available_to TIME NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for court_availability table
CREATE INDEX IF NOT EXISTS idx_court_availability_court_id ON court_availability(court_id);
CREATE INDEX IF NOT EXISTS idx_court_availability_day_of_week ON court_availability(day_of_week);

-- Create function to update clubs.avg_rating and member_count
CREATE OR REPLACE FUNCTION update_club_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'club_ratings' THEN
    UPDATE clubs
    SET avg_rating = (
      SELECT AVG(rating)::NUMERIC(3,2) FROM club_ratings
      WHERE club_id = COALESCE(NEW.club_id, OLD.club_id)
    ),
    total_ratings = (
      SELECT COUNT(*) FROM club_ratings
      WHERE club_id = COALESCE(NEW.club_id, OLD.club_id)
    )
    WHERE club_id = COALESCE(NEW.club_id, OLD.club_id);
  END IF;

  IF TG_TABLE_NAME = 'club_memberships' THEN
    UPDATE clubs
    SET member_count = (
      SELECT COUNT(*) FROM club_memberships
      WHERE club_id = COALESCE(NEW.club_id, OLD.club_id)
      AND status = 'active'
    )
    WHERE club_id = COALESCE(NEW.club_id, OLD.club_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for club_ratings
DROP TRIGGER IF EXISTS trigger_update_club_ratings_timestamp ON club_ratings;
CREATE TRIGGER trigger_update_club_ratings_timestamp
BEFORE UPDATE ON club_ratings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_club_stats_on_rating ON club_ratings;
CREATE TRIGGER trigger_update_club_stats_on_rating
AFTER INSERT OR UPDATE OR DELETE ON club_ratings
FOR EACH ROW
EXECUTE FUNCTION update_club_stats();

-- Create trigger for club_memberships
DROP TRIGGER IF EXISTS trigger_update_club_stats_on_membership ON club_memberships;
CREATE TRIGGER trigger_update_club_stats_on_membership
AFTER INSERT OR UPDATE OR DELETE ON club_memberships
FOR EACH ROW
EXECUTE FUNCTION update_club_stats();

-- Create generic timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for courts table
DROP TRIGGER IF EXISTS trigger_update_courts_timestamp ON courts;
CREATE TRIGGER trigger_update_courts_timestamp
BEFORE UPDATE ON courts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create trigger for club_availability
DROP TRIGGER IF EXISTS trigger_update_court_availability_timestamp ON court_availability;
CREATE TRIGGER trigger_update_court_availability_timestamp
BEFORE UPDATE ON court_availability
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create trigger for clubs
DROP TRIGGER IF EXISTS trigger_update_clubs_timestamp ON clubs;
CREATE TRIGGER trigger_update_clubs_timestamp
BEFORE UPDATE ON clubs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Migration status: COMPLETED
-- Tables created: clubs, courts, club_memberships, club_ratings, court_availability
-- Indexes created: 18
-- Functions created: 2
-- Triggers created: 8
-- Total objects: 36
