# Component Library

## Core Components

### Text
Typography wrapper with variant support.

**Location**: `src/components/Text.tsx`

**Variants**:
- `h1`: Large headline (Bebas Neue)
- `h2`: Medium headline (Bebas Neue)
- `title`: Section title
- `body`: Body text (default)
- `caption`: Small text
- `mono`: Monospace (for stats/ratings)

**Usage**:
```tsx
<Text variant="h1">Match Title</Text>
<Text variant="body">Regular text</Text>
```

### MatchCard
Displays match information with teams, score, and status.

**Location**: `src/components/MatchCard.tsx`

**Props**:
- `fixture: Fixture` - Match data
- `onPress?: () => void` - Navigate to match detail
- `onRatePress?: () => void` - Rate match (shown for finished matches)

**Features**:
- Club-agnostic neutral styling
- Status badges (LIVE/FT/UPCOMING)
- "Rate Now" CTA for finished matches

### TerraceDial
Signature rating input component (1-10 scale).

**Location**: `src/components/TerraceDial.tsx`

**Props**:
- `value: number | null` - Current rating
- `onValueChange: (value: number) => void` - Rating change handler
- `averageRating?: number` - Crowd average (optional)
- `showAverage?: boolean` - Show average display

**Features**:
- Two-row segmented button layout
- Color-coded ratings with semantic labels
- Instant tap selection
- Shows user rating + crowd average

### PlayerCard
Displays player information with rating capability.

**Location**: `src/components/PlayerCard.tsx`

**Props**:
- `player: Player` - Player data
- `rating?: number | null` - Current rating
- `onRatingChange?: (rating: number) => void` - Rating handler
- `isMOTM?: boolean` - Man of the match highlight
- `onMOTMPress?: () => void` - MOTM selection handler
- `showRating?: boolean` - Show rating dial

**Features**:
- Avatar placeholder
- Position badge (GK/DF/MF/FW)
- Mini stats row
- Integrated TerraceDial

### MOTMBadge
Trophy icon badge for Man of the Match.

**Location**: `src/components/MOTMBadge.tsx`

**Props**:
- `size?: number` - Icon size (default: 24)

**Usage**:
```tsx
<MOTMBadge size={32} />
```

### ReactionBar
Football-coded reaction buttons (CHEER/BOO/COMMENT).

**Location**: `src/components/ReactionBar.tsx`

**Props**:
- `cheerCount?: number` - Cheer count
- `booCount?: number` - Boo count
- `commentCount?: number` - Comment count
- `onCheer?: () => void` - Cheer handler
- `onBoo?: () => void` - Boo handler
- `onComment?: () => void` - Comment handler
- `userReactions?: { cheered?: boolean; booed?: boolean }` - User reaction state

**Features**:
- Press animations (Animated API)
- Active state styling
- Count display

## Component Guidelines

1. **Club-Agnostic**: Never use team-specific colors. Use neutral palette.
2. **Accessibility**: All interactive elements have proper touch targets (min 44x44px).
3. **Dark Mode**: All components support both light and dark themes.
4. **TypeScript**: Fully typed with proper interfaces.
5. **Performance**: Use React.memo where appropriate, avoid unnecessary re-renders.
