import { PlayerCard } from '@/src/components/PlayerCard';
import { TakeCard } from '@/src/components/TakeCard';
import { TerraceDial } from '@/src/components/TerraceDial';
import { Text } from '@/src/components/Text';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { mockPlayers } from '@/src/data/mock/players';
import { mockTakes } from '@/src/data/mock/takes';
import { takeRepository } from '@/src/lib/domain/takeRepository';
import { followRepository } from '@/src/lib/domain/followRepository';
import { userRepository } from '@/src/lib/domain/userRepository';
import { LocalUser } from '@/src/lib/domain/types';
import { Take, TakeStatus } from '@/src/lib/domain/types';
import { MatchStatus } from '@/src/lib/apiFootball/types';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useLayoutEffect, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerStyle: {
        backgroundColor: theme.colors.background,
      },
      headerTintColor: theme.colors.text,
      headerTitleStyle: {
        color: theme.colors.text,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingLeft: 0, paddingRight: 8, paddingVertical: 8 }}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, theme]);

  const fixture = mockFixtures.find((f) => f.id === Number(id));
  const [user, setUser] = useState<LocalUser | null>(null);
  const [matchRating, setMatchRating] = useState<number | null>(null);
  const [motmPlayerId, setMotmPlayerId] = useState<number | null>(null);
  const [playerRatings, setPlayerRatings] = useState<Record<number, number>>({});
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [teamRatingHome, setTeamRatingHome] = useState<number | null>(null);
  const [teamRatingAway, setTeamRatingAway] = useState<number | null>(null);
  const [teamRatingPickerOpen, setTeamRatingPickerOpen] = useState(false);
  const [shoutText, setShoutText] = useState('');
  const [matchShouts, setMatchShouts] = useState<Take[]>([]);
  const [shoutSubmitting, setShoutSubmitting] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    userRepository.getCurrentUser().then(setUser);
  }, []);

  const fixtureIdNum = Number(id) || 0;
  const loadShouts = React.useCallback(async () => {
    if (!fixtureIdNum) return;
    const local = await takeRepository.getAll();
    const forFixture = (t: Take) => t.fixtureId === fixtureIdNum;
    const combined: Take[] = [
      ...local.filter(forFixture),
      ...mockTakes.filter((t) => t.fixtureId === fixtureIdNum).map((t) => ({
        id: t.id,
        clientId: t.id,
        parentTakeId: undefined as string | undefined,
        userId: t.userId,
        userName: t.userName,
        userClub: t.userClub,
        fixtureId: t.fixtureId,
        matchRating: t.matchRating,
        motmPlayerId: t.motmPlayerId,
        text: t.text,
        reactions: { cheer: t.reactions.cheer, boo: t.reactions.boo, shout: t.reactions.shout },
        status: 'posted' as TakeStatus,
        retryCount: 0,
        createdAt: t.createdAt,
      })),
    ];
    const deduped = Array.from(
      new Map(combined.map((t) => [t.clientId, t])).values()
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setMatchShouts(deduped);
  }, [fixtureIdNum]);

  useFocusEffect(
    React.useCallback(() => {
      loadShouts();
      followRepository.getFollowing().then(setFollowingIds);
    }, [loadShouts])
  );

  if (!fixture) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="h2">Match not found</Text>
      </View>
    );
  }

  // Get players for this match
  const homePlayers = mockPlayers.filter((p) => p.teamId === fixture.homeTeam.id);
  const awayPlayers = mockPlayers.filter((p) => p.teamId === fixture.awayTeam.id);
  const displayedPlayers = selectedTeam === 'home' ? homePlayers : awayPlayers;

  // User supports one of the two teams → fan view (shout box + rate match + rate players)
  const isUserFanOfMatch =
    user?.userClub === fixture.homeTeam.name || user?.userClub === fixture.awayTeam.name;

  // Only fans of the selected team can view/rate the team rating and rate players
  const isUserFanOfSelectedTeam =
    (selectedTeam === 'home' && user?.userClub === fixture.homeTeam.name) ||
    (selectedTeam === 'away' && user?.userClub === fixture.awayTeam.name);
  const selectedTeamName = selectedTeam === 'home' ? fixture.homeTeam.name : fixture.awayTeam.name;
  const selectedTeamRating = selectedTeam === 'home' ? teamRatingHome : teamRatingAway;
  const setSelectedTeamRating = selectedTeam === 'home' ? setTeamRatingHome : setTeamRatingAway;

  const handleShoutSubmit = async () => {
    const text = shoutText.trim();
    if (!text || !user || text.length < 5) return;
    setShoutSubmitting(true);
    try {
      const newTake = await takeRepository.create({
        userId: user.userId,
        userName: user.userName,
        userClub: user.userClub,
        fixtureId: fixture.id,
        matchRating: matchRating ?? 5,
        motmPlayerId: motmPlayerId ?? undefined,
        text,
        reactions: { cheer: 0, boo: 0, shout: 0 },
      });
      setShoutText('');
      setMatchShouts((prev) => [newTake, ...prev]);
    } finally {
      setShoutSubmitting(false);
    }
  };

  // Average match rating from all shouts for this fixture
  const averageMatchRating =
    matchShouts.length > 0
      ? matchShouts.reduce((sum, t) => sum + t.matchRating, 0) / matchShouts.length
      : null;

  // Mock average player ratings from fans (would come from backend in production)
  const getMockFanAverage = (playerId: number): number => {
    const seed = (playerId * 17) % 100;
    return 6 + (seed / 100) * 2.5; // 6.0 to 8.5
  };

  // Mock goal scorers for finished matches
  const goalScorers = fixture.status === MatchStatus.FINISHED && fixture.score.home !== null && fixture.score.away !== null
    ? [
        { name: 'Olmo', minute: 52, team: 'home' },
        { name: 'Raphinha', minute: 57, team: 'home' },
        { name: 'Lamine Yamal', minute: 73, team: 'home' },
      ]
    : [];

  const handlePlayerRating = (playerId: number, rating: number) => {
    setPlayerRatings((prev) => ({ ...prev, [playerId]: rating }));
  };

  const handleMOTMPress = (playerId: number) => {
    setMotmPlayerId(motmPlayerId === playerId ? null : playerId);
  };

  const getStatusText = () => {
    switch (fixture.status) {
      case MatchStatus.FINISHED:
        return 'Full time';
      case MatchStatus.LIVE:
        return 'Live';
      case MatchStatus.UPCOMING:
        return new Date(fixture.timestamp * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top * 0.4 }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Match Header - FotMob Style */}
        <View style={styles.matchHeader}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={[styles.teamCrest, { backgroundColor: theme.colors.surface }]}>
              <Text variant="h2" style={{ color: theme.colors.textSecondary }}>
                {fixture.homeTeam.code}
              </Text>
            </View>
            <Text variant="body" style={[styles.teamName, { color: theme.colors.text }]}>
              {fixture.homeTeam.name}
            </Text>
          </View>

          {/* Score */}
          <View style={styles.scoreSection}>
            {fixture.score.home !== null && fixture.score.away !== null ? (
              <Text variant="h1" style={[styles.score, { color: theme.colors.text }]}>
                {fixture.score.home} - {fixture.score.away}
              </Text>
            ) : (
              <Text variant="h2" style={[styles.score, { color: theme.colors.textSecondary }]}>
                {new Date(fixture.timestamp * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            )}
            <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
              {getStatusText()}
            </Text>
            {averageMatchRating != null && (
              <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
                Average match rating: {averageMatchRating.toFixed(1)}/10
              </Text>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamSection}>
            <View style={[styles.teamCrest, { backgroundColor: theme.colors.surface }]}>
              <Text variant="h2" style={{ color: theme.colors.textSecondary }}>
                {fixture.awayTeam.code}
              </Text>
            </View>
            <Text variant="body" style={[styles.teamName, { color: theme.colors.text }]}>
              {fixture.awayTeam.name}
            </Text>
          </View>
        </View>

        {/* Goal Scorers */}
        {goalScorers.length > 0 && (
          <View style={[styles.goalScorersSection, { borderTopColor: theme.colors.border }]}>
            {goalScorers.map((scorer, index) => (
              <View key={index} style={styles.goalScorerRow}>
                <Text variant="body" style={{ color: theme.colors.text }}>
                  {scorer.name} {scorer.minute}'
                </Text>
              </View>
            ))}
          </View>
        )}

        {isUserFanOfMatch ? (
          /* ---------- FAN VIEW ---------- */
          <>
            {/* Shout box - just below the score */}
            <View
              style={[
                styles.section,
                styles.shoutSection,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text variant="title" style={styles.sectionTitle}>
                Your shout
              </Text>
              <TextInput
                style={[
                  styles.shoutInput,
                  {
                    backgroundColor: theme.colors.surfaceElevated ?? theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Share your take on this match..."
                placeholderTextColor={theme.colors.textTertiary ?? theme.colors.textSecondary}
                value={shoutText}
                onChangeText={setShoutText}
                multiline
                numberOfLines={3}
                maxLength={280}
                editable={!shoutSubmitting}
              />
              <TouchableOpacity
                onPress={handleShoutSubmit}
                disabled={!shoutText.trim() || shoutText.trim().length < 5 || shoutSubmitting}
                style={[
                  styles.shoutSubmitBtn,
                  {
                    backgroundColor:
                      shoutText.trim().length >= 5 && !shoutSubmitting
                        ? theme.colors.accent
                        : (theme.colors.textTertiary ?? theme.colors.textSecondary),
                  },
                ]}
              >
                <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {shoutSubmitting ? 'Posting...' : 'Post shout'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Rate the Match */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text variant="title" style={styles.sectionTitle}>
                Rate the Match
              </Text>
              <TerraceDial
                value={matchRating}
                onValueChange={setMatchRating}
                showAverage={true}
                averageRating={7.5}
              />
            </View>

            {/* Team Ratings */}
            <View style={styles.playersSection}>
              <View style={styles.playersHeader}>
                <Text variant="title" style={styles.sectionTitle}>
                  Team Ratings
                </Text>
                {/* Team Selection */}
                <View style={styles.teamSelector}>
                  <TouchableOpacity
                    onPress={() => setSelectedTeam('home')}
                    style={[
                      styles.teamButton,
                      {
                        backgroundColor: selectedTeam === 'home' ? theme.colors.accent : theme.colors.surface,
                        borderColor: selectedTeam === 'home' ? theme.colors.accent : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color: selectedTeam === 'home' ? '#FFFFFF' : theme.colors.text,
                        fontWeight: selectedTeam === 'home' ? '600' : '400',
                      }}
                    >
                      {fixture.homeTeam.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedTeam('away')}
                    style={[
                      styles.teamButton,
                      {
                        backgroundColor: selectedTeam === 'away' ? theme.colors.accent : theme.colors.surface,
                        borderColor: selectedTeam === 'away' ? theme.colors.accent : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color: selectedTeam === 'away' ? '#FFFFFF' : theme.colors.text,
                        fontWeight: selectedTeam === 'away' ? '600' : '400',
                      }}
                    >
                      {fixture.awayTeam.name}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Team rating (1-10) - only visible to fans of the selected team */}
                {isUserFanOfSelectedTeam && (
                  <View style={styles.teamRatingRow}>
                    <Text variant="body" style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
                      Rate {selectedTeamName}
                    </Text>
                    <Pressable
                      onPress={() => setTeamRatingPickerOpen(true)}
                      style={[
                        styles.teamRatingDropdown,
                        {
                          backgroundColor: theme.colors.surfaceElevated ?? theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text variant="body" style={{ color: theme.colors.text }}>
                        {selectedTeamRating != null ? `${selectedTeamRating}/10` : 'Select rating (1-10)'}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>⌄</Text>
                    </Pressable>
                  </View>
                )}
                {!isUserFanOfSelectedTeam && user?.userClub && (
                  <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
                    Only {selectedTeamName} fans can rate this team and its players.
                  </Text>
                )}
              </View>
              {displayedPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  rating={playerRatings[player.id] || null}
                  averageRating={getMockFanAverage(player.id)}
                  teamName={selectedTeamName}
                  onRatingChange={isUserFanOfSelectedTeam ? (rating) => handlePlayerRating(player.id, rating) : undefined}
                  isMOTM={motmPlayerId === player.id}
                  onMOTMPress={isUserFanOfSelectedTeam ? () => handleMOTMPress(player.id) : undefined}
                  showRating={isUserFanOfSelectedTeam}
                />
              ))}
            </View>
          </>
        ) : (
          /* ---------- NEUTRAL VIEW ---------- */
          <>
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text variant="title" style={styles.sectionTitle}>
                What fans are shouting
              </Text>
              {(() => {
                const topLevel = matchShouts.filter((t) => !t.parentTakeId);
                const repliesByParent = new Map<string, Take[]>();
                matchShouts.forEach((t) => {
                  if (t.parentTakeId) {
                    const arr = repliesByParent.get(t.parentTakeId) ?? [];
                    arr.push(t);
                    repliesByParent.set(t.parentTakeId, arr);
                  }
                });
                Object.values(repliesByParent).forEach((arr: Take[]) =>
                  arr.sort((a: Take, b: Take) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                );
                if (topLevel.length === 0) {
                  return (
                    <Text variant="body" style={{ color: theme.colors.textSecondary }}>
                      No shouts for this match yet.
                    </Text>
                  );
                }
                return topLevel.map((take) => (
                  <TakeCard
                    key={take.id}
                    take={take}
                    currentUserId={user?.userId}
                    isFollowing={followingIds.includes(take.userId)}
                    onFollow={async () => {
                      await followRepository.follow(take.userId);
                      setFollowingIds(await followRepository.getFollowing());
                    }}
                    onUnfollow={async () => {
                      await followRepository.unfollow(take.userId);
                      setFollowingIds(await followRepository.getFollowing());
                    }}
                    replies={repliesByParent.get(take.id) ?? []}
                    onReplySubmit={async (text) => {
                      if (!user) return;
                      await takeRepository.create({
                        userId: user.userId,
                        userName: user.userName,
                        userClub: user.userClub,
                        fixtureId: take.fixtureId,
                        matchRating: take.matchRating,
                        text,
                        reactions: { cheer: 0, boo: 0, shout: 0 },
                        parentTakeId: take.id,
                      });
                      await loadShouts();
                    }}
                    onReaction={() => {}}
                  />
                ));
              })()}
            </View>

            <View style={styles.playersSection}>
              <View style={styles.playersHeader}>
                <Text variant="title" style={styles.sectionTitle}>
                  Player ratings
                </Text>
                <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: -8 }}>
                  Average ratings from fans of each team
                </Text>
                <View style={styles.teamSelector}>
                  <TouchableOpacity
                    onPress={() => setSelectedTeam('home')}
                    style={[
                      styles.teamButton,
                      {
                        backgroundColor: selectedTeam === 'home' ? theme.colors.accent : theme.colors.surface,
                        borderColor: selectedTeam === 'home' ? theme.colors.accent : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color: selectedTeam === 'home' ? '#FFFFFF' : theme.colors.text,
                        fontWeight: selectedTeam === 'home' ? '600' : '400',
                      }}
                    >
                      {fixture.homeTeam.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedTeam('away')}
                    style={[
                      styles.teamButton,
                      {
                        backgroundColor: selectedTeam === 'away' ? theme.colors.accent : theme.colors.surface,
                        borderColor: selectedTeam === 'away' ? theme.colors.accent : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color: selectedTeam === 'away' ? '#FFFFFF' : theme.colors.text,
                        fontWeight: selectedTeam === 'away' ? '600' : '400',
                      }}
                    >
                      {fixture.awayTeam.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {displayedPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  averageRating={getMockFanAverage(player.id)}
                  teamName={selectedTeamName}
                  showRating={false}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Team rating dropdown modal (1-10) */}
      <Modal
        visible={teamRatingPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTeamRatingPickerOpen(false)}
      >
        <Pressable style={styles.teamRatingOverlay} onPress={() => setTeamRatingPickerOpen(false)}>
          <View
            style={[
              styles.teamRatingPicker,
              {
                backgroundColor: theme.colors.surfaceElevated ?? theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text variant="title" style={{ color: theme.colors.text, marginBottom: 12 }}>
              Rate {selectedTeamName}
            </Text>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <Pressable
                key={n}
                onPress={() => {
                  setSelectedTeamRating(n);
                  setTeamRatingPickerOpen(false);
                }}
                style={[
                  styles.teamRatingOption,
                  selectedTeamRating === n && {
                    backgroundColor: theme.colors.accent,
                  },
                ]}
              >
                <Text
                  variant="body"
                  style={{
                    color: selectedTeamRating === n ? '#FFFFFF' : theme.colors.text,
                    fontWeight: selectedTeamRating === n ? '600' : '400',
                  }}
                >
                  {n}/10
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamCrest: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamName: {
    textAlign: 'center',
    fontSize: 14,
  },
  scoreSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  score: {
    fontSize: 36,
    fontWeight: '700',
  },
  goalScorersSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  goalScorerRow: {
    paddingVertical: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  shoutSection: {},
  shoutInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 88,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 12,
  },
  shoutSubmitBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  playersSection: {
    marginTop: 8,
  },
  playersHeader: {
    marginBottom: 16,
  },
  teamSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  teamButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  teamRatingRow: {
    marginTop: 16,
  },
  teamRatingDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  teamRatingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  teamRatingPicker: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  teamRatingOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
});
