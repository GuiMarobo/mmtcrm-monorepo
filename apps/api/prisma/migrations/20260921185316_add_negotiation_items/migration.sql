-- CreateTable
CREATE TABLE "negotiation_items" (
    "id" SERIAL NOT NULL,
    "negotiation_id" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "negotiation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "negotiation_items_negotiation_id_idx" ON "negotiation_items"("negotiation_id");

-- CreateIndex
CREATE INDEX "negotiation_items_product_id_idx" ON "negotiation_items"("product_id");

-- CreateIndex
CREATE INDEX "negotiation_items_deleted_at_idx" ON "negotiation_items"("deleted_at");

-- Unicidade de produto por negociação entre os não excluídos (RI3): índice
-- parcial, como products_sku_unique_active e clients_cpf_unique_active.
CREATE UNIQUE INDEX "negotiation_items_negotiation_id_product_id_unique_active" ON "negotiation_items"("negotiation_id", "product_id") WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "negotiation_items" ADD CONSTRAINT "negotiation_items_negotiation_id_fkey" FOREIGN KEY ("negotiation_id") REFERENCES "negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_items" ADD CONSTRAINT "negotiation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
