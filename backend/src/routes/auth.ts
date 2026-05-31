import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../server.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

// Política de contraseña: mínimo 8, al menos una letra y un número.
const passwordPolicy = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: passwordPolicy,
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: passwordPolicy,
});

// Límites de fuerza bruta por IP.
const loginLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };
const registerLimit = { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } };
const changePwdLimit = { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } };

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', registerLimit, async (req, reply) => {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(400).send({ error: 'Este correo ya está registrado' });
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

  fastify.post('/login', loginLimit, async (req, reply) => {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  });

  fastify.get('/me', { onRequest: authMiddleware }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true },
    });
    return user;
  });

  // Cambio de contraseña: requiere sesión y verifica la contraseña actual.
  fastify.post(
    '/change-password',
    { onRequest: authMiddleware, ...changePwdLimit },
    async (req, reply) => {
      const body = changePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const valid = await bcrypt.compare(body.currentPassword, user.password);
      if (!valid) {
        return reply.status(401).send({ error: 'La contraseña actual es incorrecta' });
      }

      if (body.currentPassword === body.newPassword) {
        return reply.status(400).send({ error: 'La nueva contraseña debe ser distinta de la actual' });
      }

      const hashed = await bcrypt.hash(body.newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

      return { success: true };
    },
  );
}
