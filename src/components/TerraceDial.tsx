import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface TerraceDialProps {
  value: number | null;
  onValueChange: (value: number) => void;
  averageRating?: number;
  showAverage?: boolean;
}

export function TerraceDial({
  value,
  onValueChange,
  averageRating,
  showAverage = false,
}: TerraceDialProps) {
  const theme = useTheme();

  const getRatingLabel = (rating: number): string => {
    return theme.colors.ratingLabels[rating as keyof typeof theme.colors.ratingLabels] || '';
  };

  const getRatingColor = (rating: number): string => {
    return theme.colors.rating[rating as keyof typeof theme.colors.rating] || theme.colors.textSecondary;
  };

  // Two-row layout: 1-5 on top, 6-10 on bottom
  const topRow = [1, 2, 3, 4, 5];
  const bottomRow = [6, 7, 8, 9, 10];

  return (
    <View style={styles.container}>
      <View style={styles.dialContainer}>
        {/* Top row */}
        <View style={styles.row}>
          {topRow.map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => onValueChange(rating)}
              style={[
                styles.ratingButton,
                {
                  backgroundColor:
                    value === rating
                      ? getRatingColor(rating)
                      : theme.colors.surface,
                  borderColor:
                    value === rating
                      ? getRatingColor(rating)
                      : theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="mono"
                style={[
                  styles.ratingText,
                  {
                    color:
                      value === rating
                        ? '#FFFFFF'
                        : theme.colors.text,
                    fontWeight: value === rating ? '600' : '400',
                  },
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom row */}
        <View style={styles.row}>
          {bottomRow.map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => onValueChange(rating)}
              style={[
                styles.ratingButton,
                {
                  backgroundColor:
                    value === rating
                      ? getRatingColor(rating)
                      : theme.colors.surface,
                  borderColor:
                    value === rating
                      ? getRatingColor(rating)
                      : theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="mono"
                style={[
                  styles.ratingText,
                  {
                    color:
                      value === rating
                        ? '#FFFFFF'
                        : theme.colors.text,
                    fontWeight: value === rating ? '600' : '400',
                  },
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rating info */}
      <View style={styles.infoContainer}>
        {value !== null && (
          <View style={styles.ratingInfo}>
            <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
              Your rating:
            </Text>
            <Text
              variant="title"
              style={[
                styles.ratingValue,
                {
                  color: getRatingColor(value),
                },
              ]}
            >
              {value} - {getRatingLabel(value)}
            </Text>
          </View>
        )}
        {showAverage && averageRating !== undefined && (
          <View style={styles.averageInfo}>
            <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
              Crowd average:
            </Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              {averageRating.toFixed(1)}/10
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dialContainer: {
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ratingText: {
    fontSize: 18,
  },
  infoContainer: {
    gap: 8,
  },
  ratingInfo: {
    alignItems: 'center',
  },
  ratingValue: {
    marginTop: 4,
  },
  averageInfo: {
    alignItems: 'center',
  },
});
