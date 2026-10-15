-- CreateTable
CREATE TABLE "quotation_trade_ins" (
    "id" SERIAL NOT NULL,
    "quotation_id" INTEGER NOT NULL,
    "used_device_id" INTEGER,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "trade_in_value" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quotation_trade_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_trade_ins_quotation_id_idx" ON "quotation_trade_ins"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_trade_ins_used_device_id_idx" ON "quotation_trade_ins"("used_device_id");

-- AddForeignKey
ALTER TABLE "quotation_trade_ins" ADD CONSTRAINT "quotation_trade_ins_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_trade_ins" ADD CONSTRAINT "quotation_trade_ins_used_device_id_fkey" FOREIGN KEY ("used_device_id") REFERENCES "used_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
