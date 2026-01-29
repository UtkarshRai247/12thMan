# Fixtures: curl examples and TODO

## Commands to run server + worker locally

### Terminal 1 — PostgreSQL
```bash
cd server
docker compose up -d
```

### Terminal 2 — Node server
```bash
cd server
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, optionally API_FOOTBALL_KEY, ADMIN_TOKEN
npm install
npm run migrate
npm run dev
```
Server: `http://localhost:4000`

### Terminal 3 — Python worker (optional)
```bash
cd worker
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 6001
```
Worker: `http://localhost:6001`

## curl examples

### Public fixtures (DB-first; empty until ingest)
```bash
curl "http://localhost:4000/fixtures?date=2026-01-27&limit=20"
curl http://localhost:4000/fixtures/live
curl http://localhost:4000/fixtures/FIXTURE_UUID
curl "http://localhost:4000/fixtures/FIXTURE_UUID?includeRaw=true"
```

### Admin ingest (set ADMIN_TOKEN in .env)
```bash
# Ingest fixtures for a date (requires API_FOOTBALL_KEY)
curl -X POST "http://localhost:4000/admin/ingest/fixtures?date=2026-01-27" \
  -H "x-admin-token: change-me"

# Update live fixture status/scores
curl -X POST http://localhost:4000/admin/ingest/live \
  -H "x-admin-token: change-me"

# Map a fixture to FotMob/SofaScore (manual mapping; no auto ID mapping)
curl -X POST http://localhost:4000/admin/fixtures/FIXTURE_UUID/map \
  -H "Content-Type: application/json" \
  -H "x-admin-token: change-me" \
  -d '{"provider":"FOTMOB","providerFixtureId":"12345"}'

# Enrich a fixture (FotMob/worker when enabled)
curl -X POST http://localhost:4000/admin/enrich/FIXTURE_UUID \
  -H "x-admin-token: change-me"
```

### Existing endpoints (unchanged)
```bash
curl -X POST http://localhost:4000/auth/register -H "Content-Type: application/json" -d '{"username":"u","club":"Arsenal"}'
curl http://localhost:4000/auth/me -H "Authorization: Bearer TOKEN"
curl -X POST http://localhost:4000/takes/sync -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"takes":[{"clientId":"...","fixtureId":"123","matchRating":8,"text":"Hello"}]}'
curl http://localhost:4000/feed?limit=10
```

---

## TODO list for Phase 2+3 (reactions, replies, follows)

These are **not** implemented on the backend yet. Client currently uses local-only state.

1. **Reactions (cheer/boo/shout)**
   - Add `Reaction` model or embedded counts on `Take`; endpoints to increment/fetch.
   - Ensure idempotency (user can only react once per take).

2. **Thread replies**
   - Add `parentTakeId` (or equivalent) on `Take` in server schema; support in `POST /takes/sync` and `GET /feed` (include replies or separate endpoint).

3. **Follows**
   - Add `Follow` model (followerId, followedId); endpoints to follow/unfollow and to filter feed by followed users.
   - `GET /feed?filter=following` when authenticated.

4. **Take.fixtureRefId backfill**
   - One-time job or migration: for each Take where `ProviderFixtureMap(provider=API_FOOTBALL, providerFixtureId=Take.fixtureId)` exists, set `Take.fixtureRefId = map.fixtureId`.

5. **Feed compatibility**
   - Optionally include `fixtureRefId` (nullable) in `/feed` and `/takes/:id` responses for client to link takes to canonical fixtures.
