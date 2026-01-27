import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function rateLimitPlugin(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Global rate limit: 300 requests per minute per IP
  await fastify.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
  });
}
