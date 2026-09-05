# Paperclip CI Pipeline Auto-Remediation Runbook

**Purpose:** Step-by-step automation commands for Paperclip system to fix all CI pipeline failures

**Execution Model:** Run sequentially; fail-fast if any critical step fails

---

## Phase 1: TypeScript Compilation Diagnostics (BLOCKING)

### Step 1.1: Generate TypeScript Diagnostic Report

```bash
#!/bin/bash
set -e

echo "=== TypeScript Compilation Diagnostic ==="

# Run TypeScript compiler with detailed output
npx tsc --noEmit --pretty false --listFilesOnly 2>&1 | tee typecheck-files.log || true

# Generate JSON error report
npx tsc --noEmit --pretty false 2>&1 | tee typecheck-errors.log || true

# Count errors
ERROR_COUNT=$(cat typecheck-errors.log | grep "error TS" | wc -l)
echo "Total TypeScript Errors: $ERROR_COUNT"

# Save error count for next step
echo "$ERROR_COUNT" > /tmp/tsc_error_count.txt
```

**Expected Output:**
- `typecheck-files.log` - List of files being checked
- `typecheck-errors.log` - Detailed error messages with line numbers
- Error count in `/tmp/tsc_error_count.txt`

**Success Condition:** Can run without crashing (errors OK at this stage)

---

### Step 1.2: Parse TypeScript Errors & Create GitHub Issues

```bash
#!/bin/bash

echo "=== Parsing TypeScript Errors ==="

# Read errors and parse into structured format
npx tsc --noEmit --listFilesOnly 2>&1 | jq -R 'split("\n") | map(select(. | contains("error TS"))) | .[0:10]' > /tmp/tsc_errors.json

# Create issue template for each error group
# GROUP 1: Middleware return type errors
grep -n "return.*status" src/routes/*.ts | head -5 > /tmp/middleware_return_errors.txt || true

# GROUP 2: WebSocket type errors  
grep -n "WebSocketMessage\|type.*union" src/services/*.ts | head -10 > /tmp/websocket_type_errors.txt || true

# GROUP 3: Type definition errors
grep -n "any\|Type.*not assigned" src/**/*.ts | head -10 > /tmp/type_def_errors.txt || true

echo "Error groups identified and saved to /tmp/"
```

**Expected Output:**
- `/tmp/tsc_errors.json` - Structured error list
- `/tmp/middleware_return_errors.txt` - Middleware-specific errors
- `/tmp/websocket_type_errors.txt` - WebSocket-specific errors
- `/tmp/type_def_errors.txt` - Type definition errors

---

### Step 1.3: Verify Core Issue - Middleware Return Type

```bash
#!/bin/bash

echo "=== Checking Middleware Return Types ==="

# Search for problematic patterns
grep -r "return.*_res\|return.*res\.status\|return.*json" src/middleware/ src/routes/ | grep -v "test\|spec" > /tmp/return_patterns.txt || true

# Count instances
RETURN_COUNT=$(wc -l < /tmp/return_patterns.txt)
echo "Found $RETURN_COUNT potential middleware return violations"

# Flag for review
if [ "$RETURN_COUNT" -gt 0 ]; then
  echo "⚠️  REQUIRES MANUAL FIX: Middleware files need review"
  echo "   See: /tmp/return_patterns.txt"
fi
```

**Expected Output:**
- `/tmp/return_patterns.txt` - Files and lines with return issues
- Warning flag if issues found

---

## Phase 2: ESLint Auto-Fix

### Step 2.1: Auto-Fix ESLint Violations

```bash
#!/bin/bash
set -e

echo "=== Running ESLint Auto-Fix ==="

# Show what will be changed
npx eslint src/ --fix --format=compact 2>&1 | tee eslint-autofix.log || true

echo "✅ Auto-fix completed"
```

**Expected Output:**
- `eslint-autofix.log` - List of auto-fixed issues
- Files modified in-place

---

### Step 2.2: Generate ESLint Report for Remaining Issues

```bash
#!/bin/bash

echo "=== Generating ESLint Report (Post Auto-Fix) ==="

# Generate JSON report
npx eslint src/ --format=json --no-eslintrc -c .eslintrc.json > eslint-report.json 2>&1 || true

# Summary
echo "ESLint Report generated: eslint-report.json"

# Count remaining violations
VIOLATION_COUNT=$(jq '[.[] | .messages[]? | select(.severity > 0)] | length' eslint-report.json 2>/dev/null || echo "0")
echo "Remaining violations: $VIOLATION_COUNT"

# Flag if critical violations remain
if [ "$VIOLATION_COUNT" -gt 10 ]; then
  echo "⚠️  REQUIRES MANUAL REVIEW: $VIOLATION_COUNT violations remain"
fi
```

**Expected Output:**
- `eslint-report.json` - Detailed violations (JSON format)
- Violation count
- Warning if manual review needed

---

## Phase 3: Test Database Setup

### Step 3.1: Initialize Test Database

```bash
#!/bin/bash
set -e

echo "=== Setting Up Test Database ==="

# Check if PostgreSQL is running
echo "Checking PostgreSQL connectivity..."
psql --version || echo "⚠️  PostgreSQL CLI not found"

# Run migrations for test environment
export DATABASE_URL="postgresql://test:test@localhost:5432/tennis_test"

echo "Running database migrations..."
npm run migrate:test 2>&1 | tee migrate-test.log || {
  echo "❌ Migration failed - database may not be accessible"
  echo "   Check PostgreSQL service is running"
  exit 1
}

echo "✅ Test database initialized"
```

**Expected Output:**
- `migrate-test.log` - Migration output
- Success status

**Failure Condition:** If PostgreSQL not accessible, create a note for manual intervention

---

### Step 3.2: Run Tests with Coverage

```bash
#!/bin/bash

echo "=== Running Unit & Integration Tests ==="

export NODE_ENV=test
export DATABASE_URL="postgresql://test:test@localhost:5432/tennis_test"
export REDIS_URL="redis://localhost:6379"

# Run tests with coverage
npm run test:ci -- --coverage 2>&1 | tee test-results.log || {
  echo "⚠️  Some tests failed - see test-results.log"
}

# Check if coverage report exists
if [ -f "coverage/coverage-final.json" ]; then
  echo "✅ Coverage report generated"
  
  # Extract coverage percentage
  COVERAGE=$(jq '.[] | .lines.pct' coverage/coverage-final.json | head -1)
  echo "Code coverage: $COVERAGE%"
  
  if (( $(echo "$COVERAGE < 85" | bc -l) )); then
    echo "⚠️  Coverage below 85% target"
  fi
fi
```

**Expected Output:**
- `test-results.log` - Test execution output
- `coverage/coverage-final.json` - Coverage metrics
- Coverage percentage

---

## Phase 4: Security Checks

### Step 4.1: Generate npm Audit Report

```bash
#!/bin/bash

echo "=== Running Security Audit ==="

# Generate audit report
npm audit --json > npm-audit-report.json 2>&1 || true

# Parse results
CRITICAL_COUNT=$(jq '.metadata.vulnerabilities.critical // 0' npm-audit-report.json)
HIGH_COUNT=$(jq '.metadata.vulnerabilities.high // 0' npm-audit-report.json)
MODERATE_COUNT=$(jq '.metadata.vulnerabilities.moderate // 0' npm-audit-report.json)

echo "Security Audit Results:"
echo "  Critical: $CRITICAL_COUNT"
echo "  High: $HIGH_COUNT"
echo "  Moderate: $MODERATE_COUNT"

# Create issues for critical/high vulnerabilities
if [ "$CRITICAL_COUNT" -gt 0 ] || [ "$HIGH_COUNT" -gt 0 ]; then
  echo "⚠️  CRITICAL/HIGH VULNERABILITIES FOUND"
  echo "   Review npm-audit-report.json for details"
  exit 1  # Force manual review
fi
```

**Expected Output:**
- `npm-audit-report.json` - Full audit report
- Summary counts
- Exit code 1 if critical/high vulnerabilities (force manual review)

---

### Step 4.2: Run Snyk Security Scan (Optional)

```bash
#!/bin/bash

# Only run if Snyk token is available
if [ -z "$SNYK_TOKEN" ]; then
  echo "⏭️  Skipping Snyk scan (token not configured)"
  exit 0
fi

echo "=== Running Snyk Security Scan ==="

# Run Snyk scan
npx snyk test --json > snyk-report.json 2>&1 || {
  echo "ℹ️  Snyk scan found issues - see snyk-report.json"
}

# Parse results
SNYK_ISSUES=$(jq '.vulnerabilities | length' snyk-report.json)
echo "Snyk issues found: $SNYK_ISSUES"
```

**Expected Output:**
- `snyk-report.json` - Snyk scan results (if enabled)

---

## Phase 5: Full Build Validation

### Step 5.1: Production Build Test

```bash
#!/bin/bash
set -e

echo "=== Testing Production Build ==="

# Clean build
rm -rf dist/ build/ .next/ || true

# Run production build
npm run build 2>&1 | tee build.log || {
  echo "❌ Production build failed"
  exit 1
}

echo "✅ Production build successful"

# Check output size
if [ -d "dist" ]; then
  SIZE=$(du -sh dist/ | cut -f1)
  echo "Build output size: $SIZE"
fi
```

**Expected Output:**
- `build.log` - Build output
- Build artifacts in `dist/`
- Build size information

---

## Phase 6: GitHub Issue Creation

### Step 6.1: Create Issue for Each Unresolved Error

```bash
#!/bin/bash

echo "=== Creating GitHub Issues for Unresolved Errors ==="

# Create summary of remaining issues
cat > /tmp/issue_summary.txt << EOF
# Automated CI Pipeline Issue Report

## TypeScript Errors
$(cat /tmp/tsc_errors.json 2>/dev/null | head -20 || echo "None detected")

## Middleware Return Violations
$(cat /tmp/return_patterns.txt 2>/dev/null | head -10 || echo "None detected")

## WebSocket Type Issues
$(cat /tmp/websocket_type_errors.txt 2>/dev/null | head -10 || echo "None detected")

## ESLint Report
See: eslint-report.json

## Security Vulnerabilities
$(cat npm-audit-report.json 2>/dev/null | jq '.vulnerabilities[] | "\(.severity): \(.module)"' 2>/dev/null || echo "None detected")

## Test Coverage
See: coverage/coverage-final.json
EOF

echo "Summary created: /tmp/issue_summary.txt"
```

**Expected Output:**
- `/tmp/issue_summary.txt` - Consolidated issue summary

---

## Master Execution Script

### Complete Remediation Pipeline

```bash
#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  TennisCMS CI Pipeline Auto-Remediation - Paperclip           ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Initialize
mkdir -p /tmp/ci-remediation-logs
export CI_LOG_DIR="/tmp/ci-remediation-logs"

# Counters
PHASE_PASSED=0
PHASE_FAILED=0

# Phase 1: TypeScript
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: TypeScript Compilation Diagnostics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run typecheck 2>&1 | tee "$CI_LOG_DIR/phase1-typecheck.log"; then
  echo "✅ PHASE 1 PASSED: No TypeScript errors"
  ((PHASE_PASSED++))
else
  echo "⚠️  PHASE 1 ERRORS FOUND: Requires manual fix"
  ((PHASE_FAILED++))
fi

echo ""

# Phase 2: ESLint Auto-Fix
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: ESLint Auto-Fix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run lint:fix 2>&1 | tee "$CI_LOG_DIR/phase2-lint-fix.log"; then
  echo "✅ PHASE 2 PASSED: ESLint auto-fix completed"
  ((PHASE_PASSED++))
else
  echo "⚠️  PHASE 2 WARNINGS: Some violations could not be auto-fixed"
  ((PHASE_FAILED++))
fi

echo ""

# Phase 3: Database & Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: Test Database & Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export DATABASE_URL="postgresql://test:test@localhost:5432/tennis_test"

if npm run migrate:test 2>&1 | tee "$CI_LOG_DIR/phase3-migrate.log"; then
  echo "✅ Database migrations completed"
  
  if npm run test:ci 2>&1 | tee "$CI_LOG_DIR/phase3-tests.log"; then
    echo "✅ PHASE 3 PASSED: All tests passing"
    ((PHASE_PASSED++))
  else
    echo "❌ PHASE 3 FAILED: Some tests failed"
    ((PHASE_FAILED++))
  fi
else
  echo "❌ PHASE 3 FAILED: Database setup failed"
  ((PHASE_FAILED++))
fi

echo ""

# Phase 4: Security
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: Security Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm audit --json > npm-audit-report.json 2>&1 || true
CRITICAL=$(jq '.metadata.vulnerabilities.critical // 0' npm-audit-report.json)

if [ "$CRITICAL" -eq 0 ]; then
  echo "✅ PHASE 4 PASSED: No critical vulnerabilities"
  ((PHASE_PASSED++))
else
  echo "⚠️  PHASE 4 WARNING: Critical vulnerabilities found"
  ((PHASE_FAILED++))
fi

echo ""

# Phase 5: Build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 5: Production Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run build 2>&1 | tee "$CI_LOG_DIR/phase5-build.log"; then
  echo "✅ PHASE 5 PASSED: Production build successful"
  ((PHASE_PASSED++))
else
  echo "❌ PHASE 5 FAILED: Production build failed"
  ((PHASE_FAILED++))
fi

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  REMEDIATION SUMMARY                                          ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Phases Passed:    $PHASE_PASSED/5                                   ║"
echo "║  Phases Failed:    $PHASE_FAILED/5                                   ║"
echo "║  Log Directory:    $CI_LOG_DIR           ║"
echo "╚════════════════════════════════════════════════════════════════╝"

if [ "$PHASE_FAILED" -eq 0 ]; then
  echo ""
  echo "✅ ALL PHASES PASSED - Ready for pipeline re-run"
  exit 0
else
  echo ""
  echo "⚠️  SOME PHASES FAILED - Manual review required"
  echo "   See: $CI_LOG_DIR/"
  exit 1
fi
```

**Usage:**
```bash
bash ci-remediation-runbook.sh
```

**Output:**
- Detailed logs in `/tmp/ci-remediation-logs/`
- Exit code 0 = all phases passed (ready to re-run CI)
- Exit code 1 = manual intervention required

---

## Monitoring & Alerts

### Health Check Script

```bash
#!/bin/bash

echo "=== CI Pipeline Health Check ==="

# Check all critical commands
HEALTH=✅

echo -n "TypeScript Compilation... "
if npm run typecheck > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  HEALTH=❌
fi

echo -n "ESLint... "
if npm run lint > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  HEALTH=❌
fi

echo -n "Unit Tests... "
if npm run test:ci > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  HEALTH=❌
fi

echo -n "Production Build... "
if npm run build > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  HEALTH=❌
fi

echo ""
echo "Overall Health: $HEALTH"

[ "$HEALTH" = "✅" ] && exit 0 || exit 1
```

---

## Next Steps for Paperclip

1. **Execute Master Script:** Run `ci-remediation-runbook.sh`
2. **Analyze Results:** Check exit code and logs in `/tmp/ci-remediation-logs/`
3. **Create GitHub Issue:** Post issue with auto-fixed changes + remaining issues
4. **Commit Auto-Fixes:** Create PR with ESLint fixes
5. **Re-Run Pipeline:** Trigger GitHub Actions workflow
6. **Monitor Status:** Continue until all phases pass

---
