variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "project_name" {
  description = "Project name"
  default     = "tennis-cms"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  default     = "celadon"
}

variable "db_username" {
  description = "Database username"
  default     = "celadon_app"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Redis engine version"
  default     = "7.0"
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch logs for RDS"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default = {
    Project     = "TennisCMS"
    ManagedBy   = "Terraform"
    Environment = "production"
  }
}
