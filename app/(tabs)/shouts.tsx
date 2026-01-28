import { TakeCard } from '@/src/components/TakeCard';
import { Text } from '@/src/components/Text';
import { mockTakes } from '@/src/data/mock/takes';
import { takeRepository } from '@/src/lib/domain/takeRepository';
import { Take, TakeStatus } from '@/src/lib/domain/types';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShoutsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [localTakes, setLocalTakes] = React.useState<Take[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

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

  // Algorithmic feed: Sort by cheer ratio (cheers / total reactions) and total engagement
  const algorithmicShouts = useMemo(() => {
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
        reactions: {
          cheer: take.reactions.cheer,
          boo: take.reactions.boo,
          shout: take.reactions.shout,
        },
        status: 'posted' as TakeStatus,
        retryCount: 0,
        createdAt: take.createdAt,
      })),
    ];

    // Dedupe by clientId
    const deduped = new Map<string, Take>();
    allTakes.forEach((take) => {
      const existing = deduped.get(take.clientId);
      if (!existing || new Date(take.createdAt) > new Date(existing.createdAt)) {
        deduped.set(take.clientId, take);
      }
    });

    const allTakesArray = Array.from(deduped.values());

    // Calculate score for algorithmic ranking
    // Score = (cheer ratio * 0.6) + (total engagement * 0.4)
    // Cheer ratio = cheers / (cheers + boos)
    // Total engagement = cheers + boos + shouts
    const scored = allTakesArray.map((take) => {
      const totalReactions = take.reactions.cheer + take.reactions.boo + take.reactions.shout;
      const cheerRatio = totalReactions > 0 
        ? take.reactions.cheer / (take.reactions.cheer + take.reactions.boo || 1)
        : 0;
      const engagement = totalReactions;
      
      // Normalize engagement (0-1 scale, assuming max ~200 reactions)
      const normalizedEngagement = Math.min(engagement / 200, 1);
      
      // Score: higher cheer ratio and engagement = better
      const score = cheerRatio * 0.6 + normalizedEngagement * 0.4;
      
      return { take, score };
    });

    // Sort by score descending, then by recency
    return scored
      .sort((a, b) => {
        if (Math.abs(a.score - b.score) < 0.01) {
          // If scores are very close, sort by recency
          return new Date(b.take.createdAt).getTime() - new Date(a.take.createdAt).getTime();
        }
        return b.score - a.score;
      })
      .map((item) => item.take);
  }, [localTakes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTakes();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          Shouts
        </Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          Popular fan takes
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {algorithmicShouts.length > 0 ? (
          algorithmicShouts.map((take) => (
            <TakeCard
              key={take.id}
              take={take}
              onEdit={async (takeToEdit) => {
                const { draftRepository } = await import('@/src/lib/domain/draftRepository');
                await draftRepository.saveDraft({
                  fixtureId: takeToEdit.fixtureId,
                  matchRating: takeToEdit.matchRating,
                  motmPlayerId: takeToEdit.motmPlayerId ?? null,
                  text: takeToEdit.text,
                });
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
              No shouts yet. Be the first to share your take!
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});
