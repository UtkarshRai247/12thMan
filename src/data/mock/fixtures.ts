import { Fixture, MatchStatus } from '../../lib/apiFootball/types';
import { mockTeams } from './teams';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

export const mockFixtures: Fixture[] = [
  {
    id: 1001,
    date: yesterday.toISOString().split('T')[0],
    timestamp: Math.floor(yesterday.getTime() / 1000),
    status: MatchStatus.FINISHED,
    homeTeam: mockTeams[0], // Arsenal
    awayTeam: mockTeams[1], // Man City
    score: { home: 2, away: 1 },
    league: { id: 39, name: 'Premier League', country: 'England' },
  },
  {
    id: 1002,
    date: today.toISOString().split('T')[0],
    timestamp: Math.floor(today.getTime() / 1000),
    status: MatchStatus.LIVE,
    homeTeam: mockTeams[2], // Liverpool
    awayTeam: mockTeams[3], // Chelsea
    score: { home: 1, away: 0 },
    league: { id: 39, name: 'Premier League', country: 'England' },
  },
  {
    id: 1003,
    date: today.toISOString().split('T')[0],
    timestamp: Math.floor(today.getTime() / 1000) + 3600,
    status: MatchStatus.UPCOMING,
    homeTeam: mockTeams[4], // Man United
    awayTeam: mockTeams[5], // Tottenham
    score: { home: null, away: null },
    league: { id: 39, name: 'Premier League', country: 'England' },
  },
  {
    id: 1004,
    date: tomorrow.toISOString().split('T')[0],
    timestamp: Math.floor(tomorrow.getTime() / 1000),
    status: MatchStatus.UPCOMING,
    homeTeam: mockTeams[6], // Barcelona
    awayTeam: mockTeams[7], // Real Madrid
    score: { home: null, away: null },
    league: { id: 140, name: 'La Liga', country: 'Spain' },
  },
];
