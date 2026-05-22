/**
 * Comprehensive Finventree Knowledge Base for Gemini grounding.
 * Covers ALL tenant-facing features. Excludes architecture/business decisions.
 * ~4500 tokens — fits comfortably in Gemini Flash context.
 */
export const KNOWLEDGE_BASE = `
# Finventree — Complete Feature Reference

Finventree (formerly StockFlow) is an offline-first mobile inventory & financial management app for electronics resellers and repair shops in India. Available as a native app (Android/iOS) and web app (app.finventree.com).

---

## AUTHENTICATION & ACCOUNT

- Sign up at finventree.com/register with email.
- Login via email magic link (passwordless) or password.
- Password recovery: tap "Forgot Password" on login screen → reset email sent.
- Sessions persist across app restarts. Auto-refresh keeps you logged in.
- Team members join via invite link shared by the admin.

---

## INVENTORY MANAGEMENT

### Adding a Phone
- Tap the **+ button** (large blue circle, bottom center of any screen).
- Fill in: Brand, Model, RAM, Storage, Color, IMEI(s), Purchase Price, Issue Tags (optional).
- **IMEI Scanner**: Tap the camera icon next to IMEI field → rear camera opens. Supports barcode scanning (ZXing, instant) and OCR fallback (Tesseract, for printed/engraved IMEIs). Works in low-light with adaptive thresholding. Hardware zoom + torch/flash available.
- **Predictive Autofill**: When brand/model selected, RAM, storage, and color options auto-populate from a catalog of 200+ phone models.
- Dual-SIM phones support multiple IMEI slots. Real-time Luhn checksum validation catches typos.

### Phone Statuses
- **IN_STOCK**: Available for sale.
- **PENDING**: Reserved, awaiting confirmation or payment.
- **SOLD**: Sale complete and settled.
- **RETURNED**: Returned by customer.

### Phone Detail Page (3 tabs)
- **Details**: Specs, IMEI list, issue tags, purchase price, sale price.
- **Finance**: All ledger entries linked to this specific device.
- **History**: Timeline of events (purchase → repair → sale).

### Editing & Deleting
- Open phone detail → tap **Edit (pencil icon)** top right → modify any field → Save.
- Delete: phone detail → **⋮ menu → Delete**. Phones linked to active orders cannot be deleted.
- Deletion is soft-delete (hidden from list, recoverable by admin).

### Search & Filters
- Search bar: search by IMEI, brand, model, or any field. Fuzzy matching included.
- Filter pills: All / In Stock / Pending / Sold / Returned.

### Repair Logs
- On any phone, add repair entries: issue description, cost, date, notes.
- Repair costs auto-deducted from that device's profit margin via the Watchtower.

---

## PURCHASE ORDERS (PO) — Buying from Suppliers

### Creating a PO
- Go to **Menu → Purchase Orders → +** (or from Add Phone flow with supplier selection).
- Enter: Supplier name, items with quantities and prices, platform fees.
- Save as draft or submit.

### Item Inspection
- Each PO item can be individually inspected after goods arrive.
- States: **ACCEPTED** (green) / **REJECTED** (red) / **PENDING** (amber).
- Rejecting an item auto-creates a refund-due ledger entry for that supplier.

### Certifying a PO
- Tap **Certify PO** once goods are received and inspected.
- This: (1) adds phones to inventory as IN_STOCK, (2) records purchase in ledger, (3) marks PO as certified.

### Supplier Payments
- Record payments against POs (partial or full) with payment mode.
- **Bulk Settlement**: Settle multiple POs at once via Supplier Allocation Sheet.
- Supplier balance tracking shows amount owed.

### PO PDF
- Generate and share PO documents including item list, inspection summary, and rejected items section.

---

## SALES ORDERS (SO) — Selling to Customers

### Creating an SO
- Go to **Menu → Sales Orders → +** (or from Phone Detail → "Create Trade Order", or multi-select in Inventory).
- Select customer (or create inline), add phones, set prices, apply discount (toggle Tag icon).
- Payment modes: Cash, UPI, Bank Transfer, Cheque.

### Order Status Flow
DRAFT → CONFIRMED → PAID / PARTIAL / OVERDUE / CANCELLED

### Payments on Orders
- Open order → scroll to Payment section → **Add Payment**.
- Supports partial payments — order shows "Partially Paid" status.
- Multi-order allocation: one payment split across multiple orders via Payment Allocation Sheet.

### Returns & Cancellation
- **Return**: Available on SETTLED orders. Refund entry auto-created in ledger.
- **Cancel**: Soft-cancels the order (status → CANCELLED).

### Invoice PDF
- Open Sales Order → tap **Share icon** (top right) → generates PDF.
- Share via WhatsApp, email, or any app.
- Web: styled print layout. Native: filesystem + share sheet.

### Public Share Links
- Generate a shareable link (HMAC-signed, 30-day expiry).
- Recipients can view order details without logging in.

---

## PAYMENTS & ADVANCE CREDIT

### Payment Modes
Supported: **Cash**, **UPI**, **Bank Transfer**, **Cheque**.

### Recording Payments
- From any order: open → Payment section → Add Payment → enter amount + mode.
- Each payment mode creates its own ledger row for accurate financial tracking.

### Multi-Order Payment Allocation
- One customer payment can be split across multiple outstanding orders.
- PaymentAllocationSheet handles the split.

### Advance Credit System
- Customer overpayment is stored as credit balance.
- Credit auto-applies to the next order for that customer.
- Credit balance visible in Customer Detail and on order creation.

---

## CUSTOMER MANAGEMENT

### Customer Types
- **CUSTOMER** (blue), **WHOLESALER** (amber), **RETAILER** (violet), **PLATFORM** (teal).

### Adding Customers
- **Menu → Customers → +** → Name, Phone number, Type, Address.
- Can also create inline during order creation.

### Customer Detail
- Shows: AR (Accounts Receivable) balance, total sales, amount paid, balance due.
- Full order history for that customer.
- Direct call link from phone number.
- Record payments directly from customer page.

### Customer Balance Tracking
- Outstanding receivables auto-calculated from orders and payments.
- Aging analysis available in analytics (how long debts have been outstanding).

### Delete
- Customers with active orders cannot be deleted.
- Soft delete with confirmation.

---

## TRADE NETWORK (Enterprise Plan)

### Trade Code
- Every shop gets a unique 6-character trade code (visible on Profile page).
- Copy code or share connect link: finventree.app/connect/{CODE}.
- Profile QR code available for scanning.

### Connecting with Another Business
- **QR Scanner**: Customers page → violet QR FAB → scan another shop's QR code.
- **Manual**: Customers page → Connect → type 6-char code.
- Choose relationship: Supplier/Wholesaler, Customer/Buyer, or Retailer/Peer.
- Connection creates counterparty entries on BOTH sides simultaneously.
- Already-connected? Shows "Already connected" message.

### Inter-Tenant Transfers
- When a linked customer is selected during order creation, a TRANSFER order type is auto-detected.
- Transfer orders sync status between both tenants.

### Deep Links
- Scanning a Finventree QR from any camera app opens the app directly to the connect flow.
- Links work on both native (deep link) and web (URL route).

---

## FINANCIAL LEDGER & WATCHTOWER

### How It Works
The Watchtower auto-creates ledger entries for EVERY business event — no manual entry needed:
- Purchase Order created → SUPPLIER_PAYMENT + EXPENSE entries
- PO item rejected → refund-due entry (IN)
- Sale Order created → CUSTOMER_PAYMENT + DEBT_PLEDGED entries
- Customer payment received → CUSTOMER_PAYMENT (IN)
- Repair logged → REPAIR_COST (OUT)
- Phone price adjusted → INVENTORY_ADJUSTMENT

### Ledger UI
- **Menu → Accounts Ledger** (requires Starter plan or above).
- Chronological list grouped by date.
- Color-coded: green = income, red = expense, blue = adjustments.
- Filter by type, date range, payment mode.

### Payment Mode Tracking
- Each payment channel (Cash, UPI, Bank Transfer) gets its own ledger row.
- Enables: "How much did I receive via UPI this month?" queries.

### Excel Export
- One-click XLSX export with customizable date range and filters.

---

## ANALYTICS & DASHBOARD

### Dashboard (Home Page)
- **Wallet Card**: Available balance, locked capital, total profit.
- **Inventory Summary**: Counts of In Stock / Sold / Pending.
- **Recent Activity Feed**: Latest transactions.
- Net cash flow, average profit per device.

### Analytics Page (Pro plan required)
- Revenue vs COGS charts (monthly trends).
- Profit breakdown by brand/model.
- Inventory aging and turnover.
- Payment distribution by mode.
- Credit aging (outstanding receivables by age).
- Model velocity (which phones sell fastest).

---

## BILLING & PLANS

### Trial
- 6-month free trial with full feature access.
- After trial expires, a paid plan is required.

### Plans

| Plan | Seats | Phones | Key Features |
|------|-------|--------|--------------|
| **Starter** | 1 | 100 | Sales & Purchase Orders, Customer Directory, PDF Invoices |
| **Pro** | 10 | Unlimited | + IMEI Scanner, Advanced Ledger, Analytics, Credit Tracking, Public Share Links, Multi-device Orders |
| **Enterprise** | Unlimited | Unlimited | + Bulk Invoices, Trade Network, SLA Guarantee, Dedicated Support |

### Upgrading
- **Menu → Upgrade Plan** or tap any PRO badge on a locked feature.
- Payment via Razorpay (cards, UPI, netbanking).
- Features unlock immediately after payment.

### Cancelling
- **Menu → App Settings → Manage Subscription**.
- Access continues until end of current billing period.
- Refund requests: email support@finventree.com.

### Feature Gates
- Some features show a lock/PRO badge when not available on current plan.
- Tapping the badge shows which plan is needed and a direct upgrade button.

---

## TEAM & MULTI-TENANCY

### Roles
- **Admin**: Full access — team management, billing, all features.
- **Manager**: Most operations except tenant settings and billing.
- **Associate**: Day-to-day operations (add phones, create orders) — cannot view profit/analytics.

### Inviting Members
- **Menu → Manage Team → Invite Member** → generates invite link.
- Share link via WhatsApp/SMS/email → recipient signs up and joins your shop.
- Seat limits enforced: Starter=1, Pro=10, Enterprise=unlimited.

### Data Isolation
- Each shop's data is completely separate. One shop cannot see another's inventory or orders.

---

## NOTIFICATIONS

- **Bell icon** (top right of header) shows unread notifications.
- Push notifications: enabled on both native (FCM/APNs) and web (VAPID).
- Toggle push on/off in Settings.
- Notification types: connection accepted, order events, system alerts.

---

## SYNC & OFFLINE

- The app works **fully offline**. Add phones, create orders, record payments — all without internet.
- Changes saved locally and sync automatically when connection resumes.
- If sync issues occur: yellow ! badge on Menu icon → go to **Profile → Developer Tools** to retry stuck items.
- Up to 3 automatic retry attempts per item.

---

## SCANNER DETAILS

### IMEI Barcode Scanner
- Rear camera, full-screen overlay.
- Primary: ZXing barcode reader (instant for standard barcodes).
- Fallback: Tesseract.js OCR for printed/engraved IMEIs.
- Features: hardware zoom, torch/flash, adaptive low-light processing, haptic feedback on success.
- Luhn validation on decoded result — rejects invalid IMEIs.

### QR Scanner (Trade Network)
- Separate scanner for QR codes only (faster, simpler).
- Used on Customers page to scan other shops' trade code QR.
- "Type code manually" fallback always available.

---

## EXPORT & DOCUMENTS

- **Excel Export**: Inventory list and ledger entries → XLSX file with filters.
- **Sales Invoice PDF**: Branded, includes items, pricing, payment status. Web=print layout, Native=PDF file+share.
- **Purchase Order PDF**: Supplier details, item list, inspection summary, rejected items.
- **Public Share Links**: Tokenized URLs for viewing orders without login (30-day expiry).

---

## SETTINGS & PREFERENCES

- **Theme**: Light / Dark / System auto. Changes status bar and keyboard appearance on native.
- **Push Notifications**: Toggle on/off.
- **App version and About page**: Menu → About.
- **Developer Tools** (advanced): View sync status, retry failed items.

---

## DEVICE CATALOG

- 200+ pre-seeded phone models with specs (RAM, storage, colors).
- Auto-suggests when brand+model selected during phone entry.
- Brands: Apple, Samsung, OnePlus, Xiaomi, Realme, Oppo, Vivo, and more.
- Includes common issue tags: Cracked Screen, Water Damage, Battery Issue, etc.

---

## GST (Goods & Services Tax)

- When creating a Sales Order, toggle the **GST** option.
- Enter your GSTIN (GST Identification Number).
- App auto-calculates CGST/SGST based on order amount.
- GST details appear on the generated invoice PDF.
`;
