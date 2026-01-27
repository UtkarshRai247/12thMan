import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Text } from '@/src/components/Text';
import { MatchCard } from '@/src/components/MatchCard';
import { Toast } from '@/src/components/Toast';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { syncService } from '@/src/lib/sync/syncService';
import { takeRepository } from '@/src/lib/domain/takeRepository';

export default function ProfileScreen() {
  const theme = useTheme();
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Mock user ratings (finished matches only)
  const userRatings = mockFixtures.filter((f) => f.status === 'FT').slice(0, 3);

  useEffect(() => {
    const checkSyncState = () => {
      setIsSyncing(syncService.isSyncInProgress());
    };
    const interval = setInterval(checkSyncState, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (syncService.isSyncInProgress()) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncService.syncAll();
      
      if (result.synced > 0) {
        const message = result.failed > 0
          ? `Synced ${result.synced}, ${result.failed} failed`
          : `Synced ${result.synced} take(s)`;
        setToast({ message, type: result.failed > 0 ? 'error' : 'success' });
        setToastVisible(true);
      } else if (result.failed > 0) {
        setToast({ message: `Failed to sync ${result.failed} take(s)`, type: 'error' });
        setToastVisible(true);
      } else if (result.skipped > 0) {
        setToast({ message: `${result.skipped} take(s) skipped (backoff)`, type: 'info' });
        setToastVisible(true);
      } else {
        setToast({ message: 'No takes to sync', type: 'info' });
        setToastVisible(true);
      }
    } catch (error) {
      setToast({ message: 'Sync failed. Please try again.', type: 'error' });
      setToastVisible(true);
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toastVisible}
          onHide={() => {
            setToastVisible(false);
            setToast(null);
          }}
        />
      )}
      <ScrollView contentContainerStyle={styles.content}>
      {/* Scarf-strip header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text variant="h1" style={styles.avatarText}>
              UR
            </Text>
          </View>
          <Text variant="h2" style={{ color: '#FFFFFF', marginTop: 12 }}>
            @FanUsername
          </Text>
          <Text variant="body" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
            Arsenal • London
          </Text>
        </View>
      </View>

      {/* Sync section */}
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
          Sync
        </Text>
        <TouchableOpacity
          onPress={handleSync}
          disabled={isSyncing}
          style={[
            styles.syncButton,
            {
              backgroundColor: isSyncing ? theme.colors.textTertiary : theme.colors.accent,
            },
          ]}
        >
          <RefreshCw
            size={20}
            color="#FFFFFF"
            style={isSyncing ? styles.spinning : undefined}
          />
          <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 8 }}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
        <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
          Sync queued takes to the server
        </Text>
      </View>

      {/* Formation placeholder */}
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
          Squad Rotation
        </Text>
        <View style={styles.formationPlaceholder}>
          <Text variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
            Formation customization coming soon
          </Text>
          <View style={styles.formationGrid}>
            {/* Placeholder formation graphic */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
              <View
                key={i}
                style={[
                  styles.formationDot,
                  {
                    backgroundColor: theme.colors.accent + '40',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Recent ratings */}
      <View style={styles.ratingsSection}>
        <Text variant="title" style={styles.sectionTitle}>
          Recent Ratings
        </Text>
        {userRatings.map((fixture) => (
          <MatchCard key={fixture.id} fixture={fixture} />
        ))}
        {userRatings.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              No ratings yet. Rate your first match!
            </Text>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    margin: 16,
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  formationPlaceholder: {
    paddingVertical: 24,
  },
  formationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  formationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  ratingsSection: {
    paddingHorizontal: 16,
  },
  emptyState: {
    paddingVertical: 32,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
});
