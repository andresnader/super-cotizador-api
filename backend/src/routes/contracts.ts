import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';
import { Prisma } from '@prisma/client';

const contractSchema = z.object({
  clientId: z.string(),
  serviceType: z.enum(['HOSTING', 'DOMAIN', 'MAINTENANCE', 'OTHER']),
  serviceName: z.string(),
  description: z.string().optional(),
  provider: z.string().optional(),
  amount: z.number(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL']),
  startDate: z.string(),
  nextRenewalDate: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).default('ACTIVE'),
  autoRenew: z.boolean().default(true),
  notes: z.string().optional(),
});

export default async function contractRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (req) => {
    const contracts = await prisma.recurringContract.findMany({
      where: { userId: req.user!.userId },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
    return contracts.map((c) => ({ ...c, amount: Number(c.amount) }));
  });

  fastify.post('/', async (req, reply) => {
    const body = contractSchema.parse(req.body);
    const contract = await prisma.recurringContract.create({
      data: { ...body, userId: req.user!.userId },
      include: { client: true },
    });
    return { ...contract, amount: Number(contract.amount) };
  });

  fastify.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = contractSchema.partial().parse(req.body);
    const contract = await prisma.recurringContract.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!contract) return reply.status(404).send({ error: 'Not found' });
    const data: any = { ...body };
    if (body.amount !== undefined) data.amount = new Prisma.Decimal(body.amount);
    const updated = await prisma.recurringContract.update({
      where: { id },
      data,
      include: { client: true },
    });
    return { ...updated, amount: Number(updated.amount) };
  });

  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const contract = await prisma.recurringContract.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!contract) return reply.status(404).send({ error: 'Not found' });
    await prisma.recurringContract.delete({ where: { id } });
    return { success: true };
  });
}