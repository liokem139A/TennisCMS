# Database Migrations & Configuration

## Overview

This directory contains all database migrations for the Celadon Tennis Digital Platform. Migrations are organized in numbered order for sequential, safe execution.

## Migration Files

### Execution Order (Sequential)

| # | File | Tables | Purpose | Size |
|---|------|--------|---------|------|
| 0 | `000_create_extensions.sql` | Extensions | PostgreSQL extensions | 20 lines |
| 1 | `001_create_tournaments_tables.sql` | 4 tables | Tournament management (CEL-11) | 137 lines |
| 2 | `002_create_users_tables.sql` | 5 tables | User authentication | 180 lines |
| 3 | `003_create_clubs_tables.sql` | 5 tables | Club & facility management | 270 lines |
| 4 | `004_create_tournaments_extended_tables.sql` | 5 tables | Matches & events | 260 lines |
| 5 | `005_create_rankings_and_statistics_tables.sql` | 5 tables | Rankings & statistics | 200 lines |
| 6 | `006_create_notifications_messaging_tables.sql` | 7 tables | Communication | 320 lines |
| 7 | `007_create_payment_and_audit_tables.sql` | 6 tables | Payments & compliance | 290 lines |
| 8 | `008_create_ambassador_and_additional_tables.sql` | 9 tables | Ambassador program | 350 lines |

**Total:** 50+ tables, 150+ indexes, 30+ triggers

## Running Migrations

### Prerequisites

```bash
# Install PostgreSQL client tools
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Local Development

#### Option 1: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL service
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker-compose exec postgres pg_isready -U postgres

# Run migrations using the script
bash scripts/run-migrations.sh development
```

#### Option 2: Using Direct psql

```bash
# Set environment variables
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGDATABASE=tennis_cms

# Or provide connection string
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tennis_cms"

# Run migrations
bash scripts/run-migrations.sh development
```

#### Option 3: Manual Step-by-Step

```bash
# Connect to database
psql -h localhost -U postgres -d tennis_cms

# Run migrations one at a time
\i db/migrations/000_create_extensions.sql
\i db/migrations/001_create_tournaments_tables.sql
\i db/migrations/002_create_users_tables.sql
# ... continue with remaining migrations
```

### Production Deployment

```bash
# Set production database connection
export DATABASE_URL="postgresql://celadon_app:PASSWORD@rds-endpoint:5432/celadon"

# Run migrations with confirmation
bash scripts/run-migrations.sh production

# Verify schema
psql $DATABASE_URL -c "\dt"  # List all tables
psql $DATABASE_URL -c "\di"  # List all indexes
```

## Migration Details

### 000 - PostgreSQL Extensions
**Status:** ✅ Required before all other migrations

Enables required PostgreSQL extensions:
- `uuid-ossp` - UUID generation functions
- `citext` - Case-insensitive text type
- `pgcrypto` - Cryptographic functions

### 001 - Tournament Tables
**Status:** ✅ From CEL-11, Required for CEL-4

Creates core tournament management tables:
- `tournaments` - Main tournament entity
- `tournament_participants` - Participant tracking
- `tournament_organizers` - Extended permissions
- `tournament_audit_log` - Change tracking

**Dependencies:** None (self-contained)

### 002 - User Tables
**Status:** ✅ Core Authentication

Creates user management and authentication:
- `users` - User accounts
- `user_sessions` - JWT session tracking
- `user_roles` - Role-based access control
- `password_reset_tokens` - Account recovery
- `email_verification_tokens` - Email verification

**Dependencies:** 000_create_extensions.sql

### 003 - Club Tables
**Status:** ✅ Club Management

Creates club and facility management:
- `clubs` - Club information and location
- `courts` - Individual court details
- `club_memberships` - Membership tracking
- `club_ratings` - User reviews
- `court_availability` - Scheduling availability

**Dependencies:** 002_create_users_tables.sql

### 004 - Tournament Extended Tables
**Status:** ✅ Match Management

Extends tournament with match tracking:
- `events` - Scheduled events
- `matches` - Match scheduling
- `match_results` - Set scores and results
- `match_penalties` - Infractions
- `match_statistics` - Performance metrics

**Dependencies:** 001_create_tournaments_tables.sql, 002_create_users_tables.sql

### 005 - Rankings Tables
**Status:** ✅ Player Performance Tracking

Creates ranking and statistics tables:
- `user_statistics` - Career statistics
- `rankings` - Tournament rankings
- `global_rankings` - Overall player rankings
- `player_head_to_head` - Matchup records
- `achievement_badges` - Accomplishments

**Dependencies:** 002_create_users_tables.sql, 004_create_tournaments_extended_tables.sql

### 006 - Notifications & Messaging
**Status:** ✅ User Communication

Creates notification and messaging:
- `notifications` - User notifications
- `notification_preferences` - User settings
- `messages` - Direct messaging
- `message_attachments` - File sharing
- `channels` - Group messaging
- `channel_members` - Group membership
- `channel_messages` - Group messages

**Dependencies:** 002_create_users_tables.sql, 001_create_tournaments_tables.sql, 003_create_clubs_tables.sql

### 007 - Payment & Audit Tables
**Status:** ✅ Payment Processing & Compliance

Creates payment and audit tracking:
- `payments` - Payment records
- `transactions` - Transaction tracking
- `invoices` - Invoice management
- `refunds` - Refund processing
- `audit_logs` - Complete audit trail
- `security_events` - Security logging

**Dependencies:** 002_create_users_tables.sql, 001_create_tournaments_tables.sql, 004_create_tournaments_extended_tables.sql

### 008 - Ambassador & Additional Tables
**Status:** ✅ Ambassador Program & Social Features

Creates ambassador and additional features:
- `ambassadors` - Ambassador accounts
- `ambassador_recruits` - Referral tracking
- `ambassador_rewards` - Commission/rewards
- `sponsor_partnerships` - Sponsor partnerships
- `sponsor_offers` - Promotional offers
- `user_preferences` - User settings
- `user_followers` - Social following
- `user_photos` - Photo galleries
- `api_keys` - API access

**Dependencies:** 002_create_users_tables.sql, 003_create_clubs_tables.sql

## Schema Highlights

### Design Principles

1. **Security:**
   - Soft deletes using `deleted_at` column
   - Comprehensive audit logging
   - Data encryption support (JSONB for sensitive data)
   - Role-based access control via `user_roles`

2. **Performance:**
   - Strategic indexing on:
     - Foreign keys (for JOINs)
     - Frequently filtered columns (status, created_at)
     - Sorting columns (created_at DESC, rating DESC)
   - Partial indexes for soft-deletes
   - Composite indexes for complex queries

3. **Data Integrity:**
   - CHECK constraints for valid values
   - UNIQUE constraints for natural keys
   - Referential integrity via Foreign Keys
   - Triggers for automatic timestamp updates

4. **Auditability:**
   - `created_at` and `updated_at` on all entities
   - Dedicated `audit_logs` table for tracking changes
   - `security_events` table for security incidents
   - JSONB columns (`old_values`, `new_values`) for detailed changes

### Naming Conventions

```sql
-- Tables: plural, snake_case
users, tournaments, match_results

-- Columns: singular, snake_case
user_id, tournament_id, created_at

-- Primary Keys: {table}_id
user_id, tournament_id

-- Foreign Keys: fk_{table1}_{table2}
REFERENCES users(user_id)

-- Indexes: idx_{table}_{column(s)}
idx_users_email
idx_tournaments_organizer_id
idx_matches_scheduled_date

-- Functions: verb_noun_action
update_tournament_timestamp()
calculate_user_statistics()

-- Triggers: trigger_{action}_{table}_{verb}
trigger_update_tournaments_timestamp
trigger_update_club_stats_on_rating
```

## Common Operations

### Viewing Schema

```sql
-- List all tables
\dt

-- List table structure
\d users

-- List indexes
\di

-- List triggers
\dy

-- List functions
\df

-- Get table size
SELECT pg_size_pretty(pg_total_relation_size('users'));
```

### Data Integrity Checks

```sql
-- Check for orphaned records (no FK reference)
SELECT * FROM tournaments WHERE organizer_id NOT IN (SELECT user_id FROM users);

-- Check for NULL values in NOT NULL columns
SELECT * FROM users WHERE email IS NULL;

-- Check constraint violations
SELECT * FROM user_statistics WHERE win_rate > 100 OR win_rate < 0;

-- Find unused indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND idx_scan = 0;
```

### Performance Optimization

```sql
-- Analyze database statistics
ANALYZE;

-- Reindex specific table
REINDEX TABLE users;

-- Reindex specific index
REINDEX INDEX idx_users_email;

-- Vacuum to reclaim space
VACUUM ANALYZE users;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Disaster Recovery

### Backup & Restore

```bash
# Full database backup
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
psql -h $PGHOST -U $PGUSER -d $PGDATABASE < backup_20260825.sql

# Restore from compressed backup
gunzip -c backup_20260825.sql.gz | psql -h $PGHOST -U $PGUSER -d $PGDATABASE
```

### Point-in-Time Recovery (PITR)

```bash
# List available backups
aws rds describe-db-snapshots --db-instance-identifier tennis-cms-db

# Restore to specific point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier tennis-cms-db \
  --target-db-instance-identifier tennis-cms-db-recovered \
  --restore-time 2026-08-25T14:30:00Z
```

## Troubleshooting

### Common Issues

**Error: "permission denied for schema public"**
```bash
# Grant schema permissions
psql -U postgres -d tennis_cms -c "GRANT ALL ON SCHEMA public TO celadon_app;"
```

**Error: "duplicate key value violates unique constraint"**
```bash
# Check for duplicate data
SELECT column_name, COUNT(*) 
FROM table_name 
GROUP BY column_name 
HAVING COUNT(*) > 1;
```

**Error: "cannot drop table with pending trigger"**
```bash
-- Drop triggers first
DROP TRIGGER trigger_name ON table_name;
-- Then drop table
DROP TABLE table_name;
```

**Slow queries**
```bash
# Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000;  -- log queries > 1s

# Check query plan
EXPLAIN ANALYZE SELECT * FROM users WHERE status = 'active';
```

## Files & Structure

```
db/
├── migrations/
│   ├── 000_create_extensions.sql
│   ├── 001_create_tournaments_tables.sql
│   ├── 002_create_users_tables.sql
│   ├── 003_create_clubs_tables.sql
│   ├── 004_create_tournaments_extended_tables.sql
│   ├── 005_create_rankings_and_statistics_tables.sql
│   ├── 006_create_notifications_messaging_tables.sql
│   ├── 007_create_payment_and_audit_tables.sql
│   └── 008_create_ambassador_and_additional_tables.sql
└── README.md (this file)

scripts/
└── run-migrations.sh
```

## Related Documentation

- `/docs/04_DATABASE_SCHEMA.md` - Comprehensive schema documentation
- `/INFRASTRUCTURE_SETUP.md` - Infrastructure setup guide
- `/CEL-8_DATABASE_INFRASTRUCTURE_SETUP.md` - This implementation summary
- `/terraform/` - AWS infrastructure as code

---

**Version:** 1.0  
**Last Updated:** 2026-08-25  
**Maintenance:** Backend & Infrastructure Lead
