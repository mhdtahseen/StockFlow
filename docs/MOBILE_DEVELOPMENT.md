# Mobile Development Guide (Android & iOS)

The Finventree app (`apps/app`) is built with **React + Vite + Capacitor 8**. Capacitor wraps the web build into a native Android and iOS app.

---

## Prerequisites

| Tool | Required for | How to check |
|------|-------------|--------------|
| Android Studio | Android builds | `which studio` or open from Applications |
| Xcode 26+ | iOS builds | `xcodebuild -version` |
| CocoaPods 1.x | iOS dependencies | `pod --version` |
| Java 17+ | Gradle (Android) | `java -version` |
| Node 22 | Build tooling | `node --version` |

---

## Project structure

```
apps/app/
├── src/                        # React source code
├── dist/                       # Vite build output (web assets)
├── android/                    # Native Android project (gitignored)
│   └── app/src/main/assets/public/   ← web assets copied here
├── ios/                        # Native iOS project (gitignored)
│   └── App/App/public/               ← web assets copied here
├── capacitor.config.ts         # Capacitor configuration
└── vite.config.ts              # Vite build config
```

The `android/` and `ios/` folders are **gitignored** — they live only on your local machine and are regenerated from the source code.

---

## First-time setup (run once per machine)

### Android

```bash
cd apps/app
pnpm cap:add:android   # creates android/ and runs Gradle sync (~4 min first time)
pnpm cap:open:android  # opens Android Studio
```

### iOS

```bash
cd apps/app
pnpm add @capacitor/ios@^8.3.3   # install iOS platform package
npx cap add ios                  # creates ios/ and installs Swift packages
pnpm cap:open:ios                # opens Xcode
```

> If you see a CocoaPods-related build error in Xcode, run:
> ```bash
> cd apps/app/ios/App && pod install
> ```
> Then re-open with `pnpm cap:open:ios`.

---

## Running on a simulator or device

### Android Studio
1. Wait for Gradle sync to finish (bottom status bar)
2. Select a device from the dropdown (top toolbar) — emulator or connected phone
3. Click **▶ Run** (`Shift+F10`)

### Xcode
1. Select a simulator from the scheme/device dropdown (top left)
2. Click **▶ Run** (`Cmd+R`)
3. First run may take a few minutes to compile

---

## Daily workflow — after making code changes

```bash
cd apps/app
pnpm cap:sync           # build Vite → dist/, then copy into android/ and ios/
pnpm cap:open:android   # open Android Studio (then press Run)
pnpm cap:open:ios       # open Xcode (then press Run)
```

`cap:sync` always does both platforms in one step — no need to run it separately for each.

---

## Available scripts (from `apps/app/package.json`)

| Script | What it does |
|--------|-------------|
| `pnpm cap:sync` | Builds (`vite build --mode capacitor`) + copies to android/ and ios/ |
| `pnpm cap:open:android` | Opens the android/ project in Android Studio |
| `pnpm cap:open:ios` | Opens the ios/ project in Xcode |
| `pnpm cap:add:android` | One-time: creates the android/ native project |
| `pnpm cap:add:ios` | One-time: creates the ios/ native project |
| `pnpm build:capacitor` | Build only (no copy to native) |

All commands must be run from the `apps/app/` directory, or prefixed with `pnpm --filter @finventree/app` from the monorepo root.

---

## Capacitor config (`capacitor.config.ts`)

```ts
{
  appId: 'com.hyllos.finventree',   // Bundle ID used in Play Store / App Store
  appName: 'Finventree',
  webDir: 'dist',                   // Vite build output folder
}
```

**If you change `appId`**, you must update it in:
- `apps/app/capacitor.config.ts`
- `apps/app/android/app/build.gradle` (applicationId)
- Xcode → Target → Signing & Capabilities → Bundle Identifier

---

## Plugin versions

All Capacitor plugins must be on the **same major version** as `@capacitor/core` and `@capacitor/cli`. Currently everything is on **v8**.

| Package | Version |
|---------|---------|
| `@capacitor/core` | ^8.3.3 |
| `@capacitor/cli` | ^8.3.3 |
| `@capacitor/android` | ^8.3.3 |
| `@capacitor/ios` | ^8.3.3 |
| All `@capacitor/*` plugins | ^8.x |

If you upgrade any plugin, upgrade all of them together.

---

## Building a release APK / AAB

For Google Play Store submission:

```bash
cd apps/app
pnpm cap:sync
pnpm cap:open:android
```

In Android Studio:
- **Build → Generate Signed Bundle / APK**
- Choose **Android App Bundle (.aab)** for Play Store
- Use your keystore from `StockFlow - Google Play package/`

The signed `.aab` file is what you upload to Google Play Console.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Platform # not found` | CLI/plugin version mismatch — ensure `@capacitor/cli` matches `@capacitor/core` major version |
| `Could not find the android platform` | Run `pnpm add @capacitor/android@^8.3.3` then `npx cap add android` |
| Gradle sync hangs | First-time sync downloads ~500MB — wait 5–10 min. Check internet connection. |
| Xcode build fails on barcode scanner | Run `cd ios/App && pod install`, then re-open Xcode |
| White screen in app | `dist/` folder is stale — run `pnpm cap:sync` again |
| Changes not showing in app | Always run `pnpm cap:sync` before running in Android Studio / Xcode |
