# Project Research: PITFALLS.md

## Critical Pitfalls to Avoid

### IMEI Scanning
- **`TRY_HARDER` Overuse**: Enabling this slows down the frame rate significantly on mid-range Android devices, making the scanner feel "laggy."
- **Full-Frame Decoding**: Trying to decode the entire 1080p stream instead of a cropped center-box. This causes "ID confusion" when multiple device barcodes are visible.
- **Auto-Focus Neglect**: Failing to use `{ advanced: [{ focusMode: 'continuous' }] }` in `getUserMedia` leads to blurry, unreadable high-density IMEIs.

### TWA / Android (PWABuilder)
- **Assetlink Mismatches**: Incorrect SHA-256 fingerprint leads to the "URL Bar" appearing, breaking the premium native feel.
- **Splash Screen Flickering**: Using custom activities instead of the `androidx.core:splashscreen` API causes a flash of blank screen during cold starts.
- **Offline Desync**: Trusting the network status API without a manual "Retry Sync" trigger for edge cases.

### Financials
- **Gross Margin Overestimation**: Ignoring "Landed Costs" (shipping/taxes) when calculating device profitability.
- **Race Conditions**: Updating the ledger state during an out-of-order sync attempt.
- **Bucket Inconsistency**: Allowing a sale to process when the "Cash" bucket is logically empty (unless Credit is enabled).

## Warning Signs
- **Latency > 200ms** in scanner feedback.
- **Unreachable `/ .well-known/assetlinks.json`** on the production domain.
- **Total P&L mismatch** between aggregate sales and ledger balances.
