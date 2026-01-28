import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface ReactionBarProps {
  cheerCount?: number;
  booCount?: number;
  shoutCount?: number;
  onCheer?: () => void;
  onBoo?: () => void;
  onShout?: () => void;
  userReactions?: {
    cheered?: boolean;
    booed?: boolean;
  };
}

export function ReactionBar({
  cheerCount = 0,
  booCount = 0,
  shoutCount = 0,
  onCheer,
  onBoo,
  onShout,
  userReactions,
}: ReactionBarProps) {
  const theme = useTheme();
  const cheerScale = useRef(new Animated.Value(1)).current;
  const booScale = useRef(new Animated.Value(1)).current;
  const shoutScale = useRef(new Animated.Value(1)).current;

  const animatePress = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCheer = () => {
    animatePress(cheerScale);
    onCheer?.();
  };

  const handleBoo = () => {
    animatePress(booScale);
    onBoo?.();
  };

  const handleShout = () => {
    animatePress(shoutScale);
    onShout?.();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: cheerScale }] }}>
        <TouchableOpacity
          onPress={handleCheer}
          style={[
            styles.button,
            {
              backgroundColor: userReactions?.cheered
                ? theme.colors.success + '20'
                : theme.colors.surface,
              borderColor: userReactions?.cheered
                ? theme.colors.success
                : theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            variant="body"
            style={[
              styles.buttonText,
              {
                color: userReactions?.cheered
                  ? theme.colors.success
                  : theme.colors.text,
                fontWeight: userReactions?.cheered ? '600' : '400',
              },
            ]}
          >
            CHEER
          </Text>
          {cheerCount > 0 && (
            <Text
              variant="caption"
              style={[
                styles.count,
                {
                  color: userReactions?.cheered
                    ? theme.colors.success
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {cheerCount}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: booScale }] }}>
        <TouchableOpacity
          onPress={handleBoo}
          style={[
            styles.button,
            {
              backgroundColor: userReactions?.booed
                ? theme.colors.error + '20'
                : theme.colors.surface,
              borderColor: userReactions?.booed
                ? theme.colors.error
                : theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            variant="body"
            style={[
              styles.buttonText,
              {
                color: userReactions?.booed
                  ? theme.colors.error
                  : theme.colors.text,
                fontWeight: userReactions?.booed ? '600' : '400',
              },
            ]}
          >
            BOO
          </Text>
          {booCount > 0 && (
            <Text
              variant="caption"
              style={[
                styles.count,
                {
                  color: userReactions?.booed
                    ? theme.colors.error
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {booCount}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: shoutScale }] }}>
        <TouchableOpacity
          onPress={handleShout}
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            variant="body"
            style={[
              styles.buttonText,
              {
                color: theme.colors.text,
              },
            ]}
          >
            SHOUT
          </Text>
          {shoutCount > 0 && (
            <Text
              variant="caption"
              style={[
                styles.count,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              {shoutCount}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  count: {
    marginTop: 2,
    fontSize: 10,
  },
});
