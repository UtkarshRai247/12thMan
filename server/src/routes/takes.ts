import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError } from '../lib/errors';

const takeInputSchema = z.object({
  clientId: z.string().uuid(),
  fixtureId: z.string().min(1),
  matchRating: z.number().int().min(1).max(10),
  motmPlayerId: z.string().nullable().optional(),
  text: z.string().min(5).max(280),
  createdAt: z.string().datetime().optional(),
});

const syncSchema = z.object({
  takes: z.array(takeInputSchema).max(10),
});

export async function takesRoutes(fastify: FastifyInstance) {
  // POST /takes/sync
  fastify.post(
    '/sync',
    {
      preHandler: [
        async (request: FastifyRequest, reply: FastifyReply) => {
          await fastify.authenticate(request, reply);
        },
        // Custom rate limit: 60/min per user
        async (request: FastifyRequest, reply: FastifyReply) => {
          // For MVP, we'll use a simple in-memory counter
          // In production, use Redis or similar
          const userId = request.userId!;
          const key = `sync:${userId}`;
          const count = (fastify as any).rateLimitStore?.[key] || 0;
          if (count >= 60) {
            reply.status(429).send({
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many sync requests',
              },
            });
            return;
          }
          (fastify as any).rateLimitStore = (fastify as any).rateLimitStore || {};
          (fastify as any).rateLimitStore[key] = count + 1;
          setTimeout(() => {
            (fastify as any).rateLimitStore[key] = Math.max(0, ((fastify as any).rateLimitStore[key] || 0) - 1);
          }, 60000);
        },
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.userId) {
        throw new AppError('UNAUTHORIZED', 'User not authenticated', 401);
      }

      const userId = request.userId; // TypeScript now knows this is string
      const body = syncSchema.parse(request.body);

      // Process batch in transaction
      const results = await fastify.prisma.$transaction(
        body.takes.map((takeInput: z.infer<typeof takeInputSchema>) =>
          fastify.prisma.take.upsert({
            where: {
              userId_clientId: {
                userId: userId,
                clientId: takeInput.clientId,
              },
            },
            create: {
              userId: userId,
              clientId: takeInput.clientId,
              fixtureId: takeInput.fixtureId,
              matchRating: takeInput.matchRating,
              motmPlayerId: takeInput.motmPlayerId ?? null,
              text: takeInput.text,
              createdAt: takeInput.createdAt ? new Date(takeInput.createdAt) : new Date(),
              syncedAt: new Date(),
            },
            update: {
              fixtureId: takeInput.fixtureId,
              matchRating: takeInput.matchRating,
              motmPlayerId: takeInput.motmPlayerId ?? null,
              text: takeInput.text,
              syncedAt: new Date(),
              // Don't update createdAt on existing takes
            },
            select: {
              id: true,
              clientId: true,
              syncedAt: true,
              moderationStatus: true,
            },
          })
        )
      );

      return {
        results: results.map((take: { id: string; clientId: string; syncedAt: Date; moderationStatus: string }) => ({
          clientId: take.clientId,
          providerId: take.id,
          status: 'posted' as const,
          syncedAt: take.syncedAt.toISOString(),
        })),
      };
    }
  );

  // GET /takes/:id
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);

    const take = await fastify.prisma.take.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            club: true,
          },
        },
      },
    });

    if (!take || take.moderationStatus !== 'POSTED') {
      throw new AppError('TAKE_NOT_FOUND', 'Take not found', 404);
    }

    return {
      id: take.id,
      userId: take.userId,
      username: take.user.username,
      club: take.user.club,
      fixtureId: take.fixtureId,
      fixtureRefId: take.fixtureRefId ?? undefined,
      matchRating: take.matchRating,
      motmPlayerId: take.motmPlayerId,
      text: take.text,
      createdAt: take.createdAt.toISOString(),
      syncedAt: take.syncedAt.toISOString(),
    };
  });
}


