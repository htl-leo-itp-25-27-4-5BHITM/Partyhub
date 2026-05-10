# PartyHub API Test Suite - HTTPYac Configuration

## Overview
This directory contains HTTPYac integration tests for the PartyHub API. The tests are designed to run in both local development and CI/CD environments (GitHub Actions).

## Changes for GitHub Actions Compatibility (May 10 2026)

### Key Updates

#### 1. **Strict Assertions** 
All test files now use strict equality operators (`===` instead of `==`) and type-checking assertions:
- `?? status === 200` instead of `?? status == 200`
- `?? response.body.id !== undefined` for object validation
- `?? Array.isArray(response.body)` for array validation

#### 2. **Fixed Configuration Issues**
- **profilePicture.http**: Changed from hardcoded IP `http://10.214.0.225:8080` to `http://localhost:8080`
- Added `.httpyacrc.json` configuration for sequential test execution (required for CI/CD)

#### 3. **Enhanced Error Assertions**
Added response validation beyond HTTP status codes:
```
?? status === 201
?? response.body.id !== undefined
```

#### 4. **Improved GitHub Actions Workflow**
- **Database Timeout**: Extended PostgreSQL readiness check from 1 min to 2 min with `-T` flag
- **Quarkus Startup**: Increased timeout from 120s to 180s with better process tracking
- **Sequential Tests**: Tests run sequentially (not parallel) to prevent race conditions
- **Test Results**: HTTPYac output saved to `./test-results/` artifact for debugging
- **Verbose Logging**: All tests run with `--verbose` flag for better CI diagnostics

### Test Files Affected

| File | Changes |
|------|---------|
| `user.http` | Strict assertions, response body validation |
| `party.http` | Status code validation, array checks |
| `follow.http` | Type checking for response bodies |
| `invitation.http` | Strict status codes, array validation |
| `notification.http` | Response type validation |
| `media.http` | File upload success checks |
| `qr.http` | Token and header validation |
| `profilePicture.http` | Fixed localhost config, image file handling |

## Running Tests

### Local Development
```bash
cd api
npm install
npm test              # Sequential execution (default)
npm run test:parallel # Parallel execution (faster but needs careful test isolation)
```

### CI/CD (GitHub Actions)
Tests automatically run with:
```bash
npm run test:ci  # Equivalent to: httpyac --timeout 10000 --verbose --output ./test-results/ *.http
```

## Configuration Files

### `.httpyacrc.json`
```json
{
  "timeout": 10000,
  "verbose": true,
  "parallel": false,
  "failOnError": true,
  "logLevel": "verbose",
  "outputDirectory": "./test-results/"
}
```

### `package.json` Scripts
- `test`: Sequential execution with verbose output
- `test:parallel`: Parallel execution (development only)
- `test:ci`: CI/CD execution with artifact output

## Troubleshooting

### Tests Timeout in CI
- Ensure Quarkus startup waits 180+ seconds
- Check PostgreSQL readiness with: `docker compose exec -T postgres pg_isready -U postgres -d partyhub`

### Tests Pass Locally but Fail in CI
- Verify localhost:8080 in all HTTP files (no hardcoded IPs)
- Ensure test data exists in `import.sql`
- Check test file binary dependencies (e.g., `testing.jpg`)

### Connection Refused Errors
- Confirm Quarkus is fully started before running tests
- Check logs: `curl http://localhost:8080/q/openapi`

## Seed Data Requirements

Tests rely on seed data from `import.sql`:
- Users: 1 (Anna), 2 (Michael), 4 (Thomas), 5 (Sabine), 6, 7 (Mia), 8, 9, 10 (Elias)
- Parties: 1, 2, 4, 9, 11
- Relationships: Follow relationships, invitations, notifications

Verify with: `GET http://localhost:8080/api/users`
