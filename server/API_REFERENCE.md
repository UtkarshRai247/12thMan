# API Reference

## Overview

This backend is **self-contained** - it does NOT use any external APIs. All data is stored in your PostgreSQL database.

## Authentication

The backend uses **JWT (JSON Web Tokens)** for authentication. Tokens are generated when users register and must be included in protected endpoints.

### Token Format
- **Header**: `Authorization: Bearer <token>`
- Token is returned from `POST /auth/register`
- Token contains user ID in the `sub` claim

---

## API Endpoints

### 🔓 Public Endpoints (No Token Required)

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `GET /feed`
Get paginated feed of takes (public feed).

**Query Parameters:**
- `fixtureId` (optional): Filter by fixture ID
- `limit` (optional, default: 20, max: 50): Items per page
- `cursor` (optional): Pagination cursor

**Example:**
```bash
GET /feed?limit=20&fixtureId=123
```

**Response:**
```json
{
  "items": [...],
  "nextCursor": "base64_cursor" | null
}
```

#### `GET /takes/:id`
Get a single take by ID.

**Example:**
```bash
GET /takes/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "username": "fan123",
  "club": "Arsenal",
  "fixtureId": "123",
  "matchRating": 8,
  "motmPlayerId": "456",
  "text": "Great match!",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "syncedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 🔒 Protected Endpoints (JWT Token Required)

#### `POST /auth/register`
Register a new user. **Returns a JWT token.**

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
  "token": "jwt_token_here"
}
```

**Note:** Save this token! Use it for all protected endpoints.

#### `GET /auth/me`
Get current authenticated user.

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

#### `POST /takes/sync`
Sync takes from mobile app (idempotent batch upsert).

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

---

## Summary Table

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/health` | GET | ❌ No | Health check |
| `/feed` | GET | ❌ No | Public feed |
| `/takes/:id` | GET | ❌ No | Get single take |
| `/auth/register` | POST | ❌ No | Register user (returns token) |
| `/auth/me` | GET | ✅ Yes | Get current user |
| `/takes/sync` | POST | ✅ Yes | Sync takes from mobile |

---

## Rate Limits

- **Global**: 300 requests/minute per IP
- **POST /takes/sync**: 60 requests/minute per user
- **POST /auth/register**: Covered by global limit (300/min)

---

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
