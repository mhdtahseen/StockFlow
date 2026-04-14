# 🧪 stockflow Testing & Validation

This document provides a framework for verifying the integrity and performance of the stockflow platform.

---

## 💶 Financial Integrity (UAT)

Since the Ledger is automated, testing involves verifying that business actions produce the correct "Watchtower" trails.

### Scenario 1: PO Rejection
- **Action**: Mark a unit as "Rejected" during a Purchase Order inspection.
- **Expected Result**: 
  - [ ] A `v-po-reject-{id}` entry appears in the Ledger.
  - [ ] The amount is logged as a credit (positive) from the vendor.
  - [ ] The item's cost basis is zeroed out in Analytics.

### Scenario 2: Repair Log Expense
- **Action**: Add a ₹500 repair note to an inventory item.
- **Expected Result**:
  - [ ] A `v-repair-{id}` entry appears in the Ledger with an amount of `-500`.
  - [ ] The "True Profit" for that specific phone ID decreases by 500.

---

## 📸 Scanner Performance

We optimized the scanner to use an **Integral Image (Summed Area Table)** algorithm for real-time binarization.

### Benchmarks
| Environment | Target Latency | Pass Criteria |
|-------------|----------------|---------------|
| Frame Analysis | < 10ms | Frame processed in $O(N)$ time |
| OCR Timeout | 800ms | Interval between concurrent OCR scans |
| Stability | 60fps | Zero "blinks" or video feed hitches during scan |

### Environmental Testing
- **Low Light**: Verify that `applyAdaptiveThreshold` correctly binarizes text even in shadows.
- **High Glare**: Test scanning through plastic wrapping (common in hardware shipping).
- **Handheld Stability**: Verify that `applySharpen` kernel maintains focus during minor hand shakes.

---

## 📱 PWA & Cross-Device Compatibility

### Physical Device Checklist
1.  **iOS (Safari)**: Verify "Add to Home Screen" works and camera permissions persist.
2.  **Android (Chrome)**: Verify full-screen "standalone" mode (no address bar).
3.  **Laptops**: Verify that the **Digital Zoom Fallback** scales the feed correctly without hardware support.

### Persistence Offline
1.  Turn on **Airplane Mode**.
2.  Perform a Sale or Ledger entry.
3.  Verify the entry appears in the app but is marked as "Pending Sync".
4.  Reconnect to the network and verify the entry reaches the Supabase backend.

---

## 🛠 Self-Audit Script
You can check for basic lint and build errors using the following:
```bash
# Check TypeScript integrity
npm run build
```
