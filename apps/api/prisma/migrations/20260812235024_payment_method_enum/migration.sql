/*
  Warnings:

  - The `payment_method` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "PaymentMethod";
