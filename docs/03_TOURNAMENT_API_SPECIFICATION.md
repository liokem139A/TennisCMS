# Tournament Management APIs - Specification

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Status:** Implementation Phase - CEL-11  
**Owner:** Backend & Infrastructure Lead

---

## Overview

This document specifies the Tournament Management APIs for CRUD operations with status management and organizer authorization. These APIs provide comprehensive tournament lifecycle management including creation, configuration, status tracking, and access control.

---

## API Endpoints

### 1. Create Tournament

**Endpoint**: `POST /api/v1/tournaments`

**Authorization**: `Requires JWT token with role: organizer`

**Request Body**:
```json
{
  "name": "Summer Championship 2026",
  "description": "Annual summer tournament",
  "format": "single_elimination|double_elimination|round_robin",
  "maxParticipants": 32,
  "startDate": "2026-09-01T09:00:00Z",
  "endDate": "2026-09-05T18:00:00Z",
  "location": "Tennis Club Name",
  "surface": "hard|clay|grass",
  "skillLevel": "beginner|intermediate|advanced|professional",
  "entryFee": 50.00,
  "currency": "USD",
  "status": "draft",
  "organizerId": "user-uuid",
  "clubId": "club-uuid",
  "metadata": {
    "sponsorId": "sponsor-uuid",
    "prizePool": 5000.00
  }
}
```

**Response** (201 Created):
```json
{
  "id": "tournament-uuid",
  "name": "Summer Championship 2026",
  "format": "single_elimination",
  "maxParticipants": 32,
  "currentParticipants": 0,
  "startDate": "2026-09-01T09:00:00Z",
  "endDate": "2026-09-05T18:00:00Z",
  "location": "Tennis Club Name",
  "surface": "hard",
  "skillLevel": "advanced",
  "entryFee": 50.00,
  "currency": "USD",
  "status": "draft",
  "organizerId": "user-uuid",
  "clubId": "club-uuid",
  "createdAt": "2026-08-24T15:45:00Z",
  "updatedAt": "2026-08-24T15:45:00Z",
  "metadata": {
    "sponsorId": "sponsor-uuid",
    "prizePool": 5000.00
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input parameters
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not authorized as organizer
- `409 Conflict`: Tournament with same name already exists

---

### 2. Get Tournament by ID

**Endpoint**: `GET /api/v1/tournaments/:tournamentId`

**Authorization**: `Public (any user)`

**Response** (200 OK):
```json
{
  "id": "tournament-uuid",
  "name": "Summer Championship 2026",
  "format": "single_elimination",
  "maxParticipants": 32,
  "currentParticipants": 15,
  "startDate": "2026-09-01T09:00:00Z",
  "endDate": "2026-09-05T18:00:00Z",
  "location": "Tennis Club Name",
  "surface": "hard",
  "skillLevel": "advanced",
  "entryFee": 50.00,
  "currency": "USD",
  "status": "published",
  "organizerId": "user-uuid",
  "clubId": "club-uuid",
  "createdAt": "2026-08-24T15:45:00Z",
  "updatedAt": "2026-08-24T15:45:00Z",
  "participants": [
    {
      "userId": "user-uuid",
      "status": "confirmed",
      "joinedAt": "2026-08-25T10:00:00Z"
    }
  ],
  "matches": [
    {
      "id": "match-uuid",
      "status": "scheduled",
      "round": 1
    }
  ],
  "metadata": {
    "sponsorId": "sponsor-uuid",
    "prizePool": 5000.00
  }
}
```

**Error Responses**:
- `404 Not Found`: Tournament does not exist

---

### 3. Update Tournament

**Endpoint**: `PATCH /api/v1/tournaments/:tournamentId`

**Authorization**: `Requires JWT token with role: organizer AND ownership of tournament OR admin`

**Request Body** (partial updates):
```json
{
  "name": "Summer Championship 2026 - Updated",
  "description": "Updated description",
  "maxParticipants": 64,
  "startDate": "2026-09-02T09:00:00Z",
  "endDate": "2026-09-06T18:00:00Z",
  "location": "New Location",
  "entryFee": 75.00,
  "status": "published",
  "metadata": {
    "sponsorId": "new-sponsor-uuid",
    "prizePool": 7500.00
  }
}
```

**Constraints by Status**:
- `draft`: Can modify all fields
- `published`: Can only modify description, entryFee, metadata
- `active`: Can only modify metadata, cannot modify core fields
- `completed`: No modifications allowed

**Response** (200 OK): Updated tournament object

**Error Responses**:
- `400 Bad Request`: Invalid input parameters
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not authorized to update tournament
- `404 Not Found`: Tournament does not exist
- `409 Conflict`: Update violates business rules

---

### 4. Delete Tournament

**Endpoint**: `DELETE /api/v1/tournaments/:tournamentId`

**Authorization**: `Requires JWT token with role: organizer AND ownership of tournament OR admin`

**Constraints**:
- Only `draft` or `published` tournaments can be deleted
- `active` or `completed` tournaments cannot be deleted

**Response** (204 No Content)

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not authorized to delete tournament
- `404 Not Found`: Tournament does not exist
- `409 Conflict`: Tournament cannot be deleted due to status

---

### 5. List Tournaments

**Endpoint**: `GET /api/v1/tournaments`

**Authorization**: `Public (any user)`

**Query Parameters**:
- `status`: Filter by status (draft, published, active, completed, cancelled)
- `organizerId`: Filter by organizer
- `clubId`: Filter by club
- `skillLevel`: Filter by skill level
- `startDate_gte`: Filter by start date (greater than or equal)
- `startDate_lte`: Filter by start date (less than or equal)
- `page`: Pagination page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `sortBy`: Sort field (name, startDate, createdAt)
- `sortOrder`: Sort order (asc, desc)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "tournament-uuid",
      "name": "Summer Championship 2026",
      "status": "published",
      "startDate": "2026-09-01T09:00:00Z",
      "maxParticipants": 32,
      "currentParticipants": 15,
      "skillLevel": "advanced",
      "createdAt": "2026-08-24T15:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 6. Update Tournament Status

**Endpoint**: `POST /api/v1/tournaments/:tournamentId/status`

**Authorization**: `Requires JWT token with role: organizer AND ownership OR admin`

**Request Body**:
```json
{
  "status": "published|active|completed|cancelled"
}
```

**Status Transition Rules**:
```
draft → published (requires min 2 participants registered)
published → active (requires tournament start time reached)
active → completed (when tournament end time reached)
ANY → cancelled (requires organizer authorization)
```

**Response** (200 OK): Updated tournament object with new status

**Error Responses**:
- `400 Bad Request`: Invalid status transition
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not authorized
- `404 Not Found`: Tournament does not exist
- `409 Conflict`: Cannot transition to status due to business rules

---

## Database Schema

### tournaments table
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format VARCHAR(50) NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  surface VARCHAR(50),
  skill_level VARCHAR(50),
  entry_fee DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft',
  organizer_id UUID NOT NULL REFERENCES users(id),
  club_id UUID REFERENCES clubs(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
  CONSTRAINT valid_format CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_participants CHECK (max_participants > 0),
  CONSTRAINT valid_entry_fee CHECK (entry_fee >= 0)
);

CREATE INDEX idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_club_id ON tournaments(club_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_created_at ON tournaments(created_at);
CREATE INDEX idx_tournaments_deleted_at ON tournaments(deleted_at) WHERE deleted_at IS NULL;
```

### tournament_participants table
```sql
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  seed_position INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tournament_id, user_id),
  CONSTRAINT valid_participant_status CHECK (status IN ('pending', 'confirmed', 'withdrawn', 'disqualified'))
);

CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(status);
```

### tournament_organizers table (for extended permissions)
```sql
CREATE TABLE tournament_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'organizer',
  permissions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tournament_id, user_id),
  CONSTRAINT valid_organizer_role CHECK (role IN ('organizer', 'admin', 'referee'))
);

CREATE INDEX idx_tournament_organizers_tournament_id ON tournament_organizers(tournament_id);
CREATE INDEX idx_tournament_organizers_user_id ON tournament_organizers(user_id);
```

---

## Authorization Model

### Resource-Level Access Control

**Get Tournament** (Public endpoint):
- Any authenticated or unauthenticated user can view published tournaments
- Draft tournaments only visible to organizer or admin

**Create Tournament**:
- `Requires: role:organizer`
- User must be verified organizer

**Update Tournament**:
- `organizer_id == user_id` OR `role:admin`
- Status-specific constraints apply

**Delete Tournament**:
- `organizer_id == user_id` OR `role:admin`
- Only draft/published tournaments can be deleted

**Update Status**:
- `organizer_id == user_id` OR `role:admin`
- Must follow valid status transitions

---

## Data Validation Rules

### Tournament Creation
1. Name: Required, 3-255 characters, unique per organizer
2. Format: Required, valid format type
3. MaxParticipants: Required, integer > 0
4. StartDate: Required, ISO8601 format, future date
5. EndDate: Required, after startDate
6. SkillLevel: Required, valid skill level
7. EntryFee: Optional, >= 0
8. OrganizerId: Required, valid user UUID

### Tournament Update
1. All same validations as creation
2. Status-specific constraints apply
3. Cannot modify core fields if status != draft

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "TOURNAMENT_NOT_FOUND",
    "message": "Tournament with ID xxx does not exist",
    "status": 404,
    "timestamp": "2026-08-24T15:45:00Z",
    "details": {}
  }
}
```

### Error Codes
- `TOURNAMENT_NOT_FOUND`: 404
- `UNAUTHORIZED`: 401
- `FORBIDDEN`: 403
- `INVALID_INPUT`: 400
- `TOURNAMENT_ALREADY_EXISTS`: 409
- `INVALID_STATUS_TRANSITION`: 409
- `TOURNAMENT_LOCKED`: 409

---

## Response Headers

All responses include:
- `X-Request-ID`: Unique request identifier for tracing
- `X-RateLimit-Limit`: Rate limit quota
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Rate limit reset time
- `Content-Type`: application/json
- `Cache-Control`: Vary by endpoint (public tournaments: cache for 5 min)

---

## Testing Requirements

### Unit Tests
- Data validation for all fields
- Status transition logic
- Authorization checks
- Error handling

### Integration Tests
- Full CRUD workflow
- Database constraints
- Multi-user concurrent access
- Status transitions with timing

### End-to-End Tests
- Complete tournament lifecycle
- Authorization scenarios
- Error recovery

---

## Performance Targets

- Create Tournament: < 200ms
- Get Tournament: < 100ms
- List Tournaments: < 500ms (for 50 tournaments)
- Update Tournament: < 200ms
- Delete Tournament: < 200ms
- Database queries: < 50ms

---

## Security Considerations

1. **SQL Injection**: Use parameterized queries
2. **Authorization**: JWT token validation on all write operations
3. **Rate Limiting**: 100 requests per minute per user
4. **Input Validation**: Strict validation on all inputs
5. **Audit Logging**: Log all state changes
6. **Data Privacy**: No PII exposure in responses

---

## Next Steps

1. Implement TypeScript data models and interfaces
2. Create Express.js route handlers
3. Implement database queries and transaction handling
4. Add comprehensive error handling middleware
5. Write unit and integration tests
6. Create API documentation with Swagger/OpenAPI

---

**Owner**: Backend & Infrastructure Lead  
**Status**: Ready for Implementation  
**Last Reviewed**: August 24, 2026
