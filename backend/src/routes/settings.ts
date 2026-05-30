import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';

const settingsSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  ruc: z.string().optional(),
  repName: z.string().optional(),
  repTitle: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  website: z.string().optional(),
  whatsapp: z.string().optional(),
  typography: z.string().optional(),
});

export default async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (req) => {
    const settings = await prisma.companySettings.findUnique({
      where: { userId: req.user!.userId },
    });
    return settings;
  });

  fastify.put('/', async (req, reply) => {
    const body = settingsSchema.parse(req.body);
    const settings = await prisma.companySettings.upsert({
      where: { userId: req.user!.userId },
      update: body,
      create: { userId: req.user!.userId, ...body },
    });
    return settings;
  });
}