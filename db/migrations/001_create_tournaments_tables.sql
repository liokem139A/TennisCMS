-- Migration: Create Tournament Management Tables
-- Version: 001
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-24
-- Status: CEL-11 Implementation

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format VARCHAR(50) NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  surface VARCHAR(50),
  skill_level VARCHAR(50),
  entry_fee DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft',
  organizer_id UUID NOT NULL,
  club_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
  CONSTRAINT valid_format CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_participants CHECK (max_participants > 0),
  CONSTRAINT valid_entry_fee CHECK (entry_fee >= 0)
);

-- Create indexes for tournaments table
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments(created_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_deleted_at ON tournaments(deleted_at) WHERE deleted_at IS NULL;

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  seed_position INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tournament_id, user_id),
  CONSTRAINT valid_participant_status CHECK (status IN ('pending', 'confirmed', 'withdrawn', 'disqualified'))
);

-- Create indexes for tournament_participants table
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_status ON tournament_participants(status);

-- Create tournament_organizers table for extended permissions
CREATE TABLE IF NOT EXISTS tournament_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'organizer',
  permissions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tournament_id, user_id),
  CONSTRAINT valid_organizer_role CHECK (role IN ('organizer', 'admin', 'referee'))
);

-- Create indexes for tournament_organizers table
CREATE INDEX IF NOT EXISTS idx_tournament_organizers_tournament_id ON tournament_organizers(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_organizers_user_id ON tournament_organizers(user_id);

-- Create audit log table for tournament changes
CREATE TABLE IF NOT EXISTS tournament_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL,
  changes JSONB,
  previous_values JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_action CHECK (action IN ('created', 'updated', 'status_changed', 'deleted', 'participant_added', 'participant_removed'))
);

-- Create indexes for tournament_audit_log table
CREATE INDEX IF NOT EXISTS idx_tournament_audit_log_tournament_id ON tournament_audit_log(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_audit_log_changed_by ON tournament_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_tournament_audit_log_created_at ON tournament_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_audit_log_action ON tournament_audit_log(action);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tournament_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tournaments updated_at
DROP TRIGGER IF EXISTS trigger_update_tournaments_timestamp ON tournaments;
CREATE TRIGGER trigger_update_tournaments_timestamp
BEFORE UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION update_tournament_timestamp();

-- Create trigger for tournament_participants updated_at
DROP TRIGGER IF EXISTS trigger_update_tournament_participants_timestamp ON tournament_participants;
CREATE TRIGGER trigger_update_tournament_participants_timestamp
BEFORE UPDATE ON tournament_participants
FOR EACH ROW
EXECUTE FUNCTION update_tournament_timestamp();

-- Create trigger for tournament_organizers updated_at
DROP TRIGGER IF EXISTS trigger_update_tournament_organizers_timestamp ON tournament_organizers;
CREATE TRIGGER trigger_update_tournament_organizers_timestamp
BEFORE UPDATE ON tournament_organizers
FOR EACH ROW
EXECUTE FUNCTION update_tournament_timestamp();

-- Migration status: COMPLETED
-- Tables created: tournaments, tournament_participants, tournament_organizers, tournament_audit_log
-- Indexes created: 13
-- Triggers created: 3
-- Total objects: 17
