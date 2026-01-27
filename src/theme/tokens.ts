/**
 * 12thMan Design System Tokens
 * Stadium floodlight aesthetic with light/dark themes
 */

export const colors = {
  light: {
    // Base colors - stadium floodlight aesthetic
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceElevated: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Brand colors - football stadium palette
    floodlightBlue: '#60A5FA', // Bright stadium floodlight blue
    nightSky: '#0F172A', // Deep night sky
    pitchGreen: '#22C55E', // Football pitch green
    varYellow: '#FCD34D', // VAR review yellow
    redCard: '#DC2626', // Red card
    neutrals: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Primary brand colors (neutral, club-agnostic)
    primary: '#1F2937',
    primaryLight: '#374151',
    primaryDark: '#111827',
    
    // Accent colors
    accent: '#60A5FA',
    accentLight: '#93C5FD',
    accentDark: '#3B82F6',
    
    // Status colors
    success: '#22C55E', // Using pitch green
    warning: '#FCD34D', // Using VAR yellow
    error: '#DC2626', // Using red card
    info: '#60A5FA', // Using floodlight blue
    
    // Match status colors
    live: '#DC2626', // Red card for live
    finished: '#6B7280',
    upcoming: '#22C55E', // Pitch green for upcoming
    
    // Rating scale colors (1-10)
    rating: {
      1: '#EF4444', // Poor
      2: '#F97316', // Very Bad
      3: '#F59E0B', // Bad
      4: '#EAB308', // Below Average
      5: '#84CC16', // Average
      6: '#22C55E', // Above Average
      7: '#10B981', // Good
      8: '#14B8A6', // Very Good
      9: '#06B6D4', // Excellent
      10: '#3B82F6', // Elite
    },
    
    // Rating semantic labels
    ratingLabels: {
      1: 'Poor',
      2: 'Very Bad',
      3: 'Bad',
      4: 'Below Average',
      5: 'Average',
      6: 'Above Average',
      7: 'Good',
      8: 'Very Good',
      9: 'Excellent',
      10: 'Elite',
    },
  },
  dark: {
    // Base colors - night match under floodlights
    background: '#0F172A', // Night sky
    surface: '#1E293B',
    surfaceElevated: '#334155',
    border: '#475569',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    // Brand colors - football stadium palette (brighter for dark mode)
    floodlightBlue: '#93C5FD', // Brighter floodlight blue
    nightSky: '#0F172A', // Same night sky
    pitchGreen: '#4ADE80', // Brighter pitch green
    varYellow: '#FDE047', // Brighter VAR yellow
    redCard: '#F87171', // Softer red card for dark mode
    neutrals: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Primary brand colors
    primary: '#F1F5F9',
    primaryLight: '#E2E8F0',
    primaryDark: '#CBD5E1',
    
    // Accent colors
    accent: '#93C5FD', // Brighter floodlight blue
    accentLight: '#BFDBFE',
    accentDark: '#60A5FA',
    
    // Status colors
    success: '#4ADE80', // Brighter pitch green
    warning: '#FDE047', // Brighter VAR yellow
    error: '#F87171', // Softer red card
    info: '#93C5FD', // Brighter floodlight blue
    
    // Match status colors
    live: '#F87171', // Softer red for live
    finished: '#94A3B8',
    upcoming: '#4ADE80', // Brighter pitch green
    
    // Rating scale colors (1-10) - brighter for dark mode
    rating: {
      1: '#F87171',
      2: '#FB923C',
      3: '#FBBF24',
      4: '#FCD34D',
      5: '#A3E635',
      6: '#4ADE80',
      7: '#34D399',
      8: '#2DD4BF',
      9: '#22D3EE',
      10: '#60A5FA',
    },
    
    // Rating semantic labels (same as light)
    ratingLabels: {
      1: 'Poor',
      2: 'Very Bad',
      3: 'Bad',
      4: 'Below Average',
      5: 'Average',
      6: 'Above Average',
      7: 'Good',
      8: 'Very Good',
      9: 'Excellent',
      10: 'Elite',
    },
  },
};

export const typography = {
  // Font families
  fonts: {
    body: 'Inter',
    headline: 'BebasNeue',
    mono: 'IBMPlexMono',
  },
  
  // Font sizes (4px base unit)
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  // 4px base unit
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

export const radii = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};
