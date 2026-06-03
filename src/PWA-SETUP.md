# Progressive Web App (PWA) Setup Guide

Your Lowkey Gem marketplace is now configured as a Progressive Web App! Users can install it on their iOS and Android devices and use it like a native app.

## ✅ What's Already Configured

- ✅ `manifest.json` with app metadata
- ✅ Service worker for offline functionality
- ✅ iOS-specific meta tags for home screen installation
- ✅ PWA head component that injects all necessary meta tags
- ✅ Purple theme color (#970747) matching your brand
- ✅ Standalone display mode (appears like a native app)

## 📱 How Users Can Install

### iOS (iPhone/iPad)
1. Open the website in Safari
2. Tap the Share button (square with arrow pointing up)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right corner
5. The app icon will appear on their home screen

### Android (Chrome)
1. Open the website in Chrome
2. Tap the menu (three dots) in the top right
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Add" or "Install" to confirm
5. The app icon will appear on their home screen

## 🎨 Generate App Icons

You need to create app icons for the PWA to display properly:

### Option 1: Use the Icon Generator (Quick)
1. Open `/public/generate-icons.html` in your browser
2. Download all three icons:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `apple-touch-icon-180.png` (180x180)
3. Place these files in your `/public` directory or root directory

### Option 2: Create Custom Icons (Recommended)
Design your own icons with these specifications:

**icon-192.png**
- Size: 192x192 pixels
- Format: PNG
- Purpose: Android home screen icon

**icon-512.png**
- Size: 512x512 pixels
- Format: PNG
- Purpose: Android splash screen and high-res displays

**apple-touch-icon-180.png** & **apple-touch-icon.png**
- Size: 180x180 pixels
- Format: PNG
- Purpose: iOS home screen icon

### Design Tips
- Use your purple brand color (#970747) as the background
- Include "LG" text or your logo
- Make sure the icon looks good at small sizes
- Avoid text that's too small to read
- Test on both light and dark backgrounds

## 🔧 Files You May Need to Update

### 1. Manifest (`/manifest.json`)
- Update `name` and `short_name` if needed
- Add actual screenshot images for app stores
- Customize theme colors

### 2. Service Worker (`/service-worker.js`)
- Already configured for basic offline support
- Add more URLs to cache if needed
- Customize caching strategy

### 3. Icons Directory
Place your generated/custom icons in the appropriate directory:
```
/public/
  ├── icon-192.png
  ├── icon-512.png
  ├── apple-touch-icon.png
  └── apple-touch-icon-180.png
```

## 🚀 Features Enabled

1. **Offline Support**: App works offline after first visit
2. **Home Screen Installation**: Users can install like a native app
3. **Standalone Mode**: Opens without browser UI
4. **Purple Theme**: System UI matches your brand color
5. **App Name**: "Lowkey Gem" displays on home screen
6. **Optimized for Mobile**: Viewport settings for best mobile experience

## 🧪 Testing

### Desktop (Chrome)
1. Open DevTools (F12)
2. Go to Application tab
3. Check Manifest and Service Workers sections
4. Use Lighthouse to audit PWA score

### Mobile
1. Test installation flow on real devices
2. Verify icons appear correctly
3. Test offline functionality
4. Check app opens in standalone mode

## 📊 Current PWA Score

Your app should score well on these criteria:
- ✅ Provides a manifest
- ✅ Has a service worker
- ✅ Works offline
- ✅ Is served over HTTPS (when deployed)
- ⚠️ Needs real icons (use generator or custom)

## 🎯 Next Steps

1. Generate or design your app icons
2. Test on iOS and Android devices
3. Deploy to HTTPS server for full PWA functionality
4. Add app screenshots to manifest for better install prompts
5. Consider adding push notifications (optional)

---

**Note**: PWAs require HTTPS to work fully. When deployed to production, ensure your hosting supports HTTPS.
