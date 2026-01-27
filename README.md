# 12thMan

A mobile-first social match rating app for football fans. Rate matches, engage with fan takes, and track club seasons through fan consensus.

## Features

- **Rate Matches**: Use the signature TerraceDial to rate matches on a 1-10 scale
- **Player Ratings**: Rate individual players and select Man of the Match
- **Fan Takes**: Share your thoughts on matches with the community
- **Reactions**: CHEER, BOO, or COMMENT on fan takes
- **Match Feed**: Browse matches and fan takes in your personalized feed
- **Dark Mode**: Stadium floodlight aesthetic with automatic dark mode support

## Tech Stack

- **Expo** (latest) + TypeScript
- **expo-router** for file-based navigation
- **NativeWind** (Tailwind for React Native) for styling
- **react-native-reanimated** + **react-native-gesture-handler** for animations
- **lucide-react-native** for icons
- **expo-font** for typography
- **expo-constants** for environment variables

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (for Mac) or Android Emulator
- (Optional) API-Football API key from [api-football.com](https://www.api-football.com/)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/UtkarshRai247/12thMan.git
cd 12thMan
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional, for live API data):
```bash
cp .env.example .env
# Edit .env and add your API_FOOTBALL_KEY
```

4. Start the development server:
```bash
npx expo start
```

5. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web
- Scan QR code with Expo Go app on your device

## Project Structure

```
12thMan/
├── app/                          # expo-router file-based routing
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── index.tsx            # Feed screen
│   │   ├── explore.tsx
│   │   ├── post.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── match/[id].tsx           # Match detail screen
│   └── _layout.tsx              # Root layout
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── MatchCard.tsx
│   │   ├── TerraceDial.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── MOTMBadge.tsx
│   │   ├── ReactionBar.tsx
│   │   └── Text.tsx
│   ├── theme/                   # Design system
│   │   ├── tokens.ts
│   │   ├── fonts.ts
│   │   └── ThemeProvider.tsx
│   ├── lib/
│   │   ├── apiFootball/
│   │   │   ├── types.ts
│   │   │   └── client.ts
│   │   └── cache/
│   │       └── cache.ts
│   └── data/
│       └── mock/               # Mock data
│           ├── fixtures.ts
│           ├── teams.ts
│           ├── players.ts
│           └── takes.ts
├── design-system/              # Documentation
│   ├── tokens.md
│   ├── components.md
│   ├── motion.md
│   ├── accessibility.md
│   └── api-contracts.md
├── .env.example
├── app.json
├── package.json
├── tailwind.config.js
└── babel.config.js
```

## Routes & Screens

### Tab Navigation
- **Feed** (`/`): Match feed with "For You" and "Following" tabs
- **Explore** (`/explore`): Discover matches and fan takes (coming soon)
- **Post** (`/post`): Create a new take on a match
- **Notifications** (`/notifications`): Match alerts and activity
- **Profile** (`/profile`): User profile with recent ratings

### Stack Routes
- **Match Detail** (`/match/[id]`): Detailed match view with player ratings

## Design System

The app uses a comprehensive design system with:

- **Tokens**: Colors, typography, spacing, radii, shadows (see `design-system/tokens.md`)
- **Components**: Reusable UI components (see `design-system/components.md`)
- **Motion**: Animation guidelines (see `design-system/motion.md`)
- **Accessibility**: A11y standards (see `design-system/accessibility.md`)

### Theme

The design system supports both light and dark themes with a stadium floodlight aesthetic. Theme automatically adapts to system preferences.

### Typography

- **Inter**: Body text (system fallback)
- **Bebas Neue**: Headlines (system fallback)
- **IBM Plex Mono**: Ratings/stats (Courier fallback)

> **Note**: Custom fonts need to be downloaded and bundled for production. See `src/theme/fonts.ts` for setup.

## Data Layer

### API-Football Integration

The app includes a typed API-Football client (`src/lib/apiFootball/client.ts`) that:

- Reads `API_FOOTBALL_KEY` from environment variables
- Provides functions: `getFixturesByDate()`, `getLiveFixtures()`, `getFixtureDetails()`
- Falls back to mock data if API key is missing
- Includes friendly dev warnings when key is not configured

### Mock Data

When API key is not configured, the app uses mock data from `src/data/mock/`:
- Sample fixtures, teams, players, and user takes
- Fully functional UI for development and testing

### Caching

In-memory TTL cache (`src/lib/cache/cache.ts`) for API responses:
- Automatic expiration
- Key-value storage
- Cleanup utilities

## TODOs for Future Integration

1. **Supabase Setup**: Replace mock data store with Supabase client
   - User authentication
   - Take storage
   - Real-time match updates
   - User profiles

2. **API-Football**: Add real API key to `.env` and enable live data fetching
   - Live match data
   - Player statistics
   - Event tracking

3. **Custom Fonts**: Download and bundle Inter, Bebas Neue, IBM Plex Mono
   - Update `src/theme/fonts.ts` with local font files

4. **Image Handling**: Replace placeholders with actual player photos
   - Integrate with API-Football or team APIs

5. **Push Notifications**: Set up Expo notifications for match alerts

6. **Formation Customization**: Implement squad rotation feature in profile

## Development

### Running on iOS Simulator

```bash
npx expo start --ios
```

### Running on Android Emulator

```bash
npx expo start --android
```

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Specify your license here.

## Contact

Your name or contact information here.
