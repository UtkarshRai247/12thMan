import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Text } from '@/src/components/Text';
import { MatchCard } from '@/src/components/MatchCard';
import { TerraceDial } from '@/src/components/TerraceDial';
import { ReactionBar } from '@/src/components/ReactionBar';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { MatchStatus } from '@/src/lib/apiFootball/types';
import { storage, STORAGE_KEYS } from '@/src/lib/storage/storage';
import { takeRepository } from '@/src/lib/domain/takeRepository';
import { syncService } from '@/src/lib/sync/syncService';
import { userRepository } from '@/src/lib/domain/userRepository';
import { STORAGE_VERSION } from '@/src/lib/storage/migrations';

export default function DevScreen() {
  const theme = useTheme();
  const [rating, setRating] = useState<number | null>(null);
  const [reactions, setReactions] = useState({
    cheered: false,
    booed: false,
  });
  const [syncFailureEnabled, setSyncFailureEnabled] = useState(false);
  const [takeCount, setTakeCount] = useState(0);
  const [syncLog, setSyncLog] = useState<any>(null);

  // Load state
  useEffect(() => {
    const loadState = async () => {
      const enabled = await syncService.isFailureSimulationEnabled();
      setSyncFailureEnabled(enabled);
      const takes = await takeRepository.getAll();
      setTakeCount(takes.length);
      const log = await syncService.getSyncLog();
      setSyncLog(log);
    };
    loadState();
    const interval = setInterval(loadState, 2000); // Refresh every 2s
    return () => clearInterval(interval);
  }, []);

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will delete all locally stored takes and drafts. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clear();
              await takeRepository.clearAll();
              setTakeCount(0);
              Alert.alert('Success', 'Local data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
              console.error('Clear error:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleSyncFailure = async () => {
    const newState = await syncService.toggleFailureSimulation();
    setSyncFailureEnabled(newState);
  };

  const handleCopyDebugInfo = async () => {
    try {
      const user = await userRepository.getCurrentUser();
      const takes = await takeRepository.getAll();
      const log = await syncService.getSyncLog();
      const versionKey = '@12thman:storage_version';
      const versionStr = await storage.get<string>(versionKey);
      const version = versionStr ? parseInt(versionStr, 10) : STORAGE_VERSION;

      const countsByStatus = takes.reduce(
        (acc, take) => {
          acc[take.status] = (acc[take.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const debugInfo = {
        user: user ? { userId: user.userId, userName: user.userName, userClub: user.userClub } : null,
        takes: {
          total: takes.length,
          byStatus: countsByStatus,
        },
        syncLog: log,
        storageVersion: version,
        timestamp: new Date().toISOString(),
      };

      await Clipboard.setStringAsync(JSON.stringify(debugInfo, null, 2));
      Alert.alert('Success', 'Debug info copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy debug info');
      console.error('Copy debug error:', error);
    }
  };

  // Get fixtures in different states
  const liveFixture = mockFixtures.find((f) => f.status === MatchStatus.LIVE);
  const finishedFixture = mockFixtures.find((f) => f.status === MatchStatus.FINISHED);
  const upcomingFixture = mockFixtures.find((f) => f.status === MatchStatus.UPCOMING);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          Dev Harness
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
          Component showcase and testing
        </Text>
      </View>

      {/* MatchCard Section */}
      <View style={styles.section}>
        <Text variant="h2" style={styles.sectionTitle}>
          MatchCard
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
          Three states: LIVE, FT (Finished), UPCOMING
        </Text>

        {liveFixture && (
          <View style={styles.cardWrapper}>
            <Text variant="caption" style={styles.stateLabel}>
              LIVE
            </Text>
            <MatchCard fixture={liveFixture} />
          </View>
        )}

        {finishedFixture && (
          <View style={styles.cardWrapper}>
            <Text variant="caption" style={styles.stateLabel}>
              FT (Finished)
            </Text>
            <MatchCard fixture={finishedFixture} />
          </View>
        )}

        {upcomingFixture && (
          <View style={styles.cardWrapper}>
            <Text variant="caption" style={styles.stateLabel}>
              UPCOMING
            </Text>
            <MatchCard fixture={upcomingFixture} />
          </View>
        )}
      </View>

      {/* TerraceDial Section */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          TerraceDial
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
          Select rating 1-10
        </Text>
        <TerraceDial
          value={rating}
          onValueChange={setRating}
          showAverage={true}
          averageRating={7.5}
        />
        {rating !== null && (
          <View style={styles.ratingDisplay}>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              Selected: {rating}/10
            </Text>
          </View>
        )}
      </View>

      {/* ReactionBar Section */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          ReactionBar
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
          CHEER / BOO / COMMENT buttons
        </Text>
        <ReactionBar
          cheerCount={42}
          booCount={5}
          commentCount={12}
          onCheer={() => setReactions((prev) => ({ ...prev, cheered: !prev.cheered }))}
          onBoo={() => setReactions((prev) => ({ ...prev, booed: !prev.booed }))}
          onComment={() => console.log('Comment pressed')}
          userReactions={reactions}
        />
      </View>

      {/* Dev Utilities */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          Dev Utilities
        </Text>

        {/* Clear Local Data */}
        <View style={styles.utilityRow}>
          <View style={styles.utilityInfo}>
            <Text variant="body" style={{ fontWeight: '600', marginBottom: 4 }}>
              Clear Local Data
            </Text>
            <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
              Delete all stored takes and drafts
            </Text>
            <Text variant="caption" style={{ color: theme.colors.textTertiary, marginTop: 4 }}>
              Current takes: {takeCount}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClearData}
            style={[
              styles.utilityButton,
              {
                backgroundColor: theme.colors.error,
              },
            ]}
          >
            <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sync Failure Toggle */}
        <View style={[styles.utilityRow, { marginTop: 16 }]}>
          <View style={styles.utilityInfo}>
            <Text variant="body" style={{ fontWeight: '600', marginBottom: 4 }}>
              Simulate Sync Failure
            </Text>
            <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
              Toggle to simulate sync failures for testing
            </Text>
          </View>
          <Switch
            value={syncFailureEnabled}
            onValueChange={handleToggleSyncFailure}
            trackColor={{ false: theme.colors.border, true: theme.colors.error }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Sync Log */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          Sync Log
        </Text>
        {syncLog ? (
          <View style={styles.syncLogContent}>
            <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
              Started: {new Date(syncLog.startedAt).toLocaleString()}
            </Text>
            {syncLog.endedAt && (
              <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                Ended: {new Date(syncLog.endedAt).toLocaleString()}
              </Text>
            )}
            <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
              Attempted: {syncLog.attempted || 0}
            </Text>
            <Text variant="caption" style={{ color: theme.colors.success }}>
              Succeeded: {syncLog.succeeded || 0}
            </Text>
            <Text variant="caption" style={{ color: theme.colors.error }}>
              Failed: {syncLog.failed || 0}
            </Text>
            <Text variant="caption" style={{ color: theme.colors.varYellow }}>
              Skipped: {syncLog.skipped || 0}
            </Text>
            {syncLog.errors && syncLog.errors.length > 0 && (
              <View style={styles.errorsContainer}>
                <Text variant="caption" style={{ color: theme.colors.error, marginTop: 8 }}>
                  Errors:
                </Text>
                {syncLog.errors.map((error: string, idx: number) => (
                  <Text key={idx} variant="caption" style={{ color: theme.colors.error }}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
            No sync log yet
          </Text>
        )}
      </View>

      {/* Copy Debug Info */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          Debug Info
        </Text>
        <TouchableOpacity
          onPress={handleCopyDebugInfo}
          style={[
            styles.debugButton,
            {
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Copy Debug Info
          </Text>
        </TouchableOpacity>
        <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
          Copies JSON summary of user, takes, sync log, and storage version
        </Text>
      </View>

      {/* Theme Info */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          Theme Info
        </Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
          Current theme: {theme.colorScheme}
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textTertiary }}>
          Floodlight Blue: {theme.colors.floodlightBlue}
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textTertiary }}>
          Pitch Green: {theme.colors.pitchGreen}
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textTertiary }}>
          VAR Yellow: {theme.colors.varYellow}
        </Text>
        <Text variant="caption" style={{ color: theme.colors.textTertiary }}>
          Red Card: {theme.colors.redCard}
        </Text>
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
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  section: {
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  stateLabel: {
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  ratingDisplay: {
    marginTop: 16,
    alignItems: 'center',
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  utilityInfo: {
    flex: 1,
    marginRight: 16,
  },
  utilityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  syncLogContent: {
    gap: 4,
    marginTop: 8,
  },
  errorsContainer: {
    marginTop: 8,
    gap: 2,
  },
  debugButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});
