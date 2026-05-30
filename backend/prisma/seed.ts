import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const backup = {
  clients: [
    { code: 'CLI-001', name: 'Cliente Demo', ruc: '1234567890001', contact: 'demo@example.com', phone: '0991234567', address: 'Guayaquil', city: 'Guayas' }
  ],
  services: [
    { code: 'WEB-001', name: 'Diseño Web Básico', description: 'Landing page de 5 secciones', price: 350, cost: 150, category: 'Diseño' },
    { code: 'WEB-002', name: 'SEO Básico', description: 'Optimización on-page', price: 200, cost: 80, category: 'Marketing' },
  ]
};

async function seed() {
  console.log('Seeding database...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@ameizin.com' },
    update: {},
    create: {
      email: 'demo@ameizin.com',
      password: '$2a$10$demo', // placeholder - change password after first login
      name: 'Demo Usuario',
    },
  });

  for (const client of backup.clients) {
    await prisma.client.upsert({
      where: { id: client.code },
      update: {},
      create: { ...client, userId: user.id },
    });
  }

  for (const service of backup.services) {
    await prisma.service.upsert({
      where: { id: service.code },
      update: {},
      create: {
        ...service,
        price: new Prisma.Decimal(service.price),
        cost: new Prisma.Decimal(service.cost),
        userId: user.id,
      },
    });
  }

  console.log('Seed completed!');
  await prisma.$disconnect();
}

import { Prisma } from '@prisma/client';
seed().catch((e) => { console.error(e); process.exit(1); });