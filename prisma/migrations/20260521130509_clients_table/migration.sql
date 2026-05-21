-- CreateEnum
CREATE TYPE "LeadQualification" AS ENUM ('NAO_QUALIFICADO', 'QUALIFICADO', 'ALTA_INTENCAO');

-- CreateEnum
CREATE TYPE "LeadOrigin" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'SITE', 'INDICACAO', 'OUTRO');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "address" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'LEAD',
    "qualification" "LeadQualification" NOT NULL DEFAULT 'NAO_QUALIFICADO',
    "origin" "LeadOrigin",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_contact_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_cpf_key" ON "clients"("cpf");
