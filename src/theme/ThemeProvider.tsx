import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { colors, typography, spacing, radii, shadows } from './tokens';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: typeof colors.light;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    (systemColorScheme as ColorScheme) || 'light'
  );
  const [manualOverride, setManualOverride] = useState<ColorScheme | null>(null);

  // Use manual override if set, otherwise follow system
  const effectiveColorScheme = manualOverride || (systemColorScheme as ColorScheme) || 'light';

  useEffect(() => {
    if (!manualOverride && systemColorScheme) {
      setColorScheme(systemColorScheme as ColorScheme);
    } else if (manualOverride) {
      setColorScheme(manualOverride);
    }
  }, [systemColorScheme, manualOverride]);

  const toggleTheme = () => {
    const newScheme = effectiveColorScheme === 'light' ? 'dark' : 'light';
    setManualOverride(newScheme);
    setColorScheme(newScheme);
  };

  const setTheme = (scheme: ColorScheme) => {
    setManualOverride(scheme);
    setColorScheme(scheme);
  };

  const theme = {
    colorScheme: effectiveColorScheme,
    colors: colors[effectiveColorScheme],
    typography,
    spacing,
    radii,
    shadows,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
