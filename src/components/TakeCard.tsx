import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MoreVertical, MessageCircle, UserPlus, UserCheck } from 'lucide-react-native';
import { getTeamCardBackground } from '../lib/teamColors';
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
  /** Current user ID – when set and different from take author, show Follow/Following */
  currentUserId?: string | null;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  /** Thread replies to show below this take (only for top-level takes) */
  replies?: Take[];
  onReplySubmit?: (text: string) => void;
  /** Compact layout for nested reply cards */
  isReply?: boolean;
}

export function TakeCard({
  take,
  onReaction,
  onEdit,
  onDelete,
  onRetry,
  currentUserId,
  isFollowing = false,
  onFollow,
  onUnfollow,
  replies = [],
  onReplySubmit,
  isReply = false,
}: TakeCardProps) {
  const theme = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [replyExpanded, setReplyExpanded] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const isQueued = take.status === 'queued' || take.status === 'syncing';
  const cardBackground = getTeamCardBackground(take.userClub, theme.colorScheme);
  const showFollowButton =
    currentUserId != null && take.userId !== currentUserId && (onFollow != null || onUnfollow != null);
  const canReply = onReplySubmit != null && !take.parentTakeId;
  const replyCount = replies.length;
  const handleSubmitReply = () => {
    const text = replyDraft.trim();
    if (text.length >= 5) {
      onReplySubmit?.(text);
      setReplyDraft('');
      setReplyExpanded(false);
    }
  };

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
          backgroundColor: cardBackground,
          borderColor: isQueued ? theme.colors.varYellow : theme.colors.border,
          borderWidth: isQueued ? 2 : 1,
        },
      ]}
    >
      {/* Header with queued badge */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text variant="body" style={{ fontWeight: '600' }}>
              {take.userName}
            </Text>
            {showFollowButton && (
              <TouchableOpacity
                onPress={isFollowing ? onUnfollow : onFollow}
                style={[
                  styles.followButton,
                  {
                    backgroundColor: isFollowing ? theme.colors.surface : theme.colors.accent,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {isFollowing ? (
                  <UserCheck size={14} color={theme.colors.textSecondary} />
                ) : (
                  <UserPlus size={14} color="#FFFFFF" />
                )}
                <Text
                  variant="caption"
                  style={{
                    color: isFollowing ? theme.colors.textSecondary : '#FFFFFF',
                    fontWeight: '600',
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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

      {/* Rating summary (hidden for reply cards) */}
      {!isReply && (
        <View
          style={[
            styles.ratingSummary,
            {
              backgroundColor:
                theme.colorScheme === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            Match Rating:
          </Text>
          <Text variant="title" style={{ color: theme.colors.accent }}>
            {take.matchRating}/10
          </Text>
        </View>
      )}

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

      {/* Reply row + inline input (top-level only) */}
      {canReply && (
        <View style={styles.replySection}>
          <TouchableOpacity
            onPress={() => setReplyExpanded(!replyExpanded)}
            style={styles.replyRow}
          >
            <MessageCircle size={18} color={theme.colors.textSecondary} />
            <Text variant="caption" style={{ color: theme.colors.textSecondary, marginLeft: 6 }}>
              {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </Text>
          </TouchableOpacity>
          {replyExpanded && (
            <View style={[styles.replyInputWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.replyInput, { color: theme.colors.text }]}
                placeholder="Write a reply (min 5 chars)..."
                placeholderTextColor={theme.colors.textTertiary ?? theme.colors.textSecondary}
                value={replyDraft}
                onChangeText={setReplyDraft}
                multiline
                maxLength={280}
              />
              <TouchableOpacity
                onPress={handleSubmitReply}
                disabled={replyDraft.trim().length < 5}
                style={[
                  styles.replySubmitButton,
                  {
                    backgroundColor: replyDraft.trim().length >= 5 ? theme.colors.accent : theme.colors.border,
                  },
                ]}
              >
                <Text variant="body" style={{ color: theme.colors.text, fontWeight: '600' }}>
                  Post reply
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Nested replies (top-level only, compact cards) */}
      {!isReply && replyCount > 0 && (
        <View style={styles.repliesList}>
          {replies.map((reply) => (
            <TakeCard
              key={reply.id}
              take={reply}
              onReaction={onReaction}
              isReply
            />
          ))}
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
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
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
    borderRadius: 8,
  },
  takeText: {
    marginBottom: 12,
    lineHeight: 22,
  },
  replySection: {
    marginTop: 12,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyInputWrap: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  replyInput: {
    minHeight: 64,
    fontSize: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  replySubmitButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  repliesList: {
    marginTop: 12,
    marginLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(128,128,128,0.3)',
    paddingLeft: 12,
  },
});
