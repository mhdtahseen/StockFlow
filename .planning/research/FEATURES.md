# Project Research: FEATURES.md

## MVP 2 Feature Categories

### Table Stakes (Must-Have or users leave)
- **Accurate IMEI Scanning**: Lag-free detection with high confidence in varied lighting.
- **Offline Data Integrity**: Outbox-based sync that prevents data loss during intermittent connectivity.
- **TWA Stable Launch**: Native-feeling splash screens and absence of the URL bar (Trusted mode).
- **Correct Ledger Math**: Real-time updates to Cash, Bank, and Credit based on transactions.

### Differentiators (Competitive Advantage)
- **4-Bucket Financial Clarity**: Immediate P&L visibility across different payment methods.
- **Glassmorphism UI**: Premium design that elevates the app above standard ERP clones.
- **Device Snapshots**: Detailed historical data for every device throughout the sales cycle.

### Anti-Features (Will NOT build in MVP 2)
- **Automatic Overhead Deductions**: Rent and utility tracking (deferred to MVP 3).
- **In-App Messaging**: Social/Support chat inside the app.
- **Inventory Sourcing Marketplace**: Direct ordering from wholesalers in-app.

## Complexity Notes
- **IMEI Scan Accuracy**: High Complexity. Requires fine-tuning of media capture constraints.
- **P&L Tracking**: Medium Complexity. Logic is simple but edge cases in multi-currency or returns add depth.
- **Android Compatibility**: Low-Medium Complexity. Mostly manifest and signing certificate configuration.
