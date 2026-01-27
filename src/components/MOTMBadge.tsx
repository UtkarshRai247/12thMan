import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';

interface MOTMBadgeProps {
  size?: number;
}

export function MOTMBadge({ size = 24 }: MOTMBadgeProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.accent + '20',
          borderColor: theme.colors.accent,
        },
      ]}
    >
      <Trophy size={size} color={theme.colors.accent} fill={theme.colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
