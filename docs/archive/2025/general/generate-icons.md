> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Icon Generation Instructions

The app needs these icon files in `frontend/public/`:

- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `apple-touch-icon.png` (180x180px)
- `favicon.ico` (16x16, 32x32, or multi-size)

## Quick Options:

### Option 1: Online Tools (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload a logo (512x512px recommended)
3. Generate all icons
4. Download and place in `frontend/public/`

### Option 2: Use PWA Asset Generator
```bash
npm install -g pwa-asset-generator
# Create a 512x512 source image first
pwa-asset-generator logo.png public/ --icon-only --background "#3b82f6"
```

### Option 3: Create Simple Placeholder
For development, you can create simple colored squares with the letter "F":

```bash
# Using ImageMagick (if installed)
convert -size 512x512 xc:"#3b82f6" -pointsize 300 -fill white -gravity center -annotate +0+0 "F" icon-512.png
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 180x180 apple-touch-icon.png
convert icon-512.png -resize 32x32 favicon.ico
```

### Option 4: Manual Creation
Use any image editor to create:
- 512x512px icon with Floyo branding
- Resize to 192x192, 180x180, and 32x32 sizes
- Export as PNG (except favicon.ico)

**Note**: Without these icons, the PWA won't be installable. The app will still work, but installation prompts won't appear.
