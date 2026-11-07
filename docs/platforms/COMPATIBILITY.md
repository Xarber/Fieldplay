# Platform differences

| Platform | Client implementation | Validation limit |
|---|---|---|
| Web | Expo production SPA, MapLibre GL JS 6 named API, browser WebRTC, foreground geolocation, IndexedDB, file pickers/downloads, static-shell service worker | Desktop Chromium and mobile-size Chromium; no actual Android install/iOS Add to Home Screen evidence |
| iOS/iPadOS | React Native/Expo, MapLibre Native, native WebRTC, foreground Expo Location, SQLite/SecureStore, camera/share/file APIs; capability-gated Liquid Glass | Generated native project and Hermes JavaScript; no native archive/device run yet |
| Android | Shared RN/Expo UI/rules; native MapLibre/WebRTC, foreground location, SQLite/SecureStore, official PackageInstaller update module | Generated project/Hermes; installer/signature flow uncompiled and untested on device |

Android minimum API 28 is explicitly configured for the new app. The installed React Native helper sets iOS 15.1 and minimum Xcode 16.1; do not silently raise it later. There is no background location entitlement/service, BLE discovery or permanent location sharing. App backgrounding stops local watchers and pauses active play rather than promising uninterrupted GPS.

Native WebRTC's published config-plugin tested matrix trails SDK 58; generating config does not settle binary compatibility. Validate real native builds and two physical devices before calling the native targets functional. The platform module's OS installation result is distinct from opening the installer.

Solid high-contrast surfaces are the fallback when glass is unavailable or Reduce Transparency is on. Reduced Motion removes press scale/sheet movement. Tabs, maps, GPS samples and frequent clock updates remain immediate. Device motion/performance judgment requires a release build on supported slower hardware.
