# Celadon Tennis CMS - API Reference Documentation

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**API Version:** v1
**Base URL**: `https://api.celadontennis.com/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Common Response Formats](#common-response-formats)
3. [Error Handling](#error-handling)
4. [Authentication Endpoints](#authentication-endpoints)
5. [User Endpoints](#user-endpoints)
6. [Club Endpoints](#club-endpoints)
7. [Tournament Endpoints](#tournament-endpoints)
8. [Match Endpoints](#match-endpoints)
9. [Event Endpoints](#event-endpoints)
10. [Notification Endpoints](#notification-endpoints)
11. [Ranking Endpoints](#ranking-endpoints)

---

## Authentication

### JWT Token Format

All authenticated requests require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

JWT Token Structure:
```json
{
  "iss": "https://auth.celadontennis.com",
  "sub": "user_123",
  "aud": "celadon-api",
  "iat": 1629705600,
  "exp": 1629792000,
  "email": "user@example.com",
  "roles": ["player", "organizer"],
  "permissions": ["read:tournaments", "write:matches"]
}
```

### Token Lifetime

- **Access Token**: 1 hour
- **Refresh Token**: 30 days
- **Session Cookie**: 30 days (sliding window)

---

## Common Response Formats

### Success Response (2xx)

```json
{
  "status": "success",
  "code": 200,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2026-08-24T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Paginated Response

```json
{
  "status": "success",
  "code": 200,
  "data": [
    { "id": "1", "name": "Tournament 1" },
    { "id": "2", "name": "Tournament 2" }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false,
    "next_cursor": "cursor_abc123"
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "status": "error",
  "code": 400,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "INVALID_EMAIL"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-08-24T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Types

```
VALIDATION_ERROR
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
NOT_FOUND_ERROR
CONFLICT_ERROR
RATE_LIMIT_ERROR
INTERNAL_ERROR
SERVICE_UNAVAILABLE_ERROR
```

---

## Authentication Endpoints

### Register User

```
POST /auth/register
```

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+84901234567"
}
```

**Response (201 Created)**:
```json
{
  "status": "success",
  "code": 201,
  "data": {
    "user_id": "user_123",
    "email": "john@example.com",
    "verification_required": true,
    "verification_email_sent": true
  }
}
```

**Error Cases**:
- 400: Email already registered
- 422: Password doesn't meet complexity requirements

---

### Login

```
POST /auth/login
```

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "user_id": "user_123",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "refresh_token_xyz789",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

---

### Refresh Token

```
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token_xyz789"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
  }
}
```

---

### Logout

```
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## User Endpoints

### Get Current User Profile

```
GET /users/me
Authorization: Bearer <access_token>
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "user_id": "user_123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+84901234567",
    "profile_picture_url": "https://cdn.celadontennis.com/profiles/user_123.jpg",
    "skill_level": "intermediate",
    "preferred_court_surface": "hard_court",
    "bio": "Tennis enthusiast",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-08-24T10:30:00Z"
  }
}
```

---

### Update User Profile

```
PATCH /users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Johnny",
  "skill_level": "advanced",
  "bio": "Professional tennis coach"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "user_id": "user_123",
    "first_name": "Johnny",
    "last_name": "Doe",
    "email": "john@example.com",
    "skill_level": "advanced",
    "bio": "Professional tennis coach",
    "updated_at": "2026-08-24T11:30:00Z"
  }
}
```

---

## Club Endpoints

### List Clubs

```
GET /clubs?page=1&per_page=20&search=query&city=hanoi
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20, max: 100)
- `search` (string): Search by club name
- `city` (string): Filter by city
- `sort_by` (string): Sort field (name, created_at)
- `sort_order` (string): asc or desc

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": [
    {
      "club_id": "club_123",
      "name": "Hanoi Tennis Club",
      "city": "Hanoi",
      "address": "123 Tran Phu Street",
      "phone": "+84912345678",
      "website": "https://hanoitennis.com",
      "court_count": 8,
      "court_types": ["hard_court", "clay", "grass"],
      "avg_rating": 4.5,
      "total_ratings": 142,
      "verified": true,
      "created_at": "2026-01-01T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

---

### Get Club Details

```
GET /clubs/{club_id}
Authorization: Bearer <access_token>
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "club_id": "club_123",
    "name": "Hanoi Tennis Club",
    "city": "Hanoi",
    "address": "123 Tran Phu Street",
    "phone": "+84912345678",
    "website": "https://hanoitennis.com",
    "description": "Premier tennis facility in Hanoi",
    "court_count": 8,
    "court_types": ["hard_court", "clay", "grass"],
    "facilities": ["lounge", "restaurant", "pro_shop", "parking"],
    "operating_hours": {
      "monday_to_friday": "06:00-22:00",
      "saturday_sunday": "06:00-23:00"
    },
    "avg_rating": 4.5,
    "total_ratings": 142,
    "verified": true,
    "member_count": 350,
    "manager_id": "user_456",
    "created_at": "2026-01-01T10:30:00Z"
  }
}
```

---

## Tournament Endpoints

### Create Tournament

```
POST /tournaments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Summer Tournament 2026",
  "description": "Annual summer tournament",
  "start_date": "2026-09-01",
  "end_date": "2026-09-15",
  "location": "Hanoi",
  "club_id": "club_123",
  "tournament_type": "knockout",
  "format": "singles",
  "entry_fee": 250000,
  "max_participants": 32,
  "organizer_id": "user_456"
}
```

**Response (201 Created)**:
```json
{
  "status": "success",
  "code": 201,
  "data": {
    "tournament_id": "tournament_123",
    "name": "Summer Tournament 2026",
    "status": "draft",
    "start_date": "2026-09-01",
    "end_date": "2026-09-15",
    "entry_fee": 250000,
    "max_participants": 32,
    "current_participants": 0,
    "registration_open": false,
    "created_at": "2026-08-24T10:30:00Z"
  }
}
```

---

### List Tournaments

```
GET /tournaments?status=active&format=singles&page=1
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `status` (string): draft, active, completed
- `format` (string): singles, doubles, mixed
- `location` (string): Filter by location
- `page` (int): Pagination
- `per_page` (int): Items per page

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": [
    {
      "tournament_id": "tournament_123",
      "name": "Summer Tournament 2026",
      "status": "active",
      "start_date": "2026-09-01",
      "location": "Hanoi",
      "format": "singles",
      "current_participants": 28,
      "max_participants": 32,
      "entry_fee": 250000,
      "registered": true
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "per_page": 20
  }
}
```

---

### Register for Tournament

```
POST /tournaments/{tournament_id}/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_id": "user_123",
  "skill_level": "intermediate"
}
```

**Response (201 Created)**:
```json
{
  "status": "success",
  "code": 201,
  "data": {
    "registration_id": "reg_123",
    "tournament_id": "tournament_123",
    "user_id": "user_123",
    "status": "confirmed",
    "payment_status": "pending",
    "registered_at": "2026-08-24T10:30:00Z"
  }
}
```

---

## Match Endpoints

### Create Match

```
POST /matches
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tournament_id": "tournament_123",
  "player1_id": "user_123",
  "player2_id": "user_456",
  "scheduled_date": "2026-09-05",
  "scheduled_time": "14:00",
  "court_id": "court_456",
  "round": 1
}
```

**Response (201 Created)**:
```json
{
  "status": "success",
  "code": 201,
  "data": {
    "match_id": "match_123",
    "tournament_id": "tournament_123",
    "player1": {
      "user_id": "user_123",
      "name": "John Doe",
      "seed": 1
    },
    "player2": {
      "user_id": "user_456",
      "name": "Jane Smith",
      "seed": 2
    },
    "scheduled_date": "2026-09-05",
    "scheduled_time": "14:00",
    "status": "scheduled",
    "created_at": "2026-08-24T10:30:00Z"
  }
}
```

---

### Record Match Result

```
PATCH /matches/{match_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "completed",
  "winner_id": "user_123",
  "score": {
    "set1": { "player1": 6, "player2": 4 },
    "set2": { "player1": 7, "player2": 5 }
  },
  "actual_start_time": "2026-09-05T14:00:00Z",
  "actual_end_time": "2026-09-05T15:30:00Z"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "match_id": "match_123",
    "status": "completed",
    "winner_id": "user_123",
    "score": {
      "set1": { "player1": 6, "player2": 4 },
      "set2": { "player1": 7, "player2": 5 }
    },
    "completed_at": "2026-09-05T15:30:00Z"
  }
}
```

---

## Notification Endpoints

### Get User Notifications

```
GET /notifications?status=unread&limit=20
Authorization: Bearer <access_token>
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": [
    {
      "notification_id": "notif_123",
      "type": "match_scheduled",
      "title": "New Match Scheduled",
      "message": "Your match has been scheduled for Sep 5 at 2 PM",
      "status": "unread",
      "created_at": "2026-08-24T10:30:00Z",
      "read_at": null
    }
  ]
}
```

---

### Mark Notification as Read

```
PATCH /notifications/{notification_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "read"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "notification_id": "notif_123",
    "status": "read",
    "read_at": "2026-08-24T11:30:00Z"
  }
}
```

---

## Rate Limiting

All API endpoints are rate-limited as follows:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1629792000
```

**Limits**:
- Standard endpoint: 1000 requests per hour
- Authentication endpoint: 100 requests per hour
- Search endpoint: 500 requests per hour
- Upload endpoint: 50 requests per hour

---

## Webhooks

Subscribe to events via webhooks:

```
POST /webhooks/subscribe
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "event_type": "tournament.created",
  "webhook_url": "https://your-app.com/webhooks/tournaments",
  "secret": "webhook_secret_xyz"
}
```

**Webhook Events**:
- `tournament.created`
- `tournament.started`
- `tournament.completed`
- `match.scheduled`
- `match.completed`
- `user.registered`
- `payment.completed`

---

## API Client Libraries

Coming soon:
- JavaScript/TypeScript SDK
- Python SDK
- Swift SDK
- Kotlin SDK

---

**For more information**, visit the interactive API documentation at: `https://api.celadontennis.com/docs`

**Contact**: API Support (api-support@celadontennis.com)
