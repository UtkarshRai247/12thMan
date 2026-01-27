import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Fixture, MatchStatus } from '../lib/apiFootball/types';

interface MatchCardProps {
  fixture: Fixture;
  onPress?: () => void;
  onRatePress?: () => void;
}

export function MatchCard({ fixture, onPress, onRatePress }: MatchCardProps) {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (fixture.status) {
      case MatchStatus.LIVE:
        return theme.colors.live;
      case MatchStatus.FINISHED:
        return theme.colors.finished;
      case MatchStatus.UPCOMING:
        return theme.colors.upcoming;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (fixture.status) {
      case MatchStatus.LIVE:
        return 'LIVE';
      case MatchStatus.FINISHED:
        return 'FT';
      case MatchStatus.UPCOMING:
        return 'UPCOMING';
      default:
        return fixture.status;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
          {fixture.league.name}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor() + '20',
            },
          ]}
        >
          <Text
            variant="caption"
            style={[
              styles.statusText,
              {
                color: getStatusColor(),
                fontWeight: '600',
              },
            ]}
          >
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.matchInfo}>
        <View style={styles.teamSection}>
          <Text variant="title" style={styles.teamName}>
            {fixture.homeTeam.name}
          </Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            {fixture.homeTeam.code}
          </Text>
        </View>

        <View style={styles.scoreSection}>
          {fixture.score.home !== null && fixture.score.away !== null ? (
            <>
              <Text variant="h2" style={styles.score}>
                {fixture.score.home}
              </Text>
              <Text variant="body" style={{ color: theme.colors.textSecondary }}>
                -
              </Text>
              <Text variant="h2" style={styles.score}>
                {fixture.score.away}
              </Text>
            </>
          ) : (
            <Text variant="caption" style={{ color: theme.colors.textTertiary }}>
              {formatDate(fixture.timestamp)}
            </Text>
          )}
        </View>

        <View style={styles.teamSection}>
          <Text variant="title" style={styles.teamName}>
            {fixture.awayTeam.name}
          </Text>
          <Text variant="body" style={{ color: theme.colors.textSecondary }}>
            {fixture.awayTeam.code}
          </Text>
        </View>
      </View>

      {fixture.status === MatchStatus.FINISHED && onRatePress && (
        <TouchableOpacity
          onPress={onRatePress}
          style={[
            styles.rateButton,
            {
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Rate Now
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  score: {
    minWidth: 30,
    textAlign: 'center',
  },
  rateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});
