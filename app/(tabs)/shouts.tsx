import { TakeCard } from '@/src/components/TakeCard';
import { Text } from '@/src/components/Text';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { mockTakes } from '@/src/data/mock/takes';
import { takeRepository } from '@/src/lib/domain/takeRepository';
import { Take, TakeStatus } from '@/src/lib/domain/types';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SortOption = 'hot' | 'top' | 'recent' | 'controversial';
export type TimeFilter = 'today' | 'week' | 'month' | 'all';

export default function ShoutsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [localTakes, setLocalTakes] = React.useState<Take[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  // Filtering state (Category 1)
  const [searchQuery, setSearchQuery] = React.useState('');
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('hot');
  const [filterFixtureId, setFilterFixtureId] = React.useState<number | null>(null);
  const [filterTeam, setFilterTeam] = React.useState<string | null>(null);

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

  // Build list of unique teams (clubs) from takes for filter dropdown
  const teamOptions = useMemo(() => {
    const clubs = new Set<string>();
    localTakes.forEach((t) => clubs.add(t.userClub));
    mockTakes.forEach((t) => clubs.add(t.userClub));
    return Array.from(clubs).sort();
  }, [localTakes]);

  // Algorithmic feed: apply filters, then sort
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

    let filtered = Array.from(deduped.values());

    // Time filter
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    if (timeFilter === 'today') {
      filtered = filtered.filter((t) => now - new Date(t.createdAt).getTime() < oneDay);
    } else if (timeFilter === 'week') {
      filtered = filtered.filter((t) => now - new Date(t.createdAt).getTime() < oneWeek);
    } else if (timeFilter === 'month') {
      filtered = filtered.filter((t) => now - new Date(t.createdAt).getTime() < oneMonth);
    }

    // Search: case-insensitive text match
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (t) =>
          t.text.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.userClub.toLowerCase().includes(q)
      );
    }

    // Filter by match (fixture)
    if (filterFixtureId != null) {
      filtered = filtered.filter((t) => t.fixtureId === filterFixtureId);
    }

    // Filter by team (author's club)
    if (filterTeam != null && filterTeam !== '') {
      filtered = filtered.filter((t) => t.userClub === filterTeam);
    }

    // Score for Hot / Controversial
    const scored = filtered.map((take) => {
      const totalReactions =
        take.reactions.cheer + take.reactions.boo + take.reactions.shout;
      const cheerRatio =
        totalReactions > 0
          ? take.reactions.cheer / (take.reactions.cheer + take.reactions.boo || 1)
          : 0;
      const engagement = totalReactions;
      const normalizedEngagement = Math.min(engagement / 200, 1);
      const hotScore = cheerRatio * 0.6 + normalizedEngagement * 0.4;
      // Controversial: close to 50/50 cheer/boo
      const controversialScore = 1 - Math.abs(cheerRatio - 0.5) * 2;
      return {
        take,
        hotScore,
        controversialScore,
        totalReactions,
        createdAt: new Date(take.createdAt).getTime(),
      };
    });

    // Sort
    if (sortBy === 'hot') {
      scored.sort((a, b) => {
        if (Math.abs(a.hotScore - b.hotScore) < 0.01)
          return b.createdAt - a.createdAt;
        return b.hotScore - a.hotScore;
      });
    } else if (sortBy === 'top') {
      scored.sort((a, b) => {
        if (b.totalReactions !== a.totalReactions)
          return b.totalReactions - a.totalReactions;
        return b.createdAt - a.createdAt;
      });
    } else if (sortBy === 'recent') {
      scored.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      // controversial
      scored.sort((a, b) => {
        if (Math.abs(a.controversialScore - b.controversialScore) < 0.01)
          return b.createdAt - a.createdAt;
        return b.controversialScore - a.controversialScore;
      });
    }

    return scored.map((item) => item.take);
  }, [
    localTakes,
    searchQuery,
    timeFilter,
    sortBy,
    filterFixtureId,
    filterTeam,
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTakes();
    setRefreshing(false);
  };

  const timeOptions: { value: TimeFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'hot', label: 'Hot' },
    { value: 'top', label: 'Top' },
    { value: 'recent', label: 'Recent' },
    { value: 'controversial', label: 'Controversial' },
  ];

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

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceElevated ?? theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Search shouts, users, clubs..."
          placeholderTextColor={theme.colors.textTertiary ?? theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Time filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {timeOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setTimeFilter(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  timeFilter === opt.value
                    ? (theme.colors.accent ?? theme.colors.primary)
                    : (theme.colors.surface ?? theme.colors.background),
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              variant="body"
              style={{
                color:
                  timeFilter === opt.value
                    ? '#fff'
                    : theme.colors.textSecondary,
                fontWeight: timeFilter === opt.value ? '600' : '400',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {sortOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setSortBy(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  sortBy === opt.value
                    ? (theme.colors.accent ?? theme.colors.primary)
                    : (theme.colors.surface ?? theme.colors.background),
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              variant="body"
              style={{
                color:
                  sortBy === opt.value ? '#fff' : theme.colors.textSecondary,
                fontWeight: sortBy === opt.value ? '600' : '400',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filter by match */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        <Pressable
          onPress={() => setFilterFixtureId(null)}
          style={[
            styles.chip,
            {
              backgroundColor:
                filterFixtureId === null
                  ? (theme.colors.accent ?? theme.colors.primary)
                  : (theme.colors.surface ?? theme.colors.background),
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            variant="body"
            style={{
              color:
                filterFixtureId === null ? '#fff' : theme.colors.textSecondary,
              fontWeight: filterFixtureId === null ? '600' : '400',
            }}
          >
            All matches
          </Text>
        </Pressable>
        {mockFixtures.map((fixture) => {
          const label = `${fixture.homeTeam.name} v ${fixture.awayTeam.name}`;
          const selected = filterFixtureId === fixture.id;
          return (
            <Pressable
              key={fixture.id}
              onPress={() => setFilterFixtureId(fixture.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? (theme.colors.accent ?? theme.colors.primary)
                    : (theme.colors.surface ?? theme.colors.background),
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                variant="body"
                numberOfLines={1}
                style={[
                  styles.chipLabel,
                  {
                    color: selected ? '#fff' : theme.colors.textSecondary,
                    fontWeight: selected ? '600' : '400',
                    maxWidth: 140,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filter by team (author club) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        <Pressable
          onPress={() => setFilterTeam(null)}
          style={[
            styles.chip,
            {
              backgroundColor:
                filterTeam === null
                  ? (theme.colors.accent ?? theme.colors.primary)
                  : (theme.colors.surface ?? theme.colors.background),
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            variant="body"
            style={{
              color: filterTeam === null ? '#fff' : theme.colors.textSecondary,
              fontWeight: filterTeam === null ? '600' : '400',
            }}
          >
            All teams
          </Text>
        </Pressable>
        {teamOptions.map((club) => {
          const selected = filterTeam === club;
          return (
            <Pressable
              key={club}
              onPress={() => setFilterTeam(club)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? (theme.colors.accent ?? theme.colors.primary)
                    : (theme.colors.surface ?? theme.colors.background),
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                variant="body"
                style={{
                  color: selected ? '#fff' : theme.colors.textSecondary,
                  fontWeight: selected ? '600' : '400',
                }}
              >
                {club}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
              {searchQuery.trim() || filterFixtureId != null || filterTeam != null || timeFilter !== 'all'
                ? 'No shouts match your filters. Try changing filters or search.'
                : 'No shouts yet. Be the first to share your take!'}
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
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  chipScroll: {
    marginBottom: 8,
    maxHeight: 44,
  },
  chipRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipLabel: {
    maxWidth: 140,
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
