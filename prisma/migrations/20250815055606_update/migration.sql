/*
  Warnings:

  - You are about to drop the `Incident` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaintenanceWindow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SlaPolicy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SlaWindow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Incident" DROP CONSTRAINT "Incident_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaintenanceWindow" DROP CONSTRAINT "MaintenanceWindow_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Service" DROP CONSTRAINT "Service_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SlaPolicy" DROP CONSTRAINT "SlaPolicy_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SlaWindow" DROP CONSTRAINT "SlaWindow_policyId_fkey";

-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "checkEveryS" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "lastResponseMs" INTEGER,
ADD COLUMN     "status" "public"."Status" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "sysDescr" TEXT,
ADD COLUMN     "sysName" TEXT;

-- DropTable
DROP TABLE "public"."Incident";

-- DropTable
DROP TABLE "public"."MaintenanceWindow";

-- DropTable
DROP TABLE "public"."SlaPolicy";

-- DropTable
DROP TABLE "public"."SlaWindow";

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
