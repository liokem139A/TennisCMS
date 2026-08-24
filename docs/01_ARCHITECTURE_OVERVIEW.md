# Celadon Tennis CMS - Architecture Overview

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Status:** Phase 1 Production-Ready

---

## Executive Summary

The Celadon Tennis CMS is a modern, scalable cloud-native platform designed to deliver a comprehensive digital tennis community and tournament management experience. This document provides the complete technical architecture, service interactions, and system design principles for Phase 1 execution.

### Key Architecture Goals
- **Scalability**: Support 50,000+ concurrent users by Q4 2026
- **Reliability**: 99.9% uptime SLA with automatic failover
- **Security**: Enterprise-grade authentication, encryption, and compliance
- **Performance**: Sub-200ms API response times at p95
- **Maintainability**: Infrastructure-as-Code, automated deployments, comprehensive monitoring

---

## System Architecture

### 1. High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Web Browser  │  │ Mobile iOS   │  │ Mobile And   │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼───────────────────┼───────────────────┼─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│                    API Gateway Layer                               │
│  • Rate limiting & DDoS protection                                │
│  • Request/response transformation                                │
│  • Authentication routing                                         │
│  • Load balancing                                                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼───────┐ ┌──────▼──────┐ ┌─────▼────────┐
│ Auth Service  │ │ Core API    │ │Tournament MS │
│               │ │ Gateway     │ │              │
│ • OAuth 2.0   │ │             │ │ • Scheduling │
│ • JWT tokens  │ │ • REST APIs │ │ • Results    │
│ • Sessions    │ │ • GraphQL   │ │ • Rankings   │
└───────┬───────┘ └──────┬──────┘ └─────┬────────┘
        │                │              │
        └────────────────┼──────────────┘
                         │
┌─────────────────────────▼──────────────────────────────────────────┐
│                    Business Logic Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ User Service │  │ Club Service │  │ Event        │            │
│  │              │  │              │  │ Management   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Match Service│  │ Search Svc   │  │ Notification │            │
│  │              │  │              │  │ Service      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└────────────────────────┬──────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────────┐
        │                │                    │
┌───────▼────────┐ ┌─────▼──────┐ ┌──────────▼──────┐
│ Primary DB     │ │ Cache Layer│ │ Message Queue  │
│ (PostgreSQL)   │ │ (Redis)    │ │ (RabbitMQ/SQS) │
│                │ │            │ │                │
│ • User Data    │ │ • Sessions │ │ • Async Tasks  │
│ • Matches      │ │ • API Data │ │ • Notifications│
│ • Events       │ │ • Leaderboard
│ • Clubs        │ │             
└────────────────┘ └────────────┘ └────────────────┘
        │                │              │
        └────────────────┼──────────────┘
                         │
┌─────────────────────────▼──────────────────────────────────────────┐
│                    Infrastructure Layer                            │
│  • Kubernetes Cluster (EKS on AWS)                               │
│  • Auto-scaling groups                                            │
│  • Multi-AZ deployment                                            │
│  • CloudFront CDN for static assets                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Architecture

### Auth Service
- **Purpose**: Centralized authentication and authorization
- **Technologies**: Node.js, JWT, OAuth 2.0
- **Database**: Dedicated PostgreSQL schema
- **Key Operations**:
  - User registration and login
  - Session management
  - Token refresh and revocation
  - Social login (Google, Facebook)

### Core API Gateway
- **Purpose**: REST and GraphQL interface for all client applications
- **Technologies**: Express.js, Apollo Server
- **Responsibilities**:
  - Route requests to appropriate microservices
  - Request/response transformation
  - Authentication verification
  - Rate limiting and throttling

### Tournament Management Service
- **Purpose**: Handle tournament lifecycle management
- **Technologies**: Node.js, Express
- **Features**:
  - Tournament creation and configuration
  - Match scheduling and seeding
  - Results recording and validation
  - Ranking calculations

### User Service
- **Purpose**: User profile and preference management
- **Features**:
  - Profile creation and updates
  - Skill level tracking
  - Preference management
  - Social connections

### Club Service
- **Purpose**: Tennis club management and administration
- **Features**:
  - Club profiles and memberships
  - Facility management
  - Event hosting capabilities
  - Inventory tracking

### Event Management Service
- **Purpose**: General event coordination across the platform
- **Features**:
  - Event creation and lifecycle
  - Ticket management
  - Registration tracking
  - Sponsorship coordination

### Notification Service
- **Purpose**: Multi-channel user notifications
- **Technologies**: Node.js, Kafka/RabbitMQ, SendGrid, Twilio
- **Channels**:
  - Email notifications
  - SMS alerts
  - In-app push notifications
  - Webhook delivery

---

## 3. Data Layer Architecture

### Primary Database - PostgreSQL
- **Deployment**: AWS RDS Multi-AZ
- **Backup**: Automated daily snapshots + WAL archival
- **Replication**: Synchronous replication to standby
- **Key Tables**:
  ```
  users
  user_profiles
  clubs
  tournaments
  matches
  rankings
  events
  registrations
  notifications
  audit_logs
  ```

### Cache Layer - Redis
- **Deployment**: AWS ElastiCache Multi-AZ
- **Use Cases**:
  - Session storage
  - API response caching
  - Leaderboard computation
  - Rate limiting counters
- **TTL Strategy**:
  - Sessions: 30 days (sliding window)
  - API cache: 5-60 minutes (vary by endpoint)
  - Leaderboards: 1 hour

### Message Queue - RabbitMQ/AWS SQS
- **Use Cases**:
  - Asynchronous notification delivery
  - Report generation
  - Data aggregation tasks
  - Scheduled jobs

---

## 4. Deployment Architecture

### Container Orchestration - Kubernetes (EKS)
- **Cluster Configuration**:
  - Multi-AZ deployment across 3 availability zones
  - Auto-scaling node groups (3-30 nodes)
  - Network policies for service-to-service communication
  - Persistent volume provisioning

### Service Deployment Pattern
- **Rolling Updates**: Zero-downtime deployments
- **Health Checks**: Liveness and readiness probes
- **Resource Limits**: CPU and memory constraints per service
- **Log Aggregation**: CloudWatch + ELK stack

### Ingress & Load Balancing
- **AWS Load Balancer Controller**: Ingress management
- **Application Load Balancer (ALB)**:
  - SSL/TLS termination
  - Path-based routing
  - WebSocket support
  - Sticky sessions for real-time features

---

## 5. Security Architecture

### Authentication Flow
```
1. User logs in via OAuth 2.0 or username/password
2. Auth Service validates credentials
3. JWT token issued with claims:
   - user_id
   - email
   - roles
   - permissions
   - exp (expiration)
4. Token stored in client (secure HttpOnly cookie)
5. Token validated on each API request
```

### Authorization Model
- **Role-Based Access Control (RBAC)**:
  - Admin: Full platform access
  - Club Manager: Club-level administration
  - Organizer: Event organization capabilities
  - Player: Participation and profile management
  
- **Resource-Level Permissions**: Granular access to specific resources

### Data Security
- **Encryption in Transit**: TLS 1.3 for all communications
- **Encryption at Rest**: 
  - Database: AWS RDS encryption
  - S3 buckets: AES-256 encryption
- **API Key Management**: Secure credential rotation every 90 days
- **Secrets Management**: AWS Secrets Manager for sensitive configuration

---

## 6. Integration Points

### External Service Integrations
- **Payment Processing**: Stripe API for ticket/merchandise payments
- **Email Delivery**: SendGrid for transactional emails
- **SMS Notifications**: Twilio for SMS delivery
- **Social Networks**: Facebook, Google OAuth
- **Analytics**: Mixpanel for user analytics
- **Monitoring**: DataDog for performance monitoring

### Webhook Support
- **Stripe Webhooks**: Payment events
- **SendGrid Webhooks**: Email delivery status
- **Custom Webhooks**: Partner integrations

---

## 7. Performance Optimization

### Caching Strategy
1. **Browser Cache**: Static assets with long TTL
2. **CDN Cache**: CloudFront with 1-24 hour TTL
3. **Application Cache**: Redis for session and computed data
4. **Database Query Cache**: Query result caching for frequent queries

### Database Optimization
- **Indexing Strategy**:
  - Composite indexes on frequently joined columns
  - Partial indexes for filtered queries
  - B-tree indexes on range queries
  
- **Query Optimization**:
  - Connection pooling (PgBouncer)
  - Prepared statements to prevent SQL injection
  - Query analysis and EXPLAIN plans

### API Performance
- **Pagination**: Cursor-based pagination for large datasets
- **Field Selection**: GraphQL field selection to reduce payload
- **Compression**: Gzip compression for API responses
- **Response Caching**: HTTP caching headers

---

## 8. Monitoring & Observability

### Metrics Collection
- **Application Metrics**:
  - Request latency (p50, p95, p99)
  - Error rates by endpoint
  - Throughput (requests per second)
  - Service-specific metrics

- **Infrastructure Metrics**:
  - Node CPU and memory utilization
  - Network I/O
  - Disk usage and I/O
  - Pod restart counts

### Logging Strategy
- **Application Logs**: Structured JSON logs to CloudWatch
- **Access Logs**: ALB access logs for auditing
- **Audit Logs**: Database audit trail for compliance
- **Log Retention**: 90 days for normal logs, 1 year for audit logs

### Alerting
- **Critical Alerts**:
  - Service down/unreachable
  - Error rate > 1%
  - API latency > 500ms (p95)
  - Database connection pool exhaustion
  
- **Warning Alerts**:
  - High memory usage (>80%)
  - Disk usage (>85%)
  - Error rate > 0.1%

---

## 9. Disaster Recovery

### RTO & RPO Targets
- **RTO** (Recovery Time Objective): 15 minutes
- **RPO** (Recovery Point Objective): 5 minutes

### Backup Strategy
- **Database**: Continuous WAL archival + daily snapshots
- **Configuration**: Infrastructure-as-Code in git repository
- **Secrets**: Encrypted backup in Secrets Manager
- **Static Assets**: CloudFront origin backup in S3 with versioning

### Failover Procedures
- **Automatic**: Database failover to standby (< 30 seconds)
- **Manual**: Service restart on healthy nodes
- **Regional**: Documented procedures for regional failover

---

## 10. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React, Vue.js | Web and mobile UI |
| API | Node.js, Express | REST APIs |
| API (GraphQL) | Apollo Server | GraphQL APIs |
| Auth | JWT, OAuth 2.0 | Authentication |
| Database | PostgreSQL | Primary data store |
| Cache | Redis | Session and cache |
| Queue | RabbitMQ/SQS | Async processing |
| Container | Docker | Containerization |
| Orchestration | Kubernetes (EKS) | Container orchestration |
| Load Balancer | AWS ALB | Traffic distribution |
| CDN | CloudFront | Static asset delivery |
| Monitoring | DataDog | Performance monitoring |
| Logging | CloudWatch/ELK | Log aggregation |

---

## 11. Development Environment Architecture

### Local Development Stack
- Docker Compose for local PostgreSQL, Redis, RabbitMQ
- Node.js development server with hot reload
- Database migrations managed via Liquibase
- Environment variables for configuration

### Testing Architecture
- Unit tests: Jest framework
- Integration tests: Docker containers for dependencies
- Load testing: k6 or Apache JMeter
- End-to-end tests: Cypress or Playwright

---

## 12. Version Control & Release Management

### Git Workflow
- Main branch: Production-ready code
- Development branch: Integration branch for features
- Feature branches: Individual feature development
- Release branches: Release preparation and hotfixes

### Release Process
1. Feature merge to development
2. Integration testing on staging
3. Release branch creation
4. Deployment to production
5. Post-deployment monitoring

---

## Next Steps

1. Review infrastructure provisioning via Terraform
2. Examine deployment pipelines in CI/CD documentation
3. Study database schema and relationships in schema documentation
4. Review API endpoints in API reference documentation
5. Follow deployment runbook for first-time setup

---

**Contact**: Backend & Infrastructure Lead (backend@celadontennis.com)
