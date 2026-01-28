import { MatchCard } from '@/src/components/MatchCard';
import { Text } from '@/src/components/Text';
import { mockFixtures } from '@/src/data/mock/fixtures';
import { MatchStatus } from '@/src/lib/apiFootball/types';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateScrollViewRef = useRef<ScrollView>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh fixtures here if needed
    setTimeout(() => setRefreshing(false), 500);
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 1) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get date navigation options (Yesterday, Today, Tomorrow, etc.)
  const getDateOptions = () => {
    const today = new Date();
    const dates = [];
    for (let i = -2; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dateOptions = getDateOptions();

  // Auto-scroll to "Today" on mount
  useEffect(() => {
    // Find index of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIndex = dateOptions.findIndex((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (todayIndex >= 0 && dateScrollViewRef.current) {
      const screenWidth = Dimensions.get('window').width;
      const contentPadding = 16; // paddingHorizontal in contentContainerStyle
      const gap = 8; // gap between items
      
      // Estimate item width more accurately
      // minWidth is 80, but with padding (16*2=32) and text, average is ~100-110px
      // Use a more conservative estimate that accounts for variable text widths
      const avgItemWidth = 100; // Average width accounting for text variation
      
      // Calculate cumulative width up to "Today" item
      let cumulativeWidth = contentPadding;
      for (let i = 0; i < todayIndex; i++) {
        cumulativeWidth += avgItemWidth + gap;
      }
      
      // Add half of "Today" item width to get its center
      const todayItemCenter = cumulativeWidth + (avgItemWidth / 2);
      
      // Scroll to center: item center - screen center
      const scrollPosition = Math.max(0, todayItemCenter - (screenWidth / 2));
      
      setTimeout(() => {
        dateScrollViewRef.current?.scrollTo({
          x: scrollPosition,
          animated: true,
        });
      }, 400);
    }
  }, [dateOptions]);

  const handleMatchPress = (fixtureId: number) => {
    router.push(`/match/${fixtureId}`);
  };

  const handleRatePress = (fixtureId: number) => {
    router.push(`/match/${fixtureId}`);
  };

  const handleShoutPress = (fixtureId: number) => {
    router.push(`/match/${fixtureId}`);
  };

  // Filter and sort fixtures by selected date and kickoff time
  const filteredAndSortedFixtures = useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // Filter fixtures for selected date
    const filtered = mockFixtures.filter((fixture) => {
      const fixtureDate = new Date(fixture.timestamp * 1000).toISOString().split('T')[0];
      return fixtureDate === selectedDateStr;
    });
    
    // Sort by timestamp ascending (earliest kickoff first)
    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }, [selectedDate]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top * 0.4 }]}>
      {/* Header with Logo and Calendar */}
      <View style={styles.header}>
        <Text variant="h1" style={styles.logo}>
          12thMan
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(!showDatePicker)}
          style={styles.calendarButton}
        >
          <Calendar size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Date Navigation Bar */}
      <ScrollView
        ref={dateScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateNavContainer}
        contentContainerStyle={styles.dateNavContent}
      >
        {dateOptions.map((date) => {
          const isSelected = date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
          return (
            <TouchableOpacity
              key={date.toISOString()}
              onPress={() => setSelectedDate(date)}
              style={[
                styles.dateOption,
                {
                  backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                variant="body"
                style={[
                  styles.dateOptionText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {formatDateDisplay(date)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Games List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredAndSortedFixtures.length > 0 ? (
          filteredAndSortedFixtures.map((fixture) => (
            <MatchCard
              key={fixture.id}
              fixture={fixture}
              onPress={() => handleMatchPress(fixture.id)}
              onRatePress={
                fixture.status === MatchStatus.FINISHED
                  ? () => handleRatePress(fixture.id)
                  : undefined
              }
              onShoutPress={
                fixture.status === MatchStatus.LIVE || fixture.status === MatchStatus.UPCOMING
                  ? () => handleShoutPress(fixture.id)
                  : undefined
              }
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              No matches scheduled for {formatDateDisplay(selectedDate)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 30,
    fontWeight: '700',
  },
  calendarButton: {
    padding: 10,
  },
  dateNavContainer: {
    maxHeight: 50,
    marginTop: -4,
    marginBottom: 8,
  },
  dateNavContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  dateOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  dateOptionText: {
    fontSize: 14,
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
