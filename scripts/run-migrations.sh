#!/bin/bash

# Database Migration Runner
# This script runs all database migrations in the correct order

set -e

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
MIGRATIONS_DIR="./db/migrations"
ENV=${1:-development}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-tennis_cms}

echo -e "${YELLOW}Database Migration Runner${NC}"
echo -e "${YELLOW}========================${NC}"
echo -e "Environment: $ENV"
echo -e "Database Host: $DB_HOST:$DB_PORT"
echo -e "Database Name: $DB_NAME"
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found at $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Count migrations
MIGRATION_COUNT=$(ls "$MIGRATIONS_DIR"/*.sql | wc -l)
echo -e "${GREEN}Found $MIGRATION_COUNT migration files${NC}"
echo ""

# List migrations
echo -e "${YELLOW}Migrations to run:${NC}"
for migration in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    echo "  - $(basename $migration)"
done
echo ""

# Confirm before running
read -p "Continue with migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi

# Run each migration in order
echo -e "${YELLOW}Running migrations...${NC}"
echo ""

FAILED=0
SUCCEEDED=0

for migration in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    MIGRATION_NAME=$(basename "$migration")
    echo -e "${YELLOW}Running: $MIGRATION_NAME${NC}"

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $MIGRATION_NAME completed${NC}"
        ((SUCCEEDED++))
    else
        echo -e "${RED}✗ $MIGRATION_NAME failed${NC}"
        ((FAILED++))
        # Continue with next migration (non-blocking on failure)
    fi
    echo ""
done

# Summary
echo -e "${YELLOW}Migration Summary${NC}"
echo -e "${YELLOW}=================${NC}"
echo -e "${GREEN}Succeeded: $SUCCEEDED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All migrations completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}Some migrations failed. Please review the errors above.${NC}"
    exit 1
fi
