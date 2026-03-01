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
- [ ] **Background Syncing:** Implement the Service Worker logic to handle offline mutations so that actions taken while offline perfectly sync when re-connecting.

### 4. Final Code Quality & Audit

- [ ] Check for any unresolved TypeScript `any` types that can be strictly defined.
- [ ] End-to-End test of the "Invite Associate" flow via the sent email link to ensure the `tenant_id` perfectly bridges to the new user.
