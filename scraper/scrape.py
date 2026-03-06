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
DELAY_MIN   = 4.0
DELAY_MAX   = 8.0
MAX_RETRIES = 5

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
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
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
            r = session.get(url, timeout=20)

            if r.status_code == 429:
                wait = 500 * (attempt + 1)
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

def scrape_new_launches() -> list[dict]:
    log.info("Fetching device list from GSMArena (per brand)...")
    all_devices = []
    seen = set()

    for brand, slug in GSMARENA_BRANDS.items():
        log.info(f"  Scraping {brand}...")
        url = f"https://www.gsmarena.com/{slug}"
        r = get(url)
        if not r:
            log.warning(f"    Failed to fetch {brand} — skipping")
            continue

        soup  = BeautifulSoup(r.text, "html.parser")
        items = soup.select(".section-body ul li, ul.phones-list li, #list-devices li")

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

            skip_href = [
                "watch", "tab_", "tablet", "buds", "earphone", "band",
                "pad_", "_pad", "router", "gravity", "smart_tv", "tv_",
                "hub_", "_hub", "speaker", "display", "monitor",
            ]
            if any(k in href.lower() for k in skip_href):
                continue

            device_id_match = re.search(r"-(\d+)\.php$", href)
            if not device_id_match:
                continue
            device_id = int(device_id_match.group(1))
            if device_id < 5000:
                continue

            strong = link.find("strong")
            if strong:
                model = clean(strong.text)
            else:
                img       = link.find("img")
                full_name = img.get("alt", "") if img else clean(link.text)
                if full_name.lower().startswith(brand.lower()):
                    model = full_name[len(brand):].strip()
                else:
                    parts = full_name.split(" ", 1)
                    model = parts[1].strip() if len(parts) > 1 else full_name

            if not model or len(model) < 2:
                continue

            model_lower = model.lower()
            skip_model = [
                "tab ", "tablet", "watch", "band", "buds", "earphone",
                "pad", "router", "gravity", "tv", "speaker", "hub",
                "display", "monitor", "charger", "cable",
            ]
            if any(k in model_lower for k in skip_model):
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

        log.info(f"    -> {count} devices found")
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    log.info(f"Total: {len(all_devices)} unique devices across all brands")
    return all_devices

# ── Main ──────────────────────────────────────────────────────────────────────
def run():
    log.info("=" * 60)
    log.info("StockFlow Catalog Updater — starting")
    log.info(f"Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 60)

    log.info("Loading existing catalog from Supabase...")
    existing = get_existing_catalog()
    log.info(f"  {len(existing)} models in catalog_models_v2")

    launches = scrape_new_launches()

    upserts       = []
    skipped       = 0
    new_count     = 0
    patched_count = 0
    india_skipped = 0
    total         = len(launches)

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
                log.warning(f"    No specs found — skipping")
                continue

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
                log.warning(f"    No specs found — skipping")
                continue

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

    log.info(f"\n{'=' * 60}")
    log.info(f"Summary:")
    log.info(f"  New devices added:     {new_count}")
    log.info(f"  Patched:               {patched_count}")
    log.info(f"  Already complete:      {skipped}")
    log.info(f"  Filtered (not India):  {india_skipped}")
    log.info(f"  Total to push:         {len(upserts)}")

    if upserts:
        log.info(f"\nPushing to Supabase...")
        pushed, failed = upsert_devices(upserts)
        log.info(f"  Pushed: {pushed} | Failed: {failed}")
    else:
        log.info("\nNothing to push — catalog is fully up to date")

    log.info("\nDone")

if __name__ == "__main__":
    run()
