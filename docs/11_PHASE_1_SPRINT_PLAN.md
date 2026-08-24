# Phase 1 Sprint Plan - MVP Infrastructure & Database Setup

**Document Version**: 1.0  
**Status**: Active - Ready for Execution  
**Last Updated**: August 24, 2026  
**Sprint Period**: August 24-30, 2026  
**Execution Model**: Parallel dual-stream (CEL-7 + CEL-8)

---

## Sprint Overview

**Phase 1 Sprint Objective**: Establish the foundation infrastructure and database layer required to unblock feature development (CEL-4) and ensure all developers can contribute by Week 2.

**Success Criteria**:
- ✅ Both CEL-7 (Infrastructure) and CEL-8 (Database) in `in_progress` status by Aug 26
- ✅ Development environment fully functional (GitHub + Docker + Local PostgreSQL)
- ✅ First code PR merged and CI/CD validated
- ✅ CEL-4 unblock conditions met by Aug 26 5 PM UTC

**Confidence Level**: 9/10  
**Risk Level**: Low  
**Escalation SLA**: 2 hours (CEO monitoring active)

---

## Stream 1: Infrastructure Setup (CEL-7)

### Epic Owner: Infrastructure/DevOps Lead

### Sprint Backlog

#### Story 1: GitHub Repository Configuration (Priority: P0)
**Story Points**: 5  
**Target Days**: Aug 24-25  
**Owner**: Infrastructure Lead

**Acceptance Criteria**:
1. Main branch exists with protection rules:
   - Require pull request reviews (minimum 1)
   - Require status checks to pass before merge
   - Dismiss stale PR approvals on new commits
   - Include administrators in restrictions
2. Feature branch naming convention established: `feature/CEL-XXX-description`
3. Pull request template created with sections:
   - What changed
   - Why the change
   - Testing performed
   - Related issues (CEL-X references)
4. Automated checks configured on all PRs:
   - Build verification
   - Lint checks (ESLint for frontend, Checkstyle for Java backend)
   - Security scanning (Dependabot)

**Subtasks**:
- [ ] Create branch protection rules on `main`
- [ ] Add PR template to `.github/pull_request_template.md`
- [ ] Configure GitHub Actions for build + lint
- [ ] Test protection rules with dummy PR (merge + close)
- [ ] Document branching strategy in README

**Blockers**: None

---

#### Story 2: Docker Development Environment (Priority: P0)
**Story Points**: 8  
**Target Days**: Aug 25-27  
**Owner**: Infrastructure Lead

**Acceptance Criteria**:
1. Dockerfile created for backend service:
   - Multi-stage build (build stage + runtime stage)
   - JDK 17+ for backend
   - Node 18+ for frontend
   - Security best practices (non-root user, minimal attack surface)
2. docker-compose.yml created with services:
   - Backend container
   - PostgreSQL database container
   - Redis cache container (optional for Phase 1)
   - Nginx reverse proxy (optional)
3. Volume management:
   - Database data persists across container restarts
   - Code mounted as live volume for development
   - Environment files managed via .env
4. Environment configuration:
   - .env.example provided with all required vars
   - Local development defaults set
   - Database connection strings auto-configured

**Subtasks**:
- [ ] Create Dockerfile for backend service
- [ ] Create Dockerfile for frontend service (React/Vue)
- [ ] Create docker-compose.yml with all services
- [ ] Create .env.example with all required environment variables
- [ ] Document: "Docker Setup Guide" with step-by-step instructions
- [ ] Test: All developers can run `docker-compose up` and access http://localhost:3000

**Blockers**: None

---

#### Story 3: CI/CD Pipeline Implementation (Priority: P0)
**Story Points**: 8  
**Target Days**: Aug 26-28  
**Owner**: Infrastructure Lead

**Acceptance Criteria**:
1. GitHub Actions workflow file (`.github/workflows/ci.yml`) created with stages:
   - Trigger: On PR creation and push to main
   - Build stage: Compile code and create Docker image
   - Test stage: Run unit tests (coverage > 70%)
   - Lint stage: Run code quality checks
   - Security stage: Vulnerability scanning (Dependabot, Snyk)
2. Build artifacts stored and versioned:
   - Docker images tagged with commit SHA
   - Artifacts stored in GitHub Container Registry
3. Deployment readiness:
   - Status checks block PR merge until all pass
   - Automated deployment to staging on `main` push
   - Manual approval for production deployment
4. Pipeline monitoring:
   - Notifications on failure (Slack/email)
   - Build logs accessible to team
   - Pipeline execution time tracked

**Subtasks**:
- [ ] Create `.github/workflows/ci.yml` for GitHub Actions
- [ ] Configure build stage (Maven/Gradle for backend, npm for frontend)
- [ ] Configure test stage with coverage reporting
- [ ] Configure lint stage (SonarQube or similar)
- [ ] Configure security scanning
- [ ] Test pipeline with first PR from team member
- [ ] Document: "CI/CD Pipeline Guide" with troubleshooting

**Blockers**: None

---

#### Story 4: Development Environment Documentation (Priority: P1)
**Story Points**: 3  
**Target Days**: Aug 28-29  
**Owner**: Infrastructure Lead

**Acceptance Criteria**:
1. "Developer Setup Guide" document (SETUP.md) created with:
   - Prerequisites (Docker, Git, JDK, Node)
   - Step-by-step local setup (< 5 minutes)
   - Verification checklist
   - Troubleshooting section
2. Architecture documentation updated:
   - Environment architecture diagram
   - Service interaction diagram
   - Deployment topology diagram
3. Video or screenshots added to guide (optional)

**Subtasks**:
- [ ] Create SETUP.md with step-by-step instructions
- [ ] Create troubleshooting FAQ
- [ ] Create environment architecture diagram
- [ ] Test guide with 2 new team members (timing)

**Blockers**: Depends on Stories 1-3 completion

---

### CEL-7 Sprint Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Story Points Committed | 24 | 24 | ✓ |
| Story Points Completed | 24 | 0 | ⏳ |
| Build Time | < 10 min | TBD | ⏳ |
| Test Coverage | > 70% | TBD | ⏳ |
| Code Review SLA | < 4 hours | TBD | ⏳ |

---

## Stream 2: Database Configuration (CEL-8)

### Epic Owner: Database Architect/Backend Lead

### Sprint Backlog

#### Story 1: PostgreSQL Local Setup (Priority: P0)
**Story Points**: 3  
**Target Days**: Aug 24-25  
**Owner**: Database Lead

**Acceptance Criteria**:
1. PostgreSQL 14+ container runs in docker-compose (from CEL-7)
2. Database initializes with correct:
   - Locale (UTF-8)
   - Timezone (UTC)
   - Authentication method (md5 or scram-sha-256)
3. Connection parameters:
   - Host: localhost:5432
   - Database: tennis_cms_dev
   - User: dev_user
   - Password: dev_password (for local only)
4. Volume mount persists data across container restarts
5. Database logs accessible for debugging

**Subtasks**:
- [ ] Add PostgreSQL service to docker-compose.yml
- [ ] Create database initialization script (init.sql)
- [ ] Test connection from host machine using psql
- [ ] Verify data persistence

**Blockers**: Depends on CEL-7 docker-compose.yml

---

#### Story 2: Database Schema Implementation (Priority: P0)
**Story Points**: 8  
**Target Days**: Aug 25-27  
**Owner**: Database Lead + Backend Team

**Acceptance Criteria**:
1. All 15+ tables created from schema documentation:
   - Users & Authentication (5 tables)
   - Clubs & Facilities (4 tables)
   - Tournaments & Events (3 tables)
   - Matches & Results (4 tables)
   - Rankings & Leaderboards (2 tables)
   - Notifications & Messaging (3 tables)
   - Payments & Transactions (2 tables)
   - Audit Logging (1 table)
2. Foreign key relationships established:
   - Referential integrity enabled
   - CASCADE delete configured where appropriate
   - No orphaned records
3. Indexes created for performance:
   - Primary keys indexed
   - Foreign keys indexed
   - Search columns indexed (email, name, etc.)
   - Composite indexes for common queries
4. Sequences defined for ID generation:
   - Auto-increment sequences for all ID columns
   - Proper seed values

**Subtasks**:
- [ ] Create schema.sql with all table definitions
- [ ] Create indexes and constraints
- [ ] Create sequences for ID generation
- [ ] Run schema validation checks (no missing tables)
- [ ] Document schema ERD and relationships

**Blockers**: None

---

#### Story 3: Database Migration Framework (Priority: P0)
**Story Points**: 5  
**Target Days**: Aug 27-28  
**Owner**: Database Lead

**Acceptance Criteria**:
1. Migration tool selected and configured (Flyway or Liquibase):
   - Version control for schema changes
   - Forward migration support
   - Rollback support
   - Baseline support (capture current schema)
2. Migration structure:
   - Migrations stored in `db/migrations/` directory
   - Naming convention: `V001__initial_schema.sql`, `V002__add_users_table.sql`
   - Each migration is atomic (all-or-nothing)
3. Rollback procedures:
   - Undo scripts created for each migration
   - Tested rollback process
   - Documented rollback procedure
4. CI/CD integration:
   - Migrations run automatically on deployment
   - Blocked deployment if migration fails

**Subtasks**:
- [ ] Configure Flyway or Liquibase
- [ ] Create initial migration (V001) with current schema
- [ ] Create rollback procedures
- [ ] Test forward and rollback migrations
- [ ] Integrate with CI/CD pipeline

**Blockers**: Depends on Story 2 (schema creation)

---

#### Story 4: Connection Pooling & Performance Tuning (Priority: P1)
**Story Points**: 5  
**Target Days**: Aug 28-29  
**Owner**: Database Lead + Backend Team

**Acceptance Criteria**:
1. Connection pooling configured:
   - HikariCP (for Java) or equivalent
   - Pool size: 10-20 connections (configurable)
   - Idle timeout: 600 seconds
   - Max lifetime: 1800 seconds
2. Performance baseline established:
   - Query response times measured (target < 100ms for 90th percentile)
   - Connection pool performance tested
   - Load testing with 100+ concurrent users
3. Monitoring & alerting:
   - Slow query log enabled
   - Query performance metrics collected
   - Alerts configured for slow queries (> 1 second)

**Subtasks**:
- [ ] Configure HikariCP connection pool
- [ ] Run performance baseline tests
- [ ] Configure slow query logging
- [ ] Document connection pool configuration
- [ ] Create performance monitoring dashboard

**Blockers**: Depends on Stories 1-3

---

### CEL-8 Sprint Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Story Points Committed | 21 | 21 | ✓ |
| Story Points Completed | 21 | 0 | ⏳ |
| Schema Coverage | 100% (15+ tables) | 0% | ⏳ |
| Query Latency (p90) | < 100ms | TBD | ⏳ |
| Connection Pool Size | 10-20 | TBD | ⏳ |

---

## Parallel Execution Timeline

```
Aug 24 (Day 1)  [CEL-7: Story 1 Start] [CEL-8: Story 1 Start]
Aug 25 (Day 2)  [CEL-7: Story 1 Complete] [CEL-8: Story 1-2 Progress]
Aug 26 (Day 3)  [CEL-7: Story 2 Start] [CEL-8: Story 2 Complete]  ← Critical Gate
Aug 27 (Day 4)  [CEL-7: Story 2-3 Progress] [CEL-8: Story 3 Start]
Aug 28 (Day 5)  [CEL-7: Story 3 Complete] [CEL-8: Story 3-4 Progress]
Aug 29 (Day 6)  [CEL-7: Story 4] [CEL-8: Story 4 Complete]
Aug 30 (Day 7)  [CEL-7: Story 4 Complete] [CEL-8: Buffer/Polish]  ← Sprint Close
```

---

## Daily Standup Agenda

**Time**: 6:00 PM UTC  
**Duration**: 15 minutes  
**Participants**: Infrastructure Lead, Database Lead, Product Manager, CEO

### Template

1. **Yesterday's Blockers** (2 min)
   - What blockers did we face?
   - Have they been resolved? (Yes/No/In Progress)

2. **Today's Progress** (5 min)
   - CEL-7: Story status (done/in progress/blocked)
   - CEL-8: Story status (done/in progress/blocked)
   - Any new blockers emerged?

3. **Tomorrow's Plan** (3 min)
   - Next story target
   - Risk areas to watch
   - Escalation needs?

4. **Metrics & Health** (3 min)
   - Build time, test coverage, query latency
   - Any trends (positive/negative)?
   - On track for sprint completion?

---

## Sprint Gate Conditions

### Kickoff Gate (Aug 25 5 PM UTC)
**Condition**: Sprint formally started with all stories assigned

- [ ] Infrastructure Lead confirms CEL-7 sprint readiness
- [ ] Database Lead confirms CEL-8 sprint readiness
- [ ] Product Manager confirms sprint tracking enabled
- [ ] CEO confirms escalation authority and 2-hour SLA

**Outcome**: CEL-7 & CEL-8 move to `in_progress` status → **Unblocks CEL-4**

---

### Mid-Sprint Checkpoint (Aug 27 5 PM UTC)
**Condition**: 50% of sprint complete (CEL-7 Stories 1-2, CEL-8 Stories 1-2)

- [ ] CEL-7 Story 1 complete (GitHub setup)
- [ ] CEL-7 Story 2 in progress (Docker)
- [ ] CEL-8 Story 1 complete (PostgreSQL)
- [ ] CEL-8 Story 2 complete (Schema)

**Outcome**: If gate passed → Confirm CEL-4 unblock. If gate failed → Escalate blockers

---

### Sprint Close (Aug 30 5 PM UTC)
**Condition**: Sprint deliverables complete and verified

- [ ] CEL-7 all stories done (GitHub, Docker, CI/CD, Docs)
- [ ] CEL-8 all stories done (PostgreSQL, Schema, Migration, Tuning)
- [ ] First PR merged through CI/CD pipeline
- [ ] All developers have local environment running

**Outcome**: 
- ✅ Phase 1 Sprint COMPLETE → CEL-4 UNBLOCK
- ✅ CEL-4 kickoff scheduled for Sept 1
- ✅ Sprint retrospective scheduled for Aug 30 6 PM UTC

---

## Risk Management

### Risk 1: Docker Complexity
**Probability**: Medium | **Impact**: High  
**Mitigation**: 
- Pre-built Docker templates provided
- Infrastructure Lead trained on Docker best practices
- Fallback: Manual local setup guide if Docker fails

---

### Risk 2: Database Performance Issues
**Probability**: Low | **Impact**: High  
**Mitigation**:
- Load testing plan in place (Story 4)
- Query optimization review included
- Performance baseline established

---

### Risk 3: GitHub Actions Learning Curve
**Probability**: Medium | **Impact**: Medium  
**Mitigation**:
- CI/CD template provided from successful projects
- Documentation includes troubleshooting
- Slack integration for CI/CD alerts

---

### Risk 4: Team Capacity (Infrastructure Lead Availability)
**Probability**: Low | **Impact**: Critical  
**Mitigation**:
- Backup Infrastructure Lead identified
- Daily check-ins to catch availability issues early
- Escalation path: PM → CEO if bandwidth threatened

---

## Success Definitions

### CEL-7 Success
✅ Infrastructure Setup Complete when:
- GitHub fully configured with protection rules and CI/CD
- Docker environment runs locally without errors
- CI/CD pipeline executes on all PRs
- First PR merged successfully
- All developers can spin up environment in < 5 minutes

### CEL-8 Success
✅ Database Configuration Complete when:
- PostgreSQL running in Docker container
- All 15+ tables created with correct schema
- Migration framework operational (forward & rollback)
- Connection pooling configured and tuned
- Query latency < 100ms for 90th percentile

### Phase 1 Sprint Success
✅ Sprint Complete when:
- Both CEL-7 and CEL-8 in `done` status
- Development environment fully functional
- First feature branch code review underway
- CEL-4 unblocked and kickoff complete
- Team confidence: 9/10 for Phase 2 launch

---

## Documentation References

- [10_TEAM_ASSIGNMENT_MATRIX.md](./10_TEAM_ASSIGNMENT_MATRIX.md) - Role definitions
- [01_ARCHITECTURE_OVERVIEW.md](./01_ARCHITECTURE_OVERVIEW.md) - System design
- [04_DATABASE_SCHEMA.md](./04_DATABASE_SCHEMA.md) - Database design
- [05_DEV_ENVIRONMENT_SETUP.md](./05_DEV_ENVIRONMENT_SETUP.md) - Dev environment guide

---

## Approval & Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Manager | Tao Nguyen | [ ] | __ |
| Infrastructure Lead | [TBD] | [ ] | __ |
| Database Lead | [TBD] | [ ] | __ |
| CEO/Sponsor | [CEO Name] | [ ] | __ |

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Aug 24, 2026 | Initial Phase 1 Sprint Plan | Tao Nguyen (PM) |

---

**Status**: 🟢 Ready for Execution  
**Last Updated**: August 24, 2026 at 22:46 UTC  
**Next Review**: August 25, 2026 at 5 PM UTC (Kickoff Gate)
