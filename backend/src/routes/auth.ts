import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../server.js';
import { signToken } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name || 'Usuario',
      },
    });

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  });

  fastify.post('/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  });

  fastify.get('/me', async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true },
    });
    return user;
  });
}