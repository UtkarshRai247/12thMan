# Phase 0 — Audit and Implementation Plan

## Audit Summary

### Current Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check |
| GET | / | No | API info (endpoints list) |
| POST | /auth/register | No | Register user, returns JWT |
| GET | /auth/me | JWT | Current user |
| POST | /takes/sync | JWT | Idempotent batch upsert (max 10, 60/min per user) |
| GET | /takes/:id | No | Single take by ID |
| GET | /feed | No | Paginated feed (fixtureId?, limit, cursor) |

### Current Schema (Prisma)

- **User**: id (uuid), username (unique), club, createdAt. Relation: takes.
- **Take**: id, userId, clientId, fixtureId (string, provider ID), matchRating, motmPlayerId?, text, moderationStatus (POSTED|HIDDEN|REMOVED), createdAt, syncedAt. Unique (userId, clientId). Indexes: (fixtureId, createdAt, id), (userId, createdAt, id).

### Plugins

- **auth**: @fastify/jwt, secret from env.JWT_SECRET. `fastify.authenticate()` sets request.userId from JWT `sub`.
- **prisma**: PrismaClient, decorated as fastify.prisma. Logs queries in debug. onClose disconnects.
- **rateLimit**: @fastify/rate-limit, global 300 req/min per IP. Takes sync uses custom in-memory 60/min per userId.

### Env (server/src/env.ts)

- Required: DATABASE_URL, JWT_SECRET.
- Optional: PORT (default 4000), NODE_ENV (default development).
- **Missing for fixtures**: API_FOOTBALL_KEY, ENABLE_FOTMOB, FOTMOB_*, ENABLE_WORKER, WORKER_BASE_URL, ADMIN_TOKEN.

### Missing vs Doc (docs/APP_FUNCTIONALITY_PROMPT_FOR_CHATGPT.md)

- No fixture/filter endpoints: /fixtures, /fixtures/live, /fixtures/:id.
- No canonical Fixture model; Take.fixtureId is provider ID string.
- No reactions, replies, follows (explicitly out of scope for this pass).
- No provider-agnostic ingestion or enrichment.

### How Server Is Started / Where Env Lives

- **Start**: From repo root, `cd server && npm run dev` (tsx watch src/index.ts). Listens on PORT (default 4000), host 0.0.0.0.
- **Env**: `server/.env` (gitignored). Copy from `server/.env.example`. Env loaded via dotenv in env.ts before schema parse.

---

## Implementation Plan and File List

### Phase 1 — Database

**Files to create/change:**

- `server/prisma/schema.prisma` — Add Fixture, ProviderFixtureMap, FixtureEnrichment; add Take.fixtureRefId; add enums/constraints.
- `server/prisma/migrations/YYYYMMDD_fixtures/` — New migration.
- Optional: one-time backfill script or migration step for Take.fixtureRefId when ProviderFixtureMap(API_FOOTBALL) exists (can be a follow-up job; Phase 1 only adds column + migration).

### Phase 2 — Providers (Node)

**New directory:** `server/src/providers/`

- `server/src/providers/types.ts` — Provider union, NormalizedFixture, NormalizedEnrichmentSummary.
- `server/src/providers/http.ts` — fetchJson (timeout, retry, user-agent), duration logging.
- `server/src/providers/cache.ts` — In-memory TTL cache interface (get/set); swappable for Redis later.
- `server/src/providers/apiFootballClient.ts` — getFixturesByDate, getLiveFixtures, getFixtureDetails; API_FOOTBALL_KEY; throw if missing when called.
- `server/src/providers/fotmobWrapperClient.ts` — Wrapper adapter; rate limit, cache (LIVE 60s, FINISHED 24h), circuit breaker; behind ENABLE_FOTMOB.
- `server/src/providers/workerClient.ts` — Call worker when ENABLE_WORKER; timeout; fail silently (log only).

### Phase 3 — Jobs

**New directory:** `server/src/jobs/`

- `server/src/jobs/fixtures.ts` — ingestFixturesForDate(dateISO), ingestLiveFixtures(), enrichFixture(fixtureId). DB-first; call API-Football then FotMob/worker when enabled.

### Phase 4 — API Endpoints

**New/change files:**

- `server/src/routes/fixtures.ts` — GET /fixtures, GET /fixtures/live, GET /fixtures/:id (public).
- `server/src/routes/admin.ts` — x-admin-token; POST /admin/fixtures/:id/map, POST /admin/ingest/fixtures, POST /admin/ingest/live, POST /admin/enrich/:fixtureId.
- `server/src/index.ts` — Register fixture routes (no prefix), admin routes (prefix /admin or under single admin plugin with prefix).
- **Compatibility:** /feed and /takes responses may add nullable fixtureRefId; no removals.

### Phase 5 — Python Worker

**New directory:** `worker/`

- `worker/requirements.txt` — fastapi, uvicorn.
- `worker/app/main.py` — FastAPI app; GET /health; GET /enrich/fotmob/{id}, GET /enrich/sofascore/{id} (stub payloads + TODO).
- `worker/app/rate_limit.py` or inline — In-memory rate limiter.
- `worker/app/cache.py` or inline — TTL dict cache.
- `worker/README.md` — venv, pip install, uvicorn --port 6001.

### Phase 6 — Documentation and Env

- `server/README.md` — Add: local DB, migrate, ingest triggers, worker, flags warning.
- `server/.env.example` — Add API_FOOTBALL_KEY, ENABLE_FOTMOB, FOTMOB_*, ENABLE_WORKER, WORKER_BASE_URL, ADMIN_TOKEN.
- `server/src/env.ts` — Extend schema for new vars (optional where applicable).
- `design-system/api-contracts.md` or `server/docs/` — Fixture and Enrichment response contracts.

---

## Implementation Order (This Pass)

1. **Phase 0** — This audit + plan.
2. **Phase 1** — Schema + migration + Take.fixtureRefId (nullable); no backfill in migration (optional script later).
3. **Phase 2 (partial)** — API-Football client + cache + http helpers; then GET /fixtures, /fixtures/live, /fixtures/:id (DB-first, no ingestion yet).
4. **Phase 4** — Admin ingest triggers (ingestFixturesForDate, ingestLiveFixtures, enrichFixture) so we can test.
5. **Phase 2 (FotMob)** — FotMob wrapper client + enrichment storage in jobs.
6. **Phase 5** — Worker scaffold + workerClient in Node (stubs if needed).
7. **Phase 6** — README, .env.example, curl examples, TODO list for reactions/replies/follows.
