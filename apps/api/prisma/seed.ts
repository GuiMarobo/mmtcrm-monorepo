import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = 'admin@mmturbana.com';

  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (existing) {
    console.log('Admin já existe:', email);
    return;
  }

  const password = await bcrypt.hash('admin12345', 10);
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      password,
      role: 'ADMIN',
      status: 'ATIVO',
    },
  });

  console.log('Admin criado com sucesso:', email);
}

// Spec 011 / RQ7: a linha da loja e as 12 taxas existem desde o primeiro boot,
// para a emissão de Orçamento nunca depender de o ADMIN ter aberto a tela.
// Idempotente: só cria o que falta e nunca sobrescreve o que o ADMIN mudou.
async function seedSettings() {
  await prisma.companySettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'MMT Urbana', defaultValidityDays: 7 },
  });

  const { count } = await prisma.installmentRate.createMany({
    data: Array.from({ length: 12 }, (_, index) => ({
      installments: index + 1,
      ratePercent: 0,
    })),
    skipDuplicates: true,
  });

  console.log(`Configurações garantidas (${count} taxa(s) criada(s))`);
}

async function main() {
  await seedAdmin();
  await seedSettings();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
