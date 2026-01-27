import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Player, PlayerPosition } from '../lib/apiFootball/types';
import { TerraceDial } from './TerraceDial';
import { MOTMBadge } from './MOTMBadge';

interface PlayerCardProps {
  player: Player;
  rating?: number | null;
  onRatingChange?: (rating: number) => void;
  isMOTM?: boolean;
  onMOTMPress?: () => void;
  showRating?: boolean;
}

export function PlayerCard({
  player,
  rating = null,
  onRatingChange,
  isMOTM = false,
  onMOTMPress,
  showRating = true,
}: PlayerCardProps) {
  const theme = useTheme();

  const getPositionAbbrev = (position: PlayerPosition): string => {
    switch (position) {
      case PlayerPosition.GK:
        return 'GK';
      case PlayerPosition.DF:
        return 'DF';
      case PlayerPosition.MF:
        return 'MF';
      case PlayerPosition.FW:
        return 'FW';
      default:
        return '--';
    }
  };

  const getPositionColor = (position: PlayerPosition): string => {
    switch (position) {
      case PlayerPosition.GK:
        return theme.colors.accent;
      case PlayerPosition.DF:
        return theme.colors.info;
      case PlayerPosition.MF:
        return theme.colors.success;
      case PlayerPosition.FW:
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: isMOTM ? theme.colors.accent : theme.colors.border,
              },
            ]}
          >
            {isMOTM && <MOTMBadge />}
            <Text variant="title" style={styles.avatarText}>
              {player.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.playerDetails}>
            <Text variant="title" style={styles.playerName}>
              {player.name}
            </Text>
            <View style={styles.metaRow}>
              {player.number && (
                <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                  #{player.number}
                </Text>
              )}
              <View
                style={[
                  styles.positionBadge,
                  {
                    backgroundColor: getPositionColor(player.position) + '20',
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.positionText,
                    {
                      color: getPositionColor(player.position),
                    },
                  ]}
                >
                  {getPositionAbbrev(player.position)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Mini stats placeholder */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            Goals
          </Text>
          <Text variant="mono" style={styles.statValue}>
            --
          </Text>
        </View>
        <View style={styles.stat}>
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            Assists
          </Text>
          <Text variant="mono" style={styles.statValue}>
            --
          </Text>
        </View>
        <View style={styles.stat}>
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            Rating
          </Text>
          <Text variant="mono" style={styles.statValue}>
            {rating ? `${rating}/10` : '--'}
          </Text>
        </View>
      </View>

      {/* Rating dial */}
      {showRating && onRatingChange && (
        <View style={styles.ratingSection}>
          <TerraceDial
            value={rating}
            onValueChange={onRatingChange}
            showAverage={false}
          />
        </View>
      )}
    </View>
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
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    fontSize: 24,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  ratingSection: {
    marginTop: 12,
  },
});
