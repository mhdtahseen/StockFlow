# Integrations

## 1. Supabase (BaaS)
The core backend provider managing:
- **Authentication**: JWT-based auth with tenant ID logic.
- **Database**: PostgreSQL with Row Level Security (RLS) hardened by `SECURITY DEFINER` constraints.
- **Storage**: Media assets for products and bills.
- **Real-time**: Real-time subscriptions for inventory updates (optional/as needed).

## 2. Dicebear (Avatar API)
- **Purpose**: Generates dynamic customer avatars based on their name strings.
- **Implementation**: `src/features/customers/components/CustomerAvatar.tsx` (using @dicebear/collection and @dicebear/core).

## 3. ZXing (Barcode/QR)
- **Purpose**: Physical inventory intake and search via device camera.
- **Implementation**: `src/components/shared/Scanner.tsx`.

## 4. Razorpay (Payment Gateway - Planned)
- **Current Status**: Deferred for post-launch (`todo.md`).
- **Target**: Integration via Edge Functions and Webhooks for automated payment reconciliation.

## 5. Sync Manager (Internal Integration)
- **Purpose**: Bridges the local Redux state with the Supabase remote state for offline-first resilience.
- **Logic**: Handles conflict resolution, retry logic (5-cap retry), and optimistic updates.
