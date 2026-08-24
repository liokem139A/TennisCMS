# Celadon Tennis CMS — Backend Development Guide

**Version:** 1.0  
**Last Updated:** August 24, 2026  
**Target Audience:** Backend engineers, DevOps team, Phase 1 execution team

---

## 🚀 Quick Start (< 5 minutes)

### Prerequisites
- Node.js 18.x LTS
- Docker Desktop 4.0+
- Git 2.30+

### Clone and Run
```bash
# Clone the repository
git clone https://github.com/liokem139A/TennisCMS.git
cd TennisCMS

# Copy environment file
cp .env.example .env

# Start the backend with Docker Compose
docker-compose up -d

# Verify all services are running
docker-compose ps
```

### Access Services
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432 (user: postgres, password: postgres)
- **Redis**: localhost:6379

---

## 📚 Documentation Index

All comprehensive documentation is in the `/docs` directory. Here's what you need to know:

| Document | Purpose | For Whom |
|----------|---------|----------|
| **[01_ARCHITECTURE_OVERVIEW.md](docs/01_ARCHITECTURE_OVERVIEW.md)** | System design, service interactions, deployment topology | Architects, Tech Leads |
| **[02_DEPLOYMENT_RUNBOOK.md](docs/02_DEPLOYMENT_RUNBOOK.md)** | Step-by-step deployment procedures, environment setup | DevOps, Release Engineers |
| **[03_API_REFERENCE.md](docs/03_API_REFERENCE.md)** | Complete API endpoints, request/response specs | Frontend Devs, API Consumers |
| **[04_DATABASE_SCHEMA.md](docs/04_DATABASE_SCHEMA.md)** | Database design, ERD diagrams, migrations | Backend Devs, DBAs |
| **[05_DEV_ENVIRONMENT_SETUP.md](docs/05_DEV_ENVIRONMENT_SETUP.md)** | Local development configuration, IDE setup | All Backend Developers |
| **[06_OPERATIONAL_PLAYBOOKS.md](docs/06_OPERATIONAL_PLAYBOOKS.md)** | Monitoring, alerting, incident response | DevOps, On-Call Engineers |
| **[07_TROUBLESHOOTING_GUIDE.md](docs/07_TROUBLESHOOTING_GUIDE.md)** | Common issues and solutions | Support, Developers |
| **[08_PERFORMANCE_TUNING.md](docs/08_PERFORMANCE_TUNING.md)** | Optimization guide, benchmarking | Performance Engineers |
| **[09_SECURITY_BEST_PRACTICES.md](docs/09_SECURITY_BEST_PRACTICES.md)** | Security hardening, compliance, access control | Security Engineers, All |
| **[10_TEAM_ASSIGNMENT_MATRIX.md](docs/10_TEAM_ASSIGNMENT_MATRIX.md)** | Phase 1 team roles and responsibilities | Project Managers, Team Leads |
| **[11_PHASE_1_SPRINT_PLAN.md](docs/11_PHASE_1_SPRINT_PLAN.md)** | Sprint timeline, dependencies, gates | PMs, Scrum Masters |

---

## 🏗️ Project Structure

```
TennisCMS/
├── src/
│   ├── index.ts                  # Application entry point
│   ├── config/                   # Configuration (database, env vars)
│   ├── routes/                   # API route handlers
│   ├── services/                 # Business logic layer
│   ├── models/                   # Data models and schemas
│   ├── middleware/               # Express middleware
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript type definitions
│
├── db/
│   ├── migrations/               # Database migration scripts
│   ├── seeds/                    # Sample data scripts
│   └── schema.sql               # Database schema
│
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
│
├── .github/workflows/
│   ├── ci.yml                   # Continuous Integration
│   └── deploy.yml               # Deployment workflow
│
├── docs/                        # Comprehensive documentation
├── Dockerfile                   # Docker image definition
├── docker-compose.yml          # Multi-service Docker setup
├── package.json                # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
└── .env.example                # Environment variable template
```

---

## 🔧 Development Workflow

### 1. Setup Local Environment (First Time Only)

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your local settings

# Start Docker services
docker-compose up -d

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### 2. Daily Development

```bash
# Start all services in the background
docker-compose up -d

# Run backend in development mode (with hot reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### 3. Useful Commands

```bash
# View logs
docker-compose logs -f backend    # Backend logs
docker-compose logs -f postgres   # Database logs
docker-compose logs -f redis      # Cache logs

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Health check
curl http://localhost:3000/health
```

### 4. Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Run type checking
npm run type-check
```

---

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit    # Run all unit tests
npm run test:unit -- --watch   # Watch mode
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

---

## 🚀 Deployment

### Staging Deployment
```bash
npm run deploy:staging
```

### Production Deployment
```bash
npm run deploy:production
```

**⚠️ Important**: Always review [02_DEPLOYMENT_RUNBOOK.md](docs/02_DEPLOYMENT_RUNBOOK.md) before deploying to production.

---

## 📊 Architecture Overview

The Celadon Tennis CMS backend follows a **layered architecture**:

```
┌─────────────────────────────────────┐
│     API Routes (Express.js)         │
├─────────────────────────────────────┤
│   Middleware (Auth, Logging, etc)   │
├─────────────────────────────────────┤
│   Service Layer (Business Logic)    │
├─────────────────────────────────────┤
│   Data Models & Validation          │
├─────────────────────────────────────┤
│  PostgreSQL | Redis | File Storage  │
└─────────────────────────────────────┘
```

### Key Technologies
- **Runtime**: Node.js 18 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: Prisma (recommended) or TypeORM
- **Validation**: Zod or Joi
- **Testing**: Jest + Supertest
- **CI/CD**: GitHub Actions

---

## 🔐 Security Checklist

Before committing code or deploying:

- [ ] No hardcoded secrets or API keys
- [ ] All user inputs validated and sanitized
- [ ] Database queries use parameterized statements (prevent SQL injection)
- [ ] CORS properly configured
- [ ] Rate limiting implemented for public endpoints
- [ ] Error messages don't expose sensitive information
- [ ] Environment variables used for configuration
- [ ] Passwords hashed with bcrypt or similar
- [ ] HTTPS required for all API calls
- [ ] JWT tokens have reasonable expiration

See [09_SECURITY_BEST_PRACTICES.md](docs/09_SECURITY_BEST_PRACTICES.md) for detailed guidelines.

---

## 🆘 Getting Help

### First Steps
1. **Local Setup Issues**: Check [05_DEV_ENVIRONMENT_SETUP.md](docs/05_DEV_ENVIRONMENT_SETUP.md)
2. **Common Problems**: See [07_TROUBLESHOOTING_GUIDE.md](docs/07_TROUBLESHOOTING_GUIDE.md)
3. **Performance Issues**: Review [08_PERFORMANCE_TUNING.md](docs/08_PERFORMANCE_TUNING.md)

### Team Communication
- **Slack**: #backend-engineering
- **Daily Standup**: 6:00 PM UTC
- **On-Call**: See [06_OPERATIONAL_PLAYBOOKS.md](docs/06_OPERATIONAL_PLAYBOOKS.md)

### Escalation Path
1. Team Lead (Tech Lead or Infrastructure Lead)
2. Product Manager
3. CEO (for critical blockers)

---

## 📋 Phase 1 Execution Timeline

**Aug 24-30**: Infrastructure & Database Setup
- CEL-7: Project Infrastructure (GitHub, Docker, CI/CD)
- CEL-8: Database Configuration (PostgreSQL, Redis, AWS)

**Sept 1-2**: Core Features Development
- CEL-4: Core MVP Features (Feature dev unblocks)
- CEL-9: User Registration & Authentication
- CEL-11: Tournament Management APIs

**Sept 6**: Testing & QA Phase
- Unit and integration tests
- Performance testing
- Security review

**Sept 11-12**: Go-Live Preparation
- Staging deployment
- Final QA
- Production readiness

See [11_PHASE_1_SPRINT_PLAN.md](docs/11_PHASE_1_SPRINT_PLAN.md) for detailed timeline.

---

## 🎯 Key Contact Information

| Role | Name | Slack | Responsibility |
|------|------|-------|-----------------|
| Backend & Infrastructure Lead | Tao Nguyen | @tao | Infrastructure, APIs, deployment |
| Database Architect | [To Be Assigned] | TBD | Database design, optimization |
| Product Manager | Tao Nguyen | @tao | Sprint coordination, requirements |
| CEO/Sponsor | [CEO] | TBD | Executive oversight, escalation |

---

## ✅ Acceptance Criteria Checklist

### For Code Contributions
- [ ] Code follows TypeScript best practices
- [ ] All new code has unit tests (>80% coverage)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Commits follow conventional commit format
- [ ] Pull request references related issues

### For Deployments
- [ ] All tests pass in CI/CD pipeline
- [ ] Code review approved by Tech Lead
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Deployment runbook followed
- [ ] Post-deployment health checks pass

---

## 📞 Emergency Contacts

For critical production issues:
1. **Backend Lead**: Tao Nguyen (primary)
2. **On-Call Rotation**: Check [06_OPERATIONAL_PLAYBOOKS.md](docs/06_OPERATIONAL_PLAYBOOKS.md)
3. **Escalation**: CEO via Slack priority mentions

---

## 🔄 Last Updated

**August 24, 2026** by Backend & Infrastructure Lead  
**Next Review**: Sept 1, 2026 (Post-Phase 1 Kickoff)

---

**Welcome to the Celadon Tennis CMS backend team! 🎾**
