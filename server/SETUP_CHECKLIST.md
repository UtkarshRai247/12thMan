# Setup Checklist - Get Backend Running

## ✅ What You Need

### 1. **Prerequisites** (One-time setup)
- [ ] **Node.js 20+** installed
  ```bash
  node --version  # Should show v20.x or higher
  ```
- [ ] **Docker Desktop** installed and running
  - Download from: https://www.docker.com/products/docker-desktop
  - Make sure Docker is running before proceeding

### 2. **Environment Setup** (5 minutes)

```bash
# Navigate to server directory
cd server

# Copy environment template
cp .env.example .env

# Edit .env (optional - defaults work for local dev)
# The default values are fine for local development:
# - DATABASE_URL: postgresql://postgres:postgres@localhost:5432/twelfthman
# - JWT_SECRET: dev_secret_change_me (change this in production!)
# - PORT: 4000
# - NODE_ENV: development
```

### 3. **Database Setup** (2 minutes)

```bash
# Start PostgreSQL in Docker
docker compose up -d

# Verify it's running
docker ps  # Should show twelfthman-db container
```

### 4. **Install Dependencies** (1 minute)

```bash
npm install
```

### 5. **Database Migration** (1 minute)

```bash
# Generate Prisma client and run migrations
npm run migrate

# This will:
# - Generate Prisma client
# - Create database tables (User, Take)
# - Set up indexes and constraints
```

### 6. **Start Server** (30 seconds)

```bash
# Development mode (with hot reload)
npm run dev

# You should see:
# 🚀 Server listening on http://localhost:4000
```

---

## 🧪 Test It Works

### Test 1: Health Check
```bash
curl http://localhost:4000/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### Test 2: Register User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","club":"Arsenal"}'
```
Expected: User object + JWT token

### Test 3: Get Feed (should be empty initially)
```bash
curl http://localhost:4000/feed
```
Expected: `{"items":[],"nextCursor":null}`

---

## 🚨 Common Issues

### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check if Docker is running
docker ps

# If not, start it:
docker compose up -d

# Check logs:
docker compose logs postgres
```

### Issue: "Port 4000 already in use"
**Solution:**
```bash
# Change PORT in .env file to something else (e.g., 4001)
# Or kill the process using port 4000
```

### Issue: "Prisma client not generated"
**Solution:**
```bash
npm run generate
npm run migrate
```

### Issue: "Migration failed"
**Solution:**
```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
npm run migrate
```

---

## 📱 Next Steps: Connect Mobile App

Once the backend is running, you need to:

1. **Update mobile app** to point to your backend:
   - Add API base URL: `http://localhost:4000` (for local dev)
   - For physical device testing: Use your computer's IP (e.g., `http://192.168.1.100:4000`)

2. **Update sync service** in mobile app:
   - Modify `src/lib/sync/syncService.ts` to call `POST /takes/sync`
   - Include JWT token in Authorization header
   - Handle the response format: `{ results: [{ clientId, providerId, status, syncedAt }] }`

3. **Update auth flow**:
   - On registration, call `POST /auth/register` instead of local-only
   - Store JWT token in AsyncStorage
   - Include token in all authenticated requests

---

## 🔐 Security Notes

- **JWT_SECRET**: Change `dev_secret_change_me` to a strong random string in production
- **DATABASE_URL**: Use a secure connection string in production
- **Rate Limiting**: Currently in-memory (fine for MVP). Use Redis for production scale.

---

## 📊 Database Management

### View Database
```bash
# Open Prisma Studio (GUI)
npm run studio

# Opens at http://localhost:5555
```

### Reset Database
```bash
# WARNING: Deletes all data
docker compose down -v
docker compose up -d
npm run migrate
```

### View Logs
```bash
# Server logs
npm run dev  # (already shows logs)

# Database logs
docker compose logs postgres
```

---

## ✅ You're Done When:

- [x] Docker is running
- [x] Database is up (`docker ps` shows container)
- [x] Dependencies installed (`node_modules` exists)
- [x] Migrations run successfully
- [x] Server starts without errors
- [x] Health check returns `{"status":"ok"}`
- [x] Can register a user and get a token

**Once all checked, your backend is fully functional!** 🎉
