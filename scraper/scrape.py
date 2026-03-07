"""
scraper/scrape.py
─────────────────
Weekly StockFlow device catalog updater.
Runs every Friday via GitHub Actions.

Logic:
  1. Load all existing (brand, model) from catalog_models_v2
  2. Scrape GSMArena brand pages for all India-market phones
  3. For each device — scrape GSMArena for ground truth, then:
     a. DB matches GSMArena exactly → skip
     b. DB missing or has fewer variants → merge + patch
     c. Not in DB at all → check 91mobiles, then insert if confirmed India
  4. Upsert to Supabase in batches of 50 (no data loss on cancellation)
"""

import os
import re
import sys
import json
import time
import random
import logging
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from push_to_supabase import (
    get_existing_catalog,
    upsert_devices,
    mark_scraped,
)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
DELAY_MIN    = 4.0
DELAY_MAX    = 8.0
MAX_RETRIES  = 3
BATCH_SIZE   = 50   # Push to Supabase every N devices

# If this many consecutive devices return no specs, assume IP ban and stop
MAX_CONSECUTIVE_FAILURES = 5
# How long to pause and retry once when a ban is first detected (seconds)
BAN_COOLDOWN = 600  # 10 minutes

# Rotate User-Agents so we don't always look like the same bot
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]

HEADERS = {
    "User-Agent": USER_AGENTS[0],  # rotated per-request in get()
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection":      "keep-alive",
}

# ── Brand pages ───────────────────────────────────────────────────────────────
GSMARENA_BRANDS = {
    "Samsung":  "samsung-phones-9.php",
    "Apple":    "apple-phones-48.php",
    "Xiaomi":   "xiaomi-phones-80.php",
    "Oppo":     "oppo-phones-82.php",
    "Vivo":     "vivo-phones-98.php",       # was 99 (wrong) -> 98
    "Realme":   "realme-phones-118.php",
    "OnePlus":  "oneplus-phones-95.php",    # was 87 (wrong) -> 95
    "Motorola": "motorola-phones-4.php",    # was 13 (wrong) -> 4
    "Nokia":    "nokia-phones-1.php",       # was 61 (wrong) -> 1
    "Nothing":  "nothing-phones-128.php",   # was 163 (wrong) -> 128
    "Google":   "google-phones-107.php",
    "Honor":    "honor-phones-121.php",
    "Infinix":  "infinix-phones-119.php",
    "Tecno":    "tecno-phones-120.php",
    "POCO":     "poco-phones-123.php",
    "Itel":     "itel-phones-131.php",      # was 175 (wrong) -> 131
}

# ── Skip filters ──────────────────────────────────────────────────────────────
# href-based: matched against GSMArena URL slug
SKIP_HREF = [
    "watch", "tab_", "tablet", "buds", "earphone", "band",
    "pad_", "_pad", "router", "gravity", "smart_tv", "tv_",
    "hub_", "_hub", "speaker", "display", "monitor",
    # OnePlus non-phones
    "nitro_", "orbit_", "astro_", "android_", "virtue_", "blade_",
]

# model-name-based: matched against parsed model string
SKIP_MODEL = [
    "tab ", "tablet", "watch", "band", "buds", "earphone",
    "pad", "router", "gravity", "tv", "speaker", "hub",
    "display", "monitor", "charger", "cable",
    # OnePlus non-phones
    "nitro ", "orbit ", "astro ", "virtue ", "blade",
    # Nokia non-phones
    "venue", "xps",
]

# ── Color name → hex map ──────────────────────────────────────────────────────
COLOR_HEX = {
    "black": "#1A1A1C",        "midnight black": "#1A1A1C",
    "jet black": "#1C1B1E",    "onyx black": "#2E2E30",
    "space black": "#1B1B1B",  "carbon black": "#2A2A2A",
    "white": "#F8F8F8",        "cloud white": "#F0F0EE",
    "pearl white": "#F5F5F0",  "glacier white": "#F2F3F5",
    "blue": "#3A6A9A",         "sky blue": "#A0B8D0",
    "navy": "#283448",         "navy blue": "#283448",
    "midnight blue": "#1E2A40","icy blue": "#B8CCD8",
    "ocean blue": "#2A5878",   "cobalt blue": "#2A4A8A",
    "stellar blue": "#4C6A9A", "glacier blue": "#5A8AB0",
    "green": "#3A7A5A",        "mint": "#A8CCC0",
    "alpine green": "#505E4C", "emerald green": "#2A7A5A",
    "aurora green": "#3A8A7A", "forest green": "#2D4A38",
    "sage": "#A9B689",         "olive green": "#7E9F88",
    "gold": "#C8A870",         "rose gold": "#E8C0A8",
    "silver": "#C8C8C8",       "titanium": "#8A8A8C",
    "graphite": "#4A4C50",     "grey": "#9A9A9C",
    "gray": "#9A9A9C",         "space grey": "#535150",
    "red": "#A02020",          "product red": "#BF0013",
    "coral red": "#C84848",    "burgundy": "#6A2030",
    "purple": "#7058A0",       "lavender": "#C0B0D8",
    "violet": "#9070A8",       "bora purple": "#7058A0",
    "deep purple": "#594F63",  "pink": "#E8C0C8",
    "rose": "#D4A0A8",         "coral": "#E08070",
    "teal": "#B0D4D2",         "cyan": "#5AB8C8",
    "aqua": "#5AB8C8",         "orange": "#D87040",
    "amber": "#D8C870",        "yellow": "#D8C870",
    "beige": "#E8E0C8",        "cream": "#EEE8D8",
    "brown": "#7A5A48",        "bronze": "#8A6248",
    "copper": "#B87848",       "peach": "#E8C0A8",
}

def color_to_hex(name: str) -> str:
    n = name.lower().strip()
    if n in COLOR_HEX:
        return COLOR_HEX[n]
    for key, val in COLOR_HEX.items():
        if key in n:
            return val
    return "#888888"

# ── HTTP ──────────────────────────────────────────────────────────────────────
session = requests.Session()
session.headers.update(HEADERS)

def get(url: str, retries=MAX_RETRIES) -> requests.Response | None:
    for attempt in range(retries):
        try:
            # Rotate User-Agent on every request
            session.headers.update({"User-Agent": random.choice(USER_AGENTS)})
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
            r = session.get(url, timeout=20)

            if r.status_code == 429:
                wait = 30 * (attempt + 1)
                log.warning(f"  Rate limited (429), backing off {wait}s...")
                time.sleep(wait)
                continue

            r.raise_for_status()
            return r

        except requests.RequestException as e:
            wait = 10 * (attempt + 1)
            log.warning(f"  Request failed ({e}), retry {attempt+1}/{retries} in {wait}s")
            time.sleep(wait)

    log.error(f"  Giving up on {url}")
    return None

# ── 91mobiles India verification ──────────────────────────────────────────────
def slugify(text: str) -> str:
    """'Samsung Galaxy S25 Ultra' -> 'samsung-galaxy-s25-ultra'"""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")

def is_available_india(brand: str, model: str) -> bool:
    """
    Check 91mobiles to confirm device is available in India.
    Uses HEAD request — fast, downloads nothing.

    Returns:
      True  -> page exists (200)      = confirmed India market
      True  -> network error / 429    = assume India (avoid false negatives)
      False -> page not found (404)   = not listed in India
    """
    slug = slugify(f"{brand} {model}")
    url  = f"https://www.91mobiles.com/{slug}-price-in-india"

    try:
        time.sleep(random.uniform(0.5, 1.2))
        r = session.head(url, timeout=10, allow_redirects=True)

        if r.status_code == 200:
            log.debug(f"    91mobiles confirmed: {brand} {model}")
            return True

        if r.status_code == 404:
            log.info(f"    91mobiles: not listed — {brand} {model}")
            return False

        # 429, 503 etc — assume India to avoid false negatives
        log.debug(f"    91mobiles returned {r.status_code} for {brand} {model} — assuming India")
        return True

    except requests.RequestException as e:
        log.debug(f"    91mobiles check failed ({e}) — assuming India")
        return True

# ── Parsers ───────────────────────────────────────────────────────────────────
def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

def to_mb(s: str) -> int:
    s = s.strip().upper()
    if s.endswith("TB"):
        return int(s[:-2]) * 1024 * 1024
    if s.endswith("GB"):
        return int(s[:-2]) * 1024
    if s.endswith("MB"):
        return int(s[:-2])
    return 0

def parse_storage(s: str) -> list[str]:
    found = re.findall(r"([\d.]+)\s*(GB|TB)", s, re.I)
    opts = set()
    for num, unit in found:
        n, u = float(num), unit.upper()
        if u == "TB":
            opts.add(f"{int(n)}TB")
        elif u == "GB" and n >= 32:
            opts.add(f"{int(n)}GB")
    return sorted(opts, key=to_mb)

def parse_ram(s: str) -> list[str]:
    found = re.findall(r"(\d+)\s*GB", s, re.I)
    opts = {f"{v}GB" for v in map(int, found) if 1 <= v <= 24}
    return sorted(opts, key=lambda x: int(x[:-2]))

def parse_colors(s: str) -> list[dict]:
    seen, result = set(), []
    for raw in re.split(r"[,/]", s):
        label = re.sub(r"\d+GB.*", "", clean(raw)).strip()
        if not label or len(label) < 2 or len(label) > 50:
            continue
        if label.lower() in seen:
            continue
        seen.add(label.lower())
        result.append({"label": label, "hex": color_to_hex(label)})
    return result

# ── Completion logic ──────────────────────────────────────────────────────────
def is_complete(db_row: dict, scraped: dict) -> bool:
    db_ram     = set(db_row.get("ram", []))
    db_storage = set(db_row.get("storage", []))
    db_colors  = {c["label"].lower() for c in db_row.get("colors", [])}
    scraped_ram     = set(scraped.get("ram", []))
    scraped_storage = set(scraped.get("storage", []))
    scraped_colors  = {c["label"].lower() for c in scraped.get("colors", [])}
    return (
        scraped_ram.issubset(db_ram)
        and scraped_storage.issubset(db_storage)
        and scraped_colors.issubset(db_colors)
    )

def diff_fields(db_row: dict, scraped: dict) -> dict:
    diff = {}

    db_ram      = set(db_row.get("ram", []))
    scraped_ram = set(scraped.get("ram", []))
    if scraped_ram - db_ram:
        diff["ram"] = sorted(
            db_ram | scraped_ram,
            key=lambda x: int(x.replace("GB", ""))
        )

    db_storage      = set(db_row.get("storage", []))
    scraped_storage = set(scraped.get("storage", []))
    if scraped_storage - db_storage:
        diff["storage"] = sorted(db_storage | scraped_storage, key=to_mb)

    db_colors_map      = {c["label"].lower(): c for c in db_row.get("colors", [])}
    scraped_colors_map = {c["label"].lower(): c for c in scraped.get("colors", [])}
    new_labels         = set(scraped_colors_map.keys()) - set(db_colors_map.keys())
    if new_labels:
        merged = list(db_row.get("colors", []))
        for lbl in new_labels:
            merged.append(scraped_colors_map[lbl])
        diff["colors"] = merged

    return diff

# ── GSMArena scraping ─────────────────────────────────────────────────────────
def scrape_specs(url: str) -> dict:
    r = get(url)
    if not r:
        return {}

    soup  = BeautifulSoup(r.text, "html.parser")
    specs = {"ram": [], "storage": [], "colors": [], "gsmarena_url": url}

    for row in soup.select("#specs-list tr"):
        ttl_el = row.select_one("td.ttl")
        nfo_el = row.select_one("td.nfo")
        if not ttl_el or not nfo_el:
            continue
        ttl = clean(ttl_el.text).lower()
        nfo = clean(nfo_el.text)

        if "ram" in ttl and not specs["ram"]:
            specs["ram"] = parse_ram(nfo)

        elif "internal" in ttl or ("storage" in ttl and "card" not in ttl):
            if not specs["storage"]:
                specs["storage"] = parse_storage(nfo)
            if not specs["ram"]:
                specs["ram"] = parse_ram(nfo)

        elif ("color" in ttl or "colour" in ttl) and not specs["colors"]:
            specs["colors"] = parse_colors(nfo)

    for ttl_el in soup.select("td.ttl"):
        if "models" in clean(ttl_el.text).lower():
            nfo_el = ttl_el.find_next_sibling("td", class_="nfo")
            if nfo_el:
                text = clean(nfo_el.text)
                if not specs["ram"]:
                    specs["ram"] = parse_ram(text)
                if not specs["storage"]:
                    specs["storage"] = parse_storage(text)

    return specs

# ── Pagination config ────────────────────────────────────────────────────────
# First run: scrape up to MAX_PAGES to backfill the DB.
# Subsequent runs: only page 1 is needed (new phones always appear there).
# Set via env var SCRAPE_MAX_PAGES — defaults to 1 for normal weekly runs.
MAX_PAGES    = int(os.environ.get("SCRAPE_MAX_PAGES", "1"))
MIN_YEAR     = 2018   # skip any device announced before this year

def _announced_year(img_title: str) -> int | None:
    """
    Extract announcement year from GSMArena img title attribute.
    e.g. "... Announced Jan 2024. Features ..."  -> 2024
    """
    m = re.search(r"Announced\s+\w+\s+(\d{4})", img_title)
    if m:
        return int(m.group(1))
    # fallback: any 4-digit year between 2000-2030
    m = re.search(r"\b(20[0-2]\d)\b", img_title)
    return int(m.group(1)) if m else None

def _brand_id(slug: str) -> str:
    """Extract numeric brand ID from slug. e.g. 'samsung-phones-9.php' -> '9'"""
    m = re.search(r"-(\d+)\.php$", slug)
    return m.group(1) if m else ""

def _page_url(slug: str, page: int) -> str:
    """
    Build GSMArena paginated URL.
    Page 1: samsung-phones-9.php
    Page N: samsung-phones-f-9-0-pN.php
    """
    if page == 1:
        return f"https://www.gsmarena.com/{slug}"
    brand_id = _brand_id(slug)
    base = slug.replace(f"-{brand_id}.php", "")
    return f"https://www.gsmarena.com/{base}-f-{brand_id}-0-p{page}.php"

def _parse_items(soup: BeautifulSoup, brand: str, seen: set) -> tuple[list[dict], bool]:
    """
    Parse all device <li> items from a brand page soup.
    Returns (devices, hit_year_cutoff).
    hit_year_cutoff=True means we found a pre-2018 device → stop paginating.
    """
    items = soup.select(".section-body ul li, ul.phones-list li, #list-devices li")
    if not items:
        items = [
            li for li in soup.find_all("li")
            if li.find("a", href=re.compile(r"[\w-]+-\d+\.php"))
        ]

    devices = []
    hit_year_cutoff = False

    for item in items:
        link = item.find("a", href=re.compile(r"[\w-]+-\d+\.php"))
        if not link:
            continue

        href = link.get("href", "")

        # ── Layer 1: skip by href slug ──
        if any(k in href.lower() for k in SKIP_HREF):
            continue

        # ── Only accept valid slugs with numeric ID ──
        device_id_match = re.search(r"-(\d+)\.php$", href)
        if not device_id_match:
            continue
        if int(device_id_match.group(1)) < 5000:
            continue

        # ── Year filter — read from img title attribute ──
        img = link.find("img")
        title_text = img.get("title", "") if img else ""
        year = _announced_year(title_text)
        if year and year < MIN_YEAR:
            log.debug(f"    Skipping {href} — announced {year} (before {MIN_YEAR})")
            hit_year_cutoff = True
            continue  # don't break — page may have mixed years

        # ── Get model name ──
        strong = link.find("strong")
        if strong:
            model = clean(strong.text)
        else:
            full_name = img.get("alt", "") if img else clean(link.text)
            if full_name.lower().startswith(brand.lower()):
                model = full_name[len(brand):].strip()
            else:
                parts = full_name.split(" ", 1)
                model = parts[1].strip() if len(parts) > 1 else full_name

        if not model or len(model) < 2:
            continue

        # ── Layer 2: skip by model name ──
        if any(k in model.lower() for k in SKIP_MODEL):
            continue

        key = f"{brand}::{model}"
        if key in seen:
            continue
        seen.add(key)

        devices.append({
            "brand": brand,
            "model": model,
            "url":   f"https://www.gsmarena.com/{href}",
        })

    return devices, hit_year_cutoff

def scrape_new_launches() -> list[dict]:
    log.info(f"Fetching device list from GSMArena (per brand, up to {MAX_PAGES} page(s))...")
    all_devices = []
    seen = set()

    for brand, slug in GSMARENA_BRANDS.items():
        log.info(f"  Scraping {brand}...")
        brand_count = 0

        for page in range(1, MAX_PAGES + 1):
            url = _page_url(slug, page)
            r = get(url)
            if not r:
                log.warning(f"    Page {page}: failed to fetch — stopping brand")
                break

            # Empty page or redirect back to page 1 = no more pages
            if page > 1 and r.url == _page_url(slug, 1):
                log.debug(f"    Page {page}: redirected to page 1 — no more pages")
                break

            soup = BeautifulSoup(r.text, "html.parser")
            devices, hit_cutoff = _parse_items(soup, brand, seen)
            all_devices.extend(devices)
            brand_count += len(devices)

            log.info(f"    Page {page}: {len(devices)} devices{'  [pre-2018 found, stopping]' if hit_cutoff and page == MAX_PAGES else ''}")

            # Stop paginating if no devices on this page (end of list)
            if not devices and not hit_cutoff:
                log.debug(f"    Page {page}: empty — no more pages")
                break

            # Stop if all devices on this page were pre-2018 (we've gone far enough back)
            if hit_cutoff and not devices:
                log.info(f"    Reached pre-2018 devices — stopping pagination")
                break

            if page < MAX_PAGES:
                time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

        log.info(f"    -> {brand_count} devices total for {brand}")
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    log.info(f"Total: {len(all_devices)} unique devices across all brands")
    return all_devices

# ── Batch push helper ─────────────────────────────────────────────────────────
total_pushed = 0
total_failed = 0

def flush_batch(upserts: list) -> list:
    """Push current batch to Supabase, return empty list."""
    global total_pushed, total_failed
    if not upserts:
        return []
    log.info(f"  Pushing batch of {len(upserts)}...")
    pushed, failed = upsert_devices(upserts)
    total_pushed += pushed
    total_failed += failed
    log.info(f"    Pushed: {pushed} | Failed: {failed} | Total so far: {total_pushed}")
    return []

# ── Main ──────────────────────────────────────────────────────────────────────
def run():
    global total_pushed, total_failed

    log.info("=" * 60)
    log.info("StockFlow Catalog Updater — starting")
    log.info(f"Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 60)

    log.info("Loading existing catalog from Supabase...")
    existing = get_existing_catalog()
    log.info(f"  {len(existing)} models in catalog_models_v2")

    launches = scrape_new_launches()

    upserts            = []
    skipped            = 0
    new_count          = 0
    patched_count      = 0
    india_skipped      = 0
    total              = len(launches)
    consecutive_fails  = 0   # tracks back-to-back "no specs" results
    ban_cooldown_used  = False  # only attempt one cooldown per run

    log.info(f"\nProcessing {total} devices...")

    for i, device in enumerate(launches, 1):
        key          = f"{device['brand']}::{device['model']}"
        existing_row = existing.get(key)
        url          = device.get("url")

        log.info(f"  [{i}/{total}] {device['brand']} {device['model']}")

        # ── Existing devices: scrape + patch, no 91mobiles check needed ──
        if existing_row:
            specs = scrape_specs(url)

            if not specs.get("ram") and not specs.get("storage"):
                consecutive_fails += 1
                log.warning(f"    No specs found — skipping (consecutive failures: {consecutive_fails})")

                # ── Ban detection ──
                if consecutive_fails >= MAX_CONSECUTIVE_FAILURES:
                    if not ban_cooldown_used:
                        log.error(f"  {MAX_CONSECUTIVE_FAILURES} consecutive failures — likely IP banned.")
                        log.error(f"  Cooling down for {BAN_COOLDOWN // 60} minutes then retrying once...")
                        time.sleep(BAN_COOLDOWN)
                        ban_cooldown_used = True
                        consecutive_fails = 0  # reset and try again
                        specs = scrape_specs(url)
                        if not specs.get("ram") and not specs.get("storage"):
                            log.error("  Still no specs after cooldown — IP ban confirmed. Stopping early.")
                            break
                    else:
                        log.error("  IP ban persists after cooldown. Stopping early to save progress.")
                        break
                continue

            consecutive_fails = 0  # reset on success
            changes = diff_fields(existing_row, specs)

            if not changes:
                log.info(f"    Complete — skipping")
                skipped += 1
                continue

            log.info(f"    Patching: {list(changes.keys())}")
            for field, val in changes.items():
                log.info(f"      {field}: {existing_row.get(field)} -> {val}")

            upserts.append({
                "brand":        device["brand"],
                "model":        device["model"],
                "ram":          changes.get("ram",     existing_row.get("ram", [])),
                "storage":      changes.get("storage", existing_row.get("storage", [])),
                "colors":       changes.get("colors",  existing_row.get("colors", [])),
                "gsmarena_url": specs.get("gsmarena_url", url),
            })
            patched_count += 1

        # ── New devices: verify on 91mobiles before inserting ──
        else:
            if not is_available_india(device["brand"], device["model"]):
                log.info(f"    Not found on 91mobiles — skipping")
                india_skipped += 1
                continue

            specs = scrape_specs(url)

            if not specs.get("ram") and not specs.get("storage"):
                consecutive_fails += 1
                log.warning(f"    No specs found — skipping (consecutive failures: {consecutive_fails})")

                # ── Ban detection ──
                if consecutive_fails >= MAX_CONSECUTIVE_FAILURES:
                    if not ban_cooldown_used:
                        log.error(f"  {MAX_CONSECUTIVE_FAILURES} consecutive failures — likely IP banned.")
                        log.error(f"  Cooling down for {BAN_COOLDOWN // 60} minutes then retrying once...")
                        time.sleep(BAN_COOLDOWN)
                        ban_cooldown_used = True
                        consecutive_fails = 0
                        specs = scrape_specs(url)
                        if not specs.get("ram") and not specs.get("storage"):
                            log.error("  Still no specs after cooldown — IP ban confirmed. Stopping early.")
                            break
                    else:
                        log.error("  IP ban persists after cooldown. Stopping early to save progress.")
                        break
                continue

            consecutive_fails = 0  # reset on success
            log.info(f"    + New — RAM: {specs.get('ram')} | Storage: {specs.get('storage')} | Colors: {len(specs.get('colors', []))}")
            upserts.append({
                "brand":        device["brand"],
                "model":        device["model"],
                "ram":          specs.get("ram", []),
                "storage":      specs.get("storage", []),
                "colors":       specs.get("colors", []),
                "gsmarena_url": specs.get("gsmarena_url", url),
            })
            new_count += 1

        # Batch push every BATCH_SIZE devices — no data loss on cancellation
        if len(upserts) >= BATCH_SIZE:
            upserts = flush_batch(upserts)

    # Push any remaining
    if upserts:
        upserts = flush_batch(upserts)

    log.info(f"\n{'=' * 60}")
    log.info(f"Summary:")
    log.info(f"  New devices added:     {new_count}")
    log.info(f"  Patched:               {patched_count}")
    log.info(f"  Already complete:      {skipped}")
    log.info(f"  Filtered (not India):  {india_skipped}")
    log.info(f"  Total pushed:          {total_pushed}")
    log.info(f"  Total failed:          {total_failed}")

    log.info("\nDone")

if __name__ == "__main__":
    run()
