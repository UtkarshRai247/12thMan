import { MatchCard } from '@/src/components/MatchCard';
import { TakeCard } from '@/src/components/TakeCard';
import { Text } from '@/src/components/Text';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { mockTakes } from '@/src/data/mock/takes';
import { takeRepository } from '@/src/lib/domain/takeRepository';
import { Take, TakeStatus } from '@/src/lib/domain/types';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type FeedType = 'forYou' | 'following';
type TakeFilter = 'all' | 'posted' | 'queued' | 'failed';

export default function FeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [feedType, setFeedType] = useState<FeedType>('forYou');
  const [takeFilter, setTakeFilter] = useState<TakeFilter>('all');
  const [localTakes, setLocalTakes] = useState<Take[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load local takes when screen is focused
  const loadTakes = async () => {
    const takes = await takeRepository.getAll();
    setLocalTakes(takes);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTakes();
    }, [])
  );

  // Sort, dedupe, and filter takes
  const processedTakes = useMemo(() => {
    // Combine local takes and mock takes
    const allTakes = [
      ...localTakes,
      ...mockTakes.map((take) => ({
        id: take.id,
        clientId: take.id,
        userId: take.userId,
        userName: take.userName,
        userClub: take.userClub,
        fixtureId: take.fixtureId,
        matchRating: take.matchRating,
        motmPlayerId: take.motmPlayerId,
        text: take.text,
        reactions: take.reactions,
        status: 'posted' as TakeStatus,
        retryCount: 0,
        createdAt: take.createdAt,
      })),
    ];

    // Dedupe by clientId (keep newest by createdAt)
    const deduped = new Map<string, Take>();
    allTakes.forEach((take) => {
      const existing = deduped.get(take.clientId);
      if (!existing || new Date(take.createdAt) > new Date(existing.createdAt)) {
        deduped.set(take.clientId, take);
      }
    });

    // Filter by status
    let filtered = Array.from(deduped.values());
    if (takeFilter !== 'all') {
      filtered = filtered.filter((take) => {
        if (takeFilter === 'queued') {
          return take.status === 'queued' || take.status === 'syncing';
        }
        return take.status === takeFilter;
      });
    }

    // Sort by createdAt desc (or syncedAt for posted takes)
    filtered.sort((a, b) => {
      const aTime = a.status === 'posted' && a.syncedAt ? a.syncedAt : a.createdAt;
      const bTime = b.status === 'posted' && b.syncedAt ? b.syncedAt : b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return filtered;
  }, [localTakes, takeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTakes();
    setRefreshing(false);
  };

  const handleMatchPress = (fixtureId: number) => {
    router.push(`/match/${fixtureId}`);
  };

  const handleRatePress = (fixtureId: number) => {
    router.push(`/match/${fixtureId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Pill switcher */}
      <View style={[styles.switcher, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => setFeedType('forYou')}
          style={[
            styles.pill,
            feedType === 'forYou' && {
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text
            variant="body"
            style={[
              styles.pillText,
              {
                color: feedType === 'forYou' ? '#FFFFFF' : theme.colors.textSecondary,
                fontWeight: feedType === 'forYou' ? '600' : '400',
              },
            ]}
          >
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFeedType('following')}
          style={[
            styles.pill,
            feedType === 'following' && {
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text
            variant="body"
            style={[
              styles.pillText,
              {
                color: feedType === 'following' ? '#FFFFFF' : theme.colors.textSecondary,
                fontWeight: feedType === 'following' ? '600' : '400',
              },
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'posted', 'queued', 'failed'] as TakeFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setTakeFilter(filter)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  takeFilter === filter ? theme.colors.accent : theme.colors.surface,
                borderColor: takeFilter === filter ? theme.colors.accent : theme.colors.border,
              },
            ]}
          >
            <Text
              variant="caption"
              style={{
                color: takeFilter === filter ? '#FFFFFF' : theme.colors.text,
                fontWeight: takeFilter === filter ? '600' : '400',
                textTransform: 'capitalize',
              }}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Match cards */}
        {mockFixtures.map((fixture) => (
          <MatchCard
            key={fixture.id}
            fixture={fixture}
            onPress={() => handleMatchPress(fixture.id)}
            onRatePress={
              fixture.status === 'FT'
                ? () => handleRatePress(fixture.id)
                : undefined
            }
          />
        ))}

        {/* Takes */}
        {processedTakes.length > 0 ? (
          processedTakes.map((take) => (
            <TakeCard
              key={take.id}
              take={take}
              onEdit={async (takeToEdit) => {
                // Convert take to draft
                const { draftRepository } = await import('@/src/lib/domain/draftRepository');
                await draftRepository.saveDraft({
                  fixtureId: takeToEdit.fixtureId,
                  matchRating: takeToEdit.matchRating,
                  motmPlayerId: takeToEdit.motmPlayerId ?? null,
                  text: takeToEdit.text,
                });
                // Store take ID for editing
                await import('@/src/lib/storage/storage').then(({ storage, STORAGE_KEYS }) =>
                  storage.set('@12thman:editing_take_id', takeToEdit.id)
                );
                router.push('/(tabs)/post');
              }}
              onDelete={async (takeToDelete) => {
                await takeRepository.delete(takeToDelete.id);
                await loadTakes();
              }}
              onRetry={async (takeToRetry) => {
                await takeRepository.updateStatus(takeToRetry.id, 'queued');
                await takeRepository.update(takeToRetry.id, {
                  errorMessage: undefined,
                  lastAttemptAt: undefined,
                });
                await loadTakes();
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              {takeFilter === 'all'
                ? 'No takes yet'
                : takeFilter === 'queued'
                  ? 'No queued takes'
                  : takeFilter === 'failed'
                    ? 'No failed takes'
                    : 'No posted takes'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switcher: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterContent: {
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});
