# Celadon Tennis CMS - Performance Tuning Guide

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Audience**: Backend Engineers, DevOps, Performance Engineers

---

## Table of Contents

1. [Performance Baseline](#performance-baseline)
2. [Database Optimization](#database-optimization)
3. [Application Optimization](#application-optimization)
4. [Cache Optimization](#cache-optimization)
5. [API Performance](#api-performance)
6. [Frontend Performance](#frontend-performance)
7. [Infrastructure Optimization](#infrastructure-optimization)
8. [Monitoring & Metrics](#monitoring--metrics)

---

## Performance Baseline

### Target Performance Metrics

```
API Response Time (p95): 200ms
API Response Time (p99): 500ms
Error Rate: < 0.1%
Cache Hit Rate: > 85%
Database Query Time (p95): < 50ms
Page Load Time: < 2 seconds
Web Vitals:
  - Largest Contentful Paint: < 2.5s
  - First Input Delay: < 100ms
  - Cumulative Layout Shift: < 0.1
Throughput: 1000 requests/sec at p95
CPU Utilization: < 70%
Memory Utilization: < 75%
Disk I/O: < 70% utilization
```

### Baseline Measurement

```bash
# Measure current performance
npm run perf:baseline -- --env=production

# Load testing
npm run load-test -- --concurrency=100 --duration=5m

# Results analysis
npm run perf:analyze -- --baseline=./baseline.json --current=./current.json
```

---

## Database Optimization

### Query Optimization

#### Technique 1: Add Strategic Indexes

```sql
-- Analyze query to identify missing indexes
EXPLAIN ANALYZE
SELECT * FROM tournaments 
WHERE status = 'active' AND city = 'Hanoi'
ORDER BY start_date DESC;

-- Add covering index
CREATE INDEX idx_tournaments_status_city 
ON tournaments(status, city) 
INCLUDE (start_date);

-- Verify index is used
EXPLAIN SELECT * FROM tournaments 
WHERE status = 'active' AND city = 'Hanoi'
ORDER BY start_date DESC;
```

#### Technique 2: Query Rewriting

**Before** (slow - N+1 query):
```javascript
const users = await db.query('SELECT * FROM users WHERE status = ?', ['active']);
for (const user of users) {
  const stats = await db.query('SELECT * FROM user_statistics WHERE user_id = ?', [user.user_id]);
  user.stats = stats;
}
```

**After** (optimized - single query):
```javascript
const users = await db.query(`
  SELECT u.*, us.* 
  FROM users u 
  LEFT JOIN user_statistics us ON u.user_id = us.user_id 
  WHERE u.status = $1
`, ['active']);
```

#### Technique 3: Use Cursor-Based Pagination

**Before** (offset pagination - slow for large datasets):
```sql
SELECT * FROM matches 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 10000;  -- Scans 10,020 rows
```

**After** (cursor-based pagination - efficient):
```sql
SELECT * FROM matches 
WHERE created_at < $1  -- cursor value
ORDER BY created_at DESC 
LIMIT 20;  -- Scans exactly 20 rows
```

### Connection Pooling

```javascript
// Configure PgBouncer for connection pooling
// pgbouncer.ini
[databases]
celadon = host=celadon-db.rds.amazonaws.com port=5432 dbname=celadon

[pgbouncer]
listen_port = 6432
max_client_conn = 100
default_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
idle_in_transaction_session_timeout = 60000
```

### Table Partitioning

```sql
-- Partition large audit_logs table by date
CREATE TABLE audit_logs_2026_08 PARTITION OF audit_logs
FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- This improves query performance on date ranges
SELECT * FROM audit_logs 
WHERE created_at >= '2026-08-01' 
AND created_at < '2026-09-01';
```

### Maintenance Operations

```sql
-- Vacuum and analyze (daily, off-peak)
VACUUM ANALYZE users;
VACUUM ANALYZE tournaments;
VACUUM ANALYZE matches;

-- Monitor table bloat
SELECT schemaname, tablename, 
       ROUND(100 * (otta - floor(otta))::numeric, 2) AS table_waste_ratio
FROM pg_stat_user_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_waste_ratio DESC;

-- Reindex if necessary
REINDEX TABLE tournaments;
```

---

## Application Optimization

### Connection Pooling

```javascript
// Configure Prisma connection pool
// .env.production
DATABASE_URL="postgresql://user:password@host/db?schema=public&connection_limit=20"

// In code
const prisma = new PrismaClient({
  connectionLimit: 20,
  idleTimeout: 30000,
});
```

### Batch Operations

```javascript
// Before: Multiple individual updates
for (const userId of userIds) {
  await db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [userId]);
}

// After: Single batch update
await db.query(`
  UPDATE users 
  SET last_login = NOW() 
  WHERE user_id = ANY($1)
`, [userIds]);
```

### Memory Optimization

```javascript
// Use streams for large data processing
app.get('/export/results', (req, res) => {
  const stream = db.query('SELECT * FROM match_results');
  
  stream.pipe(res);
  
  stream.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

// Process large arrays in chunks
const chunkSize = 1000;
for (let i = 0; i < largeArray.length; i += chunkSize) {
  const chunk = largeArray.slice(i, i + chunkSize);
  await processChunk(chunk);
}
```

---

## Cache Optimization

### Cache Strategy

```javascript
// Multi-level caching strategy
async function getTournament(id) {
  // L1: In-memory cache (application)
  if (appCache.has(id)) return appCache.get(id);
  
  // L2: Redis cache (process-agnostic)
  const cached = await redis.get(`tournament:${id}`);
  if (cached) {
    appCache.set(id, cached);
    return cached;
  }
  
  // L3: Database query
  const data = await db.query('SELECT * FROM tournaments WHERE tournament_id = ?', [id]);
  
  // Store in both cache layers
  await redis.set(`tournament:${id}`, data, 'EX', 3600);  // 1 hour TTL
  appCache.set(id, data);
  
  return data;
}
```

### Cache Invalidation

```javascript
// Proper cache invalidation on updates
async function updateTournament(id, updates) {
  // Update database
  const result = await db.query(
    'UPDATE tournaments SET ? WHERE tournament_id = ?',
    [updates, id]
  );
  
  // Invalidate caches
  await redis.del(`tournament:${id}`);
  appCache.delete(id);
  
  // Invalidate parent cache (tournament list)
  await redis.del('tournaments:list');
  
  return result;
}
```

### Cache Preloading

```bash
# Preload frequently accessed data into cache on startup
npm run cache:preload

# Example: Load top 100 clubs into cache
redis-cli EVAL "
  local clubs = redis.call('EVAL', ...)
  for i, club in ipairs(clubs) do
    redis.call('SET', 'club:' .. club.id, club, 'EX', 3600)
  end
  return clubs
" 0
```

---

## API Performance

### Response Compression

```javascript
// Enable gzip compression
const compression = require('compression');
app.use(compression({
  level: 6,  // Balanced compression level
  threshold: 1024,  // Only compress responses > 1KB
}));
```

### Field Selection (GraphQL)

```graphql
# Inefficient: Returns all fields
query {
  tournaments {
    id
    name
    description
    rules
    prize_pool
    created_at
    updated_at
  }
}

# Efficient: Only requested fields
query {
  tournaments {
    id
    name
  }
}
```

### Pagination Optimization

```javascript
// Cursor-based pagination
app.get('/api/tournaments', async (req, res) => {
  const cursor = req.query.cursor || null;
  const limit = Math.min(req.query.limit || 20, 100);
  
  const query = `
    SELECT * FROM tournaments 
    ${cursor ? 'WHERE tournament_id > ?' : ''}
    ORDER BY tournament_id
    LIMIT ?
  `;
  
  const params = cursor ? [cursor, limit] : [limit];
  const results = await db.query(query, params);
  
  res.json({
    data: results,
    next_cursor: results.length > 0 ? results[results.length - 1].id : null,
  });
});
```

### Rate Limiting & Throttling

```javascript
// Implement rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests' });
  },
});

app.use('/api/', limiter);
```

---

## Frontend Performance

### Asset Optimization

```html
<!-- Code splitting: Load only what's needed -->
<script src="bundle.js" async defer></script>
<link rel="preload" href="critical.css" as="style">
<link rel="prefetch" href="future-page.js">

<!-- Image optimization -->
<picture>
  <source srcset="large.webp" type="image/webp" media="(min-width: 960px)">
  <img src="large.jpg" alt="Tournament">
</picture>
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Target bundle sizes:
# JavaScript: < 50 KB (gzipped)
# CSS: < 20 KB (gzipped)
# Images: < 200 KB total (optimized)
```

---

## Infrastructure Optimization

### Container Resource Limits

```yaml
# Set appropriate resource limits to prevent overload
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celadon-api
spec:
  containers:
  - name: api
    resources:
      requests:
        cpu: 500m
        memory: 512Mi
      limits:
        cpu: 1000m
        memory: 1Gi
```

### Horizontal Pod Autoscaling

```yaml
# Auto-scale based on metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: celadon-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: celadon-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Instance Sizing

```
Current Workload:
- Transactions/sec: 500
- Concurrent connections: 50
- Data size: 100 GB

Recommended Instance:
- DB Instance: db.r5.xlarge (4 vCPU, 32 GB RAM)
- Storage: 200 GB (gp3) with 3000 IOPS
- Multi-AZ: Yes for redundancy
```

---

## Monitoring & Metrics

### Key Performance Indicators

```javascript
// Track important metrics
const metrics = {
  apiLatency: {
    p50: 50,  // milliseconds
    p95: 200,
    p99: 500,
  },
  errorRate: 0.05,  // percentage
  cacheHitRate: 87,  // percentage
  throughput: 800,  // requests/second
  dbQueryTime: {
    p50: 10,
    p95: 50,
  },
};
```

### Performance Dashboard

```
Create monitoring dashboard with:
- API Response Time (p50, p95, p99)
- Error Rate (by endpoint, by service)
- Cache Hit Rate
- Database Query Time
- CPU/Memory Utilization
- Throughput (requests/sec)
- Active Connections
- Disk Usage
```

### Profiling

```bash
# Node.js CPU profiling
node --prof --prof-process app.js

# Memory profiling with heapdump
npm install heapdump
# Trigger: kill -USR2 <pid>

# Flame graphs
npm install autocannon 0x
npx autocannon http://localhost:3000
npx 0x ./dist/index.js
```

---

## Performance Testing

### Load Testing Script

```bash
#!/bin/bash
# load-test.sh

CONCURRENCY=${1:-100}
DURATION=${2:-300}
TARGET_URL=${3:-https://api.celadontennis.com}

echo "Starting load test..."
echo "Concurrency: $CONCURRENCY"
echo "Duration: $DURATION seconds"
echo "Target: $TARGET_URL"

npx k6 run --vus $CONCURRENCY --duration ${DURATION}s ./load-test.js \
  --env TARGET_URL=$TARGET_URL \
  --env RESULTS_FILE=./results-$(date +%s).json

echo "Load test completed"
```

### Performance Regression Testing

```bash
# Run performance tests as part of CI/CD
npm run test:performance

# Compare against baseline
npm run perf:compare -- \
  --baseline=./baseline.json \
  --current=./current.json \
  --threshold=10  # 10% regression threshold
```

---

**Contact**: Performance Engineering Lead  
**Last Updated**: August 24, 2026
