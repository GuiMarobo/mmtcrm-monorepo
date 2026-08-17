-- CreateEnum
CREATE TYPE "ErasureSubject" AS ENUM ('CLIENTE', 'USUARIO');

-- CreateEnum
CREATE TYPE "ErasureAction" AS ENUM ('ELIMINADO', 'ANONIMIZADO');

-- DropIndex
DROP INDEX "clients_cpf_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "anonymized_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "negotiations" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "anonymized_at" TIMESTAMP(3),
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "data_erasure_logs" (
    "id" SERIAL NOT NULL,
    "subject" "ErasureSubject" NOT NULL,
    "subject_id" TEXT NOT NULL,
    "subject_label" TEXT NOT NULL,
    "action" "ErasureAction" NOT NULL,
    "reason" TEXT,
    "performed_by_id" INTEGER,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_erasure_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_erasure_logs_subject_subject_id_idx" ON "data_erasure_logs"("subject", "subject_id");

-- CreateIndex
CREATE INDEX "clients_cpf_idx" ON "clients"("cpf");

-- CreateIndex
CREATE INDEX "clients_deleted_at_idx" ON "clients"("deleted_at");

-- CreateIndex
CREATE INDEX "negotiations_deleted_at_idx" ON "negotiations"("deleted_at");

-- CreateIndex
CREATE INDEX "orders_deleted_at_idx" ON "orders"("deleted_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- AddForeignKey
ALTER TABLE "data_erasure_logs" ADD CONSTRAINT "data_erasure_logs_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indices unicos parciais: um registro excluido logicamente nao pode bloquear um novo cadastro
CREATE UNIQUE INDEX "clients_cpf_unique_active" ON "clients"("cpf") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "users_email_unique_active" ON "users"("email") WHERE "deleted_at" IS NULL;
