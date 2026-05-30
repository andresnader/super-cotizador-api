import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';
import { Prisma, QuoteStatus } from '@prisma/client';

const itemSchema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  price: z.number(),
  quantity: z.number().default(1),
  category: z.string().optional(),
  cost: z.number().optional(),
});

const createQuoteSchema = z.object({
  number: z.string().optional(),
  issueDate: z.string(),
  validityDate: z.string(),
  clientId: z.string(),
  items: z.array(itemSchema),
  notes: z.string().optional(),
  status: z.enum(['Pendiente', 'Aceptada', 'Rechazada']).default('Pendiente'),
});

const updateQuoteSchema = z.object({
  number: z.string().optional(),
  issueDate: z.string().optional(),
  validityDate: z.string().optional(),
  clientId: z.string().optional(),
  items: z.array(itemSchema).optional(),
  notes: z.string().optional(),
  status: z.enum(['Pendiente', 'Aceptada', 'Rechazada']).optional(),
});

const STATUS_MAP: Record<string, QuoteStatus> = {
  'Pendiente': 'PENDIENTE',
  'Aceptada': 'ACEPTADA',
  'Rechazada': 'RECHAZADA',
};

const STATUS_REVERSE: Record<string, string> = {
  'PENDIENTE': 'Pendiente',
  'ACEPTADA': 'Aceptada',
  'RECHAZADA': 'Rechazada',
};

function toDbStatus(s: string): QuoteStatus {
  return STATUS_MAP[s] ?? 'PENDIENTE';
}

function fromDbStatus(s: QuoteStatus): string {
  return STATUS_REVERSE[s] ?? s;
}

function toApiQuote(q: any) {
  return {
    ...q,
    subtotal: Number(q.subtotal),
    iva: Number(q.iva),
    total: Number(q.total),
    status: q.status ? fromDbStatus(q.status) : undefined,
    items: (q.items || []).map((i: any) => ({
      ...i,
      price: Number(i.price),
      cost: Number(i.cost),
    })),
  };
}

export default async function quoteRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (req) => {
    const quotes = await prisma.quote.findMany({
      where: { userId: req.user!.userId },
      include: { client: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
    return quotes.map(toApiQuote);
  });

  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const quote = await prisma.quote.findFirst({
      where: { id, userId: req.user!.userId },
      include: { client: true, items: true },
    });
    if (!quote) return reply.status(404).send({ error: 'Not found' });
    return toApiQuote(quote);
  });

  fastify.post('/', async (req, reply) => {
    const body = createQuoteSchema.parse(req.body);

    const subtotal = body.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    const quote = await prisma.quote.create({
      data: {
        number: body.number || `QT-${Date.now()}`,
        issueDate: body.issueDate,
        validityDate: body.validityDate,
        subtotal: new Prisma.Decimal(subtotal),
        iva: new Prisma.Decimal(iva),
        total: new Prisma.Decimal(total),
        notes: body.notes,
        status: toDbStatus(body.status),
        clientId: body.clientId,
        userId: req.user!.userId,
        items: {
          create: body.items.map((i) => ({
            name: i.name,
            code: i.code,
            description: i.description,
            price: new Prisma.Decimal(i.price),
            quantity: i.quantity,
            category: i.category,
            cost: new Prisma.Decimal(i.cost || 0),
          })),
        },
      },
      include: { client: true, items: true },
    });

    return toApiQuote(quote);
  });

  fastify.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = updateQuoteSchema.parse(req.body);

    const existing = await prisma.quote.findFirst({
      where: { id, userId: req.user!.userId },
      include: { items: true },
    });
    if (!existing) return reply.status(404).send({ error: 'Not found' });

    let subtotal = Number(existing.subtotal);
    let iva = Number(existing.iva);
    let total = Number(existing.total);

    if (body.items) {
      subtotal = body.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      iva = subtotal * 0.15;
      total = subtotal + iva;
    }

    const updateData: any = {
      ...(body.number !== undefined && { number: body.number }),
      ...(body.issueDate !== undefined && { issueDate: body.issueDate }),
      ...(body.validityDate !== undefined && { validityDate: body.validityDate }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status !== undefined && { status: toDbStatus(body.status) }),
      subtotal: new Prisma.Decimal(subtotal),
      iva: new Prisma.Decimal(iva),
      total: new Prisma.Decimal(total),
    };

    if (body.items) {
      updateData.items = {
        deleteMany: {},
        create: body.items.map((i) => ({
          name: i.name,
          code: i.code,
          description: i.description,
          price: new Prisma.Decimal(i.price),
          quantity: i.quantity,
          category: i.category,
          cost: new Prisma.Decimal(i.cost || 0),
        })),
      };
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: { client: true, items: true },
    });

    return toApiQuote(updated);
  });

  fastify.patch('/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: 'Pendiente' | 'Aceptada' | 'Rechazada' };
    const quote = await prisma.quote.findFirst({
      where: { id, userId: req.user!.userId },
      include: { client: true, items: true },
    });
    if (!quote) return reply.status(404).send({ error: 'Not found' });
    const updated = await prisma.quote.update({
      where: { id },
      data: { status: toDbStatus(status) },
    });
    return { ...toApiQuote(updated), client: quote.client, items: quote.items };
  });

  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const quote = await prisma.quote.findFirst({ where: { id, userId: req.user!.userId } });
    if (!quote) return reply.status(404).send({ error: 'Not found' });
    await prisma.quote.delete({ where: { id } });
    return { success: true };
  });
}
