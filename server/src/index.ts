import Fastify from 'fastify';
import { env } from './env';
import { prismaPlugin } from './plugins/prisma';
import { authPlugin } from './plugins/auth';
import { rateLimitPlugin } from './plugins/rateLimit';
import { authRoutes } from './routes/auth';
import { takesRoutes } from './routes/takes';
import { feedRoutes } from './routes/feed';
import { handleError } from './lib/errors';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Error handler
  fastify.setErrorHandler(handleError);

  // Register plugins
  await fastify.register(rateLimitPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  // Register routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(takesRoutes, { prefix: '/takes' });
  await fastify.register(feedRoutes);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Root endpoint - API info
  fastify.get('/', async () => {
    return {
      name: '12thMan API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: {
          register: 'POST /auth/register',
          me: 'GET /auth/me',
        },
        takes: {
          sync: 'POST /takes/sync',
          getById: 'GET /takes/:id',
        },
        feed: 'GET /feed',
      },
    };
  });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server listening on http://localhost:${env.PORT}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
