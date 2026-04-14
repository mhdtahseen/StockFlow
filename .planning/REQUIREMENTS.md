# Milestone 3: Android TWA & Production Prep (v2.3)

## Goal
Optimize StockFlow for the Google Play Store via Trusted Web Activity (TWA) and integrate modern biometric security for high-speed merchant operations.

## Functional Requirements

### 📱 Android Native Experience
- **FR-08**: Optimize the web application for TWA wrapping using PWABuilder specifications.
- **FR-09**: Implement a custom Android splash screen and app icon configuration in `manifest.json`.
- **FR-10**: Adaptive HUD pattern: Ensure scanner and manifest UI adapt perfectly to various Android aspect ratios and keyboard behaviors.

### 🔐 Biometric Authentication
- **FR-11**: Integrate WebAuthn (Passkey) support for biometric login (Fingerprint/FaceID) to eliminate password friction.
- **FR-12**: "Quick Checkout" security: Allow biometric re-authentication for sensitive financial operations (e.g., settling large POs).

## Technical Requirements

### 🛠 Mobile Optimization
- Harden `service-worker.js` for aggressive offline asset caching in TWA mode.
- Audit all `fixed` positioning elements for compatibility with Android's "Display Cutout" (notch) and navigation bars.

### 🛡 Security & Compliance
- **Multi-Tenant Audit**: Verify that all `shared_links` and `orders` queries strictly enforce the `tenant_id` constraint at the database layer.
- **Production Readiness**: Finalize Supabase Auth email templates and domain white-listing.

## Constraints
- TWA must maintain a perfect 100/100 Lighthouse score for "Installable" and "PWA" categories.
- Biometric fallback must gracefully revert to standard login if hardware is unavailable.
