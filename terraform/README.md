# Terraform AWS Infrastructure

## Overview

This directory contains Terraform configuration for deploying the Celadon Tennis Digital Platform infrastructure on AWS. It sets up:

- **RDS PostgreSQL:** Production-grade relational database
- **ElastiCache Redis:** Distributed caching layer
- **VPC & Networking:** Secure, multi-AZ infrastructure
- **Security Groups:** Network access control
- **Monitoring:** CloudWatch logs and SNS notifications

## Prerequisites

### Required Tools

```bash
# Terraform 1.0+
terraform --version

# AWS CLI configured with credentials
aws configure

# Optional: PostgreSQL client for testing
brew install postgresql  # macOS
apt-get install postgresql-client  # Ubuntu/Debian
```

### AWS Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "rds:*",
        "elasticache:*",
        "sns:*",
        "logs:*",
        "iam:*",
        "kms:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Quick Start

### 1. Clone Repository
```bash
cd TennisCMS
cd terraform
```

### 2. Configure Variables
```bash
# Copy template
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars

# Required variables:
# - aws_region
# - environment (development/staging/production)
# - db_password (use strong password)
# - vpc_cidr
```

### 3. Initialize Terraform
```bash
# Download provider plugins and initialize
terraform init

# Validate configuration
terraform validate

# Format configuration
terraform fmt
```

### 4. Plan Infrastructure
```bash
# Create execution plan
terraform plan -out=tfplan

# Review the plan (shows what will be created)
cat tfplan
```

### 5. Deploy Infrastructure
```bash
# Apply the plan (creates AWS resources)
terraform apply tfplan

# Wait for completion (typically 10-15 minutes for RDS)

# View outputs
terraform output

# Save outputs to file
terraform output -json > infrastructure-outputs.json
```

## Configuration

### Environment-Specific Settings

#### Development
```hcl
environment          = "development"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
redis_node_type      = "cache.t3.micro"
enable_multi_az      = false
backup_retention_period = 7
```

#### Staging
```hcl
environment          = "staging"
db_instance_class    = "db.t3.small"
db_allocated_storage = 50
redis_node_type      = "cache.t3.small"
enable_multi_az      = true
backup_retention_period = 14
```

#### Production
```hcl
environment          = "production"
db_instance_class    = "db.t3.medium"  # or larger
db_allocated_storage = 100
redis_node_type      = "cache.t3.small"  # or larger
enable_multi_az      = true
backup_retention_period = 30
```

### Advanced Configuration

#### Enable Remote State Storage

Uncomment the backend block in `main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-company-terraform-state"
    key            = "tennis-cms/prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

Create the S3 bucket and DynamoDB table:
```bash
aws s3api create-bucket --bucket your-company-terraform-state
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

#### Custom Tags

Add project tags in `terraform.tfvars`:
```hcl
tags = {
  Project     = "TennisCMS"
  Environment = "production"
  Owner       = "Backend Team"
  CostCenter  = "Engineering"
  ManagedBy   = "Terraform"
}
```

## Infrastructure Details

### VPC Configuration

```
VPC: 10.0.0.0/16
├── Public Subnets (for NAT Gateway, ALB)
│   ├── 10.0.1.0/24 (AZ1)
│   └── 10.0.2.0/24 (AZ2)
├── Private Subnets (for RDS, ElastiCache)
│   ├── 10.0.10.0/24 (AZ1)
│   └── 10.0.11.0/24 (AZ2)
└── Internet Gateway (for outbound access)
```

### RDS PostgreSQL

**Instance Details:**
- Engine: PostgreSQL 15.3
- Class: db.t3.medium (configurable)
- Storage: 100GB gp3 encrypted
- Multi-AZ: Enabled (automatic failover)
- Backups: 30-day retention
- Maintenance Window: Monday 04:00-05:00 UTC
- Backup Window: 03:00-04:00 UTC

**Security:**
- VPC-only (not publicly accessible)
- Security group restricted to VPC CIDR (10.0.0.0/16)
- Storage encryption enabled (AWS KMS)
- IAM database authentication ready
- Enhanced monitoring with 1-minute granularity

**Monitoring:**
- CloudWatch Logs: PostgreSQL logs
- CloudWatch Metrics: CPU, connections, latency
- Enhanced Monitoring: OS-level metrics
- Alarms: CPU >80%, connections >80, latency >500ms

### ElastiCache Redis

**Instance Details:**
- Engine: Redis 7.0
- Node Type: cache.t3.micro (configurable)
- Nodes: 1 (can scale to 3+ for cluster mode)
- Port: 6379
- Maintenance Window: Sunday 03:00-04:00 UTC
- Snapshot Window: 02:00-03:00 UTC

**Security:**
- VPC-only (not publicly accessible)
- Security group restricted to VPC CIDR
- Encryption in transit: Ready (AUTH token)
- Encryption at rest: Via AWS encryption

**Features:**
- Automatic failover: Ready (for multi-node setup)
- Snapshots: 5-day retention
- Slow log: CloudWatch Logs
- SNS Notifications: ElastiCache events

## Managing Infrastructure

### View Current State

```bash
# Show all resources
terraform state list

# Show specific resource
terraform state show aws_db_instance.main

# View outputs
terraform output

# Export to JSON
terraform output -json
```

### Update Infrastructure

```bash
# Update single variable
terraform apply -var="db_instance_class=db.t3.large"

# Update from file
terraform apply -var-file="production.tfvars"

# Plan before applying
terraform plan -out=tfplan
terraform apply tfplan
```

### Scaling

```bash
# Scale up database
# Edit terraform.tfvars and change:
# db_instance_class = "db.t3.large"
# db_allocated_storage = 200

terraform plan -out=tfplan
terraform apply tfplan

# Scale up Redis
# Change redis_node_type and/or redis_num_cache_nodes
```

### Backup & Restore

```bash
# Create manual RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier tennis-cms-db \
  --db-snapshot-identifier tennis-cms-db-manual-$(date +%s)

# List snapshots
aws rds describe-db-snapshots --query 'DBSnapshots[*].[DBSnapshotIdentifier,CreateTime]'

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier tennis-cms-db-restored \
  --db-snapshot-identifier snapshot-id
```

### Monitoring

```bash
# View RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=tennis-cms-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# View Redis metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CPUUtilization \
  --dimensions Name=CacheClusterId,Value=tennis-cms-redis \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# View CloudWatch logs
aws logs tail /aws/rds/postgresql -f
aws logs tail /aws/elasticache/tennis-cms-redis/slow-log -f
```

## Troubleshooting

### Common Issues

**Error: "InvalidParameterValue: Availability zone us-east-1d is not available"**
```bash
# Check available zones in your region
aws ec2 describe-availability-zones --region us-east-1

# Update variables with available zones
```

**Error: "IAM role not found"**
```bash
# Create the IAM role first (Terraform should create it)
# Or manually create:
aws iam create-role --role-name tennis-cms-rds-monitoring-role \
  --assume-role-policy-document file://trust-policy.json
```

**Error: "The subnet group doesn't meet availability zone requirements"**
```bash
# Verify subnets are in different AZs
aws ec2 describe-subnets --subnet-ids subnet-xxx subnet-yyy \
  --query 'Subnets[*].[SubnetId,AvailabilityZone]'
```

**Slow Terraform Apply (10+ minutes)**
- This is normal for RDS (can take 10-15 minutes)
- ElastiCache typically takes 5-10 minutes
- Monitor AWS console for progress

### Debugging

```bash
# Enable debug logging
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform-debug.log

terraform apply -var-file="terraform.tfvars"

# View logs
tail -f terraform-debug.log
```

## Cleaning Up

### Remove Specific Resource

```bash
# Plan removal
terraform destroy -target aws_db_instance.main

# Confirm and apply
terraform destroy -auto-approve -target aws_db_instance.main
```

### Destroy Everything

```bash
# ⚠️ WARNING: This will delete all resources!

# Plan destruction
terraform plan -destroy

# Destroy all resources
terraform destroy

# Confirm when prompted
# Type 'yes' to confirm
```

## Cost Optimization

### Development Environment

```hcl
db_instance_class    = "db.t3.micro"    # ~$30/month
db_allocated_storage = 20               # ~$4/month
redis_node_type      = "cache.t3.micro" # ~$10/month
enable_multi_az      = false            # Saves ~50%
backup_retention_period = 7             # Shorter retention
```

**Estimated Monthly Cost: ~$50-80**

### Production Environment

```hcl
db_instance_class    = "db.t3.medium"   # ~$100/month
db_allocated_storage = 100              # ~$20/month
redis_node_type      = "cache.t3.small" # ~$20/month
enable_multi_az      = true             # HA requirement
backup_retention_period = 30            # Full retention
```

**Estimated Monthly Cost: ~$200-250**

### Cost Saving Tips

1. **Use Reserved Instances** - 40% savings for 1-year commitment
2. **Use Spot Instances** - For non-critical workloads (70% savings)
3. **Right-sizing** - Start small, scale up as needed
4. **Scheduled Scaling** - Scale down during off-hours
5. **Auto Scaling** - Scale based on actual usage

## Outputs

After successful deployment, Terraform outputs:

```json
{
  "database_url": "postgresql://celadon_app:***@tennis-cms-db.xxx.us-east-1.rds.amazonaws.com:5432/celadon",
  "redis_endpoint": "tennis-cms-redis.xxx.ng.0001.use1.cache.amazonaws.com",
  "redis_port": 6379,
  "redis_url": "redis://:@tennis-cms-redis.xxx.ng.0001.use1.cache.amazonaws.com:6379",
  "rds_endpoint": "tennis-cms-db.xxx.us-east-1.rds.amazonaws.com:5432",
  "vpc_id": "vpc-xxx"
}
```

Use these connection strings in your application `.env` file:

```env
DATABASE_URL=<database_url>
REDIS_URL=<redis_url>
```

## Related Documentation

- `/CEL-8_DATABASE_INFRASTRUCTURE_SETUP.md` - Implementation summary
- `/db/README.md` - Database migrations guide
- `/INFRASTRUCTURE_SETUP.md` - Docker and CI/CD setup

---

**Version:** 1.0  
**Last Updated:** 2026-08-25  
**Maintainer:** Backend & Infrastructure Lead
