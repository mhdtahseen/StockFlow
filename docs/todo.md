# StockFlow - Development To-Do & Tracking

## 🚀 Release v1.5 Roadmap

### 1. Real-Time Notifications Integration (The Missing Link)

- [ ] **Backend Deployment:** Execute the `docs/notifications_schema.sql` logic inside the Supabase SQL Editor.
- [ ] **Supabase Realtime Listener:** In the App Layout or Context, instantiate the `supabase.channel()` listener to actively listen to `INSERT` payloads on the `notifications` table where `user_id` matches the current session.
- [ ] **UI Unwiring:** Remove the `ComingSoonModal` from the Bell icon in `Dashboard.tsx` and re-wire it to open the `NotificationsPopover`.
- [ ] **Data Hydration:** Update `NotificationsPopover.tsx` to fetch the historical notification list from Supabase instead of using `DUMMY_NOTIFS`.
- [ ] **Mark as Read:** Implement the actual Supabase `UPDATE` calls when a user clicks "Mark all read" or clicks a specific notification.

### 2. Role Based Access Control (RBAC) - UI Polish

_Note: RLS (Row Level Security) is mapped out in the database to prevent unauthorized access, but the UI needs to gracefully handle these limitations._

- [ ] **Associate Views:** Ensure Associates (who cannot do certain actions) do not see the buttons to perform those actions (e.g. deleting team members or modifying system-wide ledger entries).
- [ ] **Promote/Demote Toast:** Make sure the admin receives accurate UI feedback when changing someone's role in `ManageTeam.tsx`.
- [ ] **Testing:** Login as an 'Associate' account and verify they are correctly restricted from Admin-only areas.

### 3. Data Export / Offline Sync (PWA Enhancements)

- [ ] **Financial Ledgers CSV:** Hook up the "Export Financial ledgers" button in `Settings.tsx` to actually download a CSV parsed from the Redux `ledger` state.

### 4. Admin & Financial Reporting Utilities

- [ ] **EOD Summary Email Alert:** Send an End Of Day email alert to Admin containing the closing balance, total profit, and total expenses.
- [ ] **Withdrawals:** Fully implement Owner Withdrawal logic that respects constraints.

### 5. Final Code Quality & Audit

- [ ] Check for any unresolved TypeScript `any` types that can be strictly defined.
- [ ] End-to-End test of the "Invite Associate" flow via the sent email link to ensure the `tenant_id` perfectly bridges to the new user.

### 6. Payment Settlement Mode tracking

- [ ] Add `paymentMethod` ("CASH" | "UPI" | "BANK_TRANSFER") globally to the `LedgerEntry` type and Postgres database.
- [ ] Connect Payment Method selection UI flows to adding phones, selling phones, investing capital, and withdrawing capital.

## 🚀 Release v2 Roadmap

### 1. Advanced Offline & PWA Features

- [ ] **Service Worker Background Sync API:** Implement true background syncing so offline actions auto-upload to Supabase even when the app is completely closed or swiped away.

## 🚀 MVP 2

### 1. Phase 1 Manual Configuration
- [ ] Enable the `pg_cron` extension in the Supabase Dashboard (Database -> Extensions).
- [ ] Run the trial expiry schedule query in the Supabase SQL Editor:
  ```sql
  SELECT cron.schedule('expire-trials', '0 2 * * *', $$
    UPDATE public.tenants
    SET plan = 'expired'
    WHERE plan = 'trial'
      AND plan_expires_at IS NOT NULL
      AND plan_expires_at < now();
  $$);
  ```
