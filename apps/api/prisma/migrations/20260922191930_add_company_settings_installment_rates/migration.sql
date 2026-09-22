-- CreateTable
CREATE TABLE "company_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "default_validity_days" INTEGER NOT NULL DEFAULT 7,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_rates" (
    "id" SERIAL NOT NULL,
    "installments" INTEGER NOT NULL,
    "rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installment_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "installment_rates_installments_key" ON "installment_rates"("installments");
