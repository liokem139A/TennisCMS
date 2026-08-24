/**
 * CEL-13: Match Management & Real-Time Scoring - Type Definitions
 *
 * This module defines all TypeScript types and interfaces for match management,
 * including match state, scoring, history tracking, and real-time updates.
 */

/**
 * Match Status Enum
 * Lifecycle: SCHEDULED → IN_PROGRESS → COMPLETED (or terminal states)
 */
export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/**
 * Match History Event Types
 * Audit trail of all state changes
 */
export enum MatchEventType {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  SCORE_RECORDED = 'SCORE_RECORDED',
  SET_COMPLETED = 'SET_COMPLETED',
  MATCH_STARTED = 'MATCH_STARTED',
  MATCH_PAUSED = 'MATCH_PAUSED',
  MATCH_RESUMED = 'MATCH_RESUMED',
  MATCH_COMPLETED = 'MATCH_COMPLETED',
  MATCH_CANCELLED = 'MATCH_CANCELLED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
}

/**
 * WebSocket Event Types for Real-Time Updates
 */
export enum WebSocketEventType {
  MATCH_STARTED = 'match:started',
  SCORE_UPDATED = 'match:score-updated',
  SET_COMPLETED = 'match:set-completed',
  MATCH_COMPLETED = 'match:completed',
  STATUS_CHANGED = 'match:status-changed',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
}

/**
 * Core Match Entity
 * Represents a tennis match between two players in a tournament
 */
export interface IMatch {
  id: string;
  tournament_id: string;

  // Players
  player1_id: string;
  player2_id: string;

  // Scheduling
  round: number;
  scheduled_date: string; // ISO date
  scheduled_time: string; // HH:MM format
  court_id?: string;

  // Match timing
  actual_start_time?: Date;
  actual_end_time?: Date;
  duration_minutes?: number;

  // Match state
  status: MatchStatus;
  current_set: number;
  sets_won_player1: number;
  sets_won_player2: number;
  winner_id?: string;

  // Metadata
  notes?: string;
  metadata?: Record<string, unknown>;

  // Audit
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * Match Set Entity
 * Represents individual set scores within a match
 */
export interface IMatchSet {
  id: string;
  match_id: string;
  set_number: number;

  // Game scores
  player1_games: number;
  player2_games: number;

  // Tiebreak tracking
  is_tiebreak: boolean;
  tiebreak_player1_points?: number;
  tiebreak_player2_points?: number;

  // Set completion
  set_winner_id?: string;
  completed_at?: Date;

  // Audit
  created_at: Date;
  updated_at: Date;
}

/**
 * Match History Event
 * Audit trail entry for a match event
 */
export interface IMatchHistoryEvent {
  id: string;
  match_id: string;
  event_type: MatchEventType;
  event_data: Record<string, unknown>;
  changed_by?: string; // User ID who made the change
  event_timestamp: Date;
  created_at: Date;
}

/**
 * Match Statistics for a Player in a Tournament
 */
export interface IMatchStatistics {
  id: string;
  player_id: string;
  tournament_id: string;

  // Match results
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  win_percentage: number;

  // Set statistics
  sets_won: number;
  sets_lost: number;

  // Game statistics
  games_won: number;
  games_lost: number;

  // Averages
  avg_match_duration_minutes?: number;
  avg_sets_per_match?: number;
  avg_games_per_set?: number;

  // Rankings
  tournament_rank?: number;

  // Audit
  updated_at: Date;
}

/**
 * Player Match Response (with denormalized player info)
 */
export interface IPlayerMatchInfo {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  seed?: number;
  ranking?: number;
}

/**
 * Match Response DTO (for API responses)
 * Includes denormalized player information
 */
export interface MatchResponse {
  id: string;
  tournament_id: string;
  round: number;
  scheduled_date: string;
  scheduled_time: string;
  court_id?: string;
  status: MatchStatus;
  current_set: number;
  sets_won_player1: number;
  sets_won_player2: number;
  player1: IPlayerMatchInfo;
  player2: IPlayerMatchInfo;
  winner?: IPlayerMatchInfo;
  actual_start_time?: string;
  actual_end_time?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create Match Request DTO
 */
export interface CreateMatchRequest {
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  round: number;
  scheduled_date: string; // ISO date YYYY-MM-DD
  scheduled_time: string; // HH:MM format
  court_id?: string;
  notes?: string;
}

/**
 * Update Match Request DTO
 * Allows partial updates to match details
 */
export interface UpdateMatchRequest {
  scheduled_date?: string;
  scheduled_time?: string;
  court_id?: string;
  notes?: string;
}

/**
 * Record Score Request DTO
 * Used to update match score for a specific set
 */
export interface RecordScoreRequest {
  set_number: number;
  player1_games: number;
  player2_games: number;
  is_tiebreak?: boolean;
  tiebreak_player1_points?: number;
  tiebreak_player2_points?: number;
}

/**
 * Complete Set Request DTO
 * Used to mark a set as complete
 */
export interface CompleteSetRequest {
  set_number: number;
  winner_id: string;
}

/**
 * Complete Match Request DTO
 * Used to finalize match and record winner
 */
export interface CompleteMatchRequest {
  winner_id: string;
  actual_end_time?: string; // ISO datetime
  notes?: string;
}

/**
 * Cancel Match Request DTO
 */
export interface CancelMatchRequest {
  reason: string;
  notes?: string;
}

/**
 * Match Filter Options
 * Used for list queries
 */
export interface MatchFilters {
  tournament_id?: string;
  player_id?: string; // Either player in the match
  status?: MatchStatus;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  round?: number;
  court_id?: string;
  search?: string;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sort_by?: 'scheduled_date' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated Match Response
 */
export interface PaginatedMatchResponse {
  data: MatchResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Player Match Filters
 * Specific filters for player's match history
 */
export interface PlayerMatchFilters {
  status?: MatchStatus;
  tournament_id?: string;
  date_from?: string;
  date_to?: string;
  opponent_id?: string;
}

/**
 * WebSocket Message Types
 */

/**
 * Score Update Message (broadcast from server)
 */
export interface ScoreUpdateMessage {
  type: WebSocketEventType.SCORE_UPDATED;
  data: {
    match_id: string;
    set_number: number;
    player1_games: number;
    player2_games: number;
    is_tiebreak?: boolean;
    tiebreak_player1_points?: number;
    tiebreak_player2_points?: number;
    updated_at: string;
  };
}

/**
 * Set Completed Message (broadcast from server)
 */
export interface SetCompletedMessage {
  type: WebSocketEventType.SET_COMPLETED;
  data: {
    match_id: string;
    set_number: number;
    winner_id: string;
    player1_games: number;
    player2_games: number;
    next_set?: number;
  };
}

/**
 * Match Completed Message (broadcast from server)
 */
export interface MatchCompletedMessage {
  type: WebSocketEventType.MATCH_COMPLETED;
  data: {
    match_id: string;
    winner_id: string;
    sets_won_player1: number;
    sets_won_player2: number;
    duration_minutes: number;
    completed_at: string;
  };
}

/**
 * Match Status Changed Message (broadcast from server)
 */
export interface StatusChangedMessage {
  type: WebSocketEventType.STATUS_CHANGED;
  data: {
    match_id: string;
    old_status: MatchStatus;
    new_status: MatchStatus;
    changed_at: string;
    reason?: string;
  };
}

/**
 * Match Started Message (broadcast from server)
 */
export interface MatchStartedMessage {
  type: WebSocketEventType.MATCH_STARTED;
  data: {
    match_id: string;
    started_at: string;
  };
}

/**
 * Error Message (broadcast from server)
 */
export interface ErrorMessage {
  type: WebSocketEventType.ERROR;
  data: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Heartbeat Message (keep-alive)
 */
export interface HeartbeatMessage {
  type: WebSocketEventType.HEARTBEAT;
  data: {
    timestamp: string;
  };
}

/**
 * Union type for all WebSocket messages
 */
export type WebSocketMessage =
  | ScoreUpdateMessage
  | SetCompletedMessage
  | MatchCompletedMessage
  | StatusChangedMessage
  | MatchStartedMessage
  | ErrorMessage
  | HeartbeatMessage;

/**
 * Authorization Context for Match Operations
 * Extracted from JWT token
 */
export interface AuthContext {
  user_id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/**
 * Custom Error Types for Match Operations
 */
export class MatchError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MatchError';
  }
}

export class MatchNotFoundError extends MatchError {
  constructor(matchId: string) {
    super('MATCH_NOT_FOUND', `Match with ID ${matchId} not found`, 404);
    this.name = 'MatchNotFoundError';
  }
}

export class InvalidMatchStateError extends MatchError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_MATCH_STATE', message, 409, details);
    this.name = 'InvalidMatchStateError';
  }
}

export class InvalidScoreError extends MatchError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_SCORE', message, 422, details);
    this.name = 'InvalidScoreError';
  }
}

export class UnauthorizedMatchError extends MatchError {
  constructor(message: string = 'Unauthorized to perform this action on match') {
    super('UNAUTHORIZED', message, 403);
    this.name = 'UnauthorizedMatchError';
  }
}

export class TournamentNotActiveError extends MatchError {
  constructor(tournamentId: string) {
    super('TOURNAMENT_NOT_ACTIVE', `Tournament ${tournamentId} is not in ACTIVE status`, 409);
    this.name = 'TournamentNotActiveError';
  }
}

export class InvalidPlayerError extends MatchError {
  constructor(playerId: string) {
    super('INVALID_PLAYER', `Player with ID ${playerId} not found or invalid`, 422);
    this.name = 'InvalidPlayerError';
  }
}

export class DuplicateMatchError extends MatchError {
  constructor(tournamentId: string, playerId1: string, playerId2: string, round: number) {
    super(
      'DUPLICATE_MATCH',
      `Match between players ${playerId1} and ${playerId2} already exists in round ${round}`,
      409
    );
    this.name = 'DuplicateMatchError';
  }
}

/**
 * Tennis Scoring Rules Constants
 */
export const TENNIS_RULES = {
  // Set rules
  MIN_GAMES_TO_WIN_SET: 6,
  MIN_GAME_LEAD_FOR_WIN: 2,
  GAMES_FOR_TIEBREAK: 6, // Tiebreak at 6-6

  // Match rules
  SETS_TO_WIN_MATCH: 2, // Best of 3

  // Tiebreak rules
  TIEBREAK_WINNING_POINTS: 7,
  TIEBREAK_MIN_LEAD: 2,

  // Score validation
  MAX_GAMES_WITHOUT_TIEBREAK: 5, // After 6-6, need tiebreak
  MAX_TIEBREAK_SCORE: 7, // Points in tiebreak
} as const;

/**
 * Match Service Interface
 * Defines all operations available on the match service
 */
export interface IMatchService {
  // CRUD operations
  createMatch(data: CreateMatchRequest, authContext: AuthContext): Promise<MatchResponse>;
  getMatchById(matchId: string): Promise<MatchResponse>;
  listMatches(filters: MatchFilters, pagination: PaginationOptions): Promise<PaginatedMatchResponse>;
  updateMatch(matchId: string, data: UpdateMatchRequest, authContext: AuthContext): Promise<MatchResponse>;
  deleteMatch(matchId: string, authContext: AuthContext): Promise<void>;

  // Match actions
  startMatch(matchId: string, authContext: AuthContext): Promise<MatchResponse>;
  completeMatch(matchId: string, data: CompleteMatchRequest, authContext: AuthContext): Promise<MatchResponse>;
  cancelMatch(matchId: string, data: CancelMatchRequest, authContext: AuthContext): Promise<MatchResponse>;

  // Score recording
  recordScore(
    matchId: string,
    data: RecordScoreRequest,
    authContext: AuthContext
  ): Promise<MatchResponse>;
  completeSet(
    matchId: string,
    data: CompleteSetRequest,
    authContext: AuthContext
  ): Promise<MatchResponse>;

  // History & stats
  getMatchHistory(matchId: string): Promise<IMatchHistoryEvent[]>;
  getPlayerMatches(playerId: string, filters: PlayerMatchFilters, pagination: PaginationOptions): Promise<PaginatedMatchResponse>;
  getPlayerStatistics(playerId: string, tournamentId: string): Promise<IMatchStatistics>;
}
