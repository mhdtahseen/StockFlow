"""
scraper/scrape.py
─────────────────
Weekly StockFlow device catalog updater.
Runs every Friday via GitHub Actions.

Logic:
  1. Load all existing (brand, model) from catalog_models_v2
  2. Scrape GSMArena for recently released India phones
  3. For each device:
     a. Complete data in DB → skip
     b. In DB but missing fields → patch only missing fields
     c. Not in DB → full scrape + insert
  4. Upsert to Supabase via push_to_supabase.py
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
DELAY_MIN   = 1.8   # seconds — be polite to GSMArena
DELAY_MAX   = 3.5
MAX_RETRIES = 3

# India market brands — covers ~97% of Indian market
INDIA_BRANDS = {
    "samsung", "apple", "xiaomi", "redmi", "poco", "vivo", "oppo",
    "realme", "oneplus", "motorola", "nokia", "itel", "tecno", "infinix",
    "micromax", "lava", "honor", "google", "nothing", "lenovo", "asus",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection":  "keep-alive",
}

# ── Brand pages (correct GSMArena URL format) ─────────────────────────────────
GSMARENA_BRANDS = {
    "Samsung":  "samsung-phones-9.php",
    "Apple":    "apple-phones-48.php",
    "Xiaomi":   "xiaomi-phones-80.php",
    "Oppo":     "oppo-phones-82.php",
    "Vivo":     "vivo-phones-99.php",
    "Realme":   "realme-phones-118.php",
    "OnePlus":  "oneplus-phones-87.php",
    "Motorola": "motorola-phones-13.php",
    "Nokia":    "nokia-phones-61.php",
    "Nothing":  "nothing-phones-163.php",
    "Google":   "google-phones-107.php",
    "Honor":    "honor-phones-121.php",
    "Infinix":  "infinix-phones-119.php",
    "Tecno":    "tecno-phones-120.php",
    "POCO":     "poco-phones-123.php",
    "Itel":     "itel-phones-175.php",
}
# ── Color name → hex map ──────────────────────────────────────────────────────
COLOR_HEX = {
    "black": "#1A1A1C",       "midnight black": "#1A1A1C",
    "jet black": "#1C1B1E",   "onyx black": "#2E2E30",
    "space black": "#1B1B1B", "carbon black": "#2A2A2A",
    "white": "#F8F8F8",       "cloud white": "#F0F0EE",
    "pearl white": "#F5F5F0", "glacier white": "#F2F3F5",
    "blue": "#3A6A9A",        "sky blue": "#A0B8D0",
    "navy": "#283448",        "navy blue": "#283448",
    "midnight blue": "#1E2A40","icy blue": "#B8CCD8",
    "ocean blue": "#2A5878",  "cobalt blue": "#2A4A8A",
    "stellar blue": "#4C6A9A","glacier blue": "#5A8AB0",
    "green": "#3A7A5A",       "mint": "#A8CCC0",
    "alpine green": "#505E4C","emerald green": "#2A7A5A",
    "aurora green": "#3A8A7A","forest green": "#2D4A38",
    "sage": "#A9B689",        "olive green": "#7E9F88",
    "gold": "#C8A870",        "rose gold": "#E8C0A8",
    "silver": "#C8C8C8",      "titanium": "#8A8A8C",
    "graphite": "#4A4C50",    "grey": "#9A9A9C",
    "gray": "#9A9A9C",        "space grey": "#535150",
    "red": "#A02020",         "product red": "#BF0013",
    "coral red": "#C84848",   "burgundy": "#6A2030",
    "purple": "#7058A0",      "lavender": "#C0B0D8",
    "violet": "#9070A8",      "bora purple": "#7058A0",
    "deep purple": "#594F63", "pink": "#E8C0C8",
    "rose": "#D4A0A8",        "coral": "#E08070",
    "teal": "#B0D4D2",        "cyan": "#5AB8C8",
    "aqua": "#5AB8C8",        "orange": "#D87040",
    "amber": "#D8C870",       "yellow": "#D8C870",
    "beige": "#E8E0C8",       "cream": "#EEE8D8",
    "brown": "#7A5A48",       "bronze": "#8A6248",
    "copper": "#B87848",      "peach": "#E8C0A8",
}

def color_to_hex(name: str) -> str:
    n = name.lower().strip()
    if n in COLOR_HEX:
        return COLOR_HEX[n]
    for key, val in COLOR_HEX.items():
        if key in n:
            return val
    return "#888888"

# ── HTTP helpers ──────────────────────────────────────────────────────────────
session = requests.Session()
session.headers.update(HEADERS)

def get(url: str, retries=MAX_RETRIES) -> requests.Response | None:
    for attempt in range(retries):
        try:
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
            r = session.get(url, timeout=20)
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            wait = 5 * (attempt + 1)
            log.warning(f"  Request failed ({e}), retry {attempt+1}/{retries} in {wait}s")
            time.sleep(wait)
    log.error(f"  Giving up on {url}")
    return None

# ── Parsers ───────────────────────────────────────────────────────────────────
def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

def parse_storage(s: str) -> list[str]:
    found = re.findall(r"([\d.]+)\s*(GB|TB|MB)", s, re.I)
    opts = set()
    for num, unit in found:
        n, u = float(num), unit.upper()
        if u == "TB":
            opts.add(f"{int(n)}TB")
        elif n >= 1:
            opts.add(f"{int(n)}GB")
    return sorted(opts, key=lambda x: int(x[:-2]) * (1000 if x.endswith("TB") else 1))

def parse_ram(s: str) -> list[str]:
    found = re.findall(r"(\d+)\s*GB", s, re.I)
    opts = {f"{v}GB" for v in map(int, found) if 1 <= int(v) <= 24}
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

def is_complete(row: dict) -> bool:
    """Returns True if the DB row already has all fields populated."""
    return (
        bool(row.get("ram"))
        and bool(row.get("storage"))
        and bool(row.get("colors"))
    )

def missing_fields(row: dict) -> list[str]:
    missing = []
    if not row.get("ram"):     missing.append("ram")
    if not row.get("storage"): missing.append("storage")
    if not row.get("colors"):  missing.append("colors")
    return missing

# ── GSMArena scraping ─────────────────────────────────────────────────────────
def search_device(brand: str, model: str) -> tuple[str | None, str | None]:
    """Search GSMArena → return (url, matched_name)"""
    query = f"{brand} {model}"
    url   = f"https://www.gsmarena.com/search.php3?sQuickSearch={quote_plus(query)}"
    r = get(url)
    if not r:
        return None, None

    soup = BeautifulSoup(r.text, "html.parser")
    for item in soup.select(".makers ul li")[:4]:
        link = item.find("a")
        if not link:
            continue
        span = link.find("span")
        name = clean(span.text if span else link.text)
        href = link.get("href", "")

        brand_l = brand.lower()
        name_l  = name.lower()
        model_words = [w for w in model.lower().split() if len(w) > 2]

        if brand_l in name_l and any(w in name_l for w in model_words):
            return f"https://www.gsmarena.com/{href}", name

    return None, None

def scrape_specs(url: str) -> dict:
    """Scrape a GSMArena device page → return partial spec dict."""
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

        elif ("internal" in ttl or ("storage" in ttl and "card" not in ttl)) and not specs["storage"]:
            specs["storage"] = parse_storage(nfo)

        elif ("color" in ttl or "colour" in ttl) and not specs["colors"]:
            specs["colors"] = parse_colors(nfo)

    # Fallback: try "Models" row for RAM + storage variants
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

# def scrape_new_launches() -> list[dict]:
    """Scrape GSMArena per-brand pages for recently released India phones."""
    log.info("Fetching new launches from GSMArena (per brand)…")
    all_devices = []
    seen = set()

    for brand, maker_id in GSMARENA_BRANDS.items():
        log.info(f"  Scraping {brand}…")
        url = (
            f"https://www.gsmarena.com/search.php3"
            f"?sAvailabilities=1&sMakers={maker_id}"
            f"&YearMade=2024&sSorting=1"
        )
        r = get(url)
        if not r:
            log.warning(f"    Failed to fetch {brand} — skipping")
            continue

        soup  = BeautifulSoup(r.text, "html.parser")
        items = soup.select(".makers ul li")
        count = 0

        for item in items:
            link = item.find("a")
            if not link:
                continue
            span = link.find("span")
            name = clean(span.text if span else link.text)
            href = link.get("href", "")

            # Strip brand prefix to get model name
            # "Samsung Galaxy S25 Ultra" → "Galaxy S25 Ultra"
            if name.lower().startswith(brand.lower()):
                model = name[len(brand):].strip()
            else:
                parts = name.split(" ", 1)
                model = parts[1].strip() if len(parts) > 1 else name

            if not model:
                continue

            key = f"{brand}::{model}"
            if key in seen:
                continue
            seen.add(key)

            all_devices.append({
                "brand": brand,
                "model": model,
                "url":   f"https://www.gsmarena.com/{href}",
            })
            count += 1

        log.info(f"    → {count} devices found")
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    log.info(f"Total: {len(all_devices)} unique devices across all brands")
    return all_devices
def scrape_new_launches() -> list[dict]:
    """Scrape GSMArena brand pages for recently released India phones."""
    log.info("Fetching new launches from GSMArena (per brand)…")
    all_devices = []
    seen = set()

    for brand, slug in GSMARENA_BRANDS.items():
        log.info(f"  Scraping {brand}…")
        url = f"https://www.gsmarena.com/{slug}"
        r = get(url)
        if not r:
            log.warning(f"    Failed to fetch {brand} — skipping")
            continue

        soup  = BeautifulSoup(r.text, "html.parser")

        # GSMArena brand pages: devices are <li> inside .section-body > ul
        # Each <li> has an <a> with an <img> (alt = full name) and <strong> (model only)
        items = soup.select(".section-body ul li, ul.phones-list li, #list-devices li")

        # Fallback — grab all <li> that contain an <a> with a phone slug href
        if not items:
            items = [
                li for li in soup.find_all("li")
                if li.find("a", href=re.compile(r"[\w-]+-\d+\.php"))
            ]

        count = 0
        for item in items:
            link = item.find("a", href=re.compile(r"[\w-]+-\d+\.php"))
            if not link:
                continue

            href = link.get("href", "")

            # Skip non-phone pages (watches, tablets, buds)
            skip_keywords = ["watch", "tab ", "tablet", "buds", "earphone", "band"]
            if any(k in href.lower() for k in skip_keywords):
                continue

            # Get model name from <strong> tag (most reliable)
            strong = link.find("strong")
            if strong:
                model = clean(strong.text)
            else:
                # Fall back to img alt, strip brand prefix
                img = link.find("img")
                full_name = img.get("alt", "") if img else clean(link.text)
                if full_name.lower().startswith(brand.lower()):
                    model = full_name[len(brand):].strip()
                else:
                    parts = full_name.split(" ", 1)
                    model = parts[1].strip() if len(parts) > 1 else full_name

            if not model or len(model) < 2:
                continue

            key = f"{brand}::{model}"
            if key in seen:
                continue
            seen.add(key)

            all_devices.append({
                "brand": brand,
                "model": model,
                "url":   f"https://www.gsmarena.com/{href}",
            })
            count += 1

        log.info(f"    → {count} devices found")
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    log.info(f"Total: {len(all_devices)} unique devices across all brands")
    return all_devices

# ── Main ──────────────────────────────────────────────────────────────────────
def run():
    log.info("=" * 60)
    log.info("StockFlow Catalog Updater — starting")
    log.info(f"Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 60)

    # 1. Load existing catalog from Supabase
    log.info("Loading existing catalog from Supabase…")
    existing = get_existing_catalog()
    log.info(f"  {len(existing)} models already in catalog_models_v2")

    # 2. Scrape new/recent launches from GSMArena
    launches = scrape_new_launches()

    # 3. Categorise each device
    to_insert  = []   # brand new devices
    to_patch   = []   # in DB but missing some fields
    skipped    = 0

    for device in launches:
        key = f"{device['brand']}::{device['model']}"
        existing_row = existing.get(key)

        if existing_row and is_complete(existing_row):
            skipped += 1
            continue

        if existing_row:
            missing = missing_fields(existing_row)
            log.info(f"  PATCH  {device['brand']} {device['model']} — missing: {missing}")
            to_patch.append({**device, "existing": existing_row, "missing": missing})
        else:
            log.info(f"  NEW    {device['brand']} {device['model']}")
            to_insert.append(device)

    log.info(f"\nSummary: {len(to_insert)} new | {len(to_patch)} to patch | {skipped} complete (skipped)")

    if not to_insert and not to_patch:
        log.info("Nothing to do — catalog is fully up to date ✓")
        return

    # 4. Scrape specs for new devices
    upserts = []

    log.info(f"\nScraping specs for {len(to_insert)} new devices…")
    for i, device in enumerate(to_insert, 1):
        log.info(f"  [{i}/{len(to_insert)}] {device['brand']} {device['model']}")

        # Try direct URL first, fall back to search
        url = device.get("url")
        if not url:
            url, _ = search_device(device["brand"], device["model"])
        if not url:
            log.warning(f"    Could not find GSMArena page — skipping")
            continue

        specs = scrape_specs(url)
        if not specs.get("ram") and not specs.get("storage"):
            log.warning(f"    No useful specs found — skipping")
            continue

        upserts.append({
            "brand":        device["brand"],
            "model":        device["model"],
            "ram":          specs.get("ram", []),
            "storage":      specs.get("storage", []),
            "colors":       specs.get("colors", []),
            "gsmarena_url": specs.get("gsmarena_url", url),
        })
        log.info(f"    RAM: {specs.get('ram')} | Storage: {specs.get('storage')} | Colors: {len(specs.get('colors', []))}")

    # 5. Patch incomplete devices — only update missing fields
    log.info(f"\nPatching {len(to_patch)} incomplete devices…")
    for i, device in enumerate(to_patch, 1):
        log.info(f"  [{i}/{len(to_patch)}] {device['brand']} {device['model']}")

        url = device.get("url")
        if not url:
            url, _ = search_device(device["brand"], device["model"])
        if not url:
            log.warning(f"    Could not find GSMArena page — skipping")
            continue

        specs = scrape_specs(url)
        existing_row = device["existing"]
        missing      = device["missing"]

        # Build a patch that only fills in what's missing
        patch = {
            "brand":        device["brand"],
            "model":        device["model"],
            "ram":          existing_row.get("ram")     or specs.get("ram", []),
            "storage":      existing_row.get("storage") or specs.get("storage", []),
            "colors":       existing_row.get("colors")  or specs.get("colors", []),
            "gsmarena_url": specs.get("gsmarena_url", url),
        }
        upserts.append(patch)
        log.info(f"    Patched: {missing}")

    # 6. Push everything to Supabase
    if upserts:
        log.info(f"\nPushing {len(upserts)} records to Supabase…")
        pushed, failed = upsert_devices(upserts)
        log.info(f"  ✓ Pushed: {pushed} | ✗ Failed: {failed}")
    else:
        log.info("No records to push.")

    log.info("\nDone ✓")
    log.info(f"  New devices added:      {len(to_insert)}")
    log.info(f"  Incomplete devices patched: {len(to_patch)}")
    log.info(f"  Already complete (skipped): {skipped}")

if __name__ == "__main__":
    run()