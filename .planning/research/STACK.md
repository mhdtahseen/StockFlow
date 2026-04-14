# Project Research: STACK.md

## Standard 2025 Stack (StockFlow Context)

### Core Frameworks (Existing)
- **React 19**: Leveraging concurrent rendering and stability.
- **Vite 7**: Ultra-fast hot module replacement.
- **Tailwind CSS 4**: Modern, performance-first styling.
- **Supabase**: Backend-as-a-Service for Auth, DB, and Realtime sync.

### Mobile & Native Performance (MVP 2 Addition)
- **Trusted Web Activity (TWA)**: Wrapping the PWA for Play Store using **Bubblewrap** / **PWABuilder**.
- **WebAuthn (Passkeys)**: Recommended standard for biometric authentication (Fingerprint/FaceID) inside TWA.
- **androidx.core:splashscreen**: Standard Android API for reliable, non-flicker splash screens.

### Scanning & Inventory
- **ZXing-JS/Library**: Core barcode engine. 
- **Optimization Strategy**: Use `Canvasing` for cropped scan areas and `possibleFormats` [CODE_128] to reduce CPU overhead.

## Confidence Levels
- **PWA-to-TWA**: [High] Well-documented path for Android native-feel.
- **ZXing Performance**: [Medium] Requires manual canvas manipulation for the "Smooth Scan" requirement.
- **WebAuthn**: [High] Broad support in modern chromium-based Android browsers.
