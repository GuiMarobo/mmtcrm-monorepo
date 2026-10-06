-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTUAL', 'VALOR');

-- AlterTable
ALTER TABLE "negotiation_items" ADD COLUMN     "discount_type" "DiscountType" NOT NULL DEFAULT 'VALOR',
ADD COLUMN     "discount_value" DECIMAL(12,2) NOT NULL DEFAULT 0;
