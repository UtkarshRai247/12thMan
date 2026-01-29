/**
 * Canonical fixture source: API-Football.
 * No calls if API_FOOTBALL_KEY is missing; throws a friendly error when called.
 */

import { env } from '../env';
import { fetchJson } from './http';

const API_BASE = 'https://v3.football.api-sports.io';

export type FixtureStatusIngest = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export interface ApiFootballFixtureItem {
  providerFixtureId: string;
  kickoffAt: Date;
  status: FixtureStatusIngest;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: string | null;
  season: string | null;
}

function getApiKey(): string | undefined {
  return env.API_FOOTBALL_KEY;
}

function ensureApiKey(): string {
  const key = getApiKey();
  if (!key || key.trim() === '') {
    throw new Error(
      'API_FOOTBALL_KEY is not set. Set it in server/.env to use fixture ingestion.'
    );
  }
  return key;
}

const STATUS_MAP: Record<string, FixtureStatusIngest> = {
  NS: 'SCHEDULED',
  TBD: 'SCHEDULED',
  '1H': 'LIVE',
  HT: 'LIVE',
  '2H': 'LIVE',
  ET: 'LIVE',
  P: 'LIVE',
  SUSP: 'POSTPONED',
  INT: 'POSTPONED',
  FT: 'FINISHED',
  AET: 'FINISHED',
  PEN: 'FINISHED',
  PST: 'POSTPONED',
  CANC: 'CANCELLED',
  AWD: 'FINISHED',
  WO: 'FINISHED',
};

function mapStatus(short: string): FixtureStatusIngest {
  return STATUS_MAP[short] ?? 'SCHEDULED';
}

interface ApiFootballResponseItem {
  fixture: { id: number; date: string; status: { short: string } };
  league: { name: string; season: string | number };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

interface ApiFootballResponse {
  response?: ApiFootballResponseItem[];
}

function mapItem(item: ApiFootballResponseItem): ApiFootballFixtureItem {
  const short = item.fixture?.status?.short ?? 'NS';
  return {
    providerFixtureId: String(item.fixture.id),
    kickoffAt: new Date(item.fixture.date),
    status: mapStatus(short),
    homeTeamName: item.teams?.home?.name ?? 'Home',
    awayTeamName: item.teams?.away?.name ?? 'Away',
    homeScore: item.goals?.home ?? null,
    awayScore: item.goals?.away ?? null,
    competition: item.league?.name ?? null,
    season: item.league?.season != null ? String(item.league.season) : null,
  };
}

export async function getFixturesByDate(dateISO: string): Promise<ApiFootballFixtureItem[]> {
  ensureApiKey();
  const key = getApiKey()!;
  const url = `${API_BASE}/fixtures?date=${dateISO}`;
  const data = await fetchJson<ApiFootballResponse>(url, {
    headers: {
      'x-apisports-key': key,
    },
    timeoutMs: 8000,
    maxRetries: 2,
  });
  const list = data.response ?? [];
  return list.map(mapItem);
}

export async function getLiveFixtures(): Promise<ApiFootballFixtureItem[]> {
  ensureApiKey();
  const key = getApiKey()!;
  const url = `${API_BASE}/fixtures?live=all`;
  const data = await fetchJson<ApiFootballResponse>(url, {
    headers: {
      'x-apisports-key': key,
    },
    timeoutMs: 8000,
    maxRetries: 2,
  });
  const list = data.response ?? [];
  return list.map(mapItem);
}

export async function getFixtureDetails(providerFixtureId: string): Promise<ApiFootballFixtureItem | null> {
  ensureApiKey();
  const key = getApiKey()!;
  const url = `${API_BASE}/fixtures?id=${providerFixtureId}`;
  const data = await fetchJson<ApiFootballResponse>(url, {
    headers: {
      'x-apisports-key': key,
    },
    timeoutMs: 8000,
    maxRetries: 2,
  });
  const list = data.response ?? [];
  const first = list[0];
  if (!first) return null;
  return mapItem(first);
}
