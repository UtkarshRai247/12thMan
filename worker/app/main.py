"""
12thMan enrichment worker. Best-effort scrape/enrich via Python.
Stable HTTP contract; Node stores results in FixtureEnrichment.
"""
import os
import time
from collections import defaultdict

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="12thMan Worker", version="1.0.0")

# In-memory rate limiter: max requests per minute per endpoint
RATE_LIMIT_PER_MINUTE = int(os.environ.get("WORKER_REQUESTS_PER_MINUTE", "30"))
_request_times: dict[str, list[float]] = defaultdict(list)


def _rate_limit_key(endpoint: str) -> str:
    return endpoint


def _check_rate_limit(key: str) -> bool:
    now = time.time()
    window_start = now - 60
    _request_times[key] = [t for t in _request_times[key] if t > window_start]
    if len(_request_times[key]) >= RATE_LIMIT_PER_MINUTE:
        return False
    _request_times[key].append(now)
    return True


# In-memory TTL cache (key -> (value, expires_at))
_cache: dict[str, tuple[dict, float]] = {}
CACHE_TTL_SECONDS = 3600  # 1h default for stub


def _cache_get(key: str) -> dict | None:
    if key not in _cache:
        return None
    val, expires = _cache[key]
    if time.time() > expires:
        del _cache[key]
        return None
    return val


def _cache_set(key: str, value: dict, ttl_seconds: int = CACHE_TTL_SECONDS) -> None:
    _cache[key] = (value, time.time() + ttl_seconds)


def _stub_response(provider: str, kind: str, match_id: str) -> dict:
    return {
        "provider": provider,
        "kind": kind,
        "raw": {"_stub": True, "matchId": match_id},
        "normalizedSummary": {
            "lastUpdatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
        "ttlSeconds": 86400,
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/enrich/fotmob/{fotmob_match_id}")
def enrich_fotmob(fotmob_match_id: str):
    key = f"fotmob:{fotmob_match_id}"
    if not _check_rate_limit(key):
        return JSONResponse(
            status_code=429,
            content={"error": "rate_limit_exceeded"},
        )
    cached = _cache_get(key)
    if cached is not None:
        return cached
    # TODO: integrate real FotMob scraper/wrapper (e.g. requests + parse)
    resp = _stub_response("FOTMOB", "MATCH_DETAILS", fotmob_match_id)
    _cache_set(key, resp)
    return resp


@app.get("/enrich/sofascore/{sofascore_match_id}")
def enrich_sofascore(sofascore_match_id: str):
    key = f"sofascore:{sofascore_match_id}"
    if not _check_rate_limit(key):
        return JSONResponse(
            status_code=429,
            content={"error": "rate_limit_exceeded"},
        )
    cached = _cache_get(key)
    if cached is not None:
        return cached
    # TODO: integrate SofaScore scraper/wrapper
    resp = _stub_response("SOFASCORE", "STATS", sofascore_match_id)
    _cache_set(key, resp)
    return resp
