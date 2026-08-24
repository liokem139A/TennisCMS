# Celadon Tennis CMS - Development Environment Setup Guide

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Target Audience:** Engineers, Developers

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Initial Setup](#initial-setup)
3. [Docker Environment](#docker-environment)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Database Setup](#database-setup)
7. [IDE Configuration](#ide-configuration)
8. [Pre-commit Hooks](#pre-commit-hooks)
9. [Useful Commands](#useful-commands)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: macOS 12+, Ubuntu 20.04+, or Windows 10+
- **CPU**: 4 cores (8+ recommended)
- **RAM**: 8 GB (16+ GB recommended)
- **Disk**: 50 GB free space

### Required Software
```
- Git 2.30+
- Docker Desktop 4.0+
- Node.js 18.x LTS
- npm 9.x or yarn 3.x
- PostgreSQL 14+ (optional, Docker recommended)
- Redis 7+ (optional, Docker recommended)
```

### macOS Setup

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install git node@18 docker-credential-helper

# Install Docker Desktop (via Homebrew or Download)
brew install --cask docker

# Verify installations
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x
docker --version
```

### Ubuntu Setup

```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install -y git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Verify installations
node --version
npm --version
docker --version
```

---

## Initial Setup

### Step 1: Clone Repository

```bash
# Clone the main repository
git clone https://github.com/celadontennis/cms.git
cd cms

# Initialize Git submodules (if any)
git submodule update --init --recursive

# Create development branch if not exists
git checkout -b develop
```

### Step 2: Install Global Dependencies

```bash
# Update npm to latest version
npm install -g npm@latest

# Install global CLI tools
npm install -g @angular/cli  # If using Angular
npm install -g @nestjs/cli    # If using NestJS
npm install -g @vue/cli       # If using Vue
npm install -g ts-node        # For TypeScript execution
npm install -g nodemon        # For auto-reload
```

### Step 3: Set Up Environment Variables

```bash
# Copy environment template to local
cp .env.example .env.local
cp .env.example .env.dev

# Edit environment variables
nano .env.local  # or use your preferred editor

# Set required variables:
# DATABASE_URL=postgresql://user:password@localhost:5432/celadon
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your-secret-key-here
# NODE_ENV=development
```

### Step 4: Install Project Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list

# Check for security vulnerabilities
npm audit fix --force  # Use with caution
```

---

## Docker Environment

### Step 1: Start Docker Services

```bash
# Navigate to project root
cd /path/to/cms

# Start Docker containers for development
docker-compose -f docker-compose.dev.yml up -d

# Verify containers are running
docker-compose -f docker-compose.dev.yml ps

# Expected output:
# NAME                COMMAND             STATUS              PORTS
# celadon-postgres    "postgres ..."      Up 1 minute         0.0.0.0:5432->5432/tcp
# celadon-redis       "redis-server"      Up 1 minute         0.0.0.0:6379->6379/tcp
# celadon-rabbitmq    "rabbitmq ..."      Up 1 minute         0.0.0.0:5672->5672/tcp
```

### Step 2: Check Service Health

```bash
# Check PostgreSQL connectivity
docker-compose -f docker-compose.dev.yml exec postgres psql -U celadon_dev -c "SELECT version();"

# Check Redis connectivity
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping

# Check RabbitMQ connectivity
docker-compose -f docker-compose.dev.yml exec rabbitmq rabbitmq-diagnostics status

# Expected outputs:
# PostgreSQL: PostgreSQL 14.x ...
# Redis: PONG
# RabbitMQ: Status of node rabbit@rabbitmq ...
```

### Step 3: View Logs

```bash
# View logs for all services
docker-compose -f docker-compose.dev.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f postgres

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f --tail=100
```

### Docker Compose Configuration Reference

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: celadon
      POSTGRES_USER: celadon_dev
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U celadon_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-alpine
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI

volumes:
  postgres_data:
```

---

## Backend Setup

### Step 1: Install Backend Dependencies

```bash
# Navigate to backend directory
cd packages/backend

# Install dependencies
npm install

# Install additional development dependencies
npm install --save-dev @types/node @types/jest ts-jest
```

### Step 2: Database Migrations

```bash
# Run all pending migrations
npm run migrate:latest

# Check migration status
npm run migrate:status

# Rollback last migration (if needed)
npm run migrate:rollback

# Create new migration
npm run migrate:create --name=add_user_preferences
```

### Step 3: Start Backend Development Server

```bash
# Option 1: Using npm script
npm run dev

# Option 2: Using nodemon for auto-reload
nodemon --watch src --exec ts-node src/server.ts

# Expected output:
# ✓ Server running on http://localhost:3000
# ✓ Database connected
# ✓ Redis connected
# ✓ GraphQL endpoint: http://localhost:3000/graphql
```

### Step 4: Seed Test Data (Optional)

```bash
# Seed database with test data
npm run seed

# Seed specific dataset
npm run seed:users
npm run seed:tournaments
npm run seed:clubs

# View database contents
psql -h localhost -U celadon_dev -d celadon -c "SELECT * FROM users LIMIT 5;"
```

---

## Frontend Setup

### Step 1: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd packages/web

# Install dependencies
npm install

# Install additional development dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Step 2: Environment Configuration

```bash
# Copy environment configuration
cp .env.example .env.local

# Edit environment variables
# REACT_APP_API_URL=http://localhost:3000/v1
# REACT_APP_GRAPHQL_URL=http://localhost:3000/graphql
# REACT_APP_ENV=development
```

### Step 3: Start Frontend Development Server

```bash
# Start React development server
npm start

# Alternative: Using Vite for faster builds
npm run dev

# Expected output:
# ✓ Compiled successfully
# ✓ Local:   http://localhost:3001
# ✓ Network: Use --host to expose
```

### Step 4: Open Application

```bash
# Open in default browser
open http://localhost:3001

# Or open manually in your browser
# Visit: http://localhost:3001
```

---

## Database Setup

### Step 1: Connect to PostgreSQL

```bash
# Via psql command-line
psql -h localhost -U celadon_dev -d celadon

# Via Docker
docker-compose -f docker-compose.dev.yml exec postgres psql -U celadon_dev -d celadon

# Via GUI tools (recommended for visual inspection)
# - DBeaver: https://dbeaver.io/
# - pgAdmin: http://localhost:5050 (if configured)
```

### Step 2: Create Development Database

```bash
# Create database if not exists (usually done by Docker)
createdb -h localhost -U celadon_dev celadon

# Create test database
createdb -h localhost -U celadon_dev celadon_test

# Verify databases
psql -h localhost -U celadon_dev -l
```

### Step 3: Database Utilities

```bash
# Backup database
pg_dump -h localhost -U celadon_dev celadon > backup_$(date +%s).sql

# Restore database
psql -h localhost -U celadon_dev celadon < backup_file.sql

# Drop all tables and reset
npm run db:reset

# Generate schema from Prisma models
npx prisma generate
npx prisma db push

# View database schema
npm run db:schema:view
```

---

## IDE Configuration

### VS Code Setup

```bash
# Install recommended extensions
code --install-extension ms-vscode-remote.vscode-remote-extensionpack
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension coenraads.bracket-pair-colorizer-2
code --install-extension typescript-heroes.typescript-importer
```

### VS Code Settings (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "search.exclude": {
    "node_modules": true,
    ".git": true
  }
}
```

### IntelliJ IDEA Setup

1. Open project in IntelliJ
2. Go to: Settings > Languages & Frameworks > TypeScript
3. Set TypeScript to use project version
4. Enable ESLint: Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint
5. Configure Prettier: Settings > Languages & Frameworks > JavaScript > Prettier

---

## Pre-commit Hooks

### Step 1: Install Husky

```bash
# Install husky
npm install -D husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-push "npm run test"
```

### Step 2: Configure Git Hooks

```bash
# .husky/pre-commit
#!/bin/bash
. "$(dirname "$0")/_/husky.sh"

npm run lint-staged
npm run type-check

# .husky/pre-push
#!/bin/bash
. "$(dirname "$0")/_/husky.sh"

npm run test -- --coverage
npm run build
```

---

## Useful Commands

### Development

```bash
# Start all services
npm run dev:all

# Start backend only
npm run dev:api

# Start frontend only
npm run dev:web

# Watch mode (rebuild on file changes)
npm run watch

# Type checking
npm run type-check

# ESLint
npm run lint
npm run lint:fix

# Prettier formatting
npm run format
npm run format:check
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth

# Run E2E tests
npm run test:e2e

# Run integration tests
npm run test:integration
```

### Database

```bash
# Run migrations
npm run migrate:latest

# Create migration
npm run migrate:create --name=migration_name

# Seed database
npm run seed

# Reset database
npm run db:reset

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

### Building

```bash
# Build backend
npm run build:api

# Build frontend
npm run build:web

# Build all packages
npm run build

# Production build
npm run build:prod
```

---

## Troubleshooting

### Issue: Cannot Connect to PostgreSQL

```bash
# Check if PostgreSQL container is running
docker-compose -f docker-compose.dev.yml ps

# Start PostgreSQL container
docker-compose -f docker-compose.dev.yml up -d postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.dev.yml logs postgres

# Test connection
psql -h localhost -U celadon_dev -d celadon -c "SELECT 1"
```

### Issue: Port Already in Use

```bash
# Find process using port 3000 (example)
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Issue: Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist tsconfig.tsbuildinfo

# Regenerate Prisma client
npx prisma generate
```

### Issue: Hot Reload Not Working

```bash
# Check if nodemon is installed
npm list nodemon

# Restart development server
npm run dev

# Check file watcher limits (macOS/Linux)
cat /proc/sys/fs/inotify/max_user_watches

# Increase limit if needed (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Issue: Database Connection Timeout

```bash
# Check database is accessible
psql -h localhost -U celadon_dev -c "SELECT version();"

# Check connection string in .env.local
# DATABASE_URL=postgresql://celadon_dev:dev_password@localhost:5432/celadon

# Restart Docker containers
docker-compose -f docker-compose.dev.yml restart postgres

# Check connection pool settings
# CONNECTION_POOL_MAX=10
# CONNECTION_POOL_TIMEOUT=30000
```

---

## Quick Start Checklist

```
☐ System requirements installed (Node.js, Docker, Git)
☐ Repository cloned
☐ Global dependencies installed
☐ Environment variables configured
☐ Docker containers started
☐ Database migrations run
☐ Project dependencies installed
☐ Backend server running on localhost:3000
☐ Frontend server running on localhost:3001
☐ Can login to application
☐ IDE configured with necessary extensions
☐ Git hooks installed (husky)
☐ Pre-commit hooks enabled
```

---

**Contact**: Backend & Infrastructure Lead
**Last Updated**: August 24, 2026
