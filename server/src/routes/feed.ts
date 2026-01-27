import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { decodeCursor, encodeCursor } from '../lib/cursor';

const feedQuerySchema = z.object({
  fixtureId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export async function feedRoutes(fastify: FastifyInstance) {
  // GET /feed
  fastify.get('/feed', async (request, reply) => {
    const query = feedQuerySchema.parse(request.query);

    // Build where clause
    const where: any = {
      moderationStatus: 'POSTED',
    };

    if (query.fixtureId) {
      where.fixtureId = query.fixtureId;
    }

    // Handle cursor pagination
    if (query.cursor) {
      const cursorData = decodeCursor(query.cursor);
      if (cursorData) {
        where.OR = [
          {
            createdAt: {
              lt: new Date(cursorData.createdAt),
            },
          },
          {
            createdAt: new Date(cursorData.createdAt),
            id: {
              lt: cursorData.id,
            },
          },
        ];
      }
    }

    // Fetch limit + 1 to determine if there's a next page
    const takes = await fastify.prisma.take.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            club: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: query.limit + 1,
    });

    // Determine next cursor
    const hasNext = takes.length > query.limit;
    const items = hasNext ? takes.slice(0, -1) : takes;

    const nextCursor = hasNext && items.length > 0
      ? encodeCursor({
          createdAt: items[items.length - 1].createdAt.toISOString(),
          id: items[items.length - 1].id,
        })
      : null;

    return {
      items: items.map((take) => ({
        providerId: take.id,
        userId: take.userId,
        username: take.user.username,
        club: take.user.club,
        fixtureId: take.fixtureId,
        matchRating: take.matchRating,
        motmPlayerId: take.motmPlayerId,
        text: take.text,
        createdAt: take.createdAt.toISOString(),
        syncedAt: take.syncedAt.toISOString(),
      })),
      nextCursor,
    };
  });
}
