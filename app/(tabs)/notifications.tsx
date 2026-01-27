import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Text } from '@/src/components/Text';

export default function NotificationsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="h2" style={styles.title}>
          Notifications
        </Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
          Stay updated with match alerts and fan activity
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textTertiary, marginTop: 16, textAlign: 'center' }}>
          No notifications yet
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
});
