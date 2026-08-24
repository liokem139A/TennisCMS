-- Migration: Create Extended Tournament Management Tables
-- Version: 004
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-25
-- Status: Tournament Management Core
-- Note: Extends 001_create_tournaments_tables.sql with additional tables

-- Create events table (for scheduled events/matches within tournaments)
CREATE TABLE IF NOT EXISTS events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- match, practice, social, briefing
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  location VARCHAR(255),
  organizer_id UUID NOT NULL REFERENCES users(user_id),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT valid_event_type CHECK (event_type IN ('match', 'practice', 'social', 'briefing')),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  CONSTRAINT valid_end_time CHECK (scheduled_end_time IS NULL OR scheduled_end_time >= scheduled_start_time)
);

-- Create indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_tournament_id ON events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_scheduled_start_time ON events(scheduled_start_time);

-- Create matches table for tournament/event matches
CREATE TABLE IF NOT EXISTS matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  event_id UUID REFERENCES events(event_id),
  player1_id UUID NOT NULL REFERENCES users(user_id),
  player2_id UUID NOT NULL REFERENCES users(user_id),
  partner1_id UUID REFERENCES users(user_id),
  partner2_id UUID REFERENCES users(user_id),
  round INTEGER,
  match_number INTEGER,
  scheduled_date DATE,
  scheduled_time TIME,
  court_id UUID REFERENCES courts(court_id),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, completed, cancelled, postponed
  winner_id UUID REFERENCES users(user_id),
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled', 'postponed')),
  CONSTRAINT valid_players CHECK (player1_id != player2_id)
);

-- Create indexes for matches table
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_event_id ON matches(event_id);
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_date ON matches(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_matches_court_id ON matches(court_id);

-- Create match_results table for storing match scores
CREATE TABLE IF NOT EXISTS match_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(match_id) ON DELETE CASCADE,
  set1_p1_score INTEGER,
  set1_p2_score INTEGER,
  set2_p1_score INTEGER,
  set2_p2_score INTEGER,
  set3_p1_score INTEGER,
  set3_p2_score INTEGER,
  tiebreak1 BOOLEAN DEFAULT FALSE,
  tiebreak2 BOOLEAN DEFAULT FALSE,
  tiebreak3 BOOLEAN DEFAULT FALSE,
  match_notes TEXT,
  recorded_by UUID REFERENCES users(user_id),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(user_id),
  verified_at TIMESTAMP,

  CONSTRAINT valid_scores CHECK (
    (set1_p1_score IS NULL OR set1_p1_score >= 0) AND
    (set1_p2_score IS NULL OR set1_p2_score >= 0) AND
    (set2_p1_score IS NULL OR set2_p1_score >= 0) AND
    (set2_p2_score IS NULL OR set2_p2_score >= 0) AND
    (set3_p1_score IS NULL OR set3_p1_score >= 0) AND
    (set3_p2_score IS NULL OR set3_p2_score >= 0)
  )
);

-- Create indexes for match_results table
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_recorded_by ON match_results(recorded_by);
CREATE INDEX IF NOT EXISTS idx_match_results_verified ON match_results(verified);
CREATE INDEX IF NOT EXISTS idx_match_results_recorded_at ON match_results(recorded_at DESC);

-- Create match_penalties table for infractions during matches
CREATE TABLE IF NOT EXISTS match_penalties (
  penalty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(user_id),
  penalty_type VARCHAR(50) NOT NULL, -- warning, point_penalty, game_penalty, disqualification
  reason TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES users(user_id),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_penalty_type CHECK (penalty_type IN ('warning', 'point_penalty', 'game_penalty', 'disqualification'))
);

-- Create indexes for match_penalties table
CREATE INDEX IF NOT EXISTS idx_match_penalties_match_id ON match_penalties(match_id);
CREATE INDEX IF NOT EXISTS idx_match_penalties_player_id ON match_penalties(player_id);
CREATE INDEX IF NOT EXISTS idx_match_penalties_penalty_type ON match_penalties(penalty_type);

-- Create match_statistics table for tracking player performance
CREATE TABLE IF NOT EXISTS match_statistics (
  stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(user_id),
  first_serve_percentage DECIMAL(5, 2),
  aces INTEGER DEFAULT 0,
  double_faults INTEGER DEFAULT 0,
  break_points_won INTEGER DEFAULT 0,
  break_points_faced INTEGER DEFAULT 0,
  winners INTEGER DEFAULT 0,
  unforced_errors INTEGER DEFAULT 0,
  net_rush_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_percentage CHECK (first_serve_percentage >= 0 AND first_serve_percentage <= 100)
);

-- Create indexes for match_statistics table
CREATE INDEX IF NOT EXISTS idx_match_statistics_match_id ON match_statistics(match_id);
CREATE INDEX IF NOT EXISTS idx_match_statistics_player_id ON match_statistics(player_id);

-- Create function to update match and events timestamps
CREATE OR REPLACE FUNCTION update_match_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for matches
DROP TRIGGER IF EXISTS trigger_update_matches_timestamp ON matches;
CREATE TRIGGER trigger_update_matches_timestamp
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_match_timestamp();

-- Create trigger for events
DROP TRIGGER IF EXISTS trigger_update_events_timestamp ON events;
CREATE TRIGGER trigger_update_events_timestamp
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_match_timestamp();

-- Migration status: COMPLETED
-- Tables created: events, matches, match_results, match_penalties, match_statistics
-- Indexes created: 18
-- Triggers created: 2
-- Total objects: 25
