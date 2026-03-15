"""
scraper/push_to_supabase.py
────────────────────────────
All Supabase read/write operations for the catalog updater.
Uses the Supabase REST API directly (no SDK needed).
"""

import os
import sys
import time
import logging
import requests
from datetime import datetime, timezone

log = logging.getLogger(__name__)

# ── Env vars (injected by GitHub Actions) ────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    log.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.")
    sys.exit(1)

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
}

TABLE = "catalog_models_v2"
BASE  = f"{SUPABASE_URL}/rest/v1/{TABLE}"

# ── Read ──────────────────────────────────────────────────────────────────────
def get_existing_catalog() -> dict:
    all_rows = []
    page_size = 1000
    offset = 0

    while True:
        r = requests.get(
            BASE,
            headers={
                **HEADERS,
                "Range": f"{offset}-{offset + page_size - 1}",
                "Prefer": "count=none",
            },
            params={"select": "brand,model,ram,storage,colors,gsmarena_url"},
            timeout=30,
        )

        if r.status_code not in (200, 206):
            log.error(f"Failed to fetch catalog: {r.status_code} {r.text[:200]}")
            sys.exit(1)

        batch = r.json()
        if not batch:
            break

        all_rows.extend(batch)

        if len(batch) < page_size:
            break
        offset += page_size

    return {f"{row['brand']}::{row['model']}": row for row in all_rows}

# ── Write ─────────────────────────────────────────────────────────────────────
def _chunk(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]

def upsert_devices(devices: list[dict]) -> tuple[int, int]:
    pushed = 0
    failed = 0
    now    = datetime.now(timezone.utc).isoformat()

    rows = [{**d, "last_scraped": now} for d in devices]

    for batch in _chunk(rows, 200):
        r = requests.post(
            BASE,
            headers={
                **HEADERS,
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            params={"on_conflict": "brand,model"},  # tells PostgREST which constraint to use
            json=batch,
            timeout=30,
        )

        if r.status_code in (200, 201):
            pushed += len(batch)
        else:
            log.error(f"  Batch upsert failed: {r.status_code} — {r.text[:300]}")
            failed += len(batch)

        time.sleep(0.15)

    return pushed, failed

def mark_scraped(brand: str, model: str):
    now = datetime.now(timezone.utc).isoformat()
    r = requests.patch(
        BASE,
        headers={**HEADERS, "Prefer": "return=minimal"},
        params={"brand": f"eq.{brand}", "model": f"eq.{model}"},
        json={"last_scraped": now},
        timeout=15,
    )
    if r.status_code not in (200, 204):
        log.warning(f"  Could not mark scraped for {brand} {model}: {r.status_code}")
