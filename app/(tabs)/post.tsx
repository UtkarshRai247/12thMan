import { TerraceDial } from '@/src/components/TerraceDial';
import { Text } from '@/src/components/Text';
import { getFinishedFixtures, getPlayersByFixture } from '@/src/data/fixtures';
import { draftRepository } from '@/src/lib/domain/draftRepository';
import { takeRepository } from '@/src/lib/domain/takeRepository';
import { LocalUser } from '@/src/lib/domain/types';
import { userRepository } from '@/src/lib/domain/userRepository';
import { storage } from '@/src/lib/storage/storage';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchRating, setMatchRating] = useState<number | null>(null);
  const [motmPlayerId, setMotmPlayerId] = useState<number | null>(null);
  const [takeText, setTakeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ match?: string; rating?: string; text?: string }>({});

  const MIN_TEXT_LENGTH = 5;
  const MAX_TEXT_LENGTH = 280;

  // Load user and draft on mount
  useEffect(() => {
    const loadData = async () => {
      const currentUser = await userRepository.getCurrentUser();
      setUser(currentUser);

      // Check if editing a take
      const editingTakeId = await storage.get<string>('@12thman:editing_take_id');
      
      if (editingTakeId) {
        // Load take and convert to draft
        const take = await takeRepository.getById(editingTakeId);
        if (take) {
          setSelectedMatchId(take.fixtureId);
          setMatchRating(take.matchRating);
          setMotmPlayerId(take.motmPlayerId ?? null);
          setTakeText(take.text);
        }
      } else {
        // Load draft
        const draft = await draftRepository.getDraft();
        if (draft) {
          if (draft.fixtureId) setSelectedMatchId(draft.fixtureId);
          if (draft.matchRating !== null) setMatchRating(draft.matchRating);
          if (draft.motmPlayerId) setMotmPlayerId(draft.motmPlayerId);
          if (draft.text) setTakeText(draft.text);
        }
      }
    };
    loadData();
  }, []);

  // Auto-save draft with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedMatchId || matchRating !== null || motmPlayerId !== null || takeText.trim()) {
        draftRepository.saveDraft({
          fixtureId: selectedMatchId ?? undefined,
          matchRating: matchRating ?? undefined,
          motmPlayerId: motmPlayerId ?? undefined,
          text: takeText,
        });
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedMatchId, matchRating, motmPlayerId, takeText]);

  const handleDiscardDraft = () => {
    Alert.alert(
      'Discard Draft',
      'Are you sure you want to discard your draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await draftRepository.clearDraft();
            setSelectedMatchId(null);
            setMatchRating(null);
            setMotmPlayerId(null);
            setTakeText('');
          },
        },
      ]
    );
  };

  const selectedMatch = selectedMatchId
    ? getFinishedFixtures().find((f) => f.id === selectedMatchId)
    : null;

  const availablePlayers = selectedMatchId ? getPlayersByFixture(selectedMatchId) : [];

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedMatchId) {
      newErrors.match = 'Please select a match';
    }

    if (!matchRating) {
      newErrors.rating = 'Please rate the match';
    }

    const textTrimmed = takeText.trim();
    if (!textTrimmed) {
      newErrors.text = 'Please write your take';
    } else if (textTrimmed.length < MIN_TEXT_LENGTH) {
      newErrors.text = `Take must be at least ${MIN_TEXT_LENGTH} characters`;
    } else if (textTrimmed.length > MAX_TEXT_LENGTH) {
      newErrors.text = `Take must be no more than ${MAX_TEXT_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    if (!selectedMatch) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User profile not found. Please restart the app.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if editing
      const editingTakeId = await storage.get<string>('@12thman:editing_take_id');

      if (editingTakeId) {
        // Update existing take
        const existingTake = await takeRepository.getById(editingTakeId);
        if (existingTake) {
          await takeRepository.update(editingTakeId, {
            fixtureId: selectedMatch.id,
            matchRating: matchRating!,
            motmPlayerId: motmPlayerId || undefined,
            text: takeText.trim(),
          });
          // Clear editing flag
          await storage.remove('@12thman:editing_take_id');
        }

        // Clear draft and reset form
        await draftRepository.clearDraft();
        await storage.remove('@12thman:editing_take_id');
        setSelectedMatchId(null);
        setMatchRating(null);
        setMotmPlayerId(null);
        setTakeText('');

        // Navigate to feed to see the queued take
        Alert.alert(
          'Take Updated',
          'Take updated successfully',
          [
            {
              text: 'View Feed',
              onPress: () => router.push('/(tabs)'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      } else {
        // Create new take with queued status
        await takeRepository.create({
          userId: user.userId,
          userName: user.userName,
          userClub: user.userClub,
          fixtureId: selectedMatch.id,
          matchRating: matchRating!,
          motmPlayerId: motmPlayerId || undefined,
          text: takeText.trim(),
          reactions: {
            cheer: 0,
            boo: 0,
            comment: 0,
          },
        });

        // Clear draft and reset form
        await draftRepository.clearDraft();
        await storage.remove('@12thman:editing_take_id');
        setSelectedMatchId(null);
        setMatchRating(null);
        setMotmPlayerId(null);
        setTakeText('');

        // Navigate to feed to see the queued take
        Alert.alert(
          'Take Queued',
          'Your take has been saved and will sync when online.',
          [
            {
              text: 'View Feed',
              onPress: () => router.push('/(tabs)'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save take. Please try again.');
      console.error('Error saving take:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="h2" style={styles.title}>
          Post Your Take
        </Text>
        {(selectedMatchId || matchRating !== null || motmPlayerId !== null || takeText.trim()) && (
          <TouchableOpacity onPress={handleDiscardDraft}>
            <Text variant="caption" style={{ color: theme.colors.error }}>
              Discard Draft
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Match selector */}
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
          Select Match
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchSelector}>
          {getFinishedFixtures().map((fixture) => (
              <TouchableOpacity
                key={fixture.id}
                onPress={() => setSelectedMatchId(fixture.id)}
                style={[
                  styles.matchOption,
                  {
                    backgroundColor:
                      selectedMatchId === fixture.id
                        ? theme.colors.accent
                        : theme.colors.surfaceElevated,
                    borderColor:
                      selectedMatchId === fixture.id
                        ? theme.colors.accent
                        : theme.colors.border,
                  },
                ]}
              >
                <Text
                  variant="body"
                  style={{
                    color:
                      selectedMatchId === fixture.id ? '#FFFFFF' : theme.colors.text,
                    fontWeight: selectedMatchId === fixture.id ? '600' : '400',
                  }}
                >
                  {fixture.homeTeam.code} vs {fixture.awayTeam.code}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {selectedMatch && (
        <>
          {/* Match rating */}
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
              showAverage={false}
            />
          </View>

          {/* MOTM picker */}
          {availablePlayers.length > 0 && (
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
                Man of the Match
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.playerSelector}
              >
                {availablePlayers.map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    onPress={() => setMotmPlayerId(motmPlayerId === player.id ? null : player.id)}
                    style={[
                      styles.playerOption,
                      {
                        backgroundColor:
                          motmPlayerId === player.id
                            ? theme.colors.accent
                            : theme.colors.surfaceElevated,
                        borderColor:
                          motmPlayerId === player.id
                            ? theme.colors.accent
                            : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{
                        color:
                          motmPlayerId === player.id ? '#FFFFFF' : theme.colors.text,
                        fontWeight: motmPlayerId === player.id ? '600' : '400',
                      }}
                    >
                      {player.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Take text input */}
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
              Your Take
            </Text>
            <TextInput
              value={takeText}
              onChangeText={(text) => {
                setTakeText(text);
                if (errors.text) {
                  setErrors((prev) => ({ ...prev, text: undefined }));
                }
              }}
              placeholder="Share your thoughts on the match..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={6}
              maxLength={MAX_TEXT_LENGTH}
              style={[
                styles.textInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                  borderColor: errors.text ? theme.colors.error : theme.colors.border,
                },
              ]}
            />
            <View style={styles.textInputFooter}>
              <Text
                variant="caption"
                style={{
                  color: errors.text
                    ? theme.colors.error
                    : takeText.length > MAX_TEXT_LENGTH - 20
                      ? theme.colors.warning
                      : theme.colors.textSecondary,
                }}
              >
                {errors.text || `${takeText.length}/${MAX_TEXT_LENGTH} characters`}
              </Text>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedMatchId || !matchRating || takeText.trim().length < MIN_TEXT_LENGTH}
            style={[
              styles.submitButton,
              {
                backgroundColor:
                  isSubmitting || !selectedMatchId || !matchRating || takeText.trim().length < MIN_TEXT_LENGTH
                    ? theme.colors.textTertiary
                    : theme.colors.accent,
              },
            ]}
          >
            <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              {isSubmitting ? 'Saving...' : 'Post Take'}
            </Text>
          </TouchableOpacity>
        </>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    flex: 1,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  matchSelector: {
    marginTop: 8,
  },
  matchOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  playerSelector: {
    marginTop: 8,
  },
  playerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  textInputFooter: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
});



