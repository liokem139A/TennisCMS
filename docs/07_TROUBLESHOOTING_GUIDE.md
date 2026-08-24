# Celadon Tennis CMS - Troubleshooting Guide

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Audience**: Developers, DevOps Engineers, Support Team

---

## Table of Contents

1. [Common API Issues](#common-api-issues)
2. [Database Issues](#database-issues)
3. [Cache Issues](#cache-issues)
4. [Authentication Issues](#authentication-issues)
5. [Performance Issues](#performance-issues)
6. [Infrastructure Issues](#infrastructure-issues)
7. [Development Environment Issues](#development-environment-issues)
8. [Debugging Techniques](#debugging-techniques)

---

## Common API Issues

### Issue: 500 Internal Server Error

**Symptoms**: API returns HTTP 500 on requests

**Diagnosis**:
```bash
# 1. Check API pod status
kubectl get pods -n production | grep api

# 2. Check API logs
kubectl logs -n production deployment/celadon-api --tail=100 | grep ERROR

# 3. Check application error tracking
# Visit: https://sentry.celadontennis.com/celadon-api/

# 4. Check database connection
kubectl exec -it pod/celadon-api-xyz -n production -- \
  npm run check-db

# 5. Verify environment variables
kubectl get secret/api-config -n production -o yaml
```

**Common Causes & Solutions**:

| Cause | Check | Solution |
|-------|-------|----------|
| Database unreachable | `psql -h $PGHOST -c "SELECT 1;"` | Restart DB, check connection string |
| Missing environment variable | `kubectl get configmap/api-config -n production` | Update ConfigMap, restart pod |
| Unhandled exception in code | Check Sentry error tracking | Review error logs, deploy fix |
| Out of memory | `kubectl top pod -n production` | Scale up pod memory, restart pod |

**Quick Fix**:
```bash
# Restart the API deployment
kubectl rollout restart deployment/celadon-api -n production

# Wait for rollout
kubectl rollout status deployment/celadon-api -n production --timeout=5m

# Verify
curl https://api.celadontennis.com/health
```

---

### Issue: 401 Unauthorized - Invalid Token

**Symptoms**: API returns 401 with "Invalid token" message

**Diagnosis**:
```bash
# 1. Verify token format
# Token should be: Authorization: Bearer <jwt_token>

# 2. Decode JWT token (online tool or cli)
# https://jwt.io/

# 3. Check token expiration
# JWT exp field should be > current Unix timestamp

# 4. Verify token signature
# GET https://auth.celadontennis.com/.well-known/jwks.json

# 5. Check auth service status
kubectl get pods -n production | grep auth
kubectl logs -n production deployment/celadon-auth --tail=50
```

**Common Causes**:

| Cause | Sign | Solution |
|-------|------|----------|
| Token expired | `exp` < current time | Refresh token |
| Invalid signature | Token decodes but fails verification | Re-authenticate, check auth service |
| Wrong secret used | Token appears valid but auth fails | Check secret rotation status |
| Clock skew | Tokens valid but server rejects | Sync server time (NTP) |

**Quick Fix**:
```bash
# For testing: Generate new token
curl -X POST https://auth.celadontennis.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Token refresh endpoint
curl -X POST https://auth.celadontennis.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<your_refresh_token>"}'
```

---

### Issue: 404 Not Found - Endpoint Doesn't Exist

**Symptoms**: API returns 404 for valid endpoints

**Diagnosis**:
```bash
# 1. Verify endpoint path
# Compare request URL with API documentation

# 2. Check API version
# Confirm using /v1/ prefix if required

# 3. Verify routing rules
kubectl exec -it pod/celadon-api-xyz -n production -- \
  npm run check-routes

# 4. Check recent deployments
kubectl rollout history deployment/celadon-api -n production
```

**Common Causes**:

| Cause | Solution |
|-------|----------|
| Wrong API version (v2 instead of v1) | Use correct path: /v1/... |
| Route not deployed yet | Check deployment version matches API docs |
| Path typo | Verify exact path from API reference |
| HTTP method wrong (POST vs GET) | Check request method |

---

## Database Issues

### Issue: Connection Pool Exhausted

**Symptoms**: 
- API requests timeout
- Error: "no more connections available"
- Error rate spikes to 100%

**Diagnosis**:
```bash
# 1. Check active connections
psql -h $PGHOST -U celadon_admin -c "
  SELECT datname, numbackends 
  FROM pg_stat_database 
  WHERE datname = 'celadon';"

# 2. Check connection by state
psql -h $PGHOST -U celadon_admin -c "
  SELECT state, COUNT(*) 
  FROM pg_stat_activity 
  GROUP BY state;"

# 3. Check long-running queries
psql -h $PGHOST -U celadon_admin -c "
  SELECT pid, query, state, query_start 
  FROM pg_stat_activity 
  WHERE state != 'idle' 
  ORDER BY query_start DESC;"

# 4. Check connection pool usage
kubectl exec -it pod/celadon-api-xyz -n production -- \
  npm run check-db-pool
```

**Solutions**:

```bash
# 1. Kill idle connections (>30 min)
psql -h $PGHOST -U celadon_admin -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'idle' 
  AND query_start < NOW() - INTERVAL '30 minutes';"

# 2. Increase connection pool size
# Edit deployment config
kubectl set env deployment/celadon-api \
  DB_POOL_MAX=30 -n production

# 3. Reduce connection pool size in app
# Wait for idle connections to drop
kubectl get pods -n production -o wide

# 4. Restart API pods to reset pool
kubectl rollout restart deployment/celadon-api -n production

# 5. Scale up API replicas to distribute load
kubectl scale deployment/celadon-api --replicas=5 -n production
```

---

### Issue: Slow Database Queries

**Symptoms**:
- API latency > 500ms
- High database CPU usage
- Long query execution times

**Diagnosis**:
```bash
# 1. Enable query logging (temporarily)
psql -h $PGHOST -U celadon_admin -d celadon -c "
  ALTER SYSTEM SET log_statement = 'all';
  SELECT pg_reload_conf();"

# 2. Check slow query log
psql -h $PGHOST -U celadon_admin -d celadon -c "
  SELECT query, calls, mean_time, max_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 20;"

# 3. Analyze query plan
psql -h $PGHOST -U celadon_admin -d celadon -c "
  EXPLAIN ANALYZE 
  SELECT * FROM users 
  WHERE email = 'test@example.com';"

# 4. Check missing indexes
psql -h $PGHOST -U celadon_admin -d celadon -c "
  SELECT * 
  FROM pg_stat_user_indexes 
  ORDER BY idx_scan DESC;"
```

**Solutions**:

```bash
# 1. Add missing index
psql -h $PGHOST -U celadon_admin -d celadon -c "
  CREATE INDEX idx_users_status_email 
  ON users(status, email) 
  WHERE deleted_at IS NULL;"

# 2. Analyze table to update statistics
psql -h $PGHOST -U celadon_admin -d celadon -c "
  ANALYZE users;
  ANALYZE tournaments;
  ANALYZE matches;"

# 3. Vacuum table if bloat detected
psql -h $PGHOST -U celadon_admin -d celadon -c "
  VACUUM FULL users;"

# 4. Kill long-running query (if problematic)
psql -h $PGHOST -U celadon_admin -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE query_start < NOW() - INTERVAL '5 minutes';"

# 5. Disable query logging (after investigation)
psql -h $PGHOST -U celadon_admin -d celadon -c "
  ALTER SYSTEM SET log_statement = 'off';
  SELECT pg_reload_conf();"
```

---

## Cache Issues

### Issue: Cache Not Working / High Miss Rate

**Symptoms**:
- Redis miss rate > 20%
- Same queries hitting database repeatedly
- High database load

**Diagnosis**:
```bash
# 1. Check Redis connectivity
redis-cli -h $REDIS_HOST ping

# 2. Check cache statistics
redis-cli -h $REDIS_HOST INFO stats

# 3. Check memory usage
redis-cli -h $REDIS_HOST INFO memory

# 4. Check cache keys
redis-cli -h $REDIS_HOST KEYS "*" | head -20
redis-cli -h $REDIS_HOST DBSIZE

# 5. Check cache eviction policy
redis-cli -h $REDIS_HOST CONFIG GET maxmemory-policy
```

**Solutions**:

```bash
# 1. Increase cache TTL
# Update cache configuration in application

# 2. Increase Redis memory allocation
kubectl scale deployment/redis --memory=4Gi -n production

# 3. Change eviction policy
redis-cli -h $REDIS_HOST CONFIG SET maxmemory-policy allkeys-lru

# 4. Clear stale cache entries
redis-cli -h $REDIS_HOST FLUSHDB ASYNC

# 5. Restart Redis to free memory
kubectl rollout restart deployment/redis -n production

# 6. Verify cache is working
redis-cli -h $REDIS_HOST PING
redis-cli -h $REDIS_HOST INFO stats
```

---

## Authentication Issues

### Issue: Users Cannot Login

**Symptoms**:
- Login endpoint returns 401
- Password always wrong
- LDAP/OAuth integration broken

**Diagnosis**:
```bash
# 1. Check auth service status
kubectl get pods -n production | grep auth
kubectl logs -n production deployment/celadon-auth --tail=50

# 2. Test password hashing
curl -X POST https://auth.celadontennis.com/api/debug/hash-password \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}'

# 3. Check user account status
psql -h $PGHOST -U celadon_admin -d celadon -c "
  SELECT user_id, email, status, email_verified 
  FROM users 
  WHERE email = 'user@example.com';"

# 4. Check OAuth provider status
curl -s https://oauth.provider.com/.well-known/openid-configuration | jq .
```

**Solutions**:

```bash
# 1. Reset password for user
psql -h $PGHOST -U celadon_admin -d celadon -c "
  UPDATE users 
  SET password_hash = crypt('newpassword', gen_salt('bf')) 
  WHERE email = 'user@example.com';"

# 2. Verify email if blocked
psql -h $PGHOST -U celadon_admin -d celadon -c "
  UPDATE users 
  SET email_verified = true, email_verified_at = NOW() 
  WHERE email = 'user@example.com';"

# 3. Unlock suspended account
psql -h $PGHOST -U celadon_admin -d celadon -c "
  UPDATE users 
  SET status = 'active' 
  WHERE email = 'user@example.com';"

# 4. Restart auth service
kubectl rollout restart deployment/celadon-auth -n production
```

---

## Performance Issues

### Issue: API Latency Spikes

**Symptoms**:
- Response time > 1000ms
- p95 latency degradation
- Timeout errors increasing

**Diagnosis**:
```bash
# 1. Check API pod resource utilization
kubectl top pods -n production -l app=celadon-api

# 2. Check system load
kubectl top nodes

# 3. Check database query latency
psql -h $PGHOST -U celadon_admin -d celadon -c "
  SELECT query, calls, mean_time, stddev_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC LIMIT 10;"

# 4. Check network latency
# Between API and database
ping $PGHOST

# 5. Check cache hit rate
redis-cli -h $REDIS_HOST INFO stats | grep hit_rate
```

**Solutions**:

```bash
# 1. Scale up API replicas
kubectl scale deployment/celadon-api --replicas=8 -n production

# 2. Increase pod resource limits
kubectl set resources deployment/celadon-api \
  --limits=cpu=2,memory=2Gi -n production

# 3. Add missing database indexes (see database section)
# Identify slow queries and add indexes

# 4. Increase Redis memory
kubectl patch deployment redis -p '{"spec":{"template":{"spec":{"containers":[{"name":"redis","resources":{"limits":{"memory":"4Gi"}}}]}}}}'

# 5. Enable response caching
# Update cache headers in API responses
# Implement Redis caching for frequently queried data

# 6. Monitor and verify improvement
kubectl top pods -n production
curl https://api.celadontennis.com/metrics | jq '.latency.p95'
```

---

## Infrastructure Issues

### Issue: Pod Crashing / Restart Loop

**Symptoms**:
- Pod status: CrashLoopBackOff
- Pod keeps restarting
- Errors in application logs

**Diagnosis**:
```bash
# 1. Check pod status and events
kubectl describe pod pod-name -n production

# 2. Check pod logs
kubectl logs pod-name -n production --previous

# 3. Check resource limits
kubectl get pod pod-name -n production -o yaml | grep -A 5 resources

# 4. Check health probe configuration
kubectl get pod pod-name -n production -o yaml | grep -A 10 livenessProbe
```

**Solutions**:

```bash
# 1. Check if out of memory
kubectl top pod pod-name -n production

# Increase memory limit
kubectl set resources deployment/app-name --limits=memory=2Gi -n production

# 2. Check if initialization takes too long
# Increase initial delay for liveness probe
kubectl patch deployment app-name -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"app","livenessProbe":{"initialDelaySeconds":30}}]}}}}'

# 3. Check application startup errors
kubectl logs pod-name -n production | head -100

# 4. Rollback to previous working version
kubectl rollout undo deployment/app-name -n production

# 5. Restart the pod
kubectl delete pod pod-name -n production
```

---

## Development Environment Issues

### Issue: Cannot Connect to Local Database

**Solutions**:
```bash
# 1. Verify Docker containers are running
docker-compose ps

# 2. Start containers if needed
docker-compose -f docker-compose.dev.yml up -d

# 3. Check container logs
docker-compose logs postgres

# 4. Test connection manually
psql -h localhost -U celadon_dev -d celadon

# 5. Check connection string in .env.local
# Should be: DATABASE_URL=postgresql://celadon_dev:dev_password@localhost:5432/celadon

# 6. Recreate container if corrupted
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d postgres
```

---

### Issue: Port Already in Use

**Solutions**:
```bash
# 1. Find process using the port
lsof -i :3000

# 2. Kill the process
kill -9 <PID>

# 3. Or use a different port
PORT=3001 npm start

# 4. On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id <PID> -Force
```

---

## Debugging Techniques

### Enable Debug Logging

```bash
# Temporary debug logging
export DEBUG=celadon:*
npm run dev

# Kubernetes pod debug logging
kubectl set env deployment/celadon-api DEBUG=celadon:* -n production
kubectl rollout status deployment/celadon-api -n production

# Disable after debugging
kubectl set env deployment/celadon-api DEBUG= -n production
```

### Inspect Network Requests

```bash
# From within a pod
kubectl exec -it pod/celadon-api-xyz -n production -- bash

# View network connections
netstat -tlpn | grep node

# Test connectivity to external service
curl https://external-api.example.com

# Check DNS resolution
nslookup celadon-db.rds.amazonaws.com

# Exit pod
exit
```

### Database Query Debugging

```bash
# Connect directly to database
kubectl port-forward -n production svc/postgres 5432:5432

# In another terminal
psql -h localhost -U celadon_admin -d celadon

# Run EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM tournaments 
WHERE status = 'active' 
AND start_date > NOW();

# Check slow query log
SELECT * FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

---

**Contact**: Backend & Infrastructure Lead  
**Escalation**: For unresolved issues, page on-call engineer
