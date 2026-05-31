import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-cotizador-secret-change-in-production';

export interface AuthUser {
  userId: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

// IMPORTANTE: debe ser async. Como hook onRequest de Fastify, una función
// síncrona de aridad < 3 que no llama a done() ni devuelve una promesa deja la
// petición colgada en el camino de éxito (Fastify queda esperando una señal que
// nunca llega). Al ser async siempre devuelve promesa → Fastify la await-ea y
// continúa hacia el handler.
export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}