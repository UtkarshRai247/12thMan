import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError } from '../lib/errors';

const registerSchema = z.object({
  username: z.string().min(1).max(50),
  club: z.string().min(1).max(100),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);

    // Check if username already exists
    const existingUser = await fastify.prisma.user.findUnique({
      where: { username: body.username },
    });

    if (existingUser) {
      throw new AppError('USERNAME_EXISTS', 'Username already taken', 409);
    }

    // Create user
    const user = await fastify.prisma.user.create({
      data: {
        username: body.username,
        club: body.club,
      },
    });

    // Generate JWT token
    const token = fastify.jwt.sign({ sub: user.id });

    return {
      user: {
        id: user.id,
        username: user.username,
        club: user.club,
      },
      token,
    };
  });

  // GET /auth/me
  fastify.get(
    '/me',
    {
      preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
        await fastify.authenticate(request, reply);
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.userId) {
        throw new AppError('UNAUTHORIZED', 'User not authenticated', 401);
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          username: true,
          club: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      return { user };
    }
  );
}
