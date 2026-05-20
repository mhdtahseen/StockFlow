# BRD: NestJS Backend Application Layer for StockFlow

> **Document Version**: 1.0  
> **Date**: 21 May 2026  
> **Status**: Approved for Implementation  
> **Scope**: Complete server-side application layer replacing client-direct Supabase access

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Limitations](#2-current-architecture-limitations)
3. [Benefits of the NestJS Layer](#3-benefits-of-the-nestjs-layer)
4. [Challenges & Mitigations](#4-challenges--mitigations)
5. [Deployment Strategy — Free Tier](#5-deployment-strategy--free-tier)
6. [Google OAuth Authentication Flow](#6-google-oauth-authentication-flow)
7. [NestJS Project Structure](#7-nestjs-project-structure)
8. [Database Access Strategy](#8-database-access-strategy)
9. [Complete API Route Inventory](#9-complete-api-route-inventory)
10. [Edge Cases & Cross-Cutting Concerns](#10-edge-cases--cross-cutting-concerns)
11. [Phased Implementation Roadmap](#11-phased-implementation-roadmap)

---

## 1. Executive Summary

StockFlow currently operates on a **client-direct-to-Supabase** architecture. The React/Capacitor mobile app communicates directly with Supabase via the `anon` key, relying on Row-Level Security (RLS) for tenant isolation and Supabase Edge Functions (Deno/TypeScript) for server-side logic such as webhooks, tenant approval, and billing.

This document specifies a **NestJS application layer** that sits between all clients (mobile app, admin panel, web app) and Supabase. Once complete:

- All clients talk exclusively to the NestJS API using a server-issued JWT.
- The Supabase `anon` key is no longer shipped in any client bundle.
- The Supabase `service_role` key lives only on the NestJS server.
- All business logic (FIFO settlements, PO certification, trade orders, GST calculations) moves from Postgres RPCs + client reducers into typed NestJS service classes.
- Google OAuth is handled server-side; the mobile app receives a standard app JWT via deep link callback.
- Razorpay webhook handling, push notifications, and scheduled jobs are all served from the same NestJS codebase.

Supabase remains as the **Postgres host only** — no migration away from it. The NestJS server uses the Supabase JS client with `service_role` credentials to access the database.

---

## 2. Current Architecture Limitations

Understanding what is being replaced is essential before building the replacement.

### 2.1 The Current Flow

```
Mobile App (React/Capacitor)
  │
  ├── Redux Action dispatched (e.g. billing/addOrder)
  ├── Reducer updates local state immediately (optimistic)
  ├── supabaseMiddleware.ts queues action into outbox (sync/slice)
  ├── useOfflineSyncManager.ts processes outbox:
  │     └── syncActionToSupabase() → switch(action.type) → Supabase RPC or table insert
  └── On app load: fetchInitialData() → 8–10 separate Supabase queries → hydrate Redux
```

### 2.2 Specific Problems

| Problem | File | Description |
|---------|------|-------------|
| Anon key in APK | `apps/app/src/lib/supabase.ts` | `VITE_SUPABASE_ANON_KEY` is bundled into the Android APK, extractable with any decompiler |
| No server-side input validation | `supabaseApi.ts` | Data written straight to Supabase. Validation only in Redux reducers (bypassable). |
| 8–10 round trips on app load | `useOfflineSyncManager.ts` | `fetchInitialData()` fires separate queries for phones, ledger, master_data, customers, sale_orders, purchase_orders, customer_payments, supplier_payments, order_edits sequentially |
| Edge functions in 6 separate Deno deploys | `supabase/functions/` | `approve-tenant`, `auth-handoff`, `razorpay-create-subscription`, `razorpay-cancel-subscription`, `razorpay-webhook`, `send-push-broadcast` — each in separate Deno runtime, hard to test, no shared code |
| No rate limiting | — | No protection against bulk data exfiltration or brute force against auth endpoints |
| Business logic split three ways | `supabaseApi.ts`, Postgres RPCs, Redux reducers | The same domain logic (e.g. PO status transitions) is partially in the client reducer, partially in a Postgres function, and partially in the sync middleware |
| No background job capability | — | Invoice PDF generation, email digests, IMEI verification batches all require a real server process |

---

## 3. Benefits of the NestJS Layer

### 3.1 Security

| Benefit | How |
|---------|-----|
| **Credentials never leave the server** | `service_role` key stored as `SUPABASE_SERVICE_KEY` env var on Render. Clients receive a short-lived app JWT. |
| **Centralized input validation** | NestJS DTOs with `class-validator` decorators validate every request body before it touches the database. A malformed payload returns HTTP 400, never reaches Supabase. |
| **Rate limiting** | `@nestjs/throttler` module enforces per-IP and per-tenant limits on auth, search, and write endpoints. |
| **CSRF eliminated** | Server issues JWTs; no cookies in the default flow, so CSRF is structurally impossible. |
| **Defense in depth** | Even if an attacker somehow gets the app JWT, they can only do what the NestJS guards allow — they cannot bypass RLS *and* NestJS guards simultaneously. |

### 3.2 Architecture

| Benefit | How |
|---------|-----|
| **Single source of truth for business logic** | FIFO settlement, GST calculation, PO certification — all in NestJS service classes. Testable with Jest in isolation. |
| **Request coalescing** | `GET /sync/initial` replaces 8 separate queries with one HTTP request that the server resolves in parallel. Reduces app load time by ~70%. |
| **Background jobs** | Bull + BullMQ over Redis (Upstash free tier) for invoice PDF, email digests, FCM push notifications. |
| **Typed end-to-end** | Share TypeScript interfaces via `packages/shared`. No more `any` casts on Supabase responses. |
| **Unified edge function host** | All 6 Supabase edge functions become NestJS controllers. One codebase, shared utilities, shared tests. |

### 3.3 Developer Experience

| Benefit | How |
|---------|-----|
| **Unit testable** | Service classes can be tested with a mocked Supabase client — no test database required. |
| **Hot reload in dev** | `pnpm run start:dev` with Nest CLI. No Deno cold starts during local development. |
| **Consistent error handling** | Global `HttpExceptionFilter` and `SyncResultInterceptor` ensure every error returns the same shape. |
| **Swagger documentation** | `@nestjs/swagger` auto-generates OpenAPI spec from DTOs and route decorators — always up to date. |

---

## 4. Challenges & Mitigations

| Challenge | Severity | Mitigation |
|-----------|----------|------------|
| **Migration complexity** | High | Phased rollout. Start with read-only endpoints, then writes, then deprecate direct Supabase access. At no point are both old and new paths live simultaneously for the same feature. |
| **Cold starts on free tier** | Medium | UptimeRobot pings `GET /health` every 5 min. Render free tier spins down after 15 min idle. Ping prevents this entirely during business hours. |
| **RLS bypass** | High | NestJS uses `service_role` which bypasses RLS. ALL tenant isolation must be enforced in `TenantGuard` + explicit `.eq("tenant_id", tenantId)` on every query. Integration tests verify cross-tenant returns 404. |
| **Offline sync adaptation** | Medium | The mobile app outbox pattern is unchanged conceptually. Only the target URL changes: from Supabase direct → `POST /sync/batch`. The `SyncResult` contract (`success` / `retry` / `auth_expired` / `permanent_conflict`) remains identical. |
| **Supabase Realtime** | Low | Keep Supabase Realtime direct from client for the trade-network counterparty subscription (read-only channel, low risk). Migrate to NestJS Server-Sent Events in a later phase if needed. |
| **Two JWT systems during migration** | Medium | During transition, both Supabase session JWT and NestJS app JWT may coexist. Resolve by completing migration feature-by-feature and retiring Supabase auth on each completed module. |
| **Edge function duplication** | Low | Keep existing edge functions alive during cutover. NestJS routes are deployed first; edge functions are disabled only after cutover is confirmed in production. |
| **Connection pool limit** | Medium | Supabase free tier allows ~60 connections max. Use Supabase connection pooler (port 6543 / `?pgbouncer=true`) with `max: 5` in the client config. |

---

## 5. Deployment Strategy — Free Tier

### 5.1 Platform Selection

| Platform | Free Tier | Sleep? | RAM | Cold Start | Verdict |
|----------|-----------|--------|-----|------------|---------|
| **Render** | 750 h/month | Yes (15 min idle) | 512 MB | ~30 s | ✅ Best for MVP |
| **Railway** | $5 credit (~500 h) | No (within budget) | 512 MB | ~3 s | Good fallback |
| **Fly.io** | 3 shared VMs | No (if traffic) | 256 MB each | ~2 s | Best latency, complex setup |
| **Koyeb** | 1 nano, always-on | No | 512 MB | ~0 s | ✅ Best always-warm option |
| **Cloudflare Workers** | 100k req/day | No | 128 MB | ~0 ms | ❌ No Node.js native APIs |

**Recommendation**: Deploy to **Render** for MVP (simplest CI/CD). Add **UptimeRobot** keep-alive. If Render sleep becomes a problem during business hours, migrate to **Koyeb** (always-on nano, same cost: $0).

### 5.2 Zero-Cost Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Clients                                                      │
│  Mobile App (Capacitor) · Web App (Vite) · Admin (Next.js)  │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS + Bearer JWT
┌──────────────────────────────▼───────────────────────────────┐
│  Render.com — Free Web Service                               │
│  NestJS API (Dockerized, Node 20)                            │
│  ├── PORT: 3000                                              │
│  ├── RAM: 512 MB                                             │
│  ├── Custom domain + free TLS via Let's Encrypt              │
│  ├── Auto-deploy from GitHub branch                          │
│  └── ENV: SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET,   │
│           GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,            │
│           RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET       │
└──────────────────────────────┬───────────────────────────────┘
                               │ service_role key
┌──────────────────────────────▼───────────────────────────────┐
│  Supabase — Free Tier (already running)                      │
│  ├── 500 MB Postgres                                         │
│  ├── 2 GB bandwidth/month                                    │
│  ├── 50k MAU Auth                                            │
│  └── 500k Edge Function invocations (for remaining funcs)   │
└──────────────────────────────────────────────────────────────┘
                          
┌──────────────────────────────────────────────────────────────┐
│  UptimeRobot — Free Plan                                     │
│  └── Monitor: GET https://api.stockflow.app/health           │
│      Interval: every 5 minutes                               │
│      Prevents Render sleep during business hours             │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Keep-It-Free Strategies

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| **Prevent Render sleep** | UptimeRobot pings `/health` every 5 min | Eliminates 30 s cold start for real users |
| **In-memory cache for hot data** | Cache `master_data`, `feature_flags`, `catalog_models` with 5-min TTL in a `Map` | Reduces Supabase read bandwidth ~60% |
| **Connection pooler** | Use `?pgbouncer=true` on Supabase connection URL | Stays under 60-connection limit |
| **Request coalescing** | `GET /sync/initial` returns all tenant data in one response | 8 queries → 1 HTTP call → less Render CPU |
| **Outbox batch endpoint** | `POST /sync/batch` processes entire offline queue in one request | 30 outbox items → 1 HTTP call |
| **Separate static hosting** | Keep app served from Vercel/Cloudflare Pages (free). NestJS is API-only. | Keeps Render egress under 100 GB limit |
| **Lazy module loading** | Admin and billing modules loaded lazily (rarely used) | Reduces cold-start memory footprint |
| **Upstash Redis (free)** | 10,000 commands/day on Upstash free tier for BullMQ job queue | No paid Redis needed |

### 5.4 Scale Triggers — When to Stop Being Free

| Metric | Threshold | Action | Cost |
|--------|-----------|--------|------|
| P95 latency > 2 s | Persistent cold starts | Migrate to Fly.io or Render Starter | $7/month |
| > 50 concurrent users | Memory pressure on 512 MB | Upgrade Render to 1 GB RAM | $7/month |
| > 2 GB/month Supabase egress | Bandwidth cap hit | Enable aggressive caching or upgrade Supabase | $25/month |
| > 10,000 BullMQ jobs/day | Upstash free limit | Upgrade Upstash | $0 → $10/month |
| > 500k Supabase Edge invocations | Billing edge functions | Already replaced by NestJS, no issue | $0 |

---

## 6. Google OAuth Authentication Flow

### 6.1 Overview

The NestJS server handles the complete OAuth 2.0 Authorization Code flow with PKCE. The mobile app never sees Google credentials. After successful auth, the server issues its own short-lived JWT + a long-lived refresh token stored in Capacitor Preferences.

### 6.2 Flow Diagram

```
Mobile App                NestJS Server              Google OAuth 2.0         Supabase (DB)
─────────────             ─────────────              ────────────────         ─────────────
                          
1. User taps "Sign in     
   with Google"           
   │                      
   ├─ GET /auth/google ──►                           
   │                      Generate state (CSRF)      
   │                      + code_verifier (PKCE)     
   │◄── 302 Redirect ──── Store in memory            
   │    to Google                                    
   │                                                 
   ├─── Browser opens ──────────────────────────────►
   │    Google consent                               User sees consent screen
   │    screen                                       
   │                                                 
   User grants consent                               
   │                                                 
   │◄─────────────────────────────────────────────── 302 → /auth/google/callback
   │                                                   ?code=AUTH_CODE&state=...
   │                      
   ├─ /auth/google/callback arrives at NestJS        
   │                      │                          
   │                      ├── Validate state param (CSRF check)
   │                      ├── Exchange code + verifier for tokens
   │                      │                         ◄──► Google token endpoint
   │                      │                              Returns: id_token, access_token
   │                      │                         
   │                      ├── Decode id_token → { email, name, picture, sub }
   │                      │                         
   │                      ├── Upsert in profiles ─────────────────────────────►
   │                      │   (create tenant if new user)◄──────────────────────
   │                      │                         
   │                      ├── Sign app JWT: { sub, email, tenantId, role, exp }
   │                      ├── Sign refresh token (opaque, stored in memory map)
   │                      │                         
   │◄── 302 Redirect ──── Return tokens via deep link
   │    stockflow://auth/callback                    
   │    ?token=JWT&refresh=RT                        
   │                      
   ├── Capacitor App plugin
       captures deep link  
       → stores JWT in    
         Capacitor.Preferences
       → stores RT in      
         Capacitor.Preferences
       → Redux hydrated    
         with user session 
```

### 6.3 Mobile-Only Flow (No Browser Redirect)

For native apps that use Google Sign-In SDK directly (no browser popup):

```
Mobile App                NestJS Server              Google
─────────────             ─────────────              ──────
                          
1. Google Sign-In SDK     
   obtains id_token       
   natively               
   │                      
   ├─ POST /auth/google/mobile ──►
   │  { id_token: "..." }  
   │                      Verify id_token with Google's
   │                      tokeninfo endpoint            ──► https://oauth2.googleapis.com/tokeninfo
   │                      Decode: email, name, picture  ◄──
   │                      Upsert profiles table         
   │                      Sign app JWT + refresh token  
   │◄── { token, refreshToken, user }
```

### 6.4 Implementation Details

| Concern | Detail |
|---------|--------|
| **NestJS packages** | `@nestjs/passport`, `passport`, `passport-google-oauth20`, `@nestjs/jwt`, `jsonwebtoken` |
| **Google Cloud Console** | OAuth 2.0 Client ID → Web Application type. Authorized redirect URI: `https://api.stockflow.app/auth/google/callback`. For local dev: `http://localhost:3000/auth/google/callback`. |
| **OAuth scopes** | `openid email profile` — minimum required |
| **JWT payload** | `{ sub: userId, email, name, tenantId, role, iat, exp }` |
| **Access token TTL** | 15 minutes |
| **Refresh token TTL** | 30 days. Stored in `Capacitor.Preferences` on device. |
| **Refresh token storage** | Server-side: in-memory `Map<refreshToken, { userId, issuedAt }>` initially. Migrate to Upstash Redis when multi-instance. |
| **Token rotation** | Each `/auth/refresh` call issues a new refresh token and invalidates the old one (sliding window). |
| **Reuse detection** | If an already-used refresh token is presented, immediately invalidate ALL tokens for that user (token theft detected). |
| **New user handling** | If Google email not in `profiles`, create a new tenant row + profile row in one Supabase transaction. Set plan to `trial`, `plan_expires_at` to now + 6 months. |
| **Existing user merge** | If email exists from magic-link signup, link the Google `sub` to the existing profile. No duplicate profile created. |
| **Deep link on Android** | `capacitor.config.ts` already configures `stockflow://` scheme. No changes needed on the app side. |
| **Deep link on iOS** | Same scheme. Server redirects to `stockflow://auth/callback?token=...&refresh=...`. |
| **Logout** | `POST /auth/logout` removes refresh token from in-memory map. Client deletes from Capacitor Preferences. |

---

## 7. NestJS Project Structure

The server lives at `apps/api/` in the existing monorepo.

```
apps/api/
├── Dockerfile
├── nest-cli.json
├── package.json                    ← NestJS, Passport, JWT, Supabase JS, class-validator
├── tsconfig.json                   ← extends ../../tsconfig.base.json
├── .env.example
│
└── src/
    ├── main.ts                     ← Bootstrap, global pipes, Swagger
    ├── app.module.ts               ← Root module
    │
    ├── config/
    │   └── configuration.ts        ← Typed env config (ConfigModule)
    │
    ├── common/
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts   ← Validates Bearer token on every protected route
    │   │   ├── roles.guard.ts      ← Checks JWT role claim against @Roles() decorator
    │   │   └── tenant.guard.ts     ← Attaches tenantId from JWT to request context
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts    ← @CurrentUser() param decorator
    │   │   ├── current-tenant.decorator.ts  ← @CurrentTenant() param decorator
    │   │   └── roles.decorator.ts           ← @Roles('admin', 'manager') decorator
    │   ├── interceptors/
    │   │   └── tenant-scope.interceptor.ts  ← Injects .eq("tenant_id", ...) on all queries
    │   ├── filters/
    │   │   └── http-exception.filter.ts     ← Global error shape: { statusCode, message, error }
    │   ├── pipes/
    │   │   └── validation.pipe.ts           ← Global class-validator pipe
    │   └── supabase/
    │       ├── supabase.module.ts           ← Provides SupabaseService globally
    │       └── supabase.service.ts          ← Wraps createClient(url, serviceRoleKey)
    │
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts      ← /auth/* routes
    │   ├── auth.service.ts         ← Token issuance, user upsert logic
    │   ├── strategies/
    │   │   ├── google.strategy.ts  ← PassportStrategy(Strategy, 'google')
    │   │   └── jwt.strategy.ts     ← PassportStrategy(Strategy, 'jwt')
    │   └── dto/
    │       ├── google-mobile.dto.ts
    │       └── refresh.dto.ts
    │
    ├── inventory/
    │   ├── inventory.module.ts
    │   ├── inventory.controller.ts ← /inventory/* routes
    │   ├── inventory.service.ts    ← Business logic for phones, repair logs, IMEI
    │   └── dto/
    │       ├── create-phone.dto.ts
    │       ├── update-phone.dto.ts
    │       ├── add-repair-log.dto.ts
    │       └── phone-status.dto.ts
    │
    ├── ledger/
    │   ├── ledger.module.ts
    │   ├── ledger.controller.ts    ← /ledger/* routes
    │   ├── ledger.service.ts
    │   └── dto/
    │       └── create-entry.dto.ts
    │
    ├── sales/
    │   ├── sales.module.ts
    │   ├── sales.controller.ts     ← /sales/orders/* routes
    │   ├── sales.service.ts        ← Trade order creation, edits, returns, payments
    │   └── dto/
    │       ├── create-order.dto.ts
    │       ├── update-order.dto.ts
    │       ├── edit-items.dto.ts
    │       └── order-payment.dto.ts
    │
    ├── purchasing/
    │   ├── purchasing.module.ts
    │   ├── purchasing.controller.ts ← /purchasing/orders/* routes
    │   ├── purchasing.service.ts   ← PO lifecycle, certify, edit
    │   └── dto/
    │       ├── create-po.dto.ts
    │       ├── certify-po.dto.ts
    │       ├── accept-item.dto.ts
    │       └── reject-item.dto.ts
    │
    ├── payments/
    │   ├── payments.module.ts
    │   ├── payments.controller.ts  ← /payments/* routes
    │   ├── payments.service.ts     ← Customer/supplier payments + FIFO settlements
    │   └── dto/
    │       ├── customer-payment.dto.ts
    │       ├── supplier-payment.dto.ts
    │       └── settlement.dto.ts
    │
    ├── customers/
    │   ├── customers.module.ts
    │   ├── customers.controller.ts ← /customers/* routes
    │   ├── customers.service.ts
    │   └── dto/
    │       ├── create-customer.dto.ts
    │       └── update-customer.dto.ts
    │
    ├── trade/
    │   ├── trade.module.ts
    │   ├── trade.controller.ts     ← /trade/* routes
    │   └── trade.service.ts        ← Trade code lookup, connect, transfer
    │
    ├── master-data/
    │   ├── master-data.module.ts
    │   ├── master-data.controller.ts ← /master-data and /catalog/* routes
    │   └── master-data.service.ts
    │
    ├── tenant/
    │   ├── tenant.module.ts
    │   ├── tenant.controller.ts    ← /tenant/* routes
    │   ├── tenant.service.ts
    │   └── dto/
    │       ├── update-tenant.dto.ts
    │       └── update-member-role.dto.ts
    │
    ├── billing/
    │   ├── billing.module.ts
    │   ├── billing.controller.ts   ← /billing/* routes + /billing/webhook/razorpay
    │   ├── billing.service.ts      ← Razorpay subscription lifecycle
    │   └── dto/
    │       └── create-subscription.dto.ts
    │
    ├── notifications/
    │   ├── notifications.module.ts
    │   ├── notifications.controller.ts ← /notifications/* routes
    │   └── notifications.service.ts    ← FCM push, mark-read
    │
    ├── sync/
    │   ├── sync.module.ts
    │   ├── sync.controller.ts      ← /sync/batch and /sync/initial
    │   └── sync.service.ts         ← Routes each action type to the correct service
    │
    └── admin/
        ├── admin.module.ts
        ├── admin.controller.ts     ← /admin/* routes (super-admin only)
        └── admin.service.ts        ← Tenant approval, plan management
```

---

## 8. Database Access Strategy

### 8.1 Decision: Supabase JS Client with service_role

Use the Supabase JavaScript client (`@supabase/supabase-js`) initialized with the `service_role` key. This is the fastest migration path because:

1. All existing RPC calls in `supabaseApi.ts` translate directly — same `.rpc()` method, same params.
2. No Prisma schema generation or migration tooling needed during MVP.
3. The Supabase client already handles connection pooling, retries, and type inference.

```typescript
// apps/api/src/common/supabase/supabase.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor(private config: ConfigService) {
    this.client = createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_SERVICE_KEY'),
      {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'public' },
      }
    );
  }
}
```

### 8.2 Tenant Isolation Without RLS

Because `service_role` bypasses RLS, every Supabase query in every service method MUST include `.eq("tenant_id", tenantId)`. The `TenantGuard` injects `tenantId` into the request object and the `TenantScopeInterceptor` validates it is present on write operations.

```typescript
// Every read in a service method looks like this:
const { data, error } = await this.supabase.client
  .from('phones')
  .select('*')
  .eq('tenant_id', tenantId)   // ← NEVER omit this
  .is('deleted_at', null);
```

### 8.3 Migration Path to Prisma (Future)

When type safety becomes critical (Phase 2+):
1. Run `prisma db pull` against the Supabase database to introspect the current schema into `schema.prisma`.
2. Replace `SupabaseService.client.from(...)` with `PrismaService.tableName.findMany(...)` one module at a time.
3. Prisma has a native Supabase adapter — connection string is the same.

For the MVP phases in this BRD, use the Supabase JS client. Switching to Prisma later is a service-layer concern and does not affect API contracts.

---

## 9. Complete API Route Inventory

All routes require `Authorization: Bearer <jwt>` unless marked **[PUBLIC]**.

### Response Envelope

All routes return:
```json
{ "data": <payload>, "meta": { "timestamp": "ISO8601" } }
```
All errors return:
```json
{ "statusCode": 400, "error": "Bad Request", "message": "Descriptive string" }
```

---

### 9.1 Auth Module — `POST|GET /auth`

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| POST | `/auth/login` | [PUBLIC] | `profiles`, `tenants` | Body: `{ email, password }`. Calls `supabase.auth.admin.signInWithPassword`, issues NestJS JWT + refresh token. Rate-limited 5 attempts/15 min per email (returns 429 on breach). |
| GET | `/auth/google` | [PUBLIC] | — | Redirect to Google consent screen. Sets CSRF state cookie. |
| GET | `/auth/google/callback` | [PUBLIC] | `profiles`, `tenants` | Google redirects here. Exchange code → upsert user → issue JWT → deep link redirect. |
| POST | `/auth/google/mobile` | [PUBLIC] | `profiles`, `tenants` | Body: `{ id_token: string }`. Validates Google `id_token`, upserts user, returns `{ token, refreshToken, user }`. |
| POST | `/auth/refresh` | [PUBLIC] | — | Body: `{ refreshToken: string }`. Issues new access + refresh token pair. Rotates refresh token. |
| POST | `/auth/logout` | ✅ | — | Invalidates current refresh token. Returns 204. |
| GET | `/auth/me` | ✅ | `profiles`, `tenants` | Returns current user profile + tenant details. |
| PATCH | `/auth/me` | ✅ | `profiles` | Body: `{ fullName, avatarUrl, phone }`. Updates `profiles` row. Password and email changes are separate routes. |
| PATCH | `/auth/me/password` | ✅ | Supabase Auth Admin API | Body: `{ currentPassword, newPassword, firstTimeSet?: boolean }`. If `firstTimeSet=true` (post-invite flow), skip current password verification. Otherwise verify current password first. Enforce min 8 chars. |
| PATCH | `/auth/me/email` | ✅ | Supabase Auth Admin API | Body: `{ newEmail }`. Triggers Supabase email confirmation flow. |
| POST | `/auth/invite/complete` | [PUBLIC] | `profiles`, `tenants`, Supabase Auth Admin API | Body: `{ email, password, fullName, tenantId }`. Creates user in Supabase Auth with `full_name` + `tenant_id` metadata (Postgres trigger assigns tenant). Issues NestJS JWT or sends email confirmation. Validates `tenantId` exists and is active before creating user. |
| POST | `/auth/generate-handoff` | ✅ | — | Issues a short-lived (5 min), single-use handoff token for the current authenticated user. Used by `UpgradeGateContext.tsx` to embed seamless auth in the pricing page URL: `finventree.com/pricing?token=...`. The pricing page calls `GET /auth/handoff?token=...` to exchange it. |
| POST | `/auth/magic-link` | [PUBLIC] | Supabase Auth Admin API | Admin-triggered. Body: `{ email, redirectUrl }`. Generates a magic link wrapping the Supabase token and redirecting to `/auth/handoff?token=...`. Used by approve-tenant flow and landing site. |
| GET | `/auth/handoff` | [PUBLIC] | Supabase Auth Admin API | Query: `?token=`. Validates token via Supabase `verifyOtp`, issues NestJS JWT + refresh token, redirects to `stockflow://auth/callback?token=...&refresh=...`. |
| POST | `/auth/tenant-request` | [PUBLIC] | `tenant_requests` | Body: `{ orgName, fullName, email }`. Rate-limited 3/hour per IP. |
| GET | `/auth/request-status` | [PUBLIC] | `tenant_requests` | Query: `?email=`. Returns `{ status, orgName, createdAt }` only — no other fields. |

---

### 9.2 Inventory Module — `/inventory`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/inventory/phones` | all | `phones` | List all non-deleted phones. Query params: `?status=`, `?q=` (search brand/model). Sorted newest first. |
| GET | `/inventory/phones/:id` | all | `phones` | Single phone. 404 if deleted or wrong tenant. |
| POST | `/inventory/phones` | manager+ | `phones` | Body: `CreatePhoneDto`. Validates brand/model in `master_data`. Inserts with `tenant_id` + `user_id` from JWT. |
| PATCH | `/inventory/phones/:id` | manager+ | `phones` | Body: `UpdatePhoneDto` (all fields optional). Sparse update. Rejects if phone is SOLD and a field other than `notes` is changed. |
| DELETE | `/inventory/phones/:id` | manager+ | `phones` | Soft-delete (`deleted_at = now()`). Rejects if linked to active SO (status != CANCELLED). |
| PATCH | `/inventory/phones/:id/status` | manager+ | `phones` | Body: `{ status: PhoneStatus }`. Enforces state machine. |
| POST | `/inventory/phones/:id/repair-log` | manager+ | `ledger` | Body: `{ id, amount, note, recordedBy }`. `id` is client-generated UUID for idempotency. Inserts type=REPAIR_COST entry. |
| DELETE | `/inventory/phones/:id/repair-log/:entryId` | manager+ | `ledger` | Hard-deletes ledger row. Verifies `reference_id = phoneId` + `tenant_id` matches. |
| POST | `/inventory/phones/:id/link-po` | manager+ | `phones`, `purchase_order_items` | Body: `{ purchaseOrderId }`. Calls `link_phone_to_po` RPC. |

**`CreatePhoneDto` key fields:**
```
id: string (UUID, client-generated)
brand: string (required)
model: string (required)
storage: string
ram: string
color: string
purchasePrice: number (>0)
status: PhoneStatus (default IN_STOCK)
issueTags: string[]
imeis: string[]
```

---

### 9.3 Ledger Module — `/ledger`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/ledger` | all | `ledger` | List entries. Query params: `?type=`, `?from=`, `?to=`, `?phoneId=`, `?limit=`, `?cursor=`. Default window: 90 days. |
| POST | `/ledger/entries` | manager+ | `ledger` | Manual entry. Body: `CreateEntryDto`. Validates type enum. FK check on `referenceId`. Idempotent on `id`. |
| DELETE | `/ledger/entries/:id` | admin | `ledger` | Hard-delete. Only non-system entries (blocks deletion of entries created by RPC). |

---

### 9.4 Sales Module — `/sales`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/sales/orders` | all | `sale_orders`, `sale_order_items` | Paginated list. Default: last 90 days, not deleted. Query: `?status=`, `?counterpartyId=`, `?include=items`. |
| GET | `/sales/orders/:id` | all | `sale_orders`, `sale_order_items` | Single order with items. 404 if wrong tenant or deleted. |
| GET | `/sales/orders/:id/payments` | all | `customer_payments`, `payment_allocations` | Returns all customer payments + allocation breakdown for a specific SO. Used by OrderDetail finance tab. Also handles lazy-fetch for orders outside the 90-day Redux window. |
| POST | `/sales/orders` | manager+ | `sale_orders`, `sale_order_items`, `phones`, `ledger` | Body: `CreateOrderDto`. Calls `create_trade_order` RPC. All phones must be IN_STOCK. Atomic. |
| PATCH | `/sales/orders/:id` | manager+ | `sale_orders` | Body: `UpdateOrderDto`. Updates notes, dueDate, counterpartyId, paymentMode. Rejects if SETTLED or CANCELLED. |
| PUT | `/sales/orders/:id/items` | manager+ | `sale_orders`, `sale_order_items` | Body: `EditItemsDto`. Calls `edit_sale_order` RPC. Recalculates totals. Rejects if SETTLED. |
| POST | `/sales/orders/:id/payment` | manager+ | `sale_orders`, `ledger` | Body: `{ amountPaid, status, paymentMode }`. Calls `update_order_payment` RPC. Rejects overpayment. |
| POST | `/sales/orders/:id/return` | manager+ | `sale_orders`, `sale_order_items`, `phones`, `ledger` | Calls `return_order` RPC. Phones revert to IN_STOCK. Ledger reversal entries created. |
| PUT | `/sales/orders/:id/edit` | manager+ | `sale_orders`, `sale_order_items` | Full order edit. Replaces all items. Calls `edit_sale_order` RPC. Use `PATCH /sales/orders/:id` for metadata-only updates (notes, due date). |
| DELETE | `/sales/orders/:id` | manager+ | `sale_orders` | Soft-delete. Rejects if not PENDING or if payments were applied. Calls `soft_delete_sale_order` RPC. |

**`CreateOrderDto` key fields:**
```
id: string (UUID, client-generated)
counterpartyId: string (UUID)
orderType: 'RETAIL' | 'WHOLESALE' | 'B2B'
paymentMode: string | null
amountPaid: number
dueDate: string | null
notes: string | null
items: CreateOrderItemDto[]
gstEnabled: boolean
gstInclusive: boolean
gstType: 'INTRA' | 'INTER' | null
// ... other GST fields
```

---

### 9.5 Purchasing Module — `/purchasing`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/purchasing/orders` | all | `purchase_orders`, `purchase_order_items` | Paginated. Not deleted. Status filter. |
| GET | `/purchasing/orders/:id` | all | `purchase_orders`, `purchase_order_items` | Single PO with items including rejection reasons. |
| GET | `/purchasing/orders/:id/payments` | all | `supplier_payments`, `supplier_allocations` | Returns all supplier payments + allocation breakdown for a specific PO. Used by OrderDetail finance tab. |
| POST | `/purchasing/orders` | manager+ | `purchase_orders`, `purchase_order_items`, `phones`, `ledger` | Body: `CreatePoDto`. Calls `create_purchase_order` RPC. Creates phone records per item. Atomic. |
| PATCH | `/purchasing/orders/:id` | manager+ | `purchase_orders` | Update notes, dueDate, counterpartyId. Rejects if SETTLED. |
| PUT | `/purchasing/orders/:id/edit` | manager+ | `purchase_orders`, `purchase_order_items` | Calls `edit_purchase_order` RPC. Full item list replacement. |
| POST | `/purchasing/orders/:id/items/:itemId/accept` | manager+ | `purchase_order_items`, `phones` | Calls `mark_po_item_accepted` RPC. Final price may differ from PO price. |
| POST | `/purchasing/orders/:id/items/:itemId/reject` | manager+ | `purchase_order_items`, `phones`, `ledger` | Calls `mark_po_item_rejected` RPC. Creates refund-due ledger entry. Reason required. |
| POST | `/purchasing/orders/:id/certify` | manager+ | `purchase_orders`, `purchase_order_items`, `phones` | Body: `CertifyPoDto`. Calls `certify_po_receipt` RPC. Bulk accept/reject. Atomic. |
| POST | `/purchasing/orders/:id/payment` | manager+ | `purchase_orders` | Update amount_paid + status. |
| DELETE | `/purchasing/orders/:id` | manager+ | `purchase_orders` | Soft-delete. Calls `soft_delete_purchase_order` RPC. Only if AWAITING_RECEIPT with 0 accepted items. |

---

### 9.6 Payments Module — `/payments`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/payments/customer` | all | `customer_payments`, `payment_allocations` | List customer payments. 90-day window. Query: `?counterpartyId=`. |
| GET | `/payments/supplier` | all | `supplier_payments`, `supplier_allocations` | List supplier payments. 90-day window. |
| POST | `/payments/customer` | manager+ | `customer_payments`, `payment_allocations`, `sale_orders`, `ledger` | Calls `record_customer_payment` RPC. Sum of allocations must equal `totalReceived`. Idempotent on `id`. |
| POST | `/payments/customer/settlement` | manager+ | `customer_payments`, `sale_orders`, `ledger` | Calls `record_customer_settlement_fifo` RPC. Applies amount to oldest unpaid SOs first. |
| POST | `/payments/supplier` | manager+ | `supplier_payments`, `supplier_allocations`, `purchase_orders`, `ledger` | Calls `record_supplier_payment` RPC. Same validation as customer payment. |
| POST | `/payments/supplier/settlement` | manager+ | `supplier_payments`, `purchase_orders`, `ledger` | Calls `record_supplier_settlement_fifo` RPC. Oldest PO first. |
| GET | `/payments/customer/:paymentId/allocations` | all | `payment_allocations` | Returns allocation breakdown for a customer payment. Used by Ledger page settlement expansion drill-down. |
| GET | `/payments/supplier/:paymentId/allocations` | all | `supplier_allocations` | Returns allocation breakdown for a supplier payment. Used by Ledger page settlement expansion drill-down. |

---

### 9.7 Customers Module — `/customers`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/customers` | all | `counterparties` | All non-deleted counterparties. Sorted by name. Includes linked tenant name via join. |
| GET | `/customers/:id` | all | `counterparties`, `tenants` | Single counterparty + linked tenant name if linked. |
| POST | `/customers` | manager+ | `counterparties` | Creates counterparty. Maps RETAIL→CUSTOMER, B2B→ENTERPRISE if needed. |
| PATCH | `/customers/:id` | manager+ | `counterparties` | Sparse update. Cannot change `linkedTenantId` directly. |
| DELETE | `/customers/:id` | manager+ | `counterparties` | Soft-delete. Rejects if counterparty has open unpaid orders. |
| POST | `/customers/:id/link` | manager+ | `counterparties`, `tenants` | Link an existing counterparty to another tenant. Body: `{ tradeCode }`. Calls `link_counterparty_to_tenant` RPC. Unilateral — updates `linked_tenant_id` on the local counterparty row only. |
| DELETE | `/customers/:id/link` | manager+ | `counterparties` | Calls `unlink_counterparty` RPC. Nullifies `linked_tenant_id`. |

---

### 9.8 Trade Network Module — `/trade`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/trade/lookup/:code` | all | `tenants` | Resolve trade code to tenant name + id. Rate-limited 5/min. Does NOT expose full tenant data. |
| POST | `/trade/connect` | manager+ | `counterparties` (both tenants) | Body: `{ code, counterpartyId }`. Calls `connect_by_trade_code` RPC. Atomic — creates counterparty on both sides. |
| POST | `/trade/transfer` | manager+ | `sale_orders`, `purchase_orders` | Create inter-tenant transfer. Creates SO on sender side, PO on receiver side. |
| PATCH | `/trade/transfer/:id/sync-status` | manager+ | `sale_orders`, `purchase_orders` | Calls `sync_transfer_status` RPC. Propagates status changes across tenants. |

---

### 9.9 Master Data Module — `/master-data` and `/catalog`

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| GET | `/master-data` | ✅ | `master_data` | All master data for tenant, grouped by category. Cached in-memory 5 min. |
| POST | `/master-data` | manager+ | `master_data` | Add option. `ON CONFLICT (tenant_id, category, value) DO NOTHING`. Returns 200 on duplicate (idempotent). |
| GET | `/catalog/models` | ✅ | `catalog_models_v2` | Global device catalog. Query: `?brand=`, `?q=`. Paginated. Cached 1 hour. |
| GET | `/catalog/models/:id/colors` | ✅ | `catalog_model_colors` | Colors for a model. Cached 1 hour. |

---

### 9.10 Tenant Module — `/tenant`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/tenant` | all | `tenants` | Current tenant info. Response includes: `id, name, plan, planExpiresAt, tradeCode, address, gstin, phone, isActive, suspendedUntil`. |
| PATCH | `/tenant` | admin | `tenants` | Update name, address, GSTIN, phone. Validates GSTIN format if provided. |
| GET | `/tenant/members` | manager+ | `profiles` | List all active team members. |
| PATCH | `/tenant/members/:id/role` | admin | `profiles` | Change member role. Cannot demote last admin. Cannot self-demote. |
| POST | `/tenant/invite` | admin | `profiles`, Supabase Auth | Sends magic link invite. Creates pending profile. |
| GET | `/tenant/feature-flags` | all | `feature_flags` | Active feature flags for tenant's plan. Cached 5 min. |

---

### 9.11 Billing Module — `/billing`

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| GET | `/billing/plans` | [PUBLIC] | `subscription_plans` | All plans + pricing. Cached 1 hour. |
| GET | `/billing/subscription` | admin | `tenants` | Current subscription: plan, expires_at, status, next billing date. |
| POST | `/billing/subscription` | admin | `tenants`, Razorpay | Create Razorpay subscription. Creates Razorpay customer + subscription. Stores IDs in tenants row. |
| POST | `/billing/subscription/cancel` | admin | `tenants`, Razorpay | Cancel subscription at period end. Updates tenants row. |
| POST | `/billing/webhook/razorpay` | [PUBLIC — HMAC validated] | `tenants` | Razorpay webhook. Validates HMAC signature. Handles: `subscription.activated`, `payment.captured`, `subscription.cancelled`, `subscription.charged`, `subscription.halted`. Idempotent via `webhook_events` table. |

---

### 9.12 Notifications Module — `/notifications`

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/notifications` | all | `notifications` | Unread first, then by created_at desc. Paginated. |
| PATCH | `/notifications/:id/read` | all | `notifications` | Mark as read. Sets `read_at = now()`. Idempotent. |
| PATCH | `/notifications/read-all` | all | `notifications` | Mark all as read for tenant. |
| POST | `/notifications/push-token` | all | `user_push_subscriptions` | Register FCM/APNs token. Body: `{ token, platform }`. Upsert on `(userId, platform)`. |
| POST | `/notifications/broadcast` | admin | `user_push_subscriptions`, FCM | Send push to all tenant members. Admin only. Replaces `send-push-broadcast` edge function. |

---

### 9.13 Sync Module — `/sync`

This is the most critical module for the mobile app. It is the direct replacement for the current `supabaseApi.ts` + `useOfflineSyncManager.ts` pattern.

| Method | Path | Roles | Tables | Description |
|--------|------|-------|--------|-------------|
| GET | `/sync/initial` | all | (all tenant tables) | One-shot initial data fetch. Returns phones, ledger, masterData, customers, saleOrders, purchaseOrders, customerPayments, supplierPayments in a single response. Replaces 8+ individual Supabase queries. |
| POST | `/sync/batch` | all | (all tables) | Offline outbox flush. Body: `{ items: OutboxItem[] }`. Processes items sequentially. Returns `{ results: [{ id, result }] }` with same `SyncResult` type contract. |

**`POST /sync/batch` request body:**
```json
{
  "items": [
    {
      "id": "uuid",
      "action": { "type": "inventory/addPhone", "payload": { ... } },
      "timestamp": 1716307200000
    }
  ]
}
```

**`POST /sync/batch` response:**
```json
{
  "data": {
    "results": [
      { "id": "uuid", "result": "success" },
      { "id": "uuid", "result": "permanent_conflict" }
    ]
  }
}
```

The `SyncService.processAction()` method is essentially `syncActionToSupabase()` from the current `supabaseApi.ts` — same switch-case logic, same `SyncResult` type, just moved to the server.

> **Note**: The `wallet` Redux slice is intentionally excluded from the outbox. Wallet state is ephemeral and reconstructed from ledger entries. No NestJS module is needed for wallet.

---

### 9.15 Shares Module — `/shares`

Public invoice/order sharing feature. `public_shares` rows hold a UUID token pointing to a specific order. `get_shared_order` is a security-definer RPC that returns a sanitized view of the order without exposing tenant internals.

| Method | Path | Auth | Tables / RPC | Description |
|--------|------|------|-------------|-------------|
| POST | `/shares` | ✅ manager+ | `public_shares` | Body: `{ orderId, orderType }`. Creates a 30-day share token. Returns `{ token, url }`. Idempotent — if a non-expired token exists for the same `orderId`, return it. |
| GET | `/shares/public/:token` | [PUBLIC] | `get_shared_order` RPC | Validates UUID format, calls `get_shared_order` RPC, returns `PublicOrderData`. Rate-limited 30/min per IP. Returns 404 if expired or not found. |
| DELETE | `/shares/:id` | ✅ manager+ | `public_shares` | Revokes a share token before it expires. Verifies `tenant_id` ownership before deletion. |

**Phase 12 migration**: Replace both `shareService.ts` calls (`supabase.from('public_shares').insert(...)` and `supabase.rpc('get_shared_order', ...)`) with these NestJS endpoints. `VITE_APP_URL` logic for constructing the shareable link from the returned token stays on the client.

---

### 9.14 Admin Module — `/admin`

All routes require `role = super-admin` (validated by `RolesGuard`).

| Method | Path | Tables | Description |
|--------|------|--------|-------------|
| GET | `/admin/tenants` | `tenants`, `profiles` | Paginated tenant list with member count + last activity. |
| GET | `/admin/tenants/:id` | `tenants`, `profiles`, `subscription_plans` | Full tenant detail. |
| PATCH | `/admin/tenants/:id` | `tenants` | Override plan, is_active, plan_expires_at. |
| POST | `/admin/tenants/approve` | `tenant_requests`, `tenants`, `profiles`, Supabase Auth | Approve onboarding request. Creates tenant + sends invite email. Replaces `approve-tenant` edge function. |
| GET | `/admin/feature-flags` | `feature_flags` | List all flags with enabled_globally status. |
| PATCH | `/admin/feature-flags/:id` | `feature_flags` | Toggle flag. Invalidates NestJS in-memory cache. |
| GET | `/admin/stats` | `tenants`, `phones`, `sale_orders` | Platform-wide metrics (total tenants, total GMV, active users). |

---

## 10. Edge Cases & Cross-Cutting Concerns

### 10.1 Idempotency

The mobile app retries failed requests. Every write endpoint must be idempotent.

| Scenario | Strategy |
|----------|----------|
| **Client retries POST** | All create endpoints accept client-generated `id` (UUID) in request body. Use `INSERT ... ON CONFLICT (id) DO NOTHING`. Return HTTP 200 on duplicate, not 409. |
| **Outbox item replayed** | `POST /sync/batch` processes each item; if Supabase returns `23505` (unique violation), the `SyncService` returns `"success"` and the item is removed from the outbox. |
| **Payment double-submission** | All payment RPCs accept `p_payment_id`. If already exists in `customer_payments`, RPC returns existing result without re-inserting. |
| **Razorpay webhook replay** | Store `razorpay_event_id` in `webhook_events` table. Skip processing if event_id already exists. Return 200 to Razorpay either way. |

### 10.2 Tenant Isolation (Critical)

Since `service_role` bypasses RLS, every single query must enforce tenant isolation in code.

**The rule**: Every Supabase query that reads or writes business data MUST include `.eq("tenant_id", tenantId)` where `tenantId` comes from the verified JWT, not from the request body.

**Implementation**:
```typescript
// TenantGuard extracts tenantId from JWT and attaches to request
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // set by JwtStrategy
    if (!user?.tenantId) throw new UnauthorizedException('No tenant context');
    request.tenantId = user.tenantId;
    return true;
  }
}
```

**Integration test requirement**: Every module must have a test that verifies a JWT from Tenant A cannot access data from Tenant B (expects 404 or empty array, never leaks Tenant B's data).

### 10.3 Role-Based Access Control

| Role | Allowed Operations |
|------|--------------------|
| `super-admin` | All `/admin/*` routes + all tenant routes |
| `admin` | All tenant operations + invite members + billing + role management |
| `manager` | All CRUD on inventory, orders, payments, customers, ledger |
| `associate` | Read-only + can add phones and log repairs only |

Enforced via `@Roles()` decorator + `RolesGuard`. Role comes from JWT claim, not the database (faster; refreshed on token rotation).

### 10.4 Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Auth (login/register) | 5 | per minute per IP |
| Trade code lookup | 5 | per minute per user |
| IMEI lookup | 10 | per minute per user |
| Write operations | 60 | per minute per user |
| Read operations | 120 | per minute per user |
| Batch sync | 10 | per minute per user (max 50 items/batch) |
| Webhook | Unlimited | — (validated by signature only) |

### 10.5 Offline Sync Adaptation

The mobile app's existing outbox architecture is **not changed**. Only the target changes.

| Current | New |
|---------|-----|
| `supabaseMiddleware.ts` queues action | No change |
| `useOfflineSyncManager.ts` calls `syncActionToSupabase(action)` directly | Changes to call `POST /sync/batch` with the outbox array |
| `SyncResult` type: `success \| retry \| auth_expired \| permanent_conflict` | Identical — same contract, returned per-item in the batch response |
| On `auth_expired`: pause, wait for session refresh | Same — but now the session is the NestJS JWT, not Supabase session |
| On `permanent_conflict`: `markStuck(id)` | Same |

**The only code changes needed in the mobile app** (Phase 11):
1. `useOfflineSyncManager.ts`: Replace the direct `syncActionToSupabase(item.action)` call with a `fetch('POST /sync/batch', { items: [item] })` call.
2. `fetchInitialData()`: Replace 8 separate Supabase queries with `fetch('GET /sync/initial')`.
3. `apps/app/src/lib/supabase.ts`: Can be removed entirely once migration is complete.

### 10.6 Domain-Specific Edge Cases

**Inventory:**
- Adding phone with IMEI that exists in another tenant → allowed (legitimate resale)
- Adding phone with IMEI in same tenant → HTTP 409 "IMEI already in your inventory"
- Deleting phone linked to active SO → HTTP 422 "Phone is in an active sale order"
- Phone status transition: `INCOMING → IN_STOCK → SOLD`. Cannot go `SOLD → IN_STOCK` without a return order.
- `OUT_FOR_REPAIR` blocks SO creation (future gate: `external_repair`)

**Sales:**
- Creating SO with phone not in `IN_STOCK` → HTTP 422 "Phone not available for sale"
- Payment exceeding `totalAmount` → HTTP 422 "Payment exceeds order total"
- Return on SO that's already been returned → HTTP 422 "Order already returned"
- GST fields present but `gstEnabled = false` → silently ignored (do not throw)

**Purchasing:**
- Certifying a PO with 0 items accepted → PO status transitions to CANCELLED
- Accepting item with `finalPrice` different from PO price → allowed; recalculates PO total
- Rejecting item after phone is already SOLD → HTTP 409 "Cannot reject; phone has been sold"

**Payments:**
- FIFO settlement where amount > total outstanding → allocates to all orders, remainder recorded as credit
- Allocation sum ≠ `totalReceived` → HTTP 422 "Allocations must sum to total received"
- Payment for counterparty with no orders → allowed (advance payment; creates unallocated credit)

**Trade Network:**
- Connect to own trade code → HTTP 422 "Cannot connect to your own business"
- Already connected → HTTP 200 idempotent (return existing counterparty)
- Trade code not found → HTTP 404 "Trade code not found" (do NOT expose whether the business exists but isn't accepting connections)

**Auth:**
- Google account email exists from magic-link → merge Google identity into existing profile (do not create duplicate)
- New Google user with no approved tenant request → return `{ user, tenantPending: true }` with HTTP 202; app shows "awaiting approval" screen
- Refresh token reuse → invalidate all tokens for user; require re-login (potential token theft)

### 10.7 Supabase Realtime (Do NOT Migrate)

The mobile app currently subscribes to Supabase Realtime for trade-network counterparty inserts. Keep this direct subscription. The NestJS layer does not proxy WebSocket connections. The Supabase anon key is safe to keep for read-only Realtime channels because RLS on `counterparties` only exposes rows belonging to the authenticated tenant.

Exception: If in the future Realtime needs to be removed entirely, replace with NestJS Server-Sent Events (`@nestjs/event-emitter` + `Subscription` + `response.write()`).

---

## 11. Phased Implementation Roadmap

This roadmap is written so that each phase can be implemented independently, with clear file-by-file instructions. Every phase ends with a working, testable state.

---

### Phase 0 — Project Scaffolding

**Goal**: A running NestJS server in the monorepo that returns `{ status: "ok" }` from `GET /health`.

**Prerequisites**: Node 20+, pnpm 9+, existing monorepo running.

**Step-by-step:**

1. Install the Nest CLI globally (if not already installed):
   ```bash
   npm install -g @nestjs/cli
   ```

2. Scaffold the API app inside the monorepo:
   ```bash
   cd /Users/adeeb/Documents/Pronttera/StockFlow
   nest new apps/api --package-manager pnpm --skip-git
   ```
   When prompted for a package manager, select `pnpm`.

3. Delete the boilerplate files that won't be used:
   ```bash
   rm apps/api/src/app.controller.spec.ts
   rm apps/api/src/app.controller.ts
   rm apps/api/src/app.service.ts
   ```

4. Update `apps/api/src/app.module.ts` to remove references to the deleted files:
   ```typescript
   import { Module } from '@nestjs/common';
   
   @Module({ imports: [] })
   export class AppModule {}
   ```

5. Create `apps/api/src/main.ts`:
   ```typescript
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from './app.module';
   import { ValidationPipe } from '@nestjs/common';
   
   async function bootstrap() {
     const app = await NestFactory.create(AppModule);
     app.setGlobalPrefix('api/v1');
     app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
     app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' });
     await app.listen(process.env.PORT ?? 3000);
     console.log(`StockFlow API running on :${process.env.PORT ?? 3000}`);
   }
   bootstrap();
   ```

6. Add a health check endpoint. Create `apps/api/src/health/health.controller.ts`:
   ```typescript
   import { Controller, Get } from '@nestjs/common';
   
   @Controller('health')
   export class HealthController {
     @Get()
     check() {
       return { status: 'ok', timestamp: new Date().toISOString() };
     }
   }
   ```

7. Register it in `app.module.ts`:
   ```typescript
   import { Module } from '@nestjs/common';
   import { HealthController } from './health/health.controller';
   
   @Module({ controllers: [HealthController] })
   export class AppModule {}
   ```

8. Install required packages:
   ```bash
   cd apps/api
   pnpm add @nestjs/config @nestjs/throttler class-validator class-transformer
   pnpm add @supabase/supabase-js
   pnpm add -D @types/node
   ```

9. Create `apps/api/.env.example`:
   ```
   PORT=3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   JWT_SECRET=generate-a-256-bit-random-string
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=30d
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
   RAZORPAY_KEY_ID=
   RAZORPAY_KEY_SECRET=
   RAZORPAY_WEBHOOK_SECRET=
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
   ```

10. Create `apps/api/src/config/configuration.ts`:
    ```typescript
    export default () => ({
      port: parseInt(process.env.PORT ?? '3000', 10),
      supabase: {
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
      },
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
      },
    });
    ```

11. Add `ConfigModule` to `app.module.ts`:
    ```typescript
    import { Module } from '@nestjs/common';
    import { ConfigModule } from '@nestjs/config';
    import { HealthController } from './health/health.controller';
    import configuration from './config/configuration';
    
    @Module({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: '.env',
        }),
      ],
      controllers: [HealthController],
    })
    export class AppModule {}
    ```

12. Add `apps/api` to `pnpm-workspace.yaml`:
    ```yaml
    packages:
      - 'apps/*'
      - 'packages/*'
    ```
    (It is likely already covered by `apps/*`. Verify this.)

13. Add the API to `turbo.json` under `build` outputs.

14. Create `apps/api/Dockerfile`:
    ```dockerfile
    # Must build from monorepo root — apps/api depends on packages/shared
    FROM node:20-alpine AS builder
    WORKDIR /app

    # Copy workspace manifests first for layer caching
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
    COPY packages/ ./packages/

    # Copy only the API app (not all apps — saves image size)
    COPY apps/api/ ./apps/api/

    RUN npm install -g pnpm && pnpm install --frozen-lockfile
    RUN cd apps/api && pnpm build

    FROM node:20-alpine AS runner
    WORKDIR /app
    COPY --from=builder /app/apps/api/dist ./dist
    COPY --from=builder /app/apps/api/node_modules ./node_modules
    COPY --from=builder /app/apps/api/package.json ./
    EXPOSE 3000
    CMD ["node", "dist/main"]
    ```
    **Note**: Set Render build command to run from repo root: `cd apps/api && pnpm build`.

15. Start the server and verify:
    ```bash
    cd apps/api
    cp .env.example .env   # fill in values
    pnpm start:dev
    # In another terminal:
    curl http://localhost:3000/api/v1/health
    # Expected: { "status": "ok", "timestamp": "..." }
    ```

**Phase 0 is complete when**: `GET /api/v1/health` returns HTTP 200.

---

### Phase 1 — Supabase Service & Common Infrastructure

**Goal**: Shared `SupabaseService`, global JWT guard, tenant guard, and validation pipe — the foundation every other module depends on.

**Step-by-step:**

1. Create `apps/api/src/common/supabase/supabase.module.ts`:
   ```typescript
   import { Module, Global } from '@nestjs/common';
   import { SupabaseService } from './supabase.service';
   
   @Global()
   @Module({
     providers: [SupabaseService],
     exports: [SupabaseService],
   })
   export class SupabaseModule {}
   ```

2. Create `apps/api/src/common/supabase/supabase.service.ts`:
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { createClient, SupabaseClient } from '@supabase/supabase-js';
   import { ConfigService } from '@nestjs/config';
   
   @Injectable()
   export class SupabaseService {
     readonly client: SupabaseClient;
   
     constructor(private config: ConfigService) {
       this.client = createClient(
         this.config.get<string>('supabase.url')!,
         this.config.get<string>('supabase.serviceKey')!,
         {
           auth: { autoRefreshToken: false, persistSession: false },
         }
       );
     }
   }
   ```

3. Install JWT packages:
   ```bash
   cd apps/api
   pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt
   pnpm add -D @types/passport-jwt
   ```

4. Create `apps/api/src/auth/strategies/jwt.strategy.ts`:
   ```typescript
   import { Injectable, UnauthorizedException } from '@nestjs/common';
   import { PassportStrategy } from '@nestjs/passport';
   import { ExtractJwt, Strategy } from 'passport-jwt';
   import { ConfigService } from '@nestjs/config';
   
   export interface JwtPayload {
     sub: string;
     email: string;
     name: string;
     tenantId: string;
     role: string;
   }
   
   @Injectable()
   export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
     constructor(config: ConfigService) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         secretOrKey: config.get<string>('jwt.secret')!,
       });
     }
   
     async validate(payload: JwtPayload) {
       if (!payload.sub || !payload.tenantId) {
         throw new UnauthorizedException('Invalid token payload');
       }
       return {
         userId: payload.sub,
         email: payload.email,
         name: payload.name,
         tenantId: payload.tenantId,
         role: payload.role,
       };
     }
   }
   ```

5. Create `apps/api/src/common/guards/jwt-auth.guard.ts`:
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';
   
   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {}
   ```

6. Create `apps/api/src/common/guards/roles.guard.ts`:
   ```typescript
   import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
   import { Reflector } from '@nestjs/core';
   import { ROLES_KEY } from '../decorators/roles.decorator';
   
   const ROLE_HIERARCHY = ['associate', 'manager', 'admin', 'super-admin'];
   
   @Injectable()
   export class RolesGuard implements CanActivate {
     constructor(private reflector: Reflector) {}
   
     canActivate(ctx: ExecutionContext): boolean {
       const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, ctx.getHandler()) ?? [];
       if (requiredRoles.length === 0) return true;
       
       const request = ctx.switchToHttp().getRequest();
       const userRole = request.user?.role;
       const userLevel = ROLE_HIERARCHY.indexOf(userRole);
       const requiredLevel = Math.min(...requiredRoles.map(r => ROLE_HIERARCHY.indexOf(r)));
       
       if (userLevel < requiredLevel) {
         throw new ForbiddenException('Insufficient role');
       }
       return true;
     }
   }
   ```

7. Create `apps/api/src/common/decorators/roles.decorator.ts`:
   ```typescript
   import { SetMetadata } from '@nestjs/common';
   export const ROLES_KEY = 'roles';
   export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
   ```

8. Create `apps/api/src/common/decorators/current-user.decorator.ts`:
   ```typescript
   import { createParamDecorator, ExecutionContext } from '@nestjs/common';
   export const CurrentUser = createParamDecorator(
     (data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
   );
   ```

9. Create `apps/api/src/common/filters/http-exception.filter.ts`:
   ```typescript
   import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
   
   @Catch()
   export class AllExceptionsFilter implements ExceptionFilter {
     catch(exception: unknown, host: ArgumentsHost) {
       const ctx = host.switchToHttp();
       const response = ctx.getResponse();
       const status = exception instanceof HttpException
         ? exception.getStatus()
         : HttpStatus.INTERNAL_SERVER_ERROR;
       const message = exception instanceof HttpException
         ? exception.message
         : 'Internal server error';
       
       response.status(status).json({
         statusCode: status,
         message,
         timestamp: new Date().toISOString(),
       });
     }
   }
   ```

10. Register all globals in `main.ts`:
    ```typescript
    import { NestFactory, Reflector } from '@nestjs/core';
    import { AppModule } from './app.module';
    import { ValidationPipe } from '@nestjs/common';
    import { AllExceptionsFilter } from './common/filters/http-exception.filter';
    import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
    import { RolesGuard } from './common/guards/roles.guard';
    
    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      const reflector = app.get(Reflector);
      
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      app.useGlobalFilters(new AllExceptionsFilter());
      app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
      app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' });
      
      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ```

11. Add `@Public()` decorator for routes that don't need auth:
    ```typescript
    // apps/api/src/common/decorators/public.decorator.ts
    import { SetMetadata } from '@nestjs/common';
    export const IS_PUBLIC_KEY = 'isPublic';
    export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
    ```

12. Update `JwtAuthGuard` to respect `@Public()`:
    ```typescript
    import { ExecutionContext, Injectable } from '@nestjs/common';
    import { Reflector } from '@nestjs/core';
    import { AuthGuard } from '@nestjs/passport';
    import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
    
    @Injectable()
    export class JwtAuthGuard extends AuthGuard('jwt') {
      constructor(private reflector: Reflector) { super(); }
    
      canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
        if (isPublic) return true;
        return super.canActivate(context);
      }
    }
    ```

13. Add `SupabaseModule` to `app.module.ts`.

14. Run TypeScript check:
    ```bash
    cd apps/api && pnpm exec tsc --noEmit
    ```

**Phase 1 is complete when**: TypeScript compiles with no errors. The `@Public()` decorator bypasses the JWT guard. The `@Roles('admin')` decorator blocks associate-level tokens.

---

### Phase 2 — Auth Module (Google OAuth)

**Goal**: Working `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/google/mobile`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.

**Step-by-step:**

1. Install packages:
   ```bash
   cd apps/api
   pnpm add passport-google-oauth20 @nestjs/jwt
   pnpm add -D @types/passport-google-oauth20
   ```

2. Create `apps/api/src/auth/strategies/google.strategy.ts`:
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { PassportStrategy } from '@nestjs/passport';
   import { Strategy, VerifyCallback } from 'passport-google-oauth20';
   import { ConfigService } from '@nestjs/config';
   
   @Injectable()
   export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
     constructor(config: ConfigService) {
       super({
         clientID: config.get('google.clientId')!,
         clientSecret: config.get('google.clientSecret')!,
         callbackURL: config.get('google.callbackUrl')!,
         scope: ['openid', 'email', 'profile'],
       });
     }
   
     async validate(
       accessToken: string,
       refreshToken: string,
       profile: any,
       done: VerifyCallback,
     ) {
       const { id, name, emails, photos } = profile;
       done(null, {
         googleId: id,
         email: emails[0].value,
         name: `${name.givenName} ${name.familyName}`,
         picture: photos[0]?.value ?? null,
       });
     }
   }
   ```

3. Create `apps/api/src/auth/auth.service.ts`:
   ```typescript
   import { Injectable, UnauthorizedException } from '@nestjs/common';
   import { JwtService } from '@nestjs/jwt';
   import { ConfigService } from '@nestjs/config';
   import { SupabaseService } from '../common/supabase/supabase.service';
   import { randomUUID } from 'crypto';
   
   interface GoogleProfile {
     googleId: string;
     email: string;
     name: string;
     picture: string | null;
   }
   
   @Injectable()
   export class AuthService {
     // In-memory refresh token store: token → { userId, issuedAt }
     // Migrate to Redis (Upstash) for multi-instance deployments
     private readonly refreshTokens = new Map<string, { userId: string; issuedAt: number }>();
   
     constructor(
       private jwt: JwtService,
       private config: ConfigService,
       private supabase: SupabaseService,
     ) {}
   
     async handleGoogleProfile(profile: GoogleProfile) {
       const { email, name, picture } = profile;
   
       // Check if user exists
       const { data: existing } = await this.supabase.client
         .from('profiles')
         .select('id, tenant_id, role')
         .eq('email', email)
         .maybeSingle();
   
       if (existing) {
         // User exists — issue tokens
         return this.issueTokenPair(existing.id, email, name, existing.tenant_id, existing.role);
       }
   
       // New user — check if they have an approved tenant request
       const { data: request } = await this.supabase.client
         .from('tenant_requests')
         .select('id, org_name, status')
         .eq('email', email)
         .eq('status', 'approved')
         .maybeSingle();
   
       if (!request) {
         // No approved request — return pending state
         return { tenantPending: true, email };
       }
   
       // Create tenant + profile in one shot
       const tenantId = randomUUID();
       const userId = randomUUID();
   
       await this.supabase.client.from('tenants').insert({
         id: tenantId,
         name: request.org_name,
         slug: request.org_name.toLowerCase().replace(/\s+/g, '-'),
         plan: 'trial',
         plan_expires_at: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
         is_active: true,
       });
   
       await this.supabase.client.from('profiles').insert({
         id: userId,
         tenant_id: tenantId,
         email,
         full_name: name,
         avatar_url: picture,
         role: 'admin',
         is_active: true,
       });
   
       return this.issueTokenPair(userId, email, name, tenantId, 'admin');
     }
   
     async issueTokenPair(userId: string, email: string, name: string, tenantId: string, role: string) {
       const accessToken = this.jwt.sign(
         { sub: userId, email, name, tenantId, role },
         { expiresIn: this.config.get('jwt.accessExpiresIn') },
       );
   
       const refreshToken = randomUUID();
       this.refreshTokens.set(refreshToken, { userId, issuedAt: Date.now() });
   
       return { token: accessToken, refreshToken, user: { userId, email, name, tenantId, role } };
     }
   
     async refreshAccessToken(refreshToken: string) {
       const entry = this.refreshTokens.get(refreshToken);
       if (!entry) throw new UnauthorizedException('Invalid or expired refresh token');
   
       // Rotate — old token is invalidated
       this.refreshTokens.delete(refreshToken);
   
       // Fetch current role (may have changed since token was issued)
       const { data: profile } = await this.supabase.client
         .from('profiles')
         .select('email, full_name, tenant_id, role')
         .eq('id', entry.userId)
         .single();
   
       if (!profile) throw new UnauthorizedException('User not found');
   
       return this.issueTokenPair(entry.userId, profile.email, profile.full_name, profile.tenant_id, profile.role);
     }
   
     revokeRefreshToken(refreshToken: string) {
       this.refreshTokens.delete(refreshToken);
     }
   
     async validateGoogleIdToken(idToken: string) {
       // Verify id_token with Google's tokeninfo endpoint
       const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
       if (!res.ok) throw new UnauthorizedException('Invalid Google ID token');
       const tokenData = await res.json();
   
       if (tokenData.aud !== this.config.get('google.clientId')) {
         throw new UnauthorizedException('Token audience mismatch');
       }
   
       return this.handleGoogleProfile({
         googleId: tokenData.sub,
         email: tokenData.email,
         name: tokenData.name,
         picture: tokenData.picture ?? null,
       });
     }
   }
   ```

4. Create `apps/api/src/auth/dto/google-mobile.dto.ts`:
   ```typescript
   import { IsString, IsNotEmpty } from 'class-validator';
   
   export class GoogleMobileDto {
     @IsString()
     @IsNotEmpty()
     id_token: string;
   }
   ```

5. Create `apps/api/src/auth/dto/refresh.dto.ts`:
   ```typescript
   import { IsString, IsNotEmpty } from 'class-validator';
   
   export class RefreshDto {
     @IsString()
     @IsNotEmpty()
     refreshToken: string;
   }
   ```

6. Create `apps/api/src/auth/auth.controller.ts`:
   ```typescript
   import { Controller, Get, Post, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';
   import { AuthService } from './auth.service';
   import { Public } from '../common/decorators/public.decorator';
   import { GoogleMobileDto } from './dto/google-mobile.dto';
   import { RefreshDto } from './dto/refresh.dto';
   import { CurrentUser } from '../common/decorators/current-user.decorator';
   import { SupabaseService } from '../common/supabase/supabase.service';
   
   @Controller('auth')
   export class AuthController {
     constructor(
       private authService: AuthService,
       private supabase: SupabaseService,
     ) {}
   
     @Public()
     @Get('google')
     @UseGuards(AuthGuard('google'))
     googleLogin() {
       // Passport handles the redirect
     }
   
     @Public()
     @Get('google/callback')
     @UseGuards(AuthGuard('google'))
     async googleCallback(@Req() req: any, @Res() res: any) {
       const result = await this.authService.handleGoogleProfile(req.user);
       if ((result as any).tenantPending) {
         return res.redirect(`stockflow://auth/pending?email=${encodeURIComponent((result as any).email)}`);
       }
       const { token, refreshToken } = result as any;
       return res.redirect(
         `stockflow://auth/callback?token=${token}&refresh=${encodeURIComponent(refreshToken)}`
       );
     }
   
     @Public()
     @Post('google/mobile')
     async googleMobile(@Body() dto: GoogleMobileDto) {
       return this.authService.validateGoogleIdToken(dto.id_token);
     }
   
     @Public()
     @Post('refresh')
     @HttpCode(200)
     async refresh(@Body() dto: RefreshDto) {
       return this.authService.refreshAccessToken(dto.refreshToken);
     }
   
     @Post('logout')
     @HttpCode(204)
     logout(@Body() dto: RefreshDto) {
       this.authService.revokeRefreshToken(dto.refreshToken);
     }
   
     @Get('me')
     async me(@CurrentUser() user: any) {
       const { data: profile } = await this.supabase.client
         .from('profiles')
         .select('*, tenants(*)')
         .eq('id', user.userId)
         .single();
       return { data: profile };
     }
   
     @Public()
     @Post('tenant-request')
     async tenantRequest(@Body() body: { orgName: string; fullName: string; email: string }) {
       const { error } = await this.supabase.client
         .from('tenant_requests')
         .insert({ org_name: body.orgName, full_name: body.fullName, email: body.email, status: 'pending' });
       if (error && error.code !== '23505') throw error;
       return { data: { message: 'Request submitted' } };
     }
   
     @Public()
     @Get('request-status')
     async requestStatus(@Req() req: any) {
       const email = req.query.email;
       const { data } = await this.supabase.client
         .from('tenant_requests')
         .select('status, org_name, created_at')
         .eq('email', email)
         .maybeSingle();
       return { data: data ?? null };
     }
   }
   ```

7. Create `apps/api/src/auth/auth.module.ts`:
   ```typescript
   import { Module } from '@nestjs/common';
   import { JwtModule } from '@nestjs/jwt';
   import { PassportModule } from '@nestjs/passport';
   import { ConfigService } from '@nestjs/config';
   import { AuthController } from './auth.controller';
   import { AuthService } from './auth.service';
   import { GoogleStrategy } from './strategies/google.strategy';
   import { JwtStrategy } from './strategies/jwt.strategy';
   
   @Module({
     imports: [
       PassportModule,
       JwtModule.registerAsync({
         inject: [ConfigService],
         useFactory: (config: ConfigService) => ({
           secret: config.get('jwt.secret'),
           signOptions: { expiresIn: config.get('jwt.accessExpiresIn') },
         }),
       }),
     ],
     controllers: [AuthController],
     providers: [AuthService, GoogleStrategy, JwtStrategy],
     exports: [AuthService, JwtModule],
   })
   export class AuthModule {}
   ```

8. Add `AuthModule` and `SupabaseModule` to `app.module.ts`.

9. Test the auth flow:
   ```bash
   # Start server
   pnpm start:dev
   # Test health
   curl http://localhost:3000/api/v1/health
   # Test tenant request (public)
   curl -X POST http://localhost:3000/api/v1/auth/tenant-request \
     -H "Content-Type: application/json" \
     -d '{"orgName":"Test Org","fullName":"Test User","email":"test@example.com"}'
   ```

**Phase 2 is complete when**: Google OAuth redirect flow works (test in browser). `POST /auth/google/mobile` with a valid Google `id_token` returns `{ token, refreshToken, user }`.

---

### Phase 3 — Sync Module: Initial Data Fetch

**Goal**: `GET /sync/initial` replaces the 8-query `fetchInitialData()` in `useOfflineSyncManager.ts`.

**Step-by-step:**

1. Create `apps/api/src/sync/sync.service.ts` with an `initialData()` method:

   This method runs all tenant data queries in parallel and returns a single object. Map the exact same fields that `fetchInitialData()` in `useOfflineSyncManager.ts` currently maps from Supabase rows.

   ```typescript
   import { Injectable } from '@nestjs/common';
   import { SupabaseService } from '../common/supabase/supabase.service';
   
   @Injectable()
   export class SyncService {
     constructor(private supabase: SupabaseService) {}
   
     async initialData(tenantId: string, userId: string) {
       const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
       const client = this.supabase.client;
   
       const [
         phonesRes,
         ledgerRes,
         masterDataRes,
         customersRes,
         saleOrdersRes,
         purchaseOrdersRes,
         customerPaymentsRes,
         supplierPaymentsRes,
         orderEditsRes,
       ] = await Promise.all([
         client.from('phones').select('*').eq('tenant_id', tenantId).is('deleted_at', null).order('created_at', { ascending: false }),
         client.from('ledger').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
         client.from('master_data').select('*').eq('tenant_id', tenantId),
         client.from('counterparties').select('*, linked_tenant:tenants!counterparties_linked_tenant_id_fkey(name)').eq('tenant_id', tenantId).is('deleted_at', null).order('name'),
         client.from('sale_orders').select('*, sale_order_items(*)').eq('tenant_id', tenantId).is('deleted_at', null).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }),
         client.from('purchase_orders').select('*, purchase_order_items(*)').eq('tenant_id', tenantId).is('deleted_at', null).in('status', ['AWAITING_RECEIPT', 'RECEIVED', 'PARTIAL', 'SETTLED', 'CANCELLED']).order('created_at', { ascending: false }),
         client.from('customer_payments').select('*, payment_allocations(*)').eq('tenant_id', tenantId).gte('received_at', ninetyDaysAgo).order('received_at', { ascending: false }),
         client.from('supplier_payments').select('*, supplier_allocations(*)').eq('tenant_id', tenantId).gte('paid_at', ninetyDaysAgo).order('paid_at', { ascending: false }),
         client.from('order_edits').select('*').eq('tenant_id', tenantId).gte('created_at', ninetyDaysAgo),
       ]);
   
       // Return raw data — the mobile app's existing mapping functions handle camelCase conversion
       return {
         phones: phonesRes.data ?? [],
         ledger: ledgerRes.data ?? [],
         masterData: masterDataRes.data ?? [],
         customers: customersRes.data ?? [],
         saleOrders: saleOrdersRes.data ?? [],
         purchaseOrders: purchaseOrdersRes.data ?? [],
         customerPayments: customerPaymentsRes.data ?? [],
         supplierPayments: supplierPaymentsRes.data ?? [],
         orderEdits: orderEditsRes.data ?? [],
       };
     }
   }
   ```

2. Create `apps/api/src/sync/sync.controller.ts`:
   ```typescript
   import { Controller, Get } from '@nestjs/common';
   import { SyncService } from './sync.service';
   import { CurrentUser } from '../common/decorators/current-user.decorator';
   
   @Controller('sync')
   export class SyncController {
     constructor(private syncService: SyncService) {}
   
     @Get('initial')
     async initialData(@CurrentUser() user: any) {
       const data = await this.syncService.initialData(user.tenantId, user.userId);
       return { data };
     }
   }
   ```

3. Create `apps/api/src/sync/sync.module.ts` and register in `app.module.ts`.

4. Test:
   ```bash
   # Get a JWT first via POST /auth/google/mobile with a real Google id_token
   # Then:
   curl http://localhost:3000/api/v1/sync/initial \
     -H "Authorization: Bearer <JWT>"
   ```
   The response should contain all tenant data arrays.

**Phase 3 is complete when**: `GET /sync/initial` returns the same data structure that `fetchInitialData()` currently returns from 8 separate queries.

---

### Phase 4 — Sync Module: Batch Write Endpoint

**Goal**: `POST /sync/batch` processes an array of Redux action objects, returning per-item `SyncResult`.

**Step-by-step:**

1. The `SyncService.processAction()` method is a direct port of `syncActionToSupabase()` from `apps/app/src/app/supabaseApi.ts`. Copy the switch-case logic verbatim, replacing the Supabase client reference from `supabase` (app client) to `this.supabase.client` (service client). Remove the `getTenantId()` calls — tenant ID comes from the JWT via the controller.

2. Install PostHog Node SDK for server-side analytics:
   ```bash
   cd apps/api && pnpm add posthog-node
   ```
   In `SyncService`, instantiate `new PostHog(config.get('POSTHOG_API_KEY'))` and add the same `posthog.capture()` calls from `supabaseApi.ts` with `distinctId: userId`. This preserves the `phone.added`, `order.created`, `payment.logged`, etc. analytics events after migration. Add `POSTHOG_API_KEY` to Appendix A's environment variables table.

3. Create `apps/api/src/sync/dto/batch-sync.dto.ts`:
   ```typescript
   import { IsArray, IsString, IsObject, ValidateNested, Max, ArrayMaxSize } from 'class-validator';
   import { Type } from 'class-transformer';
   
   export class OutboxItemDto {
     @IsString()
     id: string;
   
     @IsObject()
     action: { type: string; payload?: any };
   
     @IsString()
     timestamp: number;
   }
   
   export class BatchSyncDto {
     @IsArray()
     @ValidateNested({ each: true })
     @ArrayMaxSize(20) // Render free tier 30s timeout — cap at 20 items
     @Type(() => OutboxItemDto)
     items: OutboxItemDto[];
   }
   ```

4. Add `processBatch()` to `SyncService`:
   ```typescript
   async processBatch(items: OutboxItemDto[], tenantId: string, userId: string) {
     const results: { id: string; result: string }[] = [];
     const deadline = AbortSignal.timeout(25_000); // hard cutoff before Render's 30s limit

     for (const item of items) {
       if (deadline.aborted) {
         results.push({ id: item.id, result: 'retry' });
         continue;
       }
       try {
         const result = await this.processAction(item.action, tenantId, userId, deadline);
         results.push({ id: item.id, result });
         // Stop on auth error — all subsequent items would also fail
         if (result === 'auth_expired') break;
       } catch (e) {
         results.push({ id: item.id, result: 'retry' });
       }
     }
   
     return results;
   }
   ```
   Pass `deadline` as an `AbortSignal` to each Supabase RPC call via the `signal` option (`this.supabase.client.rpc('...', params, { signal: deadline })`). This ensures a single slow RPC returns `retry` rather than timing out the entire batch.

5. Add the batch endpoint to `SyncController`:
   ```typescript
   @Post('batch')
   async batch(@Body() dto: BatchSyncDto, @CurrentUser() user: any) {
     const results = await this.syncService.processBatch(dto.items, user.tenantId, user.userId);
     return { data: { results } };
   }
   ```

6. Run the existing TypeScript tests (if any) and verify the switch-case handles all action types.

**Phase 4 is complete when**: `POST /sync/batch` with a valid outbox item array (≤20 items) returns per-item results matching the same `SyncResult` contract as the current mobile app.

---

### Phase 5 — Inventory Module

**Goal**: All `/inventory/phones` endpoints working.

**Step-by-step:**

1. Create DTOs in `apps/api/src/inventory/dto/`:
   - `create-phone.dto.ts` — all `addPhone` payload fields with `@IsString()`, `@IsNumber()`, `@IsArray()` decorators
   - `update-phone.dto.ts` — all fields optional (`@IsOptional()` + same validators)
   - `add-repair-log.dto.ts` — `id: string`, `amount: number`, `note: string`, `recordedBy: string`

2. Create `apps/api/src/inventory/inventory.service.ts` with methods:
   - `findAll(tenantId, filters)` — query `phones` with optional status/search filter
   - `findOne(tenantId, id)` — single phone, throw `NotFoundException` if not found or different tenant
   - `create(tenantId, userId, dto)` — insert with server-injected `tenant_id` and `user_id`
   - `update(tenantId, id, dto)` — sparse update, throw `UnprocessableEntityException` if SOLD
   - `remove(tenantId, id)` — soft-delete, throw if linked to active SO
   - `addRepairLog(tenantId, phoneId, dto)` — insert into `ledger` with type=REPAIR_COST
   - `removeRepairLog(tenantId, phoneId, entryId)` — delete from `ledger`, verify FK

3. Create `apps/api/src/inventory/inventory.controller.ts` wiring all routes from Section 9.2.

4. Create `apps/api/src/inventory/inventory.module.ts` and register in `app.module.ts`.

5. Apply `@Roles('manager')` to write routes and leave read routes open to all authenticated users.

**Phase 5 is complete when**: All 9 inventory endpoints are reachable and return correct data for valid JWT + tenant.

---

### Phase 6 — Sales Module

**Goal**: All `/sales/orders` endpoints.

**Step-by-step:**

1. Create DTOs mirroring the `billing/addOrder` Redux payload shape in `supabaseApi.ts`.

2. `SalesService.createOrder()` calls `supabase.rpc('create_trade_order', { ... })` with the same parameter mapping as the `billing/addOrder` case in `supabaseApi.ts`.

3. `SalesService.updateOrder()` does a sparse UPDATE on `sale_orders`.

4. `SalesService.editItems()` calls `supabase.rpc('edit_sale_order', { ... })`.

5. `SalesService.recordPayment()` calls `supabase.rpc('update_order_payment', { ... })`.

6. `SalesService.returnOrder()` calls `supabase.rpc('return_order', { ... })`.

7. `SalesService.deleteOrder()` calls `supabase.rpc('soft_delete_sale_order', { ... })`.

8. Wire all routes in `SalesController`.

**Phase 6 is complete when**: Creating a sale order via `POST /sales/orders` creates the same database records as the current `billing/addOrder` Redux action sync.

---

### Phase 7 — Purchasing Module

**Goal**: All `/purchasing/orders` endpoints.

Same pattern as Phase 6. The RPC calls to port are:
- `create_purchase_order`
- `edit_purchase_order`
- `soft_delete_purchase_order`
- `mark_po_item_accepted`
- `mark_po_item_rejected`
- `certify_po_receipt`

**Phase 7 is complete when**: The full PO lifecycle (create → accept items → certify) works end-to-end via the NestJS API.

---

### Phase 8 — Payments Module

**Goal**: All `/payments` endpoints for customer and supplier payments and FIFO settlements.

RPCs to port:
- `record_customer_payment`
- `record_customer_settlement_fifo`
- `record_supplier_payment`
- `record_supplier_settlement_fifo`

Key validation: Sum of allocations must equal `totalReceived` / `totalPaid`. Validate in the DTO with a custom validator:
```typescript
@Validate(AllocationsSumValidator)
allocations: AllocationDto[];
```

**Phase 8 is complete when**: Both customer and supplier payment flows complete without error, and FIFO settlements apply correctly.

---

### Phase 9 — Customers, Trade, Master Data, Tenant, Notifications

These modules follow the same pattern. Port each one:

1. **Customers**: CRUD + `connect_by_trade_code` and `unlink_counterparty` RPCs.
2. **Trade**: `lookup_tenant_by_trade_code` and `create_transfer` / `sync_transfer_status` RPCs.
3. **Master Data**: Simple upsert on `master_data` + catalog read from `catalog_models_v2`.
4. **Tenant**: Update `tenants`, manage `profiles` roles, invite via Supabase Auth magic link.
5. **Notifications**: CRUD on `notifications`, FCM push registration, broadcast.

For FCM push, install `firebase-admin`:
```bash
cd apps/api && pnpm add firebase-admin
```
Initialize in a `FcmService` using the Firebase service account JSON stored as an env var.

**Phase 9 is complete when**: All non-billing, non-admin secondary modules are running.

---

### Phase 10 — Billing Module & Webhook

**Goal**: Razorpay subscription lifecycle + webhook handler in NestJS. Replaces `razorpay-create-subscription`, `razorpay-cancel-subscription`, and `razorpay-webhook` edge functions.

**Step-by-step:**

1. Install:
   ```bash
   cd apps/api && pnpm add razorpay
   pnpm add -D @types/razorpay
   ```

2. `BillingService.createSubscription()`:
   - Read `subscription_plans` from DB to get Razorpay plan ID
   - Create Razorpay customer if not exists
   - Create Razorpay subscription
   - Store `razorpay_subscription_id` in `tenants` row

3. `BillingService.cancelSubscription()`:
   - Fetch subscription ID from `tenants`
   - Call Razorpay cancel API
   - Update `tenants.plan` to reflect pending cancellation

4. `BillingController` webhook handler:
   ```typescript
   @Public()
   @Post('webhook/razorpay')
   async razorpayWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
     const signature = req.headers['x-razorpay-signature'] as string;
     const secret = this.config.get('razorpay.webhookSecret');
     
     // HMAC verification
     const hmac = createHmac('sha256', secret).update(req.rawBody).digest('hex');
     if (hmac !== signature) {
       return res.status(400).json({ error: 'Invalid signature' });
     }
     
     const event = JSON.parse(req.rawBody.toString());
     await this.billingService.handleWebhookEvent(event);
     res.status(200).json({ ok: true });
   }
   ```

5. Enable `rawBody: true` in `NestFactory.create()` for webhook signature verification:
   ```typescript
   const app = await NestFactory.create(AppModule, { rawBody: true });
   ```

6. `handleWebhookEvent()` uses idempotency: insert into `webhook_events(razorpay_event_id)`. If `23505` (duplicate), return early.

**Phase 10 is complete when**: Razorpay test webhooks hit `POST /billing/webhook/razorpay` and update tenant plan status correctly.

---

### Phase 11 — Admin Module

**Goal**: Replace the `approve-tenant` edge function. Super-admin routes for tenant management.

**Step-by-step:**

1. `AdminService.approveTenant(requestId)`:
   - Fetch the `tenant_requests` row
   - Create tenant + profile (same logic as `AuthService.handleGoogleProfile` for new users)
   - Send Supabase magic link invite: `supabase.auth.admin.inviteUserByEmail(email, { data: { tenant_id } })`
   - Update `tenant_requests.status = 'approved'`

2. All admin controller routes require `@Roles('super-admin')`.

3. The `apps/admin/` Next.js app changes its API base from Supabase direct → NestJS API.

**Phase 11 is complete when**: Approving a tenant from the admin panel sends the invite email and creates the database records.

---

### Phase 12 — Mobile App Migration

**Goal**: The mobile app (`apps/app/`) stops calling Supabase directly. All data flow goes through the NestJS API.

**Files to change in `apps/app/`:**

1. **`src/app/useOfflineSyncManager.ts`**:
   - Replace `fetchInitialData()` body: instead of 8 separate `supabase.from(...)` calls, make a single `fetch('GET /api/v1/sync/initial', { headers: { Authorization: `Bearer ${accessToken}` } })`.
   - Replace the `syncActionToSupabase(item.action)` call in the outbox loop with `fetch('POST /api/v1/sync/batch', { body: JSON.stringify({ items: [item] }) })` and read the per-item result.

2. **`src/context/AuthContext.tsx`**:
   - Replace Supabase Auth (`supabase.auth.getSession()`, `onAuthStateChange`) with NestJS JWT lifecycle.
   - On app start: read JWT from `Capacitor.Preferences`. Validate expiry. If expired, call `POST /api/v1/auth/refresh` with stored refresh token.
   - On `stockflow://auth/callback` deep link: parse `token` and `refresh` from URL, store both in `Capacitor.Preferences`.
   - Replace `fetchFeatureFlags()`: `supabase.from("feature_flags").select(...)` → `GET /api/v1/tenant/feature-flags`
   - Replace `fetchTenant()`: `supabase.from("tenants").select(...)` → `GET /api/v1/tenant`
   - Replace `refreshProfile()`: `supabase.from("profiles").select(...)` → `GET /api/v1/auth/me`
   - Replace `supabase.auth.signOut()` → `POST /api/v1/auth/logout` then clear `token` and `refreshToken` from `Capacitor.Preferences`.

3. **`src/lib/supabase.ts`**:
   - Keep file alive but remove the client creation and replace with an `apiClient` HTTP wrapper:
   ```typescript
   export const apiClient = {
     get: (path: string) => authenticatedFetch('GET', path),
     post: (path: string, body: any) => authenticatedFetch('POST', path, body),
     patch: (path: string, body: any) => authenticatedFetch('PATCH', path, body),
     delete: (path: string) => authenticatedFetch('DELETE', path),
   };
   ```

4. **`src/app/supabaseMiddleware.ts`**:
   - No change needed. The outbox still builds up the same way. Only `useOfflineSyncManager.ts` changes how it flushes the outbox.

5. **`src/app/supabaseApi.ts`**:
   - This file becomes dead code after Phase 12. Delete it once confirmed.

6. **`src/pages/Profile.tsx`**:
   - Replace `supabase.from("profiles").upsert(...)` → `PATCH /api/v1/auth/me`
   - Replace `supabase.auth.updateUser({ password })` → `PATCH /api/v1/auth/me/password`
   - Replace `supabase.auth.updateUser({ email })` → `PATCH /api/v1/auth/me/email`
   - Business info update `supabase.from("tenants").update(...)` → `PATCH /api/v1/tenant` (already in BRD)

7. **`src/pages/Pricing.tsx`**:
   - Replace `supabase.from('subscription_plans').select(...)` → `GET /api/v1/billing/plans`

8. **`src/hooks/usePushNotifications.ts`**:
   - Replace `supabase.from('user_push_subscriptions').upsert(...)` → `POST /api/v1/notifications/push-token`

9. **`src/services/shareService.ts`**:
   - Replace `supabase.from('public_shares').insert(...)` → `POST /api/v1/shares`
   - Replace `supabase.rpc('get_shared_order', ...)` → `GET /api/v1/shares/public/:token`

10. **`src/pages/AuthHandoff.tsx`**:
    - Replace `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` — instead redirect to `GET /api/v1/auth/handoff?token=...` which handles verification and issues the NestJS JWT via the existing deep link callback handler.

11. **`src/pages/Login.tsx`**:
    - Replace `supabase.auth.signInWithPassword({ email, password })` → `POST /api/v1/auth/login`.
    - On success, store `token` and `refreshToken` in `Capacitor.Preferences` (same as Google OAuth callback).

12. **`src/pages/InviteSignup.tsx`**:
    - Replace `supabase.auth.signUp({ email, password, options: { data: { tenant_id } } })` → `POST /api/v1/auth/invite/complete`.
    - Remove direct reading of `emailRedirectTo` — NestJS controls the redirect URL.

13. **`src/pages/Verified.tsx`**:
    - Remove `supabase.auth.getSession()` check — instead read JWT from `Capacitor.Preferences` (set by `GET /auth/handoff` when user tapped the confirmation email link).
    - Replace `supabase.auth.updateUser({ password })` → `PATCH /api/v1/auth/me/password` with body `{ newPassword, firstTimeSet: true }`.

14. **`src/main.tsx`** (Capacitor deep link handler):
    - `token_hash` path: replace `supabase.auth.verifyOtp(...)` → redirect internally to `GET /api/v1/auth/handoff?token=...`.
    - `?code=` path: `supabase.auth.exchangeCodeForSession(code)` → becomes dead code. The PKCE code exchange happens server-side at `GET /auth/google/callback`. `main.tsx` should instead listen for the `stockflow://auth/callback?token=...&refresh=...` deep link, which is the NestJS redirect.

15. **`src/context/UpgradeGateContext.tsx`** (`openPricing()` function):
    - Replace raw `fetch` to `SUPABASE_URL/functions/v1/auth-handoff` → `POST /api/v1/auth/generate-handoff`.
    - Response changes from `{ token_hash, type }` to `{ token }`. Update URL construction: append `?token=${token}` instead of `?token_hash=...&type=...`.

**Supabase Realtime** (keep as-is):
   - The counterparty trade-connection subscription in `useOfflineSyncManager.ts` stays direct-to-Supabase. It is a read-only channel on `counterparties` inserts — safe with the anon key + RLS.

**Phase 12 is complete when**: The mobile app makes zero calls to Supabase directly (except Realtime). All data is served through `GET /sync/initial`. All writes go through `POST /sync/batch` or specific module endpoints.

---

### Phase 13 — Supabase Edge Function Deprecation

**Goal**: Remove or disable all Supabase Edge Functions now that NestJS handles their responsibilities.

| Edge Function | Replaced By | Action |
|---------------|-------------|--------|
| `approve-tenant` | `POST /admin/tenants/approve` | Disable in Supabase Studio |
| `auth-handoff` | `GET /auth/google/callback` + deep link | Disable |
| `razorpay-create-subscription` | `POST /billing/subscription` | Disable |
| `razorpay-cancel-subscription` | `POST /billing/subscription/cancel` | Disable |
| `razorpay-webhook` | `POST /billing/webhook/razorpay` | Disable + update Razorpay dashboard webhook URL to NestJS |
| `send-push-broadcast` | `POST /notifications/broadcast` | Disable |

**Step-by-step:**

1. For each edge function, verify the NestJS equivalent has been tested in production for at least 2 weeks.
2. Update Razorpay webhook URL in the Razorpay dashboard to `https://api.stockflow.app/api/v1/billing/webhook/razorpay`.
3. In Supabase Studio → Functions, set each function to "Paused".
4. After 30 days with no issues, delete the function source files (or keep for reference).
5. The `supabase/functions/` directory can remain in the repo as an archive.

**Phase 13 is complete when**: Supabase billing shows zero edge function invocations per month, freeing up the 500k invocation quota entirely.

---

### Phase 14 — Hardening, Swagger, and Final Testing

**Goal**: Production-ready with full documentation and test coverage.

**Step-by-step:**

1. Add Swagger:
   ```bash
   cd apps/api && pnpm add @nestjs/swagger swagger-ui-express
   ```
   In `main.ts`:
   ```typescript
   import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
   
   const config = new DocumentBuilder()
     .setTitle('StockFlow API')
     .setDescription('NestJS backend for StockFlow inventory management')
     .setVersion('1.0')
     .addBearerAuth()
     .build();
   const document = SwaggerModule.createDocument(app, config);
   SwaggerModule.setup('api/docs', app, document);
   ```

2. Add `@nestjs/throttler` rate limiting:
   ```bash
   cd apps/api && pnpm add @nestjs/throttler
   ```
   Configure as per Section 10.4.

3. Write integration tests for every tenant isolation boundary:
   - Create two test tenants (A and B)
   - Authenticate as Tenant A
   - Try to access Tenant B's phone by ID → expect HTTP 404
   - Try to access Tenant B's orders → expect empty array

4. Write idempotency tests:
   - POST create-phone twice with same `id` → second call returns 200, DB has one record

5. Set up GitHub Actions CI:
   ```yaml
   # .github/workflows/api.yml
   name: API Tests
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v3
         - run: pnpm install
         - run: cd apps/api && pnpm test
         - run: cd apps/api && pnpm exec tsc --noEmit
   ```

6. Configure Render deployment:
   - Connect GitHub repo to Render
   - Build command: `cd apps/api && pnpm build`
   - Start command: `node apps/api/dist/main`
   - Set all env vars from `.env.example`
   - Enable auto-deploy on push to `main` branch

7. Set up UptimeRobot:
   - Monitor type: HTTP
   - URL: `https://api.stockflow.app/api/v1/health`
   - Interval: 5 minutes
   - Alert email: your email

**Phase 14 is complete when**: All integration tests pass, Swagger docs are live at `/api/docs`, and the server has been running on Render for 48 hours without cold start issues (UptimeRobot shows 100% uptime).

---

## Appendix D: BRD Audit Findings — Gaps Identified (21 May 2026)

This section documents every gap identified in a post-authoring audit against the live codebase. Each item is classified by severity.

### D.1 Critical Gaps — Will Break Migration if Not Addressed

---

#### GAP-01: Public Share Link Module is Entirely Missing

**Source files**: `apps/app/src/services/shareService.ts`, `apps/app/src/pages/PublicView.tsx`

`shareService.ts` makes two direct Supabase calls that have no NestJS equivalent in this BRD:

```typescript
// CREATE
supabase.from('public_shares').insert({ order_id, order_type, tenant_id, expires_at })
// READ (public — no auth)
supabase.rpc('get_shared_order', { share_token: token })
```

The `public_shares` table and `get_shared_order` security-definer RPC form the public invoice/order sharing feature. Since `get_shared_order` is a security-definer function, it already handles auth internally — the NestJS endpoint just needs to proxy it.

**Resolution — add the following module to Section 9:**

**Shares Module — `/shares`**

| Method | Path | Auth | Tables / RPC | Description |
|--------|------|------|-------------|-------------|
| `POST` | `/shares` | ✅ manager+ | `public_shares` | Body: `{ orderId, orderType }`. Creates a 30-day share token. Returns `{ token, url }`. Idempotent — if a non-expired token exists for the same orderId, return it. |
| `GET` | `/shares/public/:token` | [PUBLIC] | `get_shared_order` RPC | Validates UUID format, calls RPC, returns `PublicOrderData`. Rate-limited 30/min per IP. Returns 404 if expired or not found. |
| `DELETE` | `/shares/:id` | ✅ manager+ | `public_shares` | Revoke a share token before it expires. |

**Phase 12 migration**: Replace both `shareService.ts` calls with the NestJS endpoints. `VITE_APP_URL` base URL logic stays on the client for constructing the shareable link from the returned token.

---

#### GAP-02: `link_counterparty_to_tenant` RPC Conflated With `connect_by_trade_code`

**Source file**: `apps/app/src/app/supabaseApi.ts` (exported standalone functions)

The BRD incorrectly documents `POST /customers/:id/link` as calling `connect_by_trade_code`. These are two **distinct RPCs** with different behaviours:

| RPC | What it does | Direction |
|-----|-------------|-----------|
| `link_counterparty_to_tenant` | Updates `linked_tenant_id` on an **existing** counterparty row. Unilateral. | One side only |
| `connect_by_trade_code` | Creates a **new counterparty on both tenants** simultaneously. Mutual. | Both sides |

**Resolution — correct the route table in Section 9.7 and 9.8:**

- `POST /customers/:id/link` → calls `link_counterparty_to_tenant` (body: `{ tradeCode }`)
- `POST /trade/connect` → calls `connect_by_trade_code` (body: `{ tradeCode, typeForMe, typeForThem }`)
- Both `connect_by_trade_code` and `link_counterparty_to_tenant` must appear in Appendix B's RPC table.

---

#### GAP-03: User Profile Update Endpoints are Missing

**Source file**: `apps/app/src/pages/Profile.tsx`

`Profile.tsx` makes 4 direct Supabase calls not covered by any BRD route:

1. `supabase.from("profiles").upsert({ full_name, avatar_url })` — update display name + avatar
2. `supabase.auth.updateUser({ data: { full_name, avatar_url, phone } })` — sync to Supabase auth metadata
3. `supabase.from("tenants").update({ name, address, gstin, phone })` — update business info
4. `supabase.auth.updateUser({ password })` — change password
5. `supabase.auth.updateUser({ email })` — change email

The BRD only has `GET /auth/me` and `PATCH /tenant`. The profile personal details and password change are entirely unaddressed.

**Resolution — add to Section 9.1 (Auth) and 9.10 (Tenant):**

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| `PATCH` | `/auth/me` | ✅ all | `profiles` | Body: `{ fullName, avatarUrl, phone }`. Updates `profiles` row. Note: password and email changes are separate routes. |
| `PATCH` | `/auth/me/password` | ✅ all | Supabase Auth Admin API | Body: `{ currentPassword, newPassword }`. Verify current password, then call `supabase.auth.admin.updateUserById(userId, { password })`. Enforce min 8 chars. |
| `PATCH` | `/auth/me/email` | ✅ all | Supabase Auth Admin API | Body: `{ newEmail }`. Triggers Supabase email confirmation. |

**Phase 12 migration note**: `Profile.tsx`'s `handleUpdateProfile()` and `handleUpdatePassword()` must be rewritten to call these NestJS routes instead of Supabase directly.

---

#### GAP-04: `OrderDetail.tsx` Direct Supabase Reads Not Covered

**Source file**: `apps/app/src/pages/OrderDetail.tsx`

`OrderDetail.tsx` makes direct Supabase reads for two critical use cases that bypass the Redux store entirely:

**Use Case A — Payment detail fetch (per-order):**
```typescript
supabase.from("supplier_allocations").select("supplier_payment_id").eq("purchase_order_id", id)
supabase.from("supplier_payments").select("*, supplier_allocations(*)").in("id", spIds)
supabase.from("payment_allocations").select("customer_payment_id").eq("sale_order_id", id)
supabase.from("customer_payments").select("*, payment_allocations(*)").in("id", cpIds)
```

**Use Case B — Lazy-fetch for historical orders not in Redux (90-day window miss):**
```typescript
supabase.from("sale_orders").select("*, sale_order_items(*)").eq("id", id).maybeSingle()
supabase.from("purchase_orders").select("*, purchase_order_items(*)").eq("id", id).maybeSingle()
```

Both bypass NestJS entirely post-migration.

**Resolution — add to Section 9.4 (Sales) and 9.5 (Purchasing):**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/sales/orders/:id/payments` | ✅ all | Returns `customer_payments` + allocations for a specific SO. Used by OrderDetail finance tab. |
| `GET` | `/purchasing/orders/:id/payments` | ✅ all | Returns `supplier_payments` + allocations for a specific PO. |

The lazy-fetch use case is already covered by `GET /sales/orders/:id` and `GET /purchasing/orders/:id` — Phase 12 migration just needs to replace the direct Supabase calls with these NestJS endpoints.

---

### D.2 Medium Gaps — Cause Partial Data Loss or Broken Flows in Migration

---

#### GAP-05: `AuthContext.tsx` Supabase Calls Omitted From Phase 12

**Source file**: `apps/app/src/context/AuthContext.tsx`

The Phase 12 migration instructions only address `useOfflineSyncManager.ts`. `AuthContext.tsx` makes these direct Supabase calls that also need replacing:

| Current call | Replace with |
|--------------|-------------|
| `supabase.from("feature_flags").select(...)` in `fetchFeatureFlags()` | `GET /tenant/feature-flags` (already in BRD) |
| `supabase.from("tenants").select(...)` in `fetchTenant()` | `GET /tenant` (already in BRD) |
| `supabase.from("profiles").select(...)` in `refreshProfile()` | `GET /auth/me` (already in BRD) |
| `supabase.auth.getSession()` + `onAuthStateChange` | Replace with NestJS JWT lifecycle using `Capacitor.Preferences` — described in Phase 12 but not linked to `AuthContext.tsx` specifically |

**Resolution**: Add a sub-step to Phase 12 explicitly listing these 4 `AuthContext.tsx` replacements.

---

#### GAP-06: `auth-handoff` Edge Function Has No NestJS Replacement Designed

**Source files**: `supabase/functions/auth-handoff/`, `apps/app/src/pages/AuthHandoff.tsx`

The `auth-handoff` edge function generates a Supabase magic link and is used when a user activates on the marketing site (finventree.com) and clicks "Open Web App". `AuthHandoff.tsx` then calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` to exchange the token for a session.

The BRD's deprecation table lists this function but provides no NestJS replacement design. With NestJS issuing its own JWTs (not Supabase sessions), `verifyOtp` becomes meaningless.

**Resolution — add to Section 9.1 (Auth):**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/magic-link` | [PUBLIC] | Admin calls this to generate a magic link for a user (used by approve-tenant flow and landing site). Body: `{ email, redirectUrl }`. Calls `supabase.auth.admin.generateLink({ type: 'magiclink', email })`, then wraps the token in a NestJS handoff: the redirect URL points to `/auth/handoff?token=...`. |
| `GET` | `/auth/handoff` | [PUBLIC] | Query: `?token=`. Validates the token via Supabase `verifyOtp`, then issues a NestJS JWT + refresh token. Redirects to `stockflow://auth/callback?token=...&refresh=...`. |

**Phase migration note**: `AuthHandoff.tsx` currently calls Supabase directly. In Phase 12, it should instead redirect to `GET /api/v1/auth/handoff?token=...` and receive the NestJS JWT via the existing deep link callback handler.

---

#### GAP-07: Batch Endpoint Timeout Risk on Render Free Tier

**Source**: Phase 4 design + Render free tier specifications

The BRD allows up to 50 items per `POST /sync/batch`. With Render free tier's **30-second request timeout**, a batch of 50 items where each Supabase RPC takes ~300ms would take **15 seconds** — acceptable. However, if the server is just waking from sleep (cold start), the first batch could be processing while still initializing, potentially timing out.

Additionally, if a single RPC (e.g. `certify_po_receipt`) takes 2–3 seconds due to a large PO, 20 such items would breach the 30s limit.

**Resolution — add to Phase 4 and Section 5:**

1. Reduce default batch limit from 50 to **20 items** per request. Mobile app already chunks batches in the outbox loop.
2. Add explicit 25-second server-side timeout per batch request using `AbortSignal.timeout(25_000)` on each Supabase call inside the loop. Return partial results if timeout is hit.
3. Add to Section 5's "Keep-It-Free Strategies" table:

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| **Batch size limit** | Cap `/sync/batch` at 20 items. Client sends multiple requests for larger queues. | Prevents 30s Render timeout |
| **Per-item Supabase timeout** | `AbortSignal.timeout(8000)` on each RPC call | Returns `retry` for slow operations instead of timing out the whole batch |

---

#### GAP-08: `usePushNotifications.ts` Writes Directly to Supabase — Missing From Phase 12

**Source file**: `apps/app/src/hooks/usePushNotifications.ts`

The push notification registration hook writes directly to `user_push_subscriptions` without going through the outbox. The BRD has the correct `POST /notifications/push-token` endpoint (Section 9.12) but does not include migration instructions for this hook.

**Resolution**: Add to Phase 12 sub-steps: "`usePushNotifications.ts`: Replace `supabase.from('user_push_subscriptions').upsert(...)` with `POST /api/v1/notifications/push-token`."

---

### D.3 Minor Gaps — Documentation / Clarity Issues

---

#### GAP-09: `tenant.trade_code` and `tenant.suspended_until` Not in Response Shape Documentation

**Source**: `apps/app/src/context/AuthContext.tsx` — `fetchTenant()` selects `trade_code` and `suspended_until` from `tenants`.

The BRD's `GET /tenant` endpoint description doesn't document that the response must include `tradeCode` and `suspendedUntil`. These fields drive UI features (trade code sharing in Profile.tsx, account suspension banners).

**Resolution**: Update `GET /tenant` description in Section 9.10 to note: "Response includes: `id, name, plan, planExpiresAt, tradeCode, address, gstin, phone, isActive, suspendedUntil`."

---

#### GAP-10: Monorepo-Aware Dockerfile is Incorrect

**Source**: Phase 0, Step 14

The Dockerfile in Phase 0 is written for a standalone project. In the monorepo, `apps/api/` depends on `packages/shared/`. The `COPY . .` instruction only copies `apps/api/` — not the workspace root — so `pnpm install` will fail because it cannot resolve workspace dependencies.

**Resolution — replace Phase 0 Step 14 Dockerfile with:**

```dockerfile
FROM node:20-alpine AS builder
# Must build from monorepo root — API depends on packages/shared
WORKDIR /app

# 1. Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/

# 2. Copy only the API app (not all apps)
COPY apps/api/ ./apps/api/

# 3. Install all dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 4. Build
RUN cd apps/api && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

**Note**: Update the Render build command to run from the repo root: `cd apps/api && pnpm build`.

---

#### GAP-11: PostHog Event Capture Not Addressed in SyncService

**Source**: `apps/app/src/app/supabaseApi.ts` — `posthog.capture()` calls on `phone.added`, `order.created`, `payment.logged`, etc.

When the mobile app migrates to `POST /sync/batch`, these PostHog events will no longer fire (they were in the client-side `supabaseApi.ts`). The `SyncService.processAction()` on the server needs to replicate them using the PostHog Node.js SDK.

**Resolution**: Add to Phase 4:
```bash
cd apps/api && pnpm add posthog-node
```
In `SyncService`, instantiate `new PostHog(POSTHOG_API_KEY)` and add the same `posthog.capture()` calls from `supabaseApi.ts` with `distinctId: userId`.

Add `POSTHOG_API_KEY` to Appendix A's environment variables table.

---

#### GAP-12: `Pricing.tsx` Direct Supabase Read Not Covered in Phase 12

**Source**: `apps/app/src/pages/Pricing.tsx` — reads `subscription_plans` directly.

The BRD has `GET /billing/plans` (Section 9.11) but Phase 12 migration instructions don't mention replacing this direct call.

**Resolution**: Add to Phase 12 sub-steps: "`Pricing.tsx`: Replace `supabase.from('subscription_plans').select(...)` with `GET /api/v1/billing/plans`."

---

#### GAP-13: `GET /ledger` Allocation Detail Fetch Missing

**Source**: `apps/app/src/pages/Ledger.tsx` — on-demand fetch of `payment_allocations` or `supplier_allocations` when a user expands a settlement entry.

This is an on-demand drill-down query, not a bulk load. Currently hits Supabase directly.

**Resolution — add to Section 9.3 (Ledger):**

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| `GET` | `/payments/customer/:paymentId/allocations` | ✅ all | `payment_allocations` | Returns allocation breakdown for a customer payment. Used by Ledger page settlement expansion. |
| `GET` | `/payments/supplier/:paymentId/allocations` | ✅ all | `supplier_allocations` | Returns allocation breakdown for a supplier payment. |

---

#### GAP-14: `billing/updateOrder` vs `PUT /sales/orders/:id/edit` Ambiguity

The BRD has two routes that appear to overlap:
- `PATCH /sales/orders/:id` → updates metadata (notes, dueDate, counterpartyId, paymentMode)
- `PUT /sales/orders/:id/edit` → calls `edit_sale_order` RPC

But in `supabaseApi.ts` there are also two separate cases:
- `billing/updateOrder` → sparse UPDATE on `sale_orders` table (metadata only)
- `billing/editSaleOrder` → calls `edit_sale_order` RPC (items + prices + counterparty)

These are **both** legitimately distinct operations and the BRD is correct to have two routes. The naming could be clearer. `PUT /sales/orders/:id/edit` should be described as "Full order edit including items — replaces all items" to distinguish it from the metadata-only `PATCH`.

**Resolution**: Update `PUT /sales/orders/:id/edit` description to: "Full order edit. Replaces all items. Calls `edit_sale_order` RPC. Use `PATCH /sales/orders/:id` for metadata-only updates (notes, due date)."

---

#### GAP-15: `wallet` Slice Has No Corresponding API Module

**Source**: `apps/app/src/app/store.ts` — `wallet` slice exists in the Redux store.

The BRD has no `/wallet` module. If the wallet slice has server-side persistence (write-through to Supabase), the `supabaseMiddleware.ts` would queue those actions with a `wallet/` prefix — but `trackablePrefixes` in `supabaseMiddleware.ts` does **not** include `wallet/`. This means wallet actions are currently local-only and do not go through the sync layer.

**Resolution**: Document in the BRD that the wallet slice is local-only (no server persistence). No NestJS module is needed for it. Add a note to the sync module: "The `wallet` Redux slice is intentionally excluded from the outbox. Wallet state is ephemeral and reconstructed from ledger entries."

---

### D.5 Second Audit Findings (21 May 2026) — Auth Page Coverage

---

#### GAP-16: `POST /auth/login` is Entirely Missing

**Source file**: `apps/app/src/pages/Login.tsx`

`Login.tsx` calls `supabase.auth.signInWithPassword({ email, password })` — the email+password login path that exists alongside Google OAuth. The BRD's Section 9.1 only documents Google OAuth auth flows. If this isn't ported, every user who logs in with email+password is completely broken the moment the app migrates away from direct Supabase calls in Phase 12.

**Resolution — add to Section 9.1:**

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| `POST` | `/auth/login` | [PUBLIC] | `profiles`, `tenants` | Body: `{ email, password }`. Issues NestJS JWT + refresh token on success. Rate-limited 5 attempts/15 min per email. Returns 429 on breach. |

**Phase 12 migration**: `Login.tsx` `onSubmit` → `POST /api/v1/auth/login`. On success, store `token` and `refreshToken` in `Capacitor.Preferences` identically to the Google OAuth callback.

---

#### GAP-17: `POST /auth/invite/complete` is Entirely Missing

**Source file**: `apps/app/src/pages/InviteSignup.tsx`

`InviteSignup.tsx` is the page reached via an invite link (`/invite-signup?tenant_id=...&org_name=...`). It calls `supabase.auth.signUp({ email, password, options: { data: { tenant_id } } })`. A Postgres trigger reads `tenant_id` from the user's metadata and assigns the new user to that tenant with role `associate`. The BRD's `POST /tenant/invite` sends the invite link but never covers the page where the invitee creates their credentials.

**Resolution — add to Section 9.1:**

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| `POST` | `/auth/invite/complete` | [PUBLIC] | `profiles`, `tenants`, Supabase Auth Admin API | Body: `{ email, password, fullName, tenantId }`. Validates `tenantId` exists and is active. Creates user via `supabase.auth.admin.createUser()` with `full_name` + `tenant_id` metadata (Postgres trigger handles profile + tenant assignment). Issues NestJS JWT or sends email confirmation based on Supabase project settings. |

**Edge cases**: If `tenantId` doesn't exist → 400. If email already registered → 409. If Supabase requires email confirmation → return `{ requiresConfirmation: true }` and redirect user to check email.

---

#### GAP-18: `Verified.tsx` and `main.tsx` Deep Link Handler Not in Phase 12

**Source files**: `apps/app/src/pages/Verified.tsx`, `apps/app/src/main.tsx`

**`Verified.tsx`**: After email confirmation, Supabase auto-issues a session via the confirmation link click, and `Verified.tsx` calls `supabase.auth.updateUser({ password })` to let the user set their initial password. With NestJS, the email confirmation link should route through `GET /auth/handoff?token=...` (which issues a NestJS JWT + refresh token stored in `Capacitor.Preferences`). `Verified.tsx` then calls `PATCH /api/v1/auth/me/password` with `{ newPassword, firstTimeSet: true }` — skipping the current-password check since this is first-time setup. The `PATCH /auth/me/password` route already supports `firstTimeSet` flag (see GAP-03 resolution).

**`main.tsx`**: The Capacitor `appUrlOpen` deep link handler has two uncovered Supabase calls:

1. `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` — fired when the app is opened from a magic link / activation email. After migration → call `GET /api/v1/auth/handoff?token={token_hash}` which exchanges the token and issues a NestJS JWT via the deep link redirect.
2. `supabase.auth.exchangeCodeForSession(code)` — fired for PKCE OAuth `?code=` callbacks. After migration → this becomes dead code. PKCE exchange happens server-side at `GET /auth/google/callback`, which redirects to `stockflow://auth/callback?token=...&refresh=...`. The `main.tsx` handler just needs to detect and store the JWT from the callback URL.

**Resolution**: Add `Verified.tsx` and `main.tsx` as items 13 and 14 to Phase 12 migration sub-steps (already applied above).

---

#### GAP-19: `UpgradeGateContext.tsx` Directly Calls `auth-handoff` Edge Function; `POST /auth/generate-handoff` Missing

**Source file**: `apps/app/src/context/UpgradeGateContext.tsx` — `openPricing()` function

`openPricing()` makes a raw `fetch` to `${SUPABASE_URL}/functions/v1/auth-handoff` with the user's Supabase `access_token`, receiving back `{ token_hash, type }` to embed in the pricing page URL for seamless auth. When Phase 13 deprecates `auth-handoff`, this fetch silently fails (errors are swallowed) and users open the pricing page without auth context — they see the login page instead of being seamlessly authenticated for upgrade.

The BRD's `POST /auth/magic-link` is admin-triggered and wrong for this use case. The user-facing handoff flow needs a **separate authenticated endpoint** that generates a short-lived (5 min), single-use token for the current JWT holder.

**Resolution — add to Section 9.1:**

| Method | Path | Auth | Tables | Description |
|--------|------|------|--------|-------------|
| `POST` | `/auth/generate-handoff` | ✅ all | — | No body required. Issues a 5-minute, single-use JWT signed with `HANDOFF_SECRET`. Returns `{ token }`. Client appends as `?token=...` to the pricing page URL. The pricing page calls `GET /auth/handoff?token=...` to exchange it for a web session. |

**Phase 12 migration**: In `UpgradeGateContext.tsx` `openPricing()`:
- Replace `fetch(SUPABASE_URL/functions/v1/auth-handoff, ...)` → `POST /api/v1/auth/generate-handoff` using the stored NestJS access token.
- Response changes from `{ token_hash, type }` to `{ token }`. Update URL construction: `url += \`?token=\${token}\`` instead of `?token_hash=...&type=...`.

---

#### GAP-20: `supabase.auth.signOut()` Replacement Not Explicit in Phase 12

**Source file**: `apps/app/src/context/AuthContext.tsx` line 288 — `await supabase.auth.signOut()`

`POST /auth/logout` exists in the BRD and Phase 12 covers `AuthContext.tsx`, but the specific replacement (`supabase.auth.signOut()` → `POST /api/v1/auth/logout` + clear `Capacitor.Preferences`) was not listed in the Phase 12 sub-steps, making it easy to miss during implementation since it's a destructive operation (if not called, the refresh token remains valid server-side).

**Resolution**: Added explicitly to the `AuthContext.tsx` Phase 12 sub-step (already applied above).

---

### D.4 Summary Table

| ID | Severity | Description | Action Required |
|----|----------|-------------|-----------------|
| GAP-01 | 🔴 Critical | `public_shares` / share link module entirely missing | Add Shares module to Section 9 + Phase 12 |
| GAP-02 | 🔴 Critical | `link_counterparty_to_tenant` conflated with `connect_by_trade_code` | Fix Section 9.7 and Appendix B |
| GAP-03 | 🔴 Critical | Profile update + password change endpoints missing | Add `PATCH /auth/me`, `PATCH /auth/me/password`, `PATCH /auth/me/email` |
| GAP-04 | 🔴 Critical | `OrderDetail.tsx` per-order payment reads not covered | Add `GET /sales/orders/:id/payments` + `GET /purchasing/orders/:id/payments` |
| GAP-05 | 🟡 Medium | `AuthContext.tsx` direct Supabase calls omitted from Phase 12 | Add to Phase 12 sub-steps |
| GAP-06 | 🟡 Medium | `auth-handoff` edge function has no NestJS replacement | Add `POST /auth/magic-link` + `GET /auth/handoff` to Section 9.1 |
| GAP-07 | 🟡 Medium | Batch endpoint timeout risk on Render free tier | Cap batch at 20 items, add per-item AbortSignal timeout |
| GAP-08 | 🟡 Medium | `usePushNotifications.ts` migration omitted from Phase 12 | Add to Phase 12 sub-steps |
| GAP-09 | 🟠 Minor | `trade_code` + `suspended_until` not in tenant response shape | Update `GET /tenant` description |
| GAP-10 | 🟠 Minor | Dockerfile incorrect for monorepo | Replace Dockerfile in Phase 0 Step 14 |
| GAP-11 | 🟠 Minor | PostHog event capture lost when sync moves server-side | Add `posthog-node` to Phase 4 |
| GAP-12 | 🟠 Minor | `Pricing.tsx` direct read omitted from Phase 12 | Add to Phase 12 sub-steps |
| GAP-13 | 🟠 Minor | Ledger allocation drill-down endpoints missing | Add `GET /payments/:type/:id/allocations` to Section 9 |
| GAP-14 | 🟠 Minor | `billing/updateOrder` vs edit ambiguity | Clarify descriptions in Section 9.4 |
| GAP-15 | 🟠 Minor | `wallet` slice has no server persistence — undocumented | Add note that wallet is intentionally local-only |
| GAP-16 | 🔴 Critical | `POST /auth/login` missing — email+password login broken at migration | Add `POST /auth/login` to Section 9.1 |
| GAP-17 | 🔴 Critical | `POST /auth/invite/complete` missing — invite signup broken | Add `POST /auth/invite/complete` to Section 9.1 |
| GAP-18 | 🟡 Medium | `Verified.tsx` + `main.tsx` not in Phase 12 migration steps | Add to Phase 12 sub-steps |
| GAP-19 | 🟡 Medium | `UpgradeGateContext.tsx` calls `auth-handoff` directly; `POST /auth/generate-handoff` missing | Add endpoint to Section 9.1 + Phase 12 step |
| GAP-20 | 🟠 Minor | `supabase.auth.signOut()` replacement not explicit in Phase 12 | Add to AuthContext.tsx Phase 12 sub-step |

---

## Appendix A: Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 3000) | Server port |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (never expose to clients) |
| `JWT_SECRET` | Yes | 256-bit random string for signing JWTs |
| `JWT_ACCESS_EXPIRES_IN` | No (default: 15m) | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No (default: 30d) | Refresh token TTL |
| `GOOGLE_CLIENT_ID` | Yes (for OAuth) | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (for OAuth) | Google OAuth 2.0 Client Secret |
| `GOOGLE_CALLBACK_URL` | Yes | Full URL for OAuth callback |
| `RAZORPAY_KEY_ID` | Yes (for billing) | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Yes (for billing) | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes (for billing) | Razorpay webhook HMAC secret |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `FIREBASE_SERVICE_ACCOUNT` | Yes (for push) | Firebase Admin SDK JSON (stringified) |
| `POSTHOG_API_KEY` | Yes (for analytics) | PostHog project API key. Server-side event capture in SyncService. |

---

## Appendix B: Supabase RPCs Referenced by NestJS

| RPC | Used In | Module |
|-----|---------|--------|
| `create_trade_order` | `POST /sales/orders` | Sales |
| `update_order_payment` | `POST /sales/orders/:id/payment` | Sales |
| `return_order` | `POST /sales/orders/:id/return` | Sales |
| `edit_sale_order` | `PUT /sales/orders/:id/edit` | Sales |
| `soft_delete_sale_order` | `DELETE /sales/orders/:id` | Sales |
| `create_purchase_order` | `POST /purchasing/orders` | Purchasing |
| `edit_purchase_order` | `PUT /purchasing/orders/:id/edit` | Purchasing |
| `soft_delete_purchase_order` | `DELETE /purchasing/orders/:id` | Purchasing |
| `mark_po_item_accepted` | `POST /purchasing/orders/:id/items/:itemId/accept` | Purchasing |
| `mark_po_item_rejected` | `POST /purchasing/orders/:id/items/:itemId/reject` | Purchasing |
| `certify_po_receipt` | `POST /purchasing/orders/:id/certify` | Purchasing |
| `link_phone_to_po` | `POST /inventory/phones/:id/link-po` | Inventory |
| `record_customer_payment` | `POST /payments/customer` | Payments |
| `record_customer_settlement_fifo` | `POST /payments/customer/settlement` | Payments |
| `record_supplier_payment` | `POST /payments/supplier` | Payments |
| `record_supplier_settlement_fifo` | `POST /payments/supplier/settlement` | Payments |
| `connect_by_trade_code` | `POST /trade/connect` | Trade |
| `link_counterparty_to_tenant` | `POST /customers/:id/link` | Customers |
| `unlink_counterparty` | `DELETE /customers/:id/link` | Customers |
| `lookup_tenant_by_trade_code` | `GET /trade/lookup/:code` | Trade |
| `create_transfer` | `POST /trade/transfer` | Trade |
| `sync_transfer_status` | `PATCH /trade/transfer/:id/sync-status` | Trade |
| `get_shared_order` | `GET /shares/public/:token` | Shares |

---

## Appendix C: Migration Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| NestJS server down during migration | Low | High | Keep Supabase direct access as fallback until Phase 12 complete |
| JWT secret rotation required | Medium | Medium | `POST /auth/refresh` auto-rotates tokens; users re-login once |
| Supabase RPC signature mismatch | Low | High | Port RPC params verbatim from `supabaseApi.ts`, test each one before cutover |
| Mobile deep link not working on iOS | Medium | High | Test on physical iOS device before Phase 12 cutover |
| Render cold start causes mobile timeout | Medium | Medium | UptimeRobot + 30s retry in `apiClient` wrapper |
| service_role key leak | Very Low | Critical | Never log key, never return in responses, rotate immediately if leaked |
