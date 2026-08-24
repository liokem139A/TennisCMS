# Celadon Tennis CMS - Deployment Runbook

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Audience:** DevOps Engineers, Backend Engineers, Infrastructure Team

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Verification
- [ ] All tests passing on main branch
- [ ] Code review completed and approved
- [ ] No unresolved GitHub issues in milestone
- [ ] Database migrations verified
- [ ] Dependencies scanned for vulnerabilities

### Infrastructure Verification
- [ ] Target environment is healthy
- [ ] Disk space available (> 20% free)
- [ ] Database backups completed
- [ ] Secrets Manager updated with new credentials
- [ ] DNS records validated

### Documentation
- [ ] CHANGELOG updated with version notes
- [ ] API documentation reflects changes
- [ ] Breaking changes communicated to stakeholders
- [ ] Rollback procedures prepared

---

## Local Development Setup

### Prerequisites
```bash
# Required tools
- Docker Desktop (latest)
- Docker Compose (latest)
- Node.js 18.x or higher
- PostgreSQL CLI tools (psql)
- Redis CLI (redis-cli)
```

### Step 1: Clone Repository and Install Dependencies

```bash
git clone https://github.com/celadontennis/cms.git
cd cms

# Install dependencies for all services
npm install
npm install -g @angular/cli  # If using Angular

# Copy environment template
cp .env.example .env.local
```

### Step 2: Start Local Development Environment

```bash
# Start Docker containers for dependencies
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready (check logs)
docker-compose -f docker-compose.dev.yml logs -f

# Run database migrations
npm run db:migrate

# Seed database with test data (optional)
npm run db:seed
```

### Step 3: Start Development Servers

```bash
# Terminal 1: Backend API server
npm run dev:api

# Terminal 2: Frontend development server
npm run dev:web

# Terminal 3: Watch for TypeScript changes (if applicable)
npm run dev:types:watch
```

### Step 4: Verify Local Setup

```bash
# Test API connectivity
curl http://localhost:3000/health

# Open web application
open http://localhost:3000

# Check database connection
npm run db:verify

# Run tests
npm run test
```

---

## Staging Deployment

### Step 1: Build Docker Images

```bash
# Build all services
docker build -t celadon-api:latest -f services/api/Dockerfile .
docker build -t celadon-web:latest -f services/web/Dockerfile .
docker build -t celadon-auth:latest -f services/auth/Dockerfile .

# Tag for staging
docker tag celadon-api:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:staging
docker tag celadon-web:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-web:staging
docker tag celadon-auth:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-auth:staging

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:staging
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-web:staging
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-auth:staging
```

### Step 2: Deploy to Staging Kubernetes Cluster

```bash
# Authenticate with staging cluster
aws eks update-kubeconfig --name celadon-staging --region ${AWS_REGION}

# Apply Kubernetes manifests
kubectl apply -f k8s/staging/namespace.yaml
kubectl apply -f k8s/staging/configmaps/
kubectl apply -f k8s/staging/secrets/
kubectl apply -f k8s/staging/deployments/

# Wait for rollout to complete
kubectl rollout status deployment/celadon-api -n staging --timeout=5m
kubectl rollout status deployment/celadon-web -n staging --timeout=5m
kubectl rollout status deployment/celadon-auth -n staging --timeout=5m
```

### Step 3: Run Database Migrations on Staging

```bash
# Port-forward to staging database
kubectl port-forward -n staging svc/postgres 5432:5432 &

# Run migrations
PGPASSWORD=${STAGING_DB_PASSWORD} psql -h localhost -U celadon_staging -d celadon_staging -f db/migrations/latest.sql

# Verify migration completion
npm run db:verify --env=staging
```

### Step 4: Run Smoke Tests

```bash
# Execute smoke test suite
npm run test:smoke -- --env=staging

# Check health endpoints
curl https://staging-api.celadontennis.com/health
curl https://staging-api.celadontennis.com/v1/status

# Verify critical flows
npm run test:e2e:staging -- --spec=user-login.e2e.spec.ts
npm run test:e2e:staging -- --spec=tournament-creation.e2e.spec.ts
```

---

## Production Deployment

### Step 1: Pre-Production Validation

```bash
# Verify staging tests passed
echo "Checking staging test results..."
curl https://ci.celadontennis.com/api/builds/staging/latest | jq '.status'

# Check staging monitoring metrics
echo "Verifying staging performance metrics..."
# Should see < 100ms p95 latency, < 0.1% error rate

# Wait for approval from tech lead
echo "Waiting for production deployment approval..."
# Obtain approval via Slack or Jira before proceeding
```

### Step 2: Build Production Docker Images

```bash
# Build with production tag
docker build \
  --build-arg BUILD_VERSION=$(git describe --tags) \
  --build-arg BUILD_COMMIT=$(git rev-parse --short HEAD) \
  -t celadon-api:$(git describe --tags) \
  -f services/api/Dockerfile .

# Tag for production ECR
docker tag celadon-api:$(git describe --tags) \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:$(git describe --tags)

docker tag celadon-api:$(git describe --tags) \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:latest

# Push both version and latest tags
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:$(git describe --tags)
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:latest
```

### Step 3: Deploy to Production via Blue-Green

```bash
# Authenticate with production cluster
aws eks update-kubeconfig --name celadon-prod --region ${AWS_REGION}

# Step 3a: Deploy to Green environment (inactive)
kubectl set image deployment/celadon-api-green \
  celadon-api=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:latest \
  -n production

# Wait for green environment to be ready
kubectl rollout status deployment/celadon-api-green -n production --timeout=10m

# Run integration tests against green
npm run test:integration -- --env=production-green

# Step 3b: Switch traffic from blue to green
kubectl patch service celadon-api-svc -p '{"spec":{"selector":{"env":"green"}}}' -n production

# Verify traffic is flowing to green
kubectl get endpoints celadon-api-svc -n production

# Step 3c: Monitor for 5 minutes
echo "Monitoring green environment..."
sleep 300

# Check error rates
curl https://api.celadontennis.com/metrics | grep error_rate

# If issues occur, immediately switch back to blue
# kubectl patch service celadon-api-svc -p '{"spec":{"selector":{"env":"blue"}}}' -n production
```

### Step 4: Production Database Migration

```bash
# Create pre-migration backup
aws rds create-db-snapshot \
  --db-instance-identifier celadon-prod \
  --db-snapshot-identifier celadon-prod-pre-migration-$(date +%s)

# Wait for snapshot to complete
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier celadon-prod-pre-migration-$(date +%s)

# Run migrations (with connection pooling in read-only mode initially)
# Export connection details
export PGHOST=$(aws rds describe-db-instances \
  --db-instance-identifier celadon-prod \
  --query 'DBInstances[0].Endpoint.Address' --output text)

# Connect and run migrations
psql -h $PGHOST -U celadon_admin -d celadon \
  -f db/migrations/$(date +%Y%m%d)-production.sql

# Verify schema changes
npm run db:verify --env=production
```

### Step 5: Production Smoke Tests

```bash
# Run comprehensive health checks
npm run test:smoke -- --env=production

# Verify critical user flows
npm run test:e2e:prod -- --spec=user-registration.spec.ts
npm run test:e2e:prod -- --spec=tournament-search.spec.ts
npm run test:e2e:prod -- --spec=booking-flow.spec.ts

# Performance verification
npm run test:perf --env=production
```

---

## Post-Deployment Verification

### Immediate Verification (0-5 minutes)

```bash
# 1. Health check all services
echo "Running health checks..."
for service in api auth web; do
  curl -f https://api.celadontennis.com/${service}/health || echo "FAILED: $service"
done

# 2. Check error rates (should be < 0.1%)
echo "Checking error rates..."
curl -s https://monitoring.celadontennis.com/api/errors/rate?time=5m | jq '.rate'

# 3. Verify database connectivity
echo "Checking database connectivity..."
psql -h $PGHOST -U celadon_admin -c "SELECT version();"

# 4. Check service pod status
echo "Checking Kubernetes pod status..."
kubectl get pods -n production | grep -E "api|auth|web"
```

### Short-term Verification (5-30 minutes)

```bash
# 1. Monitor transaction throughput
echo "Monitoring transaction throughput..."
curl -s https://monitoring.celadontennis.com/api/throughput?time=30m | jq '.transactions_per_second'

# 2. Check API latency (p95 should be < 200ms)
echo "Checking API latency..."
curl -s https://monitoring.celadontennis.com/api/latency/p95?time=30m | jq '.latency_ms'

# 3. Verify no database slowlog entries
echo "Checking database slow query log..."
psql -h $PGHOST -U celadon_admin -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"

# 4. Check cache hit rates (should be > 80%)
echo "Checking Redis cache hit rate..."
redis-cli -h $REDIS_HOST INFO stats | grep hit_rate
```

### Long-term Verification (30 minutes - 2 hours)

```bash
# 1. User sign-up and login flow
echo "Testing user sign-up flow..."
npm run test:flow:signup --env=production

# 2. Tournament creation flow
echo "Testing tournament creation..."
npm run test:flow:tournament-create --env=production

# 3. Real-time features (WebSocket connections)
echo "Testing WebSocket connections..."
npm run test:realtime --env=production

# 4. Email delivery verification
echo "Verifying email delivery..."
npm run test:email --env=production
```

---

## Rollback Procedures

### Scenario 1: Critical Error Detected (Immediate Rollback)

```bash
# 1. Identify the issue
kubectl logs -n production deployment/celadon-api --tail=50

# 2. Switch traffic back to previous version
kubectl set image deployment/celadon-api \
  celadon-api=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:previous \
  -n production

# 3. Wait for rollback to complete
kubectl rollout status deployment/celadon-api -n production --timeout=5m

# 4. Run smoke tests to verify
npm run test:smoke -- --env=production

# 5. Report incident
echo "Incident: Rollback performed at $(date)" >> deployment-log.txt
# Send notification to team
```

### Scenario 2: Database Migration Issues

```bash
# 1. Identify failed migration
psql -h $PGHOST -U celadon_admin -c "SELECT * FROM schema_migrations ORDER BY installed_on DESC LIMIT 5;"

# 2. Rollback to previous database snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier celadon-prod-restore \
  --db-snapshot-identifier celadon-prod-pre-migration-${SNAPSHOT_ID}

# 3. Promote restored instance
# Follow RDS documentation for promoting read replica

# 4. Update connection strings in Kubernetes secrets
kubectl create secret generic db-credentials \
  --from-literal=host=${NEW_DB_HOST} \
  --from-literal=password=${NEW_DB_PASSWORD} \
  -o yaml | kubectl replace -f - -n production

# 5. Restart pods to pick up new connection strings
kubectl rollout restart deployment/celadon-api -n production
```

### Scenario 3: Staged Rollback

```bash
# 1. Deploy previous version to small percentage of traffic (5%)
kubectl set image deployment/celadon-api-canary \
  celadon-api=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:previous \
  -n production

# 2. Monitor canary metrics
sleep 300
CANARY_ERRORS=$(curl -s https://monitoring.celadontennis.com/api/errors?pod=celadon-api-canary | jq '.count')

if [ $CANARY_ERRORS -lt 10 ]; then
  # 3. Gradually increase traffic to previous version
  kubectl patch deployment celadon-api -p '{"spec":{"replicas":1}}' -n production  # Scale current down
  kubectl patch deployment celadon-api-canary -p '{"spec":{"replicas":9}}' -n production  # Scale canary up
  
  # 4. Complete the rollback
  kubectl set image deployment/celadon-api \
    celadon-api=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/celadon-api:previous \
    -n production
else
  echo "Canary showing high error rate, aborting rollback"
fi
```

---

## Troubleshooting

### Issue: Pods Not Starting

```bash
# Check pod status and events
kubectl describe pod ${POD_NAME} -n production

# Check resource constraints
kubectl top nodes  # Check node resource usage
kubectl top pods -n production  # Check pod resource usage

# Check image pulling issues
kubectl logs ${POD_NAME} -n production --previous

# Solution: Increase resource limits or scale to more nodes
kubectl scale deployment celadon-api --replicas=5 -n production
```

### Issue: High API Latency

```bash
# Check database query performance
psql -h $PGHOST -U celadon_admin -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check connection pool status
psql -h $PGHOST -U celadon_admin -c "SELECT datname, numbackends FROM pg_stat_database WHERE datname = 'celadon';"

# Check cache hit rates
redis-cli -h $REDIS_HOST INFO stats

# Solution: 
# 1. Add missing indexes if needed
# 2. Increase connection pool size
# 3. Clear stale cache entries
redis-cli -h $REDIS_HOST FLUSHDB ASYNC
```

### Issue: Out of Disk Space

```bash
# Check disk usage
df -h
docker system df

# Check log file sizes
du -sh /var/log/docker/*
du -sh /var/lib/docker/*

# Clean up unused Docker resources
docker system prune -a --volumes
docker image prune -a

# Rotate logs if needed
journalctl --vacuum=500M
```

### Issue: Database Connection Pool Exhaustion

```bash
# Check active connections
psql -h $PGHOST -U celadon_admin -c "SELECT * FROM pg_stat_activity;"

# Check for idle connections
psql -h $PGHOST -U celadon_admin -c "SELECT * FROM pg_stat_activity WHERE state = 'idle';"

# Terminate idle connections
psql -h $PGHOST -U celadon_admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '15 minutes';"

# Solution: 
# 1. Increase max_connections in PostgreSQL
# 2. Use PgBouncer for connection pooling
# 3. Scale API instances to reduce per-instance load
```

---

## Deployment Checklist Template

```
Deployment ID: _______________
Version: _______________
Date: _______________
Deployed By: _______________

PRE-DEPLOYMENT:
☐ Code review completed
☐ All tests passing
☐ Database backup created
☐ Secrets updated
☐ Approval obtained

STAGING DEPLOYMENT:
☐ Images built and pushed
☐ Deployed to staging
☐ Migrations completed
☐ Smoke tests passed

PRODUCTION DEPLOYMENT:
☐ Pre-deployment health check
☐ Production images built
☐ Blue-green deployment started
☐ Green environment verified
☐ Traffic switched to green
☐ Database migrations completed
☐ Production smoke tests passed

POST-DEPLOYMENT:
☐ Immediate verification completed
☐ No critical errors observed
☐ Team notified of successful deployment
☐ Deployment log updated
☐ Monitoring dashboards active

SIGN-OFF:
Deployed By: _________________ Date: _________________
Verified By: _________________ Date: _________________
```

---

**Contact**: Backend & Infrastructure Lead
**Escalation**: On-call engineer (check PagerDuty schedule)
