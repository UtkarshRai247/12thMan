/**
 * Fixtures Module
 * Centralized fixture data and selectors
 */

import { Fixture, Player } from '../lib/domain/fixtureTypes';
import { mockFixtures } from './mock/fixtures';
import { mockPlayers } from './mock/players';
import { mockTeams } from './mock/teams';

// Export all fixtures
export const fixtures: Fixture[] = mockFixtures;

// Export all players
export const players: Player[] = mockPlayers;

// Export all teams
export const teams = mockTeams;

/**
 * Get fixture by ID
 */
export function getFixtureById(id: number): Fixture | undefined {
  return fixtures.find((f) => f.id === id);
}

/**
 * Get players by fixture ID
 */
export function getPlayersByFixture(fixtureId: number): Player[] {
  const fixture = getFixtureById(fixtureId);
  if (!fixture) {
    return [];
  }

  return players.filter(
    (p) => p.teamId === fixture.homeTeam.id || p.teamId === fixture.awayTeam.id
  );
}

/**
 * List fixtures (with optional filters)
 */
export function listFixtures(options?: {
  status?: string;
  date?: string;
  limit?: number;
}): Fixture[] {
  let result = [...fixtures];

  if (options?.status) {
    result = result.filter((f) => f.status === options.status);
  }

  if (options?.date) {
    result = result.filter((f) => f.date === options.date);
  }

  // Sort by timestamp desc (newest first)
  result.sort((a, b) => b.timestamp - a.timestamp);

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

/**
 * Get finished fixtures (for rating)
 */
export function getFinishedFixtures(): Fixture[] {
  return listFixtures({ status: 'FT' });
}
