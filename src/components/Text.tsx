import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fontMap } from '../theme/fonts';

type TextVariant = 'h1' | 'h2' | 'title' | 'body' | 'caption' | 'mono';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  children: React.ReactNode;
}

export function Text({ variant = 'body', style, children, ...props }: TextProps) {
  const theme = useTheme();

  const variantStyles = {
    h1: {
      fontSize: theme.typography.sizes['5xl'],
      fontFamily: fontMap.headline,
      fontWeight: theme.typography.weights.bold,
      lineHeight: theme.typography.sizes['5xl'] * theme.typography.lineHeights.tight,
      color: theme.colors.text,
    },
    h2: {
      fontSize: theme.typography.sizes['4xl'],
      fontFamily: fontMap.headline,
      fontWeight: theme.typography.weights.bold,
      lineHeight: theme.typography.sizes['4xl'] * theme.typography.lineHeights.tight,
      color: theme.colors.text,
    },
    title: {
      fontSize: theme.typography.sizes['2xl'],
      fontFamily: fontMap.body,
      fontWeight: theme.typography.weights.semibold,
      lineHeight: theme.typography.sizes['2xl'] * theme.typography.lineHeights.normal,
      color: theme.colors.text,
    },
    body: {
      fontSize: theme.typography.sizes.base,
      fontFamily: fontMap.body,
      fontWeight: theme.typography.weights.regular,
      lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.normal,
      color: theme.colors.text,
    },
    caption: {
      fontSize: theme.typography.sizes.sm,
      fontFamily: fontMap.body,
      fontWeight: theme.typography.weights.regular,
      lineHeight: theme.typography.sizes.sm * theme.typography.lineHeights.normal,
      color: theme.colors.textSecondary,
    },
    mono: {
      fontSize: theme.typography.sizes.base,
      fontFamily: fontMap.mono,
      fontWeight: theme.typography.weights.regular,
      lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.normal,
      color: theme.colors.text,
    },
  };

  return (
    <RNText style={[variantStyles[variant], style]} {...props}>
      {children}
    </RNText>
  );
}
