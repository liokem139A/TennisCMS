/**
 * Test Fixtures for Match Management Tests
 * Used across unit, integration, and end-to-end tests
 */

import {
  IMatch,
  IMatchSet,
  MatchStatus,
  CreateMatchRequest,
  RecordScoreRequest,
} from '@/types/match.types';

/**
 * Sample tournament ID for testing
 */
export const FIXTURE_TOURNAMENT_ID = 'tournament_test_001';

/**
 * Sample player IDs for testing
 */
export const FIXTURE_PLAYER_1_ID = 'player_test_001';
export const FIXTURE_PLAYER_2_ID = 'player_test_002';
export const FIXTURE_PLAYER_3_ID = 'player_test_003';

/**
 * Sample court ID
 */
export const FIXTURE_COURT_ID = 'court_test_001';

/**
 * Create a basic match fixture with status SCHEDULED
 */
export function createScheduledMatchFixture(overrides?: Partial<IMatch>): IMatch {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 1);

  return {
    id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tournament_id: FIXTURE_TOURNAMENT_ID,
    player1_id: FIXTURE_PLAYER_1_ID,
    player2_id: FIXTURE_PLAYER_2_ID,
    round: 1,
    scheduled_date: futureDate.toISOString().split('T')[0],
    scheduled_time: '14:00',
    court_id: FIXTURE_COURT_ID,
    status: MatchStatus.SCHEDULED,
    current_set: 1,
    sets_won_player1: 0,
    sets_won_player2: 0,
    notes: 'Test match fixture',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create an in-progress match fixture
 */
export function createInProgressMatchFixture(overrides?: Partial<IMatch>): IMatch {
  const match = createScheduledMatchFixture(overrides);
  return {
    ...match,
    status: MatchStatus.IN_PROGRESS,
    actual_start_time: new Date(),
    current_set: 1,
  };
}

/**
 * Create a completed match fixture
 */
export function createCompletedMatchFixture(overrides?: Partial<IMatch>): IMatch {
  const match = createInProgressMatchFixture(overrides);
  const startTime = match.actual_start_time || new Date();
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1); // 1 hour match

  return {
    ...match,
    status: MatchStatus.COMPLETED,
    winner_id: FIXTURE_PLAYER_1_ID,
    sets_won_player1: 2,
    sets_won_player2: 0,
    actual_end_time: endTime,
    duration_minutes: 60,
    updated_at: endTime,
  };
}

/**
 * Create a cancelled match fixture
 */
export function createCancelledMatchFixture(overrides?: Partial<IMatch>): IMatch {
  const match = createScheduledMatchFixture(overrides);
  return {
    ...match,
    status: MatchStatus.CANCELLED,
    notes: 'Match cancelled due to weather',
  };
}

/**
 * Create a CreateMatchRequest for API testing
 */
export function createMatchRequestFixture(
  overrides?: Partial<CreateMatchRequest>
): CreateMatchRequest {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);

  return {
    tournament_id: FIXTURE_TOURNAMENT_ID,
    player1_id: FIXTURE_PLAYER_1_ID,
    player2_id: FIXTURE_PLAYER_2_ID,
    round: 1,
    scheduled_date: futureDate.toISOString().split('T')[0],
    scheduled_time: '14:00',
    court_id: FIXTURE_COURT_ID,
    notes: 'Test match',
    ...overrides,
  };
}

/**
 * Create a set record fixture
 */
export function createSetFixture(
  matchId: string,
  setNumber: number,
  overrides?: Partial<IMatchSet>
): IMatchSet {
  const now = new Date();
  return {
    id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    match_id: matchId,
    set_number: setNumber,
    player1_games: 6,
    player2_games: 4,
    is_tiebreak: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create a tiebreak set fixture (6-6 games, tiebreak active)
 */
export function createTiebreakSetFixture(
  matchId: string,
  setNumber: number,
  overrides?: Partial<IMatchSet>
): IMatchSet {
  return createSetFixture(matchId, setNumber, {
    player1_games: 6,
    player2_games: 6,
    is_tiebreak: true,
    tiebreak_player1_points: 7,
    tiebreak_player2_points: 5,
    ...overrides,
  });
}

/**
 * Create a completed set fixture with winner
 */
export function createCompletedSetFixture(
  matchId: string,
  setNumber: number,
  winnerId: string,
  overrides?: Partial<IMatchSet>
): IMatchSet {
  const set = createSetFixture(matchId, setNumber, overrides);
  return {
    ...set,
    set_winner_id: winnerId,
    completed_at: new Date(),
  };
}

/**
 * Score progression fixtures for testing tennis rules
 */
export const SCORE_PROGRESSION_FIXTURES = {
  // Valid progressions
  VALID_GAME_PROGRESSION: [
    { player1_games: 1, player2_games: 0, is_tiebreak: false },
    { player1_games: 2, player2_games: 0, is_tiebreak: false },
    { player1_games: 3, player2_games: 0, is_tiebreak: false },
    { player1_games: 4, player2_games: 0, is_tiebreak: false },
    { player1_games: 5, player2_games: 0, is_tiebreak: false },
    { player1_games: 6, player2_games: 0, is_tiebreak: false }, // Set won
  ] as RecordScoreRequest[],

  VALID_DEUCE_PROGRESSION: [
    { player1_games: 5, player2_games: 5, is_tiebreak: false },
    { player1_games: 6, player2_games: 5, is_tiebreak: false },
    { player1_games: 6, player2_games: 6, is_tiebreak: true }, // Goes to tiebreak
  ] as RecordScoreRequest[],

  VALID_TIEBREAK_PROGRESSION: [
    { player1_games: 6, player2_games: 6, is_tiebreak: true, tiebreak_player1_points: 1, tiebreak_player2_points: 0 },
    { player1_games: 6, player2_games: 6, is_tiebreak: true, tiebreak_player1_points: 3, tiebreak_player2_points: 1 },
    { player1_games: 6, player2_games: 6, is_tiebreak: true, tiebreak_player1_points: 5, tiebreak_player2_points: 3 },
    { player1_games: 6, player2_games: 6, is_tiebreak: true, tiebreak_player1_points: 7, tiebreak_player2_points: 5 }, // Tiebreak won
  ] as RecordScoreRequest[],

  // Invalid progressions
  INVALID_GAME_JUMP: { player1_games: 10, player2_games: 0, is_tiebreak: false } as RecordScoreRequest,
  INVALID_NEGATIVE_SCORE: { player1_games: -1, player2_games: 0, is_tiebreak: false } as RecordScoreRequest,
  INVALID_TIEBREAK_POINTS: { player1_games: 6, player2_games: 6, is_tiebreak: true, tiebreak_player1_points: 3, tiebreak_player2_points: 1 } as RecordScoreRequest,
};

/**
 * Auth context fixtures
 */
export function createAuthContextFixture(overrides?: any) {
  return {
    user_id: FIXTURE_PLAYER_1_ID,
    roles: ['user'],
    ...overrides,
  };
}

export function createAdminAuthContextFixture(overrides?: any) {
  return {
    user_id: FIXTURE_PLAYER_1_ID,
    roles: ['admin'],
    ...overrides,
  };
}

/**
 * Pagination fixtures
 */
export const PAGINATION_FIXTURE = {
  page: 1,
  limit: 10,
  sort_by: 'scheduled_date',
  sort_order: 'asc' as const,
};

/**
 * Match filters fixtures
 */
export const MATCH_FILTERS_FIXTURE = {
  tournament_id: FIXTURE_TOURNAMENT_ID,
  status: MatchStatus.SCHEDULED,
  player_id: FIXTURE_PLAYER_1_ID,
};

/**
 * Generate multiple match fixtures for bulk testing
 */
export function generateMatchFixtures(count: number): IMatch[] {
  return Array.from({ length: count }, (_, index) =>
    createScheduledMatchFixture({
      id: `match_bulk_${index}_${Date.now()}`,
      round: (index % 3) + 1,
    })
  );
}

/**
 * Reset fixtures (clear time-dependent data)
 */
export function resetFixtures(): void {
  // This is a placeholder for any fixture cleanup
  // Currently, fixtures are stateless
}
