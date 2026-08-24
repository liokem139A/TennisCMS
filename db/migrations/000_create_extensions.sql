-- Migration: Create PostgreSQL Extensions
-- Version: 000 (run before all other migrations)
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-25
-- Description: Enable required PostgreSQL extensions for UUID generation and JSON support

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable CITEXT extension for case-insensitive text searches (useful for email lookups)
CREATE EXTENSION IF NOT EXISTS citext;

-- Enable PGCRYPTO extension for additional encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Migration status: COMPLETED
-- Extensions enabled: uuid-ossp, citext, pgcrypto
