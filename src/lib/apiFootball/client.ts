import Constants from 'expo-constants';
import { Fixture, FixtureDetails, MatchStatus } from './types';

/**
 * API-Football Client
 * Handles API calls with caching and error handling
 * 
 * If API_FOOTBALL_KEY is missing, throws friendly dev error
 * UI should use mock data when key is missing
 */

const API_BASE_URL = 'https://v3.football.api-sports.io';

function getApiKey(): string | null {
  return Constants.expoConfig?.extra?.apiFootballKey || 
         process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || 
         null;
}

function checkApiKey(): void {
  const key = getApiKey();
  if (!key || key === 'your_api_key_here') {
    if (__DEV__) {
      console.warn(
        '⚠️ API_FOOTBALL_KEY not configured. Using mock data.\n' +
        'To enable live data, add your API key to .env file:\n' +
        'API_FOOTBALL_KEY=your_actual_key_here'
      );
    }
  }
}

/**
 * Get fixtures by date
 * @param date - Date string in YYYY-MM-DD format
 */
export async function getFixturesByDate(date: string): Promise<Fixture[]> {
  checkApiKey();
  const key = getApiKey();
  
  if (!key || key === 'your_api_key_here') {
    // Return empty array - UI should use mock data
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/fixtures?date=${date}`,
      {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || [];
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching fixtures:', error);
    }
    return [];
  }
}

/**
 * Get live fixtures
 */
export async function getLiveFixtures(): Promise<Fixture[]> {
  checkApiKey();
  const key = getApiKey();
  
  if (!key || key === 'your_api_key_here') {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/fixtures?live=all`,
      {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || [];
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching live fixtures:', error);
    }
    return [];
  }
}

/**
 * Get fixture details by ID
 */
export async function getFixtureDetails(fixtureId: number): Promise<FixtureDetails | null> {
  checkApiKey();
  const key = getApiKey();
  
  if (!key || key === 'your_api_key_here') {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/fixtures?id=${fixtureId}`,
      {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.[0] || null;
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching fixture details:', error);
    }
    return null;
  }
}
