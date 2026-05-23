# Load & Performance Testing

## Overview

Backend load testing uses **k6** (Grafana) targeting Supabase PostgREST and Edge Function HTTP endpoints. Frontend performance is measured with **rollup-plugin-visualizer** (bundle size) and **Lighthouse CI** (Core Web Vitals). Target: **300 concurrent users**.

---

## Prerequisites

| Tool | Install | Check |
|------|---------|-------|
| k6 | `brew install k6` | `k6 version` (v0.50+) |
| Node 22 | Already installed | `node --version` |

---

## 1. Backend Load Testing (k6)

### Directory Structure

```
tests/load/
├── config.js                  # env: URL, keys, test user creds
├── helpers/
│   └── auth.js                # login + return JWT
├── scenarios/
│   ├── auth.js                # GoTrue sign-in
│   ├── inventory-listing.js   # GET phones
│   ├── profile-save.js        # PATCH profiles + PUT auth/user
│   ├── create-so.js           # RPC create_trade_order
│   ├── create-po.js           # RPC create_purchase_order
│   ├── ledger.js              # INSERT ledger
│   ├── payments.js            # FIFO settlement RPCs
│   ├── customer-creation.js   # INSERT counterparties
│   └── trade-code.js          # RPC lookup + connect
└── full-suite.js              # orchestrates all scenarios (300 VUs)
```

### Running

```bash
# Single scenario — quick validation
k6 run tests/load/scenarios/auth.js --vus 10 --duration 30s

# Full suite — 300 VUs combined
k6 run tests/load/full-suite.js

# With custom env vars
k6 run tests/load/full-suite.js \
  -e SUPABASE_URL=https://lietpzxydupsxmlncrpi.supabase.co \
  -e SUPABASE_ANON_KEY=eyJ... \
  -e TEST_PASS=LoadTest123!

# JSON output for analysis
k6 run tests/load/full-suite.js --out json=results.json
```

### Thresholds

| Metric | Pass | Fail |
|--------|------|------|
| p95 response time | < 500ms | > 1000ms |
| p99 response time | < 2000ms | > 5000ms |
| Error rate | < 1% | > 5% |
| Throughput | > 200 req/s | < 100 req/s |

---

## 2. Frontend Performance

### Bundle Analysis

```bash
cd apps/app
pnpm perf:bundle    # builds + opens interactive treemap (stats.html)
```

### Bundle Size Budgets

| Chunk | Budget (gzip) |
|-------|---------------|
| vendor-core (React + Router) | < 150 KB |
| vendor-zxing | < 200 KB |
| vendor-charts (Recharts) | < 100 KB |
| vendor-xlsx | < 150 KB |
| app code (all routes) | < 200 KB |

### Lighthouse CI

```bash
cd apps/app
pnpm perf:lighthouse
```

Targets (in `lighthouserc.js`):
- Performance score > 0.7
- FCP < 2000ms
- LCP < 3500ms
- CLS < 0.1
- TBT < 300ms

---

## 3. Mobile Profiling

### Android — Android Studio Profiler

1. Run app on device via Android Studio
2. **View → Tool Windows → Profiler**
3. Monitor: CPU (main-thread jank), Memory (heap growth), Network (latency)

### iOS — Xcode Instruments

1. **Product → Profile** (`Cmd+I`)
2. Use **Time Profiler** and **Core Animation** templates
3. Monitor: frame rate, allocations, network

### Targets

| Metric | Target |
|--------|--------|
| Cold start → interactive | < 2 seconds |
| Scroll frame rate | 60 fps (no drops below 45) |
| Memory after 10min use | < 150 MB |
| API response (device LTE) | < 1.5s p95 |

---

## 4. Test User Setup

Provision 5 dedicated test accounts (single tenant) before running load tests:

```bash
# Submit tenant request
curl -X POST https://lietpzxydupsxmlncrpi.supabase.co/functions/v1/submit-tenant-request \
  -H "Content-Type: application/json" \
  -d '{"org_name":"Load Test Corp","email":"loadtest1@finventree.com","phone":"+910000000001","owner_name":"Load Tester"}'

# Approve via admin panel, then repeat for loadtest2-5@finventree.com
```

---

## 5. Red Flags to Investigate

| Signal | Likely cause |
|--------|-------------|
| p95 > 1s on reads | Missing DB index or N+1 in RLS policy |
| Error rate spikes at VU ramp | PgBouncer connection pool exhausted |
| Timeout on RPCs only | Long-running transaction / lock contention |
| 401 errors mid-test | JWT expired (extend token lifetime for tests) |
| Memory growth on mobile | Event listener leak or unbounded Redux state |

---

## 6. Scripts Reference

| Script | What it does |
|--------|-------------|
| `pnpm perf:bundle` | Production build + opens bundle treemap |
| `pnpm perf:lighthouse` | Lighthouse CI against deployed web app |
| `pnpm test:load` | Full k6 suite (300 VUs) |
| `pnpm test:load:quick` | Quick 10-VU smoke test on inventory listing |
