/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PrismaService } from '../src/prisma/prisma.service';

type Model = Record<string, jest.Mock>;

const model = (): Model => ({
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
});

export interface MockPrisma {
  order: Model;
  product: Model;
  stockMovement: Model;
  negotiation: Model;
  client: Model;
  user: Model;
  dataErasureLog: Model;
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
}

// $transaction recebe ou uma função (roda com o próprio mock como `tx`) ou um
// array de promessas (Promise.all) — cobre os dois usos do Prisma no projeto.
export function createMockPrisma(): MockPrisma {
  const prisma = {
    order: model(),
    product: model(),
    stockMovement: model(),
    negotiation: model(),
    client: model(),
    user: model(),
    dataErasureLog: model(),
    $queryRaw: jest.fn(),
  } as unknown as MockPrisma;

  prisma.$transaction = jest.fn((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: MockPrisma) => unknown)(prisma)
      : Promise.all(arg as unknown[]),
  );

  return prisma;
}

export const asPrismaService = (mock: MockPrisma): PrismaService =>
  mock as unknown as PrismaService;

// Lê, já tipado, um argumento de uma chamada registrada pelo mock — evita o
// `any` propagado por `mock.calls[i][j]` nos specs.
export const callArg = <T>(mock: jest.Mock, call = 0, arg = 0): T =>
  mock.mock.calls[call][arg] as T;
