# 12thMan Demo Guide

Complete guide to demo the 12thMan app with backend integration.

---

## 🚀 Quick Start (2 Terminals)

### Terminal 1: Backend Server
```bash
cd server
npm run dev
```
**Keep this running!** Server should show: `🚀 Server listening on http://localhost:4000`

### Terminal 2: Mobile App
```bash
# In project root
npm install  # If not already done
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Press `w` for Web
- Or scan QR code with Expo Go app on your phone

---

## 📱 Demo Flow

### Step 1: First Launch (Onboarding)

1. **Open the app** - You'll see the onboarding screen
2. **Enter username** - e.g., "DemoUser"
3. **Select club** - e.g., "Arsenal"
4. **Tap "Get Started"** - You'll be taken to the main feed

**What to show:**
- Clean onboarding experience
- Local identity creation (no backend needed yet)

---

### Step 2: Create Your First Take

1. **Tap the "Post" tab** (bottom navigation)
2. **Select a match** - Scroll through finished fixtures
3. **Rate the match** - Use the TerraceDial (1-10 scale)
4. **Pick Man of the Match** (optional) - Select a player
5. **Write your take** - 5-280 characters
6. **Tap "Post Take"**

**What to show:**
- Offline-first: Take is saved locally with "Queued" status
- Draft auto-saves as you type
- Validation (try submitting with < 5 chars to show error)

**What happens:**
- Take is stored locally with `clientId`
- Status badge shows "Queued"
- Ready to sync when backend is connected

---

### Step 3: View Your Feed

1. **Go to "Feed" tab**
2. **See your take** - Shows with "Queued" badge
3. **Filter options** - Try "All", "Posted", "Queued", "Failed"

**What to show:**
- Offline queue working
- Status badges
- Filtering and sorting

---

### Step 4: Connect to Backend (Sync)

**Before connecting, make sure backend is running!**

1. **Go to "Profile" tab**
2. **Tap "Sync Now" button**
3. **Watch the sync happen** - Toast notification shows progress

**What happens:**
- App sends takes to `POST /takes/sync`
- Backend returns `providerId` and `syncedAt`
- Take status changes from "Queued" → "Posted"
- Badge updates to "Posted"

**What to show:**
- Offline-to-online sync
- Status updates in real-time
- Toast notifications

---

### Step 5: View Synced Feed

1. **Go back to "Feed" tab**
2. **See your take** - Now shows "Posted" badge
3. **Pull to refresh** - Fetches from backend

**What to show:**
- Feed from backend (`GET /feed`)
- Cursor pagination (if multiple takes)
- Real-time updates

---

### Step 6: Create Multiple Takes

1. **Create 2-3 more takes** - Different matches
2. **All will be queued locally**
3. **Sync again** - Batch sync (up to 10 at once)

**What to show:**
- Batch processing
- Multiple takes syncing together
- Feed updates with all takes

---

### Step 7: Edit a Queued Take

1. **Create a take** (don't sync yet)
2. **Go to Feed** - Find your queued take
3. **Tap 3-dot menu** → **Edit**
4. **Modify the take** - Change rating or text
5. **Save** - Updates the queued take
6. **Sync** - Updated version goes to backend

**What to show:**
- Edit flow
- Draft persistence
- Update before sync

---

### Step 8: Test Offline Mode

1. **Stop the backend server** (Ctrl+C in Terminal 1)
2. **Create a new take** - Still works offline!
3. **Try to sync** - Shows error/failed status
4. **Restart backend**
5. **Sync again** - Retry works!

**What to show:**
- True offline-first
- Error handling
- Retry mechanism

---

## 🎯 Key Features to Highlight

### 1. **Offline-First Architecture**
- ✅ Works completely offline
- ✅ Queue persists across app restarts
- ✅ Auto-sync when online

### 2. **Idempotent Sync**
- ✅ Same `clientId` = no duplicates
- ✅ Safe to retry
- ✅ Edit before sync works

### 3. **User Experience**
- ✅ Instant feedback (local saves)
- ✅ Status badges (Queued/Posted/Failed)
- ✅ Toast notifications
- ✅ Pull-to-refresh

### 4. **Data Integrity**
- ✅ Draft auto-save
- ✅ Validation
- ✅ Error handling

---

## 🔧 Backend Integration Setup

### Option 1: Local Development (Current)

**Backend:** `http://localhost:4000`

**For iOS Simulator:**
- Use `http://localhost:4000` (simulator shares host network)

**For Android Emulator:**
- Use `http://10.0.2.2:4000` (Android emulator special IP)

**For Physical Device:**
- Find your computer's IP: `ifconfig | grep "inet "`
- Use `http://YOUR_IP:4000` (e.g., `http://192.168.1.100:4000`)

### Option 2: Update Mobile App to Connect

You'll need to update the sync service to call your backend. Create a config file:

```typescript
// src/lib/config.ts
export const API_BASE_URL = __DEV__
  ? 'http://localhost:4000'  // Change to your IP for physical device
  : 'https://your-production-api.com';
```

Then update `src/lib/sync/syncService.ts` to:
1. Call `POST /takes/sync` with JWT token
2. Handle response: `{ results: [{ clientId, providerId, status, syncedAt }] }`
3. Update take status based on response

---

## 📋 Demo Checklist

### Pre-Demo Setup
- [ ] Backend server running (`npm run dev` in `server/`)
- [ ] Database running (`docker compose up -d`)
- [ ] Mobile app running (`npx expo start`)
- [ ] Test backend: `curl http://localhost:4000/health`

### Demo Flow
- [ ] Show onboarding
- [ ] Create a take (offline)
- [ ] Show queued status
- [ ] Sync to backend
- [ ] Show posted status
- [ ] View feed from backend
- [ ] Create multiple takes
- [ ] Batch sync
- [ ] Edit a queued take
- [ ] Test offline mode
- [ ] Show error handling

### Post-Demo
- [ ] Show Prisma Studio: `npm run studio` (view database)
- [ ] Show API endpoints in browser/Postman

---

## 🎬 Demo Script (5 minutes)

**Opening (30s):**
"12thMan is a social match rating app for football fans. It's built with an offline-first architecture, so it works even without internet."

**Core Demo (3min):**
1. "Let me create my first take..." (Create take offline)
2. "Notice it's saved locally with a 'Queued' status..." (Show badge)
3. "Now let's sync to the backend..." (Sync)
4. "The status updates to 'Posted'..." (Show update)
5. "The feed now shows takes from the server..." (Show feed)

**Advanced Features (1.5min):**
1. "I can create multiple takes offline..." (Create 2-3)
2. "And sync them all at once..." (Batch sync)
3. "If I go offline, it still works..." (Stop backend, create take)
4. "And retries when back online..." (Restart, sync)

**Closing (30s):**
"The app uses idempotent sync with client-side IDs, so it's safe to retry and handles network failures gracefully."

---

## 🐛 Troubleshooting

**App can't connect to backend:**
- Check backend is running: `curl http://localhost:4000/health`
- For physical device: Use your computer's IP, not `localhost`
- Check firewall isn't blocking port 4000

**Sync fails:**
- Check backend logs for errors
- Verify JWT token is being sent
- Check database is running: `docker ps`

**Takes not appearing:**
- Check Prisma Studio: `npm run studio`
- Verify takes are in database
- Check feed endpoint: `curl http://localhost:4000/feed`

**App crashes:**
- Check Expo logs
- Restart Expo: `npx expo start --clear`
- Check TypeScript errors: `npm run typecheck`

---

## 📊 What to Show in Database

After demo, show the database:

```bash
cd server
npm run studio
```

Opens at `http://localhost:5555`

**Show:**
- Users table (your registered users)
- Takes table (all synced takes)
- Notice `clientId` and `id` (providerId) columns
- See `syncedAt` timestamps

---

## 🎥 Recording Tips

1. **Show both terminals** - Backend logs + Expo
2. **Highlight status badges** - Queued → Posted transitions
3. **Show network tab** - If using web version
4. **Show database** - Prisma Studio at the end
5. **Demonstrate offline** - Airplane mode or stop backend

---

## 🚀 Next Steps

After demo, you can:
1. Deploy backend to production (Railway, Render, etc.)
2. Update mobile app with production API URL
3. Add more features (reactions, comments, etc.)
4. Set up CI/CD
5. Add analytics

---

**Happy demoing! 🎉**
