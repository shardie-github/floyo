# Store Pack

## Google Play Store

### Manifest Requirements
- Package name: `com.yourcompany.floyo`
- Version code: 1
- Version name: 1.0.0
- Minimum SDK: 21
- Target SDK: 34

### Privacy Labels
- Data collected: User IDs, File paths, Usage analytics
- Data shared: Analytics (optional)
- Security practices: Encryption in transit, Data encryption

### Assets Required
- App icon: 512x512px PNG
- Feature graphic: 1024x500px PNG
- Screenshots: 16:9 or 9:16 ratio

## Apple App Store

### App Information
- Bundle ID: `com.yourcompany.floyo`
- Version: 1.0.0
- Build: 1

### Privacy Labels
- Data types: User Content, Usage Data, Diagnostics
- Purposes: App Functionality, Analytics
- Linked to user: Yes
- Used for tracking: No

### Assets Required
- App icon: 1024x1024px PNG
- Screenshots: iPhone 6.7", 6.5", 5.5"
- App preview videos: Optional

## Lint Checklist

- [ ] Package name matches across platforms
- [ ] Version codes incremented
- [ ] Privacy labels accurate
- [ ] Permissions minimal and justified
- [ ] App icons meet size requirements
- [ ] Screenshots updated
- [ ] Store descriptions complete
- [ ] Keywords optimized
- [ ] Age rating appropriate
- [ ] Content rating completed

## Generation Script

Run: `npm run ops store:generate`

This will generate:
- `ops/store/google-play/manifest.json`
- `ops/store/app-store/manifest.json`
- `ops/store/privacy-labels.json`
- `ops/store/lint-checklist.md`
