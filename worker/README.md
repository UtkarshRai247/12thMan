# 12thMan Enrichment Worker

Optional Python microservice for best-effort fixture enrichment (FotMob, SofaScore). Node calls the worker when `ENABLE_WORKER=true`; results are stored in the DB and served DB-first. The worker is **kill-switchable** and must never break core Node endpoints.

## Requirements

- Python 3.10+
- pip

## Setup

```bash
cd worker
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 6001
```

Or from project root:

```bash
cd worker && .venv/bin/uvicorn app.main:app --port 6001
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Returns `{ "ok": true }` |
| GET | /enrich/fotmob/{fotmobMatchId} | Returns stub enrichment (TODO: real FotMob) |
| GET | /enrich/sofascore/{sofascoreMatchId} | Returns stub enrichment (TODO: SofaScore) |

Response shape (for Node to store in `FixtureEnrichment`):

```json
{
  "provider": "FOTMOB",
  "kind": "MATCH_DETAILS",
  "raw": { ... },
  "normalizedSummary": { "lastUpdatedAt": "..." },
  "ttlSeconds": 86400
}
```

## Env (optional)

- `WORKER_REQUESTS_PER_MINUTE` — per-endpoint rate limit (default 30).

## Notes

- Stub responses only until scraper libs are integrated.
- In-memory rate limit and cache; for production consider Redis.
- Node uses `WORKER_BASE_URL` (e.g. `http://localhost:6001`) and fails silently if worker is down.
