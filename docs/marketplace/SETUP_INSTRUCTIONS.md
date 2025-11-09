# Marketplace & App Store Setup Instructions

## Quick Start Guide

This guide walks you through setting up Floyo for app store distribution, including SDK integration, automated moderation, and financial management.

---

## Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.11+ (for backend)
- PostgreSQL 14+ or Supabase account
- App Store Developer accounts (Apple, Google, Microsoft)
- API keys for moderation services (OpenAI, Perspective API, etc.)

---

## Part 1: SDK Setup

### 1.1 Install SDK Package

```bash
# Root directory
npm install @floyo/marketplace-sdk

# Or with pnpm
pnpm add @floyo/marketplace-sdk
```

### 1.2 Configure Environment Variables

Create `.env` file:

```bash
# SDK Configuration
FLOYO_SDK_API_KEY=your_api_key_here
FLOYO_SDK_ENVIRONMENT=production
FLOYO_SDK_ENDPOINT=https://api.floyo.app

# App Store Credentials
APPLE_APP_STORE_API_KEY=your_apple_key
GOOGLE_PLAY_SERVICE_ACCOUNT=path/to/service-account.json
MICROSOFT_STORE_CLIENT_ID=your_client_id
MICROSOFT_STORE_CLIENT_SECRET=your_client_secret

# Moderation API Keys
OPENAI_API_KEY=your_openai_key
PERSPECTIVE_API_KEY=your_perspective_key
MODERATION_WEBHOOK_SECRET=your_webhook_secret

# Financial Integration
STRIPE_API_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
QUICKBOOKS_CLIENT_ID=your_qb_client_id
QUICKBOOKS_CLIENT_SECRET=your_qb_client_secret
```

### 1.3 Initialize SDK

```typescript
// frontend/app/api/marketplace/init.ts
import { FloyoMarketplaceSDK } from '@floyo/marketplace-sdk'

export const marketplaceSDK = new FloyoMarketplaceSDK({
  apiKey: process.env.FLOYO_SDK_API_KEY!,
  environment: process.env.FLOYO_SDK_ENVIRONMENT || 'production',
  endpoint: process.env.FLOYO_SDK_ENDPOINT || 'https://api.floyo.app'
})

// Initialize
await marketplaceSDK.initialize()
```

---

## Part 2: App Store Integration

### 2.1 Apple App Store Setup

#### Install Dependencies

```bash
npm install --save-dev @appstoreconnect/api fastlane
```

#### Configure Fastlane

Create `fastlane/Fastfile`:

```ruby
platform :ios do
  desc "Submit to App Store"
  lane :release do
    increment_build_number
    build_app(scheme: "Floyo")
    upload_to_app_store(
      api_key_path: "fastlane/AuthKey.p8",
      skip_metadata: false,
      skip_screenshots: false
    )
  end
end
```

#### Setup App Store Connect API Key

1. Go to App Store Connect → Users and Access → Keys
2. Create new API key with "App Manager" role
3. Download `.p8` key file
4. Save to `fastlane/AuthKey.p8`
5. Note the Key ID and Issuer ID

#### Environment Variables

```bash
APPLE_ISSUER_ID=your_issuer_id
APPLE_KEY_ID=your_key_id
APPLE_KEY_PATH=fastlane/AuthKey.p8
```

### 2.2 Google Play Store Setup

#### Install Dependencies

```bash
npm install --save-dev google-play-api
```

#### Create Service Account

1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable Google Play Android Developer API
4. Create Service Account
5. Download JSON key file
6. Grant "Release Manager" role in Play Console

#### Configuration

```typescript
// scripts/play-store-upload.ts
import { GooglePlay } from 'google-play-api'

const playStore = new GooglePlay({
  auth: {
    serviceAccount: require('./service-account.json')
  },
  packageName: 'com.floyo.app'
})

export async function uploadToPlayStore(aabPath: string) {
  await playStore.edits.insert({})
  // Upload logic here
}
```

### 2.3 Microsoft Store Setup

#### Install Dependencies

```bash
npm install --save-dev @microsoft/windows-store-api
```

#### Azure AD App Registration

1. Go to Azure Portal → App Registrations
2. Create new registration
3. Add API permissions for Microsoft Store API
4. Create client secret
5. Note Client ID and Tenant ID

#### Configuration

```typescript
// scripts/ms-store-upload.ts
import { WindowsStoreAPI } from '@microsoft/windows-store-api'

const msStore = new WindowsStoreAPI({
  clientId: process.env.MICROSOFT_STORE_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_STORE_CLIENT_SECRET!,
  tenantId: process.env.MICROSOFT_STORE_TENANT_ID!
})
```

---

## Part 3: Automated Moderation Setup

### 3.1 Install Moderation Dependencies

```bash
npm install @floyo/moderation @google-cloud/language openai
```

### 3.2 Configure Moderation Service

```typescript
// marketplace/moderation/service.ts
import { ModerationService } from '@floyo/moderation'
import { OpenAI } from 'openai'
import { LanguageServiceClient } from '@google-cloud/language'

export const moderationService = new ModerationService({
  openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
  languageClient: new LanguageServiceClient(),
  webhookSecret: process.env.MODERATION_WEBHOOK_SECRET
})
```

### 3.3 Setup Moderation Rules

Create `marketplace/moderation/rules.json`:

```json
{
  "contentModeration": {
    "enabled": true,
    "providers": ["openai", "perspective", "google"],
    "thresholds": {
      "toxicity": 0.7,
      "spam": 0.8,
      "inappropriate": 0.75
    }
  },
  "autoActions": {
    "autoFlag": true,
    "autoRemove": false,
    "requireReview": true
  },
  "reviewQueue": {
    "enabled": true,
    "maxQueueSize": 1000
  }
}
```

### 3.4 Create Moderation API Routes

```typescript
// frontend/app/api/marketplace/moderate/route.ts
import { moderationService } from '@/marketplace/moderation/service'

export async function POST(request: Request) {
  const { content, contentType } = await request.json()
  
  const result = await moderationService.moderate({
    content,
    contentType,
    userId: request.headers.get('user-id') || 'anonymous'
  })
  
  return Response.json(result)
}
```

---

## Part 4: Financial Manager Integration

### 4.1 Install Financial Dependencies

```bash
npm install stripe quickbooks-node-sdk @floyo/financial-manager
```

### 4.2 Configure Financial Services

```typescript
// marketplace/financial/manager.ts
import { FinancialManager } from '@floyo/financial-manager'
import Stripe from 'stripe'
import QuickBooks from 'quickbooks-node-sdk'

export const financialManager = new FinancialManager({
  stripe: new Stripe(process.env.STRIPE_API_KEY!),
  quickbooks: new QuickBooks({
    consumerKey: process.env.QUICKBOOKS_CLIENT_ID!,
    consumerSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    accessToken: process.env.QUICKBOOKS_ACCESS_TOKEN!,
    realmId: process.env.QUICKBOOKS_REALM_ID!
  }),
  database: {
    // Your database connection
  }
})
```

### 4.3 Setup Cost Observability

```typescript
// marketplace/financial/cost-tracker.ts
import { CostTracker } from '@floyo/financial-manager'

export const costTracker = new CostTracker({
  services: ['aws', 'gcp', 'azure', 'stripe'],
  aggregationInterval: '1h',
  alertThresholds: {
    daily: 1000,
    monthly: 30000
  }
})

// Track costs
await costTracker.track({
  service: 'aws',
  resource: 'lambda',
  cost: 0.50,
  timestamp: new Date()
})
```

### 4.4 Setup Profitability Tracking

```typescript
// marketplace/financial/profitability.ts
import { ProfitabilityAnalyzer } from '@floyo/financial-manager'

export const profitabilityAnalyzer = new ProfitabilityAnalyzer({
  revenueSources: ['subscriptions', 'marketplace', 'api'],
  costCategories: ['infrastructure', 'operations', 'marketing'],
  marginTargets: {
    gross: 0.70,
    net: 0.30
  }
})

// Analyze profitability
const analysis = await profitabilityAnalyzer.analyze({
  period: 'month',
  date: new Date()
})
```

---

## Part 5: Database Setup

### 5.1 Create Database Schema

```sql
-- marketplace/moderation/reviews.sql
CREATE TABLE moderation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  scores JSONB,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- marketplace/financial/transactions.sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  category VARCHAR(50),
  service VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- marketplace/financial/costs.sql
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  resource VARCHAR(100),
  cost DECIMAL(10, 4) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Run Migrations

```bash
# Using Prisma
npx prisma migrate dev --name marketplace_setup

# Or using Supabase
supabase db push
```

---

## Part 6: Deployment

### 6.1 Build Application

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
python -m build
```

### 6.2 Deploy to Production

```bash
# Using Docker
docker-compose -f docker-compose.prod.yml up -d

# Or using platform-specific deployment
npm run deploy:production
```

### 6.3 Verify Setup

```bash
# Health check
curl https://api.floyo.app/health

# SDK endpoint
curl https://api.floyo.app/api/marketplace/status

# Moderation endpoint
curl https://api.floyo.app/api/marketplace/moderate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"content": "test", "contentType": "text"}'
```

---

## Part 7: Monitoring & Alerts

### 7.1 Setup Monitoring

```typescript
// marketplace/monitoring/setup.ts
import { setupMonitoring } from '@floyo/monitoring'

setupMonitoring({
  services: ['moderation', 'financial', 'sdk'],
  alerts: {
    moderationQueueSize: 1000,
    costThreshold: 1000,
    errorRate: 0.05
  }
})
```

### 7.2 Configure Alerts

- **Moderation Queue:** Alert when queue > 1000 items
- **Cost Threshold:** Alert when daily cost > $1000
- **Error Rate:** Alert when error rate > 5%

---

## Troubleshooting

### Common Issues

1. **SDK Initialization Fails**
   - Check API key is correct
   - Verify network connectivity
   - Check environment variables

2. **Moderation Service Errors**
   - Verify API keys are valid
   - Check rate limits
   - Review error logs

3. **Financial Integration Issues**
   - Verify Stripe/QuickBooks credentials
   - Check webhook endpoints
   - Review transaction logs

### Support

- Documentation: `https://docs.floyo.app/marketplace`
- Support Email: `marketplace-support@floyo.app`
- Discord: `https://discord.gg/floyo`

---

**Last Updated:** $(date)
