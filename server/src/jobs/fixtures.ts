/**
 * Fixture ingestion and enrichment jobs. DB-first; providers are best-effort.
 */

import { PrismaClient } from '@prisma/client';
import {
  getFixturesByDate,
  getLiveFixtures,
  ApiFootballFixtureItem,
} from '../providers/apiFootballClient';
import { getMatchDetails } from '../providers/fotmobWrapperClient';
import { workerEnrichFotmob, workerEnrichSofascore } from '../providers/workerClient';
import { env } from '../env';

export async function ingestFixturesForDate(
  prisma: PrismaClient,
  dateISO: string
): Promise<{ created: number; updated: number }> {
  const items = await getFixturesByDate(dateISO);
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const existing = await prisma.providerFixtureMap.findUnique({
      where: {
        provider_providerFixtureId: {
          provider: 'API_FOOTBALL',
          providerFixtureId: item.providerFixtureId,
        },
      },
      include: { fixture: true },
    });

    if (existing) {
      await prisma.fixture.update({
        where: { id: existing.fixtureId },
        data: {
          status: item.status,
          kickoffAt: item.kickoffAt,
          competition: item.competition,
          season: item.season,
          homeTeamName: item.homeTeamName,
          awayTeamName: item.awayTeamName,
          homeScore: item.homeScore,
          awayScore: item.awayScore,
          updatedAt: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.fixture.create({
        data: {
          status: item.status,
          kickoffAt: item.kickoffAt,
          competition: item.competition,
          season: item.season,
          homeTeamName: item.homeTeamName,
          awayTeamName: item.awayTeamName,
          homeScore: item.homeScore,
          awayScore: item.awayScore,
          providerMaps: {
            create: {
              provider: 'API_FOOTBALL',
              providerFixtureId: item.providerFixtureId,
            },
          },
        },
      });
      created++;
    }
  }

  return { created, updated };
}

export async function ingestLiveFixtures(
  prisma: PrismaClient
): Promise<{ updated: number }> {
  const items = await getLiveFixtures();
  let updated = 0;

  for (const item of items) {
    const map = await prisma.providerFixtureMap.findUnique({
      where: {
        provider_providerFixtureId: {
          provider: 'API_FOOTBALL',
          providerFixtureId: item.providerFixtureId,
        },
      },
    });
    if (map) {
      await prisma.fixture.update({
        where: { id: map.fixtureId },
        data: {
          status: item.status,
          homeScore: item.homeScore,
          awayScore: item.awayScore,
          updatedAt: new Date(),
        },
      });
      updated++;
    }
  }

  return { updated };
}

function buildNormalizedSummary(raw: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  const content = raw.content as Record<string, unknown> | undefined;
  if (content?.stats) {
    const stats = content.stats as Array<{ title?: string; stats?: Array<{ name?: string; value?: string }> }>;
    for (const block of stats) {
      const s = block.stats;
      if (block.title === 'Expected goals (xG)' && s && s.length >= 2) {
        summary.xg = {
          home: parseFloat(s[0]?.value ?? '0') || undefined,
          away: parseFloat(s[1]?.value ?? '0') || undefined,
        };
      }
      if (block.title === 'Possession' && s && s.length >= 2) {
        summary.possession = {
          home: parseFloat(s[0]?.value ?? '0') || undefined,
          away: parseFloat(s[1]?.value ?? '0') || undefined,
        };
      }
      if (block.title === 'Total shots' && s && s.length >= 2) {
        summary.shots = {
          home: parseInt(s[0]?.value ?? '0', 10) || undefined,
          away: parseInt(s[1]?.value ?? '0', 10) || undefined,
        };
      }
    }
  }
  summary.lastUpdatedAt = new Date().toISOString();
  return summary;
}

export async function enrichFixture(
  prisma: PrismaClient,
  fixtureId: string
): Promise<{ stored: number }> {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { providerMaps: true },
  });
  if (!fixture) {
    return { stored: 0 };
  }

  let stored = 0;
  const statusForTtl = fixture.status === 'LIVE' ? 'LIVE' : 'FINISHED';

  if (env.ENABLE_FOTMOB) {
    const fotmobMap = fixture.providerMaps.find((m) => m.provider === 'FOTMOB');
    if (fotmobMap) {
      const raw = await getMatchDetails(fotmobMap.providerFixtureId, statusForTtl);
      if (raw && typeof raw === 'object') {
        const normalizedSummary = buildNormalizedSummary(raw);
        const payload = JSON.parse(JSON.stringify({ raw, normalizedSummary })) as object;
        const ttlSeconds = statusForTtl === 'LIVE' ? env.FOTMOB_TTL_LIVE_SECONDS : env.FOTMOB_TTL_FINISHED_SECONDS;
        await prisma.fixtureEnrichment.upsert({
          where: {
            fixtureId_provider_kind: {
              fixtureId,
              provider: 'FOTMOB',
              kind: 'MATCH_DETAILS',
            },
          },
          create: {
            fixtureId,
            provider: 'FOTMOB',
            kind: 'MATCH_DETAILS',
            payload,
            ttlSeconds,
          },
          update: {
            payload,
            ttlSeconds,
            fetchedAt: new Date(),
          },
        });
        stored++;
      }
    }
  }

  if (env.ENABLE_WORKER) {
    const sofascoreMap = fixture.providerMaps.find((m) => m.provider === 'SOFASCORE');
    if (sofascoreMap) {
      const workerData = await workerEnrichSofascore(sofascoreMap.providerFixtureId);
      if (workerData) {
        const payload = JSON.parse(
          JSON.stringify({ raw: workerData.raw, normalizedSummary: workerData.normalizedSummary })
        ) as object;
        const kind = workerData.kind ?? 'STATS';
        const ttl = workerData.ttlSeconds ?? 86400;
        await prisma.fixtureEnrichment.upsert({
          where: {
            fixtureId_provider_kind: {
              fixtureId,
              provider: 'SOFASCORE',
              kind,
            },
          },
          create: {
            fixtureId,
            provider: 'SOFASCORE',
            kind,
            payload,
            ttlSeconds: ttl,
          },
          update: {
            payload,
            ttlSeconds: ttl,
            fetchedAt: new Date(),
          },
        });
        stored++;
      }
    }
  }

  return { stored };
}
