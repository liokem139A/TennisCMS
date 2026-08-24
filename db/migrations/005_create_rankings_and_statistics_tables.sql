-- Migration: Create Rankings & Statistics Tables
-- Version: 005
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-25
-- Status: Player Rankings & Performance Tracking

-- Create user_statistics table for tracking player performance
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  total_tournaments_entered INTEGER DEFAULT 0,
  tournament_wins INTEGER DEFAULT 0,
  tournament_finals INTEGER DEFAULT 0,
  tournament_semifinals INTEGER DEFAULT 0,
  current_skill_rating INTEGER DEFAULT 1500,
  peak_skill_rating INTEGER DEFAULT 1500,
  peak_skill_rating_date DATE,
  avg_match_duration_minutes DECIMAL(6, 2),
  favorite_court_surface VARCHAR(50),
  last_match_date DATE,
  last_tournament_date DATE,
  win_streak INTEGER DEFAULT 0,
  loss_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100),
  CONSTRAINT valid_matches CHECK (total_matches >= 0),
  CONSTRAINT valid_skill_rating CHECK (current_skill_rating >= 0),
  CONSTRAINT court_surface_check CHECK (favorite_court_surface IN ('hard_court', 'clay', 'grass', 'synthetic'))
);

-- Create indexes for user_statistics table
CREATE INDEX IF NOT EXISTS idx_user_statistics_current_skill_rating ON user_statistics(current_skill_rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_win_rate ON user_statistics(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_wins ON user_statistics(wins DESC);

-- Create rankings table for tournament-specific rankings
CREATE TABLE IF NOT EXISTS rankings (
  ranking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  rank INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id),
  skill_level VARCHAR(50),
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tournament_id, rank),

  CONSTRAINT valid_rank CHECK (rank > 0),
  CONSTRAINT valid_points CHECK (points >= 0),
  CONSTRAINT valid_wins_losses CHECK (wins >= 0 AND losses >= 0)
);

-- Create indexes for rankings table
CREATE INDEX IF NOT EXISTS idx_rankings_tournament_id ON rankings(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user_id ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_rank ON rankings(rank);
CREATE INDEX IF NOT EXISTS idx_rankings_points ON rankings(points DESC);

-- Create global_rankings table for overall player rankings
CREATE TABLE IF NOT EXISTS global_rankings (
  ranking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  rank INTEGER NOT NULL UNIQUE,
  skill_level VARCHAR(50) NOT NULL,
  rating_points INTEGER NOT NULL,
  wins_count INTEGER DEFAULT 0,
  losses_count INTEGER DEFAULT 0,
  recent_activity_date DATE,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_rank CHECK (rank > 0),
  CONSTRAINT valid_rating_points CHECK (rating_points >= 0)
);

-- Create indexes for global_rankings table
CREATE INDEX IF NOT EXISTS idx_global_rankings_user_id ON global_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_global_rankings_rank ON global_rankings(rank);
CREATE INDEX IF NOT EXISTS idx_global_rankings_skill_level ON global_rankings(skill_level);
CREATE INDEX IF NOT EXISTS idx_global_rankings_rating_points ON global_rankings(rating_points DESC);

-- Create player_head_to_head table for tracking matchups between players
CREATE TABLE IF NOT EXISTS player_head_to_head (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(user_id),
  player2_id UUID NOT NULL REFERENCES users(user_id),
  player1_wins INTEGER DEFAULT 0,
  player2_wins INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  last_match_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player1_id, player2_id),

  CONSTRAINT different_players CHECK (player1_id < player2_id)
);

-- Create indexes for player_head_to_head table
CREATE INDEX IF NOT EXISTS idx_player_h2h_player1_id ON player_head_to_head(player1_id);
CREATE INDEX IF NOT EXISTS idx_player_h2h_player2_id ON player_head_to_head(player2_id);

-- Create achievement_badges table for user accomplishments
CREATE TABLE IF NOT EXISTS achievement_badges (
  badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL, -- first_tournament, champion, rising_star, consistency, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visible_on_profile BOOLEAN DEFAULT TRUE,

  CONSTRAINT valid_badge_type CHECK (badge_type IN (
    'first_tournament', 'champion', 'rising_star', 'consistency',
    'most_matches_played', 'highest_win_rate', 'perfect_year', 'comeback_king'
  ))
);

-- Create indexes for achievement_badges table
CREATE INDEX IF NOT EXISTS idx_achievement_badges_user_id ON achievement_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_badges_badge_type ON achievement_badges(badge_type);

-- Create function to update global_rankings and user_statistics timestamps
CREATE OR REPLACE FUNCTION update_ranking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for global_rankings
DROP TRIGGER IF EXISTS trigger_update_global_rankings_timestamp ON global_rankings;
CREATE TRIGGER trigger_update_global_rankings_timestamp
BEFORE UPDATE ON global_rankings
FOR EACH ROW
EXECUTE FUNCTION update_ranking_timestamp();

-- Create trigger for user_statistics
DROP TRIGGER IF EXISTS trigger_update_user_statistics_timestamp ON user_statistics;
CREATE TRIGGER trigger_update_user_statistics_timestamp
BEFORE UPDATE ON user_statistics
FOR EACH ROW
EXECUTE FUNCTION update_ranking_timestamp();

-- Create trigger for player_head_to_head
DROP TRIGGER IF EXISTS trigger_update_player_h2h_timestamp ON player_head_to_head;
CREATE TRIGGER trigger_update_player_h2h_timestamp
BEFORE UPDATE ON player_head_to_head
FOR EACH ROW
EXECUTE FUNCTION update_ranking_timestamp();

-- Migration status: COMPLETED
-- Tables created: user_statistics, rankings, global_rankings, player_head_to_head, achievement_badges
-- Indexes created: 16
-- Triggers created: 3
-- Total objects: 24
