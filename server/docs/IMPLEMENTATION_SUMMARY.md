# Provider-Agnostic Fixtures — Implementation Summary

This document summarizes the backend implementation for provider-agnostic match data ingestion and enrichment (API-Football canonical, optional FotMob/worker enrichment).

## Architecture

- **Node backend** is canonical and stable. All fixture data is stored in PostgreSQL (Fixture, ProviderFixtureMap, FixtureEnrichment).
- **Client never calls providers directly.** All data is served DB-first via `/fixtures`, `/fixtures/live`, `/fixtures/:id`.
- **Internal IDs are UUIDs.** Provider IDs (e.g. API-Football fixture id) are never primary keys; they live in `ProviderFixtureMap`.
- **Unofficial sources (FotMob, SofaScore via worker)** are kill-switchable (`ENABLE_FOTMOB`, `ENABLE_WORKER`). When disabled, core endpoints continue to work.

## Database (Prisma)

| Model | Purpose |
|-------|---------|
| **Fixture** | Canonical match record: id (uuid), status, kickoffAt, competition, season, homeTeamName, awayTeamName, homeScore, awayScore. Indexes: kickoffAt, (status, kickoffAt). |
| **ProviderFixtureMap** | Maps (provider + providerFixtureId) ↔ Fixture.id. Providers: API_FOOTBALL, FOTMOB, SOFASCORE. Unique on (provider, providerFixtureId) and (fixtureId, provider). |
| **FixtureEnrichment** | Enrichment payloads: fixtureId, provider (FOTMOB/SOFASCORE), kind (MATCH_DETAILS, STATS, etc.), payload (JSON), fetchedAt, ttlSeconds. Unique on (fixtureId, provider, kind). |
| **Take** | Optional **fixtureRefId** (FK to Fixture.id) added; **fixtureId** retained as legacy provider id. Feed and GET /takes/:id include nullable **fixtureRefId** in response. |

Migration: `prisma/migrations/20260127120000_fixtures_enrichment/migration.sql`. Apply with `npm run migrate` when DB is running.

## Providers (server/src/providers)

| File | Purpose |
|------|---------|
| **types.ts** | ProviderType, NormalizedFixture, NormalizedEnrichmentSummary. |
| **http.ts** | fetchJson with timeout (8s), retries (2), user-agent; measureDuration for logging. |
| **cache.ts** | In-memory TTL cache (get/set); swappable for Redis later. |
| **apiFootballClient.ts** | Canonical source: getFixturesByDate(dateISO), getLiveFixtures(), getFixtureDetails(providerFixtureId). Throws if API_FOOTBALL_KEY missing when called. |
| **fotmobWrapperClient.ts** | Wrapper around @max-xoo/fotmob: getMatchDetails, getLineups, getStats, getShotmap. Rate limit (FOTMOB_REQUESTS_PER_MINUTE), TTL cache (LIVE 60s, FINISHED 24h), circuit breaker (10 min after 5 errors). Behind ENABLE_FOTMOB. |
| **workerClient.ts** | Calls Python worker when ENABLE_WORKER: workerEnrichFotmob, workerEnrichSofascore, workerHealth. Timeout 8s; fails silently (log only). |

## Jobs (server/src/jobs/fixtures.ts)

- **ingestFixturesForDate(prisma, dateISO)** — Fetches from API-Football, normalizes, upserts Fixture + ProviderFixtureMap(API_FOOTBALL).
- **ingestLiveFixtures(prisma)** — Fetches live fixtures from API-Football, updates Fixture status and score for existing mapped fixtures.
- **enrichFixture(prisma, fixtureId)** — DB-first: reads Fixture and provider maps. If ENABLE_FOTMOB and FOTMOB map exists, fetches match details and stores FixtureEnrichment(MATCH_DETAILS). If ENABLE_WORKER and SOFASCORE map exists, calls worker and stores FixtureEnrichment. Never auto-maps provider IDs.

## API Endpoints

### Public (no auth)

- **GET /fixtures?date=YYYY-MM-DD&limit=100** — Fixtures from DB for that date; optional enrichmentSummary.
- **GET /fixtures/live** — Fixtures where status=LIVE.
- **GET /fixtures/:id?includeRaw=false** — One fixture; optional raw enrichment when includeRaw=true.

### Admin (header x-admin-token required)

- **POST /admin/fixtures/:id/map** — Body: `{ provider: "FOTMOB"|"SOFASCORE", providerFixtureId }`. Upsert ProviderFixtureMap.
- **POST /admin/ingest/fixtures?date=YYYY-MM-DD** — Run ingest from API-Football.
- **POST /admin/ingest/live** — Update live fixture status/scores.
- **POST /admin/enrich/:fixtureId** — Run enrichment (FotMob/worker when enabled).

### Compatibility

- **POST /takes/sync**, **GET /takes/:id**, **GET /feed** unchanged in contract; responses now include optional **fixtureRefId** (nullable).

## Python Worker (worker/)

- **FastAPI** app: GET /health, GET /enrich/fotmob/{id}, GET /enrich/sofascore/{id}.
- Stub responses only (TODO: real FotMob/SofaScore scrapers). Stable HTTP contract; Node stores results in FixtureEnrichment.
- Run: `cd worker && python -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/uvicorn app.main:app --port 6001`.

## Env (server/.env.example)

- **API_FOOTBALL_KEY** — Required for admin ingest.
- **ADMIN_TOKEN** — Required for admin routes.
- **ENABLE_FOTMOB**, **FOTMOB_REQUESTS_PER_MINUTE**, **FOTMOB_TTL_LIVE_SECONDS**, **FOTMOB_TTL_FINISHED_SECONDS** — FotMob tuning.
- **ENABLE_WORKER**, **WORKER_BASE_URL**, **WORKER_REQUESTS_PER_MINUTE** — Worker integration.

## Docs Updated

- **server/README.md** — Fixtures, admin, worker run, ingest triggers, env vars, warnings.
- **server/docs/PHASE0_AUDIT_AND_PLAN.md** — Audit summary and implementation plan.
- **server/docs/FIXTURES_CURL_AND_TODO.md** — curl examples, TODO for reactions/replies/follows and fixtureRefId backfill.
- **design-system/api-contracts.md** — Backend Fixture API and Enrichment response contracts.

## TODO (not in this push)

- Reactions (cheer/boo/shout) on backend.
- Thread replies (parentTakeId) on backend.
- Follows (Follow model, feed filter) on backend.
- One-time Take.fixtureRefId backfill when ProviderFixtureMap(API_FOOTBALL) exists.
