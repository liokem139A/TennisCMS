# Celadon Ambassador Portal

A comprehensive web application for managing the Celadon Tennis ambassador program, enabling ambassadors to manage profiles, view performance metrics, manage events, and participate in the community.

## Overview

- **Purpose**: Centralized platform for ambassador program management
- **Timeline**: MVP launch Sept 6, 2026; Full feature set Sept 11, 2026
- **Status**: Phase 1 - Core infrastructure initialization (Aug 24-28)
- **Owner**: Engineering Lead + Product Manager

## Technology Stack

- **Frontend**: Next.js 14 (React 18)
- **Backend**: Next.js API routes
- **Authentication**: JWT (jsonwebtoken)
- **Database**: AWS DynamoDB
- **Infrastructure**: AWS Lambda, API Gateway, CloudFront
- **Security**: bcrypt password hashing, OAuth 2.0, 2FA support
- **Charts**: Recharts for data visualization
- **Validation**: Zod for schema validation
- **State Management**: Zustand

## Project Structure

```
portal/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Next.js pages & API routes
│   │   ├── api/auth/       # Authentication endpoints
│   │   ├── dashboard.tsx   # Ambassador dashboard
│   │   ├── login.tsx       # Login page
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts         # Authentication utilities
│   │   └── middleware.ts   # API middleware
│   ├── styles/             # CSS modules
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── infra/
│   ├── aws/               # AWS infrastructure (CloudFormation, Terraform)
│   └── docker/            # Docker configuration
├── tests/                 # Test files
├── .github/workflows/     # CI/CD pipelines
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example

```

## Getting Started

### Prerequisites

- Node.js 18+ (LTS)
- npm or yarn
- AWS account (for deployment)

### Installation

1. **Install dependencies**
   ```bash
   cd portal
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

### Development

- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run tests**: `npm test`
- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Format code**: `npm run format`

## MVP Features (Sept 6 Launch)

### 1. User Authentication & Profile Management
- ✅ Email/password registration and login
- ✅ JWT token-based authentication
- ✅ Secure password hashing (bcrypt)
- ✅ Rate limiting on login attempts
- ✅ Profile creation and management
- ⏳ Social login (Google, Apple) - Post-MVP
- ⏳ 2-factor authentication - Post-MVP

### 2. Dashboard - Performance & Metrics
- ✅ Personal performance summary cards
- ✅ Monthly recruitment tracking
- ✅ Performance metrics visualization
- ⏳ Real-time data updates - Sprint 2
- ⏳ Admin dashboard - Sprint 2

### 3. Event Calendar & Management
- ⏳ Interactive calendar view - Sprint 2
- ⏳ Event creation and management - Sprint 2
- ⏳ RSVP functionality - Sprint 2

## Authentication Flow

### Registration
1. User submits email, password, name, club
2. Password validation & complexity checking
3. Password hashing with bcrypt (12 rounds)
4. User account creation in DynamoDB
5. JWT token generation
6. HTTP-only secure cookie set
7. Redirect to dashboard

### Login
1. User submits email and password
2. Rate limiting check (5 attempts/min)
3. User lookup in DynamoDB
4. Password verification with bcrypt
5. JWT token generation on success
6. Token stored in HTTP-only cookie & localStorage
7. Redirect to dashboard

### Token Verification
- Tokens verified on each API request via `withAuth` middleware
- Token expiry: 30 days
- Refresh tokens: To be implemented in Phase 2

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/login`
Login with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "user_1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ambassador"
  }
}
```

#### `POST /api/auth/register`
Register a new ambassador account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "clubId": "club_1"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "user_1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ambassador"
  }
}
```

## Development Timeline

### Sprint 1: Aug 24-30
- ✅ Project initialization & setup
- 🟡 Authentication module (JWT, password hashing)
- 🟡 Login/Register endpoints
- ⏳ Basic dashboard skeleton (50% complete)
- **Milestone**: First code commit by Aug 28

### Sprint 2: Aug 31 - Sept 6
- ⏳ Dashboard metrics & visualization
- ⏳ Event calendar feature
- ⏳ Admin dashboard
- ⏳ Real-time data updates
- **Milestone**: MVP launch Sept 6

### Sprint 3: Sept 7-11
- ⏳ Performance optimizations
- ⏳ Mobile responsiveness refinement
- ⏳ Security hardening (2FA, OAuth)
- ⏳ Go-live preparation & testing
- **Milestone**: Full feature set & go-live readiness by Sept 11

## Security Considerations

- ✅ HTTPS/TLS encryption for all traffic
- ✅ HTTP-only secure cookies for tokens
- ✅ CORS protection with allowlist
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Rate limiting on authentication endpoints
- ✅ Input validation with Zod
- ⏳ 2-factor authentication (Phase 2)
- ⏳ CSRF protection (Phase 2)
- ⏳ SQL injection prevention (using DynamoDB, natural protection)

## Database Schema

### Users Table (DynamoDB)
```
PK: userId (String)
SK: email (String)

Attributes:
- passwordHash (String)
- firstName (String)
- lastName (String)
- role (String: ambassador|coordinator|admin|program_team)
- clubId (String, optional)
- isActive (Boolean)
- createdAt (Date)
- updatedAt (Date)
- lastLogin (Date)
```

### Metrics Table (DynamoDB)
```
PK: userId (String)
SK: month (String: YYYY-MM)

Attributes:
- recruits (Number)
- eventsHosted (Number)
- memberSatisfaction (Number)
- bonusEarned (Number)
- performanceScore (Number)
```

### Events Table (DynamoDB)
```
PK: eventId (String)
SK: ambassadorId (String)

Attributes:
- title (String)
- date (Date)
- location (String)
- description (String)
- eventType (String)
- attendeeCount (Number)
- status (String: planned|in_progress|completed)
- createdAt (Date)
```

## Testing

- Unit tests with Jest
- Component tests with React Testing Library
- API endpoint tests with supertest
- Integration tests for authentication flow
- E2E tests with Cypress (Phase 2)

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### AWS Deployment (Phase 2)
- Lambda functions for API endpoints
- API Gateway for routing
- CloudFront for CDN
- DynamoDB for database
- S3 for static assets
- CloudWatch for logging

## Monitoring & Observability

- CloudWatch logs for Lambda functions
- Sentry for error tracking
- Custom dashboards for metrics
- Alert thresholds for critical issues

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write tests for new functionality
4. Run type checking: `npm run type-check`
5. Format code: `npm run format`
6. Commit with clear messages
7. Push and create a pull request

## Known Issues & TODO

### High Priority (MVP)
- [ ] Complete dashboard metrics visualization
- [ ] Event calendar implementation
- [ ] DynamoDB integration (currently using mock data)
- [ ] Email service integration (SendGrid)
- [ ] Real-time data updates via WebSocket

### Medium Priority (Phase 2)
- [ ] Social login (Google, Apple)
- [ ] 2-factor authentication
- [ ] Admin dashboard
- [ ] Notifications system
- [ ] Photo uploads (S3 integration)

### Low Priority (Phase 3+)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] AI-powered recommendations
- [ ] Leaderboard system
- [ ] Reward redemption

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Ambassador Portal Specification](../AMBASSADOR_PORTAL_SPEC.md)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Guidelines](https://owasp.org/www-project-secure-coding-practices/)

## Support

For issues, questions, or feature requests, please contact:
- Engineering Lead: [engineer@celadon-tennis.com]
- Product Manager: [pm@celadon-tennis.com]

## License

© 2026 Celadon Tennis. All rights reserved.

---

**Last Updated**: Aug 24, 2026 @ 23:30 UTC  
**Sprint Status**: Phase 1 - Infrastructure Ready ✅
