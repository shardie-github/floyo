# Marketplace & App Store Integration

Complete documentation and implementation for Floyo's marketplace, app store SDK approval, automated moderation, and financial management.

## 📚 Documentation

- **[App Store SDK Approval](./APP_STORE_SDK_APPROVAL.md)** - Complete guide for Apple, Google, and Microsoft store approvals
- **[Setup Instructions](./SETUP_INSTRUCTIONS.md)** - Step-by-step setup guide
- **[Marketing Content](./MARKETING_CONTENT.md)** - App store page content and marketing materials

## 🏗️ Implementation

### SDK (`marketplace/sdk/`)
- Main SDK entry point
- Platform detection
- Event tracking
- API integration

### Moderation (`marketplace/moderation/`)
- Multi-provider content moderation (OpenAI, Perspective API, Google Cloud)
- Automated flagging and review queue
- Batch processing
- Webhook support

### Financial Manager (`marketplace/financial/`)
- Cost observability tracking
- Revenue tracking
- Operating expense management
- Profitability analysis
- Margin calculations
- Stripe & QuickBooks integration

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install @floyo/marketplace-sdk openai @google-cloud/language stripe quickbooks-node-sdk
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Initialize SDK:**
   ```typescript
   import { createSDK } from '@/marketplace/sdk'
   
   const sdk = createSDK({
     apiKey: process.env.FLOYO_SDK_API_KEY!,
     environment: 'production',
     endpoint: 'https://api.floyo.app'
   })
   
   await sdk.initialize()
   ```

4. **Use moderation:**
   ```typescript
   import { ModerationService } from '@/marketplace/moderation/service'
   
   const result = await moderationService.moderate({
     content: 'User content here',
     contentType: 'text'
   })
   ```

5. **Track finances:**
   ```typescript
   import { FinancialManager } from '@/marketplace/financial/manager'
   
   await financialManager.trackCost({
     service: 'aws',
     resource: 'lambda',
     cost: 0.50,
     currency: 'USD',
     period: { start: new Date(), end: new Date() }
   })
   ```

## 📊 Features

### SDK Features
- ✅ Multi-platform support (iOS, Android, Web, Windows, macOS)
- ✅ Automatic platform detection
- ✅ Event tracking
- ✅ API key validation
- ✅ Error handling

### Moderation Features
- ✅ Multi-provider moderation (OpenAI, Perspective, Google)
- ✅ Automated approval/rejection
- ✅ Review queue management
- ✅ Batch processing
- ✅ Configurable thresholds
- ✅ Flag generation

### Financial Features
- ✅ Cost tracking by service/resource
- ✅ Revenue tracking by source
- ✅ Operating expense management
- ✅ Profitability analysis
- ✅ Margin calculations
- ✅ Cost observability dashboards
- ✅ Alert system
- ✅ Stripe integration
- ✅ QuickBooks integration

## 🔧 Configuration

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed configuration.

## 📝 API Routes

- `POST /api/marketplace/moderate` - Content moderation
- `POST /api/marketplace/financial` - Financial operations
- `GET /api/marketplace/financial?action=profitability` - Profitability analysis

## 🗄️ Database Schema

See setup instructions for database schema creation.

## 📈 Monitoring

- Cost alerts when thresholds exceeded
- Moderation queue monitoring
- Profitability tracking
- Margin analysis

## 🔒 Security

- API key authentication
- Webhook signature verification
- Encrypted data storage
- GDPR/CCPA compliance

## 📞 Support

- Documentation: `https://docs.floyo.app/marketplace`
- Support Email: `marketplace-support@floyo.app`
- Discord: `https://discord.gg/floyo`

---

**Last Updated:** $(date)
