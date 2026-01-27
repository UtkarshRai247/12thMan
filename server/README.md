# 12thMan Backend API

Node.js + TypeScript backend for the 12thMan mobile app, built with Fastify, Prisma, and PostgreSQL.

## Features

- **JWT Authentication**: Secure user registration and authentication
- **Idempotent Take Sync**: Batch upsert with client-side `clientId` for offline-first support
- **Cursor Pagination**: Efficient feed pagination
- **Rate Limiting**: Abuse protection with configurable limits
- **Type Safety**: Full TypeScript with Zod validation

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
- **Take**: User takes on matches with idempotent `clientId`

See `prisma/schema.prisma` for full schema.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production/test)

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
