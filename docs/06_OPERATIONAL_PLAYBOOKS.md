# Celadon Tennis CMS - Operational Playbooks

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Audience:** Operations, DevOps, On-call Engineers

---

## Table of Contents

1. [Daily Operational Tasks](#daily-operational-tasks)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Incident Response Procedures](#incident-response-procedures)
4. [Backup & Recovery](#backup--recovery)
5. [Scaling Operations](#scaling-operations)
6. [On-Call Responsibilities](#on-call-responsibilities)
7. [Change Management](#change-management)
8. [Disaster Recovery](#disaster-recovery)

---

## Daily Operational Tasks

### Morning Standup (9:00 AM UTC)

**Duration**: 15 minutes

```
1. Review overnight monitoring alerts
2. Check deployment status from previous day
3. Verify all production services are healthy
4. Confirm today's planned maintenance
5. Communicate any issues to team
```

**Checklist**:
```
☐ Check DataDog dashboard for overnight alerts
☐ Review PagerDuty incident log
☐ Verify API response times (p95 < 200ms)
☐ Verify error rate (< 0.1%)
☐ Check database query performance
☐ Confirm SSL certificate validity
☐ Review log aggregation for errors
☐ Confirm all team members aware of day's tasks
```

### Mid-Day Health Check (1:00 PM UTC)

```bash
# Quick health verification
curl https://api.celadontennis.com/health
curl https://api.celadontennis.com/v1/status

# Check system metrics
datadog_cli metrics summary --time 1h

# Check error tracking
sentry_cli releases list

# Verify database performance
# Check for slow queries
psql -h $PGHOST -U celadon_admin -c "
  SELECT query, mean_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# Check active connections
psql -h $PGHOST -U celadon_admin -c "
  SELECT datname, numbackends 
  FROM pg_stat_database 
  WHERE datname = 'celadon';
"
```

### Evening Verification (6:00 PM UTC)

```
1. Review metrics from last 24 hours
2. Check for degradation patterns
3. Verify nightly backup completion
4. Prepare next-day maintenance window (if scheduled)
5. Sign off on day's operations
```

### Database Maintenance

```bash
# Daily VACUUM (off-peak hours, typically 2 AM UTC)
VACUUM ANALYZE users;
VACUUM ANALYZE tournaments;
VACUUM ANALYZE matches;

# Check for unused indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename, indexname;

# Monitor table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Monitoring & Alerting

### Key Metrics Dashboard

```
CPU Usage:
- Target: < 70% average
- Alert threshold: > 85%

Memory Usage:
- Target: < 75% average
- Alert threshold: > 90%

API Latency (p95):
- Target: < 200ms
- Alert threshold: > 500ms

Error Rate:
- Target: < 0.05%
- Alert threshold: > 0.5%

Database Connections:
- Target: < 50 of 100
- Alert threshold: > 80

Cache Hit Rate:
- Target: > 85%
- Alert threshold: < 70%

Disk Usage:
- Target: < 60% of allocated
- Alert threshold: > 80%
```

### Alert Routing

**Critical Alerts** (immediate escalation):
- API service down
- Database connection lost
- Error rate > 1%
- Disk space < 10% remaining

→ **Escalation Path**: On-call Engineer → Engineering Lead → CTO

**High Priority Alerts** (within 15 minutes):
- API latency > 1 second
- Memory usage > 90%
- Database query timeout
- Cache layer offline

→ **Escalation Path**: On-call Engineer → Engineering Lead

**Normal Alerts** (within 1 hour):
- API latency 500-1000ms
- Minor memory spikes
- Log ingestion delays
- Non-critical service degradation

→ **Resolution Path**: On-call Engineer

### Setting Up Alerts in DataDog

```yaml
# Example DataDog monitor
name: "API Response Time - High Latency"
type: "metric_alert"
query: "avg:trace.express.request.duration{*}"
thresholds:
  critical: 500  # milliseconds
  warning: 200
alert_message: |
  {{#is_alert}}
  API latency high: {{ value }}ms
  {{/is_alert}}
notify_list:
  - "@on-call-slack-channel"
  - "@pagerduty"
```

---

## Incident Response Procedures

### Severity Levels

| Level | Definition | Response Time | SLA |
|-------|-----------|----------------|-----|
| S1 (Critical) | Complete service outage affecting all users | 5 min | 1 hour resolution |
| S2 (High) | Significant service degradation affecting 10%+ users | 15 min | 4 hours resolution |
| S3 (Medium) | Minor service issues affecting <10% users | 1 hour | 8 hours resolution |
| S4 (Low) | Non-critical issues, cosmetic bugs | 4 hours | 48 hours resolution |

### S1: Critical Incident Response

```
T+0:00 - INCIDENT DECLARED
  1. Page on-call engineer
  2. Create incident in PagerDuty
  3. Start war room Zoom call
  4. Page Engineering Lead
  5. Notify CEO and Product

T+0:05 - INITIAL ASSESSMENT
  1. Identify affected services
  2. Check monitoring dashboards
  3. Review recent deployments
  4. Gather initial metrics

T+0:15 - MITIGATION STARTED
  1. Implement quick fix or rollback
  2. Scale up resources if needed
  3. Communicate status to team
  4. Update incident status in Slack

T+0:30 - POST-INCIDENT
  1. Verify service is stable
  2. Document root cause
  3. Plan permanent fix
  4. Schedule post-mortem within 24 hours

INCIDENT COMMUNICATION TEMPLATE:
[Incident #123] API DOWN - 5 min read
Users cannot create tournaments
ETA to resolution: 10 minutes
Root cause: Database connection pool exhausted
Action: Restarting API pods
```

### S2: High Priority Response

```
T+0:00 - Alert received
T+0:05 - Acknowledge and investigate
T+0:15 - Determine root cause
T+0:30 - Implement fix
T+1:00 - Verify fix and monitor
T+2:00 - Document and close
```

### Quick Fixes Reference

**API Service Down**:
```bash
# Check pod status
kubectl get pods -n production | grep api

# Check logs
kubectl logs -n production deployment/celadon-api --tail=100

# Restart deployment
kubectl rollout restart deployment/celadon-api -n production

# Wait for rollout
kubectl rollout status deployment/celadon-api -n production --timeout=5m
```

**Database Connection Issues**:
```bash
# Check active connections
psql -h $PGHOST -c "SELECT * FROM pg_stat_activity;"

# Kill idle connections
psql -h $PGHOST -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';"

# Restart connection pooler
kubectl restart pod -n production pgbouncer-pool

# Scale down and up
kubectl scale deployment/celadon-api --replicas=0 -n production
sleep 30
kubectl scale deployment/celadon-api --replicas=3 -n production
```

**High Memory Usage**:
```bash
# Check memory by pod
kubectl top pods -n production | sort -k3 -n

# Restart high-memory pod
kubectl restart pod -n production celadon-api-xyz

# Check for memory leaks
kubectl logs -n production deployment/celadon-api | grep -i "memory\|leak"

# Scale up resources
kubectl scale deployment/celadon-api --replicas=5 -n production
```

---

## Backup & Recovery

### Backup Schedule

```
Daily Backups: 2:00 AM UTC
- Full database snapshot
- Retention: 30 days

Weekly Backups: Sunday 3:00 AM UTC
- Full database backup
- Configuration backup
- Retention: 90 days

Monthly Backups: 1st of month 4:00 AM UTC
- Full system backup
- Retention: 1 year
```

### Backup Verification

```bash
# List recent backups
aws rds describe-db-snapshots \
  --db-instance-identifier celadon-prod \
  --query 'DBSnapshots[0:5]'

# Verify backup integrity
aws rds describe-db-snapshots \
  --snapshot-identifier celadon-prod-backup-2026-08-24 \
  --query 'DBSnapshots[0].[DBSnapshotIdentifier,SnapshotCreateTime,Status]'

# Test restore (on staging)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier celadon-prod-restore-test \
  --db-snapshot-identifier celadon-prod-backup-2026-08-24
```

### Recovery Procedures

**Point-in-Time Recovery (last 7 days)**:
```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier celadon-prod \
  --target-db-instance-identifier celadon-prod-pit-$(date +%s) \
  --restore-time 2026-08-24T10:00:00Z \
  --use-latest-restorable-time
```

**Testing Recovery**:
```bash
# Restore to test instance
./scripts/restore-db-test.sh

# Verify data integrity
psql -h test-db.rds.amazonaws.com -U celadon_admin -d celadon -c "
  SELECT COUNT(*) as total_users FROM users;
  SELECT COUNT(*) as total_tournaments FROM tournaments;
  SELECT COUNT(*) as total_matches FROM matches;
"

# Check data freshness
psql -h test-db.rds.amazonaws.com -U celadon_admin -d celadon -c "
  SELECT MAX(created_at) FROM users;
  SELECT MAX(created_at) FROM matches;
"

# Destroy test instance
aws rds delete-db-instance \
  --db-instance-identifier celadon-prod-pit-test \
  --skip-final-snapshot
```

---

## Scaling Operations

### Auto-Scaling Policies

```yaml
# API Service Auto-scaling
MinReplicas: 3
MaxReplicas: 20
Target CPU Utilization: 70%
Target Memory Utilization: 80%
Scale-up increment: +2 replicas
Scale-down decrement: -1 replica
Scale-up cooldown: 2 minutes
Scale-down cooldown: 10 minutes

# Database Scaling
Auto-minor-version upgrade: Enabled
Storage auto-scaling: Enabled (max 1000 GB)
Multi-AZ: Enabled
Failover priority: 2
```

### Manual Scaling

```bash
# Scale API instances
kubectl scale deployment/celadon-api --replicas=10 -n production

# Monitor scaling
kubectl get hpa -n production

# Check status
kubectl get deployment celadon-api -n production

# Scale down after peak
kubectl scale deployment/celadon-api --replicas=3 -n production
```

### Capacity Planning

```bash
# Current usage
Current Peak Requests/sec: 500
Current Average Latency: 150ms
Current CPU utilization: 65%
Current Memory utilization: 72%

# Projected usage (next 6 months)
Target Peak Requests/sec: 1500 (3x growth)
Expected Latency Impact: 200-250ms
Required CPU capacity: 2x current
Required Memory capacity: 2x current
Required Storage capacity: 3x current

# Action Items:
- Plan database upgrade to larger instance
- Prepare Kubernetes node group expansion
- Review Redis memory allocation
```

---

## On-Call Responsibilities

### Weekly Schedule

```
Monday 9 AM - Friday 5 PM (Business Hours):
- Primary: On-call Engineer A
- Secondary: On-call Engineer B

Friday 5 PM - Monday 9 AM (Off-Hours):
- Primary: On-call Engineer C
- Secondary: On-call Engineer D
```

### Escalation Contacts

```
Level 1 - On-call Engineer
- Response time: < 5 minutes (via PagerDuty)
- Page via: SMS + Slack

Level 2 - Engineering Lead
- Response time: < 15 minutes
- Page via: Phone call

Level 3 - CTO
- Response time: < 30 minutes
- Page via: Phone call (critical only)

Level 4 - CEO (S1 only)
- Response time: < 30 minutes
- Page via: CEO notification
```

### Handover Checklist

When passing off on-call duties:
```
☐ Review incidents from last 24 hours
☐ Highlight any ongoing issues
☐ Share dashboard links
☐ Brief on any scheduled maintenance
☐ Confirm contact information is current
☐ Test PagerDuty access
☐ Verify phone number is correct
☐ Confirm understood escalation procedures
```

---

## Change Management

### Pre-Deployment Checklist

```
Code Quality:
☐ All tests passing
☐ Code review completed
☐ No new security vulnerabilities
☐ Performance benchmarks acceptable

Infrastructure:
☐ Database backups current
☐ Deployment environments healthy
☐ Sufficient capacity for deployment
☐ Secrets/credentials rotated

Communication:
☐ Stakeholders notified
☐ Maintenance window scheduled (if needed)
☐ Rollback procedure documented
☐ On-call engineer briefed
```

### Deployment Blackout Periods

**NO deployments allowed during**:
- Friday 4 PM - Monday 9 AM UTC
- September 1 - September 30 (Quarter end)
- December 20 - January 5 (Holiday period)
- Any planned maintenance windows
- During active S1 incidents

### Post-Deployment Validation

```bash
# 1. Immediate validation (T+0 to T+5 min)
curl https://api.celadontennis.com/health

# 2. Service validation (T+5 to T+15 min)
npm run test:smoke -- --env=production

# 3. Full validation (T+15 min to T+30 min)
npm run test:integration -- --env=production

# 4. Continuous monitoring (T+30 min to T+2h)
# Monitor:
# - Error rates
# - API latency
# - Database query performance
# - Cache hit rates
# - User session rates
```

---

## Disaster Recovery

### RTO & RPO Targets

```
Regional Failure:
- RTO: 30 minutes (recover to secondary region)
- RPO: 5 minutes (maximum data loss)

Full Data Center Failure:
- RTO: 1 hour (activate disaster recovery site)
- RPO: 1 hour (from last backup)

Database Corruption:
- RTO: 15 minutes (restore from snapshot)
- RPO: 5 minutes (point-in-time recovery)
```

### DR Procedures

**Activate Disaster Recovery**:
```bash
# 1. Confirm primary region is unreachable
ping primary-api.celadontennis.com

# 2. Fail over DNS to secondary region
./scripts/activate-dr-dns.sh

# 3. Restore database from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier celadon-dr \
  --db-snapshot-identifier celadon-prod-latest

# 4. Scale up secondary region
kubectl scale deployment/celadon-api --replicas=10 -n production-dr

# 5. Run smoke tests
npm run test:smoke -- --env=production-dr

# 6. Notify stakeholders
# Post to war room and send notifications
```

---

**Contact**: On-call Engineer  
**Escalation**: PagerDuty service page  
**Last Updated**: August 24, 2026
