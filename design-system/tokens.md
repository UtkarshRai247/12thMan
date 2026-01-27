# Design Tokens

## Overview

12thMan uses a comprehensive design token system for consistent styling across the app. Tokens are defined in `src/theme/tokens.ts` and support both light and dark themes with a stadium floodlight aesthetic.

## Colors

### Light Theme
- **Background**: `#FFFFFF` - Primary background
- **Surface**: `#F8F9FA` - Card/surface background
- **Surface Elevated**: `#FFFFFF` - Elevated surfaces
- **Text**: `#111827` - Primary text
- **Text Secondary**: `#6B7280` - Secondary text
- **Text Tertiary**: `#9CA3AF` - Tertiary text

### Dark Theme
- **Background**: `#0F172A` - Night match aesthetic
- **Surface**: `#1E293B` - Card/surface background
- **Surface Elevated**: `#334155` - Elevated surfaces
- **Text**: `#F1F5F9` - Primary text
- **Text Secondary**: `#CBD5E1` - Secondary text
- **Text Tertiary**: `#94A3B8` - Tertiary text

### Status Colors
- **Live**: Red (`#EF4444` light / `#F87171` dark)
- **Finished**: Gray (`#6B7280` light / `#94A3B8` dark)
- **Upcoming**: Green (`#10B981` light / `#34D399` dark)

### Rating Scale (1-10)
Each rating has a semantic color and label:
- 1-2: Poor/Very Bad (Red/Orange)
- 3-4: Bad/Below Average (Orange/Yellow)
- 5: Average (Yellow-Green)
- 6-7: Above Average/Good (Green)
- 8-9: Very Good/Excellent (Teal/Cyan)
- 10: Elite (Blue)

## Typography

### Font Families
- **Body**: Inter (system fallback)
- **Headline**: Bebas Neue (system fallback)
- **Mono**: IBM Plex Mono (Courier fallback)

### Font Sizes
Based on 4px base unit:
- `xs`: 12px
- `sm`: 14px
- `base`: 16px
- `lg`: 18px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 30px
- `4xl`: 36px
- `5xl`: 48px
- `6xl`: 60px

### Font Weights
- `regular`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700

### Line Heights
- `tight`: 1.2
- `normal`: 1.5
- `relaxed`: 1.75

## Spacing

4px base unit system:
- `0`: 0px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `8`: 32px
- `10`: 40px
- `12`: 48px
- `16`: 64px
- `20`: 80px
- `24`: 96px

## Border Radius

- `none`: 0
- `sm`: 4px
- `base`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 20px
- `2xl`: 24px
- `full`: 9999px

## Shadows

Four shadow levels with elevation support:
- `sm`: Subtle shadow
- `base`: Standard shadow
- `md`: Medium shadow
- `lg`: Large shadow

Each shadow includes:
- Shadow color, offset, opacity, radius
- Android elevation value

## Usage

Access tokens via the `useTheme()` hook:

```tsx
import { useTheme } from '@/src/theme/ThemeProvider';

const theme = useTheme();
// theme.colors.primary
// theme.spacing[4]
// theme.typography.sizes.base
```
