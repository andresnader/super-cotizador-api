import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';

const clientSchema = z.object({
  code: z.string(),
  name: z.string(),
  ruc: z.string(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (req) => {
    return prisma.client.findMany({
      where: { userId: req.user!.userId },
      orderBy: { name: 'asc' },
    });
  });

  fastify.post('/', async (req, reply) => {
    const body = clientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: { ...body, userId: req.user!.userId },
    });
    return client;
  });

  fastify.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = clientSchema.partial().parse(req.body);
    const client = await prisma.client.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!client) return reply.status(404).send({ error: 'Not found' });
    return prisma.client.update({ where: { id }, data: body });
  });

  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const client = await prisma.client.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!client) return reply.status(404).send({ error: 'Not found' });
    await prisma.client.delete({ where: { id } });
    return { success: true };
  });
}