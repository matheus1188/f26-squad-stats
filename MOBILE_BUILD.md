# F26 Arena — Mobile Build Guide

The app is configured in **two ways** so you can install it on phones:

---

## ✅ Option 1 — PWA (already enabled, no build needed)

The web app is now installable directly from the browser:

- **iPhone (Safari):** open the published URL → tap **Share** → **Add to Home Screen**.
- **Android (Chrome):** open the published URL → menu **⋮** → **Install app / Add to Home Screen**.

The app opens in full screen with its own icon, no browser UI. No App Store, no fees.

Files involved: `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` and the head tags in `src/routes/__root.tsx`.

---

## 📱 Option 2 — Native iOS & Android via Capacitor

Lovable cannot compile `.ipa` (iOS) or `.aab/.apk` (Android) in the cloud — you need to run the build on your own machine. The project is already prepared with `capacitor.config.ts`.

### Requirements
- **iOS:** macOS + Xcode 15+ and an Apple Developer account (US$ 99/year) to publish on the App Store.
- **Android:** Android Studio (any OS) and a Google Play developer account (US$ 25 one-time) to publish on Play Store.
- Node.js 20+ and `bun` (or `npm`).

### Steps (run locally after exporting to GitHub)

```bash
# 1) Clone your repo and install dependencies
git clone <your-repo-url>
cd <your-repo>
bun install

# 2) Install Capacitor
bun add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 3) Build the web app
bun run build

# 4) Initialize native projects (only the first time)
bunx cap add ios
bunx cap add android

# 5) Copy the built web assets into the native projects
bunx cap sync

# 6) Open and run
bunx cap open ios       # opens Xcode -> Run on iPhone simulator or device
bunx cap open android   # opens Android Studio -> Run on emulator or device
```

### Publishing

- **iOS App Store:** in Xcode → Product → Archive → Distribute via App Store Connect.
- **Google Play Store:** in Android Studio → Build → Generate Signed Bundle (`.aab`) → upload to Play Console.

### Tips
- Replace `appId` (`app.lovable.f26arena`) in `capacitor.config.ts` with your own bundle ID before publishing.
- App icons live in `ios/App/App/Assets.xcassets/` and `android/app/src/main/res/` after `cap add`. Replace them with the high-res icons in `public/`.
- Whenever you change web code: `bun run build && bunx cap sync`.

### Lovable docs
- Mobile / Capacitor: https://docs.lovable.dev/
- GitHub export: open the GitHub menu in the Lovable editor (top-right ➜ GitHub).
