# Celadon Tennis CMS - Database Schema Documentation

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Database**: PostgreSQL 14+

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Users & Authentication](#users--authentication)
3. [Clubs & Facilities](#clubs--facilities)
4. [Tournaments & Events](#tournaments--events)
5. [Matches & Results](#matches--results)
6. [Rankings & Statistics](#rankings--statistics)
7. [Notifications & Messaging](#notifications--messaging)
8. [Payment & Transactions](#payment--transactions)
9. [Audit & Compliance](#audit--compliance)
10. [Entity Relationship Diagram](#entity-relationship-diagram)
11. [Indexes and Performance](#indexes-and-performance)
12. [Migration Scripts](#migration-scripts)

---

## Database Overview

### Connection Details

```yaml
Database Name: celadon
Host: celadon-db.xyz.rds.amazonaws.com
Port: 5432
Username: celadon_app
Max Connections: 100
Connection Timeout: 30 seconds
```

### Database Statistics

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('celadon')) AS size;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Naming Conventions

- **Tables**: snake_case (plural)
  - Example: `users`, `tournaments`, `match_results`
- **Columns**: snake_case
  - Example: `user_id`, `first_name`, `created_at`
- **Indexes**: `idx_<table>_<column>`
  - Example: `idx_users_email`, `idx_tournaments_status`
- **Foreign Keys**: `fk_<table1>_<table2>`
  - Example: `fk_tournaments_clubs`

---

## Users & Authentication

### users Table

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  profile_picture_url TEXT,
  bio TEXT,
  skill_level VARCHAR(50), -- beginner, intermediate, advanced, professional
  preferred_court_surface VARCHAR(50), -- hard_court, clay, grass
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

### user_sessions Table

```sql
CREATE TABLE user_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  access_token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50), -- web, ios, android
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

### user_roles Table

```sql
CREATE TABLE user_roles (
  user_role_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  role VARCHAR(50) NOT NULL, -- player, organizer, club_manager, admin
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES users(user_id),
  revoked_at TIMESTAMP,
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

---

## Clubs & Facilities

### clubs Table

```sql
CREATE TABLE clubs (
  club_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  logo_url TEXT,
  cover_image_url TEXT,
  court_count INTEGER,
  established_year INTEGER,
  manager_id UUID REFERENCES users(user_id),
  verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50), -- pending, verified, rejected
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
  avg_rating DECIMAL(3, 2),
  total_ratings INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_clubs_city ON clubs(city);
CREATE INDEX idx_clubs_status ON clubs(status);
CREATE INDEX idx_clubs_manager_id ON clubs(manager_id);
CREATE INDEX idx_clubs_verified ON clubs(verified);
CREATE INDEX idx_clubs_location ON clubs(latitude, longitude);
```

### courts Table

```sql
CREATE TABLE courts (
  court_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(club_id),
  court_number INTEGER NOT NULL,
  name VARCHAR(100),
  surface_type VARCHAR(50), -- hard_court, clay, grass, synthetic
  length_meters DECIMAL(5, 2),
  width_meters DECIMAL(5, 2),
  lighting BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'available', -- available, maintenance, retired
  capacity INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(club_id, court_number)
);

CREATE INDEX idx_courts_club_id ON courts(club_id);
CREATE INDEX idx_courts_surface_type ON courts(surface_type);
```

### club_memberships Table

```sql
CREATE TABLE club_memberships (
  membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(club_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  membership_type VARCHAR(50), -- bronze, silver, gold, platinum
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, cancelled
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  cancellation_reason VARCHAR(255),
  cancelled_at TIMESTAMP,
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX idx_club_memberships_status ON club_memberships(status);
```

---

## Tournaments & Events

### tournaments Table

```sql
CREATE TABLE tournaments (
  tournament_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tournament_type VARCHAR(50) NOT NULL, -- knockout, round_robin, swiss, league
  format VARCHAR(50) NOT NULL, -- singles, doubles, mixed
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed, cancelled
  club_id UUID REFERENCES clubs(club_id),
  organizer_id UUID NOT NULL REFERENCES users(user_id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_open_date DATE,
  registration_close_date DATE,
  location VARCHAR(255),
  city VARCHAR(100),
  entry_fee DECIMAL(10, 2),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  min_skill_level VARCHAR(50),
  max_skill_level VARCHAR(50),
  total_prize_pool DECIMAL(12, 2),
  rules TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_club_id ON tournaments(club_id);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_city ON tournaments(city);
```

### tournament_registrations Table

```sql
CREATE TABLE tournament_registrations (
  registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(tournament_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  partner_id UUID REFERENCES users(user_id), -- For doubles/mixed tournaments
  seed INTEGER,
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, waitlisted, cancelled, rejected
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, refunded
  amount_paid DECIMAL(10, 2),
  skill_level_at_registration VARCHAR(50),
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX idx_tournament_registrations_status ON tournament_registrations(status);
```

---

## Matches & Results

### matches Table

```sql
CREATE TABLE matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(tournament_id),
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
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  winner_id UUID REFERENCES users(user_id),
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_player1_id ON matches(player1_id);
CREATE INDEX idx_matches_player2_id ON matches(player2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_date ON matches(scheduled_date);
```

### match_results Table

```sql
CREATE TABLE match_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(match_id),
  set1_p1_score INTEGER,
  set1_p2_score INTEGER,
  set2_p1_score INTEGER,
  set2_p2_score INTEGER,
  set3_p1_score INTEGER,
  set3_p2_score INTEGER,
  tiebreak1 BOOLEAN,
  tiebreak2 BOOLEAN,
  tiebreak3 BOOLEAN,
  match_notes TEXT,
  recorded_by UUID REFERENCES users(user_id),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(user_id),
  verified_at TIMESTAMP
);

CREATE INDEX idx_match_results_match_id ON match_results(match_id);
CREATE INDEX idx_match_results_recorded_at ON match_results(recorded_at);
```

---

## Rankings & Statistics

### user_statistics Table

```sql
CREATE TABLE user_statistics (
  user_id UUID PRIMARY KEY REFERENCES users(user_id),
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  total_tournaments_entered INTEGER DEFAULT 0,
  tournament_wins INTEGER DEFAULT 0,
  current_skill_rating INTEGER DEFAULT 1500,
  peak_skill_rating INTEGER DEFAULT 1500,
  avg_match_duration_minutes DECIMAL(6, 2),
  favorite_court_surface VARCHAR(50),
  last_match_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100)
);

CREATE INDEX idx_user_statistics_current_skill_rating ON user_statistics(current_skill_rating DESC);
```

### rankings Table

```sql
CREATE TABLE rankings (
  ranking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(tournament_id),
  rank INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id),
  skill_level VARCHAR(50),
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tournament_id, rank)
);

CREATE INDEX idx_rankings_tournament_id ON rankings(tournament_id);
CREATE INDEX idx_rankings_rank ON rankings(rank);
```

---

## Notifications & Messaging

### notifications Table

```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  type VARCHAR(50) NOT NULL, -- match_scheduled, tournament_created, result_recorded, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_resource_type VARCHAR(50), -- tournament, match, event
  related_resource_id UUID,
  status VARCHAR(50) DEFAULT 'unread', -- unread, read, archived
  priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  archived_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### notification_preferences Table

```sql
CREATE TABLE notification_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id),
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  match_scheduled_email BOOLEAN DEFAULT TRUE,
  tournament_updates_email BOOLEAN DEFAULT TRUE,
  results_notifications BOOLEAN DEFAULT TRUE,
  news_and_promotions BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Payment & Transactions

### transactions Table

```sql
CREATE TABLE transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  tournament_registration_id UUID REFERENCES tournament_registrations(registration_id),
  event_id UUID REFERENCES events(event_id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  payment_method VARCHAR(50), -- credit_card, bank_transfer, e_wallet
  payment_provider VARCHAR(50), -- stripe, paypal, local_provider
  transaction_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  external_transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_reason VARCHAR(255)
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(transaction_status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

---

## Audit & Compliance

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(50) NOT NULL, -- create, read, update, delete
  resource_type VARCHAR(100) NOT NULL, -- users, tournaments, matches
  resource_id VARCHAR(255) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50), -- success, failure
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## Entity Relationship Diagram

```
users (1) ---< (N) user_sessions
users (1) ---< (N) user_roles
users (1) ---< (N) clubs (manager)
users (1) ---< (N) club_memberships
users (1) ---< (N) tournaments (organizer)
users (1) ---< (N) tournament_registrations
users (1) ---< (N) matches (player1/player2)
users (1) ---< (N) match_results (recorder)
users (1) ---< (N) transactions
users (1) ---< (N) audit_logs

clubs (1) ---< (N) courts
clubs (1) ---< (N) club_memberships
clubs (1) ---< (N) tournaments

tournaments (1) ---< (N) tournament_registrations
tournaments (1) ---< (N) matches
tournaments (1) ---< (N) rankings

matches (1) ---< (1) match_results
matches (N) --> (1) courts
```

---

## Indexes and Performance

### High-Frequency Query Patterns

```sql
-- Get active users
SELECT * FROM users WHERE status = 'active' AND deleted_at IS NULL;
-- Use index: idx_users_status, idx_users_deleted_at

-- Get user's tournaments
SELECT * FROM tournaments 
WHERE organizer_id = ? AND status = 'active'
ORDER BY start_date DESC;
-- Use index: idx_tournaments_organizer_id, idx_tournaments_status

-- Get upcoming matches
SELECT * FROM matches
WHERE scheduled_date >= CURRENT_DATE
AND status IN ('scheduled', 'live')
ORDER BY scheduled_date;
-- Use index: idx_matches_scheduled_date, idx_matches_status

-- Search clubs by location
SELECT * FROM clubs
WHERE city = ? AND status = 'active'
AND verified = TRUE
ORDER BY avg_rating DESC;
-- Use index: idx_clubs_city, idx_clubs_verified, idx_clubs_status
```

### Vacuum and Analysis Schedule

```sql
-- Daily vacuum and analyze (recommended)
VACUUM ANALYZE users;
VACUUM ANALYZE tournaments;
VACUUM ANALYZE matches;
VACUUM ANALYZE transactions;

-- Weekly full database vacuum
VACUUM FULL ANALYZE;
```

---

## Migration Scripts

### Running Migrations

```bash
# Using Liquibase
liquibase update --changeLogFile=db/changelog/db.changelog-master.yaml

# Using Flyway
flyway migrate -locations=filesystem:db/migrations

# Using direct SQL
psql -h $PGHOST -U $PGUSER -d celadon -f db/migrations/001_initial_schema.sql
```

---

**Contact**: Backend & Infrastructure Lead
**Last Audit**: August 24, 2026
