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

export function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
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