import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { userRepository } from '@/src/lib/domain/userRepository';
import { syncService } from '@/src/lib/sync/syncService';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  const hasSyncedOnStart = useRef(false);

  const checkUser = async () => {
    const user = await userRepository.getCurrentUser();
    setHasUser(user !== null);
    setIsReady(true);

    // Auto-sync on app start
    if (user && !hasSyncedOnStart.current) {
      hasSyncedOnStart.current = true;
      syncService.syncAll().catch((error) => {
        console.error('Auto-sync on start failed:', error);
      });
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  // Auto-sync on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && hasUser) {
        syncService.syncAll().catch((error) => {
          console.error('Auto-sync on foreground failed:', error);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasUser]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'onboarding';
    const inTabsGroup = segments[0] === '(tabs)';

    // Re-check user when navigating to tabs (handles case where user was just created)
    if (inTabsGroup && hasUser === false) {
      checkUser();
      return;
    }

    if (!hasUser && !inAuthGroup) {
      router.replace('/onboarding');
    } else if (hasUser && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [hasUser, segments, isReady]);

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <ThemeProvider>
      <ThemeAwareStatusBar />
      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerBackTitle: '',
          }}
        >
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: '' }} />
          <Stack.Screen 
            name="match/[id]" 
            options={{ 
              title: 'Match Details',
              headerBackTitle: '',
            }} 
          />
          <Stack.Screen name="dev" options={{ title: 'Dev Harness' }} />
        </Stack>
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}

// Component to set StatusBar style based on theme
function ThemeAwareStatusBar() {
  const theme = useTheme();
  
  return <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />;
}
