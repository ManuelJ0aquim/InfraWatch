/*
  Warnings:

  - You are about to drop the `Metric` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Metric" DROP CONSTRAINT "Metric_serviceId_fkey";

-- DropTable
DROP TABLE "public"."Metric";
