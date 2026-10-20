#!/usr/bin/env python3
"""Rebuild last price, range, and years after the Toronto close.

Book value and market cap stay as stored. A failed or absurd chart keeps the
previous row. The file is left untouched when too many charts fail.
"""

import json
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent
LISTINGS = ROOT / "listings.json"
ASOF = ROOT / "asof.json"
SUFFIX = {0: ".TO", 1: ".V", 2: ".CN", 3: ".NE"}
WORKERS = 12
YEAR = 365.25 * 24 * 3600
FAIL_FRACTION = 0.2


def yahoo_symbol(sym, exch):
    return sym.replace(".", "-") + SUFFIX[exch]


def fetch_chart(ysym):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ysym}?range=max&interval=1mo"
    last = "empty"
    for _ in range(2):
        proc = subprocess.run(
            ["curl", "-sS", "-m", "25", "-A", "Mozilla/5.0", url],
            capture_output=True,
            check=False,
        )
        if proc.returncode == 0 and proc.stdout:
            return json.loads(proc.stdout)
        last = (proc.stderr or proc.stdout or b"empty").decode()[:180]
        time.sleep(0.4)
    raise RuntimeError(last)


def sane(price, lo, hi):
    if price <= 0 or lo <= 0 or hi <= 0:
        return False
    if hi > 100000 or hi / lo > 20000:
        return False
    return True


def parse_chart(payload, now):
    chart = payload.get("chart") or {}
    result = (chart.get("result") or [None])[0]
    if not result:
        return None
    meta = result.get("meta") or {}
    price = meta.get("regularMarketPrice")
    if not isinstance(price, (int, float)) or price <= 0:
        return None
    quote = ((result.get("indicators") or {}).get("quote") or [{}])[0]
    highs = [v for v in (quote.get("high") or []) if isinstance(v, (int, float)) and v > 0]
    lows = [v for v in (quote.get("low") or []) if isinstance(v, (int, float)) and v > 0]
    if not highs or not lows:
        return None
    hi = max(max(highs), price)
    lo = min(min(lows), price)
    if hi <= lo:
        lo = hi * 0.99
    if not sane(price, lo, hi):
        return None
    stamps = [t for t in (result.get("timestamp") or []) if isinstance(t, (int, float)) and t > 0]
    first = min(stamps) if stamps else None
    listed = meta.get("firstTradeDate")
    if isinstance(listed, (int, float)) and listed > 0 and (first is None or listed < first):
        first = listed
    if not first:
        return None
    currency = meta.get("currency")
    if currency not in ("CAD", "USD"):
        currency = None
    kind = 1 if meta.get("instrumentType") in ("ETF", "MUTUALFUND") else 0
    return {
        "p": round(float(price), 4),
        "lo": round(float(lo), 4),
        "hi": round(float(hi), 4),
        "y": round(max(0.0, (now - first) / YEAR), 2),
        "k": kind,
        "usd": 1 if currency == "USD" else 0 if currency == "CAD" else None,
    }


def pull(row, now):
    exch = row.get("x")
    if exch not in SUFFIX:
        return row["s"], None, "unknown exchange"
    ysym = yahoo_symbol(row["s"], exch)
    try:
        parsed = parse_chart(fetch_chart(ysym), now)
    except Exception as exc:
        return row["s"], None, f"{ysym} {type(exc).__name__}: {exc}"
    if not parsed:
        return row["s"], None, f"{ysym} empty"
    return row["s"], parsed, ""


def main():
    rows = json.loads(LISTINGS.read_text())
    now = time.time()
    fresh = {}
    failed = 0
    shown = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(pull, row, now) for row in rows]
        done = 0
        for future in as_completed(futures):
            sym, parsed, err = future.result()
            done += 1
            if parsed:
                fresh[sym] = parsed
            else:
                failed += 1
                if shown < 5:
                    print("fail", sym, err, flush=True)
                    shown += 1
            if done % 500 == 0:
                print(f"done {done}/{len(rows)} updated {len(fresh)} failed {failed}", flush=True)

    if failed / len(rows) >= FAIL_FRACTION:
        raise SystemExit(f"kept the previous file: {failed} of {len(rows)} charts failed")

    changed = 0
    for row in rows:
        parsed = fresh.get(row["s"])
        if not parsed:
            continue
        usd = row.get("usd", 0) if parsed["usd"] is None else parsed["usd"]
        nxt = (parsed["p"], parsed["lo"], parsed["hi"], parsed["y"], parsed["k"], usd)
        cur = (row.get("p"), row.get("lo"), row.get("hi"), row.get("y"), row.get("k"), row.get("usd", 0))
        if nxt == cur:
            continue
        row["p"], row["lo"], row["hi"], row["y"], row["k"], row["usd"] = nxt
        changed += 1

    asof = datetime.now(ZoneInfo("America/Toronto")).date().isoformat()
    ASOF.write_text(json.dumps({"asof": asof}) + "\n")
    if changed == 0:
        print(f"no price changes, asof {asof}, failed {failed}", flush=True)
        return
    LISTINGS.write_text(json.dumps(rows, separators=(",", ":")) + "\n")
    print(f"updated {changed} of {len(rows)}, failed {failed}, asof {asof}", flush=True)


if __name__ == "__main__":
    main()
