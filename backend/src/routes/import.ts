import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../server.js';
import { Prisma, QuoteStatus, ContractType, ContractPeriod, ContractStatus } from '@prisma/client';

// El backup viene con las formas del frontend (IDs de localStorage, enums en
// español/minúsculas y el cliente embebido dentro de cada cotización). Aquí lo
// normalizamos a Postgres y remapeamos los IDs de cliente a los nuevos cuid.

const importSchema = z.object({
  // 'replace' (default) borra los datos actuales del usuario antes de importar.
  // 'merge' agrega sin borrar.
  mode: z.enum(['replace', 'merge']).default('replace'),
  clients: z.array(z.any()).optional(),
  services: z.array(z.any()).optional(),
  quotes: z.array(z.any()).optional(),
  contracts: z.array(z.any()).optional(),
  settings: z.any().optional(),
});

const QUOTE_STATUS: Record<string, QuoteStatus> = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
};

function toQuoteStatus(s: any): QuoteStatus {
  return QUOTE_STATUS[String(s ?? '').toUpperCase()] ?? 'PENDIENTE';
}

function enumOrDefault<T extends string>(value: any, allowed: T[], fallback: T): T {
  const up = String(value ?? '').toUpperCase() as T;
  return allowed.includes(up) ? up : fallback;
}

function dec(value: any): Prisma.Decimal {
  const n = Number(value);
  return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
}

export default async function importRoutes(fastify: FastifyInstance) {
  fastify.post('/', async (req, reply) => {
    const userId = req.user!.userId;
    const body = importSchema.parse(req.body);

    const result = await prisma.$transaction(
      async (tx) => {
        if (body.mode === 'replace') {
          // Orden por las FK: cotizaciones y contratos referencian a cliente.
          // QuoteItem cae en cascada al borrar Quote.
          await tx.quote.deleteMany({ where: { userId } });
          await tx.recurringContract.deleteMany({ where: { userId } });
          await tx.client.deleteMany({ where: { userId } });
          await tx.service.deleteMany({ where: { userId } });
        }

        // oldClientId -> newClientId
        const clientMap = new Map<string, string>();
        const counts = { clients: 0, services: 0, quotes: 0, contracts: 0, settings: false };

        // --- Clientes ---
        for (const c of body.clients ?? []) {
          if (!c) continue;
          const created = await tx.client.create({
            data: {
              code: String(c.code ?? ''),
              name: String(c.name ?? 'Sin nombre'),
              ruc: String(c.ruc ?? ''),
              contact: c.contact ?? null,
              phone: c.phone ?? null,
              address: c.address ?? null,
              city: c.city ?? null,
              userId,
            },
          });
          if (c.id) clientMap.set(String(c.id), created.id);
          counts.clients++;
        }

        // Crea (o reutiliza) un cliente a partir del objeto embebido de una cotización.
        async function ensureClient(embedded: any): Promise<string | null> {
          if (!embedded) return null;
          const oldId = embedded.id ? String(embedded.id) : null;
          if (oldId && clientMap.has(oldId)) return clientMap.get(oldId)!;
          const created = await tx.client.create({
            data: {
              code: String(embedded.code ?? ''),
              name: String(embedded.name ?? 'Sin nombre'),
              ruc: String(embedded.ruc ?? ''),
              contact: embedded.contact ?? null,
              phone: embedded.phone ?? null,
              address: embedded.address ?? null,
              city: embedded.city ?? null,
              userId,
            },
          });
          if (oldId) clientMap.set(oldId, created.id);
          counts.clients++;
          return created.id;
        }

        // --- Servicios ---
        for (const s of body.services ?? []) {
          if (!s) continue;
          await tx.service.create({
            data: {
              code: String(s.code ?? ''),
              name: String(s.name ?? 'Sin nombre'),
              description: s.description ?? null,
              price: dec(s.price),
              cost: dec(s.cost),
              category: s.category ?? null,
              userId,
            },
          });
          counts.services++;
        }

        // --- Cotizaciones (con items, cliente remapeado) ---
        for (const q of body.quotes ?? []) {
          if (!q) continue;
          const clientId = await ensureClient(q.client);
          if (!clientId) continue; // sin cliente resoluble, se omite

          const items = Array.isArray(q.items) ? q.items : [];
          const subtotal =
            q.subtotal != null
              ? Number(q.subtotal)
              : items.reduce((acc: number, i: any) => acc + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0);
          const iva = q.iva != null ? Number(q.iva) : subtotal * 0.15;
          const total = q.total != null ? Number(q.total) : subtotal + iva;

          await tx.quote.create({
            data: {
              number: String(q.number ?? `QT-${Date.now()}-${counts.quotes}`),
              issueDate: String(q.issueDate ?? ''),
              validityDate: String(q.validityDate ?? ''),
              subtotal: dec(subtotal),
              iva: dec(iva),
              total: dec(total),
              notes: q.notes ?? null,
              status: toQuoteStatus(q.status),
              pdfUrl: q.pdfUrl ?? null,
              clientId,
              userId,
              items: {
                create: items.map((i: any) => ({
                  name: String(i.name ?? ''),
                  code: String(i.code ?? ''),
                  description: i.description ?? null,
                  price: dec(i.price),
                  quantity: Number(i.quantity ?? 1) || 1,
                  category: i.category ?? null,
                  cost: dec(i.cost),
                })),
              },
            },
          });
          counts.quotes++;
        }

        // --- Contratos recurrentes (cliente remapeado por clientId) ---
        for (const ct of body.contracts ?? []) {
          if (!ct) continue;
          let clientId: string | null = null;
          if (ct.clientId && clientMap.has(String(ct.clientId))) {
            clientId = clientMap.get(String(ct.clientId))!;
          } else if (ct.client) {
            clientId = await ensureClient(ct.client);
          }
          if (!clientId) continue; // sin cliente resoluble, se omite

          await tx.recurringContract.create({
            data: {
              serviceType: enumOrDefault(ct.serviceType, ['HOSTING', 'DOMAIN', 'MAINTENANCE', 'OTHER'], 'OTHER') as ContractType,
              serviceName: String(ct.serviceName ?? ''),
              description: ct.description ?? null,
              provider: ct.provider ?? null,
              amount: dec(ct.amount),
              period: enumOrDefault(ct.period, ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'], 'MONTHLY') as ContractPeriod,
              startDate: String(ct.startDate ?? ''),
              nextRenewalDate: String(ct.nextRenewalDate ?? ''),
              status: enumOrDefault(ct.status, ['ACTIVE', 'PAUSED', 'CANCELLED'], 'ACTIVE') as ContractStatus,
              autoRenew: ct.autoRenew !== undefined ? Boolean(ct.autoRenew) : true,
              notes: ct.notes ?? null,
              clientId,
              userId,
            },
          });
          counts.contracts++;
        }

        // --- Configuración de empresa (incluye logo) ---
        if (body.settings && typeof body.settings === 'object') {
          const s = body.settings;
          const data = {
            name: s.name ?? undefined,
            address: s.address ?? null,
            contact: s.contact ?? null,
            ruc: s.ruc ?? null,
            repName: s.repName ?? null,
            repTitle: s.repTitle ?? null,
            logo: s.logo ?? null,
            primaryColor: s.primaryColor ?? undefined,
            accentColor: s.accentColor ?? undefined,
            website: s.website ?? null,
            whatsapp: s.whatsapp ?? null,
            typography: s.typography ?? undefined,
          };
          // Quita undefined para no pisar defaults en create.
          const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
          await tx.companySettings.upsert({
            where: { userId },
            update: clean,
            create: { userId, ...clean },
          });
          counts.settings = true;
        }

        return counts;
      },
      { timeout: 60000, maxWait: 15000 },
    );

    return { success: true, imported: result };
  });
}
