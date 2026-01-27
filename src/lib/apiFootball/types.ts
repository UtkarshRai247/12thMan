/**
 * API-Football Type Definitions
 * Minimal types for fixtures, teams, players, and events
 */

export enum MatchStatus {
  LIVE = 'LIVE',
  FINISHED = 'FT',
  UPCOMING = 'NS',
  POSTPONED = 'PST',
  CANCELLED = 'CANC',
}

export enum PlayerPosition {
  GK = 'Goalkeeper',
  DF = 'Defender',
  MF = 'Midfielder',
  FW = 'Attacker',
}

export interface Team {
  id: number;
  name: string;
  code: string;
  logo?: string;
}

export interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  number?: number;
  photo?: string;
  teamId: number;
}

export interface Fixture {
  id: number;
  date: string;
  timestamp: number;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
}

export interface Event {
  id: number;
  type: 'Goal' | 'Card' | 'Subst' | 'Var';
  time: number;
  team: Team;
  player?: Player;
  assist?: Player;
  detail?: string;
}

export interface FixtureDetails extends Fixture {
  events: Event[];
  lineups: {
    home: Player[];
    away: Player[];
  };
  statistics?: {
    home: Record<string, number>;
    away: Record<string, number>;
  };
}
