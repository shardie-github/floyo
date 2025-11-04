# Partner Integration Contracts

## Overview
Integration contracts for webhooks and events.

## Webhook Endpoints

### Stripe
- **URL**: `/api/webhooks/stripe`
- **Method**: POST
- **Signature**: `stripe-signature` header
- **Payload**: Stripe webhook event

### TikTok
- **URL**: `/api/webhooks/tiktok`
- **Method**: POST
- **Signature**: Custom HMAC
- **Payload**: TikTok event

### Meta
- **URL**: `/api/webhooks/meta`
- **Method**: POST
- **Signature**: Facebook signature
- **Payload**: Meta webhook event

## Event Schema

### Standard Event Format
```json
{
  "event": "string",
  "timestamp": "ISO8601",
  "data": {},
  "metadata": {}
}
```

## Contract Tests

Run contract tests:
```bash
npm run test:contracts
```

## Postman Collection

Import `partners/postman-collection.json` into Postman.

## Integration Checklist

- [ ] Webhook endpoint implemented
- [ ] Signature validation
- [ ] Payload schema validated
- [ ] Error handling
- [ ] Retry logic
- [ ] Audit logging
- [ ] Contract tests pass
