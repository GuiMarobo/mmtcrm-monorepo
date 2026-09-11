-- AlterTable: campo aditivo, marca quando o Pedido entrou na situação atual (spec 005 RN13/§8).
ALTER TABLE "orders" ADD COLUMN     "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: um Pedido nunca é editado, só muda de situação, então updated_at é o
-- instante fiel em que a linha entrou na situação atual. Nenhuma linha muda de status.
UPDATE "orders" SET "status_changed_at" = "updated_at";
