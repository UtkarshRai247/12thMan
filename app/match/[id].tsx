import { PlayerCard } from '@/src/components/PlayerCard';
import { TerraceDial } from '@/src/components/TerraceDial';
import { Text } from '@/src/components/Text';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { mockPlayers } from '@/src/data/mock/players';
import { MatchStatus } from '@/src/lib/apiFootball/types';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [matchRating, setMatchRating] = useState<number | null>(null);
  const [motmPlayerId, setMotmPlayerId] = useState<number | null>(null);
  const [playerRatings, setPlayerRatings] = useState<Record<number, number>>({});
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

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

        {/* Content */}
        {(
          <>
            {/* Overall match rating */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
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

            {/* Players section with team selection */}
            <View style={styles.playersSection}>
              <View style={styles.playersHeader}>
                <Text variant="title" style={styles.sectionTitle}>
                  Player Ratings
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
              </View>
              {displayedPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  rating={playerRatings[player.id] || null}
                  onRatingChange={(rating) => handlePlayerRating(player.id, rating)}
                  isMOTM={motmPlayerId === player.id}
                  onMOTMPress={() => handleMOTMPress(player.id)}
                  showRating={true}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
});
