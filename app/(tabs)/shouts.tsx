import { TakeCard } from '@/src/components/TakeCard';
import { Text } from '@/src/components/Text';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { mockTakes } from '@/src/data/mock/takes';
import { takeRepository } from '@/src/lib/domain/takeRepository';
import { followRepository } from '@/src/lib/domain/followRepository';
import { Take, TakeStatus, LocalUser } from '@/src/lib/domain/types';
import { userRepository } from '@/src/lib/domain/userRepository';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SortOption = 'hot' | 'top' | 'recent' | 'controversial';
export type TimeFilter = 'today' | 'week' | 'month' | 'all';
export type FeedFilter = 'all' | 'by_league' | 'following' | 'my_team';

export default function ShoutsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [localTakes, setLocalTakes] = React.useState<Take[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<LocalUser | null>(null);
  const [followingIds, setFollowingIds] = React.useState<string[]>([]);

  // Filtering state (Category 1)
  const [searchQuery, setSearchQuery] = React.useState('');
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('hot');
  const [feedFilter, setFeedFilter] = React.useState<FeedFilter>('all');
  const [filterLeagueId, setFilterLeagueId] = React.useState<number | null>(null);
  const [myTeamClub, setMyTeamClub] = React.useState<string | null>(null);

  // Reddit-style dropdown: which menu is open (null = none)
  const [openDropdown, setOpenDropdown] = React.useState<'sort' | 'time' | 'filter' | null>(null);
  // By league sub-dropdown expanded (inside Sort by menu)
  const [leagueDropdownExpanded, setLeagueDropdownExpanded] = React.useState(false);

  // Load local takes when screen is focused
  const loadTakes = async () => {
    const takes = await takeRepository.getAll();
    setLocalTakes(takes);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTakes();
      userRepository.getCurrentUser().then((user) => {
        setCurrentUser(user ?? null);
        setMyTeamClub(user?.userClub ?? null);
      });
      followRepository.getFollowing().then(setFollowingIds);
    }, [])
  );

  // Build list of unique leagues from fixtures for filter dropdown
  const leagueOptions = useMemo(() => {
    const byId = new Map<number, { id: number; name: string }>();
    mockFixtures.forEach((f) => {
      if (!byId.has(f.league.id)) byId.set(f.league.id, { id: f.league.id, name: f.league.name });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Algorithmic feed: apply filters, then sort
  const algorithmicShouts = useMemo(() => {
    // Combine local takes and mock takes
    const allTakes: Take[] = [
      ...localTakes,
      ...mockTakes.map((take) => ({
        id: take.id,
        clientId: take.id,
        parentTakeId: undefined as string | undefined,
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

    // Only top-level takes in feed (exclude thread replies from main list)
    filtered = filtered.filter((t) => !t.parentTakeId);

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

    // Feed filter: By league, Following, My team
    if (feedFilter === 'by_league' && filterLeagueId != null) {
      const fixtureIdsInLeague = new Set(
        mockFixtures.filter((f) => f.league.id === filterLeagueId).map((f) => f.id)
      );
      filtered = filtered.filter((t) => fixtureIdsInLeague.has(t.fixtureId));
    } else if (feedFilter === 'following') {
      const followingSet = new Set(followingIds);
      filtered = filtered.filter((t) => followingSet.has(t.userId));
    } else if (feedFilter === 'my_team' && myTeamClub != null) {
      filtered = filtered.filter((t) => t.userClub === myTeamClub);
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

    const list = scored.map((item) => item.take);
    // Build replies map (parentTakeId -> replies) from all deduped takes
    const repliesByParent = new Map<string, Take[]>();
    Array.from(deduped.values()).forEach((t) => {
      if (t.parentTakeId) {
        const arr = repliesByParent.get(t.parentTakeId) ?? [];
        arr.push(t);
        repliesByParent.set(t.parentTakeId, arr);
      }
    });
    repliesByParent.forEach((arr) =>
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );
    return { list, repliesByParent };
  }, [
    localTakes,
    searchQuery,
    timeFilter,
    sortBy,
    feedFilter,
    filterLeagueId,
    myTeamClub,
    followingIds,
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

  const sortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? 'Hot';
  const timeLabel = timeOptions.find((o) => o.value === timeFilter)?.label ?? 'All Time';
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

      {/* Row: Sort by (left), Hot (middle), Time (right) */}
      <View style={[styles.dropdownRow, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          style={[styles.dropdownButton, { backgroundColor: theme.colors.surface ?? theme.colors.background }]}
          onPress={() => {
            setOpenDropdown(openDropdown === 'filter' ? null : 'filter');
            if (openDropdown !== 'filter') setLeagueDropdownExpanded(false);
          }}
        >
          <Text variant="body" numberOfLines={1} style={[styles.dropdownLabel, { color: theme.colors.text, fontWeight: '500' }]}>
            Sort by
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>⌄</Text>
        </Pressable>
        <Pressable
          style={[styles.dropdownButton, { backgroundColor: theme.colors.surface ?? theme.colors.background }]}
          onPress={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
        >
          <Text variant="body" style={{ color: theme.colors.text, fontWeight: '500' }}>
            {sortLabel}
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>⌄</Text>
        </Pressable>
        <Pressable
          style={[
            styles.dropdownButton,
            styles.dropdownButtonLast,
            { backgroundColor: theme.colors.surface ?? theme.colors.background },
          ]}
          onPress={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
        >
          <Text variant="body" style={{ color: theme.colors.text, fontWeight: '500' }}>
            {timeLabel}
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>⌄</Text>
        </Pressable>
      </View>

      {/* Dropdown modal (Reddit-style menu) */}
      <Modal
        visible={openDropdown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenDropdown(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpenDropdown(null)}>
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: theme.colors.surfaceElevated ?? theme.colors.surface ?? theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {openDropdown === 'sort' && (
              <>
                <Text variant="body" style={[styles.menuHeader, { color: theme.colors.textSecondary }]}>
                  Sort by
                </Text>
                {sortOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setSortBy(opt.value);
                      setOpenDropdown(null);
                    }}
                    style={[
                      styles.menuItem,
                      sortBy === opt.value && {
                        backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700],
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color: theme.colors.text,
                        fontWeight: sortBy === opt.value ? '600' : '400',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
            {openDropdown === 'time' && (
              <>
                <Text variant="body" style={[styles.menuHeader, { color: theme.colors.textSecondary }]}>
                  Time
                </Text>
                {timeOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setTimeFilter(opt.value);
                      setOpenDropdown(null);
                    }}
                    style={[
                      styles.menuItem,
                      timeFilter === opt.value && {
                        backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700],
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color: theme.colors.text,
                        fontWeight: timeFilter === opt.value ? '600' : '400',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
            {openDropdown === 'filter' && (
              <>
                <Text variant="body" style={[styles.menuHeader, { color: theme.colors.textSecondary }]}>
                  Sort by
                </Text>
                <Pressable
                  onPress={() => {
                    setFeedFilter('all');
                    setFilterLeagueId(null);
                    setOpenDropdown(null);
                  }}
                  style={[
                    styles.menuItem,
                    feedFilter === 'all' && {
                      backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700],
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={{
                      color: theme.colors.text,
                      fontWeight: feedFilter === 'all' ? '600' : '400',
                    }}
                  >
                    All
                  </Text>
                </Pressable>
                <Text variant="body" style={[styles.menuSectionLabel, { color: theme.colors.textSecondary }]}>
                  By league
                </Text>
                <Pressable
                  onPress={() => setLeagueDropdownExpanded(!leagueDropdownExpanded)}
                  style={[
                    styles.menuItem,
                    styles.menuItemRow,
                    feedFilter === 'by_league' && {
                      backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700],
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={{
                      color: theme.colors.text,
                      fontWeight: feedFilter === 'by_league' ? '600' : '400',
                    }}
                  >
                    All leagues
                  </Text>
                  <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
                    {leagueDropdownExpanded ? '⌃' : '⌄'}
                  </Text>
                </Pressable>
                {leagueDropdownExpanded && (
                  <ScrollView
                    style={styles.leagueDropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    <Pressable
                      onPress={() => {
                        setFeedFilter('by_league');
                        setFilterLeagueId(null);
                        setOpenDropdown(null);
                      }}
                      style={[
                        styles.menuItem,
                        feedFilter === 'by_league' && filterLeagueId === null && {
                          backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700],
                        },
                      ]}
                    >
                      <Text
                        variant="body"
                        style={{
                          color: theme.colors.text,
                          fontWeight: feedFilter === 'by_league' && filterLeagueId === null ? '600' : '400',
                        }}
                      >
                        All leagues
                      </Text>
                    </Pressable>
                    {leagueOptions.map((league) => {
                      const selected = feedFilter === 'by_league' && filterLeagueId === league.id;
                      return (
                        <Pressable
                          key={league.id}
                          onPress={() => {
                            setFeedFilter('by_league');
                            setFilterLeagueId(league.id);
                            setOpenDropdown(null);
                          }}
                          style={[styles.menuItem, selected && { backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700] }]}
                        >
                          <Text variant="body" style={{ color: theme.colors.text, fontWeight: selected ? '600' : '400' }}>
                            {league.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
                <Text variant="body" style={[styles.menuSectionLabel, { color: theme.colors.textSecondary }]}>
                  Following
                </Text>
                <Pressable
                  onPress={() => {
                    setFeedFilter('following');
                    setOpenDropdown(null);
                  }}
                  style={[
                    styles.menuItem,
                    feedFilter === 'following' && {
                      backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700],
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={{
                      color: theme.colors.text,
                      fontWeight: feedFilter === 'following' ? '600' : '400',
                    }}
                  >
                    Following
                  </Text>
                </Pressable>
                <Text variant="body" style={[styles.menuSectionLabel, { color: theme.colors.textSecondary }]}>
                  My team
                </Text>
                <Pressable
                  onPress={() => {
                    setFeedFilter('my_team');
                    setOpenDropdown(null);
                  }}
                  style={[
                    styles.menuItem,
                    feedFilter === 'my_team' && {
                      backgroundColor: theme.colors.surface ?? theme.colors.neutrals?.[700],
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={{
                      color: theme.colors.text,
                      fontWeight: feedFilter === 'my_team' ? '600' : '400',
                    }}
                  >
                    My team
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {algorithmicShouts.list.length > 0 ? (
          algorithmicShouts.list.map((take) => (
            <TakeCard
              key={take.id}
              take={take}
              currentUserId={currentUser?.userId}
              isFollowing={followingIds.includes(take.userId)}
              onFollow={async () => {
                await followRepository.follow(take.userId);
                setFollowingIds(await followRepository.getFollowing());
              }}
              onUnfollow={async () => {
                await followRepository.unfollow(take.userId);
                setFollowingIds(await followRepository.getFollowing());
              }}
              replies={algorithmicShouts.repliesByParent.get(take.id) ?? []}
              onReplySubmit={async (text) => {
                if (!currentUser) return;
                await takeRepository.create({
                  userId: currentUser.userId,
                  userName: currentUser.userName,
                  userClub: currentUser.userClub,
                  fixtureId: take.fixtureId,
                  matchRating: take.matchRating,
                  text,
                  reactions: { cheer: 0, boo: 0, shout: 0 },
                  parentTakeId: take.id,
                });
                await loadTakes();
              }}
              onEdit={async (takeToEdit) => {
                const { draftRepository } = await import('@/src/lib/domain/draftRepository');
                await draftRepository.saveDraft({
                  fixtureId: takeToEdit.fixtureId,
                  matchRating: takeToEdit.matchRating,
                  motmPlayerId: takeToEdit.motmPlayerId ?? null,
                  text: takeToEdit.text,
                });
                await import('@/src/lib/storage/storage').then(({ storage }) =>
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
              {searchQuery.trim() || feedFilter !== 'all' || filterLeagueId != null || timeFilter !== 'all'
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
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  dropdownButtonLast: {
    marginRight: 0,
  },
  dropdownLabel: {
    flex: 1,
    minWidth: 0,
  },
  chevron: {
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 80,
    alignItems: 'flex-start',
  },
  dropdownMenu: {
    minWidth: 220,
    maxWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leagueDropdownScroll: {
    maxHeight: 200,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuSectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 12,
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
