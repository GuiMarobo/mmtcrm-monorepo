import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@mmturbana.com';

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
