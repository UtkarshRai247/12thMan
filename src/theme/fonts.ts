import { useFonts } from 'expo-font';

/**
 * Load custom fonts for 12thMan
 * - Inter: Body text
 * - Bebas Neue: Headlines  
 * - IBM Plex Mono: Ratings/stats
 * 
 * TODO: Download and bundle fonts locally for production
 * For now, using system fonts as fallback
 */
export function useAppFonts() {
  // TODO: Add actual font files once downloaded
  // For now, fonts will fall back to system fonts
  const [fontsLoaded] = useFonts({
    // Inter: require('./assets/fonts/Inter-Regular.ttf'),
    // 'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    // 'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    // 'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    // BebasNeue: require('./assets/fonts/BebasNeue-Regular.ttf'),
    // IBMPlexMono: require('./assets/fonts/IBMPlexMono-Regular.ttf'),
  });

  return { fontsLoaded: fontsLoaded ?? true };
}

// Font family mappings
// Using system fonts until custom fonts are bundled
export const fontMap = {
  body: 'System',
  headline: 'System',
  mono: 'Courier',
};
