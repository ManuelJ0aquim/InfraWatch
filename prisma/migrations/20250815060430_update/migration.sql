/*
  Warnings:

  - You are about to drop the column `checkEveryS` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `lastResponseMs` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `sysDescr` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `sysName` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Service" DROP COLUMN "checkEveryS",
DROP COLUMN "lastResponseMs",
DROP COLUMN "status",
DROP COLUMN "sysDescr",
DROP COLUMN "sysName";
