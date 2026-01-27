import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Text } from '@/src/components/Text';
import { PlayerCard } from '@/src/components/PlayerCard';
import { TerraceDial } from '@/src/components/TerraceDial';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { mockPlayers } from '@/src/data/mock/players';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const fixture = mockFixtures.find((f) => f.id === Number(id));
  const [matchRating, setMatchRating] = useState<number | null>(null);
  const [motmPlayerId, setMotmPlayerId] = useState<number | null>(null);
  const [playerRatings, setPlayerRatings] = useState<Record<number, number>>({});

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
  const allPlayers = [...homePlayers, ...awayPlayers];

  const handlePlayerRating = (playerId: number, rating: number) => {
    setPlayerRatings((prev) => ({ ...prev, [playerId]: rating }));
  };

  const handleMOTMPress = (playerId: number) => {
    setMotmPlayerId(motmPlayerId === playerId ? null : playerId);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Ticket-stub style header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            {fixture.league.name}
          </Text>
          <Text variant="h1" style={styles.matchTitle}>
            {fixture.homeTeam.name} vs {fixture.awayTeam.name}
          </Text>
          {fixture.score.home !== null && fixture.score.away !== null && (
            <View style={styles.scoreRow}>
              <Text variant="h2">{fixture.score.home}</Text>
              <Text variant="body" style={{ color: theme.colors.textSecondary }}>
                -
              </Text>
              <Text variant="h2">{fixture.score.away}</Text>
            </View>
          )}
          <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            {new Date(fixture.timestamp * 1000).toLocaleDateString()}
          </Text>
        </View>
      </View>

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

      {/* Players section */}
      <View style={styles.playersSection}>
        <Text variant="title" style={styles.sectionTitle}>
          Player Ratings
        </Text>
        {allPlayers.map((player) => (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  headerContent: {
    alignItems: 'center',
  },
  matchTitle: {
    marginVertical: 12,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
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
});
