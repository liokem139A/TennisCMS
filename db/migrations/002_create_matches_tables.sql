-- CEL-13: Match Management & Real-Time Scoring
-- Migration: Create matches and related tables
-- Created: August 25, 2026
-- Version: 1.0

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: matches
-- Purpose: Core match entity with player pairings and current score state
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),

    -- Players
    player1_id UUID NOT NULL REFERENCES users(id),
    player2_id UUID NOT NULL REFERENCES users(id),

    -- Scheduling
    round INTEGER NOT NULL CHECK (round >= 1),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    court_id UUID,

    -- Match timing
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    duration_minutes INTEGER,

    -- Match state
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    )),

    -- Score state
    current_set INTEGER NOT NULL DEFAULT 1 CHECK (current_set >= 1),
    sets_won_player1 INTEGER NOT NULL DEFAULT 0 CHECK (sets_won_player1 >= 0),
    sets_won_player2 INTEGER NOT NULL DEFAULT 0 CHECK (sets_won_player2 >= 0),
    winner_id UUID REFERENCES users(id),

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Constraints
    CONSTRAINT different_players CHECK (player1_id != player2_id),
    CONSTRAINT valid_scheduled_time CHECK (scheduled_time ~ '([01][0-9]|2[0-3]):[0-5][0-9]'),
    CONSTRAINT sets_constraint CHECK (
        (status != 'COMPLETED') OR
        (sets_won_player1 + sets_won_player2 >= 2)
    )
);

-- Indexes for matches table
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_player1_id ON matches(player1_id);
CREATE INDEX idx_matches_player2_id ON matches(player2_id);
CREATE INDEX idx_matches_winner_id ON matches(winner_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_date ON matches(scheduled_date);
CREATE INDEX idx_matches_court_id ON matches(court_id);
CREATE INDEX idx_matches_deleted_at ON matches(deleted_at);
CREATE INDEX idx_matches_round_tournament ON matches(tournament_id, round);

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_matches_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_matches_updated_at();

-- ============================================================================
-- Table: match_sets
-- Purpose: Track individual set results with game scores
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,

    -- Set numbering
    set_number INTEGER NOT NULL CHECK (set_number >= 1),

    -- Game scores
    player1_games INTEGER NOT NULL CHECK (player1_games >= 0),
    player2_games INTEGER NOT NULL CHECK (player2_games >= 0),

    -- Tiebreak tracking
    is_tiebreak BOOLEAN DEFAULT FALSE,
    tiebreak_player1_points INTEGER,
    tiebreak_player2_points INTEGER,

    -- Set completion
    set_winner_id UUID REFERENCES users(id),
    completed_at TIMESTAMP,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE (match_id, set_number)
);

-- Indexes for match_sets table
CREATE INDEX idx_match_sets_match_id ON match_sets(match_id);
CREATE INDEX idx_match_sets_set_number ON match_sets(match_id, set_number);
CREATE INDEX idx_match_sets_winner_id ON match_sets(set_winner_id);

-- Trigger: Auto-update updated_at for match_sets
CREATE OR REPLACE FUNCTION update_match_sets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_match_sets_updated_at
BEFORE UPDATE ON match_sets
FOR EACH ROW
EXECUTE FUNCTION update_match_sets_updated_at();

-- ============================================================================
-- Table: match_history
-- Purpose: Audit trail of all match state changes for compliance and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,

    -- Event tracking
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'CREATED', 'STATUS_CHANGED', 'SCORE_RECORDED', 'SET_COMPLETED',
        'MATCH_STARTED', 'MATCH_PAUSED', 'MATCH_RESUMED', 'MATCH_COMPLETED',
        'MATCH_CANCELLED', 'PLAYER_JOINED', 'PLAYER_LEFT'
    )),

    -- Event details
    event_data JSONB NOT NULL,

    -- Actor tracking
    changed_by UUID REFERENCES users(id),

    -- Timestamp
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for match_history table
CREATE INDEX idx_match_history_match_id ON match_history(match_id);
CREATE INDEX idx_match_history_event_type ON match_history(event_type);
CREATE INDEX idx_match_history_timestamp ON match_history(event_timestamp);
CREATE INDEX idx_match_history_changed_by ON match_history(changed_by);

-- ============================================================================
-- Table: match_statistics
-- Purpose: Denormalized player performance metrics (updated after each match)
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES users(id),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),

    -- Match results
    matches_played INTEGER NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
    matches_won INTEGER NOT NULL DEFAULT 0 CHECK (matches_won >= 0),
    matches_lost INTEGER NOT NULL DEFAULT 0 CHECK (matches_lost >= 0),

    -- Win rate (cached for performance)
    win_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (win_percentage >= 0 AND win_percentage <= 100),

    -- Set statistics
    sets_won INTEGER NOT NULL DEFAULT 0 CHECK (sets_won >= 0),
    sets_lost INTEGER NOT NULL DEFAULT 0 CHECK (sets_lost >= 0),

    -- Game statistics
    games_won INTEGER NOT NULL DEFAULT 0 CHECK (games_won >= 0),
    games_lost INTEGER NOT NULL DEFAULT 0 CHECK (games_lost >= 0),

    -- Averages
    avg_match_duration_minutes NUMERIC(10, 2),
    avg_sets_per_match NUMERIC(5, 2),
    avg_games_per_set NUMERIC(5, 2),

    -- Rankings
    tournament_rank INTEGER,

    -- Audit
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE (player_id, tournament_id),
    CONSTRAINT valid_match_counts CHECK (matches_played = matches_won + matches_lost)
);

-- Indexes for match_statistics table
CREATE INDEX idx_match_statistics_player_id ON match_statistics(player_id);
CREATE INDEX idx_match_statistics_tournament_id ON match_statistics(tournament_id);
CREATE INDEX idx_match_statistics_player_tournament ON match_statistics(player_id, tournament_id);
CREATE INDEX idx_match_statistics_win_percentage ON match_statistics(win_percentage DESC);
CREATE INDEX idx_match_statistics_tournament_rank ON match_statistics(tournament_id, tournament_rank);

-- ============================================================================
-- Views
-- ============================================================================

-- View: Active matches with player info
CREATE OR REPLACE VIEW v_active_matches AS
SELECT
    m.id,
    m.tournament_id,
    m.scheduled_date,
    m.scheduled_time,
    m.status,
    m.current_set,
    m.sets_won_player1,
    m.sets_won_player2,
    u1.id as player1_id,
    u1.first_name || ' ' || u1.last_name as player1_name,
    u2.id as player2_id,
    u2.first_name || ' ' || u2.last_name as player2_name,
    m.actual_start_time,
    m.actual_end_time,
    m.winner_id
FROM matches m
LEFT JOIN users u1 ON m.player1_id = u1.id
LEFT JOIN users u2 ON m.player2_id = u2.id
WHERE m.deleted_at IS NULL
    AND m.status IN ('SCHEDULED', 'IN_PROGRESS');

-- View: Completed matches for tournament
CREATE OR REPLACE VIEW v_tournament_results AS
SELECT
    m.id,
    m.tournament_id,
    m.round,
    m.scheduled_date,
    u1.first_name || ' ' || u1.last_name as player1_name,
    u2.first_name || ' ' || u2.last_name as player2_name,
    CASE WHEN m.winner_id = m.player1_id THEN u1.first_name || ' ' || u1.last_name
         WHEN m.winner_id = m.player2_id THEN u2.first_name || ' ' || u2.last_name
         ELSE 'TBD'
    END as winner_name,
    m.sets_won_player1,
    m.sets_won_player2,
    m.duration_minutes,
    m.actual_start_time,
    m.actual_end_time,
    m.status
FROM matches m
LEFT JOIN users u1 ON m.player1_id = u1.id
LEFT JOIN users u2 ON m.player2_id = u2.id
WHERE m.deleted_at IS NULL
    AND m.status IN ('COMPLETED', 'NO_SHOW', 'CANCELLED')
ORDER BY m.scheduled_date DESC, m.scheduled_time DESC;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE matches IS 'Core match entity tracking pairings, scheduling, and current score state';
COMMENT ON TABLE match_sets IS 'Individual set results with game scores and tiebreak tracking';
COMMENT ON TABLE match_history IS 'Audit trail of all match events for compliance and debugging';
COMMENT ON TABLE match_statistics IS 'Denormalized player performance metrics per tournament';

COMMENT ON COLUMN matches.status IS 'Match lifecycle: SCHEDULED → IN_PROGRESS → COMPLETED (or CANCELLED/NO_SHOW)';
COMMENT ON COLUMN matches.current_set IS 'Track which set is being played (1, 2, or 3 for best of 3)';
COMMENT ON COLUMN match_sets.is_tiebreak IS 'Indicates tiebreak mode (games are 6-6 or extended deuce)';
COMMENT ON COLUMN match_history.event_data IS 'JSON payload with event details (e.g., score changes, timestamps)';
COMMENT ON COLUMN match_statistics.win_percentage IS 'Cached win rate to avoid recalculation on every query';

