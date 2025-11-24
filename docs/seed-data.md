# Seed Data Guide

**Generated:** 2025-01-XX  
**Purpose:** Complete guide to generating and managing seed/demo data

## Overview

Seed data is used for:
- **Development:** Local testing and development
- **Staging:** Demo environments
- **Testing:** Automated tests
- **Demos:** Product demonstrations

---

## Seed Data Script

### Location

**File:** `scripts/generate-sample-data.ts`

**Purpose:** Generate realistic sample events, patterns, and insights

### Usage

**Basic Usage:**
```bash
npm run generate-sample-data -- --userId <user-id>
```

**With Options:**
```bash
npm run generate-sample-data -- \
  --userId <user-id> \
  --events 100 \
  --daysBack 30
```

**Parameters:**
- `--userId` (required) - User ID to generate data for
- `--events` (optional) - Number of events to generate (default: 100)
- `--daysBack` (optional) - Days back to generate events (default: 30)

### Example

```bash
# Generate 100 events for user abc123 over last 30 days
npm run generate-sample-data -- --userId abc123 --events 100 --daysBack 30
```

---

## What Gets Generated

### 1. Events

**Generated:**
- File system events (created, modified, accessed, deleted)
- Realistic file paths (e.g., `/src/components/Button.tsx`)
- Tool usage (vscode, git, npm, etc.)
- Timestamps spread over specified days
- Metadata (file size, line count, etc.)

**Example:**
```json
{
  "userId": "abc123",
  "filePath": "/src/components/Button.tsx",
  "eventType": "modified",
  "tool": "vscode",
  "timestamp": "2025-01-15T10:30:00Z",
  "metadata": {
    "extension": ".tsx",
    "size": 1234,
    "lines": 45
  }
}
```

### 2. Patterns

**Generated:**
- File extension patterns (`.ts`, `.tsx`, `.py`, etc.)
- Usage counts per extension
- Tools used per extension
- Last used timestamps

**Example:**
```json
{
  "userId": "abc123",
  "fileExtension": ".tsx",
  "count": 45,
  "tools": ["vscode", "git"],
  "lastUsed": "2025-01-15T10:30:00Z"
}
```

### 3. Insights

**Generated:**
- Pattern-based insights
- Tool diversity insights
- Recommendations

**Example:**
```json
{
  "userId": "abc123",
  "type": "pattern",
  "title": "Most Used File Type: .tsx",
  "description": "You've used .tsx files 45 times.",
  "recommendation": "Consider creating templates or snippets for .tsx files.",
  "priority": "high"
}
```

---

## Production Seed Data

### When to Use

**Production seed data is used for:**
- Initial demo data
- Onboarding examples
- Feature demonstrations

**⚠️ Important:** Production seed data should be:
- Realistic but not real user data
- Limited in scope
- Clearly marked as demo data

### Process

**Step 1: Create Seed Data Script**

**File:** `scripts/seed-production.ts`

```typescript
/**
 * Production Seed Data
 * 
 * Generates minimal, realistic seed data for production demos.
 * Usage: npm run seed:production
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Seeding production data...\n');
  
  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@floyo.dev',
      name: 'Demo User',
      emailVerified: true,
    },
  });
  
  console.log(`✅ Created demo user: ${demoUser.id}`);
  
  // Generate sample data for demo user
  // ... (use generate-sample-data.ts logic)
  
  console.log('✅ Production seed complete!');
}

seedProduction()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Run Seed Script**

```bash
npm run seed:production
```

**Step 3: Verify**

```bash
# Check demo user exists
tsx scripts/verify-seed.ts
```

---

## Development Seed Data

### Local Development

**Purpose:** Generate data for local testing

**Process:**

1. **Create test user:**
```bash
# Via Prisma Studio or script
tsx scripts/create-test-user.ts
```

2. **Generate sample data:**
```bash
npm run generate-sample-data -- --userId <test-user-id>
```

3. **Verify:**
```bash
# Check data in Prisma Studio
npm run prisma:studio
```

### Automated Setup

**File:** `scripts/setup-dev.ts`

```typescript
/**
 * Development Setup
 * 
 * Sets up local development environment with seed data.
 */

async function setupDev() {
  console.log('🔧 Setting up development environment...\n');
  
  // 1. Create test user
  const user = await createTestUser();
  
  // 2. Generate sample data
  await generateSampleData(user.id);
  
  // 3. Verify setup
  await verifySetup(user.id);
  
  console.log('✅ Development environment ready!');
}
```

**Usage:**
```bash
npm run setup:dev
```

---

## Staging Seed Data

### Purpose

**Staging seed data:**
- Mimics production data structure
- Used for testing features
- Used for demos

### Process

**Step 1: Generate Staging Data**

```bash
# Generate data for staging user
npm run generate-sample-data -- \
  --userId <staging-user-id> \
  --events 500 \
  --daysBack 90
```

**Step 2: Verify**

```bash
# Check staging data
tsx scripts/verify-staging.ts
```

---

## Seed Data for Tests

### Unit Tests

**Purpose:** Generate minimal data for unit tests

**Process:**

```typescript
// tests/helpers/seed.ts
export async function seedTestData() {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });
  
  return { user };
}
```

**Usage:**

```typescript
// tests/unit/events.test.ts
import { seedTestData } from '../helpers/seed';

test('creates event', async () => {
  const { user } = await seedTestData();
  // ... test logic
});
```

### E2E Tests

**Purpose:** Generate realistic data for E2E tests

**Process:**

```typescript
// e2e/helpers/seed.ts
export async function seedE2EData() {
  const user = await prisma.user.create({
    data: {
      email: 'e2e@example.com',
      name: 'E2E User',
    },
  });
  
  // Generate sample events
  await generateSampleData(user.id, 50, 7);
  
  return { user };
}
```

---

## Seed Data Management

### Clearing Seed Data

**File:** `scripts/clear-seed-data.ts`

```typescript
/**
 * Clear Seed Data
 * 
 * Removes seed/demo data from database.
 */

async function clearSeedData() {
  console.log('🗑️  Clearing seed data...\n');
  
  // Delete demo users
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'demo',
      },
    },
  });
  
  // Delete test users
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test',
      },
    },
  });
  
  console.log('✅ Seed data cleared!');
}
```

**Usage:**
```bash
npm run clear-seed-data
```

### Backup Seed Data

**File:** `scripts/backup-seed-data.ts`

```typescript
/**
 * Backup Seed Data
 * 
 * Exports seed data to JSON file.
 */

async function backupSeedData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: 'demo',
      },
    },
    include: {
      events: true,
      patterns: true,
    },
  });
  
  await fs.writeFile(
    'seed-data-backup.json',
    JSON.stringify(users, null, 2)
  );
  
  console.log('✅ Seed data backed up!');
}
```

---

## CI/CD Integration

### Pre-Deployment Seed

**Workflow:** `.github/workflows/seed-staging.yml`

```yaml
name: Seed Staging

on:
  workflow_dispatch:

jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate seed data
        run: |
          npm run generate-sample-data -- \
            --userId ${{ secrets.STAGING_USER_ID }} \
            --events 100
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
```

---

## Best Practices

### 1. Realistic Data

- Use realistic file paths
- Use realistic timestamps
- Use realistic metadata

### 2. Limited Scope

- Don't generate excessive data
- Use appropriate time ranges
- Limit event counts

### 3. Clear Labeling

- Mark demo/test users clearly
- Use identifiable email patterns
- Document seed data purpose

### 4. Cleanup

- Remove seed data after testing
- Don't leave seed data in production
- Use separate seed data for each environment

---

## Troubleshooting

### Seed Data Fails

**Symptoms:**
- Script fails to run
- Data not generated
- Errors in console

**Steps:**
1. Verify user exists: `prisma studio`
2. Check database connection
3. Verify Prisma schema matches database
4. Check script logs for errors

### Seed Data Not Appearing

**Symptoms:**
- Script runs but no data appears
- Data not visible in UI

**Steps:**
1. Check database directly: `prisma studio`
2. Verify user ID is correct
3. Check for errors in script
4. Verify database permissions

---

## Related Documentation

- [Database Migrations](./db-migrations-and-schema.md) - Database setup
- [Backend Deployment](./backend-deployment.md) - Deployment guide
- [Environment Variables](./env-and-secrets.md) - Configuration

---

## Quick Reference

### Generate Sample Data

```bash
npm run generate-sample-data -- --userId <user-id> --events 100
```

### Setup Development

```bash
npm run setup:dev
```

### Clear Seed Data

```bash
npm run clear-seed-data
```

### Verify Seed Data

```bash
tsx scripts/verify-seed.ts
```

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent
