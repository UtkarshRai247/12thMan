# Motion & Animation Guidelines

## Principles

12thMan uses minimal, performant animations that enhance the football match experience without being distracting.

## Animation Libraries

- **React Native Animated API**: Primary animation library for simple interactions
- **React Native Reanimated**: Available but used sparingly for complex animations
- **No Framer Motion**: Not standard for React Native; prefer native solutions

## Animation Patterns

### Press Animations
Use scale transforms for button/touchable feedback:

```tsx
const scale = useRef(new Animated.Value(1)).current;

const animatePress = () => {
  Animated.sequence([
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
};
```

### Rating Selection
TerraceDial uses instant tap selection - no animation needed for rating buttons.

### MOTM Highlight
MOTMBadge appears instantly when selected. Consider subtle scale animation if needed.

## Performance Guidelines

1. **Use Native Driver**: Always use `useNativeDriver: true` for transform/opacity animations
2. **Avoid Layout Animations**: Prefer transform/opacity over layout properties
3. **Debounce Rapid Actions**: Rating changes should be instant, but debounce API calls
4. **Minimal Motion**: Keep animations subtle and purposeful

## Animation Duration

- **Micro-interactions**: 100-150ms
- **Transitions**: 200-300ms
- **Page transitions**: Handled by expo-router (default)

## Examples

See `ReactionBar.tsx` for press animation implementation.
