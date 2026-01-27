# API Contracts

## Data Structures

### Fixture
```typescript
interface Fixture {
  id: number;
  date: string; // YYYY-MM-DD
  timestamp: number; // Unix timestamp
  status: MatchStatus; // LIVE | FT | NS | PST | CANC
  homeTeam: Team;
  awayTeam: Team;
  score: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
}
```

### Team
```typescript
interface Team {
  id: number;
  name: string;
  code: string; // 3-letter code
  logo?: string; // URL
}
```

### Player
```typescript
interface Player {
  id: number;
  name: string;
  position: PlayerPosition; // GK | DF | MF | FW
  number?: number;
  photo?: string; // URL
  teamId: number;
}
```

### Take (User Post)
```typescript
interface Take {
  id: string;
  userId: string;
  userName: string;
  userClub: string;
  fixtureId: number;
  matchRating: number; // 1-10
  motmPlayerId?: number;
  text: string;
  reactions: {
    cheer: number;
    boo: number;
    comment: number;
  };
  createdAt: string; // ISO string
}
```

## API-Football Client

### Functions

#### `getFixturesByDate(date: string): Promise<Fixture[]>`
Fetches fixtures for a specific date.

**Parameters**:
- `date`: Date string in YYYY-MM-DD format

**Returns**: Array of fixtures

**Error Handling**: Returns empty array if API key missing or error occurs

#### `getLiveFixtures(): Promise<Fixture[]>`
Fetches currently live fixtures.

**Returns**: Array of live fixtures

#### `getFixtureDetails(fixtureId: number): Promise<FixtureDetails | null>`
Fetches detailed fixture information including events and lineups.

**Parameters**:
- `fixtureId`: Fixture ID

**Returns**: Fixture details or null

## Environment Variables

### Required (for live data)
- `API_FOOTBALL_KEY`: API-Football API key

### Optional (for future Supabase integration)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

## Mock Data

When API key is missing, the app uses mock data from:
- `src/data/mock/fixtures.ts`
- `src/data/mock/teams.ts`
- `src/data/mock/players.ts`
- `src/data/mock/takes.ts`

## Caching

The cache system (`src/lib/cache/cache.ts`) provides:
- TTL-based expiration
- In-memory storage
- Automatic cleanup

**Usage**:
```typescript
import { cache } from '@/src/lib/cache/cache';

// Set with 5 minute TTL
cache.set('fixtures:2024-01-26', fixtures, 300);

// Get
const cached = cache.get<Fixture[]>('fixtures:2024-01-26');
```

## Future Integration

### Supabase
- User authentication
- Take storage
- Real-time match updates
- User profiles

### API-Football
- Live match data
- Player statistics
- Event tracking
- League standings
