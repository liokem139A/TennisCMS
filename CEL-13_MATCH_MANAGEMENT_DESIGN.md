# CEL-13: Match Management & Real-Time Scoring - Implementation Design

**Issue ID**: CEL-13  
**Title**: Develop Match Management & Real-Time Scoring  
**Status**: In Progress  
**Owner**: Backend & Infrastructure Lead  
**Date**: August 25, 2026  
**Target Completion**: August 30, 2026  

---

## Executive Summary

CEL-13 builds comprehensive match management capabilities with real-time scoring updates via WebSockets. The implementation includes:
- Match CRUD operations (create, retrieve, update, delete)
- Score recording with set/game tracking
- Real-time WebSocket broadcasts for live match updates
- Match history and statistics tracking
- Player performance metrics

**Total Scope**: ~3,000-3,500 lines of production code  
**Estimate**: 12-16 hours development time  

---

## Requirements Analysis

### Functional Requirements

#### 1. Match Creation (FR-1)
- **Endpoint**: `POST /api/v1/matches`
- **Input**: Tournament ID, Player 1, Player 2, scheduled date/time, court ID, round number
- **Validation**:
  - Both players must be registered users
  - Tournament must be in ACTIVE status
  - Players must not have existing match in same round
  - Scheduled time must be in future
- **Output**: Created match object with status "SCHEDULED"

#### 2. Match Retrieval (FR-2)
- **Endpoints**:
  - `GET /api/v1/matches/:id` - Get single match
  - `GET /api/v1/matches` - List with filters/pagination
- **Filters**: Tournament ID, player ID, status, date range
- **Response**: Match details with current score, player info, timeline

#### 3. Score Recording (FR-3)
- **Endpoint**: `PATCH /api/v1/matches/:id`
- **Features**:
  - Record set scores (player1_games, player2_games per set)
  - Validate tennis scoring rules (first to 6 with 2+ game lead, tiebreak at 6-6)
  - Track current set number
  - Calculate match winner automatically
  - Record actual start/end times
- **Validation**:
  - Only organizers or match participants can update
  - Cannot update completed matches
  - Scores must follow tennis rules
  - Sets cannot decrease (only increase)

#### 4. Real-Time Updates (FR-4)
- **WebSocket Endpoint**: `ws://api.celadontennis.com/v1/matches/:id/live`
- **Broadcast Events**:
  - `match:score-updated` - Score change
  - `match:started` - Match begins
  - `match:paused` - Match on break
  - `match:completed` - Match finished
  - `match:status-changed` - Status update
- **Features**:
  - Automatic reconnection on disconnect
  - Heartbeat to keep connection alive
  - Rate limiting (max 10 updates/second per match)
  - Redis pub/sub for multi-instance support

#### 5. Match History (FR-5)
- **Endpoints**:
  - `GET /api/v1/matches/:id/history` - Timeline of all changes
  - `GET /api/v1/players/:id/matches` - Player's match history
- **Data Tracked**:
  - Score updates with timestamps
  - Status changes
  - Participant joins/leaves
  - Duration, start/end times
  - Final result

---

## Technical Architecture

### Database Schema

#### matches table
```sql
matches
├── id (UUID, PRIMARY)
├── tournament_id (UUID, FK)
├── round (INT)
├── scheduled_date (TIMESTAMP)
├── scheduled_time (TIME)
├── court_id (UUID)
├── status (ENUM: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
├── player1_id (UUID, FK)
├── player2_id (UUID, FK)
├── winner_id (UUID, nullable)
├── actual_start_time (TIMESTAMP, nullable)
├── actual_end_time (TIMESTAMP, nullable)
├── duration_minutes (INT, nullable)
├── current_set (INT, default: 1)
├── sets_won_p1 (INT, default: 0)
├── sets_won_p2 (INT, default: 0)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── deleted_at (TIMESTAMP, nullable - soft delete)
```

#### match_sets table
```sql
match_sets
├── id (UUID, PRIMARY)
├── match_id (UUID, FK)
├── set_number (INT)
├── player1_games (INT)
├── player2_games (INT)
├── tiebreak_score (JSON, nullable)
├── set_winner_id (UUID, FK)
├── completed_at (TIMESTAMP)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
```

#### match_history table
```sql
match_history
├── id (UUID, PRIMARY)
├── match_id (UUID, FK)
├── event_type (ENUM)
├── event_data (JSONB)
├── changed_by (UUID, FK - user_id)
├── timestamp (TIMESTAMP)
├── created_at (TIMESTAMP)
```

#### match_statistics table
```sql
match_statistics
├── id (UUID, PRIMARY)
├── player_id (UUID, FK)
├── tournament_id (UUID, FK)
├── matches_played (INT)
├── matches_won (INT)
├── win_percentage (DECIMAL)
├── sets_won (INT)
├── sets_lost (INT)
├── games_won (INT)
├── games_lost (INT)
├── avg_match_duration (INT)
└── updated_at (TIMESTAMP)
```

---

### Service Layer Architecture

#### MatchService (Core Business Logic)

```typescript
class MatchService {
  // Core CRUD
  createMatch(data: CreateMatchRequest): Promise<Match>
  getMatchById(id: string): Promise<Match>
  listMatches(filters: MatchFilters, pagination: Pagination): Promise<PaginatedMatch[]>
  updateMatch(id: string, data: UpdateMatchRequest): Promise<Match>
  deleteMatch(id: string): Promise<void>
  
  // Score Recording
  recordScore(matchId: string, setNumber: number, p1Games: number, p2Games: number): Promise<Match>
  completeSet(matchId: string, setNumber: number, winnerId: string): Promise<Match>
  completeMatch(matchId: string, winnerId: string): Promise<Match>
  
  // Match State
  startMatch(matchId: string): Promise<Match>
  pauseMatch(matchId: string): Promise<Match>
  resumeMatch(matchId: string): Promise<Match>
  cancelMatch(matchId: string, reason: string): Promise<Match>
  
  // History & Stats
  getMatchHistory(matchId: string): Promise<MatchEvent[]>
  getPlayerMatches(playerId: string, filters: PlayerMatchFilters): Promise<Match[]>
  updatePlayerStatistics(matchId: string): Promise<void>
}
```

#### WebSocketManager

```typescript
class WebSocketManager {
  broadcastScoreUpdate(matchId: string, update: ScoreUpdate): void
  broadcastMatchStatus(matchId: string, status: MatchStatus): void
  notifyWatchers(matchId: string, event: MatchEvent): void
  subscribeToMatch(matchId: string, userId: string): void
  unsubscribeFromMatch(matchId: string, userId: string): void
}
```

---

### API Endpoints

#### Match Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/matches` | Create match |
| GET | `/api/v1/matches/:id` | Get match |
| GET | `/api/v1/matches` | List matches |
| PATCH | `/api/v1/matches/:id` | Update match |
| DELETE | `/api/v1/matches/:id` | Delete match |
| POST | `/api/v1/matches/:id/start` | Start match |
| POST | `/api/v1/matches/:id/pause` | Pause match |
| POST | `/api/v1/matches/:id/resume` | Resume match |
| POST | `/api/v1/matches/:id/complete` | Complete match |
| PATCH | `/api/v1/matches/:id/score` | Update score |
| GET | `/api/v1/matches/:id/history` | Get match history |
| GET | `/api/v1/players/:id/matches` | Get player's matches |

#### WebSocket

| Endpoint | Event Type | Payload |
|----------|-----------|---------|
| `ws://api/matches/:id/live` | `match:started` | `{matchId, startTime}` |
| | `match:score-updated` | `{matchId, set, p1Games, p2Games, time}` |
| | `match:set-completed` | `{matchId, setNumber, winnerId, scores}` |
| | `match:completed` | `{matchId, winnerId, finalScore, duration}` |
| | `match:status-changed` | `{matchId, status, reason}` |
| | `error` | `{code, message}` |

---

### Data Validation Rules

#### Match Creation
```
- Both playerIds must be valid, active users
- tournamentId must reference existing tournament in ACTIVE status
- scheduledDate must be >= today
- scheduledTime must be valid (00:00-23:59)
- courtId must be valid if provided
- round must be >= 1
```

#### Score Recording
```
- Match status must be IN_PROGRESS
- setNumber must be current or previous set
- Player1Games, Player2Games must be 0-6, unless:
  - One player has 6+ and other has 5+ (extended)
  - One player has 7+ (determined winner)
  - Current set has tiebreak at 6-6
- Can never decrease scores (only increase)
- Tiebreak scores: each player must be 0-7 when tiebreak active
```

#### Match Completion
```
- Match must have final set completed
- Winner must be either player1_id or player2_id
- Match winner determined by first to 2 sets (best of 3)
- Sets must show 2-0, 2-1, or identical 1-1 state (incomplete)
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (2-3 hours)
- [ ] Database migrations (match tables)
- [ ] TypeScript types and interfaces
- [ ] Base MatchService implementation
- [ ] Error handling classes

### Phase 2: API Endpoints (3-4 hours)
- [ ] Match CRUD routes
- [ ] Match action routes (start, pause, complete)
- [ ] Score recording endpoint
- [ ] Authorization middleware
- [ ] Input validation (Joi/Zod schemas)

### Phase 3: Real-Time Scoring (3-4 hours)
- [ ] WebSocket server setup
- [ ] Redis pub/sub integration
- [ ] Match event broadcasting
- [ ] Client reconnection handling
- [ ] Rate limiting

### Phase 4: Match History & Statistics (2-3 hours)
- [ ] Match history tracking
- [ ] Player statistics calculation
- [ ] History query endpoints
- [ ] Leaderboard helpers

### Phase 5: Testing & Documentation (2-3 hours)
- [ ] Unit tests for MatchService
- [ ] Integration tests for API
- [ ] WebSocket test harness
- [ ] API documentation
- [ ] Architecture guide

---

## Dependencies & Blockers

### External Dependencies
- **CEL-4**: Parent issue for feature development (currently blocked)
  - Status: Will be unblocked Aug 26 EOD
  - Impact: No blocking impact on implementation
  
- **CEL-7**: Infrastructure setup (CI/CD, Docker)
  - Status: In progress
  - Impact: Low - local development possible
  
- **CEL-8**: Database setup (PostgreSQL)
  - Status: In progress
  - Impact: Medium - need PostgreSQL running

### Technical Dependencies
- Express.js ✅ (already installed)
- PostgreSQL ✅ (already configured)
- Redis ✅ (already installed for caching)
- WebSocket library: ws or socket.io (need to add)
- Testing: Vitest ✅ (already configured)

### No Blocking Issues
All dependencies are either already in place or easily added. Implementation can proceed independently.

---

## Success Criteria

- [ ] All 6 match CRUD endpoints working with proper validation
- [ ] WebSocket real-time updates broadcasting to connected clients
- [ ] Score recording validates tennis rules correctly
- [ ] Match history tracking all state changes
- [ ] Player statistics calculated after match completion
- [ ] 80%+ test coverage for MatchService
- [ ] Zero security vulnerabilities (input validation, authorization)
- [ ] API documentation complete
- [ ] Performance: Match updates < 100ms, list queries < 200ms

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| WebSocket scalability | Medium | Medium | Use Redis pub/sub for multi-instance |
| Tennis scoring complexity | Low | Medium | Comprehensive validation rules |
| Real-time broadcast latency | Low | Low | Monitor and optimize with metrics |
| Database migration conflicts | Low | Low | Use proper versioning and rollback |
| Authorization bypass | Low | High | Strict permission checks, code review |

---

## Next Steps

1. ✅ Create this design document
2. Create database migrations
3. Implement MatchService core methods
4. Build API routes and validation
5. Implement WebSocket support
6. Add comprehensive tests
7. Document API and architecture

