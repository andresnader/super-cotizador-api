import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import serviceRoutes from './routes/services.js';
import quoteRoutes from './routes/quotes.js';
import contractRoutes from './routes/contracts.js';
import settingsRoutes from './routes/settings.js';
import importRoutes from './routes/import.js';
import { authMiddleware } from './middleware/auth.js';

export const prisma = new PrismaClient();

// bodyLimit alto (50 MB): el respaldo JSON puede incluir el logo en base64 y
// muchos registros, superando el default de Fastify (1 MB → 413 Content Too Large).
const fastify = Fastify({ logger: true, bodyLimit: 52_428_800 });

await fastify.register(cors, {
  origin: true,
  credentials: true,
});

// Rate limiting: solo aplica en rutas que declaran config.rateLimit (global: false).
await fastify.register(rateLimit, { global: false });

// Manejador de errores: ZodError → 400 con mensaje claro; resto → status apropiado.
fastify.setErrorHandler((error, req, reply) => {
  if (error instanceof ZodError) {
    const msg = error.errors.map((e) => e.message).join('; ') || 'Datos inválidos';
    return reply.status(400).send({ error: msg });
  }
  const statusCode = (error as { statusCode?: number }).statusCode;
  const status = typeof statusCode === 'number' && statusCode >= 400 ? statusCode : 500;
  if (status >= 500) req.log.error(error);
  return reply.status(status).send({
    error: status >= 500 ? 'Error interno del servidor' : error.message,
  });
});

fastify.register(authRoutes, { prefix: '/api/auth' });

fastify.register(async (app) => {
  app.addHook('onRequest', authMiddleware);
  app.register(clientRoutes, { prefix: '/api/clients' });
  app.register(serviceRoutes, { prefix: '/api/services' });
  app.register(quoteRoutes, { prefix: '/api/quotes' });
  app.register(contractRoutes, { prefix: '/api/contracts' });
  app.register(settingsRoutes, { prefix: '/api/settings' });
  app.register(importRoutes, { prefix: '/api/import' });
});

const start = async () => {
  try {
    await prisma.$connect();
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();