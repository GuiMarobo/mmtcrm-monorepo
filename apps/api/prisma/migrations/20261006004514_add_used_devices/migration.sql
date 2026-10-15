-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('AGUARDANDO', 'AVALIADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "DeviceCondition" AS ENUM ('EXCELENTE', 'BOM', 'REGULAR', 'RUIM');

-- CreateTable
CREATE TABLE "used_devices" (
    "id" SERIAL NOT NULL,
    "negotiation_id" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "imei" TEXT,
    "evaluation_status" "EvaluationStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "condition" "DeviceCondition",
    "estimated_value" DECIMAL(12,2),
    "report" TEXT,
    "icloud_unlocked" BOOLEAN,
    "evaluated_at" TIMESTAMP(3),
    "evaluator_id" INTEGER,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "used_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "used_devices_negotiation_id_idx" ON "used_devices"("negotiation_id");

-- CreateIndex
CREATE INDEX "used_devices_serial_number_idx" ON "used_devices"("serial_number");

-- CreateIndex
CREATE INDEX "used_devices_deleted_at_idx" ON "used_devices"("deleted_at");

-- AddForeignKey
ALTER TABLE "used_devices" ADD CONSTRAINT "used_devices_negotiation_id_fkey" FOREIGN KEY ("negotiation_id") REFERENCES "negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_devices" ADD CONSTRAINT "used_devices_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_devices" ADD CONSTRAINT "used_devices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
