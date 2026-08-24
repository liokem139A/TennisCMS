# Infrastructure Setup Complete ✅

This document covers the infrastructure setup for the Celadon Tennis Digital Platform backend.

## Setup Summary

### ✅ Completed Infrastructure Components

#### 1. **Docker Environment**
- Multi-stage Dockerfile for optimized production builds
- Docker Compose configuration for local development
- Services: PostgreSQL, Redis, Backend API, Frontend (placeholder)
- Health checks configured for all services
- Non-root user for security

**Files:**
- `Dockerfile` - Production-ready backend image
- `docker-compose.yml` - Development stack with all services
- `.dockerignore` - Docker build optimization

#### 2. **CI/CD Pipeline**
- GitHub Actions workflows for continuous integration and deployment
- Automated testing, linting, and security scanning
- Docker image building and registry push
- Production and staging deployment strategies

**Files:**
- `.github/workflows/ci.yml` - Main CI pipeline (lint, test, build, security)
- `.github/workflows/deploy.yml` - Production deployment workflow

**Pipeline Features:**
- ✅ Code linting and formatting checks
- ✅ TypeScript type checking
- ✅ Unit and integration tests with coverage
- ✅ Docker image building and registry push
- ✅ Security scanning (npm audit, Snyk)
- ✅ Database migrations before deployment
- ✅ Post-deployment smoke tests
- ✅ Health checks
- ✅ Slack notifications

#### 3. **Backend Code Structure**
- TypeScript configuration for strict mode
- Express.js application with middleware setup
- Modular architecture (controllers, services, middleware, models)
- Error handling and validation patterns
- Logging with Pino
- Request tracking with unique IDs

**Directories:**
```
src/
├── config/         # Configuration management
├── controllers/    # Route controllers
├── services/       # Business logic
├── middleware/     # Express middleware
├── models/         # Data models
├── utils/          # Utility functions
└── __tests__/      # Test files
```

#### 4. **Development Tools**
- ESLint configuration for code quality
- Prettier for code formatting
- Vitest for unit testing
- npm scripts for common tasks

#### 5. **Configuration Management**
- Environment variables support
- `.env.example` with all required settings
- Configuration file with TypeScript types
- Feature flags support

#### 6. **Dependencies**
**Core:**
- express - Web framework
- pg - PostgreSQL client
- redis - Cache store
- jsonwebtoken - JWT authentication
- bcrypt - Password hashing

**Development:**
- TypeScript - Type safety
- Vitest - Testing framework
- ESLint - Code linting
- Prettier - Code formatting
- tsx - TypeScript executor

## Getting Started

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/liokem139A/TennisCMS.git
cd TennisCMS
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment:**
```bash
cp .env.example .env.local
```

4. **Start Docker services:**
```bash
docker-compose up -d
```

5. **Run database migrations:**
```bash
npm run migrate:dev
```

6. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

### Common Commands

**Development:**
```bash
npm run dev              # Start development server with hot reload
npm run build           # Build TypeScript
npm start              # Start production server
```

**Quality:**
```bash
npm run lint           # Run ESLint with fixes
npm run typecheck      # TypeScript type checking
npm run format         # Format code with Prettier
npm run test           # Run tests in watch mode
npm run test:ci        # Run tests once with coverage
npm run test:coverage  # Generate coverage report
```

**Database:**
```bash
npm run migrate:dev    # Run migrations in development
npm run migrate:prod   # Run migrations in production
npm run seed:dev       # Seed development database
npm run db:reset       # Reset database
```

**Docker:**
```bash
docker-compose up      # Start all services
docker-compose down    # Stop all services
docker-compose logs -f # View logs
```

### Testing

Tests are organized in `src/__tests__/`:

```bash
# Run all tests
npm run test

# Run specific test file
npm run test src/__tests__/smoke.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test
```

### Environment Variables

Key variables (see `.env.example` for complete list):

```env
NODE_ENV=development              # development/test/production
PORT=3000                         # API port
DATABASE_URL=postgresql://...     # PostgreSQL connection
REDIS_URL=redis://...            # Redis connection
JWT_SECRET=your-secret           # JWT signing key
LOG_LEVEL=info                   # Logging level
```

## Deployment

### Docker Image Building

```bash
# Build image locally
docker build -t tennis-cms:latest .

# Run container
docker run -p 3000:3000 tennis-cms:latest
```

### CI/CD Deployment

The `.github/workflows/deploy.yml` handles automated deployment:

1. **On push to main:** Deploys to production
2. **Manual trigger:** Deploy to staging or production
3. **Steps:**
   - Database migrations
   - Docker image build and push
   - ECS service update
   - Health checks
   - Smoke tests

**Required Secrets (GitHub Settings):**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `ECS_CLUSTER_PROD`
- `ECS_CLUSTER_STAGING`
- `SLACK_WEBHOOK`
- `SNYK_TOKEN`
- `DATABASE_URL`

### Production Checklist

- [ ] Set all required environment variables in production
- [ ] Configure AWS ECS cluster and services
- [ ] Set up RDS PostgreSQL instance
- [ ] Configure ElastiCache Redis cluster
- [ ] Set up CloudWatch monitoring
- [ ] Configure ALB/NLB load balancer
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up logging aggregation (CloudWatch/ELK)
- [ ] Configure auto-scaling policies
- [ ] Set up alerting and on-call rotation

## Architecture

### Application Architecture

```
┌─────────────────────────────────────┐
│       Client (Web/Mobile)           │
└────────────────┬────────────────────┘
                 │
┌─────────────────▼────────────────────┐
│   Load Balancer (ALB/NLB)            │
└────────────────┬────────────────────┘
                 │
┌─────────────────▼────────────────────┐
│   Express API Server (Containerized) │
│  - Authentication & Authorization    │
│  - Request validation                │
│  - Error handling                    │
└────────────────┬────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
┌────────▼─────┐  ┌──────▼──────┐
│  PostgreSQL  │  │   Redis     │
│   Database   │  │   Cache     │
└──────────────┘  └─────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 18+ | JavaScript execution |
| Framework | Express.js | Web server & routing |
| Language | TypeScript | Type safety |
| Database | PostgreSQL | Relational data |
| Cache | Redis | Session & cache store |
| Auth | JWT + bcrypt | Authentication |
| Testing | Vitest | Unit & integration tests |
| Linting | ESLint | Code quality |
| Formatting | Prettier | Code style |
| Container | Docker | Application packaging |
| Orchestration | AWS ECS | Container deployment |
| Monitoring | CloudWatch | Logging & metrics |

## Security

### Implemented Security Measures

- ✅ Helmet.js for HTTP headers
- ✅ CORS configuration
- ✅ JWT with secure secrets
- ✅ Password hashing with bcrypt
- ✅ Environment variable isolation
- ✅ Docker non-root user
- ✅ Security scanning in CI/CD
- ✅ Health checks for availability

### Best Practices to Follow

1. **Secrets Management:**
   - Never commit `.env` files
   - Use GitHub Secrets for CI/CD
   - Rotate secrets regularly

2. **Code Security:**
   - Always validate and sanitize input
   - Use parameterized queries
   - Implement rate limiting
   - Add authentication to protected routes

3. **Infrastructure:**
   - Use HTTPS in production
   - Enable database encryption
   - Configure security groups properly
   - Monitor and log all access

## Troubleshooting

### Common Issues

**Docker Compose fails to start:**
```bash
# Clean up and restart
docker-compose down -v
docker-compose up --build
```

**Database connection error:**
```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Verify DATABASE_URL is correct
cat .env.local
```

**Port already in use:**
```bash
# Change port in .env.local
# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

## Next Steps

1. **Create API Routes:**
   - User management routes
   - Club management routes
   - Tournament management routes
   - Ambassador program routes

2. **Implement Models:**
   - User model
   - Club model
   - Tournament model
   - Ambassador model

3. **Add Services:**
   - Authentication service
   - Email service
   - Payment integration
   - Slack notifications

4. **Database:**
   - Create migration files
   - Set up seed scripts
   - Configure backup strategy

5. **Monitoring:**
   - Set up CloudWatch alarms
   - Configure error tracking
   - Add performance monitoring

## Support & Resources

- **TypeScript:** https://www.typescriptlang.org/docs/
- **Express:** https://expressjs.com/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Redis:** https://redis.io/documentation
- **Docker:** https://docs.docker.com/

## Document Status

- **Created:** 2026-08-24
- **Last Updated:** 2026-08-24
- **Status:** ✅ Infrastructure Setup Complete

For issues or updates, please file an issue in the repository or contact the Backend & Infrastructure Lead.
