# 12thMan Backend API

Node.js + TypeScript backend for the 12thMan mobile app, built with Fastify, Prisma, and PostgreSQL.

## Features

- **JWT Authentication**: Secure user registration and authentication
- **Idempotent Take Sync**: Batch upsert with client-side `clientId` for offline-first support
- **Cursor Pagination**: Efficient feed pagination
- **Rate Limiting**: Abuse protection with configurable limits
- **Type Safety**: Full TypeScript with Zod validation
- **Provider-agnostic fixtures**: Canonical Fixture model; API-Football ingestion; optional FotMob/worker enrichment (kill-switchable)

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (for local Postgres)
- npm or yarn

## Quick Start

1. **Set up environment variables:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env if needed (defaults should work for local dev)
   ```

2. **Start PostgreSQL:**
   ```bash
   docker compose up -d
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:4000`

### Optional: Run the enrichment worker (Python)

For best-effort FotMob/SofaScore enrichment (when `ENABLE_WORKER=true`):

```bash
cd worker
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 6001
```

See `worker/README.md` for details.

### Ingest fixtures (admin)

After server and DB are running, set `API_FOOTBALL_KEY` and `ADMIN_TOKEN` in `.env`, then:

```bash
# Ingest fixtures for a date (canonical source: API-Football)
curl -X POST "http://localhost:4000/admin/ingest/fixtures?date=2026-01-27" \
  -H "x-admin-token: change-me"

# Ingest live fixtures (update status + score)
curl -X POST http://localhost:4000/admin/ingest/live \
  -H "x-admin-token: change-me"

# Enrich a fixture (FotMob/worker when enabled)
curl -X POST http://localhost:4000/admin/enrich/FIXTURE_UUID \
  -H "x-admin-token: change-me"
```

**Warnings:** Unofficial sources (FotMob, SofaScore via worker) are best-effort and guarded by flags. When `ENABLE_FOTMOB=false` and `ENABLE_WORKER=false`, core endpoints still work. Never use provider IDs as primary keys; internal IDs are UUIDs.

## API Endpoints

### Authentication

#### `POST /auth/register`
Register a new user.

**Request:**
```json
{
  "username": "fan123",
  "club": "Manchester United"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "fan123",
    "club": "Manchester United"
  },
  "token": "jwt_token"
}
```

#### `GET /auth/me`
Get current user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "fan123",
    "club": "Manchester United",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Takes

#### `POST /takes/sync`
Sync takes from client (idempotent batch upsert). Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "takes": [
    {
      "clientId": "uuid",
      "fixtureId": "123",
      "matchRating": 8,
      "motmPlayerId": "456",
      "text": "Great match!",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Constraints:**
- Max 10 takes per request
- `matchRating`: 1-10
- `text`: 5-280 characters
- Rate limit: 60 requests/minute per user

**Response:**
```json
{
  "results": [
    {
      "clientId": "uuid",
      "providerId": "server_uuid",
      "status": "posted",
      "syncedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /takes/:id`
Get a take by ID.

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "username": "fan123",
  "club": "Manchester United",
  "fixtureId": "123",
  "matchRating": 8,
  "motmPlayerId": "456",
  "text": "Great match!",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "syncedAt": "2024-01-01T00:00:00.000Z"
}
```

### Feed

#### `GET /feed`
Get paginated feed of takes.

**Query Parameters:**
- `fixtureId` (optional): Filter by fixture
- `limit` (optional, default: 20, max: 50): Number of items per page
- `cursor` (optional): Pagination cursor from previous response

**Response:**
```json
{
  "items": [
    {
      "providerId": "uuid",
      "userId": "uuid",
      "username": "fan123",
      "club": "Manchester United",
      "fixtureId": "123",
      "matchRating": 8,
      "motmPlayerId": "456",
      "text": "Great match!",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "syncedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "nextCursor": "base64_encoded_cursor" | null
}
```

### Fixtures (public, DB-first)

#### `GET /fixtures?date=YYYY-MM-DD&limit=100`
Returns fixtures from DB for that date. Optional `date`; default limit 50, max 100.

**Response:** `{ items: [{ id, kickoffAt, status, teams, score, competition, enrichmentSummary? }] }`

#### `GET /fixtures/live`
Returns fixtures where `status=LIVE`.

#### `GET /fixtures/:id?includeRaw=false`
Returns one fixture. Include raw enrichment payloads when `includeRaw=true`.

### Admin (header `x-admin-token` required)

- `POST /admin/fixtures/:id/map` — Body: `{ provider: "FOTMOB"|"SOFASCORE", providerFixtureId }`. Upsert provider mapping.
- `POST /admin/ingest/fixtures?date=YYYY-MM-DD` — Run ingest from API-Football for that date.
- `POST /admin/ingest/live` — Update live fixture status/scores.
- `POST /admin/enrich/:fixtureId` — Run enrichment (FotMob/worker when enabled).

## Testing with curl

### Register a user:
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","club":"Arsenal"}'
```

### Get current user:
```bash
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Sync takes:
```bash
curl -X POST http://localhost:4000/takes/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "takes": [{
      "clientId": "550e8400-e29b-41d4-a716-446655440000",
      "fixtureId": "123",
      "matchRating": 8,
      "text": "What a match!"
    }]
  }'
```

### Get feed:
```bash
curl http://localhost:4000/feed?limit=10
```

### Fixtures (after ingest):
```bash
curl "http://localhost:4000/fixtures?date=2026-01-27&limit=20"
curl http://localhost:4000/fixtures/live
curl http://localhost:4000/fixtures/FIXTURE_UUID
```

### Admin ingest (set ADMIN_TOKEN in .env):
```bash
curl -X POST "http://localhost:4000/admin/ingest/fixtures?date=2026-01-27" -H "x-admin-token: change-me"
curl -X POST http://localhost:4000/admin/ingest/live -H "x-admin-token: change-me"
curl -X POST http://localhost:4000/admin/enrich/FIXTURE_UUID -H "x-admin-token: change-me"
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run studio` - Open Prisma Studio
- `npm run generate` - Generate Prisma client

## Database

The database schema is managed with Prisma. Key models:

- **User**: User accounts with username and club
- **Take**: User takes on matches with idempotent `clientId`; optional `fixtureRefId` (FK to Fixture)
- **Fixture**: Canonical match record (UUID id, status, kickoffAt, teams, score, competition, season)
- **ProviderFixtureMap**: Maps provider (API_FOOTBALL, FOTMOB, SOFASCORE) + providerFixtureId to Fixture.id
- **FixtureEnrichment**: Enrichment payloads (provider, kind, payload JSON, ttlSeconds)

See `prisma/schema.prisma` for full schema.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production/test)
- `API_FOOTBALL_KEY` - Optional; required for admin ingest (fixtures/live)
- `ADMIN_TOKEN` - Optional; required for admin routes (ingest, map, enrich)
- `ENABLE_FOTMOB` - Optional; set to `true` to enable FotMob enrichment (rate limit, cache, circuit breaker)
- `FOTMOB_REQUESTS_PER_MINUTE`, `FOTMOB_TTL_LIVE_SECONDS`, `FOTMOB_TTL_FINISHED_SECONDS` - FotMob tuning
- `ENABLE_WORKER` - Optional; set to `true` to call Python worker for SofaScore/FotMob
- `WORKER_BASE_URL` - Worker base URL (default: http://localhost:6001)
- `WORKER_REQUESTS_PER_MINUTE` - Worker rate limit (default: 30)

## Error Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Missing or invalid token
- `USERNAME_EXISTS` - Username already taken
- `TAKE_NOT_FOUND` - Take not found or not visible
- `RATE_LIMIT_EXCEEDED` - Too many requests
