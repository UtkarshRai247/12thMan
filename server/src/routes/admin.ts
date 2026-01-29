/**
 * Admin routes: ingest triggers, mapping, enrichment. Require x-admin-token.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError } from '../lib/errors';
import { env } from '../env';
import * as fixtureJobs from '../jobs/fixtures';

function requireAdmin(request: FastifyRequest, _reply: FastifyReply): void {
  const token = request.headers['x-admin-token'];
  const expected = env.ADMIN_TOKEN;
  if (!expected || token !== expected) {
    throw new AppError('FORBIDDEN', 'Invalid or missing x-admin-token', 403);
  }
}

const mapBodySchema = z.object({
  provider: z.enum(['FOTMOB', 'SOFASCORE']),
  providerFixtureId: z.string().min(1),
});

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', (request: FastifyRequest, reply: FastifyReply, done) => {
    requireAdmin(request, reply);
    done();
  });

  // POST /admin/fixtures/:id/map
  fastify.post(
    '/fixtures/:id/map',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = mapBodySchema.parse(request.body);

      const fixture = await fastify.prisma.fixture.findUnique({
        where: { id: params.id },
      });
      if (!fixture) {
        throw new AppError('FIXTURE_NOT_FOUND', 'Fixture not found', 404);
      }

      const map = await fastify.prisma.providerFixtureMap.upsert({
        where: {
          fixtureId_provider: {
            fixtureId: params.id,
            provider: body.provider,
          },
        },
        create: {
          fixtureId: params.id,
          provider: body.provider,
          providerFixtureId: body.providerFixtureId,
        },
        update: {
          providerFixtureId: body.providerFixtureId,
        },
      });

      return {
        id: map.id,
        fixtureId: map.fixtureId,
        provider: map.provider,
        providerFixtureId: map.providerFixtureId,
      };
    }
  );

  // POST /admin/ingest/fixtures?date=YYYY-MM-DD
  fastify.post(
    '/ingest/fixtures',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const date =
        (request.query as { date?: string }).date ??
        new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new AppError('VALIDATION_ERROR', 'Query date must be YYYY-MM-DD', 400);
      }

      const result = await fixtureJobs.ingestFixturesForDate(fastify.prisma, date);
      return {
        date,
        created: result.created,
        updated: result.updated,
      };
    }
  );

  // POST /admin/ingest/live
  fastify.post('/ingest/live', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await fixtureJobs.ingestLiveFixtures(fastify.prisma);
    return { updated: result.updated };
  });

  // POST /admin/enrich/:fixtureId
  fastify.post(
    '/enrich/:fixtureId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = z
        .object({ fixtureId: z.string().uuid() })
        .parse(request.params);
      const result = await fixtureJobs.enrichFixture(fastify.prisma, params.fixtureId);
      return { fixtureId: params.fixtureId, stored: result.stored };
    }
  );
}
