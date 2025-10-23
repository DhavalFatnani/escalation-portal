# PWA Installation Guide

## Escalation Portal - Progressive Web App

The Escalation Portal is now a fully installable Progressive Web App (PWA) that can be downloaded and run like a native application on Mac, Windows, Linux, Android, and iOS.

## ✨ Features

- 📱 **Installable** - Add to home screen / desktop
- 🔌 **Offline Support** - Basic functionality works offline
- ⚡ **Fast Loading** - Cached assets for instant startup
- 🖥️ **Fullscreen Mode** - Distraction-free work environment
- 🔔 **Push Notifications** - Real-time updates (future)
- 📊 **Standalone App** - Runs in its own window

## 🚀 How to Install

### On Chrome/Edge (Windows, Mac, Linux)

1. Open the Escalation Portal in Chrome or Edge
2. Look for the **"Install App"** button in the sidebar footer
3. Click **"Install Now"**
4. Or click the install icon (⊕) in the address bar
5. Click **"Install"** in the popup
6. The app will open in its own window and appear on your desktop/applications

**Alternative Method:**
- Menu (⋮) → **"Install Escalation Portal..."**

### On Safari (Mac)

1. Open the Escalation Portal in Safari
2. Click **File** → **"Add to Dock"**
3. The app will appear in your Dock and Applications folder

### On iOS (iPhone/iPad)

1. Open the Escalation Portal in Safari
2. Tap the **Share** button (□↑)
3. Scroll and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app icon will appear on your home screen

### On Android

1. Open the Escalation Portal in Chrome
2. Tap the **Menu** (⋮)
3. Tap **"Install app"** or **"Add to Home screen"**
4. Tap **"Install"**
5. The app will appear in your app drawer

## 🎯 App Features After Installation

### Fullscreen Mode
- Click the fullscreen button in the sidebar footer
- Or press **F11** (Windows/Linux) / **Ctrl+Cmd+F** (Mac)
- Immersive work environment without browser chrome

### Offline Support
- The app caches pages and data for offline access
- Create tickets offline (syncs when back online)
- View previously loaded data
- Automatic retry when connection restored

### Desktop Integration
- **Windows**: Appears in Start Menu and Taskbar
- **Mac**: Appears in Applications folder and Dock
- **Linux**: Appears in application launcher
- Own app icon and window
- Alt+Tab / Cmd+Tab switching

### Keyboard Shortcuts
- **F11** - Toggle fullscreen (Windows/Linux)
- **Ctrl+Cmd+F** - Toggle fullscreen (Mac)
- **Ctrl/Cmd + W** - Close app
- **Ctrl/Cmd + R** - Refresh app

## 🔧 Technical Details

### Service Worker
- **Cache Strategy**: Cache-first for static assets, network-first for API calls
- **Offline Fallback**: Shows offline page when no connection
- **Auto-Update**: Checks for updates every hour
- **API Caching**: 24-hour cache for API responses

### Manifest Configuration
- **Name**: Escalation Portal - KNOT
- **Theme Color**: Indigo (#4f46e5)
- **Background**: Navy (#0f172a)
- **Display Mode**: Standalone (app-like)
- **Orientation**: Any (portrait/landscape)

### Browser Support
- ✅ Chrome 67+ (Windows, Mac, Linux, Android)
- ✅ Edge 79+ (Windows, Mac)
- ✅ Safari 15.4+ (Mac, iOS)
- ✅ Firefox 75+ (Partial support)
- ✅ Opera 54+ (Windows, Mac, Linux, Android)

## 📦 Files Added

- `frontend/public/manifest.json` - PWA configuration
- `frontend/public/sw.js` - Service worker for caching
- `frontend/public/offline.html` - Offline fallback page
- `frontend/public/icon-*.png` - App icons (192px, 512px, maskable)
- `frontend/src/components/PWAInstallPrompt.tsx` - Install prompt UI
- `frontend/src/components/FullscreenToggle.tsx` - Fullscreen control

## 🎨 UI Components

### Install Prompt (Sidebar Footer)
- Automatically appears when app is installable
- Shows "Install Now" button
- Dismissible
- Shows "App Installed" badge after installation

### Fullscreen Toggle (Sidebar Footer)
- One-click fullscreen mode
- Icon shows current state (Maximize/Minimize)
- Works in both expanded and collapsed sidebar

## 🔍 Troubleshooting

### Install button doesn't appear?
- Make sure you're using HTTPS (required for PWA)
- Clear browser cache and reload
- Check if app is already installed
- Try a different browser

### Offline mode not working?
- Check browser console for service worker errors
- Ensure service worker is registered
- Visit the site while online first to cache assets

### App not updating?
- Close all app windows
- Uninstall and reinstall
- Or clear cache in app settings

## 📊 Performance Benefits

- **Faster Load**: Cached assets load instantly
- **Less Bandwidth**: Reuses cached data
- **Better UX**: App-like experience
- **Offline Access**: Work without internet
- **Desktop Integration**: Native app feel

## 🔐 Security

- Same security as web version
- HTTPS required for installation
- Isolated storage per domain
- Service worker scope limited to app
- Automatic updates via service worker

## 📱 Uninstalling

### Chrome/Edge
- Right-click app icon → **"Uninstall"**
- Or: Settings → Apps → Find "Escalation Portal" → Uninstall

### Safari (Mac)
- Right-click app in Dock → **"Remove from Dock"**
- Delete from Applications folder

### iOS
- Long-press app icon → **"Remove App"**

### Android
- Long-press app icon → **"Uninstall"**

## 🎯 Best Practices

1. **Install on desktop** for daily use
2. **Enable fullscreen** for focused work
3. **Keep app open** for instant access
4. **Update regularly** by closing and reopening
5. **Use keyboard shortcuts** for efficiency

---

**Enjoy your native-like Escalation Portal experience! 🚀**

