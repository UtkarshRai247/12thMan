import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Fixtures / providers (optional; server boots without them)
  API_FOOTBALL_KEY: z.string().optional(),
  ADMIN_TOKEN: z.string().optional(),
  ENABLE_FOTMOB: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  FOTMOB_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(30),
  FOTMOB_TTL_LIVE_SECONDS: z.coerce.number().int().positive().default(60),
  FOTMOB_TTL_FINISHED_SECONDS: z.coerce.number().int().positive().default(86400),
  ENABLE_WORKER: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  WORKER_BASE_URL: z.string().url().optional().default('http://localhost:6001'),
  WORKER_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error: unknown) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach((err: z.ZodIssue) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { env };
