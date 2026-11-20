/*
  Warnings:

  - You are about to drop the column `type` on the `Item` table. All the data in the column will be lost.
  - Added the required column `kindId` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Item_companyId_type_idx";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "type",
ADD COLUMN     "kindId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ItemType";

-- CreateTable
CREATE TABLE "ItemKind" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tracksStock" BOOLEAN NOT NULL DEFAULT true,
    "canBuy" BOOLEAN NOT NULL DEFAULT false,
    "canSell" BOOLEAN NOT NULL DEFAULT false,
    "canBeInBom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemKind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemKind_companyId_isActive_idx" ON "ItemKind"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ItemKind_companyId_name_key" ON "ItemKind"("companyId", "name");

-- CreateIndex
CREATE INDEX "Unit_companyId_isActive_idx" ON "Unit"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_companyId_name_key" ON "Unit"("companyId", "name");

-- CreateIndex
CREATE INDEX "Item_companyId_kindId_idx" ON "Item"("companyId", "kindId");

-- AddForeignKey
ALTER TABLE "ItemKind" ADD CONSTRAINT "ItemKind_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_kindId_fkey" FOREIGN KEY ("kindId") REFERENCES "ItemKind"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
