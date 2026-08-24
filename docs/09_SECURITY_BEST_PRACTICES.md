# Celadon Tennis CMS - Security Best Practices

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Classification**: Confidential
**Audience**: All Engineering, Security Team, DevOps

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Network Security](#network-security)
5. [Application Security](#application-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Incident Response](#incident-response)
8. [Compliance & Auditing](#compliance--auditing)

---

## Security Overview

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Users/services get minimum necessary permissions
3. **Zero Trust Architecture**: Verify all access, never trust implicitly
4. **Secure by Default**: Security features enabled by default
5. **Assume Breach Mentality**: Design systems assuming breach is possible

### Security Roles & Responsibilities

| Role | Responsibilities |
|------|------------------|
| Security Lead | Overall security strategy, incident response, compliance |
| Backend/Infra Lead | Infrastructure security, secrets management, access control |
| Developers | Secure coding practices, vulnerability assessment |
| DevOps | CI/CD security, deployment security, monitoring |
| All Engineers | Regular training, vulnerability reporting, incident participation |

---

## Authentication & Authorization

### Password Policy

```
Minimum Length: 12 characters
Complexity: Must contain uppercase, lowercase, numbers, and symbols
Expiration: 90 days (with change required)
History: Cannot reuse last 5 passwords
Lockout: 5 failed attempts → 30 minute lockout
```

### Implementing Secure Authentication

```javascript
// Use bcrypt with appropriate salt rounds
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Store password hash, never plain text
const user = await User.create({
  email: 'user@example.com',
  password_hash: await hashPassword(password),
});
```

### JWT Token Security

```javascript
// Configure JWT with secure settings
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: user.user_id,
    email: user.email,
    roles: user.roles,
  },
  process.env.JWT_SECRET,
  {
    algorithm: 'HS256',
    expiresIn: '1h',  // Short-lived access tokens
    issuer: 'https://auth.celadontennis.com',
    audience: 'celadon-api',
  }
);

// Verify token on every request
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'https://auth.celadontennis.com',
      audience: 'celadon-api',
    });
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
});
```

### OAuth 2.0 Best Practices

```
- Use Authorization Code flow (not implicit)
- Redirect URIs must be whitelisted
- State parameter required to prevent CSRF
- PKCE required for mobile/SPA clients
- Refresh tokens must be secure HttpOnly cookies
- Token revocation supported
```

### Role-Based Access Control (RBAC)

```javascript
// Define roles with permissions
const roles = {
  'player': ['read:tournaments', 'read:matches', 'write:profile'],
  'organizer': ['create:tournaments', 'update:tournaments', 'create:matches'],
  'club_manager': ['manage:club', 'manage:memberships', 'manage:courts'],
  'admin': ['*'],  // All permissions
};

// Enforce permissions at API layer
function authorize(...permissions) {
  return async (req, res, next) => {
    const userRoles = req.user.roles || [];
    const hasPermission = permissions.some(perm =>
      userRoles.some(role => 
        roles[role].includes('*') || roles[role].includes(perm)
      )
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.post('/tournaments', 
  authorize('create:tournaments'),
  createTournamentHandler
);
```

---

## Data Protection

### Encryption in Transit

```javascript
// Enforce HTTPS only
app.use((req, res, next) => {
  if (req.protocol !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// Set security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// TLS 1.3+ only
const tls = require('tls');
const TLS_MIN_VERSION = tls.DEFAULT_MIN_VERSION;  // TLS 1.2+
```

### Encryption at Rest

```yaml
# Database encryption (AWS RDS)
Engine: postgres
StorageEncrypted: true
KmsKeyId: arn:aws:kms:region:account:key/xxxx

# S3 bucket encryption
BucketEncryption:
  Rules:
    - ApplyServerSideEncryptionByDefault:
        SSEAlgorithm: AES256

# Secrets Manager encryption
SecretEncryptionKey: 'aws/secretsmanager'
```

### Sensitive Data Handling

```javascript
// Never log sensitive data
function sanitizeLog(data) {
  const sensitiveFields = ['password', 'token', 'api_key', 'secret'];
  const sanitized = JSON.parse(JSON.stringify(data));
  
  for (const key in sanitized) {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
}

// Secure deletion
const secureDelete = require('secure-delete');

async function deleteUserData(userId) {
  // Securely delete from database
  await User.destroy({ where: { user_id: userId } });
  
  // Securely delete from cache
  await redis.del(`user:${userId}`);
  
  // Securely delete backups (compliance)
  // Document in compliance log
}
```

### Secrets Management

```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name celadon/jwt-secret \
  --secret-string "$(openssl rand -base64 32)"

# Rotate secrets every 90 days
aws secretsmanager rotate-secret \
  --secret-id celadon/jwt-secret \
  --rotation-rules AutomaticallyAfterDays=90

# Retrieve secrets in code
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  try {
    const secret = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise();
    return JSON.parse(secret.SecretString);
  } catch (err) {
    console.error('Error retrieving secret:', err);
    process.exit(1);
  }
}
```

---

## Network Security

### Firewall Rules

```
Inbound:
  - Port 443 (HTTPS): All (0.0.0.0/0)
  - Port 80 (HTTP): All → Redirect to HTTPS
  - Port 3306 (MySQL): Internal only (10.0.0.0/8)
  - Port 5432 (PostgreSQL): Internal only (10.0.0.0/8)
  - Port 6379 (Redis): Internal only (10.0.0.0/8)
  - SSH (22): Limited IPs only (VPN/bastion only)

Outbound:
  - All traffic to internet required
  - Log all external connections
```

### VPC Configuration

```yaml
VPC: 10.0.0.0/16
Subnets:
  Public: 10.0.1.0/24, 10.0.2.0/24  # ALB, NAT Gateway
  Private: 10.0.10.0/24, 10.0.11.0/24  # EKS, RDS
  Database: 10.0.20.0/24  # RDS only

Network ACLs:
  Inbound: Allow required ports
  Outbound: Allow all

Security Groups:
  ALB: Allow 80, 443 from internet
  EKS: Allow 10.0.0.0/16 for inter-pod communication
  RDS: Allow 5432 only from EKS security group
```

### DDoS Protection

```
AWS Shield Standard: Automatic (no cost)
AWS Shield Advanced:
  - Real-time attack diagnostics
  - Auto-scaling protection
  - Cost protection

Rate Limiting:
  Per-IP: 1000 req/hour
  Per-endpoint: 100 req/minute
  Burst allowance: 200 req/min for 5 minutes
```

---

## Application Security

### OWASP Top 10 Prevention

**1. Injection (SQL, NoSQL, OS)**
```javascript
// ❌ Vulnerable: String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Secure: Parameterized queries
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);

// ✅ Secure: ORM with built-in protection
const user = await User.findOne({ where: { email } });
```

**2. Broken Authentication**
```javascript
// ✅ Use industry-standard libraries
- Passport.js for authentication strategies
- jsonwebtoken for JWT handling
- bcryptjs for password hashing
- Multi-factor authentication (TOTP)
```

**3. Sensitive Data Exposure**
```javascript
// ✅ Encrypt PII
const encrypted = crypto.createCipheriv('aes-256-gcm', key, iv)
  .update(sensitiveData, 'utf8', 'hex')
  .final('hex');

// ✅ Mask sensitive data in logs
console.log(maskCreditCard('4532-1234-5678-9010'));  // 4532-****-****-9010
```

**4. XML External Entities (XXE)**
```javascript
// ❌ Vulnerable: Parse untrusted XML
const xml = require('xml2js');
const parser = new xml.Parser();
parser.parseString(userInput, (err, result) => {});

// ✅ Secure: Disable external entities
const parser = new xml.Parser({
  strict: false,
  resolveNamespaces: false,
  attrNameProcessors: [],
  tagNameProcessors: [],
  parseError: (err) => console.error(err),
});
```

**5. Broken Access Control**
```javascript
// ✅ Check authorization on every request
app.get('/tournaments/:id', authorize('read:tournament'), (req, res) => {
  // Verify user owns this resource
  const tournament = await Tournament.findById(req.params.id);
  if (tournament.organizer_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(tournament);
});
```

**6. Cross-Site Scripting (XSS)**
```javascript
// ❌ Vulnerable: Unsanitized output
res.send(`<div>${userInput}</div>`);

// ✅ Secure: HTML entity encoding
const escape = require('html-escape');
res.send(`<div>${escape(userInput)}</div>`);

// ✅ Secure: Content Security Policy
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'");
  next();
});
```

**7. Cross-Site Request Forgery (CSRF)**
```javascript
// ✅ Use CSRF tokens
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });

app.post('/tournaments',
  csrfProtection,
  (req, res) => {
    if (!req.csrfToken() === req.body._csrf) {
      return res.status(403).json({ error: 'CSRF token invalid' });
    }
    // Process request
  }
);
```

---

## Infrastructure Security

### Kubernetes Security

```yaml
# Pod Security Policy
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  runAsUser:
    rule: 'MustRunAsNonRoot'
  runAsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1000
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1000
        max: 65535
  readOnlyRootFilesystem: true

---
# Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: celadon-api-network-policy
spec:
  podSelector:
    matchLabels:
      app: celadon-api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: celadon-ingress
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: celadon-db
      ports:
        - protocol: TCP
          port: 5432
```

### Container Security

```bash
# Scan images for vulnerabilities
docker scan celadon-api:latest

# Use minimal base images
FROM node:18-alpine3.16
# instead of: FROM ubuntu:20.04

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Use read-only file system
ENV NODE_ENV=production
RUN chown -R nodejs:nodejs /app
```

---

## Incident Response

### Security Incident Procedures

**Upon Discovery**:
1. Isolate affected systems immediately
2. Page security team and on-call engineer
3. Preserve evidence (logs, memory dumps)
4. Document timeline and actions

**Investigation**:
1. Identify scope (what data/systems affected)
2. Determine root cause
3. Estimate time of breach/exposure
4. Assess impact on users

**Containment**:
1. Stop ongoing exploitation
2. Patch vulnerable systems
3. Reset compromised credentials
4. Monitor for indicator of compromise (IOC)

**Communication**:
1. Notify affected users within 24 hours
2. File breach report if required by law
3. Brief stakeholders/leadership
4. Public disclosure if required

**Post-Incident**:
1. Root cause analysis
2. Process improvements
3. Security training
4. Schedule post-mortem

---

## Compliance & Auditing

### Audit Logging

```javascript
// Log all sensitive operations
async function auditLog(userId, action, resource, details) {
  await AuditLog.create({
    user_id: userId,
    action: action,  // create, read, update, delete
    resource_type: resource,
    resource_id: details.id,
    old_values: details.old,
    new_values: details.new,
    ip_address: details.ip,
    user_agent: details.userAgent,
    timestamp: new Date(),
    status: 'success',
  });
}

// Retention: 1 year for audit logs
// Regular verification: Monthly
// External audit: Quarterly
```

### Data Privacy

**GDPR Compliance**:
- Data Processing Agreement (DPA) with providers
- Privacy by Design principles
- Right to be forgotten (data deletion)
- Data export functionality
- Privacy impact assessments

**CCPA Compliance** (if US operations):
- Consumer privacy notices
- Consumer access requests
- Opt-out mechanisms
- Data sale disclosure

### Regular Security Activities

```
Weekly:
  - Review access logs
  - Scan for suspicious activity
  - Check vulnerability scanner results

Monthly:
  - Penetration testing
  - Code security review
  - Access review (who has admin)
  - Secrets rotation audit

Quarterly:
  - Security training
  - Incident response drill
  - Vendor security assessment
  - Compliance review

Annually:
  - External penetration test
  - Disaster recovery drill
  - Security audit
  - Certification renewal (SOC2, ISO, etc.)
```

---

## Security Checklist

```
Development:
☐ Code passes security linter (ESLint security rules)
☐ No hardcoded secrets in code
☐ OWASP Top 10 addressed
☐ Input validation implemented
☐ SQL injection protection enabled
☐ XSS protection enabled
☐ CSRF tokens implemented

Deployment:
☐ Secrets injected from Secrets Manager
☐ HTTPS only
☐ Security headers set
☐ Rate limiting enabled
☐ Authentication enforced
☐ Authorization checks in place
☐ Logging configured

Operations:
☐ Regular backups tested
☐ Incident response procedures documented
☐ On-call team trained
☐ Monitoring and alerting active
☐ Vulnerability scanner running
☐ Access control audited
☐ Audit logs retained
```

---

## Security Contacts

- **Security Lead**: security@celadontennis.com
- **Incident Response**: incidents@celadontennis.com
- **Bug Bounty**: security@celadontennis.com
- **Compliance**: compliance@celadontennis.com
- **Emergency**: +84 XXX XXX XXX (on-call)

---

**Classification**: Confidential  
**Last Updated**: August 24, 2026  
**Next Review**: August 24, 2027
