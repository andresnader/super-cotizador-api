import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';
import { Prisma } from '@prisma/client';

const serviceSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  cost: z.number().optional(),
  category: z.string().optional(),
});

export default async function serviceRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (req) => {
    return prisma.service.findMany({
      where: { userId: req.user!.userId },
      orderBy: { name: 'asc' },
    });
  });

  fastify.post('/', async (req, reply) => {
    const body = serviceSchema.parse(req.body);
    const service = await prisma.service.create({
      data: {
        ...body,
        price: new Prisma.Decimal(body.price),
        cost: new Prisma.Decimal(body.cost || 0),
        userId: req.user!.userId,
      },
    });
    return service;
  });

  fastify.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!service) return reply.status(404).send({ error: 'Not found' });
    const data: any = { ...body };
    if (body.price !== undefined) data.price = new Prisma.Decimal(body.price);
    if (body.cost !== undefined) data.cost = new Prisma.Decimal(body.cost);
    return prisma.service.update({ where: { id }, data });
  });

  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const service = await prisma.service.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!service) return reply.status(404).send({ error: 'Not found' });
    await prisma.service.delete({ where: { id } });
    return { success: true };
  });
}