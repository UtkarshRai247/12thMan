import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { ReactionBar } from './ReactionBar';
import { Take } from '../lib/domain/types';

interface TakeCardProps {
  take: Take;
  onReaction?: (type: 'cheer' | 'boo' | 'shout') => void;
  onEdit?: (take: Take) => void;
  onDelete?: (take: Take) => void;
  onRetry?: (take: Take) => void;
}

export function TakeCard({ take, onReaction, onEdit, onDelete, onRetry }: TakeCardProps) {
  const theme = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const isQueued = take.status === 'queued' || take.status === 'syncing';

  const handleMenuPress = () => {
    if (take.status === 'queued' || take.status === 'syncing') {
      Alert.alert('Take Actions', '', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            setShowMenu(false);
            onEdit?.(take);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setShowMenu(false);
            Alert.alert(
              'Delete Take',
              'Are you sure you want to delete this take?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onDelete?.(take),
                },
              ]
            );
          },
        },
      ]);
    } else if (take.status === 'failed') {
      Alert.alert('Take Actions', '', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: () => {
            setShowMenu(false);
            onRetry?.(take);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setShowMenu(false);
            Alert.alert(
              'Delete Take',
              'Are you sure you want to delete this take?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onDelete?.(take),
                },
              ]
            );
          },
        },
      ]);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isQueued ? theme.colors.varYellow : theme.colors.border,
          borderWidth: isQueued ? 2 : 1,
        },
      ]}
    >
      {/* Header with queued badge */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text variant="body" style={{ fontWeight: '600' }}>
            {take.userName}
          </Text>
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            {take.userClub} • {new Date(take.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isQueued && (
          <View
            style={[
              styles.queuedBadge,
              {
                backgroundColor:
                  take.status === 'syncing'
                    ? theme.colors.info + '20'
                    : theme.colors.varYellow + '20',
                borderColor:
                  take.status === 'syncing' ? theme.colors.info : theme.colors.varYellow,
              },
            ]}
          >
            <Text
              variant="caption"
              style={[
                styles.badgeText,
                {
                  color:
                    take.status === 'syncing' ? theme.colors.info : theme.colors.varYellow,
                },
              ]}
            >
              {take.status === 'syncing' ? 'Syncing...' : 'Queued'}
            </Text>
          </View>
        )}
        {take.status === 'failed' && (
          <View
            style={[
              styles.queuedBadge,
              {
                backgroundColor: theme.colors.error + '20',
                borderColor: theme.colors.error,
              },
            ]}
          >
            <Text variant="caption" style={[styles.badgeText, { color: theme.colors.error }]}>
              Failed
            </Text>
          </View>
          )}
          {(take.status === 'queued' || take.status === 'syncing' || take.status === 'failed') && (
            <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
              <MoreVertical size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Rating summary */}
      <View style={styles.ratingSummary}>
        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
          Match Rating:
        </Text>
        <Text variant="title" style={{ color: theme.colors.accent }}>
          {take.matchRating}/10
        </Text>
      </View>

      {/* Take text */}
      <Text variant="body" style={styles.takeText}>
        {take.text}
      </Text>

      {/* Reactions */}
      <ReactionBar
        cheerCount={take.reactions.cheer}
        booCount={take.reactions.boo}
        shoutCount={take.reactions.shout}
        onCheer={() => onReaction?.('cheer')}
        onBoo={() => onReaction?.('boo')}
        onShout={() => onReaction?.('shout')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 4,
  },
  queuedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  takeText: {
    marginBottom: 12,
    lineHeight: 22,
  },
});
