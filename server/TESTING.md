# Testing the 12thMan API

## Quick Start

Make sure your server is running:
```bash
cd server
npm run dev
```

You should see: `🚀 Server listening on http://localhost:4000`

---

## Method 1: Using curl (Terminal)

### 1. Health Check
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-27T..."}
```

### 2. Register a User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","club":"Arsenal"}'
```

Expected response:
```json
{
  "user": {
    "id": "uuid-here",
    "username": "testuser",
    "club": "Arsenal"
  },
  "token": "jwt-token-here"
}
```

**Save the token!** You'll need it for authenticated endpoints.

### 3. Get Current User (requires token)
```bash
# Replace YOUR_TOKEN with the token from step 2
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Feed (public)
```bash
curl http://localhost:4000/feed
```

### 5. Sync Takes (requires token)
```bash
curl -X POST http://localhost:4000/takes/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "takes": [{
      "clientId": "550e8400-e29b-41d4-a716-446655440000",
      "fixtureId": "123",
      "matchRating": 8,
      "text": "What a match! Great performance from the team."
    }]
  }'
```

### 6. Get Feed with Pagination
```bash
# First page
curl http://localhost:4000/feed?limit=10

# Next page (use cursor from previous response)
curl "http://localhost:4000/feed?limit=10&cursor=YOUR_CURSOR_HERE"
```

---

## Method 2: Using Browser

### GET Requests Only

1. **Health Check:**
   - Visit: `http://localhost:4000/health`

2. **API Info:**
   - Visit: `http://localhost:4000/`

3. **Feed:**
   - Visit: `http://localhost:4000/feed`

4. **Feed with Filter:**
   - Visit: `http://localhost:4000/feed?fixtureId=123&limit=20`

**Note:** Browser can only test GET requests. For POST requests, use curl, Postman, or the test script below.

---

## Method 3: Using Postman / Insomnia

### Setup

1. **Import Collection** (or create manually):

   **Base URL:** `http://localhost:4000`

   **Endpoints:**
   - `GET /health`
   - `GET /`
   - `POST /auth/register`
   - `GET /auth/me`
   - `GET /feed`
   - `POST /takes/sync`
   - `GET /takes/:id`

2. **For Authenticated Requests:**
   - Go to **Authorization** tab
   - Select **Bearer Token**
   - Paste your JWT token from registration

### Example: Register → Get Token → Use Token

1. **Register:**
   - Method: `POST`
   - URL: `http://localhost:4000/auth/register`
   - Body (JSON):
     ```json
     {
       "username": "testuser",
       "club": "Arsenal"
     }
     ```
   - Copy the `token` from response

2. **Get Current User:**
   - Method: `GET`
   - URL: `http://localhost:4000/auth/me`
   - Authorization: Bearer Token (paste token from step 1)

3. **Sync Takes:**
   - Method: `POST`
   - URL: `http://localhost:4000/takes/sync`
   - Authorization: Bearer Token
   - Body (JSON):
     ```json
     {
       "takes": [{
         "clientId": "550e8400-e29b-41d4-a716-446655440000",
         "fixtureId": "123",
         "matchRating": 8,
         "text": "Great match!"
       }]
     }
     ```

---

## Method 4: Test Script (Node.js)

Create a test script to automate testing:

```bash
# Create test file
cat > server/test-api.js << 'EOF'
const BASE_URL = 'http://localhost:4000';

async function test() {
  try {
    // 1. Health check
    console.log('1. Testing health check...');
    const health = await fetch(`${BASE_URL}/health`);
    console.log('✅ Health:', await health.json());

    // 2. Register user
    console.log('\n2. Registering user...');
    const register = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        club: 'Arsenal'
      })
    });
    const { user, token } = await register.json();
    console.log('✅ Registered:', user.username);
    console.log('✅ Token:', token.substring(0, 20) + '...');

    // 3. Get current user
    console.log('\n3. Getting current user...');
    const me = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Current user:', await me.json());

    // 4. Sync takes
    console.log('\n4. Syncing takes...');
    const sync = await fetch(`${BASE_URL}/takes/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        takes: [{
          clientId: '550e8400-e29b-41d4-a716-446655440000',
          fixtureId: '123',
          matchRating: 8,
          text: 'What a match! Great performance.'
        }]
      })
    });
    const syncResult = await sync.json();
    console.log('✅ Synced:', syncResult.results.length, 'take(s)');

    // 5. Get feed
    console.log('\n5. Getting feed...');
    const feed = await fetch(`${BASE_URL}/feed`);
    const feedData = await feed.json();
    console.log('✅ Feed:', feedData.items.length, 'items');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF

# Run test (requires Node.js 18+ with fetch)
node server/test-api.js
```

---

## Method 5: Using httpie (if installed)

```bash
# Install httpie: brew install httpie (Mac) or pip install httpie

# Health check
http GET localhost:4000/health

# Register
http POST localhost:4000/auth/register username=testuser club=Arsenal

# Get feed
http GET localhost:4000/feed

# Sync takes (with token)
http POST localhost:4000/takes/sync \
  Authorization:"Bearer YOUR_TOKEN" \
  takes:='[{"clientId":"550e8400-e29b-41d4-a716-446655440000","fixtureId":"123","matchRating":8,"text":"Great match!"}]'
```

---

## Common Test Scenarios

### Scenario 1: Full User Flow
```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"fan1","club":"Arsenal"}' | jq -r '.token')

# 2. Get user info
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Create a take
curl -X POST http://localhost:4000/takes/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "takes": [{
      "clientId": "550e8400-e29b-41d4-a716-446655440000",
      "fixtureId": "123",
      "matchRating": 8,
      "text": "Great match!"
    }]
  }'

# 4. View feed
curl http://localhost:4000/feed
```

### Scenario 2: Error Testing

```bash
# Invalid registration (missing fields)
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'
# Should return validation error

# Invalid token
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer invalid_token"
# Should return 401 Unauthorized

# Invalid take (rating out of range)
curl -X POST http://localhost:4000/takes/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "takes": [{
      "clientId": "550e8400-e29b-41d4-a716-446655440000",
      "fixtureId": "123",
      "matchRating": 15,
      "text": "Test"
    }]
  }'
# Should return validation error
```

---

## Viewing Database

To see what's in your database:

```bash
# Open Prisma Studio (GUI)
npm run studio

# Opens at http://localhost:5555
# You can view/edit User and Take records
```

---

## Tips

1. **Save your token:** After registering, save the JWT token for authenticated requests
2. **Use jq for pretty JSON:** `curl ... | jq` (install: `brew install jq`)
3. **Check server logs:** The terminal running `npm run dev` shows all requests
4. **Test error cases:** Try invalid data to ensure validation works
5. **Use Prisma Studio:** Great for inspecting database state

---

## Troubleshooting

**"Connection refused"**
- Make sure server is running: `npm run dev`
- Check port: `lsof -i :4000`

**"401 Unauthorized"**
- Token expired or invalid
- Missing `Authorization: Bearer` header
- Register again to get a new token

**"Validation error"**
- Check request body matches schema
- `matchRating` must be 1-10
- `text` must be 5-280 characters
- `clientId` must be valid UUID

**"Database error"**
- Check Docker is running: `docker ps`
- Restart database: `docker compose restart`
