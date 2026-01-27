# Accessibility Guidelines

## Overview

12thMan is designed to be accessible to all users, following React Native and iOS/Android accessibility best practices.

## Color Contrast

- **Text on Background**: Minimum 4.5:1 contrast ratio
- **Interactive Elements**: Minimum 3:1 contrast ratio
- **Rating Colors**: Never rely on color alone - always include labels/icons

## Touch Targets

- **Minimum Size**: 44x44 points (iOS) / 48x48dp (Android)
- **Spacing**: Adequate spacing between interactive elements
- **Hit Areas**: Expand touch areas beyond visual bounds when needed

## Screen Reader Support

### Labels
- All interactive elements have `accessibilityLabel`
- Images have `accessibilityLabel` or are marked as decorative
- Form inputs have `accessibilityHint` when needed

### Roles
- Use semantic roles: `button`, `header`, `text`, etc.
- Mark decorative elements with `accessibilityRole="none"`

### States
- Announce dynamic content changes
- Provide feedback for user actions

## Typography

- **Minimum Font Size**: 12px for body text
- **Line Height**: Minimum 1.4 for readability
- **Font Weight**: Use semibold/bold for emphasis, not just size

## Rating System

The TerraceDial component:
- Uses numeric labels (1-10) visible to all users
- Includes semantic text labels ("Elite", "Good", etc.)
- Color is supplementary, not primary indicator
- Touch targets are large enough for easy selection

## Examples

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Rate match 8 out of 10"
  accessibilityHint="Double tap to select this rating"
>
  <Text>8</Text>
</TouchableOpacity>
```

## Testing

- Test with VoiceOver (iOS) and TalkBack (Android)
- Verify color contrast with tools like WebAIM Contrast Checker
- Test with reduced motion preferences
- Verify touch target sizes on physical devices
