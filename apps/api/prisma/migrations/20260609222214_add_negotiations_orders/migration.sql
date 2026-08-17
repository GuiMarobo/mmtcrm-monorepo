-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('ABERTA', 'GANHA', 'PERDIDA');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('EM_NEGOCIACAO', 'COMPRA_APROVADA', 'DESISTENCIA');

-- CreateTable
CREATE TABLE "negotiations" (
    "id" SERIAL NOT NULL,
    "client_id" TEXT NOT NULL,
    "vendedor_id" INTEGER,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'ABERTA',
    "total_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "negotiation_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'EM_NEGOCIACAO',
    "payment_method" TEXT,
    "total_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "negotiations_client_id_idx" ON "negotiations"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_negotiation_id_key" ON "orders"("negotiation_id");

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_negotiation_id_fkey" FOREIGN KEY ("negotiation_id") REFERENCES "negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
