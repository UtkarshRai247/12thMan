/**
 * Public fixture endpoints. DB-first; no provider calls.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError } from '../lib/errors';

const listQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function fixtureRoutes(fastify: FastifyInstance) {
  // GET /fixtures?date=YYYY-MM-DD&limit=100
  fastify.get('/fixtures', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listQuerySchema.parse(request.query);
    const start = query.date ? new Date(`${query.date}T00:00:00.000Z`) : new Date();
    const end = query.date
      ? new Date(`${query.date}T23:59:59.999Z`)
      : new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const fixtures = await fastify.prisma.fixture.findMany({
      where: {
        kickoffAt: { gte: start, lte: end },
      },
      orderBy: { kickoffAt: 'asc' },
      take: query.limit,
      include: {
        enrichments: {
          select: { payload: true, kind: true, provider: true },
          take: 5,
        },
      },
    });

    const items = fixtures.map((f) => {
      const enrichmentSummary = f.enrichments?.find((e) => {
        const p = e.payload as Record<string, unknown>;
        return p && typeof p.normalizedSummary === 'object';
      });
      const normalizedSummary = enrichmentSummary
        ? (enrichmentSummary.payload as { normalizedSummary?: unknown }).normalizedSummary
        : undefined;
      return {
        id: f.id,
        kickoffAt: f.kickoffAt.toISOString(),
        status: f.status,
        teams: { home: f.homeTeamName, away: f.awayTeamName },
        score: { home: f.homeScore, away: f.awayScore },
        competition: f.competition,
        enrichmentSummary: normalizedSummary ?? undefined,
      };
    });

    return { items };
  });

  // GET /fixtures/live
  fastify.get('/fixtures/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    const fixtures = await fastify.prisma.fixture.findMany({
      where: { status: 'LIVE' },
      orderBy: { kickoffAt: 'asc' },
      include: {
        enrichments: {
          select: { payload: true, kind: true },
          take: 5,
        },
      },
    });

    const items = fixtures.map((f) => {
      const enrichmentSummary = f.enrichments?.find((e) => {
        const p = e.payload as Record<string, unknown>;
        return p && typeof p.normalizedSummary === 'object';
      });
      const normalizedSummary = enrichmentSummary
        ? (enrichmentSummary.payload as { normalizedSummary?: unknown }).normalizedSummary
        : undefined;
      return {
        id: f.id,
        kickoffAt: f.kickoffAt.toISOString(),
        status: f.status,
        teams: { home: f.homeTeamName, away: f.awayTeamName },
        score: { home: f.homeScore, away: f.awayScore },
        competition: f.competition,
        enrichmentSummary: normalizedSummary ?? undefined,
      };
    });

    return { items };
  });

  // GET /fixtures/:id?includeRaw=false
  const getParamsSchema = z.object({ id: z.string().uuid() });
  const getQuerySchema = z.object({
    includeRaw: z
      .string()
      .optional()
      .transform((v) => v === 'true' || v === '1'),
  });

  fastify.get('/fixtures/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = getParamsSchema.parse(request.params);
    const query = getQuerySchema.parse(request.query);

    const fixture = await fastify.prisma.fixture.findUnique({
      where: { id: params.id },
      include: {
        enrichments: true,
        providerMaps: { select: { provider: true, providerFixtureId: true } },
      },
    });

    if (!fixture) {
      throw new AppError('FIXTURE_NOT_FOUND', 'Fixture not found', 404);
    }

    const enrichmentSummary = fixture.enrichments?.find((e) => {
      const p = e.payload as Record<string, unknown>;
      return p && typeof p.normalizedSummary === 'object';
    });
    const normalizedSummary = enrichmentSummary
      ? (enrichmentSummary.payload as { normalizedSummary?: unknown }).normalizedSummary
      : undefined;

    const response: Record<string, unknown> = {
      id: fixture.id,
      kickoffAt: fixture.kickoffAt.toISOString(),
      status: fixture.status,
      teams: { home: fixture.homeTeamName, away: fixture.awayTeamName },
      score: { home: fixture.homeScore, away: fixture.awayScore },
      competition: fixture.competition,
      season: fixture.season,
      enrichmentSummary: normalizedSummary ?? undefined,
      providerMaps: fixture.providerMaps,
    };

    if (query.includeRaw && fixture.enrichments?.length) {
      response.enrichmentsRaw = fixture.enrichments.map((e) => ({
        provider: e.provider,
        kind: e.kind,
        payload: e.payload,
        fetchedAt: e.fetchedAt.toISOString(),
      }));
    }

    return response;
  });
}
