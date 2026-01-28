import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Fixture, MatchStatus } from '../lib/apiFootball/types';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface MatchCardProps {
  fixture: Fixture;
  onPress?: () => void;
  onRatePress?: () => void;
  onShoutPress?: () => void;
}

export function MatchCard({ fixture, onPress, onRatePress, onShoutPress }: MatchCardProps) {
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

  // Calculate font size based on team name length
  const getTeamNameFontSize = (teamName: string) => {
    const length = teamName.length;
    if (length <= 8) return 18; // Normal size for short names
    if (length <= 12) return 16; // Slightly smaller for medium names
    if (length <= 16) return 14; // Smaller for long names
    return 12; // Smallest for very long names like "Manchester United"
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
          <Text 
            variant="title" 
            style={[styles.teamName, { fontSize: getTeamNameFontSize(fixture.homeTeam.name) }]}
            numberOfLines={2}
            adjustsFontSizeToFit={false}
          >
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
          <Text 
            variant="title" 
            style={[styles.teamName, { fontSize: getTeamNameFontSize(fixture.awayTeam.name) }]}
            numberOfLines={2}
            adjustsFontSizeToFit={false}
          >
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
            styles.actionButton,
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
      
      {(fixture.status === MatchStatus.LIVE || fixture.status === MatchStatus.UPCOMING) && onShoutPress && (
        <TouchableOpacity
          onPress={onShoutPress}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Shout
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
    gap: 8,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0, // Allows flex to shrink properly
    paddingHorizontal: 4,
    maxWidth: '38%', // Slightly more width for better wrapping
  },
  teamName: {
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
    lineHeight: 20, // Consistent line height for better wrapping
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    flexShrink: 0, // Prevent score section from shrinking
  },
  score: {
    minWidth: 30,
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});
