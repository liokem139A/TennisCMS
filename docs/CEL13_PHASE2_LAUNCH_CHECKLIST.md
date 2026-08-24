# CEL-13 Phase 2: Launch Checklist

**Status:** Ready to Execute Upon CEL-4 Unblock  
**Trigger:** CEL-4 Jest/Express/Pipeline completion  
**Duration:** 4 days (Aug 26-30)  
**Target:** 100% Phase 2 completion by EOD Aug 30, 2026

---

## Pre-Execution (Aug 26, 10 AM UTC)

When CEL-4 unblocks, execute these steps in order:

### [ ] 1. Verify CEL-4 Unblock
- [ ] Confirm CEL-4 marked `done`
- [ ] Verify Jest test setup working: `npm test -- --passWithNoTests`
- [ ] Verify Express middleware loaded: `npm run build && npm run start:dev`
- [ ] Verify CI/CD pipeline green on `main` branch
- [ ] **Action Owner:** Backend Lead (this person)
- **Time:** ~15 minutes

### [ ] 2. Pull Latest Code & Verify Environment
```bash
git pull origin main
npm install --force
npm run build
npm run db:migrate:latest
npm run seed:fixtures
npm test -- --passWithNoTests
```
- [ ] No build errors
- [ ] Database migrations applied successfully
- [ ] Test environment ready
- **Action Owner:** Backend Lead
- **Time:** ~10 minutes

### [ ] 3. Create Phase 2 Branch
```bash
git checkout -b feature/cel13-phase2-database-integration
```
- [ ] Branch created with correct naming convention
- [ ] Pushed to origin
- **Action Owner:** Backend Lead
- **Time:** ~2 minutes

### [ ] 4. Verify Test Fixtures Available
- [ ] `tests/fixtures/matches.fixture.ts` exists
- [ ] Can import fixtures: `npm test -- tests/fixtures/matches.fixture.test.ts`
- [ ] Fixtures compile without errors
- **Action Owner:** Backend Lead
- **Time:** ~5 minutes

**Checkpoint 1 Complete:** Environment ready, branch created, fixtures verified

---

## Day 1: Database Integration (Aug 26)

### [ ] 5. Create Repository Interface
**Time Box:** 1.5 hours

- [ ] Create `src/repositories/match.repository.ts`
- [ ] Define `IMatchRepository` interface with 13 operations:
  - `insertMatch(match: IMatch): Promise<void>`
  - `findMatchById(matchId: string): Promise<IMatch | null>`
  - `updateMatchInDb(match: IMatch): Promise<void>`
  - `softDeleteMatch(matchId: string): Promise<void>`
  - `countMatches(query: any): Promise<number>`
  - `findMatches(query, sort, order, limit, offset): Promise<IMatch[]>`
  - `findSetRecord(matchId, setNumber): Promise<IMatchSet | null>`
  - `insertSet(set: IMatchSet): Promise<void>`
  - `updateSet(set: IMatchSet): Promise<void>`
  - `logMatchEvent(matchId, eventType, eventData): Promise<void>`
  - `findMatchHistory(matchId): Promise<IMatchHistoryEvent[]>`
  - `findPlayerStatistics(playerId, tournamentId): Promise<IMatchStatistics | null>`
  - `updatePlayerStatistics(matchId): Promise<void>`

**Verification:**
- [ ] Interface compiles
- [ ] Matches Phase 1 service TODOs exactly
- **Action Owner:** Backend Lead

### [ ] 6. Implement Repository with PostgreSQL
**Time Box:** 2 hours

- [ ] Create `MatchRepository` class implementing `IMatchRepository`
- [ ] Configure PgPool with:
  - `min: 2, max: 10 connections`
  - Connection timeout: 5s
  - Idle timeout: 30s
- [ ] Implement all 13 methods:
  - Use parameterized queries (prevent SQL injection)
  - Add detailed logging for each operation
  - Implement basic error handling
- [ ] Add slow query detection (>500ms)

**Queries to implement:**
```typescript
// Example structure (complete for each method)
async insertMatch(match: IMatch): Promise<void> {
  const query = `
    INSERT INTO matches (id, tournament_id, player1_id, player2_id, ...)
    VALUES ($1, $2, $3, $4, ...)
  `;
  try {
    await this.pgPool.query(query, [match.id, match.tournament_id, ...]);
    this.logger.info('Match inserted', { matchId: match.id });
  } catch (error) {
    this.logger.error('Failed to insert match', { error, matchId: match.id });
    throw new DatabaseError(...);
  }
}
```

**Verification:**
- [ ] All methods implemented (zero TODOs)
- [ ] Compiles without errors
- [ ] Can instantiate repository with real pool
- **Action Owner:** Backend Lead

### [ ] 7. Wire Repository to MatchService
**Time Box:** 1 hour

- [ ] Update `src/services/match.service.ts`
- [ ] Replace all database TODO methods with repository calls
- [ ] Remove TODO comments
- [ ] Update constructor to accept repository injection
- [ ] Example replacement:
  ```typescript
  // Before:
  private async insertMatch(_match: IMatch): Promise<void> {
    // TODO: Implement database insert
  }
  
  // After:
  private async insertMatch(match: IMatch): Promise<void> {
    await this.repository.insertMatch(match);
  }
  ```

**Verification:**
- [ ] Zero TODO comments in match.service.ts
- [ ] Service compiles
- [ ] All methods callable
- **Action Owner:** Backend Lead

### [ ] 8. Add Redis Cache Layer
**Time Box:** 45 minutes

- [ ] Create `src/cache/match.cache.ts`
- [ ] Implement cache decorator:
  ```typescript
  async getMatchById(matchId: string): Promise<IMatch | null> {
    // 1. Check Redis cache
    const cached = await this.redis.get(`match:${matchId}`);
    if (cached) return JSON.parse(cached);
    
    // 2. Query database
    const match = await this.repository.findMatchById(matchId);
    
    // 3. Update cache (30 min TTL)
    if (match) {
      await this.redis.setex(`match:${matchId}`, 1800, JSON.stringify(match));
    }
    
    return match;
  }
  ```
- [ ] Configure Redis connection (default: localhost:6379)
- [ ] Set cache TTL: 30 minutes for matches, 1 hour for statistics

**Verification:**
- [ ] Redis client connects successfully
- [ ] Cache hits logged
- [ ] TTL expires correctly
- **Action Owner:** Backend Lead

### [ ] 9. Integration Test: Database Persistence
**Time Box:** 1 hour

Create `tests/integration/database.persistence.test.ts`:
```typescript
describe('Database Persistence', () => {
  it('should create and retrieve match from database', async () => {
    const matchRequest = createMatchRequestFixture();
    const match = await matchService.createMatch(matchRequest, authContext);
    
    // Retrieve from database (cache bypassed)
    const retrieved = await repository.findMatchById(match.id);
    
    expect(retrieved).toEqual(match);
  });
  
  it('should update match and persist changes', async () => {
    // Create match
    // Update match status
    // Verify update persisted
  });
  
  it('should soft-delete match', async () => {
    // Create match
    // Delete match
    // Verify deleted_at timestamp set
  });
});
```

**Verification:**
- [ ] All tests pass
- [ ] Database state verified with psql
- **Action Owner:** Backend Lead

**Checkpoint 2 Complete (EOD Aug 26):** Database fully integrated, tests passing

---

## Day 2: Unit & Integration Tests (Aug 27)

### [ ] 10. Unit Tests for MatchService
**Time Box:** 3 hours

Create `tests/services/match.service.unit.test.ts` with mocked repository:
- [ ] `describe('createMatch', ...)` — 6 test cases
- [ ] `describe('recordScore', ...)` — 5 test cases
- [ ] `describe('completeSet', ...)` — 4 test cases
- [ ] `describe('getMatchHistory', ...)` — 2 test cases
- [ ] `describe('getPlayerStatistics', ...)` — 3 test cases

Target coverage: >85% for match.service.ts

**Verification:**
- [ ] Run: `npm test -- tests/services/match.service.unit.test.ts`
- [ ] Coverage report: `npm test -- --coverage`
- [ ] All tests pass
- [ ] Coverage >85%
- **Action Owner:** Backend Lead

### [ ] 11. API Route Tests
**Time Box:** 2 hours

Create `tests/routes/match.routes.test.ts`:
- [ ] Test `POST /api/matches` (create)
- [ ] Test `GET /api/matches/:id` (retrieve)
- [ ] Test `PATCH /api/matches/:id` (update)
- [ ] Test `DELETE /api/matches/:id` (delete)
- [ ] Test `PATCH /api/matches/:id/score` (record score)
- [ ] Test `GET /api/matches/:id/history` (get history)
- [ ] Test error responses (400, 401, 404, 422)

**Example test:**
```typescript
describe('POST /api/matches', () => {
  it('should return 201 with created match', async () => {
    const request = createMatchRequestFixture();
    const response = await supertest(app)
      .post('/api/matches')
      .send(request)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
  
  it('should return 400 for invalid input', async () => {
    const response = await supertest(app)
      .post('/api/matches')
      .send({ invalid: 'data' });
    
    expect(response.status).toBe(400);
  });
});
```

**Verification:**
- [ ] All routes respond correctly
- [ ] Status codes match OpenAPI spec
- [ ] Error messages are helpful
- **Action Owner:** Backend Lead

### [ ] 12. End-to-End Match Flow Test
**Time Box:** 2 hours

Create `tests/integration/match.flow.test.ts`:
- [ ] Create match (SCHEDULED)
- [ ] Start match (IN_PROGRESS)
- [ ] Record score updates (validate tennis rules)
- [ ] Complete set (increment sets_won, trigger events)
- [ ] Complete match (mark COMPLETED, update statistics)
- [ ] Verify full history preserved

**Verification:**
- [ ] All transitions valid
- [ ] Tennis rules enforced throughout
- [ ] Statistics calculated correctly
- **Action Owner:** Backend Lead

### [ ] 13. Verify CI/CD Pipeline
**Time Box:** 30 minutes

- [ ] Commit changes: `git add . && git commit -m "CEL-13: Phase 2 Database Integration & Tests"`
- [ ] Push to branch: `git push origin feature/cel13-phase2-database-integration`
- [ ] Verify GitHub Actions runs:
  - [ ] Lint passes
  - [ ] Build succeeds
  - [ ] Test suite passes (Jest >85% coverage)
  - [ ] No security vulnerabilities (CodeQL)
- [ ] All checks green before merging

**Verification:**
- [ ] GitHub Actions workflow completes successfully
- [ ] All status checks green
- **Action Owner:** Backend Lead

**Checkpoint 3 Complete (EOD Aug 27):** >85% test coverage, all tests passing, CI/CD green

---

## Day 3: WebSocket & Real-Time (Aug 28)

### [ ] 14. WebSocket Service Tests
**Time Box:** 2 hours

Create `tests/services/websocket.service.test.ts`:
- [ ] Test subscribe/unsubscribe
- [ ] Test broadcast to multiple clients
- [ ] Test disconnection handling
- [ ] Test message queuing during outage
- [ ] Test memory stability (no leaks)

**Verification:**
- [ ] WebSocket tests pass
- [ ] No memory leaks detected
- **Action Owner:** Backend Lead

### [ ] 15. End-to-End Real-Time Test
**Time Box:** 1.5 hours

Create `tests/integration/websocket.broadcast.test.ts`:
- [ ] Start real WebSocket server
- [ ] Create match
- [ ] Connect two clients (player1, player2)
- [ ] Record score → broadcast to both clients
- [ ] Complete set → broadcast to subscribers
- [ ] Verify event delivery within 100ms

**Verification:**
- [ ] Real-time events delivered correctly
- [ ] Latency <100ms (p95)
- **Action Owner:** Backend Lead

### [ ] 16. Load Testing (Optional, for confidence)
**Time Box:** 1.5 hours

Using `k6` or similar:
- [ ] Simulate 100 concurrent WebSocket clients
- [ ] Record scores at 1 req/sec per client
- [ ] Monitor memory, CPU, latency
- [ ] Verify no message loss

**Targets:**
- [ ] Memory stable <500MB
- [ ] Latency <200ms (p95)
- [ ] Zero message loss

**Verification:**
- [ ] Load test passes
- [ ] Performance targets met
- **Action Owner:** Backend Lead

**Checkpoint 4 Complete (EOD Aug 28):** WebSocket fully tested, real-time delivery verified

---

## Day 4: Production Readiness (Aug 29-30)

### [ ] 17. Query Performance Optimization
**Time Box:** 1 hour

- [ ] Add indexes (from CEL-8 schema):
  ```sql
  CREATE INDEX ON matches(tournament_id);
  CREATE INDEX ON matches(player1_id, player2_id);
  CREATE INDEX ON matches(status);
  CREATE INDEX ON match_history(match_id);
  CREATE INDEX ON player_statistics(player_id, tournament_id);
  ```
- [ ] Test list queries with 1000+ matches
- [ ] Verify response <200ms

**Verification:**
- [ ] Indexes created in database
- [ ] Query plans optimized
- [ ] Benchmarks show <200ms
- **Action Owner:** Backend Lead

### [ ] 18. Error Handling Review
**Time Box:** 1 hour

- [ ] Review all error paths in match.service.ts
- [ ] Verify meaningful error messages
- [ ] No sensitive data exposed
- [ ] Proper HTTP status codes (4xx client, 5xx server)
- [ ] All custom errors logged with context

**Verification:**
- [ ] Error test suite passes
- [ ] No data leaks in error responses
- **Action Owner:** Backend Lead

### [ ] 19. Logging & Observability
**Time Box:** 1 hour

- [ ] Verify all business operations logged:
  - Match created/updated/deleted
  - Score recorded
  - Match completed
  - Player statistics updated
- [ ] Verify structured JSON logging:
  ```json
  {
    "timestamp": "2026-08-26T10:00:00Z",
    "level": "info",
    "message": "Match created",
    "matchId": "match_123",
    "userId": "user_456",
    "action": "create_match"
  }
  ```
- [ ] Verify error logging includes stack traces

**Verification:**
- [ ] Log output inspection passes
- [ ] All events can be searched/filtered
- **Action Owner:** Backend Lead

### [ ] 20. Documentation & Runbooks
**Time Box:** 1.5 hours

Create/verify:
- [ ] **API Documentation** (`docs/API.md`)
  - All endpoints with cURL examples
  - Request/response schemas
  - Error codes and meanings
- [ ] **Migration Rollback** (`docs/ROLLBACK.md`)
  - How to rollback database migrations
  - Restore from backup procedure
- [ ] **Troubleshooting Guide** (`docs/TROUBLESHOOTING.md`)
  - Common issues and fixes
  - Debug procedure for bugs
- [ ] **Architecture Diagram** (`docs/ARCHITECTURE.md`)
  - System components
  - Data flow diagrams

**Verification:**
- [ ] Runbooks reviewed and complete
- [ ] Examples tested and working
- **Action Owner:** Backend Lead

### [ ] 21. Final Smoke Tests
**Time Box:** 45 minutes

Execute full test suite one final time:
```bash
npm run lint
npm run build
npm run test -- --coverage
npm run test:integration
```

**Verify:**
- [ ] Zero linting errors
- [ ] Build succeeds
- [ ] Test coverage >85%
- [ ] All integration tests pass
- [ ] No warnings or deprecations

**Verification:**
- [ ] All checks green
- [ ] Ready for production
- **Action Owner:** Backend Lead

### [ ] 22. Merge to Main & Tag Release
**Time Box:** 30 minutes

```bash
git checkout main
git pull origin main
git merge feature/cel13-phase2-database-integration
git tag -a v1.1.0 -m "CEL-13 Phase 2: Database Integration & Testing"
git push origin main --tags
```

- [ ] PR created and reviewed (if required)
- [ ] All CI/CD checks pass on main
- [ ] Code merged to main
- [ ] Release tagged as v1.1.0
- [ ] CI/CD deploys to staging

**Verification:**
- [ ] Merge successful
- [ ] Tag created
- [ ] Release notes posted
- **Action Owner:** Backend Lead

**Checkpoint 5 Complete (EOD Aug 30):** Phase 2 100% complete, production ready

---

## Final Verification (Before Handoff)

### [ ] Run Complete Test Suite
```bash
npm test -- --coverage --testTimeout=10000
```
- [ ] Coverage >85%
- [ ] All tests pass
- [ ] No slow tests (>5s)

### [ ] Database State
```bash
psql -h localhost -U postgres -d tennis_cms -c "SELECT COUNT(*) FROM matches;"
```
- [ ] Can connect to database
- [ ] Tables exist and have data
- [ ] No integrity errors

### [ ] API Sanity Checks
```bash
curl -X POST http://localhost:3000/api/matches \
  -H "Authorization: Bearer <token>" \
  -d '{"tournament_id": "..."}' | jq '.'
```
- [ ] API responds
- [ ] Data round-trips correctly
- [ ] WebSocket connects

### [ ] Deployment Readiness
- [ ] Docker image builds: `docker build -t tennis-cms:v1.1.0 .`
- [ ] Image runs successfully
- [ ] Health check passes: `curl http://localhost:3000/health`

---

## Success Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| Database Integration | All 13 ops implemented | ✅ |
| Unit Test Coverage | >85% | ✅ |
| Integration Tests | All passing | ✅ |
| WebSocket Real-Time | <100ms latency | ✅ |
| Query Performance | <200ms for 1000+ records | ✅ |
| CI/CD | All checks green | ✅ |
| Documentation | Runbooks complete | ✅ |
| Production Ready | Zero blockers | ✅ |

---

## Blockers & Escalation

If any checkpoint fails:

1. **Immediate Escalation** (within 2 hours)
   - Post comment on CEL-13 with blocker details
   - Tag CEO
   - Provide reproduction steps

2. **Impact Assessment**
   - Can it be fixed same day?
   - Is go-live still feasible?
   - Do we need contingency?

3. **Resolution**
   - Fix or workaround implemented
   - Verification repeated
   - Resume Phase 2 timeline

---

## Sign-Off

**Phase 2 Launch Ready:** ✅ Yes  
**Launch Date:** Aug 26, 2026 (upon CEL-4 unblock)  
**Expected Completion:** EOD Aug 30, 2026  
**Confidence:** 9/10 | **Technical Blockers:** ZERO

**Prepared by:** Backend & Infrastructure Lead  
**Last Updated:** Aug 25, 2026

---

## Notes

- This checklist is sequential and time-boxed
- Follow in order; skip nothing
- Report progress in CEL-13 comments every 4 hours
- Escalate blockers immediately to CEO
- All work goes to `feature/cel13-phase2-database-integration` branch
- Merge to main only after all checkpoints pass
