/**
 * CEL-13 Phase 2: Unit tests for MatchService
 *
 * The service's persistence layer is still stubbed out (see the private
 * `TODO` helpers in match.service.ts), so these tests replace those helpers
 * with an in-memory store. That keeps the suite focused on what CEL-13
 * actually owns today: match lifecycle transitions, tennis scoring rules,
 * authorization, and audit-event emission.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchService } from '@/services/match.service';
import {
  IMatch,
  IMatchSet,
  IMatchStatistics,
  IMatchHistoryEvent,
  MatchStatus,
  MatchEventType,
  AuthContext,
  MatchNotFoundError,
  InvalidMatchStateError,
  InvalidScoreError,
  InvalidPlayerError,
  TournamentNotActiveError,
  UnauthorizedMatchError,
  DuplicateMatchError,
  MatchError,
  CreateMatchRequest,
  TENNIS_RULES,
} from '@/types/match.types';

const TOURNAMENT_ID = 'tournament_001';
const PLAYER_1 = 'player_00000001';
const PLAYER_2 = 'player_00000002';
const PLAYER_3 = 'player_00000003';
const COURT_ID = 'court_001';

const ADMIN_AUTH: AuthContext = {
  user_id: 'admin_001',
  email: 'admin@celadontennis.vn',
  roles: ['admin'],
  permissions: ['match:write'],
};

const PLAYER_1_AUTH: AuthContext = {
  user_id: PLAYER_1,
  email: 'p1@celadontennis.vn',
  roles: ['player'],
  permissions: [],
};

const OUTSIDER_AUTH: AuthContext = {
  user_id: 'someone_else',
  email: 'nobody@celadontennis.vn',
  roles: ['player'],
  permissions: [],
};

/** A date N days in the future, as YYYY-MM-DD. */
function futureDate(daysAhead = 7): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().split('T')[0];
}

function createRequest(overrides: Partial<CreateMatchRequest> = {}): CreateMatchRequest {
  return {
    tournament_id: TOURNAMENT_ID,
    player1_id: PLAYER_1,
    player2_id: PLAYER_2,
    round: 1,
    scheduled_date: futureDate(),
    scheduled_time: '14:00',
    court_id: COURT_ID,
    ...overrides,
  };
}

function matchFixture(overrides: Partial<IMatch> = {}): IMatch {
  const now = new Date();
  return {
    id: 'match_fixture_001',
    tournament_id: TOURNAMENT_ID,
    player1_id: PLAYER_1,
    player2_id: PLAYER_2,
    round: 1,
    scheduled_date: futureDate(),
    scheduled_time: '14:00',
    court_id: COURT_ID,
    status: MatchStatus.SCHEDULED,
    current_set: 1,
    sets_won_player1: 0,
    sets_won_player2: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function setFixture(overrides: Partial<IMatchSet> = {}): IMatchSet {
  const now = new Date();
  return {
    id: `set_${overrides.set_number ?? 1}`,
    match_id: 'match_fixture_001',
    set_number: 1,
    player1_games: 0,
    player2_games: 0,
    is_tiebreak: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Builds a MatchService whose stubbed persistence helpers are backed by
 * in-memory state the test can inspect and pre-seed.
 */
function createHarness(options: { tournamentStatus?: string } = {}) {
  const service = new MatchService();
  const svc = service as unknown as Record<string, unknown>;

  const state = {
    matches: new Map<string, IMatch>(),
    sets: [] as IMatchSet[],
    events: [] as Array<{
      matchId: string;
      eventType: MatchEventType;
      eventData: Record<string, unknown>;
    }>,
    inserted: [] as IMatch[],
    softDeleted: [] as string[],
    statsUpdatedFor: [] as string[],
    history: [] as IMatchHistoryEvent[],
    statistics: null as IMatchStatistics | null,
    existingMatch: null as IMatch | null,
    total: 0,
    tournamentStatus: options.tournamentStatus ?? 'ACTIVE',
  };

  const stub = <T extends (...args: never[]) => unknown>(name: string, impl: T) =>
    vi.spyOn(svc as never, name as never).mockImplementation(impl as never);

  stub('getTournamentAndValidate', async (id: string) => ({
    id,
    status: state.tournamentStatus,
  }));
  stub('getUserAndValidate', async (id: string) => ({ id, name: `Player ${id}` }));
  stub('findExistingMatch', async () => state.existingMatch);

  stub('insertMatch', async (m: IMatch) => {
    state.matches.set(m.id, m);
    state.inserted.push(m);
  });
  stub('findMatchById', async (id: string) => state.matches.get(id) ?? null);
  stub('updateMatchInDb', async (m: IMatch) => {
    state.matches.set(m.id, m);
  });
  stub('softDeleteMatch', async (id: string) => {
    state.softDeleted.push(id);
    state.matches.delete(id);
  });

  stub('countMatches', async () => state.total);
  stub('findMatches', async () => [...state.matches.values()]);

  stub(
    'findSetRecord',
    async (matchId: string, setNumber: number) =>
      state.sets.find((s) => s.match_id === matchId && s.set_number === setNumber) ?? null
  );
  stub('insertSet', async (s: IMatchSet) => {
    state.sets.push(s);
  });
  stub('updateSet', async (s: IMatchSet) => {
    const idx = state.sets.findIndex((existing) => existing.id === s.id);
    if (idx >= 0) state.sets[idx] = s;
    else state.sets.push(s);
  });

  stub(
    'logMatchEvent',
    async (
      matchId: string,
      eventType: MatchEventType,
      eventData: Record<string, unknown>
    ) => {
      state.events.push({ matchId, eventType, eventData });
    }
  );
  stub('findMatchHistory', async () => state.history);
  stub('findPlayerStatistics', async () => state.statistics);
  stub('updatePlayerStatistics', async (matchId: string) => {
    state.statsUpdatedFor.push(matchId);
  });

  /** Seed a match into the in-memory store and return it. */
  const seedMatch = (overrides: Partial<IMatch> = {}) => {
    const match = matchFixture(overrides);
    state.matches.set(match.id, match);
    return match;
  };

  /** Seed a set record into the in-memory store and return it. */
  const seedSet = (overrides: Partial<IMatchSet> = {}) => {
    const set = setFixture(overrides);
    state.sets.push(set);
    return set;
  };

  const eventTypes = () => state.events.map((e) => e.eventType);

  return { service, state, seedMatch, seedSet, eventTypes };
}

let harness: ReturnType<typeof createHarness>;

beforeEach(() => {
  vi.restoreAllMocks();
  harness = createHarness();
});

describe('MatchService.createMatch', () => {
  it('creates a SCHEDULED match with a zeroed scoreboard', async () => {
    const result = await harness.service.createMatch(createRequest(), ADMIN_AUTH);

    expect(result.status).toBe(MatchStatus.SCHEDULED);
    expect(result.current_set).toBe(1);
    expect(result.sets_won_player1).toBe(0);
    expect(result.sets_won_player2).toBe(0);
    expect(result.tournament_id).toBe(TOURNAMENT_ID);
    expect(result.player1.id).toBe(PLAYER_1);
    expect(result.player2.id).toBe(PLAYER_2);
    expect(result.winner).toBeUndefined();
    expect(harness.state.inserted).toHaveLength(1);
  });

  it('records a CREATED audit event naming the creator', async () => {
    await harness.service.createMatch(createRequest(), ADMIN_AUTH);

    expect(harness.eventTypes()).toContain(MatchEventType.CREATED);
    expect(harness.state.events[0].eventData).toMatchObject({
      created_by: ADMIN_AUTH.user_id,
    });
  });

  it('rejects a match where both players are the same person', async () => {
    await expect(
      harness.service.createMatch(
        createRequest({ player2_id: PLAYER_1 }),
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidPlayerError);
  });

  it('rejects a match in a tournament that is not ACTIVE', async () => {
    const inactive = createHarness({ tournamentStatus: 'DRAFT' });

    await expect(
      inactive.service.createMatch(createRequest(), ADMIN_AUTH)
    ).rejects.toThrow(TournamentNotActiveError);
  });

  it('rejects a duplicate pairing in the same round', async () => {
    harness.state.existingMatch = matchFixture();

    await expect(
      harness.service.createMatch(createRequest(), ADMIN_AUTH)
    ).rejects.toThrow(DuplicateMatchError);
  });

  it.each([
    ['25/12/2026', '14:00', 'INVALID_DATE'],
    ['2026-12-25', '25:00', 'INVALID_TIME'],
    ['2026-12-25', '2pm', 'INVALID_TIME'],
  ])('rejects malformed schedule %s %s', async (date, time, code) => {
    await expect(
      harness.service.createMatch(
        createRequest({ scheduled_date: date, scheduled_time: time }),
        ADMIN_AUTH
      )
    ).rejects.toMatchObject({ code });
  });

  it('rejects a match scheduled in the past', async () => {
    await expect(
      harness.service.createMatch(
        createRequest({ scheduled_date: '2020-01-01', scheduled_time: '09:00' }),
        ADMIN_AUTH
      )
    ).rejects.toMatchObject({ code: 'PAST_DATE' });
  });
});

describe('MatchService.getMatchById', () => {
  it('throws MatchNotFoundError for an unknown id', async () => {
    await expect(harness.service.getMatchById('nope')).rejects.toThrow(
      MatchNotFoundError
    );
  });

  it('resolves the winner when the match has one', async () => {
    const match = harness.seedMatch({
      status: MatchStatus.COMPLETED,
      winner_id: PLAYER_2,
    });

    const result = await harness.service.getMatchById(match.id);

    expect(result.winner?.id).toBe(PLAYER_2);
  });

  it('serializes timestamps as ISO strings', async () => {
    const start = new Date('2026-08-20T10:00:00.000Z');
    const match = harness.seedMatch({ actual_start_time: start });

    const result = await harness.service.getMatchById(match.id);

    expect(result.actual_start_time).toBe(start.toISOString());
    expect(typeof result.created_at).toBe('string');
  });
});

describe('MatchService.updateMatch', () => {
  it('applies schedule and court changes to a SCHEDULED match', async () => {
    const match = harness.seedMatch();
    const newDate = futureDate(14);

    const result = await harness.service.updateMatch(
      match.id,
      { scheduled_date: newDate, scheduled_time: '09:30', court_id: 'court_009' },
      ADMIN_AUTH
    );

    expect(result.scheduled_date).toBe(newDate);
    expect(result.scheduled_time).toBe('09:30');
    expect(result.court_id).toBe('court_009');
  });

  it('refuses to update a match that is already IN_PROGRESS', async () => {
    const match = harness.seedMatch({ status: MatchStatus.IN_PROGRESS });

    await expect(
      harness.service.updateMatch(match.id, { court_id: 'court_009' }, ADMIN_AUTH)
    ).rejects.toThrow(InvalidMatchStateError);
  });

  it('rejects a caller who is neither an admin nor a participant', async () => {
    const match = harness.seedMatch();

    await expect(
      harness.service.updateMatch(match.id, { notes: 'hi' }, OUTSIDER_AUTH)
    ).rejects.toThrow(UnauthorizedMatchError);
  });

  it('allows a participating player to update their own match', async () => {
    const match = harness.seedMatch();

    const result = await harness.service.updateMatch(
      match.id,
      { notes: 'running late' },
      PLAYER_1_AUTH
    );

    expect(result.id).toBe(match.id);
  });
});

describe('MatchService.deleteMatch', () => {
  it('soft-deletes a SCHEDULED match', async () => {
    const match = harness.seedMatch();

    await harness.service.deleteMatch(match.id, ADMIN_AUTH);

    expect(harness.state.softDeleted).toEqual([match.id]);
  });

  it('refuses to delete a match that is IN_PROGRESS', async () => {
    const match = harness.seedMatch({ status: MatchStatus.IN_PROGRESS });

    await expect(
      harness.service.deleteMatch(match.id, ADMIN_AUTH)
    ).rejects.toThrow(InvalidMatchStateError);
  });

  it('refuses to delete a COMPLETED match', async () => {
    const match = harness.seedMatch({ status: MatchStatus.COMPLETED });

    await expect(
      harness.service.deleteMatch(match.id, ADMIN_AUTH)
    ).rejects.toThrow(InvalidMatchStateError);
  });
});

describe('MatchService.startMatch', () => {
  it('moves a SCHEDULED match to IN_PROGRESS and stamps the start time', async () => {
    const match = harness.seedMatch();

    const result = await harness.service.startMatch(match.id, ADMIN_AUTH);

    expect(result.status).toBe(MatchStatus.IN_PROGRESS);
    expect(result.actual_start_time).toBeDefined();
    expect(harness.eventTypes()).toContain(MatchEventType.MATCH_STARTED);
  });

  it('refuses to start a match twice', async () => {
    const match = harness.seedMatch({ status: MatchStatus.IN_PROGRESS });

    await expect(
      harness.service.startMatch(match.id, ADMIN_AUTH)
    ).rejects.toThrow(InvalidMatchStateError);
  });
});

describe('MatchService.recordScore', () => {
  let match: IMatch;

  beforeEach(() => {
    match = harness.seedMatch({ status: MatchStatus.IN_PROGRESS });
  });

  it('creates a set record the first time a score is reported', async () => {
    await harness.service.recordScore(
      match.id,
      { set_number: 1, player1_games: 3, player2_games: 2 },
      ADMIN_AUTH
    );

    expect(harness.state.sets).toHaveLength(1);
    expect(harness.state.sets[0]).toMatchObject({
      set_number: 1,
      player1_games: 3,
      player2_games: 2,
      is_tiebreak: false,
    });
  });

  it('updates the existing set record on subsequent reports', async () => {
    await harness.service.recordScore(
      match.id,
      { set_number: 1, player1_games: 3, player2_games: 2 },
      ADMIN_AUTH
    );
    await harness.service.recordScore(
      match.id,
      { set_number: 1, player1_games: 4, player2_games: 2 },
      ADMIN_AUTH
    );

    expect(harness.state.sets).toHaveLength(1);
    expect(harness.state.sets[0].player1_games).toBe(4);
  });

  it('emits a SCORE_RECORDED audit event with the reported games', async () => {
    await harness.service.recordScore(
      match.id,
      { set_number: 2, player1_games: 5, player2_games: 4 },
      ADMIN_AUTH
    );

    const event = harness.state.events.find(
      (e) => e.eventType === MatchEventType.SCORE_RECORDED
    );
    expect(event?.eventData).toMatchObject({
      set_number: 2,
      player1_games: 5,
      player2_games: 4,
    });
  });

  it('refuses to record a score unless the match is IN_PROGRESS', async () => {
    const scheduled = harness.seedMatch({ id: 'match_scheduled' });

    await expect(
      harness.service.recordScore(
        scheduled.id,
        { set_number: 1, player1_games: 1, player2_games: 0 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidMatchStateError);
  });

  it('rejects a caller who is not a participant or admin', async () => {
    await expect(
      harness.service.recordScore(
        match.id,
        { set_number: 1, player1_games: 1, player2_games: 0 },
        OUTSIDER_AUTH
      )
    ).rejects.toThrow(UnauthorizedMatchError);
  });

  // In-progress scores are legal to record even though they do not yet win
  // the set. 6-5 and 6-6 in particular used to be rejected outright, which
  // made live scoring impossible past 5 games.
  it.each([
    [0, 0],
    [3, 2],
    [6, 0],
    [6, 4],
    [5, 5],
    [6, 5],
    [6, 6],
    [7, 5],
  ])('accepts the reachable in-progress score %i-%i', async (p1, p2) => {
    await expect(
      harness.service.recordScore(
        match.id,
        { set_number: 1, player1_games: p1, player2_games: p2 },
        ADMIN_AUTH
      )
    ).resolves.toBeDefined();
  });

  it.each([
    [-1, 0],
    [0, -3],
    [8, 6],
    [9, 0],
    [7, 3],
    [7, 0],
  ])('rejects the unreachable score %i-%i', async (p1, p2) => {
    await expect(
      harness.service.recordScore(
        match.id,
        { set_number: 1, player1_games: p1, player2_games: p2 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidScoreError);
  });

  it('rejects fractional game counts', async () => {
    await expect(
      harness.service.recordScore(
        match.id,
        { set_number: 1, player1_games: 2.5, player2_games: 1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidScoreError);
  });

  describe('tiebreak scores', () => {
    it('accepts a 7-0 tiebreak (zero points is a legal total)', async () => {
      await expect(
        harness.service.recordScore(
          match.id,
          {
            set_number: 1,
            player1_games: 7,
            player2_games: 6,
            is_tiebreak: true,
            tiebreak_player1_points: 7,
            tiebreak_player2_points: 0,
          },
          ADMIN_AUTH
        )
      ).resolves.toBeDefined();
    });

    it('accepts an extended tiebreak decided by two points', async () => {
      await expect(
        harness.service.recordScore(
          match.id,
          {
            set_number: 1,
            player1_games: 7,
            player2_games: 6,
            is_tiebreak: true,
            tiebreak_player1_points: 12,
            tiebreak_player2_points: 10,
          },
          ADMIN_AUTH
        )
      ).resolves.toBeDefined();
    });

    it('rejects an extended tiebreak with an impossible margin', async () => {
      await expect(
        harness.service.recordScore(
          match.id,
          {
            set_number: 1,
            player1_games: 7,
            player2_games: 6,
            is_tiebreak: true,
            tiebreak_player1_points: 12,
            tiebreak_player2_points: 5,
          },
          ADMIN_AUTH
        )
      ).rejects.toThrow(InvalidScoreError);
    });

    it('requires tiebreak points when the set is flagged as a tiebreak', async () => {
      await expect(
        harness.service.recordScore(
          match.id,
          {
            set_number: 1,
            player1_games: 7,
            player2_games: 6,
            is_tiebreak: true,
          },
          ADMIN_AUTH
        )
      ).rejects.toThrow(InvalidScoreError);
    });

    it('rejects negative tiebreak points', async () => {
      await expect(
        harness.service.recordScore(
          match.id,
          {
            set_number: 1,
            player1_games: 7,
            player2_games: 6,
            is_tiebreak: true,
            tiebreak_player1_points: 7,
            tiebreak_player2_points: -1,
          },
          ADMIN_AUTH
        )
      ).rejects.toThrow(InvalidScoreError);
    });
  });
});

describe('MatchService.completeSet', () => {
  let match: IMatch;

  beforeEach(() => {
    match = harness.seedMatch({ status: MatchStatus.IN_PROGRESS });
  });

  it('credits the set to the winner and advances the current set', async () => {
    harness.seedSet({ set_number: 1, player1_games: 6, player2_games: 4 });

    const result = await harness.service.completeSet(
      match.id,
      { set_number: 1, winner_id: PLAYER_1 },
      ADMIN_AUTH
    );

    expect(result.sets_won_player1).toBe(1);
    expect(result.sets_won_player2).toBe(0);
    expect(result.current_set).toBe(2);
    expect(result.status).toBe(MatchStatus.IN_PROGRESS);
    expect(harness.eventTypes()).toContain(MatchEventType.SET_COMPLETED);
  });

  it('stamps the set winner and completion time on the set record', async () => {
    const set = harness.seedSet({ set_number: 1, player1_games: 6, player2_games: 4 });

    await harness.service.completeSet(
      match.id,
      { set_number: 1, winner_id: PLAYER_1 },
      ADMIN_AUTH
    );

    expect(set.set_winner_id).toBe(PLAYER_1);
    expect(set.completed_at).toBeInstanceOf(Date);
  });

  it('completes the match once a player reaches the required set count', async () => {
    const start = new Date(Date.now() - 90 * 60_000);
    const decider = harness.seedMatch({
      id: 'match_decider',
      status: MatchStatus.IN_PROGRESS,
      sets_won_player1: 1,
      sets_won_player2: 0,
      current_set: 2,
      actual_start_time: start,
    });
    harness.seedSet({
      id: 'set_decider',
      match_id: decider.id,
      set_number: 2,
      player1_games: 6,
      player2_games: 3,
    });

    const result = await harness.service.completeSet(
      decider.id,
      { set_number: 2, winner_id: PLAYER_1 },
      ADMIN_AUTH
    );

    expect(result.sets_won_player1).toBe(TENNIS_RULES.SETS_TO_WIN_MATCH);
    expect(result.status).toBe(MatchStatus.COMPLETED);
    expect(result.winner?.id).toBe(PLAYER_1);
    expect(result.actual_end_time).toBeDefined();
    expect(result.duration_minutes).toBe(90);
    expect(harness.state.statsUpdatedFor).toContain(decider.id);
  });

  it('awards the match to player 2 when they take the required sets', async () => {
    const decider = harness.seedMatch({
      id: 'match_p2',
      status: MatchStatus.IN_PROGRESS,
      sets_won_player2: 1,
      current_set: 2,
    });
    harness.seedSet({
      id: 'set_p2',
      match_id: decider.id,
      set_number: 2,
      player1_games: 2,
      player2_games: 6,
    });

    const result = await harness.service.completeSet(
      decider.id,
      { set_number: 2, winner_id: PLAYER_2 },
      ADMIN_AUTH
    );

    expect(result.status).toBe(MatchStatus.COMPLETED);
    expect(result.winner?.id).toBe(PLAYER_2);
  });

  it('rejects a winner who is not one of the two players', async () => {
    harness.seedSet({ set_number: 1, player1_games: 6, player2_games: 4 });

    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_3 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidPlayerError);
  });

  it('rejects completing a set that has no recorded score', async () => {
    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidMatchStateError);
  });

  it('refuses to complete the same set twice', async () => {
    harness.seedSet({
      set_number: 1,
      player1_games: 6,
      player2_games: 4,
      set_winner_id: PLAYER_1,
    });

    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidMatchStateError);
  });

  it('rejects a declared winner who trails on games', async () => {
    harness.seedSet({ set_number: 1, player1_games: 4, player2_games: 6 });

    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidScoreError);
  });

  it('rejects a set win without the required two-game lead', async () => {
    harness.seedSet({ set_number: 1, player1_games: 6, player2_games: 5 });

    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidScoreError);
  });

  it('rejects a set win with fewer than six games', async () => {
    harness.seedSet({ set_number: 1, player1_games: 4, player2_games: 1 });

    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidScoreError);
  });

  it('accepts a 7-5 set won on a two-game lead', async () => {
    harness.seedSet({ set_number: 1, player1_games: 7, player2_games: 5 });

    const result = await harness.service.completeSet(
      match.id,
      { set_number: 1, winner_id: PLAYER_1 },
      ADMIN_AUTH
    );

    expect(result.sets_won_player1).toBe(1);
  });

  it('accepts a 7-6 set decided by a tiebreak', async () => {
    harness.seedSet({
      set_number: 1,
      player1_games: 7,
      player2_games: 6,
      is_tiebreak: true,
      tiebreak_player1_points: 7,
      tiebreak_player2_points: 5,
    });

    const result = await harness.service.completeSet(
      match.id,
      { set_number: 1, winner_id: PLAYER_1 },
      ADMIN_AUTH
    );

    expect(result.sets_won_player1).toBe(1);
  });

  it('rejects a 7-6 set that was never flagged as a tiebreak', async () => {
    harness.seedSet({ set_number: 1, player1_games: 7, player2_games: 6 });

    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidScoreError);
  });

  it('rejects a tiebreak set awarded to the player who lost the tiebreak', async () => {
    harness.seedSet({
      set_number: 1,
      player1_games: 7,
      player2_games: 6,
      is_tiebreak: true,
      tiebreak_player1_points: 5,
      tiebreak_player2_points: 7,
    });

    await expect(
      harness.service.completeSet(
        match.id,
        { set_number: 1, winner_id: PLAYER_1 },
        ADMIN_AUTH
      )
    ).rejects.toThrow(InvalidScoreError);
  });
});

describe('MatchService.completeMatch', () => {
  it('finalizes an IN_PROGRESS match and computes its duration', async () => {
    const start = new Date('2026-08-20T10:00:00.000Z');
    const match = harness.seedMatch({
      status: MatchStatus.IN_PROGRESS,
      actual_start_time: start,
    });

    const result = await harness.service.completeMatch(
      match.id,
      { winner_id: PLAYER_2, actual_end_time: '2026-08-20T12:15:00.000Z' },
      ADMIN_AUTH
    );

    expect(result.status).toBe(MatchStatus.COMPLETED);
    expect(result.winner?.id).toBe(PLAYER_2);
    expect(result.duration_minutes).toBe(135);
    expect(harness.state.statsUpdatedFor).toContain(match.id);
    expect(harness.eventTypes()).toContain(MatchEventType.MATCH_COMPLETED);
  });

  it('rejects a winner who is not one of the two players', async () => {
    const match = harness.seedMatch({ status: MatchStatus.IN_PROGRESS });

    await expect(
      harness.service.completeMatch(match.id, { winner_id: PLAYER_3 }, ADMIN_AUTH)
    ).rejects.toThrow(InvalidPlayerError);
  });

  it('refuses to re-complete an already COMPLETED match', async () => {
    const match = harness.seedMatch({
      status: MatchStatus.COMPLETED,
      winner_id: PLAYER_1,
    });

    await expect(
      harness.service.completeMatch(match.id, { winner_id: PLAYER_1 }, ADMIN_AUTH)
    ).rejects.toThrow(InvalidMatchStateError);
  });

  it('throws MatchNotFoundError for an unknown match', async () => {
    await expect(
      harness.service.completeMatch('nope', { winner_id: PLAYER_1 }, ADMIN_AUTH)
    ).rejects.toThrow(MatchNotFoundError);
  });
});

describe('MatchService.cancelMatch', () => {
  it('cancels a SCHEDULED match and records the reason', async () => {
    const match = harness.seedMatch();

    const result = await harness.service.cancelMatch(
      match.id,
      { reason: 'rain', notes: 'rescheduling next week' },
      ADMIN_AUTH
    );

    expect(result.status).toBe(MatchStatus.CANCELLED);
    const event = harness.state.events.find(
      (e) => e.eventType === MatchEventType.MATCH_CANCELLED
    );
    expect(event?.eventData).toMatchObject({ reason: 'rain' });
  });

  it('refuses to cancel a COMPLETED match', async () => {
    const match = harness.seedMatch({ status: MatchStatus.COMPLETED });

    await expect(
      harness.service.cancelMatch(match.id, { reason: 'oops' }, ADMIN_AUTH)
    ).rejects.toThrow(InvalidMatchStateError);
  });
});

describe('MatchService history and statistics', () => {
  it('returns the audit trail for a known match', async () => {
    const match = harness.seedMatch();
    harness.state.history = [
      {
        id: 'evt_1',
        match_id: match.id,
        event_type: MatchEventType.CREATED,
        event_data: {},
        event_timestamp: new Date(),
        created_at: new Date(),
      },
    ];

    const history = await harness.service.getMatchHistory(match.id);

    expect(history).toHaveLength(1);
    expect(history[0].event_type).toBe(MatchEventType.CREATED);
  });

  it('throws MatchNotFoundError when asking for history of an unknown match', async () => {
    await expect(harness.service.getMatchHistory('nope')).rejects.toThrow(
      MatchNotFoundError
    );
  });

  it('throws a 404 MatchError when player statistics are missing', async () => {
    await expect(
      harness.service.getPlayerStatistics(PLAYER_1, TOURNAMENT_ID)
    ).rejects.toMatchObject({ code: 'STATISTICS_NOT_FOUND', status: 404 });
  });

  it('returns stored player statistics when present', async () => {
    harness.state.statistics = {
      id: 'stat_1',
      player_id: PLAYER_1,
      tournament_id: TOURNAMENT_ID,
      matches_played: 4,
      matches_won: 3,
      matches_lost: 1,
      win_percentage: 75,
      sets_won: 7,
      sets_lost: 3,
      games_won: 48,
      games_lost: 31,
      updated_at: new Date(),
    };

    const stats = await harness.service.getPlayerStatistics(PLAYER_1, TOURNAMENT_ID);

    expect(stats.win_percentage).toBe(75);
    expect(stats).toBeDefined();
    expect(MatchError).toBeDefined();
  });
});

describe('MatchService pagination', () => {
  it('reports has_next on a non-final page', async () => {
    harness.seedMatch({ id: 'm1' });
    harness.state.total = 25;

    const result = await harness.service.listMatches(
      { tournament_id: TOURNAMENT_ID },
      { page: 1, limit: 10 }
    );

    expect(result.pagination).toMatchObject({
      total: 25,
      page: 1,
      limit: 10,
      total_pages: 3,
      has_next: true,
      has_prev: false,
    });
  });

  it('reports has_prev without has_next on the final page', async () => {
    harness.seedMatch({ id: 'm1' });
    harness.state.total = 25;

    const result = await harness.service.listMatches({}, { page: 3, limit: 10 });

    expect(result.pagination).toMatchObject({
      total_pages: 3,
      has_next: false,
      has_prev: true,
    });
  });

  it('paginates a player match history query', async () => {
    harness.seedMatch({ id: 'm1', status: MatchStatus.COMPLETED, winner_id: PLAYER_1 });
    harness.state.total = 1;

    const result = await harness.service.getPlayerMatches(
      PLAYER_1,
      { status: MatchStatus.COMPLETED },
      { page: 1, limit: 10 }
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].winner?.id).toBe(PLAYER_1);
    expect(result.pagination.total_pages).toBe(1);
  });
});
